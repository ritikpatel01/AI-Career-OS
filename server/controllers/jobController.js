const {
    getJobs,
    getJobById,
    createJob
} = require("../services/jobService");

const JOB_TYPES = new Set([
    "full-time",
    "part-time",
    "internship",
    "contract"
]);

const MAX_JOB_OFFSET = 10000;
const JOB_LIST_QUERY_NAMES = ["role", "location", "type", "page", "limit"];

const readOptionalFilter = (query, name) => {
    const value = query[name];

    if (value === undefined) {
        return { value: undefined };
    }

    if (typeof value !== "string" || value.length > 100) {
        return { error: `Invalid ${name} query parameter` };
    }

    return { value: value || undefined };
};

const readPositiveInteger = (query, name, defaultValue, maximum) => {
    const value = query[name];

    if (value === undefined) {
        return { value: defaultValue };
    }

    if (typeof value !== "string" || !/^\d+$/.test(value)) {
        return { error: `Invalid ${name} query parameter` };
    }

    const parsed = Number(value);

    if (
        !Number.isSafeInteger(parsed) ||
        parsed < 1 ||
        (maximum !== undefined && parsed > maximum)
    ) {
        return { error: `Invalid ${name} query parameter` };
    }

    return { value: parsed };
};

const parseJobListQuery = (query) => {
    const malformedQueryName = Object.keys(query).find((key) =>
        JOB_LIST_QUERY_NAMES.some((name) => key.startsWith(`${name}[`))
    );

    if (malformedQueryName) {
        return { error: `Invalid ${malformedQueryName} query parameter` };
    }

    const role = readOptionalFilter(query, "role");
    if (role.error) return { error: role.error };

    const location = readOptionalFilter(query, "location");
    if (location.error) return { error: location.error };

    const requestedType = readOptionalFilter(query, "type");
    if (requestedType.error) return { error: requestedType.error };

    const type = requestedType.value;
    if (type && !JOB_TYPES.has(type)) {
        return { error: "Invalid type query parameter" };
    }

    const page = readPositiveInteger(query, "page", 1);
    if (page.error) return { error: page.error };

    const limit = readPositiveInteger(query, "limit", 10, 50);
    if (limit.error) return { error: limit.error };

    const offset = (page.value - 1) * limit.value;

    if (!Number.isSafeInteger(offset) || offset > MAX_JOB_OFFSET) {
        return { error: "Invalid page query parameter" };
    }

    return {
        filters: {
            role: role.value,
            location: location.value,
            type,
            page: page.value,
            limit: limit.value
        }
    };
};

const getAllJobs = async (req, res) => {
    try {
        const parsedQuery = parseJobListQuery(req.query);

        if (parsedQuery.error) {
            return res.status(400).json({
                success: false,
                message: parsedQuery.error
            });
        }

        const { page, limit } = parsedQuery.filters;
        const result = await getJobs(parsedQuery.filters);

        res.status(200).json({
            success: true,
            message: "Jobs fetched successfully",
            data: result.jobs,
            pagination: {
                page,
                limit,
                total: result.total,
                pages: Math.ceil(result.total / limit)
            }
        });
    } catch (error) {
        console.error("[GET /api/jobs] Failed to fetch jobs", {
            name: error.name,
            code: error.code
        });

        res.status(500).json({
            success: false,
            message: "Failed to fetch jobs",
            error: "Internal server error"
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
            error: "Failed to fetch job"
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
            error: "Failed to create job"
        });
    }
};

module.exports = {
    getAllJobs,
    getJob,
    createNewJob
};
