const Roadmap = require("../models/Roadmap");

const getRoadmaps = async (userId) => {
    return await Roadmap.find({
        user: userId
    }).sort({
        createdAt: -1
    });
};

const createRoadmap = async (userId, data) => {
    return await Roadmap.create({
        ...data,
        user: userId
    });
};

const getRoadmapById = async (userId, roadmapId) => {
    return await Roadmap.findOne({
        _id: roadmapId,
        user: userId
    });
};

const updateRoadmap = async (userId, roadmapId, data) => {
    return await Roadmap.findOneAndUpdate(
        {
            _id: roadmapId,
            user: userId
        },
        data,
        {
            new: true,
            runValidators: true
        }
    );
};

const deleteRoadmap = async (userId, roadmapId) => {
    return await Roadmap.findOneAndDelete({
        _id: roadmapId,
        user: userId
    });
};

module.exports = {
    getRoadmaps,
    createRoadmap,
    getRoadmapById,
    updateRoadmap,
    deleteRoadmap
};
