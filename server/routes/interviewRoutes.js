const express = require("express");

const {
    getQuestions,
    submitAnswer
} = require("../controllers/interviewController");

const authMiddleware = require("../middleware/authMiddleware");
const validateMiddleware = require("../middleware/validationMiddleware");
const interviewSchema = require("../validators/interviewValidator");

const router = express.Router();

router.get("/preparation", authMiddleware, require("../controllers/interviewController").getPreparation);
router.put("/preparation/:questionId", authMiddleware, require("../controllers/interviewController").savePreparation);

router.get("/", authMiddleware, getQuestions);

router.post(
    "/answer",
    authMiddleware,
    validateMiddleware(interviewSchema),
    submitAnswer
);

module.exports = router;
