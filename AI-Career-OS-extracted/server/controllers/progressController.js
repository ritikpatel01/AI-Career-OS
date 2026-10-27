const {
    getProgress,
    createProgress,
    updateProgress
} = require("../services/progressService");

const getAllProgress = async (req, res) => {
    try {
        const userId = req.user.userId;

        const progress = await getProgress(userId);

        res.status(200).json({
            success: true,
            message: "Progress fetched successfully",
            data: progress
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch progress",
            error: error.message
        });
    }
};

const createNewProgress = async (req, res) => {
    try {
        const userId = req.user.userId;

        const progress = await createProgress(
            userId,
            req.body
        );

        res.status(201).json({
            success: true,
            message: "Progress created successfully",
            data: progress
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to create progress",
            error: error.message
        });
    }
};

const updateProgressData = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        const progress = await updateProgress(
            userId,
            id,
            req.body
        );

        if (!progress) {
            return res.status(404).json({
                success: false,
                message: "Progress not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Progress updated successfully",
            data: progress
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to update progress",
            error: error.message
        });
    }
};

module.exports = {
    getAllProgress,
    createNewProgress,
    updateProgressData
};