const Joi = require("joi");

const profileSchema = Joi.object({
    bio: Joi.string()
        .allow("")
        .custom((value, helpers) => {
            const wordCount = value
                .trim()
                .split(/\s+/)
                .filter(Boolean)
                .length;

            if (wordCount > 1000) {
                return helpers.error("bio.maxWords");
            }

            return value;
        })
        .messages({
            "bio.maxWords": "Bio must not exceed 1000 words."
        }),

    phone: Joi.string()
        .max(20)
        .allow(""),

    location: Joi.string()
        .max(100)
        .allow(""),

    education: Joi.array().items(
        Joi.object({
            degree: Joi.string().allow(""),
            institution: Joi.string().allow(""),
            field: Joi.string().allow(""),
            startYear: Joi.number().integer(),
            endYear: Joi.number().integer()
        })
    ),

    experience: Joi.array().items(
        Joi.object({
            company: Joi.string().allow(""),
            position: Joi.string().allow(""),
            startDate: Joi.date(),
            endDate: Joi.date().allow(null),
            description: Joi.string().allow("")
        })
    ),

    socialLinks: Joi.object({
        github: Joi.string()
            .uri()
            .allow(""),

        linkedin: Joi.string()
            .uri()
            .allow(""),

        portfolio: Joi.string()
            .uri()
            .allow("")
    })
});

module.exports = profileSchema;