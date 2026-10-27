const express = require("express");

const {
    getAllActivities,
    createNewActivity,
    removeActivity
} = require("../controllers/activityController");

const authMiddleware = require("../middleware/authMiddleware");

const validateMiddleware = require("../middleware/validationMiddleware");
const { activitySchema } = require("../validators/activityValidator");

const router = express.Router();

router.get(
    "/",
    authMiddleware,
    getAllActivities
);

router.post(
    "/",
    authMiddleware,
    validateMiddleware(activitySchema),
    createNewActivity
);

router.delete("/:id", authMiddleware, removeActivity);

module.exports = router;
