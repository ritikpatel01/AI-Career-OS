
import api from "./api";

export const getAdminDataSummary = async () => {
    return await api("/admin/data/summary");
};

export const getAdminDataRecords = async ({
    resource,
    userId = "",
    search = "",
    page = 1,
    limit = 25
}) => {
    const params = new URLSearchParams({
        page: String(page),
        limit: String(limit)
    });

    if (userId) {
        params.set("userId", userId);
    }

    if (search) {
        params.set("search", search);
    }

    return await api(
        `/admin/data/${encodeURIComponent(resource)}?${params.toString()}`
    );
};
