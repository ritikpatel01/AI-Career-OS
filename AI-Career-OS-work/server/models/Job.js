const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },

        company: {
            type: String,
            required: true,
            trim: true
        },

        location: {
            type: String,
            trim: true
        },

        description: {
            type: String,
            trim: true
        },

        skills: [
            {
                type: String,
                trim: true
            }
        ],

        jobType: {
            type: String,
            enum: ["full-time", "part-time", "internship", "contract"],
            default: "full-time"
        },

        experienceLevel: {
            type: String,
            trim: true
        },

        salary: {
            type: String,
            trim: true
        },

        applyUrl: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

const Job = mongoose.model("Job", jobSchema);

module.exports = Job;