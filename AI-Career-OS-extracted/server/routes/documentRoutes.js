
const express = require("express");
const mongoose = require("mongoose");

const authMiddleware = require("../middleware/authMiddleware");
const validateMiddleware = require("../middleware/validationMiddleware");
const { documentSchema } = require("../validators/documentValidator");

const Document = require("../models/Document");

const router = express.Router();

// ==========================================
// GET ALL DOCUMENTS FOR THE LOGGED-IN USER
// ==========================================
router.get("/", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;

        const documents = await Document.find({
            user: userId
        }).sort({
            createdAt: -1
        });

        return res.status(200).json({
            success: true,
            message: "Documents fetched successfully",
            data: documents
        });
    } catch (error) {
        console.error("Get documents error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch documents"
        });
    }
});

// ==========================================
// CREATE A DOCUMENT
// Always assign ownership using the JWT user ID.
// ==========================================
router.post(
    "/",
    authMiddleware,
    validateMiddleware(documentSchema),
    async (req, res) => {
        try {
            const userId = req.user.userId;

            // Accept only the document fields required by the model.
            // Never accept user ownership or status from the request.
            const {
                title,
                fileName,
                fileUrl,
                fileType,
                extractedText
            } = req.body;

            const document = await Document.create({
                title,
                fileName,
                fileUrl,
                fileType,
                extractedText,
                user: userId,
                status: "processed"
            });

            return res.status(201).json({
                success: true,
                message: "Document uploaded successfully",
                data: document
            });
        } catch (error) {
            console.error("Create document error:", error);

            return res.status(500).json({
                success: false,
                message: "Failed to create document"
            });
        }
    }
);

// ==========================================
// GET A SINGLE DOCUMENT
// Only its owner can access it through this route.
// ==========================================
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid document ID"
            });
        }

        const document = await Document.findOne({
            _id: id,
            user: userId
        });

        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Document not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Document fetched successfully",
            data: document
        });
    } catch (error) {
        console.error("Get document error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch document"
        });
    }
});

module.exports = router;
