const mongoose = require("mongoose");

const skillSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        name: {
            type: String,
            required: true,
            trim: true
        },

        category: {
            type: String,
            trim: true
        },

        level: {
            type: String,
            enum: ["beginner", "intermediate", "advanced", "expert"],
            default: "beginner"
        },

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

const Skill = mongoose.model("Skill", skillSchema);

module.exports = Skill;