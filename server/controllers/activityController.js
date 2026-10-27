const {
    getActivities,
    createActivity,
    deleteActivity
} = require("../services/activityService");
const mongoose = require("mongoose");

const removeActivity = async (req, res) => {
    if (!mongoose.isObjectIdOrHexString(req.params.id)) {
        return res.status(400).json({ success: false, message: "Invalid activity ID" });
    }
    try {
        const activity = await deleteActivity(req.user.userId, req.params.id);
        if (!activity) {
            return res.status(404).json({ success: false, message: "Activity not found" });
        }
        return res.status(200).json({ success: true, message: "Activity deleted successfully" });
    } catch {
        console.error("Delete activity failed");
        return res.status(500).json({ success: false, message: "Failed to delete activity" });
    }
};

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
            error: "Failed to fetch activities"
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
            error: "Failed to create activity"
        });
    }
};

module.exports = {
    getAllActivities,
    createNewActivity,
    removeActivity
};
