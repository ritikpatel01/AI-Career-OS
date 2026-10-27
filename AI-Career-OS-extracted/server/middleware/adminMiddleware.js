const mongoose = require("mongoose");
const User = require("../models/User");

const adminMiddleware = async (req, res, next) => {
    try {
        const userId = req.user?.userId;

        if (
            !userId ||
            !mongoose.Types.ObjectId.isValid(userId)
        ) {
            return res.status(401).json({
                success: false,
                message: "Authentication required."
            });
        }

        // Check the database role, not a role supplied by the client.
        const user = await User.findById(userId).select("role");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found."
            });
        }

        if (user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Access denied. Admin privileges required."
            });
        }

        req.adminUser = user;

        next();
    } catch (error) {
        console.error("Admin authorization error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to verify admin permissions."
        });
    }
};

module.exports = adminMiddleware;