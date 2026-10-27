const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { calculateSummary, getDashboardProgress } = require("../services/dashboardProgressService");
const { DSA_ROADMAP } = require("../services/dsaService");

const fixture = overrides => ({ dsa: [], skills: [], roadmaps: [], manual: [],
    curriculum: { phases: [{ topics: ["One", "Two"] }] }, ...overrides });
const category = (data, name) => data.find(item => item.category === name);

test("empty sources return six zero categories without reporting completion", () => {
    const data = calculateSummary(fixture());
    assert.deepEqual(data.map(item => item.category), ["dsa", "skills", "projects", "interview", "roadmap", "career"]);
    assert.ok(data.every(item => item.percentage === 0 && !item.active && !item.complete));
});

test("DSA counts each canonical topic once, uses latest update, caps solved counts and ignores other topics", () => {
    const data = calculateSummary(fixture({ dsa: [
        { topic: "Arrays", problemTarget: 30, problemsSolved: 0, updatedAt: "2026-01-01" },
        { topic: "Arrays", problemTarget: 30, problemsSolved: 99, updatedAt: "2026-02-01" },
        { topic: "Other", problemTarget: 1000, problemsSolved: 1000 }
    ] }));
    const total = DSA_ROADMAP.reduce((sum, item) => sum + item.problemTarget, 0);
    assert.equal(category(data, "dsa").percentage, 30 / total * 100);
    assert.equal(category(data, "dsa").complete, false);
});

test("automatic categories ignore manual overrides; manual snapshots use createdAt and deterministic ID ties", () => {
    const manual = [
        { category: "skills", percentage: 100 },
        { category: "projects", percentage: 10, createdAt: "2026-01-01", updatedAt: "2027-01-01" },
        { category: "projects", percentage: 40, createdAt: "2026-02-01", _id: "a" },
        { category: "projects", percentage: 70, createdAt: "2026-02-01", _id: "b" }
    ];
    for (const records of [manual, [...manual].reverse()]) {
        const data = calculateSummary(fixture({ skills: [{ progress: 25 }, { progress: 75 }], manual: records }));
        assert.equal(category(data, "skills").percentage, 50);
        assert.equal(category(data, "projects").percentage, 70);
    }
});

test("near completion never counts as complete; exact automatic and manual completion do", () => {
    let data = calculateSummary(fixture({ skills: [{ progress: 99.6 }], manual: [{ category: "career", percentage: 99.6 }] }));
    assert.equal(category(data, "skills").complete, false);
    assert.equal(category(data, "career").complete, false);
    data = calculateSummary(fixture({
        skills: [{ progress: 100 }],
        dsa: DSA_ROADMAP.map(item => ({ ...item, problemsSolved: item.problemTarget })),
        roadmaps: [{ steps: [{ title: "One", status: "completed" }, { title: "Two", status: "completed" }] }],
        manual: [{ category: "career", percentage: 100 }]
    }));
    for (const name of ["skills", "dsa", "roadmap", "career"]) assert.equal(category(data, name).complete, true);
});

test("Roadmap counts topics from newest snapshot, not stored percentage or practice keys", () => {
    const data = calculateSummary(fixture({ roadmaps: [
        { createdAt: "2026-01-01", steps: [{ title: "One", status: "completed" }, { title: "Two", status: "completed" }] },
        { createdAt: "2026-02-01", progress: 100, completedPractice: ["example"], steps: [{ title: "One", status: "completed" }] }
    ] }));
    assert.equal(category(data, "roadmap").percentage, 50);
    assert.equal(category(data, "roadmap").complete, false);
});

test("invalid selected sources and curriculum mismatch fail instead of falling back to false zero", () => {
    for (const overrides of [
        { skills: [{ progress: NaN }] },
        { manual: [{ category: "projects", percentage: 101 }] },
        { roadmaps: [{ steps: [{ title: "Wrong", status: "completed" }] }] },
        { dsa: [{ topic: "Arrays", problemTarget: 0, problemsSolved: 0 }] }
    ]) assert.throws(() => calculateSummary(fixture(overrides)));
});

test("summary performs only owner-scoped reads, imports real curriculum, and propagates read failures", async () => {
    const models = ["DSA", "Skill", "Roadmap", "Progress", "Interview"].map(name => require(`../models/${name}`));
    const originals = models.map(model => model.find);
    const filters = [];
    try {
        models.forEach((model, index) => { model.find = filter => {
            filters.push(filter);
            return { select() { return this; }, lean: async () => index === 2 ? [{ steps: [{ title: "How the Internet Works", status: "completed" }] }] : [] };
        }; });
        const data = await getDashboardProgress("owner-fixture");
        assert.equal(filters.length, 5);
        assert.ok(filters.every(filter => filter.user === "owner-fixture"));
        assert.equal(filters[2].title, "AI Career OS progress: Full Stack Developer");
        assert.equal(filters[2].goal, "built-in-career-roadmap-progress");
        const { ROADMAPS } = await import("../../client/src/data/careerRoadmaps/careerRoadmapData.js");
        const count = ROADMAPS["Full Stack Developer"].phases.reduce((sum, phase) => sum + phase.topics.length, 0);
        assert.equal(category(data, "roadmap").percentage, 100 / count);
        models[0].find = () => { throw Error("Database unavailable"); };
        await assert.rejects(getDashboardProgress("owner-fixture"), /Database unavailable/);
    } finally { models.forEach((model, index) => { model.find = originals[index]; }); }
});

test("summary controller uses authenticated identity, disables caching, and redacts failures", async () => {
    for (const fail of [false, true]) {
        const module = { exports: {} };
        vm.runInNewContext(fs.readFileSync(require.resolve("../controllers/progressController"), "utf8"), {
            module, require: name => name.endsWith("dashboardProgressService") ? { getDashboardProgress: async id => {
                assert.equal(id, "authenticated-owner");
                if (fail) throw Error("PRIVATE_DATABASE_DETAIL");
                return [];
            } } : {}
        });
        const res = { set(name, value) { assert.equal(name, "Cache-Control"); assert.equal(value, "private, no-store"); return this; },
            status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
        await module.exports.getDashboardSummary({ user: { userId: "authenticated-owner" }, query: { userId: "other" } }, res);
        assert.equal(res.code, fail ? 503 : 200);
        assert.ok(!JSON.stringify(res.body).includes("PRIVATE_DATABASE_DETAIL"));
    }
});

test("summary route retains authentication and existing progress endpoints", () => {
    const calls = [];
    const auth = () => {};
    const controller = { getDashboardSummary() {}, getAllProgress() {}, createNewProgress() {}, updateProgressData() {} };
    const router = Object.fromEntries(["get", "post", "put"].map(method => [method, (...args) => calls.push([method, ...args])]));
    vm.runInNewContext(fs.readFileSync(require.resolve("../routes/progressRoutes"), "utf8"), {
        module: { exports: {} }, require: name => {
            if (name === "express") return { Router: () => router };
            if (name.includes("progressController")) return controller;
            if (name.includes("authMiddleware")) return auth;
            if (name.includes("validationMiddleware")) return () => () => {};
            return {};
        }
    });
    assert.deepEqual(calls.map(call => [call[0], call[1]]), [["get", "/summary"], ["get", "/"], ["post", "/"], ["put", "/:id"]]);
    assert.ok(calls.every(call => call[2] === auth));
    assert.equal(calls[0][3], controller.getDashboardSummary);
});
