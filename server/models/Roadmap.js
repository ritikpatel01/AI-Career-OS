const mongoose = require("mongoose");

const roadmapSchema = new mongoose.Schema(
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

        description: {
            type: String,
            trim: true
        },

        goal: {
            type: String,
            trim: true
        },

        notes: {
            type: String,
            trim: true,
            maxlength: 10000,
            default: ""
        },

        completedPractice: {
            type: [String],
            default: []
        },

        steps: [
            {
                title: {
                    type: String,
                    required: true
                },

                description: String,

                status: {
                    type: String,
                    enum: ["pending", "in-progress", "completed"],
                    default: "pending"
                },

                order: {
                    type: Number,
                    default: 0
                }
            }
        ],

        progress: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

const Roadmap = mongoose.model("Roadmap", roadmapSchema);

module.exports = Roadmap;
