const Joi = require("joi");


// =====================================================
// INTERVIEW ANSWER VALIDATION
// =====================================================

const interviewSchema = Joi.object({

    // Candidate role
    role: Joi.string()
        .trim()
        .max(150)
        .allow("")
        .optional(),

    // Interview category
    category: Joi.string()
        .trim()
        .max(100)
        .allow("")
        .optional(),

    // Interview topic
    topic: Joi.string()
        .trim()
        .max(150)
        .allow("")
        .optional(),

    // Difficulty
    difficulty: Joi.string()
        .valid(
            "Easy",
            "Intermediate",
            "Hard",
            "easy",
            "medium",
            "hard"
        )
        .default("Intermediate"),

    // Interview question
    question: Joi.string()
        .trim()
        .min(5)
        .max(5000)
        .required(),

    // Concepts expected in the answer
    expectedConcepts: Joi.array()
        .items(
            Joi.string()
                .trim()
                .max(200)
        )
        .default([]),

    // Concepts that are especially important
    criticalConcepts: Joi.array()
        .items(
            Joi.string()
                .trim()
                .max(200)
        )
        .default([]),

    // Common mistakes for this question
    commonMistakes: Joi.array()
        .items(
            Joi.string()
                .trim()
                .max(300)
        )
        .default([]),

    // Candidate's answer
    answer: Joi.string()
        .trim()
        .min(1)
        .max(10000)
        .required()

}).options({

    // Allow only fields defined above.
    // Unknown fields will be rejected.
    allowUnknown: false,

    // Do not strip useful interview fields.
    stripUnknown: false

});


module.exports = interviewSchema;