import { useEffect, useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";

import { getProgress } from "../../services/progressService";
import { useAuth } from "../../context/AuthContext";

import "./Dashboard.css";



/* =========================================================
   DASHBOARD
   ========================================================= */

const Dashboard = () => {
    const navigate = useNavigate();

    const { user, logout } = useAuth();

    const [progress, setProgress] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    /* =====================================================
       FETCH PROGRESS
       ===================================================== */

    useEffect(() => {
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
            } catch (error) {
                console.error(
                    "Dashboard progress error:",
                    error
                );

                setError(
                    error?.message ||
                    "Unable to load your career progress."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchProgress();
    }, []);


    /* =====================================================
       PROGRESS CONFIGURATION
       ===================================================== */

    const progressItems = [
        {
            name: "DSA",
            category: "dsa",
            path: "/dsa",
            icon: "🧠",
            description:
                "Problem solving and coding interview preparation."
        },

        {
            name: "Skills",
            category: "skills",
            path: "/skills",
            icon: "⚡",
            description:
                "Technical skills required for your target career."
        },

        {
            name: "Projects",
            category: "projects",
            path: "/projects",
            icon: "💻",
            description:
                "Practical work that demonstrates your abilities."
        },

        {
            name: "Interviews",
            category: "interview",
            path: "/interview",
            icon: "🎯",
            description:
                "Practice technical and career interviews."
        },

        {
            name: "Roadmap",
            category: "roadmap",
            path: "/roadmap",
            icon: "🗺️",
            description:
                "Follow your personalized career learning path."
        },

        {
            name: "Career",
            category: "career",
            path: "/profile",
            icon: "🚀",
            description:
                "Build and maintain your overall career profile."
        }
    ];


    /* =====================================================
       HELPERS
       ===================================================== */

    const getPercentage = (category) => {
        const item = progress.find(
            (progressItem) =>
                String(progressItem?.category)
                    .toLowerCase() ===
                String(category).toLowerCase()
        );

        const percentage = Number(
            item?.percentage || 0
        );

        return Math.min(
            100,
            Math.max(0, Math.round(percentage))
        );
    };


    const getProgressLabel = (percentage) => {
        if (percentage === 0) {
            return "Not started";
        }

        if (percentage < 25) {
            return "Getting started";
        }

        if (percentage < 50) {
            return "Building foundation";
        }

        if (percentage < 75) {
            return "Making good progress";
        }

        if (percentage < 100) {
            return "Nearly complete";
        }

        return "Completed";
    };


    const getGreeting = () => {
        const hour = new Date().getHours();

        if (hour < 12) {
            return "Good morning";
        }

        if (hour < 18) {
            return "Good afternoon";
        }

        return "Good evening";
    };


    /* =====================================================
       CALCULATED DASHBOARD DATA
       ===================================================== */

    const dashboardData = useMemo(() => {
        const percentages = progressItems.map(
            (item) =>
                getPercentage(item.category)
        );

        const totalAreas =
            progressItems.length;

        const activeAreas =
            percentages.filter(
                (percentage) =>
                    percentage > 0
            ).length;

        const completedAreas =
            percentages.filter(
                (percentage) =>
                    percentage >= 100
            ).length;

        const overallProgress =
            totalAreas > 0
                ? Math.round(
                      percentages.reduce(
                          (total, percentage) =>
                              total + percentage,
                          0
                      ) / totalAreas
                  )
                : 0;

        const lowestItem = progressItems
            .map((item) => ({
                ...item,
                percentage:
                    getPercentage(
                        item.category
                    )
            }))
            .sort(
                (a, b) =>
                    a.percentage -
                    b.percentage
            )[0];

        const strongestItem = progressItems
            .map((item) => ({
                ...item,
                percentage:
                    getPercentage(
                        item.category
                    )
            }))
            .sort(
                (a, b) =>
                    b.percentage -
                    a.percentage
            )[0];

        return {
            totalAreas,
            activeAreas,
            completedAreas,
            overallProgress,
            lowestItem,
            strongestItem
        };
    }, [progress]);


    /* =====================================================
       LOGOUT
       ===================================================== */

    const handleLogout = () => {
        logout();
        navigate("/login");
    };


    /* =====================================================
       QUICK ACTIONS
       ===================================================== */

    const quickActions = [
        {
            title: "Add Project",
            description:
                "Show what you can build.",
            icon: "💻",
            path: "/projects"
        },

        {
            title: "Improve Skills",
            description:
                "Track your technical skills.",
            icon: "⚡",
            path: "/skills"
        },

        {
            title: "Practice Interview",
            description:
                "Test your interview readiness.",
            icon: "🎯",
            path: "/interview"
        },

        {
            title: "Continue Roadmap",
            description:
                "Keep moving toward your goal.",
            icon: "🗺️",
            path: "/roadmap"
        },

        {
            title: "Solve DSA",
            description:
                "Strengthen problem solving.",
            icon: "🧠",
            path: "/dsa"
        },

        {
            title: "Explore Jobs",
            description:
                "Review available opportunities.",
            icon: "💼",
            path: "/jobs"
        }
    ];


    /* =====================================================
       LOADING STATE
       ===================================================== */

    if (loading) {
        return (
            <div className="dashboard-page">

                <div className="dashboard-loading-screen">

                    <div className="dashboard-loading-spinner">
                        ⟳
                    </div>

                    <h2>
                        Preparing your career dashboard
                    </h2>

                    <p>
                        Loading your latest progress...
                    </p>

                </div>

            </div>
        );
    }


    /* =====================================================
       MAIN UI
       ===================================================== */

    return (
        <div className="dashboard-page">


            {/* =================================================
                HEADER
               ================================================= */}

            <header className="dashboard-header">

                <div className="dashboard-header-left">

                    <div className="dashboard-eyebrow">
                        AI CAREER OS
                    </div>

                    <h1>
                        {getGreeting()},{" "}
                        {user?.name || "there"} 👋
                    </h1>

                    <p>
                        Your career workspace for
                        learning, building, practicing
                        and growing.
                    </p>

                </div>


                <div className="dashboard-header-actions">

                    <button
                        className="dashboard-header-button dashboard-outline-button"
                        onClick={() =>
                            navigate("/profile")
                        }
                    >
                        <span>👤</span>
                        View Profile
                    </button>

                    <button
                        className="dashboard-header-button"
                        onClick={() =>
                            navigate("/roadmap")
                        }
                    >
                        <span>→</span>
                        Continue Roadmap
                    </button>

                </div>

            </header>


            {/* =================================================
                ERROR
               ================================================= */}

            {error && (
                <div className="dashboard-error">

                    <span>⚠️</span>

                    <div>
                        <strong>
                            Could not refresh progress
                        </strong>

                        <p>
                            {error}
                        </p>
                    </div>

                    <button
                        onClick={() =>
                            window.location.reload()
                        }
                    >
                        Retry
                    </button>

                </div>
            )}


            {/* =================================================
                CAREER READINESS HERO
               ================================================= */}

            <section className="career-readiness-card">

                <div className="career-readiness-main">

                    <div className="career-readiness-copy">

                        <span className="section-eyebrow">
                            CAREER READINESS
                        </span>

                        <h2>
                            Know where you stand.
                        </h2>

                        <p>
                            Your readiness is calculated
                            from the progress you have
                            recorded across your career
                            areas.
                        </p>


                        <div className="readiness-status">

                            <span className="readiness-status-dot" />

                            <span>
                                {getProgressLabel(
                                    dashboardData.overallProgress
                                )}
                            </span>

                        </div>

                    </div>


                    <div className="readiness-score">

                        <div
                            className="readiness-ring"
                            style={{
                                "--progress":
                                    `${dashboardData.overallProgress * 3.6}deg`
                            }}
                        >
                            <div className="readiness-ring-inner">

                                <strong>
                                    {
                                        dashboardData
                                            .overallProgress
                                    }
                                    %
                                </strong>

                                <span>
                                    overall
                                </span>

                            </div>
                        </div>

                    </div>

                </div>


                <div className="career-readiness-areas">

                    {progressItems.slice(0, 5).map(
                        (item) => {

                            const percentage =
                                getPercentage(
                                    item.category
                                );

                            return (
                                <div
                                    className="readiness-area"
                                    key={item.category}
                                >

                                    <div className="readiness-area-top">

                                        <span>
                                            {item.icon}{" "}
                                            {item.name}
                                        </span>

                                        <strong>
                                            {percentage}%
                                        </strong>

                                    </div>

                                    <div className="readiness-bar">

                                        <div
                                            style={{
                                                width:
                                                    `${percentage}%`
                                            }}
                                        />

                                    </div>

                                </div>
                            );
                        }
                    )}

                </div>

            </section>


            {/* =================================================
                SUMMARY CARDS
               ================================================= */}

            <section className="dashboard-summary-grid">

                <div className="dashboard-stat-card">

                    <div className="dashboard-stat-icon blue">
                        ◈
                    </div>

                    <div>

                        <span>
                            Career Areas
                        </span>

                        <strong>
                            {
                                dashboardData.totalAreas
                            }
                        </strong>

                        <small>
                            Areas being tracked
                        </small>

                    </div>

                </div>


                <div className="dashboard-stat-card">

                    <div className="dashboard-stat-icon green">
                        ✓
                    </div>

                    <div>

                        <span>
                            Active Areas
                        </span>

                        <strong>
                            {
                                dashboardData.activeAreas
                            }
                        </strong>

                        <small>
                            Areas with progress
                        </small>

                    </div>

                </div>


                <div className="dashboard-stat-card">

                    <div className="dashboard-stat-icon purple">
                        ↗
                    </div>

                    <div>

                        <span>
                            Overall Progress
                        </span>

                        <strong>
                            {
                                dashboardData
                                    .overallProgress
                            }%
                        </strong>

                        <small>
                            Across tracked areas
                        </small>

                    </div>

                </div>


                <div className="dashboard-stat-card">

                    <div className="dashboard-stat-icon orange">
                        ★
                    </div>

                    <div>

                        <span>
                            Completed Areas
                        </span>

                        <strong>
                            {
                                dashboardData
                                    .completedAreas
                            }
                        </strong>

                        <small>
                            Fully completed
                        </small>

                    </div>

                </div>

            </section>


            {/* =================================================
                MAIN TWO COLUMN SECTION
               ================================================= */}

            <section className="dashboard-main-grid">


                {/* =================================================
                    CAREER PROGRESS
                   ================================================= */}

                <div className="dashboard-panel">

                    <div className="dashboard-panel-header">

                        <div>

                            <span className="section-eyebrow">
                                YOUR JOURNEY
                            </span>

                            <h2>
                                Career Progress
                            </h2>

                            <p>
                                Track each part of your
                                development journey.
                            </p>

                        </div>

                    </div>


                    <div className="dashboard-progress-list">

                        {progressItems.map(
                            (item) => {

                                const percentage =
                                    getPercentage(
                                        item.category
                                    );

                                return (
                                    <button
                                        className="career-progress-row"
                                        key={
                                            item.category
                                        }
                                        onClick={() =>
                                            navigate(
                                                item.path
                                            )
                                        }
                                    >

                                        <div className="career-progress-icon">
                                            {
                                                item.icon
                                            }
                                        </div>


                                        <div className="career-progress-content">

                                            <div className="career-progress-heading">

                                                <div>

                                                    <strong>
                                                        {
                                                            item.name
                                                        }
                                                    </strong>

                                                    <span>
                                                        {
                                                            item.description
                                                        }
                                                    </span>

                                                </div>

                                                <b>
                                                    {
                                                        percentage
                                                    }%
                                                </b>

                                            </div>


                                            <div className="career-progress-track">

                                                <div
                                                    style={{
                                                        width:
                                                            `${percentage}%`
                                                    }}
                                                />

                                            </div>


                                            <small>
                                                {
                                                    getProgressLabel(
                                                        percentage
                                                    )
                                                }
                                            </small>

                                        </div>


                                        <span className="career-progress-arrow">
                                            →
                                        </span>

                                    </button>
                                );
                            }
                        )}

                    </div>

                </div>


                {/* =================================================
                    NEXT BEST ACTION
                   ================================================= */}

                <div className="dashboard-right-column">


                    <div className="next-action-card">

                        <div className="next-action-icon">
                            ✦
                        </div>

                        <span className="section-eyebrow">
                            NEXT BEST ACTION
                        </span>

                        <h2>
                            Keep your momentum going.
                        </h2>

                        <p>
                            Your lowest-progress area
                            currently needs the most
                            attention.
                        </p>


                        {dashboardData.lowestItem && (
                            <div className="focus-area">

                                <div className="focus-area-icon">
                                    {
                                        dashboardData
                                            .lowestItem
                                            .icon
                                    }
                                </div>

                                <div>

                                    <span>
                                        Focus on
                                    </span>

                                    <strong>
                                        {
                                            dashboardData
                                                .lowestItem
                                                .name
                                        }
                                    </strong>

                                    <small>
                                        {
                                            getPercentage(
                                                dashboardData
                                                    .lowestItem
                                                    .category
                                            )
                                        }% currently tracked
                                    </small>

                                </div>

                            </div>
                        )}


                        <button
                            className="next-action-button"
                            onClick={() => {

                                if (
                                    dashboardData
                                        .lowestItem
                                ) {
                                    navigate(
                                        dashboardData
                                            .lowestItem
                                            .path
                                    );
                                }

                            }}
                        >
                            Work on this area
                            <span>→</span>
                        </button>

                    </div>


                    {/* =================================================
                        STRONGEST AREA
                       ================================================= */}

                    <div className="highlight-card">

                        <div className="highlight-top">

                            <div className="highlight-icon">
                                🏆
                            </div>

                            <span>
                                CURRENT STRENGTH
                            </span>

                        </div>


                        {dashboardData.strongestItem && (
                            <>
                                <h3>
                                    {
                                        dashboardData
                                            .strongestItem
                                            .name
                                    }
                                </h3>

                                <p>
                                    You have made the
                                    strongest progress here.
                                    Keep building evidence
                                    through consistent work.
                                </p>

                                <div className="highlight-progress">

                                    <div>
                                        <span>
                                            Progress
                                        </span>

                                        <strong>
                                            {
                                                getPercentage(
                                                    dashboardData
                                                        .strongestItem
                                                        .category
                                                )
                                            }%
                                        </strong>
                                    </div>

                                    <div className="highlight-track">

                                        <div
                                            style={{
                                                width:
                                                    `${getPercentage(
                                                        dashboardData
                                                            .strongestItem
                                                            .category
                                                    )}%`
                                            }}
                                        />

                                    </div>

                                </div>
                            </>
                        )}

                    </div>

                </div>

            </section>


            {/* =================================================
                QUICK ACTIONS
               ================================================= */}

            <section className="dashboard-section-block">

                <div className="dashboard-section-title">

                    <div>

                        <span className="section-eyebrow">
                            TAKE ACTION
                        </span>

                        <h2>
                            Quick Actions
                        </h2>

                        <p>
                            Jump directly into the work
                            that moves your career forward.
                        </p>

                    </div>

                </div>


                <div className="quick-actions-grid">

                    {quickActions.map(
                        (action) => (
                            <button
                                className="quick-action-card"
                                key={action.title}
                                onClick={() =>
                                    navigate(
                                        action.path
                                    )
                                }
                            >

                                <div className="quick-action-icon">
                                    {
                                        action.icon
                                    }
                                </div>

                                <div>

                                    <strong>
                                        {
                                            action.title
                                        }
                                    </strong>

                                    <span>
                                        {
                                            action.description
                                        }
                                    </span>

                                </div>

                                <b>
                                    →
                                </b>

                            </button>
                        )
                    )}

                </div>

            </section>


            {/* =================================================
                CAREER LOOP
               ================================================= */}

            <section className="career-loop-section">

                <div className="career-loop-heading">

                    <span className="section-eyebrow">
                        YOUR CAREER LOOP
                    </span>

                    <h2>
                        Learn → Build → Practice → Improve
                    </h2>

                    <p>
                        AI Career OS connects the different
                        parts of your career journey so your
                        progress becomes measurable over time.
                    </p>

                </div>


                <div className="career-loop">

                    <div className="career-loop-step">

                        <div>
                            📚
                        </div>

                        <strong>
                            Learn
                        </strong>

                        <span>
                            Build technical knowledge.
                        </span>

                    </div>


                    <span className="career-loop-arrow">
                        →
                    </span>


                    <div className="career-loop-step">

                        <div>
                            💻
                        </div>

                        <strong>
                            Build
                        </strong>

                        <span>
                            Create practical projects.
                        </span>

                    </div>


                    <span className="career-loop-arrow">
                        →
                    </span>


                    <div className="career-loop-step">

                        <div>
                            🎯
                        </div>

                        <strong>
                            Practice
                        </strong>

                        <span>
                            Test your interview readiness.
                        </span>

                    </div>


                    <span className="career-loop-arrow">
                        →
                    </span>


                    <div className="career-loop-step">

                        <div>
                            📈
                        </div>

                        <strong>
                            Improve
                        </strong>

                        <span>
                            Measure and close your gaps.
                        </span>

                    </div>

                </div>

            </section>


            {/* =================================================
                FOOTER ACTIONS
               ================================================= */}

            <div className="dashboard-bottom-bar">

                <div>

                    <strong>
                        Keep building your career evidence.
                    </strong>

                    <span>
                        Small consistent actions create measurable progress.
                    </span>

                </div>


                <div className="dashboard-bottom-actions">

                    <button
                        onClick={() =>
                            navigate("/activities")
                        }
                    >
                        Activity History
                    </button>

                    <button
                        onClick={() =>
                            navigate("/notifications")
                        }
                    >
                        Notifications
                    </button>

                    <button
                        className="dashboard-logout-bottom"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>

                </div>

            </div>

        </div>
    );
};


export default Dashboard;