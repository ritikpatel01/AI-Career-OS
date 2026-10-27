import api from "./api";

export const getDocuments = async () => {
    return await api("/documents");
};

export const createDocument = async (documentData) => {
    return await api("/documents", {
        method: "POST",
        body: JSON.stringify(documentData)
    });
};

export const getDocumentById = async (id) => {
    return await api(`/documents/${id}`);
};