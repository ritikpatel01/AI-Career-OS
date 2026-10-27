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

    notes: Joi.string()
        .max(10000)
        .allow(""),

    completedPractice: Joi.array()
        .items(Joi.string().max(180))
        // The largest roadmap has 161 topics; the full practice target needs
        // 1,449 completion keys (3 per difficulty), with bounded headroom.
        .max(2000),

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
