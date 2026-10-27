import api from "./api";

export const getSkillEvidenceReviewQueue = async (
    status = "unverified"
) => {
    const query = status
        ? `?status=${encodeURIComponent(status)}`
        : "";

    return await api(`/admin/skill-evidence${query}`);
};

export const updateSkillEvidenceReview = async (
    evidenceId,
    reviewData
) => {
    return await api(
        `/admin/skill-evidence/${evidenceId}`,
        {
            method: "PATCH",
            body: JSON.stringify(reviewData)
        }
    );
};