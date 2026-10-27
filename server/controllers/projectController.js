const { getSafeErrorMessage, logError } = require("../middleware/errorMiddleware");

const {
    getProjects,
    createProject,
    getProjectById,
    updateProject,
    deleteProject
} = require("../services/projectService");
const { createNotification } = require("../services/notificationService");

const getAllProjects = async (req, res) => {
    try {
        const userId = req.user.userId;

        const projects = await getProjects(userId);

        res.status(200).json({
            success: true,
            message: "Projects fetched successfully",
            data: projects
        });
    } catch (error) {
        logError("Failed to fetch projects", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch projects",
            error: getSafeErrorMessage(error, "Failed to fetch projects")
        });
    }
};

const createNewProject = async (req, res) => {
    try {
        const userId = req.user.userId;

        const project = await createProject(
            userId,
            req.body
        );

        try {
            await createNotification(userId, {
                title: "Project added",
                message: `${project.title} was added to your projects.`,
                type: "general",
                link: "/projects"
            });
        } catch (notificationError) {
            logError("Project created, but its notification could not be saved", notificationError);
        }

        res.status(201).json({
            success: true,
            message: "Project created successfully",
            data: project
        });
    } catch (error) {
        logError("Failed to create project", error);
        res.status(400).json({
            success: false,
            message: "Failed to create project",
            error: getSafeErrorMessage(error, "Failed to create project")
        });
    }
};

const getProject = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        const project = await getProjectById(
            userId,
            id
        );

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Project fetched successfully",
            data: project
        });
    } catch (error) {
        logError("Failed to fetch project", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch project",
            error: getSafeErrorMessage(error, "Failed to fetch project")
        });
    }
};

const updateProjectData = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        const project = await updateProject(
            userId,
            id,
            req.body
        );

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Project updated successfully",
            data: project
        });
    } catch (error) {
        logError("Failed to update project", error);
        res.status(400).json({
            success: false,
            message: "Failed to update project",
            error: getSafeErrorMessage(error, "Failed to update project")
        });
    }
};

const removeProject = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        const project = await deleteProject(
            userId,
            id
        );

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Project deleted successfully"
        });
    } catch (error) {
        logError("Failed to delete project", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete project",
            error: getSafeErrorMessage(error, "Failed to delete project")
        });
    }
};

module.exports = {
    getAllProjects,
    createNewProject,
    getProject,
    updateProjectData,
    removeProject
};
