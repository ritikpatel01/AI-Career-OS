import api from "./api";

export const getRoadmaps = async () => {
    return await api("/roadmaps");
};

export const createRoadmap = async (roadmapData) => {
    return await api("/roadmaps", {
        method: "POST",
        body: JSON.stringify(roadmapData)
    });
};

export const updateRoadmap = async (id, roadmapData) => {
    return await api(`/roadmaps/${id}`, {
        method: "PUT",
        body: JSON.stringify(roadmapData)
    });
};

export const deleteRoadmap = async (id) => {
    return await api(`/roadmaps/${id}`, {
        method: "DELETE"
    });
};