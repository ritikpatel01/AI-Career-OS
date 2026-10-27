
const Resume = require("../models/Resume");

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
// GET ALL RESUMES
// ==========================================
const getResumes = async (userId) => {
    return await Resume.find({
        user: userId
    }).sort({
        createdAt: -1
    });
};

// ==========================================
// CREATE RESUME
// ==========================================
const createResume = async (userId, data) => {
    return await Resume.create({
        ...removeProtectedFields(data),
        user: userId
    });
};

// ==========================================
// GET RESUME BY ID
// ==========================================
const getResumeById = async (userId, resumeId) => {
    return await Resume.findOne({
        _id: resumeId,
        user: userId
    });
};

// ==========================================
// UPDATE RESUME
// ==========================================
const updateResume = async (userId, resumeId, data) => {
    return await Resume.findOneAndUpdate(
        {
            _id: resumeId,
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
// DELETE RESUME
// ==========================================
const deleteResume = async (userId, resumeId) => {
    return await Resume.findOneAndDelete({
        _id: resumeId,
        user: userId
    });
};

// ==========================================
// EXPORT FUNCTIONS
// ==========================================
module.exports = {
    getResumes,
    createResume,
    getResumeById,
    updateResume,
    deleteResume
};
