const Notification = require("../models/Notification");

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
    getNotifications,
    markNotificationAsRead
};
