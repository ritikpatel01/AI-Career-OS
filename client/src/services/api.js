
export const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const getAuthToken = () =>
    localStorage.getItem("token") ||
    sessionStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    sessionStorage.getItem("authToken") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("accessToken");

const api = async (endpoint, options = {}) => {
    const token = getAuthToken();

    const headers = {
        "Content-Type": "application/json",
        ...options.headers
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
    });

    const data = await response.json();

    if (!response.ok) {
        const error = new Error(
            data.message || "Something went wrong"
        );

        error.details = data.errors || [];

        throw error;
    }

    return data;
};

export default api;
