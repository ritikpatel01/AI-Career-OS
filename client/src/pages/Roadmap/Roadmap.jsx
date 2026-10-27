import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./Roadmap.css";
import { ROADMAPS } from "../../data/careerRoadmaps/careerRoadmapData";
import { buildLessonPracticeExercises, ROADMAP_EXERCISES, ROADMAP_LESSONS } from "../../data/careerRoadmaps/roadmapLearningContent";
import { ROADMAP_PRACTICE_BATCHES } from "../../data/careerRoadmaps/roadmapPracticeBatches";
import { filterPracticeExercises, getPracticeCompletionKey, normalizePracticeExercise } from "../../data/careerRoadmaps/roadmapPracticeUtils";
import {
    createRoadmap,
    getRoadmap,
    getRoadmaps,
    updateRoadmap
} from "../../services/roadmapService";

const getProgressRecordTitle = (career) =>
    `AI Career OS progress: ${career}`;

const getTopicText = (topic) => {
    if (typeof topic === "string") return topic;
    if (typeof topic === "object" && topic !== null) {
        return topic.title || topic.name || topic.topic || topic.label || "Untitled Topic";
    }
    return String(topic);
};

const getTopicKey = (career, phaseIndex, topicIndex) =>
    `${career}-${phaseIndex}-${topicIndex}`;

const getCareerTopics = (roadmap) =>
    roadmap.phases.flatMap((phase, phaseIndex) =>
        phase.topics.map((topic, topicIndex) => ({
            phaseIndex,
            topicIndex,
            topic
        }))
    );

const getSafeHttpUrl = (value) => {
    if (typeof value !== "string" || !value.trim()) return null;

    try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:"
            ? url.href
            : null;
    } catch {
        return null;
    }
};

const RoadmapExerciseWorkspace = ({ career, phase, exercise, relatedLesson, completed, saving, onToggleComplete }) => {
    const [draft, setDraft] = useState(exercise.starterCode || "");
    const [hintCount, setHintCount] = useState(0);
    const [copyStatus, setCopyStatus] = useState("");

    useEffect(() => {
        setDraft(exercise.starterCode || "");
        setHintCount(0);
        setCopyStatus("");
    }, [exercise.id, exercise.starterCode]);

    const copyDraft = async () => {
        try {
            await navigator.clipboard.writeText(draft);
            setCopyStatus("Draft copied.");
        } catch {
            setCopyStatus("Copy is unavailable in this browser. Select and copy the draft manually.");
        }
    };

    return (
        <article className="practice-workspace" aria-labelledby="selected-exercise-title">
            <header className="practice-workspace-header">
                <div>
                    <span className="content-kicker">{career} · {phase}</span>
                    <h3 id="selected-exercise-title">{exercise.title}</h3>
                    <div className="practice-meta">
                        <span className={`difficulty ${exercise.difficulty.toLowerCase()}`}>{exercise.difficulty}</span>
                        <span>{exercise.estimatedTime}</span>
                        <span>{exercise.topic}</span>
                        <span className={`exercise-status ${completed ? "is-completed" : ""}`}>{completed ? "Completed" : "Not started"}</span>
                    </div>
                </div>
                <button type="button" className={`practice-complete${completed ? " completed" : ""}`} disabled={saving} onClick={onToggleComplete}>
                    {saving ? "Saving…" : completed ? "Mark incomplete" : "Mark complete"}
                </button>
            </header>

            <section className="exercise-help">
                <h4>Help me understand</h4>
                <p><strong>In simpler words:</strong> {exercise.simplerProblem}</p>
                <p><strong>Review these concepts:</strong> {exercise.conceptsToReview.join(" · ")}</p>
                {exercise.examples.length > 0 ? <p><strong>Worked example:</strong> {exercise.examples[0].input} produces {exercise.examples[0].output}. {exercise.examples[0].explanation}</p> : <p>No worked example is available for this exercise.</p>}
            </section>

            {relatedLesson && (
                <details className="related-lesson">
                    <summary>Open related lesson: {exercise.topic}</summary>
                    <p>{relatedLesson.explanation}</p>
                    <h4>Key steps</h4>
                    <ol>{relatedLesson.tutorial.map((step) => <li key={step}>{step}</li>)}</ol>
                    <pre><code>{relatedLesson.code}</code></pre>
                    <p><strong>Expected:</strong> {relatedLesson.output}</p>
                </details>
            )}

            <div className="exercise-detail-grid">
                <section className="exercise-detail-section">
                    <h4>Problem</h4>
                    <p>{exercise.problemStatement}</p>
                    {Array.isArray(exercise.learningObjectives) && exercise.learningObjectives.length > 0 && <><h4>Learning objectives</h4><ul>{exercise.learningObjectives.map((objective) => <li key={objective}>{objective}</li>)}</ul></>}
                    <h4>Requirements and constraints</h4>
                    <ul>{exercise.requirements.map((requirement) => <li key={requirement}>{requirement}</li>)}</ul>
                    {exercise.prerequisites.length > 0 && <><h4>Prerequisites</h4>
                    <ul>{exercise.prerequisites.map((item) => <li key={item}>{item}</li>)}</ul></>}
                </section>
                <section className="exercise-detail-section">
                            <h4>{exercise.kind === "written" ? "Scenario and expected response" : "Examples"}</h4>
                    {exercise.examples.map((example) => (
                        <div className="practice-example" key={`${example.input}-${example.output}`}>
                            <p><strong>{exercise.kind === "written" ? "Scenario:" : "Input:"}</strong> <code>{example.input}</code></p>
                            <p><strong>{exercise.kind === "written" ? "Suggested response:" : "Expected:"}</strong> <code>{example.output}</code></p>
                            <p>{example.explanation}</p>
                        </div>
                    ))}
                </section>
            </div>

            <section className="exercise-detail-section workspace-section">
                <div className="workspace-heading">
                    <div><h4>{exercise.kind === "written" ? "Your response" : "Your code draft"}</h4><p>This work exists only in this open view. It is not saved, executed, or sent to the server.</p></div>
                    <div className="workspace-tools">
                        <button type="button" onClick={() => setDraft(exercise.starterCode || "")}>Reset starter</button>
                        <button type="button" onClick={copyDraft}>Copy draft</button>
                    </div>
                </div>
                <label className="workspace-label" htmlFor={`roadmap-draft-${exercise.id}`}>{exercise.kind === "written" ? "Your written answer" : `${exercise.language} code draft`}</label>
                <textarea id={`roadmap-draft-${exercise.id}`} spellCheck={exercise.kind === "written"} placeholder={exercise.kind === "written" ? "Write your explanation and example here…" : "Write your solution here…"} value={draft} onChange={(event) => setDraft(event.target.value)} />
                {copyStatus && <p role="status" className="workspace-copy-status">{copyStatus}</p>}
                <h4>{exercise.kind === "written" ? "Self-assessment checks" : "Manual test cases"}</h4>
                <p className="workspace-note">Use these checks to review your response. The application does not execute code or grade answers.</p>
                <ul className="manual-test-list">{exercise.tests.map((test) => <li key={test.name}><strong>{test.name}:</strong> {test.input} → {test.expected}</li>)}</ul>
            </section>

            {Array.isArray(exercise.commonMistakes) && exercise.commonMistakes.length > 0 && (
                <section className="exercise-detail-section">
                    <h4>Common mistakes</h4>
                    <ul>{exercise.commonMistakes.map((mistake) => <li key={mistake}>{mistake}</li>)}</ul>
                </section>
            )}

            <section className="exercise-detail-section progressive-help">
                <h4>Progressive hints</h4>
                {hintCount > 0 ? <ol>{exercise.hints.slice(0, hintCount).map((hint, index) => <li key={`${index}-${hint}`}>{hint}</li>)}</ol> : <p>Hints reveal one at a time, starting with a small nudge.</p>}
                <button type="button" disabled={hintCount >= exercise.hints.length} onClick={() => setHintCount((count) => Math.min(count + 1, exercise.hints.length))}>{hintCount === 0 ? "Show hint 1" : hintCount >= exercise.hints.length ? "All hints revealed" : `Show hint ${hintCount + 1}`}</button>
            </section>

            <details className="exercise-solution">
                <summary>Reveal complete solution</summary>
                <p>{exercise.approach}</p>
                <pre><code>{exercise.solutionCode}</code></pre>
                <h4>Why it works</h4>
                <ol>{exercise.solutionLines.map((line) => <li key={line}>{line}</li>)}</ol>
                {exercise.complexity && <p><strong>Complexity:</strong> {exercise.complexity.time} time and {exercise.complexity.space} space. {exercise.complexity.explanation}</p>}
                <h4>Completion criteria</h4>
                <ul>{exercise.completionCriteria.map((criterion) => <li key={criterion}>{criterion}</li>)}</ul>
                <p><strong>Further practice:</strong> {exercise.followUp}</p>
            </details>
        </article>
    );
};

const Roadmap = () => {
    const [resumeSkills, setResumeSkills] = useState([]);
    const [resumeSkillsLoading, setResumeSkillsLoading] = useState(true);
    const [resumeSkillsError, setResumeSkillsError] = useState("");
    const resumeSkillsRequestPending = useRef(false);

    const loadResumeSkills = useCallback(async () => {
        if (resumeSkillsRequestPending.current) return;
        resumeSkillsRequestPending.current = true;
        setResumeSkillsLoading(true);
        setResumeSkillsError("");
        try {
            const response = await getRoadmaps();
            if (!response?.success || !Array.isArray(response.data)) throw new Error("Could not load resume skill gaps.");
            const seen = new Set();
            setResumeSkills(response.data.filter((record) => {
                if (record.goal !== "resume-skill-gap-v1") return false;
                const key = String(record.title).trim().replace(/\s+/g, " ").toLowerCase();
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            }));
        } catch (err) {
            setResumeSkillsError(err.message || "Could not load resume skill gaps.");
        } finally {
            resumeSkillsRequestPending.current = false;
            setResumeSkillsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadResumeSkills();
        const refreshWhenVisible = () => {
            if (document.visibilityState === "visible") loadResumeSkills();
        };
        window.addEventListener("focus", refreshWhenVisible);
        window.addEventListener("pageshow", refreshWhenVisible);
        document.addEventListener("visibilitychange", refreshWhenVisible);
        const interval = window.setInterval(refreshWhenVisible, 60_000);
        return () => {
            window.removeEventListener("focus", refreshWhenVisible);
            window.removeEventListener("pageshow", refreshWhenVisible);
            document.removeEventListener("visibilitychange", refreshWhenVisible);
            window.clearInterval(interval);
        };
    }, [loadResumeSkills]);

    const careerNames = Object.keys(ROADMAPS);

    const [selectedCareer, setSelectedCareer] =
        useState("Full Stack Developer");

    const [activePhase, setActivePhase] = useState(0);
    const [showAllPhases, setShowAllPhases] = useState(false);

    const [completedTopics, setCompletedTopics] = useState({});

    const [progressRecordId, setProgressRecordId] = useState(null);

    const [progressLoading, setProgressLoading] = useState(true);

    const [progressLoadError, setProgressLoadError] = useState(false);

    const [progressSaving, setProgressSaving] = useState(false);

    const [progressSaved, setProgressSaved] = useState(false);

    const [progressError, setProgressError] = useState("");

    const [notes, setNotes] = useState("");
    const [notesSaving, setNotesSaving] = useState(false);
    const [notesSaved, setNotesSaved] = useState(false);
    const [notesError, setNotesError] = useState("");

    const [completedPractice, setCompletedPractice] = useState([]);
    const [practiceSaving, setPracticeSaving] = useState(false);
    const [savingPracticeKey, setSavingPracticeKey] = useState(null);
    const [practiceError, setPracticeError] = useState("");
    const [selectedExerciseId, setSelectedExerciseId] = useState(null);
    const [activeTopicIndex, setActiveTopicIndex] = useState(0);
    const [revealedQuiz, setRevealedQuiz] = useState(false);
    const [practiceSearch, setPracticeSearch] = useState("");
    const [practiceDifficulty, setPracticeDifficulty] = useState("all");
    const [practiceStatus, setPracticeStatus] = useState("all");
    const [practiceTopic, setPracticeTopic] = useState("all");
    const [resourceSearch, setResourceSearch] = useState("");
    const [resourceType, setResourceType] = useState("all");

    const [activeTab, setActiveTab] = useState("topics");

    const roadmap = ROADMAPS[selectedCareer];

    const loadCareerProgress = useCallback(async (career) => {
        setProgressLoading(true);
        setProgressLoadError(false);
        setProgressError("");
        setProgressSaved(false);
        setNotes("");
        setNotesError("");
        setNotesSaved(false);

        try {
            const result = await getRoadmaps();
            if (!result?.success || !Array.isArray(result.data)) {
                throw new Error("Could not load saved roadmap progress.");
            }

            const record = result.data.find(
                (item) =>
                    item.title === getProgressRecordTitle(career) &&
                    item.goal === "built-in-career-roadmap-progress"
            );
            const topics = {};
            const entries = getCareerTopics(ROADMAPS[career]);

            entries.forEach((entry, order) => {
                if (record?.steps?.[order]?.status === "completed") {
                    topics[getTopicKey(career, entry.phaseIndex, entry.topicIndex)] = true;
                }
            });

            setCompletedTopics(topics);
            setProgressRecordId(record?._id || record?.id || null);
            setNotes(typeof record?.notes === "string" ? record.notes : "");
            setCompletedPractice(Array.isArray(record?.completedPractice)
                ? record.completedPractice.filter((key) => typeof key === "string")
                : []);
        } catch (error) {
            setCompletedTopics({});
            setProgressRecordId(null);
            setNotes("");
            setCompletedPractice([]);
            setProgressLoadError(true);
            setProgressError(error?.message || "Could not load saved roadmap progress.");
        } finally {
            setProgressLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCareerProgress(selectedCareer);
    }, [selectedCareer, loadCareerProgress]);

    const totalTopics = useMemo(() => {
        return roadmap.phases.reduce(
            (total, phase) => total + phase.topics.length,
            0
        );
    }, [roadmap]);

    const completedCount = Object.values(completedTopics).filter(
        Boolean
    ).length;

    const progressAvailable = !progressLoading && !progressLoadError;

    const progress =
        !progressAvailable
            ? null
            : totalTopics === 0
            ? 0
            : Math.round((completedCount / totalTopics) * 100);

    const currentPhase =
        roadmap.phases[activePhase] ?? roadmap.phases[0];
    const activeTopic = getTopicText(currentPhase.topics[activeTopicIndex] ?? currentPhase.topics[0]);
    const lesson = ROADMAP_LESSONS[selectedCareer]?.[currentPhase.title]?.[activeTopic] || null;
    const detailedExercises = useMemo(() => [
        ...(ROADMAP_EXERCISES[selectedCareer]?.[currentPhase.title] || []),
        ...(ROADMAP_PRACTICE_BATCHES[selectedCareer]?.[currentPhase.title] || []),
        ...buildLessonPracticeExercises(selectedCareer, currentPhase.title, currentPhase.topics)
    ], [selectedCareer, currentPhase]);
    const practiceItems = useMemo(() => {
        const outlines = Array.isArray(currentPhase.practice) ? currentPhase.practice : [];
        const authored = detailedExercises
            .map(normalizePracticeExercise)
            .filter(Boolean)
            .map((exercise) => ({
                ...exercise,
                legacyOutlineId: outlines.find((item) => item.id === exercise.id || item.title.toLowerCase() === exercise.title.toLowerCase())?.id || null
            }));
        return authored;
    }, [currentPhase, detailedExercises]);
    const missingTopicCount = currentPhase.topics.filter((topic) =>
        !practiceItems.some((item) => item.topic === getTopicText(topic))
    ).length;
    const completionKey = (item) => getPracticeCompletionKey(currentPhase, item);
    const completedExerciseCount = practiceItems.filter((item) => completedPractice.includes(completionKey(item))).length;
    const remainingExerciseCount = practiceItems.length - completedExerciseCount;
    const visiblePracticeItems = filterPracticeExercises({
        items: practiceItems,
        search: practiceSearch,
        difficulty: practiceDifficulty,
        topic: practiceTopic,
        status: practiceStatus,
        completedKeys: completedPractice,
        completionKey
    });
    const selectedExercise = visiblePracticeItems.find((item) => item.id === selectedExerciseId) || visiblePracticeItems[0] || null;
    const relatedLesson = selectedExercise
        ? ROADMAP_LESSONS[selectedCareer]?.[currentPhase.title]?.[selectedExercise.topic] || null
        : null;
    const visibleResources = (Array.isArray(currentPhase.resources) ? currentPhase.resources : []).filter((resource) => {
        const query = resourceSearch.trim().toLowerCase();
        const matchesSearch = !query || `${resource.title} ${resource.provider} ${resource.description}`.toLowerCase().includes(query);
        return matchesSearch && (resourceType === "all" || resource.type === resourceType);
    });

    const currentCompleted = currentPhase.topics.filter(
        (topic, topicIndex) =>
            completedTopics[getTopicKey(selectedCareer, activePhase, topicIndex)]
    ).length;

    const currentProgress =
        currentPhase.topics.length === 0
            ? 0
            : Math.round(
                  (currentCompleted /
                      currentPhase.topics.length) *
                      100
              );

    const buildProgressPayload = (
        topics,
        noteText = notes,
        practiceKeys = completedPractice
    ) => {
        const entries = getCareerTopics(roadmap);
        const steps = entries.map((entry, order) => ({
            title: getTopicText(entry.topic),
            description: `Phase ${entry.phaseIndex + 1}`,
            status: topics[getTopicKey(selectedCareer, entry.phaseIndex, entry.topicIndex)]
                ? "completed"
                : "pending",
            order
        }));
        const completed = steps.filter((step) => step.status === "completed").length;

        return {
            title: getProgressRecordTitle(selectedCareer),
            description: "Completion progress for the built-in career roadmap.",
            goal: "built-in-career-roadmap-progress",
            steps,
            progress: steps.length ? Math.round((completed / steps.length) * 100) : 0,
            notes: noteText,
            completedPractice: practiceKeys
        };
    };

    const toggleTopic = async (topic, topicIndex) => {
        if (progressLoading || progressSaving || notesSaving || practiceSaving || progressLoadError) return;

        const key = getTopicKey(selectedCareer, activePhase, topicIndex);
        const previousTopics = completedTopics;
        const nextTopics = {
            ...previousTopics,
            [key]: !previousTopics[key]
        };
        setCompletedTopics(nextTopics);
        setProgressSaving(true);
        setProgressSaved(false);
        setProgressError("");

        const payload = buildProgressPayload(nextTopics);

        try {
            const result = progressRecordId
                ? await updateRoadmap(progressRecordId, payload)
                : await createRoadmap(payload);
            if (!result?.success || !result?.data) {
                throw new Error("The server did not confirm saving this progress change.");
            }
            setProgressRecordId(result.data._id || result.data.id || progressRecordId);
            setProgressSaved(true);
        } catch (error) {
            setCompletedTopics(previousTopics);
            setProgressError(
                `${error?.message || "Progress could not be saved."} The change was reverted; select the topic again to retry.`
            );
        } finally {
            setProgressSaving(false);
        }
    };

    const saveNotes = async () => {
        if (progressLoading || progressSaving || notesSaving || practiceSaving || progressLoadError) return;
        if (notes.length > 10000) {
            setNotesError("Notes must be 10,000 characters or fewer.");
            setNotesSaved(false);
            return;
        }

        setNotesSaving(true);
        setNotesSaved(false);
        setNotesError("");

        try {
            const result = progressRecordId
                ? await updateRoadmap(progressRecordId, buildProgressPayload(completedTopics, notes))
                : await createRoadmap(buildProgressPayload(completedTopics, notes));

            if (!result?.success || !result?.data) {
                throw new Error("The server did not confirm saving these notes.");
            }

            const savedId = result.data._id || result.data.id || progressRecordId;
            if (!savedId) {
                setNotesSaved(true);
                setNotesError("Notes were saved, but the saved record could not be reloaded.");
                return;
            }

            setProgressRecordId(savedId);
            setNotesSaved(true);

            try {
                const refreshed = await getRoadmap(savedId);
                if (!refreshed?.success || !refreshed?.data) {
                    throw new Error("Could not reload saved notes.");
                }
                setNotes(typeof refreshed.data.notes === "string" ? refreshed.data.notes : "");
            } catch {
                setNotesError("Notes were saved, but could not be reloaded for confirmation.");
            }
        } catch (error) {
            setNotesError(error?.message || "Notes could not be saved. Please try again.");
        } finally {
            setNotesSaving(false);
        }
    };

    const togglePractice = async (practiceKey) => {
        if (progressLoading || progressSaving || notesSaving || practiceSaving || progressLoadError) return;

        const previous = completedPractice;
        const next = previous.includes(practiceKey)
            ? previous.filter((key) => key !== practiceKey)
            : [...previous, practiceKey];

        setCompletedPractice(next);
        setPracticeSaving(true);
        setSavingPracticeKey(practiceKey);
        setPracticeError("");
        setProgressSaved(false);

        try {
            const payload = buildProgressPayload(completedTopics, notes, next);
            const result = progressRecordId
                ? await updateRoadmap(progressRecordId, payload)
                : await createRoadmap(payload);
            if (!result?.success || !result?.data) {
                throw new Error("The server did not confirm saving exercise progress.");
            }
            setProgressRecordId(result.data._id || result.data.id || progressRecordId);
        } catch (error) {
            setCompletedPractice(previous);
            setPracticeError(error?.message || "Exercise progress could not be saved. Please try again.");
        } finally {
            setPracticeSaving(false);
            setSavingPracticeKey(null);
        }
    };

    const changeCareer = (career) => {
        setSelectedCareer(career);
        setActivePhase(0);
        setActiveTab("topics");
        setCompletedTopics({});
        setProgressRecordId(null);
        setProgressLoading(true);
        setProgressLoadError(false);
        setProgressSaved(false);
        setProgressError("");
        setNotes("");
        setNotesSaved(false);
        setNotesError("");
        setCompletedPractice([]);
        setPracticeSaving(false);
        setSavingPracticeKey(null);
        setPracticeError("");
        setSelectedExerciseId(null);
        setActiveTopicIndex(0);
        setRevealedQuiz(false);
        setSelectedExerciseId(null);
        setPracticeSearch("");
        setPracticeDifficulty("all");
        setPracticeStatus("all");
        setPracticeTopic("all");
        setResourceSearch("");
        setResourceType("all");
        setSelectedExerciseId(null);
    };

    const goToNextPhase = () => {
        setActivePhase((current) =>
            current < roadmap.phases.length - 1
                ? current + 1
                : current
        );

        setActiveTab("topics");
        setActiveTopicIndex(0);
        setRevealedQuiz(false);
        setSelectedExerciseId(null);
    };

    return (
        <div className="roadmap-page">

            {/* =====================================================
                HEADER
            ===================================================== */}

            <div className="roadmap-top">

                <div>
                    <span className="roadmap-eyebrow">
                        CAREER PLANNING
                    </span>

                    <h1>
                        {selectedCareer} Roadmap
                    </h1>

                    <p>
                        Follow a structured learning path,
                        track your progress and build the
                        skills required for your target career.
                    </p>
                </div>

                <select
                    className="career-selector"
                    aria-label="Career roadmap"
                    value={selectedCareer}
                    disabled={progressSaving || progressLoading || notesSaving || practiceSaving}
                    onChange={(e) =>
                        changeCareer(e.target.value)
                    }
                >
                    {careerNames.map((career) => (
                        <option
                            key={career}
                            value={career}
                        >
                            {career}
                        </option>
                    ))}
                </select>

            </div>

            {(progressLoading || progressSaving || progressSaved || progressError) && (
                <div
                    className={`roadmap-progress-message${progressError ? " error" : ""}`}
                    role={progressError ? "alert" : "status"}
                    aria-live="polite"
                >
                    <span>
                        {progressLoading && "Loading your saved progress…"}
                        {!progressLoading && progressSaving && "Saving progress…"}
                        {!progressLoading && !progressSaving && progressSaved && "Progress saved to your account."}
                        {!progressLoading && !progressSaving && progressError}
                    </span>
                    {progressLoadError && !progressLoading && (
                        <button type="button" onClick={() => loadCareerProgress(selectedCareer)}>
                            Retry
                        </button>
                    )}
                </div>
            )}


            {/* =====================================================
                CAREER SUMMARY
            ===================================================== */}

            <section className="roadmap-hero">

                <div className="hero-title">

                    <div className="hero-icon">
                        🚀
                    </div>

                    <div>
                        <h2>
                            {selectedCareer}
                        </h2>

                        <p>
                            {roadmap.description}
                        </p>
                    </div>

                </div>

                <div className="hero-meta">

                    <span>
                        🎯 {roadmap.level}
                    </span>

                    <span>
                        ⏱️ {roadmap.duration}
                    </span>

                    <span>
                        📚 {roadmap.phases.length} Phases
                    </span>

                    <span>
                        🧩 {totalTopics} Topics
                    </span>

                    <span>
                        💻 {roadmap.projects} Projects
                    </span>

                </div>

            </section>


            {/* =====================================================
                OVERALL PROGRESS
            ===================================================== */}

            <section className="progress-card">

                <div className="progress-main">

                    <div>
                        <span>
                            Overall Progress
                        </span>

                        <strong>
                            {progressAvailable ? `${progress}%` : "—"}
                        </strong>

                        <small>
                            {progressAvailable
                                ? `${completedCount} of ${totalTopics} topics completed`
                                : "Saved completion status unavailable"}
                        </small>
                    </div>

                    <div className="big-progress">

                        <div
                            className="big-progress-fill"
                            style={{
                                width: `${progress ?? 0}%`,
                            }}
                        />

                    </div>

                </div>

                <div className="progress-stat">
                    <strong>
                        {roadmap.phases.length}
                    </strong>

                    <span>
                        Phases
                    </span>
                </div>

                <div className="progress-stat">
                    <strong>
                        {totalTopics}
                    </strong>

                    <span>
                        Topics
                    </span>
                </div>

                <div className="progress-stat">
                    <strong>
                        {roadmap.projects}
                    </strong>

                    <span>
                        Projects
                    </span>
                </div>

            </section>


            {/* =====================================================
                MAIN LAYOUT
            ===================================================== */}

            <div className={`roadmap-layout${activeTab === "practice" ? " practice-active" : ""}`}>


                {/* =================================================
                    LEARNING PATH
                ================================================= */}

                <section className="learning-section">

                    <div className="section-heading">

                        <div>
                            <span>
                                YOUR JOURNEY
                            </span>

                            <h2>
                                Learning Path
                            </h2>
                        </div>

                        <button
                            className="outline-button"
                            onClick={goToNextPhase}
                        >
                            Next Phase →
                        </button>

                    </div>


                    {/* TIMELINE */}

                    <div className={`timeline${showAllPhases ? " timeline-expanded" : ""}`} id="roadmap-phase-list">

                        {roadmap.phases.map(
                            (phase, index) => {

                                const phaseCompleted =
                                    phase.topics.filter(
                                        (topic, topicIndex) =>
                                            completedTopics[
                                                getTopicKey(
                                                    selectedCareer,
                                                    index,
                                                    topicIndex
                                                )
                                            ]
                                    ).length;

                                const phaseProgress =
                                    phase.topics.length === 0
                                        ? 0
                                        : Math.round(
                                              (phaseCompleted /
                                                  phase.topics
                                                      .length) *
                                                  100
                                          );

                                const isActive =
                                    activePhase === index;

                                return (
                                    <button
                                        className={`phase-card ${
                                            isActive
                                                ? "active"
                                                : ""
                                        }${Math.abs(index - activePhase) <= 1 ? " phase-nearby" : ""}`}
                                        aria-current={isActive ? "step" : undefined}
                                        key={phase.title}
                                        onClick={() =>
                                            {
                                                setActivePhase(index);
                                                setActiveTopicIndex(0);
                                                setRevealedQuiz(false);
                                                setSelectedExerciseId(null);
                                            }
                                        }
                                    >

                                        <div className="phase-number">
                                            {index + 1}
                                        </div>

                                        <div className="phase-icon">
                                            {phase.icon}
                                        </div>

                                        <div className="phase-content">

                                            <div className="phase-title-row">

                                                <div>

                                                    <h3>
                                                        {
                                                            phase.title
                                                        }
                                                    </h3>

                                                    <p>
                                                        {
                                                            phase.description
                                                        }
                                                    </p>

                                                </div>

                                                <span
                                                    className={
                                                        phaseProgress ===
                                                        100
                                                            ? "completed-badge"
                                                            : "progress-badge"
                                                    }
                                                >
                                                    {progressAvailable
                                                        ? `${phaseProgress}%`
                                                        : "—"}
                                                </span>

                                            </div>

                                            <div className="phase-progress">

                                                <div
                                                    style={{
                                                        width: `${progressAvailable ? phaseProgress : 0}%`,
                                                    }}
                                                />

                                            </div>

                                            <small>
                                                {progressAvailable
                                                    ? `${phaseCompleted} / ${phase.topics.length} topics completed`
                                                    : "Saved status unavailable"}
                                            </small>

                                        </div>

                                        <span className="phase-arrow">
                                            →
                                        </span>

                                    </button>
                                );
                            }
                        )}

                    </div>

                    <button type="button" className="roadmap-phase-list-toggle" aria-expanded={showAllPhases} aria-controls="roadmap-phase-list" onClick={() => setShowAllPhases((current) => !current)}>
                        {showAllPhases ? "Show current phases" : `View all ${roadmap.phases.length} phases`}
                    </button>

                </section>


                {/* =================================================
                    PHASE DETAILS
                ================================================= */}

                <aside className="phase-details">

                    {/* DETAILS HEADER */}

                    <div className="details-header">

                        <div className="details-icon">
                            {currentPhase.icon}
                        </div>

                        <div>

                            <span>
                                Phase {activePhase + 1} of{" "}
                                {roadmap.phases.length}
                            </span>

                            <h2>
                                {currentPhase.title}
                            </h2>

                            <p>
                                {currentPhase.description}
                            </p>

                        </div>

                    </div>


                    {/* PHASE PROGRESS */}

                    <div className="details-progress">

                        <div>

                            <strong>
                                {progressAvailable ? `${currentProgress}%` : "—"}
                            </strong>

                            <span>
                                {progressAvailable
                                    ? `${currentCompleted} of ${currentPhase.topics.length} completed`
                                    : "Saved status unavailable"}
                            </span>

                        </div>

                        <div className="details-progress-bar">

                            <div
                                style={{
                                    width: `${progressAvailable ? currentProgress : 0}%`,
                                }}
                            />

                        </div>

                    </div>


                    {/* =================================================
                        TABS
                    ================================================= */}

                    <div className="detail-tabs">

                        {[
                            "topics",
                            "resources",
                            "practice",
                            "notes",
                        ].map((tab) => (

                            <button
                                key={tab}
                                aria-pressed={activeTab === tab}
                                className={
                                    activeTab === tab
                                        ? "active"
                                        : ""
                                }
                                onClick={() =>
                                    setActiveTab(tab)
                                }
                            >
                                {tab}
                            </button>

                        ))}

                    </div>


                    {/* =================================================
                        TOPICS
                    ================================================= */}

                    {activeTab === "topics" && (
                        <>
                        <div className="topic-list">

                            {currentPhase.topics.map(
                                (topic, index) => {

                                    const topicText =
                                        getTopicText(topic);

                                    const key =
                                        getTopicKey(
                                            selectedCareer,
                                            activePhase,
                                                index
                                        );

                                    const completed =
                                        Boolean(
                                            completedTopics[
                                                key
                                            ]
                                        );

                                    return (

                                        <div
                                            className={`topic ${
                                                completed
                                                    ? "done"
                                                    : ""
                                            }${activeTopicIndex === index ? " topic-selected" : ""}`}
                                            key={key}
                                        >

                                            {/* CHECK */}

                                            <button
                                                type="button"
                                                className="topic-check"
                                                disabled={progressLoading || progressSaving || notesSaving || practiceSaving || progressLoadError}
                                                onClick={() =>
                                                    toggleTopic(
                                                        topic,
                                                        index
                                                    )
                                                }
                                                aria-label={
                                                    completed
                                                        ? `Mark ${topicText} incomplete`
                                                        : `Mark ${topicText} complete`
                                                }
                                            >
                                                {completed
                                                    ? "✓"
                                                    : ""}
                                            </button>


                                            {/* TOPIC NAME */}

                                            <div className="topic-info">

                                                <span>
                                                    {index + 1}.
                                                </span>

                                                <strong
                                                    style={{
                                                        color: completed
                                                            ? "#64748b"
                                                            : "#172033",
                                                        display:
                                                            "block",
                                                        opacity: 1,
                                                        visibility:
                                                            "visible",
                                                    }}
                                                >
                                                    {topicText}
                                                </strong>

                                            </div>


                                            {/* START */}

                                            {!completed && (

                                                <button
                                                    type="button"
                                                    className="start-button"
                                                    disabled={progressLoading || progressSaving || notesSaving || practiceSaving || progressLoadError}
                                                    onClick={() =>
                                                        toggleTopic(
                                                            topic,
                                                            index
                                                        )
                                                    }
                                                >
                                                    Start
                                                </button>

                                            )}

                                            <button
                                                type="button"
                                                className="topic-learn-button"
                                                aria-pressed={activeTopicIndex === index}
                                                onClick={() => {
                                                    setActiveTopicIndex(index);
                                                    setRevealedQuiz(false);
                                                }}
                                            >
                                                Learn
                                            </button>

                                        </div>

                                    );
                                }
                            )}

                        </div>

                        <section className="roadmap-lesson" aria-labelledby="lesson-heading">
                            {lesson ? (
                                <>
                                    <div className="lesson-heading-row">
                                        <div><span className="content-kicker">GUIDED LESSON</span><h3 id="lesson-heading">{activeTopic}</h3></div>
                                        <span className="lesson-progress-label">Topic {activeTopicIndex + 1} of {currentPhase.topics.length}</span>
                                    </div>
                                    <p className="lesson-explanation">{lesson.explanation}</p>
                                    <div className="lesson-grid">
                                        <section><h4>What you’ll learn</h4><ul>{lesson.objectives.map((item) => <li key={item}>{item}</li>)}</ul></section>
                                        <section><h4>Before you start</h4><ul>{lesson.prerequisites.map((item) => <li key={item}>{item}</li>)}</ul></section>
                                    </div>
                                    <section className="lesson-steps"><h4>Work through it</h4><ol>{lesson.tutorial.map((item) => <li key={item}>{item}</li>)}</ol></section>
                                    <div className="lesson-code-block"><span>Example · {lesson.language || "JavaScript"}</span><pre><code>{lesson.code}</code></pre><p><strong>What it does:</strong> {lesson.output}</p></div>
                                    <div className="lesson-grid">
                                        <section><h4>Common mistakes</h4><ul>{lesson.mistakes.map((item) => <li key={item}>{item}</li>)}</ul></section>
                                        <section><h4>Where this is useful</h4><p>{lesson.useCase}</p></section>
                                    </div>
                                    <section className="lesson-quiz"><h4>Quick check</h4><p>{lesson.quiz.question}</p>{revealedQuiz ? <div className="lesson-answer"><strong>{lesson.quiz.answer}</strong><p>{lesson.quiz.explanation}</p></div> : <button type="button" className="lesson-reveal" onClick={() => setRevealedQuiz(true)}>Reveal answer</button>}</section>
                                    <p className="lesson-next"><strong>Next step:</strong> {lesson.nextStep}</p>
                                </>
                            ) : (
                                <div className="lesson-not-authored">
                                    <span className="content-kicker">LESSON CONTENT</span>
                                    <h3 id="lesson-heading">{activeTopic || "Choose a topic"}</h3>
                                    <p>A detailed lesson for this topic has not been authored in the current content batch yet. Your saved topic progress remains available.</p>
                                </div>
                            )}
                        </section>
                        </>
                    )}


                    {/* =================================================
                        RESOURCES
                    ================================================= */}

                    {activeTab === "resources" && (
                        <>
                        <div className="content-filters">
                            <label>Search resources<input type="search" value={resourceSearch} onChange={(event) => setResourceSearch(event.target.value)} placeholder="Search title or provider" /></label>
                            <label>Resource type<select value={resourceType} onChange={(event) => setResourceType(event.target.value)}><option value="all">All types</option>{[...new Set((currentPhase.resources || []).map((resource) => resource.type))].map((type) => <option value={type} key={type}>{type}</option>)}</select></label>
                        </div>
                        {visibleResources.length > 0 ? (
                            <div className="resource-list">
                                {visibleResources.map((resource, index) => {
                                    const url = getSafeHttpUrl(resource.url);
                                    const content = (
                                        <>
                                            <span className="resource-icon" aria-hidden="true">📚</span>
                                            <span className="resource-info">
                                                <strong>{resource.title}</strong>
                                                <span className="resource-provider">{resource.provider}</span>
                                                <span className="resource-description">{resource.description}</span>
                                                <span className="resource-type">{resource.type}</span>
                                            </span>
                                            {url && <span className="resource-arrow" aria-hidden="true">↗</span>}
                                        </>
                                    );

                                    return url ? (
                                        <a className="resource-card" href={url} target="_blank" rel="noopener noreferrer" key={`${resource.title}-${index}`}>
                                            {content}
                                        </a>
                                    ) : (
                                        <div className="resource-card" key={`${resource.title}-${index}`}>
                                            {content}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="empty-tab">
                                <div aria-hidden="true">📚</div>
                                <h3>No matching resources</h3>
                                <p>Try a different search or resource type. Resource links are opened only when they use HTTP or HTTPS.</p>
                            </div>
                        )}
                        </>
                    )}


                    {/* =================================================
                        PRACTICE
                    ================================================= */}

                    {activeTab === "practice" && (
                        <div className="practice-overview">
                            <header className="practice-overview-heading">
                                <span className="content-kicker">PHASE PRACTICE</span>
                                <h3>Practice Exercises</h3>
                                <p>Work through a fully authored exercise, use the built-in help, and record completion when you finish.</p>
                            </header>
                            <div className="practice-stats" aria-label="Practice progress">
                                <div><strong>{practiceItems.length}</strong><span>Available</span></div>
                                <div><strong>{progressAvailable ? completedExerciseCount : "—"}</strong><span>Completed</span></div>
                                <div><strong>{progressAvailable ? remainingExerciseCount : "—"}</strong><span>Remaining</span></div>
                            </div>
                            {progressLoadError && <p className="practice-save-message error" role="alert">Saved completion status is unavailable. Retry the Roadmap progress request to see accurate completion totals or update progress.</p>}
                            {!progressLoadError && missingTopicCount > 0 && <p className="practice-availability-note">Practice coverage is still being authored for {missingTopicCount} of {currentPhase.topics.length} topics in this phase. Only published exercises are included in the counts; saved records are preserved.</p>}
                            <div className="practice-filter-grid">
                                <label>Search<input type="search" value={practiceSearch} onChange={(event) => setPracticeSearch(event.target.value)} placeholder="Title, keyword, or topic" /></label>
                                <label>Phase<select value={activePhase} onChange={(event) => { setActivePhase(Number(event.target.value)); setActiveTopicIndex(0); setSelectedExerciseId(null); setPracticeSearch(""); setPracticeTopic("all"); setPracticeStatus("all"); }}>
                                    {roadmap.phases.map((phase, phaseIndex) => <option key={`${phase.title}-${phaseIndex}`} value={phaseIndex}>{phase.title}</option>)}
                                </select></label>
                                <label>Difficulty<select value={practiceDifficulty} onChange={(event) => setPracticeDifficulty(event.target.value)}><option value="all">All levels</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label>
                                <label>Topic<select value={practiceTopic} onChange={(event) => setPracticeTopic(event.target.value)}><option value="all">All topics</option>{[...new Set(practiceItems.map((item) => item.topic).filter(Boolean))].map((topic) => <option value={topic} key={topic}>{topic}</option>)}</select></label>
                                <label>Completion<select value={practiceStatus} onChange={(event) => setPracticeStatus(event.target.value)}><option value="all">All statuses</option><option value="not-started">Not started</option><option value="completed">Completed</option></select></label>
                            </div>
                            <div className="practice-results-heading"><strong>{visiblePracticeItems.length} of {practiceItems.length} available</strong><button type="button" onClick={() => { setPracticeSearch(""); setPracticeDifficulty("all"); setPracticeTopic("all"); setPracticeStatus("all"); }}>Reset filters</button></div>
                            {practiceSaving && <p className="practice-save-message" role="status">Saving exercise progress…</p>}
                            {practiceError && <p className="practice-save-message error" role="alert">{practiceError}</p>}
                            {practiceItems.length < detailedExercises.length && <p role="status">Some exercise records could not be displayed because they have no stable ID. Other exercises and saved progress remain available.</p>}
                            <div className="practice-content-layout">
                                {visiblePracticeItems.length > 0 ? (
                                    <div className="practice-card-list">
                                        {visiblePracticeItems.map((item, index) => {
                                            const practiceKey = completionKey(item);
                                            const isCompleted = completedPractice.includes(practiceKey);
                                            const isSelected = selectedExercise?.id === item.id;
                                            return (
                                                <article className={`practice-card${isCompleted ? " practice-done" : ""}${isSelected ? " selected" : ""}`} key={item.id}>
                                                    <div className="practice-card-header">
                                                        <span className="practice-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                                                        <div className="practice-info">
                                                            <strong>{item.title}</strong>
                                                            <p className="practice-card-description">{item.simplerProblem || item.problemStatement}</p>
                                                        </div>
                                                    </div>
                                                    <div className="practice-card-metadata" aria-label="Exercise information">
                                                        <span className={`difficulty ${item.difficulty.toLowerCase()}`}>{item.difficulty}</span>
                                                        <span>{item.estimatedTime}</span>
                                                        <span>{item.topic}</span>
                                                        <span className={`exercise-status${isCompleted ? " is-completed" : ""}`}>{isCompleted ? "Completed" : "Not started"}</span>
                                                    </div>
                                                    <div className="practice-card-actions">
                                                        <button type="button" className="practice-expand" aria-pressed={isSelected} onClick={() => setSelectedExerciseId(item.id)}>{isCompleted ? "Review exercise" : "Solve exercise"}</button>
                                                        <button type="button" className={`practice-complete${isCompleted ? " completed" : ""}`} aria-label={`${isCompleted ? "Mark incomplete" : "Mark complete"}: ${item.title}`} disabled={progressLoading || progressSaving || notesSaving || practiceSaving || progressLoadError} onClick={() => togglePractice(practiceKey)}>{savingPracticeKey === practiceKey ? "Saving…" : isCompleted ? "Mark incomplete" : "Mark complete"}</button>
                                                    </div>
                                                </article>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="empty-tab"><div aria-hidden="true">🧪</div><h3>{practiceItems.length ? "No exercises match" : "No published exercises in this phase yet"}</h3><p>{practiceItems.length ? "Adjust or reset the filters to see available exercises." : missingTopicCount ? "Exercises are shown here when fully authored content is available for the selected phase." : "This phase currently has no published practice exercises."}</p>{practiceItems.length > 0 && <button type="button" className="practice-expand" onClick={() => { setPracticeSearch(""); setPracticeDifficulty("all"); setPracticeTopic("all"); setPracticeStatus("all"); }}>Reset filters</button>}</div>
                                )}
                                {selectedExercise && visiblePracticeItems.length > 0 && (
                                    <RoadmapExerciseWorkspace
                                        key={selectedExercise.id}
                                        career={selectedCareer}
                                        phase={currentPhase.title}
                                        exercise={selectedExercise}
                                        relatedLesson={relatedLesson}
                                        completed={completedPractice.includes(completionKey(selectedExercise))}
                                        saving={progressLoading || progressSaving || notesSaving || practiceSaving || progressLoadError}
                                        onToggleComplete={() => togglePractice(completionKey(selectedExercise))}
                                    />
                                )}
                            </div>
                        </div>
                    )}


                    {/* =================================================
                        NOTES
                    ================================================= */}

                    {activeTab === "notes" && (

                        <div className="notes-box">
                            <textarea
                                placeholder={`Write your notes for the ${selectedCareer} roadmap...`}
                                aria-label={`Notes for the ${selectedCareer} roadmap`}
                                value={notes}
                                maxLength={10000}
                                disabled={progressLoading || progressSaving || notesSaving || practiceSaving || progressLoadError}
                                onChange={(event) => {
                                    setNotes(event.target.value);
                                    setNotesSaved(false);
                                    setNotesError("");
                                }}
                            />
                            <div className="notes-meta">
                                <span>{notes.length}/10,000 characters</span>
                                {notesSaved && !notesError && <span role="status">Notes saved to your account.</span>}
                                {notesError && <span role="alert">{notesError}</span>}
                            </div>
                            <button
                                type="button"
                                onClick={saveNotes}
                                disabled={progressLoading || progressSaving || notesSaving || practiceSaving || progressLoadError}
                            >
                                {notesSaving ? "Saving Notes…" : "Save Notes"}
                            </button>

                        </div>

                    )}


                    {/* =================================================
                        CONTINUE
                    ================================================= */}

                    <button
                        type="button"
                        className="continue-button"
                        onClick={goToNextPhase}
                    >
                        Continue Learning →
                    </button>

                </aside>

            </div>

            <div className="roadmap-resume-gaps-container">
            <section className="roadmap-resume-gaps" aria-labelledby="resume-skill-gaps-heading" aria-busy={resumeSkillsLoading}>
                <div className="roadmap-resume-gaps-header">
                    <div>
                        <h2 id="resume-skill-gaps-heading">Resume Skill Gaps</h2>
                        <p>Skills saved from resume analysis. These are separate from built-in roadmap progress.</p>
                    </div>
                    <button type="button" onClick={loadResumeSkills} disabled={resumeSkillsLoading}>{resumeSkillsLoading ? "Loading…" : "Refresh skills"}</button>
                </div>
                {resumeSkillsLoading ? <p role="status">Loading saved skills…</p> : resumeSkillsError ? <p role="alert">{resumeSkillsError} Use Refresh skills to retry.</p> : resumeSkills.length === 0 ? <p>No skills added yet. Add a missing skill from your Resume analysis to see it here.</p> : (
                    <ul className="roadmap-resume-gaps-list">
                        {resumeSkills.map((skill) => <li key={skill._id || skill.id}>
                            <div><h3>{skill.title}</h3><span>Added from Resume</span></div>
                            <p>{skill.description}</p>
                        </li>)}
                    </ul>
                )}
            </section>
            </div>

        </div>
    );
};

export default function RoadmapDesktopCanvas() {
    return (
        <div className="roadmap-desktop-scroll" role="region" aria-label="Roadmap page. Scroll horizontally to view all content on narrow screens." tabIndex={0}>
            <div className="roadmap-desktop-canvas">
                <Roadmap />
            </div>
        </div>
    );
}
