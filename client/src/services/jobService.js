import api from "./api";

const JOBS_PAGE_SIZE = 50;
const MAX_JOB_OFFSET = 10000;

export const getJobs = async ({ page = 1, limit = JOBS_PAGE_SIZE, type, signal } = {}) => {
    const params = new URLSearchParams({
        page: String(page),
        limit: String(limit)
    });

    if (type) {
        params.set("type", type);
    }

    return await api(`/jobs?${params.toString()}`, { signal });
};

export const getAllJobs = async ({ type, signal } = {}) => {
    const firstPage = await getJobs({ page: 1, limit: JOBS_PAGE_SIZE, type, signal });
    if (!Array.isArray(firstPage.data)) {
        throw new Error("The jobs API returned an invalid response.");
    }

    const jobs = [...firstPage.data];
    const pagination = firstPage.pagination;
    const hasPagination =
        pagination && Number.isInteger(pagination.pages) && pagination.pages >= 0;
    const total = Number.isFinite(pagination?.total)
        ? pagination.total
        : null;
    const requestedPages = hasPagination ? Math.max(1, pagination.pages) : 1;
    const maxPage = Math.floor(MAX_JOB_OFFSET / JOBS_PAGE_SIZE) + 1;
    const expectedPages = total === null
        ? requestedPages
        : Math.max(requestedPages, Math.ceil(total / JOBS_PAGE_SIZE));
    const lastPage = Math.min(expectedPages, maxPage);

    for (let page = 2; page <= lastPage; page += 1) {
        const response = await getJobs({
            page,
            limit: JOBS_PAGE_SIZE,
            type,
            signal
        });

        if (!Array.isArray(response.data)) {
            throw new Error("The jobs API returned an invalid response.");
        }

        jobs.push(...response.data);
    }

    return {
        jobs,
        total,
        isComplete: Boolean(
            hasPagination &&
            expectedPages <= maxPage &&
            (total === null || jobs.length >= total)
        )
    };
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
