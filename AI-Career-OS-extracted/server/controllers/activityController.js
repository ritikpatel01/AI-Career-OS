const {
    getActivities,
    createActivity
} = require("../services/activityService");

const getAllActivities = async (req, res) => {
    try {
        const userId = req.user.userId;

        const activities = await getActivities(userId);

        res.status(200).json({
            success: true,
            message: "Activities fetched successfully",
            data: activities
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch activities",
            error: error.message
        });
    }
};

const createNewActivity = async (req, res) => {
    try {
        const userId = req.user.userId;

        const activity = await createActivity(
            userId,
            req.body
        );

        res.status(201).json({
            success: true,
            message: "Activity created successfully",
            data: activity
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to create activity",
            error: error.message
        });
    }
};

module.exports = {
    getAllActivities,
    createNewActivity
};