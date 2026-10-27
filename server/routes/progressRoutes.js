const express = require("express");

const {
    getDashboardSummary,
    getAllProgress,
    createNewProgress,
    updateProgressData
} = require("../controllers/progressController");

const authMiddleware = require("../middleware/authMiddleware");

const validateMiddleware = require("../middleware/validationMiddleware");
const { progressSchema } = require("../validators/progressValidator");

const router = express.Router();

router.get("/summary", authMiddleware, getDashboardSummary);

router.get(
    "/",
    authMiddleware,
    getAllProgress
);

router.post(
    "/",
    authMiddleware,
    validateMiddleware(progressSchema),
    createNewProgress
);

router.put(
    "/:id",
    authMiddleware,
    validateMiddleware(progressSchema),
    updateProgressData
);

module.exports = router;
