const Joi = require("joi");

const roadmapSchema = Joi.object({
    title: Joi.string()
        .min(2)
        .max(100)
        .required(),

    description: Joi.string()
        .max(1000)
        .allow(""),

    goal: Joi.string()
        .max(500)
        .allow(""),

    steps: Joi.array().items(
        Joi.object({
            title: Joi.string()
                .required(),

            description: Joi.string()
                .allow(""),

            status: Joi.string()
                .valid("pending", "in-progress", "completed"),

            order: Joi.number()
                .integer()
                .min(0)
        })
    ),

    progress: Joi.number()
        .integer()
        .min(0)
        .max(100)
});

module.exports = roadmapSchema;