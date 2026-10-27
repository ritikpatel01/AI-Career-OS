const Joi = require("joi");

const jobSchema = Joi.object({
    title: Joi.string()
        .min(2)
        .max(150)
        .required(),

    company: Joi.string()
        .min(2)
        .max(150)
        .required(),

    location: Joi.string()
        .max(150)
        .allow(""),

    description: Joi.string()
        .max(5000)
        .allow(""),

    skills: Joi.array()
        .items(Joi.string()),

    jobType: Joi.string()
        .valid("full-time", "part-time", "internship", "contract"),

    experienceLevel: Joi.string()
        .max(100)
        .allow(""),

    salary: Joi.string()
        .max(100)
        .allow(""),

    applyUrl: Joi.string()
        .uri()
        .allow("")
});

module.exports = jobSchema;