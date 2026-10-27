import api from "./api";

export const getProjects = async () => {
    return await api("/projects");
};

export const createProject = async (projectData) => {
    return await api("/projects", {
        method: "POST",
        body: JSON.stringify(projectData)
    });
};

export const updateProject = async (id, projectData) => {
    return await api(`/projects/${id}`, {
        method: "PUT",
        body: JSON.stringify(projectData)
    });
};

export const deleteProject = async (id) => {
    return await api(`/projects/${id}`, {
        method: "DELETE"
    });
};