const multer = require("multer");

const storage = multer.memoryStorage();

const allowedMimeTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];

const fileFilter = (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new Error(
                "Only PDF and DOCX resume files are allowed."
            ),
            false
        );
    }
};

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 5
    },
    fileFilter
});

// Handle multipart files
const uploadResume = (req, res, next) => {
    upload.any()(req, res, (error) => {
        if (error) {
            return next(error);
        }

        // No files
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Resume file is required"
            });
        }

        // Find resume file
        const resumeFiles = req.files.filter(
            (file) => file.fieldname === "resume"
        );

        // Resume field missing
        if (resumeFiles.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'File field "resume" is required'
            });
        }

        // More than one resume
        if (resumeFiles.length > 1) {
            return res.status(400).json({
                success: false,
                message: "Only one resume file is allowed"
            });
        }

        // Reject unexpected file fields
        const unexpectedFiles = req.files.filter(
            (file) => file.fieldname !== "resume"
        );

        if (unexpectedFiles.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Only the resume file field is allowed"
            });
        }

        // Convert to req.file
        req.file = resumeFiles[0];

        next();
    });
};

module.exports = uploadResume;