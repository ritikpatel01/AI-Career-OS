
const Profile = require("../models/Profile");

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
// GET PROFILE
// Only retrieve the logged-in user's profile.
// ==========================================
const getProfile = async (userId) => {
    return await Profile.findOne({
        user: userId
    }).populate("user", "name email");
};

// ==========================================
// CREATE PROFILE
// Always assign the authenticated user's ID.
// ==========================================
const createProfile = async (userId, data) => {
    const existingProfile = await Profile.findOne({
        user: userId
    });

    if (existingProfile) {
        throw new Error("Profile already exists");
    }

    return await Profile.create({
        ...removeProtectedFields(data),
        user: userId
    });
};

// ==========================================
// UPDATE PROFILE
// Only update the authenticated user's profile.
// ==========================================
const updateProfile = async (userId, data) => {
    return await Profile.findOneAndUpdate(
        {
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
// EXPORT FUNCTIONS
// ==========================================
module.exports = {
    getProfile,
    createProfile,
    updateProfile
};
