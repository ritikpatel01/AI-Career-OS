import api from "./api";

export const getProfile = async () => {
    return await api("/profile");
};

export const createProfile = async (profileData) => {
    return await api("/profile", {
        method: "POST",
        body: JSON.stringify(profileData)
    });
};

export const updateProfile = async (profileData) => {
    return await api("/profile", {
        method: "PUT",
        body: JSON.stringify(profileData)
    });
};

export const deleteProfile = async () => {
    return await api("/profile", {
        method: "DELETE"
    });
};