const {
    getDSAProgress,
    createDSATopic,
    updateDSATopic
} = require("../services/dsaService");


// ==========================================
// GET ALL DSA TOPICS
// ==========================================

const getProgress = async (req, res) => {
    try {
        const userId = req.user.userId;

        const result = await getDSAProgress(userId);

        res.status(200).json({
            success: true,
            message: "DSA progress fetched successfully",
            data: result
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch DSA progress",
            error: error.message
        });
    }
};


// ==========================================
// CREATE DSA TOPIC
// ==========================================

const createTopic = async (req, res) => {
    try {
        const userId = req.user.userId;

        const result = await createDSATopic(
            userId,
            req.body
        );

        res.status(201).json({
            success: true,
            message: "DSA topic created successfully",
            data: result
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to create DSA topic",
            error: error.message
        });
    }
};


// ==========================================
// UPDATE DSA TOPIC
// ==========================================

const updateTopic = async (req, res) => {
    try {
        const userId = req.user.userId;

        const result = await updateDSATopic(
            userId,
            req.params.id,
            req.body
        );

        res.status(200).json({
            success: true,
            message: "DSA topic updated successfully",
            data: result
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to update DSA topic",
            error: error.message
        });
    }
};


module.exports = {
    getProgress,
    createTopic,
    updateTopic
};