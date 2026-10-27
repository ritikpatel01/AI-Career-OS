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

        fileUrl: {
            type: String,
            trim: true
        },

        fileType: {
            type: String,
            trim: true
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