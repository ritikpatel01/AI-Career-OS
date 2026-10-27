const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },

        bio: {
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

        education: [
            {
                degree: String,
                institution: String,
                field: String,
                startYear: Number,
                endYear: Number
            }
        ],

        experience: [
            {
                company: String,
                position: String,
                startDate: Date,
                endDate: Date,
                description: String
            }
        ],

        socialLinks: {
            github: String,
            linkedin: String,
            portfolio: String
        }
    },
    {
        timestamps: true
    }
);

const Profile = mongoose.model("Profile", profileSchema);

module.exports = Profile;