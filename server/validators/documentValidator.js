const Joi = require("joi");

const documentSchema = Joi.object({
    title: Joi.string()
        .min(2)
        .max(100)
        .required(),

    category: Joi.string()
        .valid("Programming", "Interview", "DSA", "Resume", "Projects", "Career", "Education", "Certifications", "Other")
        .default("Other"),

    description: Joi.string()
        .max(1000)
        .allow("")
        .default("")
});

const documentQuestionSchema = Joi.object({
    question: Joi.string()
        .trim()
        .min(1)
        .max(2000)
        .required()
});

module.exports = {
    documentSchema,
    documentQuestionSchema
};
