
const mongoose = require("mongoose");

const {
    getSkillEvidence,
    createSkillEvidence,
    updateSkillEvidence,
    deleteSkillEvidence
} = require("../services/skillEvidenceService");

// GET evidence for a skill
const getEvidence = async (req, res) => {
    try {
        const { skillId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(skillId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid skill ID"
            });
        }

        const evidence = await getSkillEvidence(
            req.user.userId,
            skillId
        );

        if (evidence === null) {
            return res.status(404).json({
                success: false,
                message: "Skill not found or access denied"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Skill evidence fetched successfully",
            data: evidence
        });
    } catch (error) {
        console.error("Get skill evidence error:");

        return res.status(500).json({
            success: false,
            message: "Failed to fetch skill evidence"
        });
    }
};

// POST: Add evidence to a skill
const addEvidence = async (req, res) => {
    try {
        const { skillId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(skillId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid skill ID"
            });
        }

        const evidence = await createSkillEvidence(
            req.user.userId,
            skillId,
            req.body
        );

        if (evidence === null) {
            return res.status(404).json({
                success: false,
                message: "Skill not found or access denied"
            });
        }

        return res.status(201).json({
            success: true,
            message: "Skill evidence added successfully",
            data: evidence
        });
    } catch (error) {
        console.error("Add skill evidence error:");

        return res.status(500).json({
            success: false,
            message: "Failed to add skill evidence"
        });
    }
};

// PUT: Update existing evidence
const editEvidence = async (req, res) => {
    try {
        const { skillId, evidenceId } = req.params;

        if (
            !mongoose.Types.ObjectId.isValid(skillId) ||
            !mongoose.Types.ObjectId.isValid(evidenceId)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid skill ID or evidence ID"
            });
        }

        const evidence = await updateSkillEvidence(
            req.user.userId,
            skillId,
            evidenceId,
            req.body
        );

        if (evidence === null) {
            return res.status(404).json({
                success: false,
                message: "Skill or evidence not found, or access denied"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Skill evidence updated successfully",
            data: evidence
        });
    } catch (error) {
        console.error("Update skill evidence error:");

        return res.status(500).json({
            success: false,
            message: "Failed to update skill evidence"
        });
    }
};

// DELETE: Remove evidence
const removeEvidence = async (req, res) => {
    try {
        const { skillId, evidenceId } = req.params;

        if (
            !mongoose.Types.ObjectId.isValid(skillId) ||
            !mongoose.Types.ObjectId.isValid(evidenceId)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid skill ID or evidence ID"
            });
        }

        const evidence = await deleteSkillEvidence(
            req.user.userId,
            skillId,
            evidenceId
        );

        if (evidence === null) {
            return res.status(404).json({
                success: false,
                message: "Skill or evidence not found, or access denied"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Skill evidence deleted successfully",
            data: evidence
        });
    } catch (error) {
        console.error("Delete skill evidence error:");

        return res.status(500).json({
            success: false,
            message: "Failed to delete skill evidence"
        });
    }
};

module.exports = {
    getEvidence,
    addEvidence,
    editEvidence,
    removeEvidence
};
