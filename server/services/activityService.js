const Activity = require("../models/Activity");

const getActivities = async (userId) => {
    return await Activity.find({
        user: userId
    }).sort({ createdAt: -1 });
};

const createActivity = async (userId, data) => {
    return await Activity.create({
        user: userId,
        ...data
    });
};

module.exports = {
    getActivities,
    createActivity
};