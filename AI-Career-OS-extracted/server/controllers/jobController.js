const {
    getJobs,
    getJobById,
    createJob
} = require("../services/jobService");

const getAllJobs = async (req, res) => {
    try {
        const jobs = await getJobs(req.query);

        res.status(200).json({
            success: true,
            message: "Jobs fetched successfully",
            data: jobs
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch jobs",
            error: error.message
        });
    }
};

const getJob = async (req, res) => {
    try {
        const { id } = req.params;

        const job = await getJobById(id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Job fetched successfully",
            data: job
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch job",
            error: error.message
        });
    }
};

const createNewJob = async (req, res) => {
    try {
        const job = await createJob(req.body);

        res.status(201).json({
            success: true,
            message: "Job created successfully",
            data: job
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to create job",
            error: error.message
        });
    }
};

module.exports = {
    getAllJobs,
    getJob,
    createNewJob
};