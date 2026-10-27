import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
    getNotifications,
    markNotificationAsRead,
} from "../../services/notificationService";
import "./Notifications.css";

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
        key: "System",
        label: "System",
        icon: "🔔",
    },
];

const PREFERENCE_KEY = "notificationPreferences";
const QUIET_HOURS_KEY = "notificationQuietHours";

const DEFAULT_PREFERENCES = {
    jobs: true,
    applications: true,
    interviews: true,
    learning: true,
    resume: true,
    github: true,
    system: false,
};

const DEFAULT_QUIET_HOURS = {
    enabled: true,
    from: "23:00",
    to: "07:00",
};

const readLocalSettings = (key, fallback) => {
    try {
        const saved = JSON.parse(localStorage.getItem(key) || "null");
        return saved && typeof saved === "object"
            ? { ...fallback, ...saved }
            : fallback;
    } catch {
        return fallback;
    }
};

const getNotificationCategory = (type) => {
    switch (String(type || "general").toLowerCase()) {
        case "job":
            return "Jobs";
        case "interview":
            return "Interviews";
        case "roadmap":
        case "dsa":
            return "Learning";
        default:
            return "System";
    }
};

const getNotificationIcon = (type) => {
    switch (String(type || "general").toLowerCase()) {
        case "job":
            return "💼";
        case "interview":
            return "📅";
        case "roadmap":
        case "dsa":
            return "📚";
        default:
            return "🔔";
    }
};

const formatNotificationTime = (dateValue) => {
    if (!dateValue) return "Date unavailable";

    const timestamp = new Date(dateValue).getTime();
    if (Number.isNaN(timestamp)) return "Date unavailable";

    const elapsedMinutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
    if (elapsedMinutes < 1) return "Just now";
    if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;

    const elapsedHours = Math.floor(elapsedMinutes / 60);
    if (elapsedHours < 24) return `${elapsedHours}h ago`;

    const elapsedDays = Math.floor(elapsedHours / 24);
    if (elapsedDays < 7) return `${elapsedDays}d ago`;

    return new Date(timestamp).toLocaleDateString();
};

const normalizeNotification = (notification) => {
    if (!notification || typeof notification !== "object") return null;

    return {
        ...notification,
        id: notification._id,
        category: getNotificationCategory(notification.type),
        typeLabel: String(notification.type || "general").replace(/[-_]/g, " ").toUpperCase(),
        icon: getNotificationIcon(notification.type),
        time: formatNotificationTime(notification.createdAt || notification.updatedAt),
        unread: !notification.isRead,
        meta: [],
        action: notification.link
            ? "Open"
            : notification.isRead
                ? "Read"
                : "Mark as read",
    };
};


const Notifications = () => {
    const navigate = useNavigate();
    const { refreshUnreadCount, syncUnreadCount } = useOutletContext();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isUpdatingRead, setIsUpdatingRead] = useState(false);
    const [preferenceMessage, setPreferenceMessage] = useState("");
    const notificationClickInProgress = useRef(false);

    const [activeCategory, setActiveCategory] =
        useState("All");

    const [search, setSearch] =
        useState("");

    const [preferences, setPreferences] = useState(() =>
        readLocalSettings(PREFERENCE_KEY, DEFAULT_PREFERENCES)
    );

    const [quietHours, setQuietHours] = useState(() =>
        readLocalSettings(QUIET_HOURS_KEY, DEFAULT_QUIET_HOURS)
    );

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await getNotifications();
            if (!Array.isArray(response?.data)) {
                throw new Error("The notifications response was invalid.");
            }
            const normalizedNotifications = response.data
                .map(normalizeNotification)
                .filter(Boolean);
            setNotifications(normalizedNotifications);
            syncUnreadCount(response.data);
        } catch (requestError) {
            setError(requestError?.message || "Unable to load notifications.");
        } finally {
            setLoading(false);
        }
    }, [syncUnreadCount]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);


    // =========================================================
    // UNREAD COUNT
    // =========================================================

    const unreadCount = useMemo(() => {
        return notifications.filter(
            (notification) =>
                !notification.isRead
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
                getNotificationCategory(notification.type) === category &&
                !notification.isRead
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
                        getNotificationCategory(notification.type) === activeCategory;

                    const matchesSearch =
                        !query ||
                        notification.title
                            .toLowerCase()
                            .includes(query) ||
                        notification.message
                            .toLowerCase()
                            .includes(query) ||
                        getNotificationCategory(notification.type)
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

    const markAsRead = async (notification) => {
        if (!notification?._id || notification.isRead) return true;

        setIsUpdatingRead(true);
        setError("");
        try {
            const response = await markNotificationAsRead(notification._id);
            if (response?.success !== true || response?.data?.isRead !== true) {
                throw new Error("The server did not confirm this notification was marked as read.");
            }
            const updatedNotifications = notifications.map((item) =>
                item._id === notification._id
                    ? { ...item, isRead: true, unread: false }
                    : item
            );
            setNotifications(updatedNotifications);
            syncUnreadCount(updatedNotifications);
            await refreshUnreadCount();
            return true;
        } catch (requestError) {
            setError(requestError?.message || "Unable to update notification status.");
            await refreshUnreadCount();
            return false;
        } finally {
            setIsUpdatingRead(false);
        }
    };


    // =========================================================
    // MARK ALL AS READ
    // =========================================================

    const markAllAsRead = async () => {
        const unreadNotifications = notifications.filter((item) => !item.isRead);
        if (unreadNotifications.length === 0) return;

        setIsUpdatingRead(true);
        setError("");
        const results = await Promise.allSettled(
            unreadNotifications.map((item) => markNotificationAsRead(item._id))
        );
        const updatedIds = new Set(
            unreadNotifications
                .filter((_, index) => results[index].status === "fulfilled")
                .map((item) => item._id)
        );

        const updatedNotifications = notifications.map((item) =>
            updatedIds.has(item._id)
                ? { ...item, isRead: true, unread: false }
                : item
        );
        setNotifications(updatedNotifications);
        syncUnreadCount(updatedNotifications);
        await refreshUnreadCount();

        if (updatedIds.size !== unreadNotifications.length) {
            setError("Some notifications could not be marked as read. Please retry.");
        }
        setIsUpdatingRead(false);
    };


    // =========================================================
    // NOTIFICATION CLICK
    // =========================================================

    const handleNotificationClick = async (notification) => {
        if (notificationClickInProgress.current) return;
        notificationClickInProgress.current = true;

        try {
            await markAsRead(notification);
            if (!notification.link) return;

            const destination = new URL(notification.link, window.location.origin);
            if (destination.protocol !== "http:" && destination.protocol !== "https:") {
                throw new Error("Unsupported protocol");
            }

            if (destination.origin === window.location.origin) {
                navigate(`${destination.pathname}${destination.search}${destination.hash}`);
            } else {
                window.location.assign(destination.href);
            }
        } catch {
            setError("This notification has an unsupported destination link.");
        } finally {
            notificationClickInProgress.current = false;
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
        try {
            localStorage.setItem(PREFERENCE_KEY, JSON.stringify(preferences));
            localStorage.setItem(QUIET_HOURS_KEY, JSON.stringify(quietHours));
            setPreferenceMessage("Saved in this browser only.");
        } catch {
            setPreferenceMessage("Could not save these browser-local preferences.");
        }
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
                            unreadCount === 0 || isUpdatingRead
                        }
                    >
                        {isUpdatingRead ? "Saving…" : "✓ Mark all as read"}
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

                    {error && (
                        <div className="notification-request-error" role="alert">
                            <span>{error}</span>
                            <button type="button" onClick={fetchNotifications}>
                                Retry
                            </button>
                        </div>
                    )}

                    <div className="notification-list">

                        {loading ? (
                            <div className="notification-empty" role="status">
                                <h3>Loading notifications…</h3>
                            </div>
                        ) : error && notifications.length === 0 ? null : filteredNotifications.length >
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
                                                        notification.typeLabel
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
                                                disabled={isUpdatingRead}
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
                                    {notifications.length === 0
                                        ? "You’re all caught up"
                                        : "No notifications found"}
                                </h3>

                                <p>
                                    {notifications.length === 0
                                        ? "New account notifications will appear here when available."
                                        : "Try changing your search or category filter."}
                                </p>

                                <button
                                    type="button"
                                    onClick={() => {
                                        if (notifications.length === 0) {
                                            fetchNotifications();
                                        } else {
                                            setSearch("");
                                            setActiveCategory("All");
                                        }
                                    }}
                                >
                                    {notifications.length === 0
                                        ? "Refresh notifications"
                                        : "Show all notifications"}
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
                                Preferences are stored in this browser only and do not change server notifications.
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
                            ⚙ Save on this device
                        </button>

                        {preferenceMessage && (
                            <p className="local-preference-feedback" role="status">
                                {preferenceMessage}
                            </p>
                        )}

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
                                    Browser-local display preference; quiet hours are not enforced by the server.
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
                                role="switch"
                                aria-checked={quietHours.enabled}
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
                role="switch"
                aria-checked={checked}
                aria-label={`Toggle ${label}`}
            >
                <span />
            </button>

        </div>
    );
};


export default function NotificationsDesktopCanvas() {
    return (
        <div className="notifications-desktop-scroll" role="region" aria-label="Notifications page. Scroll horizontally to view all content on narrow screens." tabIndex={0}>
            <div className="notifications-desktop-canvas">
                <Notifications />
            </div>
        </div>
    );
}
