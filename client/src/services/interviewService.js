import api from "./api";

export const getInterviewPreparation = (filters = {}, signal) =>
    api(`/interviews/preparation?${new URLSearchParams(filters)}`, { signal });

export const saveInterviewPreparation = (questionId, patch) =>
    api(`/interviews/preparation/${encodeURIComponent(questionId)}`, { method: "PUT", body: JSON.stringify(patch) });
