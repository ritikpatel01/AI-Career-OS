const Skill = require("../models/Skill");
const SkillEvidence = require("../models/SkillEvidence");

/* =========================================
   CHECK SKILL OWNERSHIP
========================================= */

const getOwnedSkill = async (userId, skillId) => {
    return Skill.findOne({
        _id: skillId,
        user: userId
    });
};

/* =========================================
   GET EVIDENCE FOR A SKILL
========================================= */

const getSkillEvidence = async (userId, skillId) => {
    const skill = await getOwnedSkill(userId, skillId);

    if (!skill) {
        return null;
    }

    return SkillEvidence.find({
        user: userId,
        skill: skillId
    }).sort({
        createdAt: -1
    });
};

/* =========================================
   CREATE EVIDENCE
========================================= */

const createSkillEvidence = async (
    userId,
    skillId,
    data
) => {
    const skill = await getOwnedSkill(userId, skillId);

    if (!skill) {
        return null;
    }

    return SkillEvidence.create({
        user: userId,
        skill: skillId,
        title: data.title,
        type: data.type,
        url: data.url || "",
        description: data.description || "",

        // New evidence always starts unverified.
        verificationStatus: "unverified",
        reviewNote: "",
        reviewedBy: null,
        reviewedAt: null
    });
};

/* =========================================
   UPDATE EVIDENCE
========================================= */

const updateSkillEvidence = async (
    userId,
    skillId,
    evidenceId,
    data
) => {
    const skill = await getOwnedSkill(userId, skillId);

    if (!skill) {
        return null;
    }

    return SkillEvidence.findOneAndUpdate(
        {
            _id: evidenceId,
            user: userId,
            skill: skillId
        },
        {
            $set: {
                title: data.title,
                type: data.type,
                url: data.url || "",
                description: data.description || "",

                // Evidence has changed, so require a fresh review.
                verificationStatus: "unverified",
                reviewNote: "",
                reviewedBy: null,
                reviewedAt: null
            }
        },
        {
            new: true,
            runValidators: true
        }
    );
};

/* =========================================
   DELETE EVIDENCE
========================================= */

const deleteSkillEvidence = async (
    userId,
    skillId,
    evidenceId
) => {
    const skill = await getOwnedSkill(userId, skillId);

    if (!skill) {
        return null;
    }

    return SkillEvidence.findOneAndDelete({
        _id: evidenceId,
        user: userId,
        skill: skillId
    });
};

/* =========================================
   EXPORT FUNCTIONS
========================================= */

module.exports = {
    getSkillEvidence,
    createSkillEvidence,
    updateSkillEvidence,
    deleteSkillEvidence
};