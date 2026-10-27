const mongoose = require("mongoose");


// =========================================================
// EVALUATION DIMENSIONS
// =========================================================

const evaluationDimensionsSchema = new mongoose.Schema(
    {
        accuracy: {
            type: Number,
            min: 1,
            max: 5,
            default: 1
        },

        relevance: {
            type: Number,
            min: 1,
            max: 5,
            default: 1
        },

        completeness: {
            type: Number,
            min: 1,
            max: 5,
            default: 1
        },

        technicalDepth: {
            type: Number,
            min: 1,
            max: 5,
            default: 1
        },

        clarity: {
            type: Number,
            min: 1,
            max: 5,
            default: 1
        }
    },
    {
        _id: false
    }
);


// =========================================================
// INTERVIEW EVALUATION
// =========================================================

const evaluationSchema = new mongoose.Schema(
    {
        score: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },

        verdict: {
            type: String,
            enum: [
                "Excellent",
                "Good",
                "Partial",
                "Weak",
                "Incorrect"
            ],
            default: "Incorrect"
        },

        dimensions: {
            type: evaluationDimensionsSchema,
            default: () => ({})
        },

        explanation: {
            type: String,
            default: ""
        },

        strengths: {
            type: [String],
            default: []
        },

        weaknesses: {
            type: [String],
            default: []
        },

        missingConcepts: {
            type: [String],
            default: []
        },

        incorrectClaims: {
            type: [String],
            default: []
        },

        improvementAdvice: {
            type: String,
            default: ""
        },

        idealAnswer: {
            type: String,
            default: ""
        }
    },
    {
        _id: false
    }
);


// =========================================================
// INTERVIEW SCHEMA
// =========================================================

const interviewSchema = new mongoose.Schema(
    {

        // -------------------------------------------------
        // USER
        // -------------------------------------------------

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },


        // -------------------------------------------------
        // ROLE
        // -------------------------------------------------

        role: {
            type: String,
            trim: true,
            default: ""
        },


        // -------------------------------------------------
        // CATEGORY
        // -------------------------------------------------

        category: {
            type: String,
            trim: true,
            default: "Technical"
        },


        // -------------------------------------------------
        // TOPIC
        // -------------------------------------------------

        topic: {
            type: String,
            trim: true,
            default: "General"
        },


        // -------------------------------------------------
        // DIFFICULTY
        // -------------------------------------------------

        difficulty: {
            type: String,
            enum: [
                "easy",
                "medium",
                "hard",
                "Easy",
                "Intermediate",
                "Hard"
            ],
            default: "medium"
        },


        // -------------------------------------------------
        // QUESTION
        // -------------------------------------------------

        question: {
            type: String,
            required: true,
            trim: true
        },


        // -------------------------------------------------
        // EXPECTED CONCEPTS
        // -------------------------------------------------

        expectedConcepts: {
            type: [String],
            default: []
        },


        // -------------------------------------------------
        // CRITICAL CONCEPTS
        // -------------------------------------------------

        criticalConcepts: {
            type: [String],
            default: []
        },


        // -------------------------------------------------
        // COMMON MISTAKES
        // -------------------------------------------------

        commonMistakes: {
            type: [String],
            default: []
        },


        // -------------------------------------------------
        // CANDIDATE ANSWER
        // -------------------------------------------------

        answer: {
            type: String,
            required: true,
            trim: true
        },


        // -------------------------------------------------
        // AI EVALUATION
        // -------------------------------------------------

        evaluation: {
            type: evaluationSchema,
            default: null
        },


        // -------------------------------------------------
        // FINAL SCORE
        // -------------------------------------------------
        // Kept separately for easy querying/sorting.
        // Example:
        // Interview.find().sort({ score: -1 })

        score: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },


        // -------------------------------------------------
        // SESSION STATUS
        // -------------------------------------------------

        status: {
            type: String,
            enum: [
                "completed",
                "in-progress",
                "failed"
            ],
            default: "completed"
        }
    },

    {
        timestamps: true
    }
);


// =========================================================
// INDEXES
// =========================================================

// Get a user's latest interviews quickly.
interviewSchema.index({
    user: 1,
    createdAt: -1
});


// Get interviews by role.
interviewSchema.index({
    user: 1,
    role: 1
});


// Get interviews by topic.
interviewSchema.index({
    user: 1,
    topic: 1
});


// Get interviews by difficulty.
interviewSchema.index({
    user: 1,
    difficulty: 1
});


// =========================================================
// MODEL
// =========================================================

const Interview = mongoose.model(
    "Interview",
    interviewSchema
);


module.exports = Interview;