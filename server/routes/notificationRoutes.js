const express = require("express");

const {
    getAllNotifications,
    createNotification,
    markAsRead
} = require("../controllers/notificationController");

const authMiddleware = require("../middleware/authMiddleware");

const validateMiddleware = require("../middleware/validationMiddleware");

const notificationSchema = require("../validators/notificationValidator");

const router = express.Router();

router.get(
    "/",
    authMiddleware,
    getAllNotifications
);

router.post(
    "/",
    authMiddleware,
    validateMiddleware(notificationSchema),
    createNotification
);

router.put(
    "/:id/read",
    authMiddleware,
    markAsRead
);

module.exports = router;