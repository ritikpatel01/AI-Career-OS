const express = require("express");

const {
    getAllResumes,
    createNewResume,
    getResume,
    updateResumeData,
    removeResume,
    analyzeResume
} = require("../controllers/resumeController");

const authMiddleware = require("../middleware/authMiddleware");
const validateMiddleware = require("../middleware/validationMiddleware");
const resumeSchema = require("../validators/resumeValidator");

const uploadResume = require("../middleware/uploadMiddleware");

const router = express.Router();


// ==========================================
// ANALYZE RESUME
// ==========================================

router.post(
    "/analyze",
    authMiddleware,
    uploadResume,
    analyzeResume
);


// ==========================================
// GET ALL RESUMES
// ==========================================

router.get(
    "/",
    authMiddleware,
    getAllResumes
);


// ==========================================
// CREATE RESUME
// ==========================================

router.post(
    "/",
    authMiddleware,
    validateMiddleware(resumeSchema),
    createNewResume
);


// ==========================================
// GET SINGLE RESUME
// ==========================================

router.get(
    "/:id",
    authMiddleware,
    getResume
);


// ==========================================
// UPDATE RESUME
// ==========================================

router.put(
    "/:id",
    authMiddleware,
    validateMiddleware(resumeSchema),
    updateResumeData
);


// ==========================================
// DELETE RESUME
// ==========================================

router.delete(
    "/:id",
    authMiddleware,
    removeResume
);


module.exports = router;