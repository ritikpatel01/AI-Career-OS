
const mongoose = require("mongoose");
const User = require("../models/User");

// ==========================================
// GET ALL USERS
// GET /api/admin/users
// ==========================================
const getAllUsers = async (req, res) => {
    try {
        const parsedPage = Number.parseInt(req.query.page, 10);
        const parsedLimit = Number.parseInt(req.query.limit, 10);

        const page = Number.isFinite(parsedPage)
            ? Math.max(1, parsedPage)
            : 1;

        const limit = Number.isFinite(parsedLimit)
            ? Math.min(100, Math.max(1, parsedLimit))
            : 25;

        const search = String(req.query.search || "").trim();
        const filter = {};

        if (search) {
            const escapedSearch = search.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );

            filter.$or = [
                {
                    name: {
                        $regex: escapedSearch,
                        $options: "i"
                    }
                },
                {
                    email: {
                        $regex: escapedSearch,
                        $options: "i"
                    }
                }
            ];
        }

        const [users, total] = await Promise.all([
            User.find(filter)
                .select("_id name email role createdAt")
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),

            User.countDocuments(filter)
        ]);

        return res.status(200).json({
            success: true,
            message: "Users fetched successfully",
            data: users,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Get users error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch users."
        });
    }
};

// ==========================================
// CHANGE USER ROLE
// PATCH /api/admin/users/:userId/role
// ==========================================
const changeUserRole = async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body || {};

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID."
            });
        }

        if (!["user", "admin"].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Role must be user or admin."
            });
        }

        // Prevent changing your own role through this endpoint.
        if (req.adminUser._id.toString() === userId) {
            return res.status(400).json({
                success: false,
                message: "You cannot change your own role here."
            });
        }

        const targetUser = await User.findById(userId);

        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        if (targetUser.role === role) {
            return res.status(200).json({
                success: true,
                message: `User already has the ${role} role.`,
                data: {
                    _id: targetUser._id,
                    name: targetUser.name,
                    email: targetUser.email,
                    role: targetUser.role
                }
            });
        }

        // Do not demote the last remaining administrator.
        if (targetUser.role === "admin" && role === "user") {
            const adminCount = await User.countDocuments({
                role: "admin"
            });

            if (adminCount <= 1) {
                return res.status(409).json({
                    success: false,
                    message: "You cannot demote the last administrator."
                });
            }
        }

        targetUser.role = role;
        await targetUser.save();

        return res.status(200).json({
            success: true,
            message: `User role changed to ${role} successfully.`,
            data: {
                _id: targetUser._id,
                name: targetUser.name,
                email: targetUser.email,
                role: targetUser.role
            }
        });
    } catch (error) {
        console.error("Change user role error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to change user role."
        });
    }
};

// ==========================================
// EXPORT CONTROLLER FUNCTIONS
// ==========================================
module.exports = {
    getAllUsers,
    changeUserRole
};
