const express = require("express");

const {
    getAllProgress,
    createNewProgress,
    updateProgressData
} = require("../controllers/progressController");

const authMiddleware = require("../middleware/authMiddleware");

const validateMiddleware = require("../middleware/validationMiddleware");
const { progressSchema } = require("../validators/progressValidator");

const router = express.Router();

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