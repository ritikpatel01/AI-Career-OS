const mongoose = require("mongoose");

const skillEvidenceSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        skill: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Skill",
            required: true,
            index: true
        },

        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120
        },

        type: {
            type: String,
            required: true,
            enum: [
                "project",
                "github",
                "assessment",
                "interview",
                "certificate",
                "other"
            ]
        },

        url: {
            type: String,
            trim: true,
            maxlength: 2048,
            default: ""
        },

        description: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: ""
        },

        verificationStatus: {
            type: String,
            enum: [
                "unverified",
                "under-review",
                "verified",
                "rejected"
            ],
            default: "unverified"
        },

        reviewNote: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: ""
        },

    reviewedBy: {
    type: require("mongoose").Schema.Types.ObjectId,
    ref: "User",
    default: null
},

        reviewedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

skillEvidenceSchema.index({
    user: 1,
    skill: 1,
    createdAt: -1
});

module.exports = mongoose.model(
    "SkillEvidence",
    skillEvidenceSchema
);