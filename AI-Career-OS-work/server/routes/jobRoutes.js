const express = require("express");

const {
    getAllJobs,
    getJob,
    createNewJob
} = require("../controllers/jobController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, getAllJobs);
router.post("/", authMiddleware, createNewJob);
router.get("/:id", authMiddleware, getJob);

module.exports = router;