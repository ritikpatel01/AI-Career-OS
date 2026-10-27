const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const PasswordReset = require(
    "../models/PasswordReset"
);

const {
    sendPasswordResetCode
} = require(
    "../services/emailService"
);


/* ============================================================
   HELPERS
   ============================================================ */

const hashValue = (value) => {
    return crypto
        .createHash("sha256")
        .update(value)
        .digest("hex");
};


const generateCode = () => {
    return crypto
        .randomInt(100000, 1000000)
        .toString();
};


/* ============================================================
   FORGOT PASSWORD
   POST /api/auth/forgot-password
   ============================================================ */

const forgotPassword = async (
    req,
    res
) => {

    try {

        const email =
            String(req.body.email || "")
                .trim()
                .toLowerCase();


        if (!email) {

            return res.status(400).json({
                success: false,
                message:
                    "Email address is required."
            });
        }


        const user =
            await User.findOne({
                email
            });


        /*
         IMPORTANT:
         Do not reveal whether an account exists.
        */

        if (!user) {

            return res.status(200).json({
                success: true,
                message:
                    "If an account exists for this email, a verification code has been sent."
            });
        }


        /*
         Remove previous active reset requests.
        */

        await PasswordReset.deleteMany({
            user: user._id,
            usedAt: null
        });


        const code =
            generateCode();


        const codeHash =
            hashValue(code);


        const expiresAt =
            new Date(
                Date.now() +
                10 * 60 * 1000
            );


        await PasswordReset.create({

            user: user._id,

            email,

            codeHash,

            expiresAt

        });


        await sendPasswordResetCode(
            email,
            code
        );


        return res.status(200).json({

            success: true,

            message:
                "If an account exists for this email, a verification code has been sent."

        });

    } catch (error) {

        console.error(
            "Forgot Password Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to send the password reset code."
        });
    }
};


/* ============================================================
   VERIFY CODE
   POST /api/auth/verify-reset-code
   ============================================================ */

const verifyResetCode = async (
    req,
    res
) => {

    try {

        const email =
            String(req.body.email || "")
                .trim()
                .toLowerCase();

        const code =
            String(req.body.code || "")
                .trim();


        if (!email || !code) {

            return res.status(400).json({

                success: false,

                message:
                    "Email and verification code are required."
            });
        }


        const resetRequest =
            await PasswordReset.findOne({
                email,
                usedAt: null,
                expiresAt: {
                    $gt: new Date()
                }
            }).sort({
                createdAt: -1
            });


        if (!resetRequest) {

            return res.status(400).json({

                success: false,

                message:
                    "The verification code is invalid or has expired."
            });
        }


        if (resetRequest.attempts >= 5) {

            await resetRequest.deleteOne();

            return res.status(429).json({

                success: false,

                message:
                    "Too many incorrect attempts. Please request a new code."
            });
        }


        const submittedHash =
            hashValue(code);


        if (
            submittedHash !==
            resetRequest.codeHash
        ) {

            resetRequest.attempts += 1;

            await resetRequest.save();

            return res.status(400).json({

                success: false,

                message:
                    "Incorrect verification code."
            });
        }


        /*
         Create a temporary one-time reset token.
        */

        const resetToken =
            crypto.randomBytes(32).toString("hex");


        resetRequest.verifiedAt =
            new Date();

        resetRequest.resetTokenHash =
            hashValue(resetToken);

        resetRequest.resetTokenExpiresAt =
            new Date(
                Date.now() +
                10 * 60 * 1000
            );

        await resetRequest.save();


        return res.status(200).json({

            success: true,

            message:
                "Verification successful.",

            data: {
                email,
                resetToken
            }
        });

    } catch (error) {

        console.error(
            "Verify Reset Code Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to verify the code."
        });
    }
};


/* ============================================================
   RESET PASSWORD
   POST /api/auth/reset-password
   ============================================================ */

const resetPassword = async (
    req,
    res
) => {

    try {

        const email =
            String(req.body.email || "")
                .trim()
                .toLowerCase();

        const resetToken =
            String(
                req.body.resetToken || ""
            ).trim();

        const newPassword =
            String(
                req.body.newPassword || ""
            );


        if (
            !email ||
            !resetToken ||
            !newPassword
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "All password reset fields are required."
            });
        }


        if (newPassword.length < 8) {

            return res.status(400).json({

                success: false,

                message:
                    "New password must be at least 8 characters long."
            });
        }


        const resetRequest =
            await PasswordReset.findOne({
                email,
                verifiedAt: {
                    $ne: null
                },
                usedAt: null,
                resetTokenHash:
                    hashValue(resetToken),

                resetTokenExpiresAt: {
                    $gt: new Date()
                }
            });


        if (!resetRequest) {

            return res.status(400).json({

                success: false,

                message:
                    "This password reset session is invalid or expired."
            });
        }


        const user =
            await User.findById(
                resetRequest.user
            );


        if (!user) {

            return res.status(404).json({

                success: false,

                message:
                    "Account not found."
            });
        }


        /*
         Hash manually and update directly.
         This avoids accidentally hashing twice if
         the User schema has a save hook.
        */

        const passwordHash =
            await bcrypt.hash(
                newPassword,
                12
            );


        await User.updateOne(
            {
                _id: user._id
            },
            {
                $set: {
                    password:
                        passwordHash
                }
            }
        );


        resetRequest.usedAt =
            new Date();

        await resetRequest.save();


        return res.status(200).json({

            success: true,

            message:
                "Password reset successfully."
        });

    } catch (error) {

        console.error(
            "Reset Password Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to reset your password."
        });
    }
};


module.exports = {
    forgotPassword,
    verifyResetCode,
    resetPassword
};