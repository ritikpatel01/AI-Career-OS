const DSA = require("../models/DSA");
const Progress = require("../models/Progress");

// ==========================================
// DSA ROADMAP
// ==========================================

const DSA_ROADMAP = require("../../client/src/data/dsaRoadmap.json");


// ==========================================
// INITIALIZE DSA ROADMAP
// ==========================================

const initializeDSARoadmap = async (userId) => {
    for (const roadmapTopic of DSA_ROADMAP) {
        const existingTopic = await DSA.findOne({
            user: userId,
            topic: roadmapTopic.topic
        });

        if (!existingTopic) {
            await DSA.create({
                user: userId,
                topic: roadmapTopic.topic,
                category: roadmapTopic.category,
                difficulty: roadmapTopic.difficulty,
                status: "not-started",
                problemsSolved: 0,
                problemTarget: roadmapTopic.problemTarget,
                notes: ""
            });
        } else if (!existingTopic.problemTarget) {
            existingTopic.problemTarget =
                roadmapTopic.problemTarget;

            await existingTopic.save();
        }
    }
};


// ==========================================
// CALCULATE DSA PROGRESS
// ==========================================

const calculateDSAProgress = async (userId) => {
    const topics = await DSA.find({
        user: userId,
        topic: {
            $in: DSA_ROADMAP.map(
                (item) => item.topic
            )
        }
    });

    let totalProblems = 0;
    let solvedProblems = 0;

    for (const topic of topics) {
        totalProblems += topic.problemTarget || 0;

        solvedProblems += Math.min(
            topic.problemsSolved || 0,
            topic.problemTarget || 0
        );
    }

    const percentage =
        totalProblems === 0
            ? 0
            : Math.round(
                (solvedProblems / totalProblems) * 100
            );

    return {
        solvedProblems,
        totalProblems,
        percentage
    };
};


// ==========================================
// SYNC DASHBOARD DSA PROGRESS
// ==========================================

const syncDSAProgress = async (userId) => {
    const progressData =
        await calculateDSAProgress(userId);

    await Progress.findOneAndUpdate(
        {
            user: userId,
            category: "dsa"
        },
        {
            user: userId,
            category: "dsa",
            completed: progressData.solvedProblems,
            total: progressData.totalProblems,
            percentage: progressData.percentage
        },
        {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true
        }
    );

    return progressData;
};


// ==========================================
// GET ALL DSA TOPICS
// ==========================================

const getDSAProgress = async (userId) => {

    // Make sure all roadmap topics exist
    await initializeDSARoadmap(userId);

    // Calculate latest progress
    const progressData =
        await syncDSAProgress(userId);

    const topics = await DSA.find({
        user: userId,
        topic: {
            $in: DSA_ROADMAP.map(
                (item) => item.topic
            )
        }
    }).sort({
        createdAt: 1
    });

    return {
        completed: progressData.solvedProblems,
        total: progressData.totalProblems,
        progress: progressData.percentage,
        topics
    };
};


// ==========================================
// CREATE DSA TOPIC
// ==========================================

const createDSATopic = async (userId, data) => {

    const {
        topic,
        status,
        category,
        difficulty,
        problemsSolved,
        notes
    } = data;

    const roadmapTopic =
        DSA_ROADMAP.find(
            (item) =>
                item.topic.toLowerCase() ===
                topic.toLowerCase()
        );

    if (!roadmapTopic) {
        throw new Error(
            "This topic is not part of the DSA roadmap."
        );
    }

    const existingTopic = await DSA.findOne({
        user: userId,
        topic: roadmapTopic.topic
    });

    if (existingTopic) {
        throw new Error(
            "This DSA topic already exists."
        );
    }

    const newTopic = await DSA.create({
        user: userId,
        topic: roadmapTopic.topic,
        status: status || "not-started",
        category: category || roadmapTopic.category,
        difficulty:
            difficulty || roadmapTopic.difficulty,
        problemsSolved: problemsSolved || 0,
        problemTarget: roadmapTopic.problemTarget,
        notes: notes || ""
    });

    await syncDSAProgress(userId);

    return newTopic;
};


// ==========================================
// UPDATE DSA TOPIC
// ==========================================

const updateDSATopic = async (
    userId,
    topicId,
    data
) => {

    const {
        topic,
        status,
        category,
        difficulty,
        problemsSolved,
        notes
    } = data;

    const existingTopic = await DSA.findOne({
        _id: topicId,
        user: userId
    });

    if (!existingTopic) {
        throw new Error(
            "DSA topic not found."
        );
    }

    existingTopic.topic =
        topic ?? existingTopic.topic;

    existingTopic.status =
        status ?? existingTopic.status;

    existingTopic.category =
        category ?? existingTopic.category;

    existingTopic.difficulty =
        difficulty ?? existingTopic.difficulty;

    existingTopic.problemsSolved =
        problemsSolved ??
        existingTopic.problemsSolved;

    existingTopic.notes =
        notes ?? existingTopic.notes;

    const updatedTopic =
        await existingTopic.save();

    await syncDSAProgress(userId);

    return updatedTopic;
};


// ==========================================
// EXPORT
// ==========================================

module.exports = {
    DSA_ROADMAP,
    getReadOnlyDSATopics: userId => DSA.find({
        user: userId,
        topic: { $in: DSA_ROADMAP.map(item => item.topic) }
    }).lean(),
    getDSAProgress,
    createDSATopic,
    updateDSATopic
};
