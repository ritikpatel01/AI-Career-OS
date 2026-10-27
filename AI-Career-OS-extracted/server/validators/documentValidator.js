const Joi = require("joi");

const documentSchema = Joi.object({
    title: Joi.string()
        .min(2)
        .max(100)
        .required(),

    fileName: Joi.string()
        .required(),

    fileUrl: Joi.string()
        .uri()
        .required(),

    fileType: Joi.string()
        .required(),

    extractedText: Joi.string()
        .allow(""),

    status: Joi.string()
        .valid(
            "uploaded",
            "processing",
            "processed",
            "failed"
        )
        .default("uploaded")
});

module.exports = {
    documentSchema
};