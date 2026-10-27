import { useMemo, useState } from "react";
import "./Roadmap.css";
import { ROADMAPS } from "../../data/careerRoadmaps/careerRoadmapData";

const Roadmap = () => {
    const careerNames = Object.keys(ROADMAPS);

    const [selectedCareer, setSelectedCareer] =
        useState("Full Stack Developer");

    const [activePhase, setActivePhase] = useState(0);

    const [completedTopics, setCompletedTopics] = useState({});

    const [activeTab, setActiveTab] = useState("topics");

    const roadmap = ROADMAPS[selectedCareer];

    const totalTopics = useMemo(() => {
        return roadmap.phases.reduce(
            (total, phase) => total + phase.topics.length,
            0
        );
    }, [roadmap]);

    const completedCount = Object.values(completedTopics).filter(
        Boolean
    ).length;

    const progress =
        totalTopics === 0
            ? 0
            : Math.round((completedCount / totalTopics) * 100);

    const currentPhase =
        roadmap.phases[activePhase] ?? roadmap.phases[0];

    const getTopicText = (topic) => {
        if (typeof topic === "string") {
            return topic;
        }

        if (typeof topic === "object" && topic !== null) {
            return (
                topic.title ||
                topic.name ||
                topic.topic ||
                topic.label ||
                "Untitled Topic"
            );
        }

        return String(topic);
    };

    const getTopicKey = (phaseIndex, topic) => {
        return `${selectedCareer}-${phaseIndex}-${getTopicText(topic)}`;
    };

    const currentCompleted = currentPhase.topics.filter(
        (topic) =>
            completedTopics[
                getTopicKey(activePhase, topic)
            ]
    ).length;

    const currentProgress =
        currentPhase.topics.length === 0
            ? 0
            : Math.round(
                  (currentCompleted /
                      currentPhase.topics.length) *
                      100
              );

    const toggleTopic = (topic) => {
        const key = getTopicKey(activePhase, topic);

        setCompletedTopics((current) => ({
            ...current,
            [key]: !current[key],
        }));
    };

    const changeCareer = (career) => {
        setSelectedCareer(career);
        setActivePhase(0);
        setActiveTab("topics");
    };

    const goToNextPhase = () => {
        setActivePhase((current) =>
            current < roadmap.phases.length - 1
                ? current + 1
                : current
        );

        setActiveTab("topics");
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
                    value={selectedCareer}
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
                            {progress}%
                        </strong>

                        <small>
                            {completedCount} of {totalTopics}{" "}
                            topics completed
                        </small>
                    </div>

                    <div className="big-progress">

                        <div
                            className="big-progress-fill"
                            style={{
                                width: `${progress}%`,
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

            <div className="roadmap-layout">


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

                    <div className="timeline">

                        {roadmap.phases.map(
                            (phase, index) => {

                                const phaseCompleted =
                                    phase.topics.filter(
                                        (topic) =>
                                            completedTopics[
                                                getTopicKey(
                                                    index,
                                                    topic
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
                                        }`}
                                        key={phase.title}
                                        onClick={() =>
                                            setActivePhase(
                                                index
                                            )
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
                                                    {
                                                        phaseProgress
                                                    }
                                                    %
                                                </span>

                                            </div>

                                            <div className="phase-progress">

                                                <div
                                                    style={{
                                                        width: `${phaseProgress}%`,
                                                    }}
                                                />

                                            </div>

                                            <small>
                                                {
                                                    phaseCompleted
                                                }{" "}
                                                /{" "}
                                                {
                                                    phase.topics
                                                        .length
                                                }{" "}
                                                topics completed
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
                                {currentProgress}%
                            </strong>

                            <span>
                                {currentCompleted} of{" "}
                                {currentPhase.topics.length}{" "}
                                completed
                            </span>

                        </div>

                        <div className="details-progress-bar">

                            <div
                                style={{
                                    width: `${currentProgress}%`,
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

                        <div className="topic-list">

                            {currentPhase.topics.map(
                                (topic, index) => {

                                    const topicText =
                                        getTopicText(topic);

                                    const key =
                                        getTopicKey(
                                            activePhase,
                                            topic
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
                                            }`}
                                            key={key}
                                        >

                                            {/* CHECK */}

                                            <button
                                                type="button"
                                                className="topic-check"
                                                onClick={() =>
                                                    toggleTopic(
                                                        topic
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
                                                    onClick={() =>
                                                        toggleTopic(
                                                            topic
                                                        )
                                                    }
                                                >
                                                    Start
                                                </button>

                                            )}

                                        </div>

                                    );
                                }
                            )}

                        </div>
                    )}


                    {/* =================================================
                        RESOURCES
                    ================================================= */}

                    {activeTab === "resources" && (

                        <div className="empty-tab">

                            <div>
                                📚
                            </div>

                            <h3>
                                Learning Resources
                            </h3>

                            <p>
                                Resources for this phase
                                will appear here.
                            </p>

                        </div>

                    )}


                    {/* =================================================
                        PRACTICE
                    ================================================= */}

                    {activeTab === "practice" && (

                        <div className="empty-tab">

                            <div>
                                🧪
                            </div>

                            <h3>
                                Practice
                            </h3>

                            <p>
                                Practice questions and coding
                                exercises will appear here.
                            </p>

                        </div>

                    )}


                    {/* =================================================
                        NOTES
                    ================================================= */}

                    {activeTab === "notes" && (

                        <div className="notes-box">

                            <textarea
                                placeholder="Write your notes for this phase..."
                            />

                            <button
                                type="button"
                            >
                                Save Notes
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

        </div>
    );
};

export default Roadmap;