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
        kind: { $ne: "preparation" },
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

const { questions: preparationQuestions, questionIds, buildPreparationPage } = require("./interviewPreparationCatalog");

const getPreparation = async (userId, query) => {
    const records = await Interview.find({ user: userId, kind: "preparation", questionId: { $in: questionIds } })
        .select("questionId answer notes practiced bookmarked revisionStatus lastPracticedAt updatedAt").lean();
    return buildPreparationPage(records, query);
};

const savePreparation = async (userId, questionId, patch) => {
    const question = preparationQuestions.find(item => item.id === questionId);
    if (!question) return null;
    const changes = {};
    for (const field of ["answer", "notes", "practiced", "bookmarked", "revisionStatus"]) {
        if (Object.prototype.hasOwnProperty.call(patch, field)) changes[field] = patch[field];
    }
    if (patch.practiced === true) changes.lastPracticedAt = new Date();
    const filter = { user: userId, kind: "preparation", questionId };
    const update = {
        $set: changes,
        $setOnInsert: { question: question.question, category: question.category, topic: question.category, difficulty: question.difficulty }
    };
    const options = { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true };
    let record;
    try { record = await Interview.findOneAndUpdate(filter, update, options).lean(); }
    catch (error) {
        if (error.code !== 11000) throw error;
        // A concurrent insert won the unique user/question key; update that same record.
        record = await Interview.findOneAndUpdate(filter, { $set: changes }, { new: true, runValidators: true }).lean();
        if (!record) throw error;
    }
    return buildPreparationPage([record], { search: "", category: question.category, difficulty: "all", status: "all", sort: "category", page: 1, limit: 50 })
        .questions.find(item => item.id === questionId);
};

module.exports = {
    getPreparation,
    savePreparation,

    getInterviewQuestions,

    submitInterviewAnswer

};
