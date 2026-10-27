const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        category: {
            type: String,
            enum: [
                "dsa",
                "skills",
                "projects",
                "interview",
                "roadmap",
                "career"
            ],
            required: true
        },

        completed: {
            type: Number,
            default: 0,
            min: 0
        },

        total: {
            type: Number,
            default: 0,
            min: 0
        },

        percentage: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        }
    },
    {
        timestamps: true
    }
);

const Progress = mongoose.model("Progress", progressSchema);

module.exports = Progress;