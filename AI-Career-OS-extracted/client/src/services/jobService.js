import api from "./api";

export const getJobs = async () => {
    return await api("/jobs");
};

export const createJob = async (jobData) => {
    return await api("/jobs", {
        method: "POST",
        body: JSON.stringify(jobData)
    });
};

export const getJobById = async (id) => {
    return await api(`/jobs/${id}`);
};