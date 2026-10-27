
const Project = require("../models/Project");

// Remove protected fields from request data.
const removeProtectedFields = (data = {}) => {
    const safeData = { ...data };

    [
        "user",
        "_id",
        "__v",
        "createdAt",
        "updatedAt"
    ].forEach((field) => {
        delete safeData[field];
    });

    return safeData;
};

// ==========================================
// GET ALL PROJECTS
// ==========================================
const getProjects = async (userId) => {
    return await Project.find({
        user: userId
    }).sort({
        createdAt: -1
    });
};

// ==========================================
// CREATE PROJECT
// ==========================================
const createProject = async (userId, data) => {
    return await Project.create({
        ...removeProtectedFields(data),
        user: userId
    });
};

// ==========================================
// GET PROJECT BY ID
// Only return projects owned by this user.
// ==========================================
const getProjectById = async (userId, projectId) => {
    return await Project.findOne({
        _id: projectId,
        user: userId
    });
};

// ==========================================
// UPDATE PROJECT
// Only update projects owned by this user.
// ==========================================
const updateProject = async (userId, projectId, data) => {
    return await Project.findOneAndUpdate(
        {
            _id: projectId,
            user: userId
        },
        {
            $set: removeProtectedFields(data)
        },
        {
            new: true,
            runValidators: true
        }
    );
};

// ==========================================
// DELETE PROJECT
// Only delete projects owned by this user.
// ==========================================
const deleteProject = async (userId, projectId) => {
    return await Project.findOneAndDelete({
        _id: projectId,
        user: userId
    });
};

// ==========================================
// EXPORT FUNCTIONS
// ==========================================
module.exports = {
    getProjects,
    createProject,
    getProjectById,
    updateProject,
    deleteProject
};
