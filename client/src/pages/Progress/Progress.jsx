import { useEffect, useRef, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    getProgress,
    createProgress,
} from "../../services/progressService";

import "./Progress.css";

const Progress = () => {
    const navigate = useNavigate();

    const [progress, setProgress] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const saveInFlight = useRef(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [showForm, setShowForm] = useState(false);

    const [formData, setFormData] = useState({
        category: "dsa",
        completed: 0,
        total: 0,
        percentage: 0,
    });

    /* =====================================================
       PROGRESS AREAS
    ===================================================== */

    const progressAreas = [
        {
            category: "dsa",
            name: "DSA",
            description:
                "Track problem solving, algorithms and interview preparation.",
            icon: "⌘",
            path: "/dsa",
            className: "blue",
        },
        {
            category: "skills",
            name: "Skills",
            description:
                "Build and strengthen the technical skills required for your target career.",
            icon: "⚡",
            path: "/skills",
            className: "purple",
        },
        {
            category: "projects",
            name: "Projects",
            description:
                "Measure your progress through real-world projects and portfolio work.",
            icon: "◈",
            path: "/projects",
            className: "green",
        },
        {
            category: "interview",
            name: "Interviews",
            description:
                "Track interview practice, technical answers and interview readiness.",
            icon: "◎",
            path: "/interview",
            className: "orange",
        },
        {
            category: "roadmap",
            name: "Roadmap",
            description:
                "Follow your career roadmap and complete important milestones.",
            icon: "◇",
            path: "/roadmap",
            className: "pink",
        },
        {
            category: "career",
            name: "Career",
            description:
                "Improve your overall career profile, resume and job readiness.",
            icon: "★",
            path: "/profile",
            className: "cyan",
        },
    ];

    /* =====================================================
       FETCH PROGRESS
    ===================================================== */

    useEffect(() => {
        fetchProgress();
    }, []);

    const fetchProgress = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await getProgress();

            setProgress(
                Array.isArray(response?.data)
                    ? response.data
                    : []
            );
        } catch (err) {
            console.error("Progress Fetch Error:", err);

            setError(
                err?.message ||
                    "Unable to load your progress."
            );
        } finally {
            setLoading(false);
        }
    };

    /* =====================================================
       FIND CATEGORY PROGRESS
    ===================================================== */

    const getCategoryProgress = (category) => {
        const item = progress.find(
            (progressItem) =>
                String(progressItem.category || "").toLowerCase() ===
                category.toLowerCase()
        );

        if (!item) {
            return {
                completed: 0,
                total: 0,
                percentage: 0,
            };
        }

        const completed = Number(item.completed) || 0;
        const total = Number(item.total) || 0;

        let percentage = Number(item.percentage);

        if (!Number.isFinite(percentage)) {
            percentage =
                total > 0
                    ? Math.round(
                          (completed / total) * 100
                      )
                    : 0;
        }

        percentage = Math.max(
            0,
            Math.min(100, Math.round(percentage))
        );

        return {
            completed,
            total,
            percentage,
        };
    };

    /* =====================================================
       CALCULATED OVERALL PROGRESS
    ===================================================== */

    const calculatedProgress = useMemo(() => {
        const values = progressAreas.map(
            (item) =>
                getCategoryProgress(item.category)
                    .percentage
        );

        if (!values.length) {
            return 0;
        }

        const total = values.reduce(
            (sum, value) => sum + value,
            0
        );

        return Math.round(
            total / values.length
        );
    }, [progress]);

    /* =====================================================
       ACTIVE AREAS
    ===================================================== */

    const activeAreas = useMemo(() => {
        return progressAreas.filter(
            (item) =>
                getCategoryProgress(
                    item.category
                ).percentage > 0
        ).length;
    }, [progress]);

    /* =====================================================
       COMPLETED ITEMS
    ===================================================== */

    const completedItems = useMemo(() => {
        return progress.reduce(
            (total, item) =>
                total +
                (Number(item.completed) || 0),
            0
        );
    }, [progress]);

    /* =====================================================
       TOTAL TRACKED ITEMS
    ===================================================== */

    const totalTrackedItems = useMemo(() => {
        return progress.reduce(
            (total, item) =>
                total +
                (Number(item.total) || 0),
            0
        );
    }, [progress]);

    /* =====================================================
       FORM HANDLERS
    ===================================================== */

    const handleChange = (event) => {
        if (saveInFlight.current) return;
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    /* =====================================================
       CREATE PROGRESS
    ===================================================== */

    const changeFormVisibility = (value) => {
        if (!saveInFlight.current) setShowForm(value);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (saveInFlight.current) return;

        setError("");
        setSuccess("");

        const completed = Number(
            formData.completed
        );

        const total = Number(formData.total);

        if (
            Number.isNaN(completed) ||
            Number.isNaN(total)
        ) {
            setError(
                "Completed and Total must be valid numbers."
            );
            return;
        }

        if (completed < 0 || total < 0) {
            setError(
                "Completed and Total cannot be negative."
            );
            return;
        }

        if (total > 0 && completed > total) {
            setError(
                "Completed items cannot be greater than total items."
            );
            return;
        }

        const percentage =
            total > 0
                ? Math.round(
                      (completed / total) * 100
                  )
                : 0;

        try {
            saveInFlight.current = true;
            setSaving(true);

            await createProgress({
                category: formData.category,
                completed,
                total,
                percentage,
            });

            setSuccess(
                "Progress updated successfully."
            );

            setFormData({
                category: "dsa",
                completed: 0,
                total: 0,
                percentage: 0,
            });

            await fetchProgress();

            setShowForm(false);

            window.scrollTo({
                top: 0,
                behavior: "smooth",
            });
        } catch (err) {
            console.error(
                "Create Progress Error:",
                err
            );

            setError(
                err?.message ||
                    "Unable to update progress."
            );
        } finally {
            saveInFlight.current = false;
            setSaving(false);
        }
    };

    /* =====================================================
       QUICK UPDATE
    ===================================================== */

    const openProgressForm = (category) => {
        if (saveInFlight.current) return;
        const current =
            getCategoryProgress(category);

        setFormData({
            category,
            completed: current.completed,
            total: current.total,
            percentage: current.percentage,
        });

        setShowForm(true);

        setTimeout(() => {
            document
                .getElementById(
                    "progress-update-form"
                )
                ?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
        }, 100);
    };

    /* =====================================================
       PROGRESS LABEL
    ===================================================== */

    const getProgressLabel = (percentage) => {
        if (percentage === 0) {
            return "Not started";
        }

        if (percentage < 30) {
            return "Getting started";
        }

        if (percentage < 60) {
            return "Making progress";
        }

        if (percentage < 80) {
            return "Good progress";
        }

        if (percentage < 100) {
            return "Almost there";
        }

        return "Completed";
    };

    /* =====================================================
       PROGRESS COLOR CLASS
    ===================================================== */

    const getProgressLevel = (percentage) => {
        if (percentage === 0) {
            return "level-zero";
        }

        if (percentage < 40) {
            return "level-low";
        }

        if (percentage < 70) {
            return "level-medium";
        }

        if (percentage < 100) {
            return "level-high";
        }

        return "level-complete";
    };

    /* =====================================================
       NEXT ACTION
    ===================================================== */

    const nextAction = useMemo(() => {
        const sorted = progressAreas
            .map((area) => ({
                ...area,
                progress:
                    getCategoryProgress(
                        area.category
                    ).percentage,
            }))
            .sort(
                (a, b) =>
                    a.progress - b.progress
            );

        return sorted[0] || null;
    }, [progress]);

    /* =====================================================
       LOADING
    ===================================================== */

    if (loading) {
        return (
            <div className="progress-page">
                <div className="progress-loading" role="status">
                    <div className="progress-spinner" />

                    <h2>
                        Loading your progress...
                    </h2>

                    <p>
                        Preparing your career
                        development overview.
                    </p>
                </div>
            </div>
        );
    }

    /* =====================================================
       UI
    ===================================================== */

    return (
        <div className="progress-page">

            {/* =========================================
                HEADER
            ========================================= */}

            <header className="progress-page-header">

                <div>
                    <span className="progress-eyebrow">
                        CAREER DEVELOPMENT
                    </span>

                    <h1>
                        My Progress
                    </h1>

                    <p>
                        See how your skills,
                        projects, learning and
                        interview preparation are
                        developing over time.
                    </p>
                </div>

                <button
                    type="button"
                    className="progress-primary-button"
                    disabled={saving}
                    onClick={() =>
                        changeFormVisibility(
                            (previous) =>
                                !previous
                        )
                    }
                >
                    {showForm
                        ? "Close Update"
                        : "+ Update Progress"}
                </button>

            </header>

            {/* =========================================
                ERROR / SUCCESS
            ========================================= */}

            {error && (
                <div className="progress-alert progress-alert-error" role="alert">
                    <span>!</span>
                    <p>{error}</p>
                </div>
            )}

            {success && (
                <div className="progress-alert progress-alert-success" role="status">
                    <span>✓</span>
                    <p>{success}</p>
                </div>
            )}

            {/* =========================================
                OVERALL PROGRESS HERO
            ========================================= */}

            <section className="overall-progress-card">

                <div className="overall-progress-content">

                    <div className="overall-progress-left">

                        <span className="card-eyebrow">
                            OVERALL CAREER PROGRESS
                        </span>

                        <h2>
                            Your career journey
                        </h2>

                        <p>
                            This overview combines
                            the progress you have
                            recorded across your
                            main career development
                            areas.
                        </p>

                        <div className="overall-progress-bar">

                            <div
                                className="overall-progress-fill"
                                style={{
                                    width: `${calculatedProgress}%`,
                                }}
                            />

                        </div>

                        <div className="overall-progress-footer">

                            <span>
                                {calculatedProgress}% complete
                            </span>

                            <span>
                                {activeAreas} of{" "}
                                {progressAreas.length}{" "}
                                areas active
                            </span>

                        </div>

                    </div>

                    <div className="overall-progress-number">

                        <strong>
                            {calculatedProgress}%
                        </strong>

                        <span>
                            Overall
                        </span>

                    </div>

                </div>

            </section>

            {/* =========================================
                SUMMARY CARDS
            ========================================= */}

            <section className="progress-summary-grid">

                <div className="progress-summary-card">

                    <div className="summary-icon blue">
                        ◉
                    </div>

                    <div>
                        <span>
                            ACTIVE AREAS
                        </span>

                        <strong>
                            {activeAreas}
                        </strong>

                        <small>
                            Areas currently being
                            developed
                        </small>
                    </div>

                </div>

                <div className="progress-summary-card">

                    <div className="summary-icon green">
                        ✓
                    </div>

                    <div>
                        <span>
                            COMPLETED
                        </span>

                        <strong>
                            {completedItems}
                        </strong>

                        <small>
                            Items completed
                        </small>
                    </div>

                </div>

                <div className="progress-summary-card">

                    <div className="summary-icon purple">
                        ◇
                    </div>

                    <div>
                        <span>
                            TRACKED
                        </span>

                        <strong>
                            {totalTrackedItems}
                        </strong>

                        <small>
                            Total learning items
                        </small>
                    </div>

                </div>

                <div className="progress-summary-card">

                    <div className="summary-icon orange">
                        ↗
                    </div>

                    <div>
                        <span>
                            FOCUS AREA
                        </span>

                        <strong>
                            {nextAction
                                ? nextAction.name
                                : "Start"}
                        </strong>

                        <small>
                            Area needing attention
                        </small>
                    </div>

                </div>

            </section>

            {/* =========================================
                UPDATE FORM
            ========================================= */}

            {showForm && (
                <section
                    id="progress-update-form"
                    className="progress-form-card"
                >

                    <div className="progress-section-heading">

                        <div>
                            <span className="section-eyebrow">
                                MANUAL UPDATE
                            </span>

                            <h2>
                                Update your progress
                            </h2>

                            <p>
                                Record completed work
                                so your career dashboard
                                stays accurate.
                            </p>
                        </div>

                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="progress-form"
                    >

                        <div className="progress-field">

                            <label htmlFor="category">
                                Development Area
                            </label>

                            <select
                                disabled={saving}
                                id="category"
                                name="category"
                                value={
                                    formData.category
                                }
                                onChange={
                                    handleChange
                                }
                            >

                                {progressAreas.map(
                                    (area) => (
                                        <option
                                            key={
                                                area.category
                                            }
                                            value={
                                                area.category
                                            }
                                        >
                                            {area.name}
                                        </option>
                                    )
                                )}

                            </select>

                        </div>

                        <div className="progress-field">

                            <label htmlFor="completed">
                                Completed Items
                            </label>

                            <input
                                disabled={saving}
                                id="completed"
                                type="number"
                                name="completed"
                                min="0"
                                value={
                                    formData.completed
                                }
                                onChange={
                                    handleChange
                                }
                            />

                        </div>

                        <div className="progress-field">

                            <label htmlFor="total">
                                Total Items
                            </label>

                            <input
                                disabled={saving}
                                id="total"
                                type="number"
                                name="total"
                                min="0"
                                value={
                                    formData.total
                                }
                                onChange={
                                    handleChange
                                }
                            />

                        </div>

                        <div className="progress-calculated">

                            <span>
                                Calculated Progress
                            </span>

                            <strong>
                                {formData.total > 0
                                    ? Math.round(
                                          (Number(
                                              formData.completed
                                          ) /
                                              Number(
                                                  formData.total
                                              )) *
                                              100
                                      )
                                    : 0}
                                %
                            </strong>

                        </div>

                        <div className="progress-form-actions">

                            <button
                                type="button"
                                disabled={saving}
                                className="progress-secondary-button"
                                onClick={() =>
                                    changeFormVisibility(false)
                                }
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="progress-primary-button"
                                disabled={saving}
                            >
                                {saving
                                    ? "Saving..."
                                    : "Save Progress"}
                            </button>

                        </div>

                    </form>

                </section>
            )}

            {/* =========================================
                CAREER DEVELOPMENT
            ========================================= */}

            <section className="progress-section">

                <div className="progress-section-heading">

                    <div>
                        <span className="section-eyebrow">
                            DEVELOPMENT AREAS
                        </span>

                        <h2>
                            Career development
                        </h2>

                        <p>
                            Track the areas that
                            contribute to your overall
                            career readiness.
                        </p>
                    </div>

                </div>

                <div className="career-progress-grid">

                    {progressAreas.map((area) => {

                        const current =
                            getCategoryProgress(
                                area.category
                            );

                        const level =
                            getProgressLevel(
                                current.percentage
                            );

                        return (
                            <article
                                className="career-progress-card"
                                key={
                                    area.category
                                }
                            >

                                <div className="career-card-top">

                                    <div
                                        className={`career-card-icon ${area.className}`}
                                    >
                                        {
                                            area.icon
                                        }
                                    </div>

                                    <div className="career-card-title">

                                        <h3>
                                            {area.name}
                                        </h3>

                                        <span
                                            className={level}
                                        >
                                            {
                                                getProgressLabel(
                                                    current.percentage
                                                )
                                            }
                                        </span>

                                    </div>

                                    <strong className="career-percentage">
                                        {
                                            current.percentage
                                        }
                                        %
                                    </strong>

                                </div>

                                <p className="career-card-description">
                                    {
                                        area.description
                                    }
                                </p>

                                <div className="career-progress-track">

                                    <div
                                        className={`career-progress-fill ${area.className}`}
                                        style={{
                                            width: `${current.percentage}%`,
                                        }}
                                    />

                                </div>

                                <div className="career-card-meta">

                                    <span>
                                        {current.completed}{" "}
                                        completed
                                    </span>

                                    <span>
                                        {current.total}{" "}
                                        total
                                    </span>

                                </div>

                                <div className="career-card-actions">

                                    <button
                                        type="button"
                                        disabled={saving}
                                        onClick={() =>
                                            openProgressForm(
                                                area.category
                                            )
                                        }
                                    >
                                        Update
                                    </button>

                                    <button
                                        type="button"
                                        className="link-button"
                                        onClick={() =>
                                            navigate(
                                                area.path
                                            )
                                        }
                                    >
                                        Open →
                                    </button>

                                </div>

                            </article>
                        );
                    })}

                </div>

            </section>

            {/* =========================================
                NEXT FOCUS
            ========================================= */}

            {nextAction && (
                <section className="next-focus-card">

                    <div className="next-focus-icon">
                        →
                    </div>

                    <div className="next-focus-content">

                        <span>
                            RECOMMENDED NEXT FOCUS
                        </span>

                        <h2>
                            Continue working on{" "}
                            {nextAction.name}
                        </h2>

                        <p>
                            Your recorded progress is
                            currently{" "}
                            {
                                getCategoryProgress(
                                    nextAction.category
                                ).percentage
                            }
                            %. Continue this area to
                            strengthen your overall
                            career profile.
                        </p>

                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                nextAction.path
                            )
                        }
                    >
                        Continue →
                    </button>

                </section>
            )}

            {/* =========================================
                HOW PROGRESS WORKS
            ========================================= */}

            <section className="progress-info-section">

                <div className="progress-info-header">

                    <div>
                        <span className="section-eyebrow">
                            CAREER OS
                        </span>

                        <h2>
                            How your progress works
                        </h2>

                        <p>
                            Your Progress page is
                            designed to become a
                            central measurement layer
                            for the rest of AI Career OS.
                        </p>
                    </div>

                </div>

                <div className="progress-flow">

                    <div className="progress-flow-item">

                        <div className="flow-number">
                            01
                        </div>

                        <h3>
                            Learn
                        </h3>

                        <p>
                            Study skills, DSA,
                            interview concepts and
                            career topics.
                        </p>

                    </div>

                    <div className="flow-line" />

                    <div className="progress-flow-item">

                        <div className="flow-number">
                            02
                        </div>

                        <h3>
                            Build
                        </h3>

                        <p>
                            Create projects and
                            demonstrate practical
                            skills.
                        </p>

                    </div>

                    <div className="flow-line" />

                    <div className="progress-flow-item">

                        <div className="flow-number">
                            03
                        </div>

                        <h3>
                            Practice
                        </h3>

                        <p>
                            Solve DSA problems and
                            practice interviews.
                        </p>

                    </div>

                    <div className="flow-line" />

                    <div className="progress-flow-item">

                        <div className="flow-number">
                            04
                        </div>

                        <h3>
                            Measure
                        </h3>

                        <p>
                            Use your progress to
                            identify what needs more
                            attention.
                        </p>

                    </div>

                </div>

            </section>

        </div>
    );
};

export default function ProgressDesktopCanvas() {
    return (
        <div className="progress-desktop-scroll" role="region" aria-label="Progress page. Scroll horizontally to view all content on narrow screens." tabIndex={0}>
            <div className="progress-desktop-canvas">
                <Progress />
            </div>
        </div>
    );
}