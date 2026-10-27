const Notification = require("../models/Notification");

const createNotification = async (userId, data) => {
    const { title, message, type = "general", link } = data;

    return await Notification.create({
        user: userId,
        title,
        message,
        type,
        link
    });
};

const getNotifications = async (userId) => {
    return await Notification.find({
        user: userId
    }).sort({
        createdAt: -1
    });
};

const markNotificationAsRead = async (userId, notificationId) => {
    return await Notification.findOneAndUpdate(
        {
            _id: notificationId,
            user: userId
        },
        {
            isRead: true
        },
        {
            new: true
        }
    );
};

module.exports = {
    createNotification,
    getNotifications,
    markNotificationAsRead
};
