const express = require("express");

const {
    getItems,
    getItemById
} = require("../controllers/knowledgeController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
    "/",
    authMiddleware,
    getItems
);

router.get(
    "/:id",
    authMiddleware,
    getItemById
);

module.exports = router;