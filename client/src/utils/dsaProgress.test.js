import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { calculateDSAProgress, getCanonicalDSATopics, filterDSATopics, validateDSAForm } from "./dsaProgress.js";
import canonical from "../data/dsaRoadmap.json" with { type: "json" };

test("all canonical topics and missing targets contribute once; empty progress is 0/485", () => {
    assert.equal(canonical.length, 20);
    assert.deepEqual(calculateDSAProgress([]), { solved: 0, target: 485, remaining: 485, percentage: 0, displayedPercentage: 0 });
});

test("known solved counts calculate 54/485, displayed as 11%, with 431 remaining", () => {
    const counts = { Arrays: 5, Strings: 5, "Linked List": 15, Stack: 6, Queue: 6, Hashing: 6, Sorting: 5, "Dynamic Programming": 6 };
    const records = canonical.map(item => ({ ...item, problemsSolved: counts[item.topic] || 0 }));
    const result = calculateDSAProgress(records);
    assert.equal(result.solved, 54);
    assert.equal(result.target, 485);
    assert.equal(result.remaining, 431);
    assert.equal(result.percentage, 54 / 485 * 100);
    assert.equal(result.displayedPercentage, 11);
});

test("duplicate selection matches Dashboard including timestamp and ID ties, caps counts, and ignores noncanonical names", () => {
    const records = [
        { _id: "z", topic: "Arrays", problemTarget: 30, problemsSolved: 30, updatedAt: "2026-01-01" },
        { _id: "a", topic: "Arrays", problemTarget: 40, problemsSolved: 20, updatedAt: "2026-02-01", createdAt: "2026-01-01" },
        { _id: "b", topic: "Arrays", problemTarget: 40, problemsSolved: 99, updatedAt: "2026-02-01", createdAt: "2026-01-01" },
        { topic: "Not canonical", problemTarget: 1000, problemsSolved: 1000 }
    ];
    const original = JSON.stringify(records);
    const result = calculateDSAProgress(records);
    assert.equal(result.solved, 40);
    assert.equal(result.target, 495);
    assert.deepEqual(result, calculateDSAProgress([...records].reverse()));
    assert.equal(JSON.stringify(records), original);
    const require = createRequire(import.meta.url);
    const { calculateSummary } = require("../../../server/services/dashboardProgressService.js");
    const dashboard = calculateSummary({ dsa: records, skills: [], roadmaps: [], manual: [], curriculum: { phases: [] } }).find(item => item.category === "dsa");
    assert.equal(result.percentage, dashboard.percentage);
});

test("invalid selected values are unavailable, and exact completion has no remaining problems", () => {
    for (const record of [
        { topic: "Arrays", problemTarget: 0, problemsSolved: 1 },
        { topic: "Arrays", problemTarget: 30, problemsSolved: -1 },
        { topic: "Arrays", problemTarget: 30, problemsSolved: NaN }
    ]) assert.equal(calculateDSAProgress([record]), null);
    assert.equal(calculateDSAProgress(null), null);
    const result = calculateDSAProgress(canonical.map(item => ({ ...item, problemsSolved: item.problemTarget })));
    assert.equal(result.percentage, 100);
    assert.equal(result.remaining, 0);
});

test("search, study-status filters, and ratio sorting preserve canonical records without mutation", () => {
    const topics = getCanonicalDSATopics([
        { topic: "Arrays", problemTarget: 30, problemsSolved: 15, status: "in-progress", notes: "review boundaries" },
        { topic: "Strings", problemTarget: 25, problemsSolved: 25, status: "completed" }
    ]);
    assert.equal(topics.length, 20);
    assert.equal(filterDSATopics(topics, "  BOUNDARIES ")[0].topic, "Arrays");
    assert.equal(filterDSATopics(topics, "", "completed").length, 1);
    assert.equal(filterDSATopics(topics, "missing query").length, 0);
    assert.equal(filterDSATopics(topics, "", "all", "progress-high")[0].topic, "Strings");
    assert.equal(filterDSATopics(topics, "", "all", "name")[0].topic, "Arrays");
    assert.equal(topics[0].topic, "Arrays");
    assert.equal(topics[2].topic, "Linked List");
});

test("save validation enforces whole counts within selected target and bounded notes", () => {
    const topic = { problemTarget: 30 };
    const valid = { problemsSolved: "15", difficulty: "easy", status: "in-progress", notes: "" };
    assert.equal(validateDSAForm(valid, topic), "");
    for (const problemsSolved of ["", "-1", "1.5", "31", "Infinity", "bad"]) assert.ok(validateDSAForm({ ...valid, problemsSolved }, topic));
    assert.ok(validateDSAForm({ ...valid, notes: "a".repeat(2001) }, topic));
    assert.ok(validateDSAForm(valid, null));
    assert.ok(validateDSAForm(valid, { problemTarget: 0 }));
});
