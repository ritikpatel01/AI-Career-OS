const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const {
    getAllUsers,
    changeUserRole
} = require("../controllers/adminUserController");

const router = express.Router();

// Every route requires authentication and admin authorization.
router.use(authMiddleware);
router.use(adminMiddleware);

// GET /api/admin/users
router.get("/", getAllUsers);

// PATCH /api/admin/users/:userId/role
router.patch("/:userId/role", changeUserRole);

module.exports = router;