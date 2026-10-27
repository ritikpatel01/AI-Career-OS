const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
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

        technologies: [
            {
                type: String,
                trim: true
            }
        ],

        githubUrl: {
            type: String,
            trim: true
        },

        liveUrl: {
            type: String,
            trim: true
        },

        status: {
            type: String,
            enum: ["planned", "in-progress", "completed"],
            default: "planned"
        }
    },
    {
        timestamps: true
    }
);

const Project = mongoose.model("Project", projectSchema);

module.exports = Project;