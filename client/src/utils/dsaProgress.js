import canonicalTopics from "../data/dsaRoadmap.json" with { type: "json" };

const timestamp = value => {
    const time = new Date(value || 0).getTime();
    return Number.isFinite(time) ? time : 0;
};

export function getCanonicalDSATopics(records) {
    return canonicalTopics.map(definition => {
        const record = records.filter(item => item?.topic === definition.topic).sort((a, b) =>
            timestamp(b.updatedAt) - timestamp(a.updatedAt) ||
            timestamp(b.createdAt) - timestamp(a.createdAt) ||
            String(b._id || "").localeCompare(String(a._id || ""))
        )[0];
        return { ...definition, problemsSolved: 0, status: "not-started", notes: "", ...record };
    });
}

export function filterDSATopics(topics, search = "", status = "all", sort = "roadmap") {
    const query = search.trim().toLowerCase();
    const filtered = topics.filter(item =>
        (!query || `${item.topic} ${item.category} ${item.notes || ""}`.toLowerCase().includes(query)) &&
        (status === "all" || item.status === status)
    );
    const ratio = item => item.problemTarget > 0 ? Math.min(item.problemsSolved, item.problemTarget) / item.problemTarget : 0;
    if (sort === "name") filtered.sort((a, b) => a.topic.localeCompare(b.topic));
    if (sort === "progress-high") filtered.sort((a, b) => ratio(b) - ratio(a));
    if (sort === "progress-low") filtered.sort((a, b) => ratio(a) - ratio(b));
    return filtered;
}

export function validateDSAForm(values, topic) {
    if (!topic) return "Select a topic below before saving.";
    if (!Number.isFinite(topic.problemTarget) || topic.problemTarget <= 0) return "This topic has an invalid target. Reload the records before saving.";
    const solved = Number(values.problemsSolved);
    if (String(values.problemsSolved).trim() === "" || !Number.isSafeInteger(solved) || solved < 0 || solved > topic.problemTarget) {
        return `Enter a whole number from 0 to ${topic.problemTarget} problems.`;
    }
    if (!["easy", "medium", "hard"].includes(values.difficulty)) return "Choose a valid difficulty.";
    if (!["not-started", "in-progress", "completed"].includes(values.status)) return "Choose a valid study status.";
    if (values.notes.length > 2000) return "Notes must be 2,000 characters or fewer.";
    return "";
}

// Mirrors Dashboard selection: updatedAt, createdAt, then descending record ID.
export function calculateDSAProgress(records) {
    if (!Array.isArray(records)) return null;
    let solved = 0;
    let target = 0;
    for (const record of getCanonicalDSATopics(records)) {
        const limit = record.problemTarget;
        const count = record.problemsSolved ?? 0;
        if (typeof limit !== "number" || !Number.isFinite(limit) || limit <= 0 ||
            typeof count !== "number" || !Number.isFinite(count) || count < 0) return null;
        target += limit;
        solved += Math.min(count, limit);
    }
    const percentage = target ? solved / target * 100 : 0;
    return { solved, target, remaining: target - solved, percentage, displayedPercentage: Math.round(percentage) };
}
