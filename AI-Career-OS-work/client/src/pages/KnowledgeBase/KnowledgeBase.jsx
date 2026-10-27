import React, { useMemo, useState } from "react";
import "./KnowledgeBase.css";

/* =========================================================
   KNOWLEDGE RESOURCES
   ========================================================= */

const KNOWLEDGE_RESOURCES = [
    {
        id: "javascript-guide",
        title: "JavaScript Guide",
        description:
            "Learn JavaScript fundamentals including variables, conditions, functions, arrays, objects, promises, async/await, modules and more.",
        category: "Programming",
        technology: "JavaScript",
        level: "Beginner → Advanced",
        provider: "MDN Web Docs",
        providerType: "Official Documentation",
        icon: "🟨",
        color: "yellow",
        estimatedTime: "Self-paced",
        recommended: true,
        tags: [
            "javascript",
            "js",
            "functions",
            "arrays",
            "objects",
            "promises",
            "async",
            "modules",
        ],
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
    },

    {
        id: "javascript-reference",
        title: "JavaScript Reference",
        description:
            "Detailed JavaScript reference covering built-in objects, operators, statements, functions, classes and regular expressions.",
        category: "Programming",
        technology: "JavaScript",
        level: "Intermediate → Advanced",
        provider: "MDN Web Docs",
        providerType: "Official Reference",
        icon: "📘",
        color: "blue",
        estimatedTime: "Reference",
        recommended: false,
        tags: [
            "javascript",
            "reference",
            "built-ins",
            "functions",
            "classes",
        ],
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference",
    },

    {
        id: "python-tutorial",
        title: "Python Tutorial",
        description:
            "Official Python tutorial covering syntax, data structures, functions, modules, errors, classes and standard library fundamentals.",
        category: "Programming",
        technology: "Python",
        level: "Beginner → Intermediate",
        provider: "Python",
        providerType: "Official Documentation",
        icon: "🐍",
        color: "blue",
        estimatedTime: "Self-paced",
        recommended: true,
        tags: [
            "python",
            "functions",
            "classes",
            "modules",
            "data structures",
        ],
        url: "https://docs.python.org/3/tutorial/",
    },

    {
        id: "python-docs",
        title: "Python Documentation",
        description:
            "Complete Python documentation including language reference, built-ins, standard library, HOWTOs and packaging information.",
        category: "Programming",
        technology: "Python",
        level: "All Levels",
        provider: "Python",
        providerType: "Official Documentation",
        icon: "🐍",
        color: "blue",
        estimatedTime: "Reference",
        recommended: false,
        tags: [
            "python",
            "standard library",
            "built-ins",
            "packages",
        ],
        url: "https://docs.python.org/3/",
    },

    {
        id: "react-learn",
        title: "React Learn",
        description:
            "Learn React components, JSX, props, state, events, conditional rendering, lists and sharing data between components.",
        category: "Frontend",
        technology: "React",
        level: "Beginner → Intermediate",
        provider: "React",
        providerType: "Official Learning",
        icon: "⚛️",
        color: "cyan",
        estimatedTime: "Self-paced",
        recommended: true,
        tags: [
            "react",
            "components",
            "jsx",
            "props",
            "state",
            "events",
            "frontend",
        ],
        url: "https://react.dev/learn",
    },

    {
        id: "html-web",
        title: "HTML & Web Development",
        description:
            "Learn HTML structure, semantic elements, forms, accessibility fundamentals and browser-based web development.",
        category: "Frontend",
        technology: "HTML",
        level: "Beginner",
        provider: "MDN Web Docs",
        providerType: "Official Documentation",
        icon: "🌐",
        color: "orange",
        estimatedTime: "Self-paced",
        recommended: false,
        tags: [
            "html",
            "web",
            "semantic html",
            "frontend",
            "browser",
            "accessibility",
        ],
        url: "https://developer.mozilla.org/en-US/docs/Learn_web_development",
    },

    {
        id: "css-learning",
        title: "CSS Learning",
        description:
            "Learn modern CSS including selectors, Flexbox, Grid, responsive design, positioning and layout fundamentals.",
        category: "Frontend",
        technology: "CSS",
        level: "Beginner → Intermediate",
        provider: "MDN Web Docs",
        providerType: "Official Learning",
        icon: "🎨",
        color: "purple",
        estimatedTime: "Self-paced",
        recommended: false,
        tags: [
            "css",
            "flexbox",
            "grid",
            "responsive",
            "frontend",
            "layout",
        ],
        url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics",
    },

    {
        id: "node-learn",
        title: "Learn Node.js",
        description:
            "Learn Node.js fundamentals including HTTP, filesystem, asynchronous programming, npm, testing and server-side development.",
        category: "Backend",
        technology: "Node.js",
        level: "Beginner → Advanced",
        provider: "Node.js",
        providerType: "Official Learning",
        icon: "🟢",
        color: "green",
        estimatedTime: "Self-paced",
        recommended: true,
        tags: [
            "node",
            "nodejs",
            "backend",
            "http",
            "async",
            "npm",
            "testing",
        ],
        url: "https://nodejs.org/learn",
    },

    {
        id: "express-docs",
        title: "Express.js Documentation",
        description:
            "Learn Express application setup, routing, middleware, error handling and backend API development.",
        category: "Backend",
        technology: "Express.js",
        level: "Beginner → Intermediate",
        provider: "Express",
        providerType: "Official Documentation",
        icon: "🚂",
        color: "gray",
        estimatedTime: "Self-paced",
        recommended: false,
        tags: [
            "express",
            "node",
            "backend",
            "routing",
            "middleware",
            "api",
        ],
        url: "https://expressjs.com/",
    },

    {
        id: "http-web-api",
        title: "HTTP & Web APIs",
        description:
            "Understand HTTP requests, responses, methods, headers, status codes, URLs and browser Web APIs.",
        category: "Backend",
        technology: "Web APIs",
        level: "Beginner → Intermediate",
        provider: "MDN Web Docs",
        providerType: "Official Documentation",
        icon: "🔗",
        color: "purple",
        estimatedTime: "Self-paced",
        recommended: false,
        tags: [
            "http",
            "api",
            "rest",
            "request",
            "response",
            "status codes",
        ],
        url: "https://developer.mozilla.org/en-US/docs/Web/HTTP",
    },

    {
        id: "mongodb-manual",
        title: "MongoDB Manual",
        description:
            "Learn MongoDB CRUD operations, aggregation, indexes, transactions, data modeling and database security.",
        category: "Database",
        technology: "MongoDB",
        level: "Beginner → Advanced",
        provider: "MongoDB",
        providerType: "Official Documentation",
        icon: "🍃",
        color: "green",
        estimatedTime: "Reference",
        recommended: true,
        tags: [
            "mongodb",
            "database",
            "crud",
            "aggregation",
            "indexes",
            "transactions",
        ],
        url: "https://www.mongodb.com/docs/manual/",
    },

    {
        id: "postgresql",
        title: "PostgreSQL Documentation",
        description:
            "Learn SQL, PostgreSQL data types, queries, indexes, transactions and database administration.",
        category: "Database",
        technology: "PostgreSQL",
        level: "Beginner → Advanced",
        provider: "PostgreSQL",
        providerType: "Official Documentation",
        icon: "🐘",
        color: "blue",
        estimatedTime: "Reference",
        recommended: false,
        tags: [
            "postgresql",
            "sql",
            "database",
            "queries",
            "indexes",
        ],
        url: "https://www.postgresql.org/docs/",
    },

    {
        id: "typescript",
        title: "TypeScript Handbook",
        description:
            "Learn TypeScript types, interfaces, generics, narrowing, classes, modules and development tooling.",
        category: "Programming",
        technology: "TypeScript",
        level: "Intermediate",
        provider: "TypeScript",
        providerType: "Official Documentation",
        icon: "🔷",
        color: "blue",
        estimatedTime: "Self-paced",
        recommended: false,
        tags: [
            "typescript",
            "types",
            "interfaces",
            "generics",
            "javascript",
        ],
        url: "https://www.typescriptlang.org/docs/handbook/",
    },

    {
        id: "git",
        title: "Git Documentation",
        description:
            "Learn version control, repositories, commits, branches, merging and practical Git workflows.",
        category: "Developer Tools",
        technology: "Git",
        level: "Beginner → Advanced",
        provider: "Git",
        providerType: "Official Documentation",
        icon: "🔀",
        color: "orange",
        estimatedTime: "Self-paced",
        recommended: false,
        tags: [
            "git",
            "github",
            "version control",
            "branch",
            "merge",
        ],
        url: "https://git-scm.com/doc",
    },

    {
        id: "docker",
        title: "Docker Documentation",
        description:
            "Learn containers, images, Dockerfiles, networking, volumes and application containerization.",
        category: "DevOps",
        technology: "Docker",
        level: "Beginner → Advanced",
        provider: "Docker",
        providerType: "Official Documentation",
        icon: "🐳",
        color: "cyan",
        estimatedTime: "Self-paced",
        recommended: false,
        tags: [
            "docker",
            "containers",
            "devops",
            "dockerfile",
            "deployment",
        ],
        url: "https://docs.docker.com/",
    },

    {
        id: "kubernetes",
        title: "Kubernetes Documentation",
        description:
            "Learn Kubernetes workloads, services, networking, configuration and cluster management.",
        category: "DevOps",
        technology: "Kubernetes",
        level: "Intermediate → Advanced",
        provider: "Kubernetes",
        providerType: "Official Documentation",
        icon: "☸️",
        color: "blue",
        estimatedTime: "Reference",
        recommended: false,
        tags: [
            "kubernetes",
            "k8s",
            "devops",
            "containers",
            "deployment",
        ],
        url: "https://kubernetes.io/docs/",
    },

    {
        id: "dsa-python",
        title: "Python for DSA",
        description:
            "Build Python fundamentals useful for arrays, strings, lists, sets, dictionaries and algorithm practice.",
        category: "DSA",
        technology: "Python",
        level: "Beginner → Intermediate",
        provider: "Python",
        providerType: "Official Documentation",
        icon: "🧠",
        color: "blue",
        estimatedTime: "Self-paced",
        recommended: false,
        tags: [
            "dsa",
            "python",
            "arrays",
            "strings",
            "lists",
            "sets",
            "dictionary",
        ],
        url: "https://docs.python.org/3/tutorial/",
    },

    {
        id: "web-security",
        title: "Web Security",
        description:
            "Study web security concepts including authentication, authorization and secure browser-based development.",
        category: "Cybersecurity",
        technology: "Web Security",
        level: "Intermediate",
        provider: "MDN Web Docs",
        providerType: "Official Documentation",
        icon: "🔐",
        color: "red",
        estimatedTime: "Self-paced",
        recommended: false,
        tags: [
            "security",
            "web security",
            "authentication",
            "authorization",
            "browser",
        ],
        url: "https://developer.mozilla.org/en-US/docs/Web/Security",
    },
];

/* =========================================================
   CATEGORIES
   ========================================================= */

const CATEGORIES = [
    { id: "all", label: "All", icon: "📚" },
    { id: "Programming", label: "Programming", icon: "💻" },
    { id: "Frontend", label: "Frontend", icon: "🎨" },
    { id: "Backend", label: "Backend", icon: "⚙️" },
    { id: "Database", label: "Database", icon: "🗄️" },
    { id: "DSA", label: "DSA", icon: "🧠" },
    { id: "DevOps", label: "DevOps", icon: "🚀" },
    { id: "Cybersecurity", label: "Security", icon: "🔐" },
    { id: "Developer Tools", label: "Tools", icon: "🛠️" },
];

/* =========================================================
   LOCAL STORAGE
   ========================================================= */

const readStorage = (key, fallback = []) => {
    try {
        const value = localStorage.getItem(key);

        if (!value) {
            return fallback;
        }

        const parsed = JSON.parse(value);

        return Array.isArray(parsed) ? parsed : fallback;
    } catch {
        return fallback;
    }
};

const writeStorage = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Ignore localStorage errors.
    }
};

/* =========================================================
   MAIN COMPONENT
   ========================================================= */

const KnowledgeBase = () => {
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState("all");

    const [savedResources, setSavedResources] = useState(() =>
        readStorage("aiCareerOS_savedKnowledge")
    );

    const [completedResources, setCompletedResources] = useState(() =>
        readStorage("aiCareerOS_completedKnowledge")
    );

    const [recentResources, setRecentResources] = useState(() =>
        readStorage("aiCareerOS_recentKnowledge")
    );

    const [savedOnly, setSavedOnly] = useState(false);
    const [completedOnly, setCompletedOnly] = useState(false);

    /* =====================================================
       SAVE RESOURCE
       ===================================================== */

    const toggleSaved = (resourceId) => {
        setSavedResources((current) => {
            const next = current.includes(resourceId)
                ? current.filter((id) => id !== resourceId)
                : [...current, resourceId];

            writeStorage("aiCareerOS_savedKnowledge", next);

            return next;
        });
    };

    /* =====================================================
       COMPLETE RESOURCE
       ===================================================== */

    const toggleCompleted = (resourceId) => {
        setCompletedResources((current) => {
            const next = current.includes(resourceId)
                ? current.filter((id) => id !== resourceId)
                : [...current, resourceId];

            writeStorage("aiCareerOS_completedKnowledge", next);

            return next;
        });
    };

    /* =====================================================
       OPEN RESOURCE
       ===================================================== */

    const openResource = (resource) => {
        setRecentResources((current) => {
            const next = [
                resource.id,
                ...current.filter((id) => id !== resource.id),
            ].slice(0, 5);

            writeStorage("aiCareerOS_recentKnowledge", next);

            return next;
        });

        window.open(
            resource.url,
            "_blank",
            "noopener,noreferrer"
        );
    };

    /* =====================================================
       FILTERED RESOURCES
       ===================================================== */

    const filteredResources = useMemo(() => {
        const query = search.trim().toLowerCase();

        return KNOWLEDGE_RESOURCES.filter((resource) => {
            const categoryMatch =
                activeCategory === "all" ||
                resource.category === activeCategory;

            const searchableText = [
                resource.title,
                resource.description,
                resource.category,
                resource.technology,
                resource.provider,
                resource.providerType,
                resource.level,
                ...resource.tags,
            ]
                .join(" ")
                .toLowerCase();

            const searchMatch =
                !query || searchableText.includes(query);

            const savedMatch =
                !savedOnly ||
                savedResources.includes(resource.id);

            const completedMatch =
                !completedOnly ||
                completedResources.includes(resource.id);

            return (
                categoryMatch &&
                searchMatch &&
                savedMatch &&
                completedMatch
            );
        });
    }, [
        search,
        activeCategory,
        savedOnly,
        completedOnly,
        savedResources,
        completedResources,
    ]);

    /* =====================================================
       RECOMMENDED
       ===================================================== */

    const recommendedResources = useMemo(() => {
        return KNOWLEDGE_RESOURCES
            .filter((resource) => resource.recommended)
            .slice(0, 6);
    }, []);

    /* =====================================================
       RECENT
       ===================================================== */

    const recentlyViewed = useMemo(() => {
        return recentResources
            .map((id) =>
                KNOWLEDGE_RESOURCES.find(
                    (resource) => resource.id === id
                )
            )
            .filter(Boolean);
    }, [recentResources]);

    /* =====================================================
       STATISTICS
       ===================================================== */

    const totalResources = KNOWLEDGE_RESOURCES.length;

    const totalTopics = new Set(
        KNOWLEDGE_RESOURCES.map(
            (resource) => resource.category
        )
    ).size;

    const savedCount = savedResources.length;

    const completedCount = completedResources.length;

    const progress =
        totalResources === 0
            ? 0
            : Math.min(
                100,
                Math.round(
                    (completedCount / totalResources) * 100
                )
            );

    /* =====================================================
       CLEAR FILTERS
       ===================================================== */

    const clearFilters = () => {
        setSearch("");
        setActiveCategory("all");
        setSavedOnly(false);
        setCompletedOnly(false);
    };

    const hasActiveFilters =
        Boolean(search) ||
        activeCategory !== "all" ||
        savedOnly ||
        completedOnly;

    /* =====================================================
       RESOURCE CARD
       ===================================================== */

    const ResourceCard = ({ resource }) => {
        const isSaved = savedResources.includes(resource.id);
        const isCompleted =
            completedResources.includes(resource.id);

        return (
            <article className="kb-resource-card">

                <div
                    className={`kb-resource-icon ${resource.color}`}
                >
                    {resource.icon}
                </div>

                <div className="kb-resource-body">

                    <div className="kb-resource-heading">

                        <div className="kb-resource-title-area">

                            <span className="kb-resource-category">
                                {resource.category}
                            </span>

                            <h3>
                                {resource.title}
                            </h3>

                        </div>

                        <button
                            type="button"
                            className={`kb-save-button ${
                                isSaved ? "saved" : ""
                            }`}
                            onClick={() =>
                                toggleSaved(resource.id)
                            }
                            aria-label={
                                isSaved
                                    ? "Remove saved resource"
                                    : "Save resource"
                            }
                            title={
                                isSaved
                                    ? "Remove from saved"
                                    : "Save resource"
                            }
                        >
                            {isSaved ? "★" : "☆"}
                        </button>

                    </div>

                    <p className="kb-resource-description">
                        {resource.description}
                    </p>

                    <div className="kb-resource-meta">

                        <span>
                            {resource.technology}
                        </span>

                        <span>
                            {resource.level}
                        </span>

                        <span>
                            {resource.estimatedTime}
                        </span>

                    </div>

                    <div className="kb-resource-footer">

                        <div className="kb-provider">

                            <span className="kb-provider-check">
                                ✓
                            </span>

                            <span>
                                {resource.provider}
                            </span>

                            <small>
                                {resource.providerType}
                            </small>

                        </div>

                        <div className="kb-resource-actions">

                            <button
                                type="button"
                                className={`kb-complete-button ${
                                    isCompleted
                                        ? "completed"
                                        : ""
                                }`}
                                onClick={() =>
                                    toggleCompleted(
                                        resource.id
                                    )
                                }
                            >
                                {isCompleted
                                    ? "✓ Completed"
                                    : "Mark Complete"}
                            </button>

                            <button
                                type="button"
                                className="kb-open-button"
                                onClick={() =>
                                    openResource(resource)
                                }
                            >
                                Open Resource →
                            </button>

                        </div>

                    </div>

                </div>

            </article>
        );
    };

    /* =====================================================
       PAGE
       ===================================================== */

    return (
        <div className="kb-page">

            {/* HEADER */}

            <header className="kb-header">

                <div className="kb-header-content">

                    <span className="kb-eyebrow">
                        LEARNING CENTER
                    </span>

                    <h1>
                        Knowledge Base
                    </h1>

                    <p>
                        Discover trusted technical resources,
                        save important references, and track
                        the knowledge you are building.
                    </p>

                </div>

                <div className="kb-header-badge">

                    <div className="kb-header-badge-icon">
                        🧠
                    </div>

                    <div>
                        <strong>
                            Learning Hub
                        </strong>

                        <span>
                            Curated technical resources
                        </span>
                    </div>

                </div>

            </header>

            {/* SEARCH */}

            <section className="kb-search-section">

                <div className="kb-search-box">

                    <span className="kb-search-icon">
                        🔍
                    </span>

                    <input
                        type="text"
                        value={search}
                        onChange={(event) =>
                            setSearch(event.target.value)
                        }
                        placeholder="Search JavaScript, React, Node.js, DSA, MongoDB..."
                        aria-label="Search knowledge resources"
                    />

                    {search && (
                        <button
                            type="button"
                            className="kb-clear-search"
                            onClick={() => setSearch("")}
                            aria-label="Clear search"
                        >
                            ×
                        </button>
                    )}

                </div>

                <button
                    type="button"
                    className={`kb-filter-button ${
                        savedOnly ? "active" : ""
                    }`}
                    onClick={() =>
                        setSavedOnly((value) => !value)
                    }
                >
                    ★ Saved
                </button>

                <button
                    type="button"
                    className={`kb-filter-button ${
                        completedOnly ? "active" : ""
                    }`}
                    onClick={() =>
                        setCompletedOnly((value) => !value)
                    }
                >
                    ✓ Completed
                </button>

            </section>

            {/* STATS */}

            <section className="kb-stats-grid">

                <div className="kb-stat-card">

                    <div className="kb-stat-icon blue">
                        📚
                    </div>

                    <div>
                        <span>Resources</span>
                        <strong>{totalResources}</strong>
                    </div>

                </div>

                <div className="kb-stat-card">

                    <div className="kb-stat-icon purple">
                        🎯
                    </div>

                    <div>
                        <span>Topics</span>
                        <strong>{totalTopics}</strong>
                    </div>

                </div>

                <div className="kb-stat-card">

                    <div className="kb-stat-icon yellow">
                        ⭐
                    </div>

                    <div>
                        <span>Saved</span>
                        <strong>{savedCount}</strong>
                    </div>

                </div>

                <div className="kb-stat-card">

                    <div className="kb-stat-icon green">
                        ✓
                    </div>

                    <div>
                        <span>Completed</span>
                        <strong>{completedCount}</strong>
                    </div>

                </div>

            </section>

            {/* PROGRESS */}

            <section className="kb-progress-card">

                <div className="kb-progress-top">

                    <div>

                        <span className="kb-progress-label">
                            YOUR KNOWLEDGE PROGRESS
                        </span>

                        <h2>
                            Build knowledge that turns into skills
                        </h2>

                        <p>
                            Mark resources as completed after
                            studying them. Your progress is saved
                            automatically in this browser.
                        </p>

                    </div>

                    <div className="kb-progress-number">

                        <strong>
                            {progress}%
                        </strong>

                        <span>
                            completed
                        </span>

                    </div>

                </div>

                <div className="kb-progress-track">
                    <div
                        className="kb-progress-fill"
                        style={{
                            width: `${progress}%`,
                        }}
                    />
                </div>

            </section>

            {/* MAIN LAYOUT */}

            <div className="kb-main-layout">

                <main className="kb-main">

                    {/* RECOMMENDED */}

                    {!hasActiveFilters && (
                        <section className="kb-section">

                            <div className="kb-section-header">

                                <div>

                                    <span className="kb-section-eyebrow">
                                        START HERE
                                    </span>

                                    <h2>
                                        Recommended Resources
                                    </h2>

                                    <p>
                                        Official documentation and
                                        learning resources to build
                                        strong technical foundations.
                                    </p>

                                </div>

                            </div>

                            <div className="kb-recommended-grid">

                                {recommendedResources.map(
                                    (resource) => (
                                        <ResourceCard
                                            key={resource.id}
                                            resource={resource}
                                        />
                                    )
                                )}

                            </div>

                        </section>
                    )}

                    {/* RESOURCE LIBRARY */}

                    <section className="kb-section">

                        <div className="kb-section-header">

                            <div>

                                <span className="kb-section-eyebrow">
                                    RESOURCE LIBRARY
                                </span>

                                <h2>
                                    Explore Knowledge
                                </h2>

                                <p>
                                    Search by technology,
                                    category, or learning topic.
                                </p>

                            </div>

                            <div className="kb-result-count">
                                {filteredResources.length}{" "}
                                {filteredResources.length === 1
                                    ? "resource"
                                    : "resources"}
                            </div>

                        </div>

                        {/* CATEGORY FILTER */}

                        <div className="kb-category-list">

                            {CATEGORIES.map((category) => (
                                <button
                                    key={category.id}
                                    type="button"
                                    className={`kb-category-button ${
                                        activeCategory ===
                                        category.id
                                            ? "active"
                                            : ""
                                    }`}
                                    onClick={() =>
                                        setActiveCategory(
                                            category.id
                                        )
                                    }
                                >
                                    <span>
                                        {category.icon}
                                    </span>

                                    {category.label}
                                </button>
                            ))}

                        </div>

                        {/* RESOURCES */}

                        {filteredResources.length > 0 ? (

                            <div className="kb-resource-list">

                                {filteredResources.map(
                                    (resource) => (
                                        <ResourceCard
                                            key={resource.id}
                                            resource={resource}
                                        />
                                    )
                                )}

                            </div>

                        ) : (

                            <div className="kb-empty-state">

                                <div className="kb-empty-icon">
                                    🔎
                                </div>

                                <h3>
                                    No resources found
                                </h3>

                                <p>
                                    Try another search or
                                    remove your filters.
                                </p>

                                <button
                                    type="button"
                                    onClick={clearFilters}
                                >
                                    Clear Filters
                                </button>

                            </div>

                        )}

                    </section>

                </main>

                {/* SIDEBAR */}

                <aside className="kb-sidebar">

                    {/* RECENT */}

                    <section className="kb-side-card">

                        <div className="kb-side-header">

                            <div>

                                <span>
                                    ACTIVITY
                                </span>

                                <h3>
                                    Recently Viewed
                                </h3>

                            </div>

                            <div className="kb-side-icon">
                                🕐
                            </div>

                        </div>

                        {recentlyViewed.length > 0 ? (

                            <div className="kb-recent-list">

                                {recentlyViewed.map(
                                    (resource) => (
                                        <button
                                            key={resource.id}
                                            type="button"
                                            className="kb-recent-item"
                                            onClick={() =>
                                                openResource(
                                                    resource
                                                )
                                            }
                                        >

                                            <span
                                                className={`kb-recent-icon ${resource.color}`}
                                            >
                                                {resource.icon}
                                            </span>

                                            <span className="kb-recent-text">

                                                <strong>
                                                    {resource.title}
                                                </strong>

                                                <small>
                                                    {
                                                        resource.technology
                                                    }
                                                </small>

                                            </span>

                                            <span className="kb-recent-arrow">
                                                →
                                            </span>

                                        </button>
                                    )
                                )}

                            </div>

                        ) : (

                            <div className="kb-side-empty">

                                <span>
                                    🕐
                                </span>

                                <p>
                                    Resources you open will
                                    appear here.
                                </p>

                            </div>

                        )}

                    </section>

                    {/* SAVED */}

                    <section className="kb-side-card">

                        <div className="kb-side-header">

                            <div>

                                <span>
                                    YOUR LIBRARY
                                </span>

                                <h3>
                                    Saved Resources
                                </h3>

                            </div>

                            <div className="kb-side-icon">
                                ⭐
                            </div>

                        </div>

                        {savedCount > 0 ? (

                            <div className="kb-saved-summary">

                                <div className="kb-saved-number">
                                    {savedCount}
                                </div>

                                <div>
                                    <strong>
                                        saved resources
                                    </strong>

                                    <p>
                                        Keep important references
                                        available for later.
                                    </p>
                                </div>

                            </div>

                        ) : (

                            <div className="kb-side-empty">

                                <span>
                                    ☆
                                </span>

                                <p>
                                    Save useful resources to
                                    build your personal library.
                                </p>

                            </div>

                        )}

                        <button
                            type="button"
                            className="kb-side-action"
                            onClick={() => {
                                setSavedOnly(true);
                                setCompletedOnly(false);
                                setActiveCategory("all");
                                window.scrollTo({
                                    top: 0,
                                    behavior: "smooth",
                                });
                            }}
                        >
                            View Saved Resources →
                        </button>

                    </section>

                    {/* LEARNING TIP */}

                    <section className="kb-side-card kb-tip-card">

                        <div className="kb-tip-icon">
                            💡
                        </div>

                        <span className="kb-tip-label">
                            LEARNING TIP
                        </span>

                        <h3>
                            Learn → Build → Explain
                        </h3>

                        <p>
                            Don't only read documentation.
                            Apply what you learn in a project,
                            then practice explaining the concept
                            in your own words.
                        </p>

                    </section>

                    {/* WORKFLOW */}

                    <section className="kb-side-card">

                        <div className="kb-side-header">

                            <div>

                                <span>
                                    CAREER WORKFLOW
                                </span>

                                <h3>
                                    Turn Knowledge Into Skills
                                </h3>

                            </div>

                            <div className="kb-side-icon">
                                🎯
                            </div>

                        </div>

                        <div className="kb-workflow">

                            <div className="kb-workflow-step">

                                <span>1</span>

                                <div>
                                    <strong>
                                        Learn
                                    </strong>

                                    <small>
                                        Study the concept
                                    </small>
                                </div>

                            </div>

                            <div className="kb-workflow-line" />

                            <div className="kb-workflow-step">

                                <span>2</span>

                                <div>
                                    <strong>
                                        Build
                                    </strong>

                                    <small>
                                        Use it in a project
                                    </small>
                                </div>

                            </div>

                            <div className="kb-workflow-line" />

                            <div className="kb-workflow-step">

                                <span>3</span>

                                <div>
                                    <strong>
                                        Practice
                                    </strong>

                                    <small>
                                        Test yourself
                                    </small>
                                </div>

                            </div>

                        </div>

                    </section>

                </aside>

            </div>

            {/* TRUST NOTE */}

            <footer className="kb-trust-note">

                <div className="kb-trust-icon">
                    ✓
                </div>

                <div>

                    <strong>
                        Resource quality
                    </strong>

                    <p>
                        This Knowledge Base prioritizes official
                        documentation and first-party learning
                        resources. Always verify current APIs,
                        commands and implementation details at
                        the original source.
                    </p>

                </div>

            </footer>

        </div>
    );
};

export default KnowledgeBase;