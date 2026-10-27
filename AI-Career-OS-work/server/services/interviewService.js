const Interview = require("../models/Interview");

const {
    evaluateInterviewAnswer
} = require("../../ai-engine/interview/evaluator");


// =========================================================
// GET INTERVIEW QUESTIONS / HISTORY
// =========================================================

const getInterviewQuestions = async (
    userId,
    filters = {}
) => {

    const {
        topic,
        difficulty,
        role,
        category
    } = filters;


    // -----------------------------------------------------
    // BASE QUERY
    // -----------------------------------------------------

    const query = {
        user: userId
    };


    // -----------------------------------------------------
    // TOPIC FILTER
    // -----------------------------------------------------

    if (topic) {
        query.topic = topic;
    }


    // -----------------------------------------------------
    // DIFFICULTY FILTER
    // -----------------------------------------------------

    if (difficulty) {
        query.difficulty = difficulty;
    }


    // -----------------------------------------------------
    // ROLE FILTER
    // -----------------------------------------------------

    if (role) {
        query.role = role;
    }


    // -----------------------------------------------------
    // CATEGORY FILTER
    // -----------------------------------------------------

    if (category) {
        query.category = category;
    }


    // -----------------------------------------------------
    // GET INTERVIEW HISTORY
    // -----------------------------------------------------

    return await Interview
        .find(query)
        .sort({
            createdAt: -1
        });
};



// =========================================================
// SUBMIT INTERVIEW ANSWER
// =========================================================

const submitInterviewAnswer = async (
    userId,
    data
) => {

    const {

        role,

        category,

        topic,

        difficulty,

        question,

        expectedConcepts,

        criticalConcepts,

        commonMistakes,

        answer

    } = data;


    // =====================================================
    // VALIDATION
    // =====================================================

    if (!question || !question.trim()) {

        throw new Error(
            "Interview question is required"
        );
    }


    if (!answer || !answer.trim()) {

        throw new Error(
            "Interview answer is required"
        );
    }


    // =====================================================
    // AI EVALUATION
    // =====================================================

    console.log(
        "Starting AI interview evaluation..."
    );


    const evaluation =
        await evaluateInterviewAnswer({

            role,

            category,

            difficulty:
                difficulty || "Intermediate",

            topic,

            question,

            expectedConcepts:
                Array.isArray(expectedConcepts)
                    ? expectedConcepts
                    : [],

            criticalConcepts:
                Array.isArray(criticalConcepts)
                    ? criticalConcepts
                    : [],

            commonMistakes:
                Array.isArray(commonMistakes)
                    ? commonMistakes
                    : [],

            answer

        });


    // =====================================================
    // SAVE INTERVIEW
    // =====================================================

    const interview = await Interview.create({

        // -------------------------------------------------
        // USER
        // -------------------------------------------------

        user: userId,


        // -------------------------------------------------
        // INTERVIEW INFORMATION
        // -------------------------------------------------

        role:
            role || "",

        category:
            category || "Technical",

        topic:
            topic || "General",

        difficulty:
            difficulty || "medium",


        // -------------------------------------------------
        // QUESTION
        // -------------------------------------------------

        question,


        // -------------------------------------------------
        // QUESTION CONTEXT
        // -------------------------------------------------

        expectedConcepts:
            Array.isArray(expectedConcepts)
                ? expectedConcepts
                : [],

        criticalConcepts:
            Array.isArray(criticalConcepts)
                ? criticalConcepts
                : [],

        commonMistakes:
            Array.isArray(commonMistakes)
                ? commonMistakes
                : [],


        // -------------------------------------------------
        // CANDIDATE ANSWER
        // -------------------------------------------------

        answer,


        // -------------------------------------------------
        // AI EVALUATION
        // -------------------------------------------------

        evaluation,


        // -------------------------------------------------
        // QUICK ACCESS SCORE
        // -------------------------------------------------

        score:
            evaluation.score,


        // -------------------------------------------------
        // STATUS
        // -------------------------------------------------

        status: "completed"

    });


    // =====================================================
    // RETURN RESULT
    // =====================================================

    return {

        interview,

        evaluation

    };
};



// =========================================================
// EXPORT
// =========================================================

module.exports = {

    getInterviewQuestions,

    submitInterviewAnswer

};