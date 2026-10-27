const Joi = require("joi");

const resumeSchema = Joi.object({
    title: Joi.string()
        .min(2)
        .max(150)
        .required(),

    fullName: Joi.string()
        .max(100)
        .allow(""),

    jobTitle: Joi.string()
        .max(100)
        .allow(""),

    email: Joi.string()
        .email()
        .allow(""),

    phone: Joi.string()
        .max(30)
        .allow(""),

    location: Joi.string()
        .max(100)
        .allow(""),

    github: Joi.string()
        .uri()
        .allow(""),

    linkedin: Joi.string()
        .uri()
        .allow(""),

    portfolio: Joi.string()
        .uri()
        .allow(""),

    summary: Joi.string()
        .max(3000)
        .allow(""),

    skills: Joi.array()
        .items(
            Joi.string().max(100)
        )
        .default([]),

    education: Joi.string()
        .max(5000)
        .allow(""),

    experience: Joi.string()
        .max(5000)
        .allow(""),

    projects: Joi.string()
        .max(5000)
        .allow(""),

    certifications: Joi.string()
        .max(3000)
        .allow(""),

    achievements: Joi.string()
        .max(3000)
        .allow(""),

    resumeUrl: Joi.string()
        .uri()
        .allow("")
});

module.exports = resumeSchema;