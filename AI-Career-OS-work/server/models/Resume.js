const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        title: {
            type: String,
            required: true,
            trim: true
        },

        fullName: {
            type: String,
            trim: true
        },

        jobTitle: {
            type: String,
            trim: true
        },

        email: {
            type: String,
            trim: true
        },

        phone: {
            type: String,
            trim: true
        },

        location: {
            type: String,
            trim: true
        },

        github: {
            type: String,
            trim: true
        },

        linkedin: {
            type: String,
            trim: true
        },

        portfolio: {
            type: String,
            trim: true
        },

        summary: {
            type: String,
            trim: true
        },

        skills: {
            type: [String],
            default: []
        },

        education: {
            type: String,
            trim: true
        },

        experience: {
            type: String,
            trim: true
        },

        projects: {
            type: String,
            trim: true
        },

        certifications: {
            type: String,
            trim: true
        },

        achievements: {
            type: String,
            trim: true
        },

        resumeUrl: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

const Resume = mongoose.model(
    "Resume",
    resumeSchema
);

module.exports = Resume;