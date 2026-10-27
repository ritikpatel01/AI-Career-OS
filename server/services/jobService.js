const Job = require("../models/Job");

const escapeRegex = (value) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getJobs = async (filters = {}) => {
    const { role, location, type, page = 1, limit = 10 } = filters;

    const query = {};

    if (role) {
        query.title = { $regex: escapeRegex(role), $options: "i" };
    }

    if (location) {
        query.location = { $regex: escapeRegex(location), $options: "i" };
    }

    if (type) {
        query.jobType = type;
    }

    const [jobs, total] = await Promise.all([
        Job.find(query)
            .sort({ createdAt: -1, _id: -1 })
            .skip((page - 1) * limit)
            .limit(limit),
        Job.countDocuments(query)
    ]);

    return { jobs, total };
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
