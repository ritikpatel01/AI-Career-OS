const Joi = require("joi");

const activitySchema = Joi.object({
    type: Joi.string()
        .valid(
            "login",
            "project",
            "dsa",
            "interview",
            "roadmap",
            "skill",
            "resume",
            "job",
            "profile",
            "learning",
            "github",
            "other"
        )
        .required(),

    title: Joi.string()
        .min(2)
        .max(100)
        .required(),

    description: Joi.string()
        .max(500)
        .allow(""),

    metadata: Joi.object()
        .default({})
});

module.exports = {
    activitySchema
};
