import api from "./api";

// GET ALL DSA TOPICS
export const getDSA = async () => {
    return await api("/dsa");
};

// CREATE NEW DSA TOPIC
export const createDSA = async (dsaData) => {
    return await api("/dsa", {
        method: "POST",
        body: JSON.stringify(dsaData)
    });
};

// UPDATE EXISTING DSA TOPIC
export const updateDSA = async (id, dsaData) => {
    return await api(`/dsa/${id}`, {
        method: "PUT",
        body: JSON.stringify(dsaData)
    });
};