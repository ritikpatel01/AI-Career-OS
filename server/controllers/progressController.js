const {
    getProgress,
    createProgress,
    updateProgress
} = require("../services/progressService");
const { getDashboardProgress } = require("../services/dashboardProgressService");

const getDashboardSummary = async (req, res) => {
    res.set("Cache-Control", "private, no-store");
    try {
        const data = await getDashboardProgress(req.user.userId);
        return res.status(200).json({ success: true, data });
    } catch {
        return res.status(503).json({ success: false, message: "Dashboard progress is unavailable. Please retry; displayed progress indicators are not current results." });
    }
};

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
            error: "Failed to fetch progress"
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
            error: "Failed to create progress"
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
            error: "Failed to update progress"
        });
    }
};

module.exports = {
    getDashboardSummary,
    getAllProgress,
    createNewProgress,
    updateProgressData
};
