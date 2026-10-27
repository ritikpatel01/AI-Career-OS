const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        type: {
            type: String,
            enum: [
                "login",
                "project",
                "dsa",
                "interview",
                "roadmap",
                "skill",
                "resume",
                "job",
                "profile",
                "learning",
                "github",
                "other"
            ],
            required: true
        },

        title: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            trim: true
        },

        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },
    {
        timestamps: true
    }
);

const Activity = mongoose.model("Activity", activitySchema);

module.exports = Activity;
