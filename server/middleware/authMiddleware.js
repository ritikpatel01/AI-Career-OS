const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: "Authentication token is required" });
    }
    let decoded;
    try {
        decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET, { algorithms: ["HS256"] });
        if (!mongoose.isObjectIdOrHexString(decoded.userId) || (decoded.ver !== undefined && (!Number.isSafeInteger(decoded.ver) || decoded.ver < 0))) throw new Error("Invalid claims");
    } catch {
        return res.status(401).json({ success: false, message: "Invalid or expired authentication token" });
    }
    try {
        if (mongoose.connection.readyState !== 1) throw new Error("Not connected");
        const user = await User.findById(decoded.userId).read("primary").select("authVersion").lean();
        if (!user || (decoded.ver ?? 0) !== (user.authVersion ?? 0)) {
            return res.status(401).json({ success: false, message: "Invalid or expired authentication token" });
        }
    } catch {
        return res.status(503).json({ success: false, message: "Authentication is temporarily unavailable" });
    }
    req.user = decoded;
    return next();
};
module.exports = authMiddleware;
