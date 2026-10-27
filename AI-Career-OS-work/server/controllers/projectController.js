const {
    getProjects,
    createProject,
    getProjectById,
    updateProject,
    deleteProject
} = require("../services/projectService");

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
        res.status(500).json({
            success: false,
            message: "Failed to fetch projects",
            error: error.message
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

        res.status(201).json({
            success: true,
            message: "Project created successfully",
            data: project
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to create project",
            error: error.message
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
        res.status(500).json({
            success: false,
            message: "Failed to fetch project",
            error: error.message
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
        res.status(400).json({
            success: false,
            message: "Failed to update project",
            error: error.message
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
        res.status(500).json({
            success: false,
            message: "Failed to delete project",
            error: error.message
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