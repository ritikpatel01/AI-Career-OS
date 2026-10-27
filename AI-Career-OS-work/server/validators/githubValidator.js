const Joi = require("joi");


// ============================================================
// GITHUB ANALYSIS VALIDATOR
// ============================================================
//
// Expected request body:
//
// {
//     "username": "your-github-username",
//     "role": "Full Stack Developer"
// }
//
// ============================================================

const githubValidator = Joi.object({

    // --------------------------------------------------------
    // GitHub Username
    // --------------------------------------------------------

    username: Joi.string()
        .trim()
        .min(1)
        .max(100)
        .required()
        .messages({

            "string.empty":
                "GitHub username is required",

            "string.min":
                "GitHub username is required",

            "string.max":
                "GitHub username is too long",

            "any.required":
                "GitHub username is required"
        }),


    // --------------------------------------------------------
    // Target Role
    // --------------------------------------------------------

    role: Joi.string()
        .trim()
        .max(150)
        .allow("")
        .optional()
        .messages({

            "string.max":
                "Target role is too long"
        })

}).options({

    // Don't accept unexpected fields
    allowUnknown: false,

    // Keep the validated values
    stripUnknown: false
});


// ============================================================
// EXPORT
// ============================================================

module.exports = githubValidator;