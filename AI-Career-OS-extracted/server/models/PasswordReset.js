const mongoose = require("mongoose");

const passwordResetSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },

        codeHash: {
            type: String,
            required: true
        },

        attempts: {
            type: Number,
            default: 0
        },

        verifiedAt: {
            type: Date,
            default: null
        },

        resetTokenHash: {
            type: String,
            default: null
        },

        resetTokenExpiresAt: {
            type: Date,
            default: null
        },

        expiresAt: {
            type: Date,
            required: true
        },

        usedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

passwordResetSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
);

module.exports = mongoose.model(
    "PasswordReset",
    passwordResetSchema
);