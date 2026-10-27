import api from "./api";

// Get evidence attached to a skill
export const getSkillEvidence = async (skillId) => {
    return await api(`/skills/${skillId}/evidence`);
};

// Add new evidence
export const createSkillEvidence = async (
    skillId,
    evidenceData
) => {
    return await api(`/skills/${skillId}/evidence`, {
        method: "POST",
        body: JSON.stringify(evidenceData)
    });
};

// Update existing evidence
export const updateSkillEvidence = async (
    skillId,
    evidenceId,
    evidenceData
) => {
    return await api(
        `/skills/${skillId}/evidence/${evidenceId}`,
        {
            method: "PUT",
            body: JSON.stringify(evidenceData)
        }
    );
};

// Delete evidence
export const deleteSkillEvidence = async (
    skillId,
    evidenceId
) => {
    return await api(
        `/skills/${skillId}/evidence/${evidenceId}`,
        {
            method: "DELETE"
        }
    );
};