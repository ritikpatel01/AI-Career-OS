import { ROADMAPS } from "./careerRoadmapData.js";
import { buildLessonPracticeExercises, ROADMAP_EXERCISES } from "./roadmapLearningContent.js";
import { ROADMAP_PRACTICE_BATCHES } from "./roadmapPracticeBatches.js";

const placeholderPattern = /coming soon|exercise content is in progress|generic problem statement|lorem ipsum|\bTODO\s*:\s*(?:replace|implement|write|fill|complete)|\bTODO\s+(?:replace|implement|write|fill|complete)/i;
const requiredDifficulties = ["Easy", "Medium", "Hard"];
const words = (value) => String(value || "").toLowerCase().match(/[a-z0-9]+/g) || [];

export const getExerciseContentIssues = (exercise, topic) => {
    const issues = [];
    const requiredText = ["id", "title", "career", "phase", "topic", "difficulty", "estimatedTime", "problemStatement", "approach", "walkthrough", "solutionCode", "followUp"];
    for (const field of requiredText) {
        if (typeof exercise?.[field] !== "string" || exercise[field].trim().length < 3) issues.push(`missing:${field}`);
    }
    const requiredLists = ["learningObjectives", "requirements", "examples", "tests", "hints", "solutionLines", "completionCriteria"];
    for (const field of requiredLists) {
        if (!Array.isArray(exercise?.[field]) || exercise[field].length < 2) issues.push(`missing-or-short:${field}`);
    }
    if ((exercise?.problemStatement || "").trim().length < 100) issues.push("problem-too-short");
    if ((exercise?.approach || "").trim().length < 60) issues.push("approach-too-short");
    if ((exercise?.walkthrough || "").trim().length < 60) issues.push("walkthrough-too-short");
    if ((exercise?.solutionCode || "").trim().length < 60) issues.push("solution-too-short");
    for (const [index, example] of (exercise?.examples || []).entries()) {
        if (example?.input == null || example?.output == null || String(example.output).trim() === "") issues.push(`invalid-example:${index + 1}`);
    }
    const text = [exercise?.title, exercise?.problemStatement, ...(exercise?.requirements || []), ...(exercise?.conceptsToReview || [])].join(" ").toLowerCase();
    const topicTerms = words(topic).filter((word) => word.length > 2).map((word) =>
        word.replace(/ies$/, "y").replace(/ing$/, "").replace(/s$/, "")
    );
    const promptWords = new Set(words(text).map((word) => word.replace(/ies$/, "y").replace(/ing$/, "").replace(/s$/, "")));
    if (topicTerms.length && !topicTerms.some((word) => promptWords.has(word))) issues.push("topic-not-evident-in-prompt");
    const content = [exercise?.title, exercise?.problemStatement, exercise?.approach, exercise?.solutionCode, ...(exercise?.requirements || []), ...(exercise?.hints || [])].join(" ");
    if (placeholderPattern.test(content)) issues.push("placeholder-content");
    if (exercise?.career == null || exercise?.phase == null || exercise?.topic !== topic) issues.push("incorrect-association");
    return issues;
};

export const buildRoadmapPracticeCoverage = () => {
    const phases = [];
    const allIds = new Map();
    let totalTopics = 0;
    let coveredTopics = 0;
    let exerciseCount = 0;
    let incompleteExerciseCount = 0;

    for (const [career, roadmap] of Object.entries(ROADMAPS)) {
        for (const phase of roadmap.phases) {
            const authored = [
                ...(ROADMAP_EXERCISES[career]?.[phase.title] || []),
                ...(ROADMAP_PRACTICE_BATCHES[career]?.[phase.title] || [])
            ].map((exercise) => ({ ...exercise, career, phase: phase.title, source: "authored" }));
            const guided = buildLessonPracticeExercises(career, phase.title, phase.topics)
                .map((exercise) => ({ ...exercise, source: "lesson-guided" }));
            const exercises = [...authored, ...guided];
            const topics = phase.topics.map((topic) => {
                const topicExercises = exercises.filter((exercise) => exercise.topic === topic);
                const assessed = topicExercises.map((exercise) => ({
                    id: exercise.id,
                    title: exercise.title,
                    source: exercise.source,
                    issues: getExerciseContentIssues(exercise, topic)
                }));
                const usable = assessed.filter((exercise) => exercise.issues.length === 0);
                const authoredUsable = usable.filter((exercise) => exercise.source === "authored");
                const difficultyCounts = Object.fromEntries(requiredDifficulties.map((difficulty) => [
                    difficulty,
                    usable.filter((exercise) => exercises.find((candidate) => candidate.id === exercise.id)?.difficulty === difficulty).length
                ]));
                totalTopics += 1;
                if (usable.length) coveredTopics += 1;
                exerciseCount += topicExercises.length;
                incompleteExerciseCount += assessed.length - usable.length;
                for (const item of assessed) {
                    if (allIds.has(item.id)) allIds.get(item.id).push(`${career} / ${phase.title} / ${topic}`);
                    else allIds.set(item.id, [`${career} / ${phase.title} / ${topic}`]);
                }
                return {
                    topic,
                    publishedExerciseCount: usable.length,
                    authoredExerciseCount: authoredUsable.length,
                    guidedExerciseCount: usable.length - authoredUsable.length,
                    difficultyCounts,
                    targetReached: requiredDifficulties.every((difficulty) => difficultyCounts[difficulty] >= 3),
                    missingExerciseCount: requiredDifficulties.reduce((sum, difficulty) => sum + Math.max(0, 3 - difficultyCounts[difficulty]), 0),
                    missingByDifficulty: Object.fromEntries(requiredDifficulties.map((difficulty) => [difficulty, Math.max(0, 3 - difficultyCounts[difficulty])])),
                    exercises: assessed
                };
            });
            phases.push({
                career,
                phase: phase.title,
                topicCount: topics.length,
                publishedExerciseCount: topics.reduce((sum, topic) => sum + topic.publishedExerciseCount, 0),
                topicsMeetingThreeExerciseTarget: topics.filter((topic) => topic.publishedExerciseCount >= 3).length,
                topicsMeetingFullDifficultyTarget: topics.filter((topic) => topic.targetReached).length,
                topics,
                status: topics.every((topic) => topic.targetReached) ? "complete" : "incomplete"
            });
        }
    }

    return {
        generatedAt: new Date().toISOString(),
        rubric: "An exercise is counted only when its prompt is substantive and topic-associated, its learning fields/examples/tests/hints/solution are present, and no placeholder marker is found. Guided lesson activities are reported separately from authored exercises.",
        totals: {
            careers: Object.keys(ROADMAPS).length,
            phases: phases.length,
            topics: totalTopics,
            topicsWithUsableExercises: coveredTopics,
            topicsWithoutUsableExercises: totalTopics - coveredTopics,
            topicsMeetingThreeExerciseTarget: phases.reduce((sum, phase) => sum + phase.topicsMeetingThreeExerciseTarget, 0),
            topicsMeetingFullDifficultyTarget: phases.reduce((sum, phase) => sum + phase.topicsMeetingFullDifficultyTarget, 0),
            publishedExercises: exerciseCount - incompleteExerciseCount,
            incompleteExercises: incompleteExerciseCount,
            duplicateExerciseIds: [...allIds.entries()].filter(([, associations]) => associations.length > 1).map(([id, associations]) => ({ id, associations }))
        },
        phases
    };
};
