const Joi = require("joi");

const progressSchema = Joi.object({
    category: Joi.string()
        .valid(
            "dsa",
            "skills",
            "projects",
            "interview",
            "roadmap",
            "career"
        )
        .required(),

    completed: Joi.number()
        .integer()
        .min(0)
        .required(),

    total: Joi.number()
        .integer()
        .min(0)
        .required(),

    percentage: Joi.number()
        .min(0)
        .max(100)
        .required()
});

module.exports = {
    progressSchema
};