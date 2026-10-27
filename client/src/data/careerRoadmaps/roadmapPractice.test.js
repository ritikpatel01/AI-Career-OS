import test from "node:test";
import assert from "node:assert/strict";
import { ROADMAPS } from "./careerRoadmapData.js";
import {
    buildLessonPracticeExercises,
    ROADMAP_EXERCISES,
    ROADMAP_PRACTICE_LESSONS
} from "./roadmapLearningContent.js";

const getTopicName = (topic) => typeof topic === "string"
    ? topic
    : topic?.title || topic?.name || topic?.topic || topic?.label;

test("lesson-backed exercises have stable IDs and complete practice fields", () => {
    for (const [career, roadmap] of Object.entries(ROADMAPS)) {
        for (const phase of roadmap.phases) {
            const exercises = buildLessonPracticeExercises(career, phase.title, phase.topics);
            const lessonTopics = phase.topics
                .map(getTopicName)
                .filter((topic) => ROADMAP_PRACTICE_LESSONS[career]?.[phase.title]?.[topic]);

            assert.equal(exercises.length, lessonTopics.length * 3);
            assert.deepEqual(
                exercises.map(({ id }) => id),
                buildLessonPracticeExercises(career, phase.title, phase.topics).map(({ id }) => id)
            );
            assert.equal(new Set(exercises.map(({ id }) => id)).size, exercises.length);

            for (const exercise of exercises) {
                assert.equal(exercise.career, career);
                assert.equal(exercise.phase, phase.title);
                assert.ok(phase.topics.map(getTopicName).includes(exercise.topic));
                assert.ok(exercise.problemStatement);
                assert.ok(exercise.learningObjectives.length > 0);
                assert.ok(exercise.requirements.length > 0);
                assert.ok(exercise.examples.length >= 2);
                assert.ok(exercise.tests.length >= 2);
                assert.ok(exercise.hints.length >= 2);
                assert.ok(exercise.solutionCode);
                assert.ok(exercise.solutionLines.length > 0);
            }
        }
    }
});

test("authored and lesson-backed IDs do not collide within a phase", () => {
    for (const [career, roadmap] of Object.entries(ROADMAPS)) {
        for (const phase of roadmap.phases) {
            const authored = ROADMAP_EXERCISES[career]?.[phase.title] || [];
            const guided = buildLessonPracticeExercises(career, phase.title, phase.topics);
            const ids = [...authored, ...guided].map(({ id }) => id);
            assert.equal(new Set(ids).size, ids.length, `${career} / ${phase.title}`);
        }
    }
});
