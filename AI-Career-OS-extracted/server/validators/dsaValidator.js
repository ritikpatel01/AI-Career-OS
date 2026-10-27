const Joi = require("joi");

const dsaSchema = Joi.object({
    topic: Joi.string()
        .min(2)
        .max(100)
        .required(),

    category: Joi.string()
        .max(100)
        .allow(""),

    difficulty: Joi.string()
        .valid("easy", "medium", "hard"),

    status: Joi.string()
        .valid("not-started", "in-progress", "completed"),

    problemsSolved: Joi.number()
        .integer()
        .min(0),

    notes: Joi.string()
        .max(2000)
        .allow("")
});

module.exports = dsaSchema;