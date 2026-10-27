export const getPracticeCompletionKey = (phase, item) => {
    const phaseId = phase.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const exerciseId = item.legacyOutlineId || item.id || item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return `${phaseId}::${exerciseId}`;
};

export const filterPracticeExercises = ({ items, search = "", difficulty = "all", topic = "all", status = "all", completedKeys = [], completionKey }) => {
    const query = search.trim().toLowerCase();
    return (Array.isArray(items) ? items : []).filter((raw) => {
        const item = normalizePracticeExercise(raw);
        if (!item) return false;
        const searchableText = [
            item.title,
            item.topic,
            item.problemStatement,
            item.simplerProblem,
            item.approach,
            ...(item.learningObjectives || []),
            ...(item.requirements || []),
            ...(item.conceptsToReview || []),
            ...(item.hints || [])
        ].filter(Boolean).join(" ").toLowerCase();
        const matchesSearch = searchableText.includes(query);
        const matchesDifficulty = difficulty === "all" || item.difficulty?.toLowerCase() === difficulty;
        const matchesTopic = topic === "all" || item.topic === topic;
        const done = completedKeys.includes(completionKey(item));
        const matchesStatus = status === "all" || (status === "completed" ? done : !done);
        return matchesSearch && matchesDifficulty && matchesTopic && matchesStatus;
    });
};

// Normalize a UI copy only: catalog IDs, legacy aliases, and saved keys retain
// their original values. Optional authoring fields must not unmount the app.
const displayText = (value, fallback = "") => {
    if (value == null) return fallback;
    if (["string", "number", "boolean"].includes(typeof value)) return String(value);
    try { return JSON.stringify(value) || fallback; } catch { return fallback; }
};
const textList = (value) => Array.isArray(value)
    ? value.filter(item => typeof item === "string" && item.trim())
    : [];
export const normalizePracticeExercise = (item) => {
    if (!item || typeof item !== "object" || typeof item.id !== "string" || !item.id.trim()) return null;
    const result = { ...item };
    for (const field of ["title", "topic", "difficulty", "estimatedTime", "problemStatement", "simplerProblem", "starterCode", "language", "approach", "walkthrough", "solutionCode", "followUp"]) result[field] = displayText(item[field]);
    result.title ||= "Exercise details unavailable";
    result.difficulty ||= "Unspecified";
    for (const field of ["conceptsToReview", "prerequisites", "learningObjectives", "requirements", "hints", "solutionLines", "completionCriteria", "commonMistakes"]) result[field] = textList(item[field]);
    result.examples = (Array.isArray(item.examples) ? item.examples : []).filter(e => e && typeof e === "object" && e.input != null && e.output != null).map(e => ({input:displayText(e.input),output:displayText(e.output),explanation:displayText(e.explanation)}));
    result.tests = (Array.isArray(item.tests) ? item.tests : []).filter(t => t && typeof t === "object").map((t,i) => ({name:displayText(t.name,`Check ${i+1}`),input:displayText(t.input),expected:displayText(t.expected)}));
    result.complexity = item.complexity && typeof item.complexity === "object" ? {time:displayText(item.complexity.time),space:displayText(item.complexity.space),explanation:displayText(item.complexity.explanation)} : null;
    return result;
};
