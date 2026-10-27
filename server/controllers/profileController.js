const { getSafeErrorMessage, logError } = require("../middleware/errorMiddleware");

const {
    getProfile,
    createProfile,
    updateProfile
} = require("../services/profileService");

const getUserProfile = async (req, res) => {
    try {
        const userId = req.user.userId;

        const profile = await getProfile(userId);

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: "Profile not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Profile fetched successfully",
            data: profile
        });
    } catch (error) {
        logError("Failed to fetch profile", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch profile",
            error: getSafeErrorMessage(error, "Failed to fetch profile")
        });
    }
};

const createUserProfile = async (req, res) => {
    try {
        const userId = req.user.userId;

        const profile = await createProfile(
            userId,
            req.body
        );

        res.status(201).json({
            success: true,
            message: "Profile created successfully",
            data: profile
        });
    } catch (error) {
        logError("Failed to create profile", error);
        res.status(400).json({
            success: false,
            message: getSafeErrorMessage(error, "Failed to create profile", ["Profile already exists"])
        });
    }
};

const updateUserProfile = async (req, res) => {
    try {
        const userId = req.user.userId;

        const profile = await updateProfile(
            userId,
            req.body
        );

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: "Profile not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: profile
        });
    } catch (error) {
        logError("Failed to update profile", error);
        res.status(400).json({
            success: false,
            message: getSafeErrorMessage(error, "Failed to update profile")
        });
    }
};

module.exports = {
    getUserProfile,
    createUserProfile,
    updateUserProfile
};