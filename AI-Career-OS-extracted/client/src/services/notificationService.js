import api from "./api";

export const getNotifications = async () => {
    return await api("/notifications");
};

export const createNotification = async (notificationData) => {
    return await api("/notifications", {
        method: "POST",
        body: JSON.stringify(notificationData)
    });
};

export const markNotificationAsRead = async (id) => {
    return await api(`/notifications/${id}/read`, {
        method: "PUT"
    });
};