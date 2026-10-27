import api from "./api";

export const getSkills = async () => {
    return await api("/skills");
};

export const createSkill = async (skillData) => {
    return await api("/skills", {
        method: "POST",
        body: JSON.stringify(skillData)
    });
};

export const updateSkill = async (id, skillData) => {
    return await api(`/skills/${id}`, {
        method: "PUT",
        body: JSON.stringify(skillData)
    });
};

export const deleteSkill = async (id) => {
    return await api(`/skills/${id}`, {
        method: "DELETE"
    });
};