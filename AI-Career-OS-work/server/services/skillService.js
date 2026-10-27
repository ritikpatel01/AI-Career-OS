
const Skill = require("../models/Skill");

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
// GET ALL SKILLS
// ==========================================
const getSkills = async (userId) => {
    return await Skill.find({
        user: userId
    }).sort({
        createdAt: -1
    });
};

// ==========================================
// CREATE SKILL
// ==========================================
const createSkill = async (userId, data) => {
    return await Skill.create({
        ...removeProtectedFields(data),
        user: userId
    });
};

// ==========================================
// UPDATE SKILL
// ==========================================
const updateSkill = async (userId, skillId, data) => {
    return await Skill.findOneAndUpdate(
        {
            _id: skillId,
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
// DELETE SKILL
// ==========================================
const deleteSkill = async (userId, skillId) => {
    return await Skill.findOneAndDelete({
        _id: skillId,
        user: userId
    });
};

// ==========================================
// EXPORT FUNCTIONS
// ==========================================
module.exports = {
    getSkills,
    createSkill,
    updateSkill,
    deleteSkill
};
