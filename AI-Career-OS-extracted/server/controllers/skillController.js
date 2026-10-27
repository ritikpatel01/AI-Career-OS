const {
    getSkills,
    createSkill,
    updateSkill,
    deleteSkill
} = require("../services/skillService");

const getAllSkills = async (req, res) => {
    try {
        const userId = req.user.userId;

        const skills = await getSkills(userId);

        res.status(200).json({
            success: true,
            message: "Skills fetched successfully",
            data: skills
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch skills",
            error: error.message
        });
    }
};

const createNewSkill = async (req, res) => {
    try {
        const userId = req.user.userId;

        const skill = await createSkill(
            userId,
            req.body
        );

        res.status(201).json({
            success: true,
            message: "Skill created successfully",
            data: skill
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to create skill",
            error: error.message
        });
    }
};

const updateSkillData = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        const skill = await updateSkill(
            userId,
            id,
            req.body
        );

        if (!skill) {
            return res.status(404).json({
                success: false,
                message: "Skill not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Skill updated successfully",
            data: skill
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to update skill",
            error: error.message
        });
    }
};

const removeSkill = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        const skill = await deleteSkill(
            userId,
            id
        );

        if (!skill) {
            return res.status(404).json({
                success: false,
                message: "Skill not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Skill deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to delete skill",
            error: error.message
        });
    }
};

module.exports = {
    getAllSkills,
    createNewSkill,
    updateSkillData,
    removeSkill
};