const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const {
    getEvidenceReviewQueue,
    updateEvidenceReview
} = require("../controllers/skillEvidenceReviewController");

const router = express.Router();

// Require login and admin privileges for every route.
router.use(authMiddleware);
router.use(adminMiddleware);

// GET /api/admin/skill-evidence
router.get("/", getEvidenceReviewQueue);

// PATCH /api/admin/skill-evidence/:evidenceId
router.patch("/:evidenceId", updateEvidenceReview);

module.exports = router;