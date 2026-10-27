const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
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

        fileName: {
            type: String,
            required: true,
            trim: true
        },

        storageName: {
            type: String,
            required: true,
            select: false
        },

        fileUrl: {
            type: String,
            trim: true
        },

        fileType: {
            type: String,
            trim: true
        },

        category: {
            type: String,
            trim: true,
            default: "Other"
        },

        description: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: ""
        },

        fileSize: {
            type: Number,
            min: 0,
            required: true
        },

        extractedText: {
            type: String,
            default: ""
        },

        status: {
            type: String,
            enum: ["uploaded", "processing", "processed", "failed"],
            default: "uploaded"
        }
    },
    {
        timestamps: true
    }
);

const Document = mongoose.model("Document", documentSchema);

module.exports = Document;
