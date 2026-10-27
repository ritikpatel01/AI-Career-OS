const express = require("express");

const {
    register,
    login
} = require("../controllers/authController");

const validateMiddleware = require("../middleware/validationMiddleware");

const {
    registerSchema,
    loginSchema
} = require("../validators/authValidator");

const router = express.Router();

router.use((_req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
});

router.post(
    "/register",
    validateMiddleware(registerSchema),
    register
);

router.post(
    "/login",
    validateMiddleware(loginSchema),
    login
);

module.exports = router;