const { logError } = require("./errorMiddleware");

const validateMiddleware = (schema) => {
    return (req, res, next) => {
        try {
            const { error, value } = schema.validate(req.body, {
                abortEarly: false,
                stripUnknown: true
            });

            if (error) {
                return res.status(400).json({
                    success: false,
                    message: "Validation failed",
                    errors: error.details.map((detail) => detail.message)
                });
            }

            req.body = value;

        } catch (error) {
            logError("Validation middleware failed", error);
            return res.status(500).json({
                success: false,
                message: "Validation middleware failed",
                error: "Internal Server Error"
            });
        }
        // Let Express handle downstream failures; do not turn them into a
        // second validation response after a handler has already responded.
        return next();
    };
};

module.exports = validateMiddleware;