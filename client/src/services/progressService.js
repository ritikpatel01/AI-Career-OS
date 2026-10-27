import api from "./api";

export const getDashboardProgress = async () => {
    return await api("/progress/summary");
};

export const getProgress = async () => {
    return await api("/progress");
};

export const createProgress = async (progressData) => {
    return await api("/progress", {
        method: "POST",
        body: JSON.stringify(progressData)
    });
};

export const updateProgress = async (id, progressData) => {
    return await api(`/progress/${id}`, {
        method: "PUT",
        body: JSON.stringify(progressData)
    });
};
