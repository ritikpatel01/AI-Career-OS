import test from "node:test";
import assert from "node:assert/strict";
import { ROADMAPS } from "./careerRoadmapData.js";
import { ROADMAP_EXERCISES } from "./roadmapLearningContent.js";
import { ROADMAP_PRACTICE_BATCHES, ROADMAP_PRACTICE_BATCH_MANIFEST } from "./roadmapPracticeBatches.js";
import { buildRoadmapPracticeCoverage, getExerciseContentIssues } from "./roadmapPracticeCoverage.js";
import { filterPracticeExercises, getPracticeCompletionKey } from "./roadmapPracticeUtils.js";

test("coverage manifest enumerates every current phase and topic without masking gaps", () => {
    const report = buildRoadmapPracticeCoverage();
    const expectedTopics = Object.values(ROADMAPS).flatMap((career) => career.phases.flatMap((phase) => phase.topics)).length;
    assert.equal(report.totals.phases, 34);
    assert.equal(report.totals.topics, expectedTopics);
    assert.equal(report.phases.length, 34);
    assert.ok(report.phases.every((phase) => phase.topics.length === phase.topicCount));
    assert.equal(report.totals.incompleteExercises, 0, "published exercises must satisfy the content rubric");
    const uncovered = report.phases.flatMap((phase) => phase.topics).filter((topic) => topic.publishedExerciseCount === 0);
    assert.equal(report.totals.topicsWithoutUsableExercises, uncovered.length, "uncovered topics must match the actual catalog");
    assert.deepEqual(report.totals.duplicateExerciseIds, []);
});

test("coverage still exposes a missing Applications topic after the catalog reaches full coverage", () => {
    const batch = ROADMAP_PRACTICE_BATCHES["AI Engineer"]["AI Applications"];
    const original = [...batch];
    try {
        // Change only an in-memory fixture; restore the exact published array below.
        batch.splice(0, batch.length, ...original.filter((exercise) => exercise.topic !== "Deployment"));
        const report = buildRoadmapPracticeCoverage();
        const phase = report.phases.find((item) => item.career === "AI Engineer" && item.phase === "AI Applications");
        const topic = phase.topics.find((item) => item.topic === "Deployment");
        assert.equal(phase.status, "incomplete");
        assert.equal(topic.publishedExerciseCount, 0);
        assert.deepEqual(topic.missingByDifficulty, { Easy: 3, Medium: 3, Hard: 3 });
        assert.equal(report.totals.topicsWithoutUsableExercises, 1);
        assert.equal(report.totals.topicsMeetingFullDifficultyTarget, report.totals.topics - 1);
    } finally {
        batch.splice(0, batch.length, ...original);
    }
    assert.equal(buildRoadmapPracticeCoverage().totals.topicsWithoutUsableExercises, 0);
});

test("placeholder detection rejects TODO instructions without flagging the Todo Application topic", () => {
    const todo = ROADMAP_PRACTICE_BATCHES["Full Stack Developer"]["Real-World Projects"].find((exercise) => exercise.topic === "Todo Application");
    assert.deepEqual(getExerciseContentIssues(todo, "Todo Application"), []);
    const unfinished = { ...todo, solutionCode: "TODO: implement the persistence handler before publishing." };
    assert.ok(getExerciseContentIssues(unfinished, "Todo Application").includes("placeholder-content"));
});

test("Web Fundamentals meets the three-per-difficulty target for each topic", () => {
    const report = buildRoadmapPracticeCoverage();
    const phase = report.phases.find((item) => item.career === "Full Stack Developer" && item.phase === "Web Fundamentals");
    assert.equal(phase.status, "complete");
    assert.equal(phase.topicsMeetingThreeExerciseTarget, phase.topicCount);
    assert.ok(phase.topics.every((topic) => topic.publishedExerciseCount >= 3));
    const exercises = [
        ...(ROADMAP_EXERCISES["Full Stack Developer"]["Web Fundamentals"] || []),
        ...ROADMAP_PRACTICE_BATCHES["Full Stack Developer"]["Web Fundamentals"]
    ];
    assert.equal(phase.publishedExerciseCount, 75);
    assert.equal(phase.topicsMeetingFullDifficultyTarget, 8);
    assert.equal(new Set(exercises.map((exercise) => exercise.id)).size, exercises.length);
    for (const exercise of exercises) {
        assert.ok(exercise.problemStatement.length >= 100);
        assert.ok(exercise.requirements.length >= 2);
        assert.ok(exercise.examples.length >= 2);
        assert.ok(exercise.tests.length >= 2);
        assert.ok(exercise.hints.length >= 2);
        assert.ok(exercise.solutionCode.length >= 60);
        assert.ok(exercise.solutionLines.length >= 2);
    }
    for (const topic of phase.topics) {
        for (const difficulty of ["Easy", "Medium", "Hard"]) assert.ok(topic.difficultyCounts[difficulty] >= 3, `${topic.topic} needs at least three ${difficulty} exercises`);
    }
});

test("HTML & CSS meets the full difficulty target across all ten topics", () => {
    const report = buildRoadmapPracticeCoverage();
    const phase = report.phases.find((item) => item.career === "Full Stack Developer" && item.phase === "HTML & CSS");
    const batch = ROADMAP_PRACTICE_BATCHES["Full Stack Developer"]["HTML & CSS"];
    const metadata = ROADMAP_PRACTICE_BATCH_MANIFEST["Full Stack Developer"]["HTML & CSS"];
    assert.equal(batch.length, 90);
    assert.equal(metadata.status, "complete");
    assert.equal(phase.publishedExerciseCount, 90);
    assert.equal(phase.topicsMeetingThreeExerciseTarget, 10);
    assert.equal(phase.topicsMeetingFullDifficultyTarget, 10);
    assert.ok(phase.topics.every((topic) => topic.targetReached));
    assert.equal(new Set(batch.map((exercise) => exercise.id)).size, batch.length);
});

test("JavaScript meets the three-per-difficulty target for every topic", () => {
    const report = buildRoadmapPracticeCoverage();
    const phase = report.phases.find((item) => item.career === "Full Stack Developer" && item.phase === "JavaScript");
    const exercises = ROADMAP_PRACTICE_BATCHES["Full Stack Developer"].JavaScript;
    assert.equal(phase.topicCount, 15);
    assert.equal(exercises.length, 90);
    assert.equal(phase.topicsMeetingFullDifficultyTarget, 15);
    assert.equal(phase.status, "complete");
    assert.equal(new Set(exercises.map((exercise) => exercise.id)).size, exercises.length);
    for (const topic of phase.topics) {
        for (const difficulty of ["Easy", "Medium", "Hard"]) assert.ok(topic.difficultyCounts[difficulty] >= 3, `${topic.topic} needs at least three ${difficulty} exercises`);
        assert.equal(topic.missingExerciseCount, 0);
        assert.ok(topic.exercises.every((exercise) => exercise.issues.length === 0), `${topic.topic} must pass the published-content rubric`);
        assert.equal(exercises.filter((exercise) => exercise.topic === topic.topic).length, 6);
    }
});

test("the React.js phase meets the three-per-difficulty target for every topic", () => {
    const report = buildRoadmapPracticeCoverage();
    const phase = report.phases.find((item) => item.career === "Full Stack Developer" && item.phase === "React.js");
    const exercises = ROADMAP_PRACTICE_BATCHES["Full Stack Developer"]["React.js"];
    assert.equal(phase.topicCount, 12);
    assert.equal(exercises.length, 108);
    assert.equal(phase.publishedExerciseCount, 108);
    assert.equal(phase.topicsMeetingThreeExerciseTarget, 12);
    assert.equal(phase.topicsMeetingFullDifficultyTarget, 12);
    assert.equal(phase.status, "complete");
    assert.equal(new Set(exercises.map((exercise) => exercise.id)).size, exercises.length);
    for (const topic of phase.topics) {
        for (const difficulty of ["Easy", "Medium", "Hard"]) assert.ok(topic.difficultyCounts[difficulty] >= 3, `${topic.topic} needs at least three ${difficulty} exercises`);
        assert.deepEqual(topic.missingByDifficulty, { Easy: 0, Medium: 0, Hard: 0 });
        assert.ok(topic.exercises.every((exercise) => exercise.issues.length === 0), `${topic.topic} must pass the published-content rubric`);
        assert.equal(exercises.filter((exercise) => exercise.topic === topic.topic).length, 9);
    }
});

test("the Backend Development phase meets the three-per-difficulty target for every topic", () => {
    const report = buildRoadmapPracticeCoverage();
    const phase = report.phases.find((item) => item.career === "Full Stack Developer" && item.phase === "Backend Development");
    const exercises = ROADMAP_PRACTICE_BATCHES["Full Stack Developer"]["Backend Development"];
    assert.equal(phase.topicCount, 14);
    assert.equal(exercises.length, 126);
    assert.equal(phase.publishedExerciseCount, 126);
    assert.equal(phase.topicsMeetingThreeExerciseTarget, 14);
    assert.equal(phase.topicsMeetingFullDifficultyTarget, 14);
    assert.equal(phase.status, "complete");
    assert.equal(new Set(exercises.map((exercise) => exercise.id)).size, exercises.length);
    for (const topic of phase.topics) {
        assert.deepEqual(topic.difficultyCounts, { Easy: 3, Medium: 3, Hard: 3 });
        assert.ok(topic.exercises.every((exercise) => exercise.issues.length === 0), `${topic.topic} must pass the published-content rubric`);
        assert.equal(exercises.filter((exercise) => exercise.topic === topic.topic).length, 9);
    }
});

test("Real-World Projects meets the full difficulty target for every product topic", () => {
    const report = buildRoadmapPracticeCoverage();
    const phase = report.phases.find((item) => item.career === "Full Stack Developer" && item.phase === "Real-World Projects");
    const exercises = ROADMAP_PRACTICE_BATCHES["Full Stack Developer"]["Real-World Projects"];
    const metadata = ROADMAP_PRACTICE_BATCH_MANIFEST["Full Stack Developer"]["Real-World Projects"];
    assert.equal(phase.topicCount, 9);
    assert.equal(exercises.length, 82);
    assert.equal(phase.publishedExerciseCount, 82);
    assert.equal(metadata.status, "complete");
    assert.equal(phase.topicsMeetingFullDifficultyTarget, 9);
    assert.equal(phase.status, "complete");
    assert.equal(new Set(exercises.map((exercise) => exercise.id)).size, exercises.length);
    for (const topic of phase.topics) {
        for (const difficulty of ["Easy", "Medium", "Hard"]) assert.ok(topic.difficultyCounts[difficulty] >= 3, `${topic.topic} needs at least three ${difficulty} exercises`);
        assert.equal(topic.missingExerciseCount, 0);
        assert.ok(topic.exercises.every((exercise) => exercise.issues.length === 0), `${topic.topic} must pass the published-content rubric`);
        assert.ok(exercises.filter((exercise) => exercise.topic === topic.topic).length >= 9);
    }
});

test("the Databases phase meets the three-per-difficulty target for every topic", () => {
    const report = buildRoadmapPracticeCoverage();
    const phase = report.phases.find((item) => item.career === "Full Stack Developer" && item.phase === "Databases");
    const exercises = ROADMAP_PRACTICE_BATCHES["Full Stack Developer"].Databases;
    assert.equal(phase.topicCount, 12);
    assert.equal(exercises.length, 108);
    assert.equal(phase.publishedExerciseCount, 108);
    assert.equal(phase.topicsMeetingFullDifficultyTarget, 12);
    assert.equal(phase.status, "complete");
    assert.equal(new Set(exercises.map((exercise) => exercise.id)).size, exercises.length);
    for (const topic of phase.topics) {
        assert.deepEqual(topic.difficultyCounts, { Easy: 3, Medium: 3, Hard: 3 });
        assert.equal(topic.missingExerciseCount, 0);
        assert.ok(topic.exercises.every((exercise) => exercise.issues.length === 0), `${topic.topic} must pass the published-content rubric`);
        assert.equal(exercises.filter((exercise) => exercise.topic === topic.topic).length, 9);
    }
});

test("the Authentication & Security phase meets the target without publishing incomplete content", () => {
    const report = buildRoadmapPracticeCoverage();
    const phase = report.phases.find((item) => item.career === "Full Stack Developer" && item.phase === "Authentication & Security");
    const exercises = ROADMAP_PRACTICE_BATCHES["Full Stack Developer"]["Authentication & Security"];
    assert.equal(phase.topicCount, 10);
    assert.equal(exercises.length, 90);
    assert.equal(phase.publishedExerciseCount, 90);
    assert.equal(phase.topicsMeetingFullDifficultyTarget, 10);
    assert.equal(phase.status, "complete");
    assert.equal(new Set(exercises.map((exercise) => exercise.id)).size, exercises.length);
    for (const topic of phase.topics) {
        assert.deepEqual(topic.difficultyCounts, { Easy: 3, Medium: 3, Hard: 3 });
        assert.equal(topic.missingExerciseCount, 0);
        assert.ok(topic.exercises.every((exercise) => exercise.issues.length === 0), `${topic.topic} must pass the published-content rubric`);
        assert.equal(exercises.filter((exercise) => exercise.topic === topic.topic).length, 9);
    }
});

test("the Testing phase meets the three-per-difficulty target for all topics", () => {
    const report = buildRoadmapPracticeCoverage();
    const phase = report.phases.find((item) => item.career === "Full Stack Developer" && item.phase === "Testing");
    const exercises = ROADMAP_PRACTICE_BATCHES["Full Stack Developer"].Testing;
    assert.equal(phase.topicCount, 8);
    assert.equal(exercises.length, 72);
    assert.equal(phase.publishedExerciseCount, 72);
    assert.equal(phase.topicsMeetingFullDifficultyTarget, 8);
    assert.equal(phase.status, "complete");
    assert.equal(new Set(exercises.map((exercise) => exercise.id)).size, exercises.length);
    for (const topic of phase.topics) {
        assert.deepEqual(topic.difficultyCounts, { Easy: 3, Medium: 3, Hard: 3 });
        assert.ok(topic.exercises.every((exercise) => exercise.issues.length === 0), `${topic.topic} must pass the published-content rubric`);
        assert.equal(exercises.filter((exercise) => exercise.topic === topic.topic).length, 9);
    }
});

test("the DevOps & Deployment phase meets the target for every roadmap topic", () => {
    const report = buildRoadmapPracticeCoverage();
    const phase = report.phases.find((item) => item.career === "Full Stack Developer" && item.phase === "DevOps & Deployment");
    const exercises = ROADMAP_PRACTICE_BATCHES["Full Stack Developer"]["DevOps & Deployment"];
    assert.equal(phase.topicCount, 11);
    assert.equal(exercises.length, 99);
    assert.equal(phase.publishedExerciseCount, 99);
    assert.equal(phase.topicsMeetingFullDifficultyTarget, 11);
    assert.equal(phase.status, "complete");
    assert.equal(new Set(exercises.map((exercise) => exercise.id)).size, exercises.length);
    for (const topic of phase.topics) {
        assert.deepEqual(topic.difficultyCounts, { Easy: 3, Medium: 3, Hard: 3 });
        assert.ok(topic.exercises.every((exercise) => exercise.issues.length === 0), `${topic.topic} must pass the published-content rubric`);
    }
});

test("the Web Security phase meets the target for every topic without duplicate IDs", () => {
    const report = buildRoadmapPracticeCoverage();
    const phase = report.phases.find((item) => item.career === "Full Stack Developer" && item.phase === "Web Security");
    const exercises = ROADMAP_PRACTICE_BATCHES["Full Stack Developer"]["Web Security"];
    assert.equal(phase.topicCount, 9);
    assert.equal(exercises.length, 81);
    assert.equal(phase.publishedExerciseCount, 81);
    assert.equal(phase.topicsMeetingFullDifficultyTarget, 9);
    assert.equal(phase.status, "complete");
    assert.equal(new Set(exercises.map((exercise) => exercise.id)).size, exercises.length);
    for (const topic of phase.topics) {
        assert.deepEqual(topic.difficultyCounts, { Easy: 3, Medium: 3, Hard: 3 });
        assert.ok(topic.exercises.every((exercise) => exercise.issues.length === 0), `${topic.topic} must pass the published-content rubric`);
    }
});

test("the System Design phase meets the full difficulty target across all topics", () => {
    const report = buildRoadmapPracticeCoverage();
    const phase = report.phases.find((item) => item.career === "Full Stack Developer" && item.phase === "System Design");
    const exercises = ROADMAP_PRACTICE_BATCHES["Full Stack Developer"]["System Design"];
    assert.equal(phase.topicCount, 10);
    assert.equal(exercises.length, 90);
    assert.equal(phase.publishedExerciseCount, 90);
    assert.equal(phase.topicsMeetingFullDifficultyTarget, 10);
    assert.equal(phase.status, "complete");
    assert.equal(new Set(exercises.map((exercise) => exercise.id)).size, exercises.length);
    for (const topic of phase.topics) {
        assert.deepEqual(topic.difficultyCounts, { Easy: 3, Medium: 3, Hard: 3 });
        assert.ok(topic.exercises.every((exercise) => exercise.issues.length === 0), `${topic.topic} must pass the published-content rubric`);
    }
});

test("the DSA phase has nine authored exercises at every roadmap topic and difficulty", () => {
    const report = buildRoadmapPracticeCoverage();
    const phase = report.phases.find((item) => item.career === "Full Stack Developer" && item.phase === "DSA");
    const exercises = ROADMAP_PRACTICE_BATCHES["Full Stack Developer"].DSA;
    assert.equal(phase.topicCount, 13);
    assert.equal(exercises.length, 117);
    assert.equal(phase.publishedExerciseCount, 117);
    assert.equal(phase.topicsMeetingFullDifficultyTarget, 13);
    assert.equal(phase.status, "complete");
    assert.equal(new Set(exercises.map((exercise) => exercise.id)).size, 117);
    for (const topic of phase.topics) {
        assert.deepEqual(topic.difficultyCounts, { Easy: 3, Medium: 3, Hard: 3 });
        assert.equal(topic.missingExerciseCount, 0);
        assert.ok(topic.exercises.every((exercise) => exercise.issues.length === 0), `${topic.topic} must pass the content rubric`);
        assert.equal(exercises.filter((exercise) => exercise.topic === topic.topic).length, 9);
    }
    const completionKey = (exercise) => getPracticeCompletionKey({ title: "DSA" }, exercise);
    const graphHard = filterPracticeExercises({ items: exercises, topic: "Graphs", difficulty: "hard", completionKey });
    assert.equal(graphHard.length, 3);
    assert.ok(graphHard.every((exercise) => exercise.phase === "DSA" && exercise.topic === "Graphs" && exercise.difficulty === "Hard"));
    const completedKey = getPracticeCompletionKey({ title: "DSA" }, graphHard[0]);
    assert.equal(completedKey, `dsa::${graphHard[0].id}`);
    assert.deepEqual(filterPracticeExercises({ items: graphHard, status: "completed", completedKeys: [completedKey], completionKey }).map((exercise) => exercise.id), [graphHard[0].id]);
});

test("Interview Preparation covers every topic with three useful prompts per difficulty", () => {
    const report = buildRoadmapPracticeCoverage();
    const phase = report.phases.find((item) => item.career === "Full Stack Developer" && item.phase === "Interview Preparation");
    const exercises = ROADMAP_PRACTICE_BATCHES["Full Stack Developer"]["Interview Preparation"];
    assert.equal(phase.topicCount, 10);
    assert.equal(exercises.length, 90);
    assert.equal(phase.publishedExerciseCount, 90);
    assert.equal(phase.topicsMeetingFullDifficultyTarget, 10);
    assert.equal(phase.status, "complete");
    assert.equal(new Set(exercises.map((exercise) => exercise.id)).size, 90);
    for (const topic of phase.topics) {
        assert.deepEqual(topic.difficultyCounts, { Easy: 3, Medium: 3, Hard: 3 });
        assert.equal(topic.missingExerciseCount, 0);
        assert.equal(exercises.filter((exercise) => exercise.topic === topic.topic).length, 9);
        assert.ok(topic.exercises.every((exercise) => exercise.issues.length === 0), `${topic.topic} must pass the content rubric`);
    }
    const reactPrompts = filterPracticeExercises({ items: exercises, topic: "React Interview", difficulty: "medium", completionKey: (item) => getPracticeCompletionKey({ title: "Interview Preparation" }, item) });
    assert.equal(reactPrompts.length, 3);
    const key = getPracticeCompletionKey({ title: "Interview Preparation" }, reactPrompts[0]);
    assert.equal(key, `interview-preparation::${reactPrompts[0].id}`);
});

test("Job Preparation covers all career topics with three authored exercises per difficulty", () => {
    const report = buildRoadmapPracticeCoverage();
    const phase = report.phases.find((item) => item.career === "Full Stack Developer" && item.phase === "Job Preparation");
    const exercises = ROADMAP_PRACTICE_BATCHES["Full Stack Developer"]["Job Preparation"];
    assert.equal(phase.topicCount, 10);
    assert.equal(exercises.length, 90);
    assert.equal(phase.publishedExerciseCount, 90);
    assert.equal(phase.topicsMeetingFullDifficultyTarget, 10);
    assert.equal(phase.status, "complete");
    assert.equal(new Set(exercises.map((exercise) => exercise.id)).size, 90);
    for (const topic of phase.topics) {
        assert.deepEqual(topic.difficultyCounts, { Easy: 3, Medium: 3, Hard: 3 });
        assert.equal(topic.missingExerciseCount, 0);
        assert.equal(exercises.filter((exercise) => exercise.topic === topic.topic).length, 9);
        assert.ok(topic.exercises.every((exercise) => exercise.issues.length === 0), `${topic.topic} must pass the content rubric`);
    }
});

test("Frontend Developer Web Fundamentals meets all topic and difficulty targets", () => {
    const report = buildRoadmapPracticeCoverage();
    const phase = report.phases.find((item) => item.career === "Frontend Developer" && item.phase === "Web Fundamentals");
    const exercises = ROADMAP_PRACTICE_BATCHES["Frontend Developer"]["Web Fundamentals"];
    assert.equal(phase.topicCount, 5);
    assert.equal(exercises.length, 45);
    assert.equal(phase.publishedExerciseCount, 45);
    assert.equal(phase.topicsMeetingFullDifficultyTarget, 5);
    assert.equal(phase.status, "complete");
    assert.equal(new Set(exercises.map((exercise) => exercise.id)).size, 45);
    for (const topic of phase.topics) {
        assert.deepEqual(topic.difficultyCounts, { Easy: 3, Medium: 3, Hard: 3 });
        assert.equal(topic.missingExerciseCount, 0);
        assert.equal(exercises.filter((exercise) => exercise.topic === topic.topic).length, 9);
        assert.ok(topic.exercises.every((exercise) => exercise.issues.length === 0), `${topic.topic} must pass the content rubric`);
    }
});

test("Frontend Developer HTML & CSS meets all topic and difficulty targets", () => {
    const report = buildRoadmapPracticeCoverage();
    const phase = report.phases.find((item) => item.career === "Frontend Developer" && item.phase === "HTML & CSS");
    const exercises = ROADMAP_PRACTICE_BATCHES["Frontend Developer"]["HTML & CSS"];
    assert.equal(phase.topicCount, 8);
    assert.equal(exercises.length, 72);
    assert.equal(phase.publishedExerciseCount, 72);
    assert.equal(phase.topicsMeetingFullDifficultyTarget, 8);
    assert.equal(phase.status, "complete");
    assert.equal(new Set(exercises.map((exercise) => exercise.id)).size, 72);
    for (const topic of phase.topics) {
        assert.deepEqual(topic.difficultyCounts, { Easy: 3, Medium: 3, Hard: 3 });
        assert.equal(topic.missingExerciseCount, 0);
        assert.equal(exercises.filter((exercise) => exercise.topic === topic.topic).length, 9);
        assert.ok(topic.exercises.every((exercise) => exercise.issues.length === 0), `${topic.topic} must pass the content rubric`);
    }
});

test("Frontend Developer JavaScript covers all nine topics at each difficulty", () => {
    const report = buildRoadmapPracticeCoverage();
    const phase = report.phases.find((item) => item.career === "Frontend Developer" && item.phase === "JavaScript");
    const exercises = ROADMAP_PRACTICE_BATCHES["Frontend Developer"].JavaScript;
    assert.equal(phase.topicCount, 9);
    assert.equal(exercises.length, 81);
    assert.equal(phase.publishedExerciseCount, 81);
    assert.equal(phase.topicsMeetingFullDifficultyTarget, 9);
    assert.equal(phase.status, "complete");
    assert.equal(new Set(exercises.map((exercise) => exercise.id)).size, 81);
    for (const topic of phase.topics) {
        assert.deepEqual(topic.difficultyCounts, { Easy: 3, Medium: 3, Hard: 3 });
        assert.equal(topic.missingExerciseCount, 0);
        assert.equal(exercises.filter((exercise) => exercise.topic === topic.topic).length, 9);
        assert.ok(topic.exercises.every((exercise) => exercise.issues.length === 0), `${topic.topic} must pass the content rubric`);
    }
});

test("Frontend Developer React covers every topic at each difficulty", () => {
    const report = buildRoadmapPracticeCoverage();
    const phase = report.phases.find((item) => item.career === "Frontend Developer" && item.phase === "React");
    const exercises = ROADMAP_PRACTICE_BATCHES["Frontend Developer"].React;
    const metadata = ROADMAP_PRACTICE_BATCH_MANIFEST["Frontend Developer"].React;
    assert.equal(phase.topicCount, 8);
    assert.equal(phase.publishedExerciseCount, 72);
    assert.equal(exercises.length, 55);
    assert.equal(metadata.status, "complete");
    assert.equal(phase.topicsMeetingFullDifficultyTarget, 8);
    assert.equal(phase.status, "complete");
    assert.equal(new Set(exercises.map((exercise) => exercise.id)).size, 55);
    for (const topic of phase.topics) {
        assert.deepEqual(topic.difficultyCounts, { Easy: 3, Medium: 3, Hard: 3 });
        assert.equal(topic.missingExerciseCount, 0);
        assert.equal(topic.publishedExerciseCount, 9);
        assert.ok(topic.exercises.every((exercise) => exercise.issues.length === 0), `${topic.topic} must pass the content rubric`);
    }
});

test("Frontend Developer Advanced Frontend covers all topics at each difficulty", () => {
    const report = buildRoadmapPracticeCoverage();
    const phase = report.phases.find((item) => item.career === "Frontend Developer" && item.phase === "Advanced Frontend");
    const exercises = ROADMAP_PRACTICE_BATCHES["Frontend Developer"]["Advanced Frontend"];
    const metadata = ROADMAP_PRACTICE_BATCH_MANIFEST["Frontend Developer"]["Advanced Frontend"];
    assert.equal(phase.topicCount, 7);
    assert.equal(phase.publishedExerciseCount, 63);
    assert.equal(exercises.length, 63);
    assert.equal(metadata.status, "complete");
    assert.equal(phase.topicsMeetingFullDifficultyTarget, 7);
    assert.equal(phase.status, "complete");
    assert.equal(new Set(exercises.map((exercise) => exercise.id)).size, 63);
    for (const topic of phase.topics) {
        assert.deepEqual(topic.difficultyCounts, { Easy: 3, Medium: 3, Hard: 3 });
        assert.equal(topic.publishedExerciseCount, 9);
        assert.equal(topic.missingExerciseCount, 0);
        assert.equal(exercises.filter((exercise) => exercise.topic === topic.topic).length, 9);
        assert.ok(topic.exercises.every((exercise) => exercise.issues.length === 0), `${topic.topic} must pass the content rubric`);
    }
});

test("Frontend Developer Projects & Interview covers all topics at each difficulty", () => {
    const report = buildRoadmapPracticeCoverage();
    const phase = report.phases.find((item) => item.career === "Frontend Developer" && item.phase === "Projects & Interview");
    const exercises = ROADMAP_PRACTICE_BATCHES["Frontend Developer"]["Projects & Interview"];
    const metadata = ROADMAP_PRACTICE_BATCH_MANIFEST["Frontend Developer"]["Projects & Interview"];
    assert.equal(phase.topicCount, 6);
    assert.equal(phase.publishedExerciseCount, 54);
    assert.equal(exercises.length, 54);
    assert.equal(metadata.status, "complete");
    assert.equal(phase.topicsMeetingFullDifficultyTarget, 6);
    assert.equal(phase.status, "complete");
    assert.equal(new Set(exercises.map((exercise) => exercise.id)).size, 54);
    for (const topic of phase.topics) {
        assert.deepEqual(topic.difficultyCounts, { Easy: 3, Medium: 3, Hard: 3 });
        assert.equal(topic.publishedExerciseCount, 9);
        assert.equal(topic.missingExerciseCount, 0);
        assert.equal(exercises.filter((exercise) => exercise.topic === topic.topic).length, 9);
        assert.ok(topic.exercises.every((exercise) => exercise.issues.length === 0), `${topic.topic} must pass the content rubric`);
    }
    const sample = exercises.find((exercise) => exercise.topic === "Portfolio" && exercise.difficulty === "Easy");
    const phaseRef = { title: "Projects & Interview" };
    const key = getPracticeCompletionKey(phaseRef, sample);
    const filtered = filterPracticeExercises({ items: exercises, search: sample.title.split(" ")[0], topic: "Portfolio", difficulty: "easy", completionKey: (exercise) => getPracticeCompletionKey(phaseRef, exercise) });
    assert.ok(filtered.some((exercise) => exercise.id === sample.id));
    assert.ok(filterPracticeExercises({ items: filtered, status: "completed", completedKeys: [key], completionKey: (exercise) => getPracticeCompletionKey(phaseRef, exercise) }).some((exercise) => exercise.id === sample.id));
    assert.ok(!filterPracticeExercises({ items: filtered, status: "remaining", completedKeys: [key], completionKey: (exercise) => getPracticeCompletionKey(phaseRef, exercise) }).some((exercise) => exercise.id === sample.id));
});

test("Backend Developer Programming covers all topics at each difficulty", () => {
    const report = buildRoadmapPracticeCoverage();
    const phase = report.phases.find((item) => item.career === "Backend Developer" && item.phase === "Programming");
    const exercises = ROADMAP_PRACTICE_BATCHES["Backend Developer"].Programming;
    const metadata = ROADMAP_PRACTICE_BATCH_MANIFEST["Backend Developer"].Programming;
    assert.equal(phase.topicCount, 5);
    assert.equal(phase.publishedExerciseCount, 45);
    assert.equal(exercises.length, 45);
    assert.equal(metadata.status, "complete");
    assert.equal(phase.topicsMeetingFullDifficultyTarget, 5);
    assert.equal(phase.status, "complete");
    assert.equal(new Set(exercises.map((exercise) => exercise.id)).size, 45);
    for (const topic of phase.topics) {
        assert.deepEqual(topic.difficultyCounts, { Easy: 3, Medium: 3, Hard: 3 });
        assert.equal(topic.publishedExerciseCount, 9);
        assert.equal(topic.missingExerciseCount, 0);
        assert.equal(exercises.filter((exercise) => exercise.topic === topic.topic).length, 9);
        assert.ok(topic.exercises.every((exercise) => exercise.issues.length === 0), `${topic.topic} must pass the content rubric`);
    }
});

test("practice search, filters, and saved completion keys preserve existing behavior", () => {
    const phase = { title: "Web Fundamentals" };
    const legacy = { id: "new-id", legacyOutlineId: "build-a-calculator", title: "Build a calculator", topic: "JavaScript", difficulty: "Medium", problemStatement: "Validate division by zero.", requirements: ["Reject zero divisor."], conceptsToReview: ["Functions"] };
    const other = { id: "dns-check", title: "Diagnose DNS", topic: "DNS", difficulty: "Easy", problemStatement: "Trace a lookup.", requirements: ["Inspect the record."], conceptsToReview: ["Resolver"] };
    const savedKey = getPracticeCompletionKey(phase, legacy);
    assert.equal(savedKey, "web-fundamentals::build-a-calculator");
    assert.deepEqual(filterPracticeExercises({ items: [legacy, other], search: "division", completionKey: (item) => getPracticeCompletionKey(phase, item) }).map((item) => item.id), ["new-id"]);
    assert.deepEqual(filterPracticeExercises({ items: [legacy, other], difficulty: "easy", completionKey: (item) => getPracticeCompletionKey(phase, item) }).map((item) => item.id), ["dns-check"]);
    assert.deepEqual(filterPracticeExercises({ items: [legacy, other], status: "completed", completedKeys: [savedKey], completionKey: (item) => getPracticeCompletionKey(phase, item) }).map((item) => item.id), ["new-id"]);
    assert.deepEqual(filterPracticeExercises({ items: [legacy, other], status: "remaining", completedKeys: [savedKey], completionKey: (item) => getPracticeCompletionKey(phase, item) }).map((item) => item.id), ["dns-check"]);
});
