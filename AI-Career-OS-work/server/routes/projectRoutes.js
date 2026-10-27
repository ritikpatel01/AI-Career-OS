const express = require("express");

const {
    getAllProjects,
    createNewProject,
    getProject,
    updateProjectData,
    removeProject
} = require("../controllers/projectController");

const authMiddleware = require("../middleware/authMiddleware");
const validateMiddleware = require("../middleware/validationMiddleware");
const projectSchema = require("../validators/projectValidator");

const router = express.Router();

router.get("/", authMiddleware, getAllProjects);

router.post(
    "/",
    authMiddleware,
    validateMiddleware(projectSchema),
    createNewProject
);

router.get("/:id", authMiddleware, getProject);

router.put(
    "/:id",
    authMiddleware,
    validateMiddleware(projectSchema),
    updateProjectData
);

router.delete("/:id", authMiddleware, removeProject);

module.exports = router;