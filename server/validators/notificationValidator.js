const Joi = require("joi");

const notificationSchema = Joi.object({
    title: Joi.string()
        .min(2)
        .max(150)
        .required(),

    message: Joi.string()
        .min(2)
        .max(1000)
        .required(),

    type: Joi.string()
        .valid(
            "job",
            "interview",
            "roadmap",
            "dsa",
            "system",
            "general"
        ),

    isRead: Joi.boolean(),

    link: Joi.string()
        .allow("")
});

module.exports = notificationSchema;