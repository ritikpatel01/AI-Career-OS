const DSA = require("../models/DSA");
const Skill = require("../models/Skill");
const Roadmap = require("../models/Roadmap");
const Progress = require("../models/Progress");
const Interview = require("../models/Interview");
const { questionIds, preparationProgress } = require("./interviewPreparationCatalog");
const { DSA_ROADMAP } = require("./dsaService");

// Matches the Roadmap page's current default; never combine different careers.
const DASHBOARD_CAREER = "Full Stack Developer";
const MANUAL_CATEGORIES = ["projects", "career"];

const timestamp = value => {
    const time = new Date(value || 0).getTime();
    return Number.isFinite(time) ? time : 0;
};
const newest = (records, updated = false) => [...records].sort((a, b) =>
    (updated ? timestamp(b.updatedAt) - timestamp(a.updatedAt) : 0) ||
    timestamp(b.createdAt) - timestamp(a.createdAt) ||
    String(b._id || "").localeCompare(String(a._id || ""))
)[0];
const number = value => {
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
        throw new Error("Invalid progress source");
    }
    return value;
};
const entry = (category, percentage, complete, source) => ({
    category, percentage, complete, active: percentage > 0, source
});

function calculateSummary({ dsa, skills, roadmaps, manual, curriculum, interviews = [] }) {
    let solved = 0;
    let target = 0;
    for (const definition of DSA_ROADMAP) {
        const record = newest(dsa.filter(item => item.topic === definition.topic), true);
        const limit = record ? number(record.problemTarget) : definition.problemTarget;
        if (limit <= 0) throw new Error("Invalid DSA target");
        target += limit;
        solved += record ? Math.min(number(record.problemsSolved ?? 0), limit) : 0;
    }
    const skillValues = skills.map(item => Math.min(100, number(item.progress ?? 0)));
    const skillPercentage = skillValues.length
        ? skillValues.reduce((sum, value) => sum + value, 0) / skillValues.length : 0;

    const topics = curriculum.phases.flatMap(phase => phase.topics);
    const record = newest(roadmaps);
    if (record && !Array.isArray(record.steps)) throw new Error("Invalid roadmap steps");
    let completed = 0;
    for (const [index, topic] of topics.entries()) {
        const step = record?.steps[index];
        const title = typeof topic === "string" ? topic : topic.title || topic.name || topic.topic || topic.label;
        // Refuse a mismatched curriculum instead of attributing completion by position.
        if (step && step.title !== title) throw new Error("Roadmap curriculum mismatch");
        if (step?.status === "completed") completed++;
    }

    const manualEntries = MANUAL_CATEGORIES.map(category => {
        const current = newest(manual.filter(item => item.category === category));
        const percentage = current ? number(current.percentage) : 0;
        if (percentage > 100) throw new Error("Invalid manual percentage");
        return entry(category, percentage, Boolean(current) && percentage === 100, "manual");
    });
    const byCategory = new Map(manualEntries.map(item => [item.category, item]));
    const preparation = preparationProgress(interviews);
    byCategory.set("interview", entry("interview", preparation.percentage, preparation.total > 0 && preparation.practiced === preparation.total, "interview-preparation"));
    byCategory.set("dsa", entry("dsa", target ? solved / target * 100 : 0, target > 0 && solved === target, "dsa"));
    byCategory.set("skills", entry("skills", skillPercentage, skillValues.length > 0 && skillValues.every(value => value === 100), "skills"));
    byCategory.set("roadmap", entry("roadmap", topics.length ? completed / topics.length * 100 : 0, topics.length > 0 && completed === topics.length, "roadmap"));
    return ["dsa", "skills", "projects", "interview", "roadmap", "career"].map(category => byCategory.get(category));
}

async function getDashboardProgress(userId) {
    const [{ ROADMAPS }, dsa, skills, roadmaps, manual, interviews] = await Promise.all([
        import("../../client/src/data/careerRoadmaps/careerRoadmapData.js"),
        DSA.find({ user: userId, topic: { $in: DSA_ROADMAP.map(item => item.topic) } })
            .select("topic problemTarget problemsSolved updatedAt createdAt").lean(),
        Skill.find({ user: userId }).select("progress").lean(),
        Roadmap.find({ user: userId, title: `AI Career OS progress: ${DASHBOARD_CAREER}`, goal: "built-in-career-roadmap-progress" })
            .select("steps createdAt").lean(),
        Progress.find({ user: userId, category: { $in: MANUAL_CATEGORIES } })
            .select("category percentage createdAt").lean(),
        Interview.find({ user: userId, kind: "preparation", questionId: { $in: questionIds } })
            .select("questionId practiced updatedAt").lean()
    ]);
    return calculateSummary({ dsa, skills, roadmaps, manual, interviews, curriculum: ROADMAPS[DASHBOARD_CAREER] });
}

module.exports = { getDashboardProgress, calculateSummary };
