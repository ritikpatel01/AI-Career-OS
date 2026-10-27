import api, { getAuthToken } from "./api";

const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const readResponse = async (response) => {
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
        const message = result.message || "Document request failed.";
        const uploadMessages = {
            "Only PDF, TXT, DOC, and DOCX files are allowed.":
                "Unsupported file type. Please upload PDF, TXT, DOC, or DOCX.",
            "The file content does not match a supported PDF, TXT, DOC, or DOCX document.":
                "File content does not match a supported document type. Choose a valid PDF, TXT, DOC, or DOCX file.",
            "Document must be 10 MiB or smaller.":
                "File is larger than 10 MiB. Please choose a smaller file.",
            "A document file is required.":
                "Please choose a document first."
        };
        const userMessage = uploadMessages[message] || message;
        const validationDetails =
            response.status === 400 && message === "Validation failed" && Array.isArray(result.errors)
                ? result.errors
                    .filter((detail) => typeof detail === "string")
                    .slice(0, 5)
                    .map((detail) => detail.replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, 200))
                : [];

        const error = new Error(
            validationDetails.length
                ? `${userMessage}: ${validationDetails.join("; ")}`
                : userMessage
        );
        error.status = response.status;
        throw error;
    }
    return result;
};

export const getDocuments = async () => api("/documents");

export const createDocument = async (formData) => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/documents`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
    });
    return readResponse(response);
};

export const getDocumentById = async (id) => api(`/documents/${id}`);

export const askDocumentQuestion = async (id, question) =>
    api(`/documents/${encodeURIComponent(id)}/ask`, {
        method: "POST",
        body: JSON.stringify({ question })
    });

export const deleteDocument = async (id) =>
    api(`/documents/${id}`, { method: "DELETE" });

export const downloadDocument = async (id) => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/documents/${id}/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.message || "Unable to open this document.");
    }
    return response.blob();
};
