const express = require("express");

const {
    getAllSkills,
    createNewSkill,
    updateSkillData,
    removeSkill
} = require("../controllers/skillController");

const {
    getEvidence,
    addEvidence,
    editEvidence,
    removeEvidence
} = require("../controllers/skillEvidenceController");

const authMiddleware = require("../middleware/authMiddleware");
const validateMiddleware = require("../middleware/validationMiddleware");

const skillSchema = require("../validators/skillValidator");
const skillEvidenceSchema = require("../validators/skillEvidenceValidator");

const router = express.Router();

/* =========================================
   EXISTING SKILL ROUTES
========================================= */

// Get all skills
router.get(
    "/",
    authMiddleware,
    getAllSkills
);

// Create a skill
router.post(
    "/",
    authMiddleware,
    validateMiddleware(skillSchema),
    createNewSkill
);

// Update a skill
router.put(
    "/:id",
    authMiddleware,
    validateMiddleware(skillSchema),
    updateSkillData
);

// Delete a skill
router.delete(
    "/:id",
    authMiddleware,
    removeSkill
);

/* =========================================
   SKILL EVIDENCE ROUTES
========================================= */

// Get evidence for a skill
router.get(
    "/:skillId/evidence",
    authMiddleware,
    getEvidence
);

// Add evidence to a skill
router.post(
    "/:skillId/evidence",
    authMiddleware,
    validateMiddleware(skillEvidenceSchema),
    addEvidence
);

// Update existing evidence
router.put(
    "/:skillId/evidence/:evidenceId",
    authMiddleware,
    validateMiddleware(skillEvidenceSchema),
    editEvidence
);

// Delete evidence
router.delete(
    "/:skillId/evidence/:evidenceId",
    authMiddleware,
    removeEvidence
);

module.exports = router;