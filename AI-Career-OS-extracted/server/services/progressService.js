const Progress = require("../models/Progress");

const getProgress = async (userId) => {
    return await Progress.find({
        user: userId
    }).sort({ createdAt: -1 });
};

const createProgress = async (userId, data) => {
    return await Progress.create({
        user: userId,
        ...data
    });
};

const updateProgress = async (userId, progressId, data) => {
    return await Progress.findOneAndUpdate(
        {
            _id: progressId,
            user: userId
        },
        data,
        {
            new: true,
            runValidators: true
        }
    );
};

module.exports = {
    getProgress,
    createProgress,
    updateProgress
};