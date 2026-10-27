const express = require("express");

const {
    getProgress,
    createTopic,
    updateTopic
} = require("../controllers/dsaController");

const authMiddleware = require("../middleware/authMiddleware");

const validateMiddleware = require("../middleware/validationMiddleware");

const dsaSchema = require("../validators/dsaValidator");

const router = express.Router();


// ==========================================
// GET ALL DSA TOPICS
// ==========================================

router.get(
    "/",
    authMiddleware,
    getProgress
);


// ==========================================
// CREATE NEW DSA TOPIC
// ==========================================

router.post(
    "/",
    authMiddleware,
    validateMiddleware(dsaSchema),
    createTopic
);


// ==========================================
// UPDATE EXISTING DSA TOPIC
// ==========================================

router.put(
    "/:id",
    authMiddleware,
    validateMiddleware(dsaSchema),
    updateTopic
);


module.exports = router;