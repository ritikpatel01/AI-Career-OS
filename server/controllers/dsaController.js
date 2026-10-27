const { getSafeErrorMessage, logError } = require("../middleware/errorMiddleware");

const {
    getDSAProgress,
    getReadOnlyDSATopics,
    createDSATopic,
    updateDSATopic
} = require("../services/dsaService");


// ==========================================
// GET ALL DSA TOPICS
// ==========================================

const getProgress = async (req, res) => {
    try {
        const userId = req.user.userId;

        const result = req.query?.readOnly === "true"
            ? { topics: await getReadOnlyDSATopics(userId) }
            : await getDSAProgress(userId);

        res.status(200).json({
            success: true,
            message: "DSA progress fetched successfully",
            data: result
        });

    } catch (error) {
        logError("Failed to fetch DSA progress", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch DSA progress",
            error: getSafeErrorMessage(error, "Failed to fetch DSA progress")
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
        logError("Failed to create DSA topic", error);
        res.status(400).json({
            success: false,
            message: "Failed to create DSA topic",
            error: getSafeErrorMessage(error, "Failed to create DSA topic", ["This topic is not part of the DSA roadmap.", "This DSA topic already exists."])
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
        logError("Failed to update DSA topic", error);
        res.status(400).json({
            success: false,
            message: "Failed to update DSA topic",
            error: getSafeErrorMessage(error, "Failed to update DSA topic", ["DSA topic not found."])
        });
    }
};


module.exports = {
    getProgress,
    createTopic,
    updateTopic
};
