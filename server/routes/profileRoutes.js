const express = require("express");

const {
    getUserProfile,
    createUserProfile,
    updateUserProfile
} = require("../controllers/profileController");

const authMiddleware = require("../middleware/authMiddleware");
const validateMiddleware = require("../middleware/validationMiddleware");
const profileSchema = require("../validators/profileValidator");

const router = express.Router();

router.get("/", authMiddleware, getUserProfile);

router.post(
    "/",
    authMiddleware,
    validateMiddleware(profileSchema),
    createUserProfile
);

router.put(
    "/",
    authMiddleware,
    validateMiddleware(profileSchema),
    updateUserProfile
);

module.exports = router;