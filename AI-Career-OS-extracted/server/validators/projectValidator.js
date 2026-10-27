const Joi = require("joi");

const projectSchema = Joi.object({
    title: Joi.string()
        .min(2)
        .max(100)
        .required(),

    description: Joi.string()
        .max(1000)
        .allow(""),

    technologies: Joi.array()
        .items(Joi.string()),

    githubUrl: Joi.string()
        .uri()
        .allow(""),

    liveUrl: Joi.string()
        .uri()
        .allow(""),

    status: Joi.string()
        .valid("planned", "in-progress", "completed")
});

module.exports = projectSchema;