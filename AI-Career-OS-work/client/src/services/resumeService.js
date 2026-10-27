import api from "./api";

export const getResumes = async () => {
    return await api("/resumes");
};

export const createResume = async (resumeData) => {
    return await api("/resumes", {
        method: "POST",
        body: JSON.stringify(resumeData)
    });
};

export const updateResume = async (id, resumeData) => {
    return await api(`/resumes/${id}`, {
        method: "PUT",
        body: JSON.stringify(resumeData)
    });
};

export const deleteResume = async (id) => {
    return await api(`/resumes/${id}`, {
        method: "DELETE"
    });
};