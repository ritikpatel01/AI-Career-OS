const Interview = require("../models/Interview");

const {
    evaluateInterviewAnswer
} = require("../../ai-engine/interview/evaluator");

const getInterviewQuestions = async (userId, filters = {}) => {
    const { topic, difficulty } = filters;

    const query = {
        user: userId
    };

    if (topic) {
        query.topic = topic;
    }

    if (difficulty) {
        query.difficulty = difficulty;
    }

    return await Interview.find(query).sort({
        createdAt: -1
    });
};


const submitInterviewAnswer = async (userId, data) => {
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


    // Validate answer
    if (!question || !question.trim()) {
        throw new Error("Interview question is required");
    }

    if (!answer || !answer.trim()) {
        throw new Error("Interview answer is required");
    }


    // ==========================================
    // AI EVALUATION
    // ==========================================

    const evaluation = await evaluateInterviewAnswer({
        role,
        category,
        difficulty: difficulty || "Intermediate",
        topic,
        question,
        expectedConcepts: expectedConcepts || [],
        criticalConcepts: criticalConcepts || [],
        commonMistakes: commonMistakes || [],
        answer
    });


    // ==========================================
    // SAVE INTERVIEW ANSWER
    // ==========================================

    const interview = await Interview.create({
        user: userId,
        topic,
        difficulty: difficulty || "medium",
        question,
        answer
    });


    // ==========================================
    // RETURN ANSWER + AI EVALUATION
    // ==========================================

    return {
        interview,
        evaluation
    };
};


module.exports = {
    getInterviewQuestions,
    submitInterviewAnswer
};