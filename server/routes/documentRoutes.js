const express = require("express");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const mongoose = require("mongoose");

const authMiddleware = require("../middleware/authMiddleware");
const uploadDocument = require("../middleware/documentUploadMiddleware");
const validateMiddleware = require("../middleware/validationMiddleware");
const {
    documentSchema,
    documentQuestionSchema
} = require("../validators/documentValidator");
const Document = require("../models/Document");
const { answerDocumentQuestion } = require("../services/documentAIService");

const router = express.Router();
const DOCUMENT_DIRECTORY = path.join(__dirname, "..", "uploads", "documents");
const CONTENT_TYPES = {
    PDF: "application/pdf",
    TXT: "text/plain; charset=utf-8",
    DOC: "application/msword",
    DOCX: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
};

const safeFileName = (name) => {
    const baseName = String(name || "document")
        .split(/[\\/]/)
        .pop()
        .replace(/[\u0000-\u001f\u007f]/g, "")
        .slice(0, 180);
    return baseName || "document";
};

const publicDocument = (document) => {
    const record = document.toObject ? document.toObject() : { ...document };
    const hasPrivateFile = Boolean(record.storageName);
    delete record.storageName;
    delete record.extractedText;
    record.id = String(record._id);
    record.size = record.fileSize ? `${(record.fileSize / (1024 * 1024)).toFixed(1)} MB` : "Unknown size";
    record.fileUrl = hasPrivateFile ? `/api/documents/${record._id}/download` : null;
    return record;
};

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

router.get("/", authMiddleware, async (req, res) => {
    try {
        const documents = await Document.find({ user: req.user.userId })
            .select("+storageName -extractedText")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Documents fetched successfully",
            data: documents.map(publicDocument)
        });
    } catch (error) {
        console.error("Get documents error:");
        return res.status(500).json({ success: false, message: "Failed to fetch documents" });
    }
});

router.post(
    "/",
    authMiddleware,
    uploadDocument,
    validateMiddleware(documentSchema),
    async (req, res) => {
        const extension = path.extname(req.file.originalname).toLowerCase();
        const storageName = `${crypto.randomUUID()}${extension}`;
        const storagePath = path.join(DOCUMENT_DIRECTORY, storageName);

        try {
            await fs.mkdir(DOCUMENT_DIRECTORY, { recursive: true, mode: 0o700 });
            await fs.writeFile(storagePath, req.file.buffer, { flag: "wx", mode: 0o600 });

            let document;
            try {
                document = await Document.create({
                    user: req.user.userId,
                    title: req.body.title,
                    fileName: safeFileName(req.file.originalname),
                    storageName,
                    fileType: req.documentFileType,
                    fileSize: req.file.size,
                    category: req.body.category,
                    description: req.body.description,
                    status: "uploaded"
                });
            } catch (error) {
                await fs.unlink(storagePath).catch(() => {});
                throw error;
            }

            document.fileUrl = `/api/documents/${document._id}/download`;
            return res.status(201).json({
                success: true,
                message: "Document uploaded successfully",
                data: publicDocument(document)
            });
        } catch (error) {
            console.error("Create document error:");
            return res.status(500).json({ success: false, message: "Failed to save document" });
        }
    }
);

router.post("/:id/ask", authMiddleware, validateMiddleware(documentQuestionSchema), async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidId(id)) {
            return res.status(400).json({ success: false, message: "Invalid document ID" });
        }

        const document = await Document.findOne({
            _id: id,
            user: req.user.userId
        }).select("+storageName");

        if (!document) {
            return res.status(404).json({ success: false, message: "Document not found" });
        }

        const answer = await answerDocumentQuestion(document, req.body.question);
        return res.status(200).json({
            success: true,
            message: "Document answer generated successfully",
            data: { answer }
        });
    } catch (error) {
        if (Number.isInteger(error.statusCode)) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }

        console.error("Document AI request failed:", {
            name: error?.name || "Error"
        });
        return res.status(500).json({
            success: false,
            message: "Unable to answer this document question right now. Please try again."
        });
    }
});

router.get("/:id/download", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidId(id)) {
            return res.status(400).json({ success: false, message: "Invalid document ID" });
        }

        const document = await Document.findOne({ _id: id, user: req.user.userId })
            .select("+storageName");
        if (!document || !document.storageName) {
            return res.status(404).json({ success: false, message: "Document not found" });
        }

        if (!/^[a-f0-9-]+\.(pdf|txt|doc|docx)$/i.test(document.storageName)) {
            return res.status(404).json({ success: false, message: "Document not found" });
        }

        const storagePath = path.join(DOCUMENT_DIRECTORY, document.storageName);
        const fallbackName = safeFileName(document.fileName).replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
        res.setHeader("Content-Type", CONTENT_TYPES[document.fileType] || "application/octet-stream");
        res.setHeader("Content-Disposition", `inline; filename="${fallbackName}"; filename*=UTF-8''${encodeURIComponent(safeFileName(document.fileName))}`);
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("Cache-Control", "private, no-store");
        return res.sendFile(storagePath, (error) => {
            if (error && !res.headersSent) {
                res.status(error.code === "ENOENT" ? 404 : 500).json({
                    success: false,
                    message: error.code === "ENOENT" ? "Document file not found" : "Failed to read document"
                });
            }
        });
    } catch (error) {
        console.error("Download document error:");
        return res.status(500).json({ success: false, message: "Failed to download document" });
    }
});

router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidId(id)) {
            return res.status(400).json({ success: false, message: "Invalid document ID" });
        }

        const document = await Document.findOne({ _id: id, user: req.user.userId })
            .select("+storageName -extractedText");
        if (!document) {
            return res.status(404).json({ success: false, message: "Document not found" });
        }

        return res.status(200).json({
            success: true,
            message: "Document fetched successfully",
            data: publicDocument(document)
        });
    } catch (error) {
        console.error("Get document error:");
        return res.status(500).json({ success: false, message: "Failed to fetch document" });
    }
});

router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidId(id)) {
            return res.status(400).json({ success: false, message: "Invalid document ID" });
        }

        const document = await Document.findOne({ _id: id, user: req.user.userId })
            .select("+storageName");
        if (!document) {
            return res.status(404).json({ success: false, message: "Document not found" });
        }

        if (document.storageName) {
            if (!/^[a-f0-9-]+\.(pdf|txt|doc|docx)$/i.test(document.storageName)) {
                return res.status(500).json({ success: false, message: "Stored document metadata is invalid" });
            }
            await fs.unlink(path.join(DOCUMENT_DIRECTORY, document.storageName)).catch((error) => {
                if (error.code !== "ENOENT") throw error;
            });
        }
        await Document.deleteOne({ _id: id, user: req.user.userId });

        return res.status(200).json({ success: true, message: "Document deleted successfully" });
    } catch (error) {
        console.error("Delete document error:");
        return res.status(500).json({ success: false, message: "Failed to delete document" });
    }
});

module.exports = router;
