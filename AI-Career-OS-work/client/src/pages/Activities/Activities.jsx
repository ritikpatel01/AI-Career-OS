import React, { useEffect, useMemo, useState } from "react";
import {
    getActivities,
    createActivity,
    deleteActivity,
} from "../../services/activityService";

import "./Activities.css";

// ======================================================
// ACTIVITY TYPES
// ======================================================

const ACTIVITY_TYPES = [
    {
        value: "learning",
        label: "Learning",
        icon: "📚",
        description: "Courses, tutorials, documentation and study",
    },
    {
        value: "project",
        label: "Project",
        icon: "💻",
        description: "Projects, features and development work",
    },
    {
        value: "dsa",
        label: "DSA",
        icon: "🧠",
        description: "Problems, algorithms and data structures",
    },
    {
        value: "interview",
        label: "Interview",
        icon: "🎯",
        description: "Mock interviews and interview preparation",
    },
    {
        value: "resume",
        label: "Resume",
        icon: "📄",
        description: "Resume updates and analysis",
    },
    {
        value: "github",
        label: "GitHub",
        icon: "🐙",
        description: "Repositories, commits and GitHub improvements",
    },
    {
        value: "job",
        label: "Job",
        icon: "💼",
        description: "Job applications and career activities",
    },
    {
        value: "skill",
        label: "Skill",
        icon: "⭐",
        description: "Skill development and practice",
    },
    {
        value: "roadmap",
        label: "Roadmap",
        icon: "🗺️",
        description: "Roadmap milestones and career goals",
    },
    {
        value: "other",
        label: "Other",
        icon: "📌",
        description: "Other career-related activity",
    },
];

// ======================================================
// HELPERS
// ======================================================

const getTypeInfo = (type) => {
    const normalized = String(type || "other").toLowerCase();

    return (
        ACTIVITY_TYPES.find(
            (item) => item.value === normalized
        ) || ACTIVITY_TYPES[ACTIVITY_TYPES.length - 1]
    );
};

const getActivityDate = (activity) => {
    return (
        activity.createdAt ||
        activity.updatedAt ||
        activity.date ||
        activity.timestamp ||
        null
    );
};

const formatRelativeTime = (dateValue) => {
    if (!dateValue) {
        return "Recently";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "Recently";
    }

    const now = new Date();
    const difference = now.getTime() - date.getTime();

    const seconds = Math.floor(difference / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) {
        return "Just now";
    }

    if (minutes < 60) {
        return `${minutes}m ago`;
    }

    if (hours < 24) {
        return `${hours}h ago`;
    }

    if (days < 7) {
        return `${days}d ago`;
    }

    return date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
};

const formatDate = (dateValue) => {
    if (!dateValue) {
        return "Date not available";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "Date not available";
    }

    return date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
};

const isToday = (dateValue) => {
    if (!dateValue) {
        return false;
    }

    const date = new Date(dateValue);
    const today = new Date();

    return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
    );
};

const isWithinLastDays = (dateValue, days) => {
    if (!dateValue) {
        return false;
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return false;
    }

    const now = new Date();

    const difference =
        now.getTime() - date.getTime();

    return (
        difference >= 0 &&
        difference <= days * 24 * 60 * 60 * 1000
    );
};

const getActivityId = (activity) => {
    return (
        activity._id ||
        activity.id ||
        activity.activityId
    );
};

// ======================================================
// MAIN COMPONENT
// ======================================================

const Activities = () => {
    // --------------------------------------------------
    // STATE
    // --------------------------------------------------

    const [activities, setActivities] = useState([]);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState("all");

    const [showForm, setShowForm] = useState(false);

    const [formData, setFormData] = useState({
        type: "project",
        title: "",
        description: "",
    });

    // ==================================================
    // FETCH ACTIVITIES
    // ==================================================

    const fetchActivities = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await getActivities();

            /*
             * Supports common API response formats:
             *
             * { data: [...] }
             * { data: { data: [...] } }
             * { activities: [...] }
             * [...]
             */

            let activityData = [];

            if (Array.isArray(response)) {
                activityData = response;
            } else if (Array.isArray(response?.data)) {
                activityData = response.data;
            } else if (
                Array.isArray(response?.data?.data)
            ) {
                activityData = response.data.data;
            } else if (
                Array.isArray(response?.activities)
            ) {
                activityData = response.activities;
            } else if (
                Array.isArray(response?.data?.activities)
            ) {
                activityData = response.data.activities;
            }

            setActivities(activityData);
        } catch (err) {
            console.error(
                "Fetch activities error:",
                err
            );

            setError(
                err?.message ||
                    "Unable to load your activity history."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities();
    }, []);

    // ==================================================
    // FORM HANDLERS
    // ==================================================

    const handleInputChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        const title = formData.title.trim();
        const description =
            formData.description.trim();

        if (!title) {
            setError(
                "Please enter a title for the activity."
            );
            return;
        }

        if (title.length < 3) {
            setError(
                "Activity title should contain at least 3 characters."
            );
            return;
        }

        if (!description) {
            setError(
                "Please add a short description."
            );
            return;
        }

        try {
            setSubmitting(true);

            await createActivity({
                type: formData.type,
                title,
                description,
            });

            setFormData({
                type: "project",
                title: "",
                description: "",
            });

            setSuccess(
                "Activity added successfully."
            );

            setShowForm(false);

            await fetchActivities();

            setTimeout(() => {
                setSuccess("");
            }, 3000);
        } catch (err) {
            console.error(
                "Create activity error:",
                err
            );

            setError(
                err?.message ||
                    "Unable to create the activity."
            );
        } finally {
            setSubmitting(false);
        }
    };

    // ==================================================
    // DELETE ACTIVITY
    // ==================================================

    const handleDelete = async (activity) => {
        const id = getActivityId(activity);

        if (!id) {
            setError(
                "This activity cannot be deleted because its ID is missing."
            );
            return;
        }

        const confirmed = window.confirm(
            "Are you sure you want to delete this activity?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setError("");
            setSuccess("");

            await deleteActivity(id);

            setActivities((previous) =>
                previous.filter(
                    (item) =>
                        getActivityId(item) !== id
                )
            );

            setSuccess(
                "Activity deleted successfully."
            );

            setTimeout(() => {
                setSuccess("");
            }, 3000);
        } catch (err) {
            console.error(
                "Delete activity error:",
                err
            );

            setError(
                err?.message ||
                    "Unable to delete the activity."
            );
        }
    };

    // ==================================================
    // FILTER ACTIVITIES
    // ==================================================

    const filteredActivities = useMemo(() => {
        const query = search.trim().toLowerCase();

        return activities.filter((activity) => {
            const title =
                String(activity.title || "")
                    .toLowerCase();

            const description =
                String(activity.description || "")
                    .toLowerCase();

            const type =
                String(activity.type || "")
                    .toLowerCase();

            const matchesSearch =
                !query ||
                title.includes(query) ||
                description.includes(query) ||
                type.includes(query);

            const matchesType =
                filterType === "all" ||
                type === filterType;

            return (
                matchesSearch &&
                matchesType
            );
        });
    }, [
        activities,
        search,
        filterType,
    ]);

    // ==================================================
    // STATISTICS
    // ==================================================

    const statistics = useMemo(() => {
        const total = activities.length;

        const thisWeek = activities.filter(
            (activity) =>
                isWithinLastDays(
                    getActivityDate(activity),
                    7
                )
        ).length;

        const today = activities.filter(
            (activity) =>
                isToday(
                    getActivityDate(activity)
                )
        ).length;

        const projects = activities.filter(
            (activity) =>
                String(activity.type || "")
                    .toLowerCase() === "project"
        ).length;

        const learning = activities.filter(
            (activity) =>
                String(activity.type || "")
                    .toLowerCase() === "learning"
        ).length;

        const dsa = activities.filter(
            (activity) =>
                String(activity.type || "")
                    .toLowerCase() === "dsa"
        ).length;

        const interviews = activities.filter(
            (activity) =>
                String(activity.type || "")
                    .toLowerCase() ===
                "interview"
        ).length;

        return {
            total,
            thisWeek,
            today,
            projects,
            learning,
            dsa,
            interviews,
        };
    }, [activities]);

    // ==================================================
    // ACTIVITY TYPE COUNTS
    // ==================================================

    const typeCounts = useMemo(() => {
        const counts = {};

        ACTIVITY_TYPES.forEach((item) => {
            counts[item.value] = 0;
        });

        activities.forEach((activity) => {
            const type = String(
                activity.type || "other"
            ).toLowerCase();

            if (
                Object.prototype.hasOwnProperty.call(
                    counts,
                    type
                )
            ) {
                counts[type] += 1;
            } else {
                counts.other += 1;
            }
        });

        return counts;
    }, [activities]);

    // ==================================================
    // GROUP ACTIVITIES BY DATE
    // ==================================================

    const groupedActivities = useMemo(() => {
        const groups = {};

        filteredActivities.forEach(
            (activity) => {
                const dateValue =
                    getActivityDate(activity);

                let group = "Older";

                if (isToday(dateValue)) {
                    group = "Today";
                } else if (
                    isWithinLastDays(
                        dateValue,
                        2
                    )
                ) {
                    group = "Yesterday";
                } else if (
                    isWithinLastDays(
                        dateValue,
                        7
                    )
                ) {
                    group = "This Week";
                }

                if (!groups[group]) {
                    groups[group] = [];
                }

                groups[group].push(activity);
            }
        );

        return groups;
    }, [filteredActivities]);

    const groupOrder = [
        "Today",
        "Yesterday",
        "This Week",
        "Older",
    ];

    // ==================================================
    // LOADING
    // ==================================================

    if (loading) {
        return (
            <div className="activities-page">
                <div className="activities-loading">
                    <div className="activities-spinner"></div>

                    <h2>
                        Loading your career activity
                    </h2>

                    <p>
                        Preparing your learning and
                        career history...
                    </p>
                </div>
            </div>
        );
    }

    // ==================================================
    // UI
    // ==================================================

    return (
        <div className="activities-page">

            {/* ==================================================
                HEADER
            ================================================== */}

            <header className="activities-header">

                <div className="activities-header-content">

                    <span className="activities-eyebrow">
                        CAREER ACTIVITY
                    </span>

                    <h1>
                        Activity History
                    </h1>

                    <p>
                        Track the work you do across
                        learning, projects, DSA,
                        interviews and career preparation.
                    </p>

                </div>

                <button
                    type="button"
                    className="activities-primary-button"
                    onClick={() => {
                        setShowForm(true);
                        setError("");
                    }}
                >
                    <span>+</span>
                    Add Activity
                </button>

            </header>

            {/* ==================================================
                ALERTS
            ================================================== */}

            {error && (
                <div className="activities-alert activities-alert-error">
                    <span>!</span>
                    <div>
                        <strong>
                            Something went wrong
                        </strong>
                        <p>{error}</p>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            setError("")
                        }
                    >
                        ×
                    </button>
                </div>
            )}

            {success && (
                <div className="activities-alert activities-alert-success">
                    <span>✓</span>

                    <div>
                        <strong>
                            Success
                        </strong>

                        <p>
                            {success}
                        </p>
                    </div>
                </div>
            )}

            {/* ==================================================
                STATISTICS
            ================================================== */}

            <section className="activities-stat-grid">

                <div className="activity-stat-card">
                    <div className="activity-stat-icon blue">
                        📋
                    </div>

                    <div>
                        <span>
                            Total Activities
                        </span>

                        <strong>
                            {statistics.total}
                        </strong>

                        <small>
                            Career actions recorded
                        </small>
                    </div>
                </div>

                <div className="activity-stat-card">
                    <div className="activity-stat-icon green">
                        📈
                    </div>

                    <div>
                        <span>
                            This Week
                        </span>

                        <strong>
                            {statistics.thisWeek}
                        </strong>

                        <small>
                            Activities in 7 days
                        </small>
                    </div>
                </div>

                <div className="activity-stat-card">
                    <div className="activity-stat-icon orange">
                        ⚡
                    </div>

                    <div>
                        <span>
                            Today
                        </span>

                        <strong>
                            {statistics.today}
                        </strong>

                        <small>
                            Actions completed today
                        </small>
                    </div>
                </div>

                <div className="activity-stat-card">
                    <div className="activity-stat-icon purple">
                        💻
                    </div>

                    <div>
                        <span>
                            Projects
                        </span>

                        <strong>
                            {statistics.projects}
                        </strong>

                        <small>
                            Projects recorded
                        </small>
                    </div>
                </div>

            </section>

            {/* ==================================================
                CAREER SUMMARY
            ================================================== */}

            <section className="activity-summary-card">

                <div className="activity-summary-header">

                    <div>
                        <span className="section-eyebrow">
                            CAREER EXECUTION
                        </span>

                        <h2>
                            Your activity at a glance
                        </h2>

                        <p>
                            Consistent activity is useful
                            because it shows how you are
                            actually spending your preparation
                            time.
                        </p>
                    </div>

                    <div className="activity-summary-total">
                        <strong>
                            {statistics.total}
                        </strong>

                        <span>
                            recorded
                        </span>
                    </div>

                </div>

                <div className="activity-breakdown">

                    <div className="breakdown-item">
                        <span>📚 Learning</span>
                        <strong>
                            {statistics.learning}
                        </strong>
                    </div>

                    <div className="breakdown-item">
                        <span>🧠 DSA</span>
                        <strong>
                            {statistics.dsa}
                        </strong>
                    </div>

                    <div className="breakdown-item">
                        <span>🎯 Interviews</span>
                        <strong>
                            {statistics.interviews}
                        </strong>
                    </div>

                    <div className="breakdown-item">
                        <span>💻 Projects</span>
                        <strong>
                            {statistics.projects}
                        </strong>
                    </div>

                </div>

            </section>

            {/* ==================================================
                ADD ACTIVITY FORM
            ================================================== */}

            {showForm && (
                <section className="activity-form-card">

                    <div className="activity-form-header">

                        <div>
                            <span className="section-eyebrow">
                                NEW CAREER RECORD
                            </span>

                            <h2>
                                Add an activity
                            </h2>

                            <p>
                                Record something meaningful
                                you completed or worked on.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="activity-close-button"
                            onClick={() => {
                                setShowForm(false);
                                setError("");
                            }}
                        >
                            ×
                        </button>

                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="activity-form"
                    >

                        <div className="activity-form-grid">

                            <div className="activity-form-group">

                                <label htmlFor="activity-type">
                                    Activity Type
                                </label>

                                <select
                                    id="activity-type"
                                    name="type"
                                    value={
                                        formData.type
                                    }
                                    onChange={
                                        handleInputChange
                                    }
                                >
                                    {ACTIVITY_TYPES.map(
                                        (item) => (
                                            <option
                                                key={
                                                    item.value
                                                }
                                                value={
                                                    item.value
                                                }
                                            >
                                                {
                                                    item.icon
                                                }{" "}
                                                {
                                                    item.label
                                                }
                                            </option>
                                        )
                                    )}
                                </select>

                                <small>
                                    {
                                        getTypeInfo(
                                            formData.type
                                        ).description
                                    }
                                </small>

                            </div>

                            <div className="activity-form-group">

                                <label htmlFor="activity-title">
                                    Activity Title
                                </label>

                                <input
                                    id="activity-title"
                                    name="title"
                                    type="text"
                                    value={
                                        formData.title
                                    }
                                    onChange={
                                        handleInputChange
                                    }
                                    placeholder="e.g. Completed React authentication module"
                                    maxLength={150}
                                />

                                <small>
                                    {formData.title.length}
                                    /150 characters
                                </small>

                            </div>

                        </div>

                        <div className="activity-form-group">

                            <label htmlFor="activity-description">
                                Description
                            </label>

                            <textarea
                                id="activity-description"
                                name="description"
                                value={
                                    formData.description
                                }
                                onChange={
                                    handleInputChange
                                }
                                placeholder="Describe what you learned, built, solved or completed..."
                                rows={5}
                                maxLength={1000}
                            />

                            <small>
                                {
                                    formData.description
                                        .length
                                }
                                /1000 characters
                            </small>

                        </div>

                        <div className="activity-form-actions">

                            <button
                                type="button"
                                className="activity-secondary-button"
                                onClick={() => {
                                    setShowForm(false);
                                    setError("");
                                }}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="activities-primary-button"
                                disabled={
                                    submitting
                                }
                            >
                                {submitting
                                    ? "Saving..."
                                    : "Save Activity"}
                            </button>

                        </div>

                    </form>

                </section>
            )}

            {/* ==================================================
                ACTIVITY CONTROLS
            ================================================== */}

            <section className="activity-history-section">

                <div className="activity-history-header">

                    <div>
                        <span className="section-eyebrow">
                            YOUR HISTORY
                        </span>

                        <h2>
                            Recent Activities
                        </h2>

                        <p>
                            Review the actions contributing
                            to your career progress.
                        </p>
                    </div>

                    <span className="activity-result-count">
                        {filteredActivities.length}{" "}
                        {filteredActivities.length ===
                        1
                            ? "activity"
                            : "activities"}
                    </span>

                </div>

                <div className="activity-controls">

                    <div className="activity-search">

                        <span>⌕</span>

                        <input
                            type="text"
                            placeholder="Search your activities..."
                            value={search}
                            onChange={(event) =>
                                setSearch(
                                    event.target.value
                                )
                            }
                        />

                        {search && (
                            <button
                                type="button"
                                onClick={() =>
                                    setSearch("")
                                }
                            >
                                ×
                            </button>
                        )}

                    </div>

                    <select
                        value={filterType}
                        onChange={(event) =>
                            setFilterType(
                                event.target.value
                            )
                        }
                        className="activity-filter"
                    >
                        <option value="all">
                            All activity types
                        </option>

                        {ACTIVITY_TYPES.map(
                            (item) => (
                                <option
                                    key={item.value}
                                    value={item.value}
                                >
                                    {item.label}
                                </option>
                            )
                        )}
                    </select>

                </div>

                {/* ==================================================
                    EMPTY STATE
                ================================================== */}

                {filteredActivities.length === 0 && (
                    <div className="activity-empty-state">

                        <div className="activity-empty-icon">
                            {activities.length ===
                            0
                                ? "🚀"
                                : "🔎"}
                        </div>

                        <h3>
                            {activities.length ===
                            0
                                ? "Start building your activity history"
                                : "No activities found"}
                        </h3>

                        <p>
                            {activities.length ===
                            0
                                ? "Record projects, DSA practice, learning sessions and interview preparation to build a useful career history."
                                : "Try another search term or change the activity type filter."}
                        </p>

                        {activities.length ===
                            0 && (
                            <button
                                type="button"
                                className="activities-primary-button"
                                onClick={() =>
                                    setShowForm(
                                        true
                                    )
                                }
                            >
                                Add Your First Activity
                            </button>
                        )}

                    </div>
                )}

                {/* ==================================================
                    TIMELINE
                ================================================== */}

                {filteredActivities.length >
                    0 && (
                    <div className="activities-timeline">

                        {groupOrder.map(
                            (groupName) => {
                                const group =
                                    groupedActivities[
                                        groupName
                                    ];

                                if (
                                    !group ||
                                    group.length ===
                                        0
                                ) {
                                    return null;
                                }

                                return (
                                    <div
                                        className="activity-group"
                                        key={
                                            groupName
                                        }
                                    >

                                        <div className="activity-group-title">
                                            {groupName}
                                        </div>

                                        {group.map(
                                            (
                                                activity
                                            ) => {
                                                const typeInfo =
                                                    getTypeInfo(
                                                        activity.type
                                                    );

                                                const activityId =
                                                    getActivityId(
                                                        activity
                                                    );

                                                return (
                                                    <article
                                                        className="activity-item"
                                                        key={
                                                            activityId ||
                                                            `${activity.title}-${getActivityDate(
                                                                activity
                                                            )}`
                                                        }
                                                    >

                                                        <div
                                                            className={`activity-timeline-icon ${activity.type || "other"}`}
                                                        >
                                                            {
                                                                typeInfo.icon
                                                            }
                                                        </div>

                                                        <div className="activity-item-content">

                                                            <div className="activity-item-top">

                                                                <div>

                                                                    <span className="activity-type-badge">
                                                                        {
                                                                            typeInfo.label
                                                                        }
                                                                    </span>

                                                                    <h3>
                                                                        {
                                                                            activity.title
                                                                        }
                                                                    </h3>

                                                                </div>

                                                                <span className="activity-time">
                                                                    {formatRelativeTime(
                                                                        getActivityDate(
                                                                            activity
                                                                        )
                                                                    )}
                                                                </span>

                                                            </div>

                                                            {activity.description && (
                                                                <p>
                                                                    {
                                                                        activity.description
                                                                    }
                                                                </p>
                                                            )}

                                                            <div className="activity-item-footer">

                                                                <span>
                                                                    {formatDate(
                                                                        getActivityDate(
                                                                            activity
                                                                        )
                                                                    )}
                                                                </span>

                                                                {activityId && (
                                                                    <button
                                                                        type="button"
                                                                        className="activity-delete-button"
                                                                        onClick={() =>
                                                                            handleDelete(
                                                                                activity
                                                                            )
                                                                        }
                                                                    >
                                                                        Delete
                                                                    </button>
                                                                )}

                                                            </div>

                                                        </div>

                                                    </article>
                                                );
                                            }
                                        )}

                                    </div>
                                );
                            }
                        )}

                    </div>
                )}

            </section>

            {/* ==================================================
                CAREER TIP
            ================================================== */}

            <section className="activity-tip-card">

                <div className="activity-tip-icon">
                    💡
                </div>

                <div>
                    <span>
                        CAREER TIP
                    </span>

                    <h3>
                        Record evidence, not just effort
                    </h3>

                    <p>
                        Instead of writing "studied
                        JavaScript", record what you
                        actually completed — for example,
                        "built a REST API using Express and
                        MongoDB". This makes your activity
                        history more useful when reviewing
                        your career progress.
                    </p>
                </div>

            </section>

        </div>
    );
};

export default Activities;