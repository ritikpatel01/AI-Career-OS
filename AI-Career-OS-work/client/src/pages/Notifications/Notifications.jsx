import React, { useMemo, useState } from "react";
import "./Notifications.css";

const initialNotifications = [
    {
        id: 1,
        category: "Jobs",
        type: "JOB MATCH",
        icon: "💼",
        title: "New job match for you!",
        message:
            "A Full Stack Developer position at Tech Solutions matches 92% of your profile.",
        meta: [
            "Tech Solutions",
            "Bengaluru, India",
            "92% Match",
        ],
        time: "10 minutes ago",
        unread: true,
        action: "View Job",
        link: "/jobs",
    },

    {
        id: 2,
        category: "Applications",
        type: "APPLICATION UPDATE",
        icon: "📄",
        title: "Application under review",
        message:
            "Your application for Backend Developer at ABC Technologies is now under review.",
        meta: [
            "ABC Technologies",
            "Pune, India",
        ],
        time: "2 hours ago",
        unread: true,
        action: "View Application",
        link: "/jobs",
    },

    {
        id: 3,
        category: "Interviews",
        type: "INTERVIEW REMINDER",
        icon: "📅",
        title: "Interview scheduled",
        message:
            "Your technical interview for Frontend Developer is scheduled for tomorrow.",
        meta: [
            "Oct 2, 2026",
            "10:00 AM",
            "Google Meet",
        ],
        time: "5 hours ago",
        unread: true,
        action: "View Details",
        link: "/interview",
    },

    {
        id: 4,
        category: "Learning",
        type: "LEARNING REMINDER",
        icon: "📚",
        title: "Daily learning reminder",
        message:
            "You have 3 DSA problems pending for today's learning goal.",
        meta: [
            "Arrays",
            "Stacks",
            "Binary Trees",
        ],
        time: "8 hours ago",
        unread: false,
        action: "Start Practice",
        link: "/dsa",
    },

    {
        id: 5,
        category: "Resume",
        type: "RESUME ANALYSIS",
        icon: "📋",
        title: "Resume analysis complete",
        message:
            "Your resume has been analyzed. 3 strengths and 2 improvement areas were identified.",
        meta: [],
        time: "1 day ago",
        unread: false,
        action: "View Analysis",
        link: "/resume",
    },

    {
        id: 6,
        category: "GitHub",
        type: "GITHUB INSIGHT",
        icon: "🐙",
        title: "Repository improvement suggestion",
        message:
            'Your repository "portfolio-website" does not have a README. Adding one can help recruiters understand your project.',
        meta: [],
        time: "2 days ago",
        unread: false,
        action: "View Repository",
        link: "/github",
    },

    {
        id: 7,
        category: "System",
        type: "SYSTEM",
        icon: "🔔",
        title: "Profile information saved",
        message:
            "Your career profile was successfully updated.",
        meta: [],
        time: "3 days ago",
        unread: false,
        action: "View Profile",
        link: "/profile",
    },
];


const categories = [
    {
        key: "All",
        label: "All",
        icon: "🔔",
    },
    {
        key: "Jobs",
        label: "Jobs",
        icon: "💼",
    },
    {
        key: "Applications",
        label: "Applications",
        icon: "📄",
    },
    {
        key: "Interviews",
        label: "Interviews",
        icon: "📅",
    },
    {
        key: "Learning",
        label: "Learning",
        icon: "📚",
    },
    {
        key: "Resume",
        label: "Resume",
        icon: "📋",
    },
    {
        key: "GitHub",
        label: "GitHub",
        icon: "🐙",
    },
    {
        key: "System",
        label: "System",
        icon: "🔔",
    },
];


const Notifications = () => {

    const [notifications, setNotifications] =
        useState(initialNotifications);

    const [activeCategory, setActiveCategory] =
        useState("All");

    const [search, setSearch] =
        useState("");

    const [preferences, setPreferences] =
        useState({
            jobs: true,
            applications: true,
            interviews: true,
            learning: true,
            resume: true,
            github: true,
            system: false,
        });

    const [quietHours, setQuietHours] =
        useState({
            enabled: true,
            from: "23:00",
            to: "07:00",
        });


    // =========================================================
    // UNREAD COUNT
    // =========================================================

    const unreadCount = useMemo(() => {
        return notifications.filter(
            (notification) =>
                notification.unread
        ).length;
    }, [notifications]);


    // =========================================================
    // CATEGORY COUNTS
    // =========================================================

    const getCategoryCount = (category) => {

        if (category === "All") {
            return unreadCount;
        }

        return notifications.filter(
            (notification) =>
                notification.category === category &&
                notification.unread
        ).length;
    };


    // =========================================================
    // FILTER NOTIFICATIONS
    // =========================================================

    const filteredNotifications =
        useMemo(() => {

            const query =
                search
                    .trim()
                    .toLowerCase();

            return notifications.filter(
                (notification) => {

                    const matchesCategory =
                        activeCategory === "All" ||
                        notification.category ===
                            activeCategory;

                    const matchesSearch =
                        !query ||
                        notification.title
                            .toLowerCase()
                            .includes(query) ||
                        notification.message
                            .toLowerCase()
                            .includes(query) ||
                        notification.category
                            .toLowerCase()
                            .includes(query);

                    return (
                        matchesCategory &&
                        matchesSearch
                    );
                }
            );

        }, [
            notifications,
            activeCategory,
            search,
        ]);


    // =========================================================
    // MARK ONE AS READ
    // =========================================================

    const markAsRead = (id) => {

        setNotifications(
            (current) =>
                current.map(
                    (notification) =>
                        notification.id === id
                            ? {
                                  ...notification,
                                  unread: false,
                              }
                            : notification
                )
        );
    };


    // =========================================================
    // MARK ALL AS READ
    // =========================================================

    const markAllAsRead = () => {

        setNotifications(
            (current) =>
                current.map(
                    (notification) => ({
                        ...notification,
                        unread: false,
                    })
                )
        );
    };


    // =========================================================
    // NOTIFICATION CLICK
    // =========================================================

    const handleNotificationClick =
        (notification) => {

            markAsRead(notification.id);

            if (notification.link) {
                window.location.href =
                    notification.link;
            }
        };


    // =========================================================
    // PREFERENCE TOGGLE
    // =========================================================

    const togglePreference = (key) => {

        setPreferences(
            (current) => ({
                ...current,
                [key]: !current[key],
            })
        );
    };


    // =========================================================
    // SAVE PREFERENCES
    // =========================================================

    const savePreferences = () => {

        localStorage.setItem(
            "notificationPreferences",
            JSON.stringify(preferences)
        );

        localStorage.setItem(
            "notificationQuietHours",
            JSON.stringify(quietHours)
        );

        window.alert(
            "Notification preferences saved successfully."
        );
    };


    // =========================================================
    // RENDER
    // =========================================================

    return (
        <div className="notifications-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="notifications-header">

                <div>
                    <div className="notifications-eyebrow">
                        CAREER ACTIVITY
                    </div>

                    <h1>
                        Notifications
                    </h1>

                    <p>
                        Stay updated on jobs,
                        applications, learning goals,
                        interviews, and important
                        career activities.
                    </p>
                </div>


                <div className="notifications-header-actions">

                    <div className="notification-search">

                        <span>
                            🔍
                        </span>

                        <input
                            type="text"
                            placeholder="Search notifications..."
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
                                className="clear-search"
                                onClick={() =>
                                    setSearch("")
                                }
                            >
                                ×
                            </button>
                        )}

                    </div>


                    <button
                        type="button"
                        className="mark-all-button"
                        onClick={markAllAsRead}
                        disabled={
                            unreadCount === 0
                        }
                    >
                        ✓ Mark all as read
                    </button>

                </div>

            </div>


            {/* =================================================
                MAIN GRID
            ================================================= */}

            <div className="notifications-layout">

                {/* =================================================
                    LEFT / MAIN
                ================================================= */}

                <main className="notifications-main">

                    {/* =============================================
                        CATEGORY TABS
                    ============================================= */}

                    <div className="notification-tabs">

                        {categories.map(
                            (category) => {

                                const count =
                                    getCategoryCount(
                                        category.key
                                    );

                                return (
                                    <button
                                        key={
                                            category.key
                                        }
                                        type="button"
                                        className={
                                            activeCategory ===
                                            category.key
                                                ? "notification-tab active"
                                                : "notification-tab"
                                        }
                                        onClick={() =>
                                            setActiveCategory(
                                                category.key
                                            )
                                        }
                                    >

                                        <span>
                                            {
                                                category.icon
                                            }
                                        </span>

                                        <span>
                                            {
                                                category.label
                                            }
                                        </span>

                                        {count > 0 && (
                                            <span className="tab-count">
                                                {count}
                                            </span>
                                        )}

                                    </button>
                                );
                            }
                        )}

                    </div>


                    {/* =============================================
                        RESULT HEADER
                    ============================================= */}

                    <div className="notification-list-header">

                        <div>

                            <h2>
                                {activeCategory ===
                                "All"
                                    ? "Your Notifications"
                                    : `${activeCategory} Notifications`}
                            </h2>

                            <span>
                                {
                                    filteredNotifications.length
                                }{" "}
                                notification
                                {filteredNotifications.length !==
                                1
                                    ? "s"
                                    : ""}
                            </span>

                        </div>

                        {unreadCount > 0 && (
                            <span className="unread-summary">
                                {unreadCount} unread
                            </span>
                        )}

                    </div>


                    {/* =============================================
                        NOTIFICATION LIST
                    ============================================= */}

                    <div className="notification-list">

                        {filteredNotifications.length >
                        0 ? (

                            filteredNotifications.map(
                                (notification) => (

                                    <article
                                        key={
                                            notification.id
                                        }
                                        className={
                                            notification.unread
                                                ? "notification-card unread"
                                                : "notification-card"
                                        }
                                    >

                                        <div className="notification-status">

                                            {notification.unread ? (
                                                <span className="unread-dot" />
                                            ) : (
                                                <span className="read-circle" />
                                            )}

                                        </div>


                                        <div
                                            className={`notification-icon ${notification.category.toLowerCase()}`}
                                        >
                                            {
                                                notification.icon
                                            }
                                        </div>


                                        <div className="notification-content">

                                            <div className="notification-top-row">

                                                <span
                                                    className={`notification-type ${notification.category.toLowerCase()}`}
                                                >
                                                    {
                                                        notification.type
                                                    }
                                                </span>

                                                <span className="notification-time">
                                                    {
                                                        notification.time
                                                    }
                                                </span>

                                            </div>


                                            <h3>
                                                {
                                                    notification.title
                                                }
                                            </h3>


                                            <p>
                                                {
                                                    notification.message
                                                }
                                            </p>


                                            {notification.meta
                                                .length >
                                                0 && (
                                                <div className="notification-meta">

                                                    {notification.meta.map(
                                                        (
                                                            item,
                                                            index
                                                        ) => (
                                                            <span
                                                                key={
                                                                    index
                                                                }
                                                            >
                                                                {index >
                                                                0
                                                                    ? "• "
                                                                    : ""}
                                                                {
                                                                    item
                                                                }
                                                            </span>
                                                        )
                                                    )}

                                                </div>
                                            )}

                                        </div>


                                        <div className="notification-action">

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleNotificationClick(
                                                        notification
                                                    )
                                                }
                                            >
                                                {
                                                    notification.action
                                                }

                                                <span>
                                                    →
                                                </span>
                                            </button>

                                        </div>

                                    </article>

                                )
                            )

                        ) : (

                            <div className="notification-empty">

                                <div className="empty-icon">
                                    🔔
                                </div>

                                <h3>
                                    No notifications found
                                </h3>

                                <p>
                                    Try changing your
                                    search or category
                                    filter.
                                </p>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch("");
                                        setActiveCategory(
                                            "All"
                                        );
                                    }}
                                >
                                    Show all notifications
                                </button>

                            </div>

                        )}

                    </div>

                </main>


                {/* =================================================
                    RIGHT SIDEBAR
                ================================================= */}

                <aside className="notifications-sidebar">

                    {/* =============================================
                        PREFERENCES
                    ============================================= */}

                    <section className="notification-settings-card">

                        <div className="settings-header">

                            <h2>
                                Notification Preferences
                            </h2>

                            <p>
                                Choose what notifications
                                you want to receive.
                            </p>

                        </div>


                        <div className="preference-list">

                            <PreferenceRow
                                icon="💼"
                                label="New matching jobs"
                                checked={
                                    preferences.jobs
                                }
                                onChange={() =>
                                    togglePreference(
                                        "jobs"
                                    )
                                }
                            />

                            <PreferenceRow
                                icon="📄"
                                label="Application status updates"
                                checked={
                                    preferences.applications
                                }
                                onChange={() =>
                                    togglePreference(
                                        "applications"
                                    )
                                }
                            />

                            <PreferenceRow
                                icon="📅"
                                label="Interview reminders"
                                checked={
                                    preferences.interviews
                                }
                                onChange={() =>
                                    togglePreference(
                                        "interviews"
                                    )
                                }
                            />

                            <PreferenceRow
                                icon="📚"
                                label="Learning reminders"
                                checked={
                                    preferences.learning
                                }
                                onChange={() =>
                                    togglePreference(
                                        "learning"
                                    )
                                }
                            />

                            <PreferenceRow
                                icon="📋"
                                label="Resume analysis updates"
                                checked={
                                    preferences.resume
                                }
                                onChange={() =>
                                    togglePreference(
                                        "resume"
                                    )
                                }
                            />

                            <PreferenceRow
                                icon="🐙"
                                label="GitHub insights"
                                checked={
                                    preferences.github
                                }
                                onChange={() =>
                                    togglePreference(
                                        "github"
                                    )
                                }
                            />

                            <PreferenceRow
                                icon="🔔"
                                label="System notifications"
                                checked={
                                    preferences.system
                                }
                                onChange={() =>
                                    togglePreference(
                                        "system"
                                    )
                                }
                            />

                        </div>


                        <button
                            type="button"
                            className="save-preferences-button"
                            onClick={
                                savePreferences
                            }
                        >
                            ⚙ Save Preferences
                        </button>

                    </section>


                    {/* =============================================
                        QUIET HOURS
                    ============================================= */}

                    <section className="quiet-hours-card">

                        <div className="quiet-hours-title">

                            <div className="moon-icon">
                                🌙
                            </div>

                            <div>

                                <h2>
                                    Quiet Hours
                                </h2>

                                <p>
                                    Pause non-critical
                                    notifications during
                                    these hours.
                                </p>

                            </div>

                        </div>


                        <div className="quiet-toggle-row">

                            <span>
                                Enable quiet hours
                            </span>

                            <button
                                type="button"
                                className={
                                    quietHours.enabled
                                        ? "switch active"
                                        : "switch"
                                }
                                onClick={() =>
                                    setQuietHours(
                                        (current) => ({
                                            ...current,
                                            enabled:
                                                !current.enabled,
                                        })
                                    )
                                }
                                aria-label="Toggle quiet hours"
                            >
                                <span />
                            </button>

                        </div>


                        <div className="quiet-time-grid">

                            <div>

                                <label>
                                    From
                                </label>

                                <input
                                    type="time"
                                    value={
                                        quietHours.from
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setQuietHours(
                                            (
                                                current
                                            ) => ({
                                                ...current,
                                                from: event
                                                    .target
                                                    .value,
                                            })
                                        )
                                    }
                                />

                            </div>


                            <div>

                                <label>
                                    To
                                </label>

                                <input
                                    type="time"
                                    value={
                                        quietHours.to
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setQuietHours(
                                            (
                                                current
                                            ) => ({
                                                ...current,
                                                to: event
                                                    .target
                                                    .value,
                                            })
                                        )
                                    }
                                />

                            </div>

                        </div>


                        <label className="quiet-checkbox">

                            <input
                                type="checkbox"
                                checked={
                                    quietHours.enabled
                                }
                                onChange={() =>
                                    setQuietHours(
                                        (current) => ({
                                            ...current,
                                            enabled:
                                                !current.enabled,
                                        })
                                    )
                                }
                            />

                            <span>
                                Don't send non-critical
                                notifications
                            </span>

                        </label>

                    </section>

                </aside>

            </div>

        </div>
    );
};


// =========================================================
// PREFERENCE ROW
// =========================================================

const PreferenceRow = ({
    icon,
    label,
    checked,
    onChange,
}) => {

    return (
        <div className="preference-row">

            <div className="preference-label">

                <span className="preference-icon">
                    {icon}
                </span>

                <span>
                    {label}
                </span>

            </div>


            <button
                type="button"
                className={
                    checked
                        ? "switch active"
                        : "switch"
                }
                onClick={onChange}
                aria-label={`Toggle ${label}`}
            >
                <span />
            </button>

        </div>
    );
};


export default Notifications;