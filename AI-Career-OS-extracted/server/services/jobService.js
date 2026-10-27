const Job = require("../models/Job");

const getJobs = async (filters = {}) => {
    const { role, location, type } = filters;

    const query = {};

    if (role) {
        query.title = { $regex: role, $options: "i" };
    }

    if (location) {
        query.location = { $regex: location, $options: "i" };
    }

    if (type) {
        query.jobType = type;
    }

    return await Job.find(query).sort({ createdAt: -1 });
};

const getJobById = async (jobId) => {
    return await Job.findById(jobId);
};

const createJob = async (data) => {
    return await Job.create(data);
};

module.exports = {
    getJobs,
    getJobById,
    createJob
};