const Joi = require("joi");

const skillEvidenceSchema = Joi.object({
    title: Joi.string()
        .trim()
        .min(1)
        .max(120)
        .required(),

    type: Joi.string()
        .valid(
            "project",
            "github",
            "assessment",
            "interview",
            "certificate",
            "other"
        )
        .required(),

    url: Joi.string()
        .trim()
        .max(2048)
        .uri({
            scheme: ["http", "https"]
        })
        .allow("")
        .default(""),

    description: Joi.string()
        .trim()
        .max(1000)
        .allow("")
        .default("")
});

module.exports = skillEvidenceSchema;