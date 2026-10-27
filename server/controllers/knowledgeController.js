const {
    getKnowledgeItems,
    getKnowledgeItemById
} = require("../services/knowledgeService");

const getItems = async (req, res) => {
    try {
        const userId = req.user.userId;

        const items = await getKnowledgeItems(
            userId,
            req.query
        );

        res.status(200).json({
            success: true,
            message: "Knowledge items fetched successfully",
            data: items
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch knowledge items",
            error: "Failed to fetch knowledge items"
        });
    }
};

const getItemById = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        const item = await getKnowledgeItemById(
            userId,
            id
        );

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Knowledge item not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Knowledge item fetched successfully",
            data: item
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch knowledge item",
            error: "Failed to fetch knowledge item"
        });
    }
};

module.exports = {
    getItems,
    getItemById
};