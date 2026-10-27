import api from "./api";

export const registerUser = async (userData) => {
    return await api("/auth/register", {
        method: "POST",
        body: JSON.stringify(userData)
    });
};

export const loginUser = async (userData) => {
    return await api("/auth/login", {
        method: "POST",
        body: JSON.stringify(userData)
    });
};