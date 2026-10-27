import axios from "axios";
import { getAuthToken } from "./api";

// ======================================================
// API CONFIGURATION
// ======================================================

const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";


// ======================================================
// AUTH HEADER
// ======================================================

const getAuthHeaders = () => {
    const token = getAuthToken();

    if (!token) {
        return {};
    }

    return {
        Authorization: `Bearer ${token}`,
    };
};


// ======================================================
// API ERROR HANDLER
// ======================================================

const getErrorMessage = (error) => {
    return (
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Something went wrong."
    );
};


// ======================================================
// GET ACTIVITIES
// ======================================================

export const getActivities = async () => {
    try {
        const response = await axios.get(
            `${API_BASE_URL}/activities`,
            {
                headers: getAuthHeaders(),
            }
        );

        return response.data;
    } catch (error) {
        console.error(
            "Get Activities API Error:",
            error
        );

        throw new Error(
            getErrorMessage(error)
        );
    }
};


// ======================================================
// CREATE ACTIVITY
// ======================================================

export const createActivity = async (
    activityData
) => {
    try {
        const response = await axios.post(
            `${API_BASE_URL}/activities`,
            activityData,
            {
                headers: {
                    "Content-Type":
                        "application/json",

                    ...getAuthHeaders(),
                },
            }
        );

        return response.data;
    } catch (error) {
        console.error(
            "Create Activity API Error:",
            error
        );

        throw new Error(
            getErrorMessage(error)
        );
    }
};


// ======================================================
// DELETE ACTIVITY
// ======================================================

export const deleteActivity = async (
    activityId
) => {
    try {
        const response = await axios.delete(
            `${API_BASE_URL}/activities/${activityId}`,
            {
                headers: getAuthHeaders(),
            }
        );

        return response.data;
    } catch (error) {
        console.error(
            "Delete Activity API Error:",
            error
        );

        throw new Error(
            getErrorMessage(error)
        );
    }
};


// ======================================================
// UPDATE ACTIVITY
// ======================================================

export const updateActivity = async (
    activityId,
    activityData
) => {
    try {
        const response = await axios.put(
            `${API_BASE_URL}/activities/${activityId}`,
            activityData,
            {
                headers: {
                    "Content-Type":
                        "application/json",

                    ...getAuthHeaders(),
                },
            }
        );

        return response.data;
    } catch (error) {
        console.error(
            "Update Activity API Error:",
            error
        );

        throw new Error(
            getErrorMessage(error)
        );
    }
};


// ======================================================
// GET SINGLE ACTIVITY
// ======================================================

export const getActivityById = async (
    activityId
) => {
    try {
        const response = await axios.get(
            `${API_BASE_URL}/activities/${activityId}`,
            {
                headers: getAuthHeaders(),
            }
        );

        return response.data;
    } catch (error) {
        console.error(
            "Get Activity API Error:",
            error
        );

        throw new Error(
            getErrorMessage(error)
        );
    }
};
