const {
    getRoadmaps,
    createRoadmap,
    getRoadmapById,
    updateRoadmap,
    deleteRoadmap
} = require("../services/roadmapService");

const logRoadmapError = (operation, error) => {
    console.error(`[Roadmap] ${operation} failed`, {
        name: error?.name,
        code: error?.code
    });
};

const getAllRoadmaps = async (req, res) => {
    try {
        const userId = req.user.userId;

        const roadmaps = await getRoadmaps(userId);

        res.status(200).json({
            success: true,
            message: "Roadmaps fetched successfully",
            data: roadmaps
        });
    } catch (error) {
        logRoadmapError("fetch list", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch roadmaps"
        });
    }
};

const createNewRoadmap = async (req, res) => {
    try {
        const userId = req.user.userId;

        const roadmap = await createRoadmap(
            userId,
            req.body
        );

        res.status(201).json({
            success: true,
            message: "Roadmap created successfully",
            data: roadmap
        });
    } catch (error) {
        logRoadmapError("create", error);
        res.status(400).json({
            success: false,
            message: "Failed to create roadmap"
        });
    }
};

const getRoadmap = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        const roadmap = await getRoadmapById(
            userId,
            id
        );

        if (!roadmap) {
            return res.status(404).json({
                success: false,
                message: "Roadmap not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Roadmap fetched successfully",
            data: roadmap
        });
    } catch (error) {
        logRoadmapError("fetch record", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch roadmap"
        });
    }
};

const updateRoadmapData = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        const roadmap = await updateRoadmap(
            userId,
            id,
            req.body
        );

        if (!roadmap) {
            return res.status(404).json({
                success: false,
                message: "Roadmap not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Roadmap updated successfully",
            data: roadmap
        });
    } catch (error) {
        logRoadmapError("update", error);
        res.status(400).json({
            success: false,
            message: "Failed to update roadmap"
        });
    }
};

const removeRoadmap = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        const roadmap = await deleteRoadmap(
            userId,
            id
        );

        if (!roadmap) {
            return res.status(404).json({
                success: false,
                message: "Roadmap not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Roadmap deleted successfully"
        });
    } catch (error) {
        logRoadmapError("delete", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete roadmap"
        });
    }
};

module.exports = {
    getAllRoadmaps,
    createNewRoadmap,
    getRoadmap,
    updateRoadmapData,
    removeRoadmap
};
