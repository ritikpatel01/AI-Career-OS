const Joi = require("joi");

const skillSchema = Joi.object({
    name: Joi.string()
        .min(2)
        .max(100)
        .required(),

    category: Joi.string()
        .max(100)
        .allow(""),

    level: Joi.string()
        .valid("beginner", "intermediate", "advanced", "expert"),

    progress: Joi.number()
        .integer()
        .min(0)
        .max(100)
});

module.exports = skillSchema;