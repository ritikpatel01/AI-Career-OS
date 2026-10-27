const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/User");
const PasswordReset = require("../models/PasswordReset");
const { sendPasswordResetCode } = require("../services/emailService");

const hashValue = value => crypto.createHash("sha256").update(value).digest("hex");
const lifetime = 10 * 60 * 1000;
const genericSuccess = { success: true, message: "If an account exists for this email, a verification code has been sent." };
const invalidSession = { success: false, message: "This password reset session is invalid or expired." };
const noStore = res => res.set("Cache-Control", "no-store");

const forgotPassword = async (req, res) => {
    noStore(res);
    const email = String(req.body?.email || "").trim().toLowerCase();
    if (!email) return res.status(400).json({ success: false, message: "Email address is required." });
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(200).json(genericSuccess);
        await PasswordReset.deleteMany({ user: user._id, usedAt: null });
        const code = crypto.randomInt(100000, 1000000).toString();
        const request = await PasswordReset.create({ user: user._id, email, codeHash: hashValue(code), expiresAt: new Date(Date.now() + lifetime) });
        try {
            await sendPasswordResetCode(email, code);
        } catch {
            // Do not expose provider errors, recipients, codes, or account existence.
            console.error("Password recovery delivery failed");
            try { await PasswordReset.deleteOne({ _id: request._id }); }
            catch { console.error("Password recovery cleanup failed"); }
        }
        return res.status(200).json(genericSuccess);
    } catch {
        console.error("Password recovery request failed");
        // Even account-dependent storage failures must not become an existence oracle.
        return res.status(200).json(genericSuccess);
    }
};

const verifyResetCode = async (req, res) => {
    noStore(res);
    const email = String(req.body?.email || "").trim().toLowerCase();
    const code = String(req.body?.code || "").trim();
    if (!email || !code) return res.status(400).json({ success: false, message: "Email and verification code are required." });
    try {
        const active = { email, usedAt: null, verifiedAt: null, expiresAt: { $gt: new Date() } };
        // Reserve each attempt atomically, including concurrent incorrect submissions.
        const request = await PasswordReset.findOneAndUpdate(
            { ...active, attempts: { $lt: 5 } },
            { $inc: { attempts: 1 } },
            { new: true, sort: { createdAt: -1 } }
        );
        if (!request) {
            const exhausted = await PasswordReset.exists({ ...active, attempts: { $gte: 5 } });
            return res.status(exhausted ? 429 : 400).json({ success: false, message: exhausted ? "Too many incorrect attempts. Please request a new code." : "The verification code is invalid or has expired." });
        }
        const expected = Buffer.from(request.codeHash, "hex");
        const submitted = Buffer.from(hashValue(code), "hex");
        if (expected.length !== submitted.length || !crypto.timingSafeEqual(expected, submitted)) {
            return res.status(400).json({ success: false, message: "Incorrect verification code." });
        }
        const resetToken = crypto.randomBytes(32).toString("hex");
        const now = new Date();
        const expiresAt = new Date(now.getTime() + lifetime);
        // Both application deadlines and the existing TTL index now share one deadline.
        const verified = await PasswordReset.findOneAndUpdate(
            { _id: request._id, usedAt: null, verifiedAt: null, expiresAt: { $gt: now } },
            { $set: { verifiedAt: now, resetTokenHash: hashValue(resetToken), resetTokenExpiresAt: expiresAt, expiresAt } },
            { new: true }
        );
        if (!verified) return res.status(400).json(invalidSession);
        return res.status(200).json({ success: true, message: "Verification successful.", data: { email, resetToken } });
    } catch {
        console.error("Password recovery verification failed");
        return res.status(500).json({ success: false, message: "Unable to verify the code." });
    }
};

const resetPassword = async (req, res) => {
    noStore(res);
    const email = String(req.body?.email || "").trim().toLowerCase();
    const resetToken = String(req.body?.resetToken || "").trim();
    const newPassword = String(req.body?.newPassword || "");
    if (!email || !resetToken || !newPassword) return res.status(400).json({ success: false, message: "All password reset fields are required." });
    if (newPassword.length < 8) return res.status(400).json({ success: false, message: "New password must be at least 8 characters long." });
    try {
        // Hash outside the transaction to keep its lock/snapshot lifetime short.
        const passwordHash = await bcrypt.hash(newPassword, 12);
        const changed = await mongoose.connection.transaction(async session => {
            const now = new Date();
            const request = await PasswordReset.findOneAndUpdate(
                {
                    email, verifiedAt: { $ne: null }, usedAt: null,
                    resetTokenHash: hashValue(resetToken),
                    resetTokenExpiresAt: { $gt: now }, expiresAt: { $gt: now },
                },
                { $set: { usedAt: now } },
                { new: true, session }
            );
            if (!request) return false;
            const updated = await User.updateOne(
                { _id: request.user },
                { $set: { password: passwordHash }, $inc: { authVersion: 1 } },
                { session }
            );
            if (updated.matchedCount !== 1) throw new Error("Reset account unavailable");
            return true;
        }, { readPreference: "primary", writeConcern: { w: "majority" } });
        if (!changed) return res.status(400).json(invalidSession);
        return res.status(200).json({ success: true, message: "Password reset successfully." });
    } catch {
        // Transaction rollback leaves the token usable if the password write fails.
        console.error("Password recovery update failed");
        return res.status(500).json({ success: false, message: "Unable to reset your password." });
    }
};

module.exports = { forgotPassword, verifyResetCode, resetPassword };
