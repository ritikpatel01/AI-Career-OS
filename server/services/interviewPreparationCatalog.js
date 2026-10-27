const questions = require("../../client/src/data/interviewPreparation.json");
const categories = [...new Set(questions.map(question => question.category))];
const questionIds = questions.map(question => question.id);
const stamp = value => new Date(value || 0).getTime() || 0;

function personalRecords(records) {
    const map = new Map();
    for (const record of [...records].sort((a, b) => stamp(b.updatedAt) - stamp(a.updatedAt) || String(b._id).localeCompare(String(a._id)))) {
        if (questionIds.includes(record.questionId) && !map.has(record.questionId)) map.set(record.questionId, record);
    }
    return map;
}

function preparationProgress(records) {
    const practiced = [...personalRecords(records).values()].filter(record => record.practiced === true).length;
    return { total: questions.length, practiced, remaining: questions.length - practiced,
        percentage: questions.length ? practiced / questions.length * 100 : 0 };
}

function buildPreparationPage(records, query) {
    const map = personalRecords(records);
    const all = questions.map(question => {
        const record = map.get(question.id);
        return { ...question, personal: {
            answer: record?.answer || "", notes: record?.notes || "", practiced: record?.practiced === true,
            bookmarked: record?.bookmarked === true, revisionStatus: record?.revisionStatus || "not-needed",
            lastPracticedAt: record?.lastPracticedAt || null
        } };
    });
    const search = query.search.toLowerCase();
    const filtered = all.filter(question =>
        (!search || `${question.question} ${question.category}`.toLowerCase().includes(search)) &&
        (query.category === "all" || question.category === query.category) &&
        (query.difficulty === "all" || question.difficulty === query.difficulty) &&
        (query.status === "all" ||
            (query.status === "practiced" && question.personal.practiced) ||
            (query.status === "unpracticed" && !question.personal.practiced) ||
            (query.status === "bookmarked" && question.personal.bookmarked) ||
            (query.status === "revision" && question.personal.revisionStatus === "needs-revision"))
    );
    if (query.sort === "name") filtered.sort((a, b) => a.question.localeCompare(b.question));
    if (query.sort === "recent") filtered.sort((a, b) => stamp(b.personal.lastPracticedAt) - stamp(a.personal.lastPracticedAt));
    if (query.sort === "difficulty") filtered.sort((a, b) => ["Easy", "Medium", "Hard"].indexOf(a.difficulty) - ["Easy", "Medium", "Hard"].indexOf(b.difficulty));
    return {
        questions: filtered.slice((query.page - 1) * query.limit, query.page * query.limit),
        pagination: { page: query.page, limit: query.limit, total: filtered.length, pages: Math.ceil(filtered.length / query.limit) },
        overview: {
            ...preparationProgress(records),
            categories: categories.map(category => {
                const items = all.filter(question => question.category === category);
                const practiced = items.filter(question => question.personal.practiced).length;
                return { category, total: items.length, practiced, percentage: practiced / items.length * 100 };
            }),
            recent: all.filter(question => question.personal.lastPracticedAt && question.personal.practiced)
                .sort((a, b) => stamp(b.personal.lastPracticedAt) - stamp(a.personal.lastPracticedAt)).slice(0, 5)
        }
    };
}

module.exports = { questions, categories, questionIds, preparationProgress, buildPreparationPage };
