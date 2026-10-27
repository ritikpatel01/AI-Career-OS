const Notification = require("../models/Notification");

const {
    getNotifications,
    markNotificationAsRead
} = require("../services/notificationService");


// GET ALL NOTIFICATIONS
const getAllNotifications = async (req, res) => {
    try {
        const userId = req.user.userId;

        const notifications = await getNotifications(userId);

        res.status(200).json({
            success: true,
            message: "Notifications fetched successfully",
            data: notifications
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch notifications",
            error: error.message
        });
    }
};


// CREATE NOTIFICATION
const createNotification = async (req, res) => {
    try {
        const userId = req.user.userId;

        const {
            title,
            message,
            type,
            link
        } = req.body;

        const notification = await Notification.create({
            user: userId,
            title,
            message,
            type: type || "general",
            link
        });

        res.status(201).json({
            success: true,
            message: "Notification created successfully",
            data: notification
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to create notification",
            error: error.message
        });
    }
};


// MARK NOTIFICATION AS READ
const markAsRead = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        const notification = await markNotificationAsRead(
            userId,
            id
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Notification marked as read",
            data: notification
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to mark notification as read",
            error: error.message
        });
    }
};


module.exports = {
    getAllNotifications,
    createNotification,
    markAsRead
};