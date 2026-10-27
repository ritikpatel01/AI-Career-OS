const express = require("express");

const {
    getAllJobs,
    getJob,
    createNewJob
} = require("../controllers/jobController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

router.get("/", authMiddleware, getAllJobs);
router.post("/", authMiddleware, adminMiddleware, createNewJob);
router.get("/:id", authMiddleware, getJob);

module.exports = router;
