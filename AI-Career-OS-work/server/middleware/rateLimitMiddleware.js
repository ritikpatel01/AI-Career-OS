const rateLimit = require("express-rate-limit");

const rateLimitMiddleware = rateLimit({
    windowMs: 15 * 60 * 1000,

    // Development limit
    max: 1000,

    message: {
        success: false,
        message: "Too many requests. Please try again later."
    },

    standardHeaders: true,
    legacyHeaders: false
});

module.exports = rateLimitMiddleware;