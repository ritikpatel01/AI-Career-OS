import api from "./api";

export const getAdminUsers = async ({
    page = 1,
    limit = 25,
    search = ""
} = {}) => {
    const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search
    });

    return await api(`/admin/users?${params.toString()}`);
};

export const changeAdminUserRole = async (
    userId,
    role
) => {
    return await api(
        `/admin/users/${userId}/role`,
        {
            method: "PATCH",
            body: JSON.stringify({ role })
        }
    );
};