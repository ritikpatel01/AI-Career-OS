import api from "./api";

export const getKnowledge = async () => {
    return await api("/knowledge");
};

export const getKnowledgeById = async (id) => {
    return await api(`/knowledge/${id}`);
};