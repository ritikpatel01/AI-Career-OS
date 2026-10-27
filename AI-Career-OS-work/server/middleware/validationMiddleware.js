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

            next();
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Validation middleware failed",
                error: error.message
            });
        }
    };
};

module.exports = validateMiddleware;