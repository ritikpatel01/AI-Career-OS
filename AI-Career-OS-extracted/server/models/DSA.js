const mongoose = require("mongoose");

const dsaSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        topic: {
            type: String,
            required: true,
            trim: true
        },

        category: {
            type: String,
            trim: true
        },

        difficulty: {
            type: String,
            enum: ["easy", "medium", "hard"],
            default: "easy"
        },

        status: {
            type: String,
            enum: ["not-started", "in-progress", "completed"],
            default: "not-started"
        },

        // Number of problems the user has solved
        problemsSolved: {
            type: Number,
            min: 0,
            default: 0
        },

        // Target number of problems for this topic
        problemTarget: {
            type: Number,
            min: 1,
            required: true
        },

        notes: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

const DSA = mongoose.model("DSA", dsaSchema);

module.exports = DSA;