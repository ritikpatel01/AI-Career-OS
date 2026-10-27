import api from "./api";

export const getGitHubProfile = async (username) => {
    return await api(`/github/${username}`);
};

export const getGitHubRepositories = async (username) => {
    return await api(`/github/${username}/repositories`);
};