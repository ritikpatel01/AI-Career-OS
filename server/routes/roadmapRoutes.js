const express = require("express");

const {
    getAllRoadmaps,
    createNewRoadmap,
    getRoadmap,
    updateRoadmapData,
    removeRoadmap
} = require("../controllers/roadmapController");

const authMiddleware = require("../middleware/authMiddleware");
const validateMiddleware = require("../middleware/validationMiddleware");
const roadmapSchema = require("../validators/roadmapValidator");

const router = express.Router();

router.get("/", authMiddleware, getAllRoadmaps);

router.post(
    "/",
    authMiddleware,
    validateMiddleware(roadmapSchema),
    createNewRoadmap
);

router.get("/:id", authMiddleware, getRoadmap);

router.put(
    "/:id",
    authMiddleware,
    validateMiddleware(roadmapSchema),
    updateRoadmapData
);

router.delete("/:id", authMiddleware, removeRoadmap);

module.exports = router;