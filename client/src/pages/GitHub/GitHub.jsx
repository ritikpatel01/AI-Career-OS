import React, { useMemo, useState } from "react";
import { getAuthToken } from "../../services/api";
import "./GitHub.css";


// ============================================================
// API CONFIGURATION
// ============================================================

const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";


// ============================================================
// TARGET ROLES
// ============================================================

const TARGET_ROLES = [
    // Software & Technology
    "Full Stack Developer",
    "Frontend Developer",
    "Backend Developer",
    "Software Engineer",
    "Java Developer",
    "Python Developer",
    "Cloud Engineer",
    "DevOps Engineer",
    "Data Scientist",
    "Data Analyst",
    "Machine Learning Engineer",
    "AI Engineer",
    "Cybersecurity Engineer",

    // Mechanical
    "Mechanical Engineer",
    "Mechanical Design Engineer",
    "Manufacturing Engineer",
    "Production Engineer",

    // Civil
    "Civil Engineer",
    "Structural Engineer",
    "Site Engineer",
    "Construction Engineer",

    // Electrical
    "Electrical Engineer",
    "Electrical Design Engineer",
    "Power Systems Engineer",
    "Control Systems Engineer",

    // Electronics
    "Electronics Engineer",
    "Embedded Engineer",
    "Electronics Design Engineer",
    "VLSI Engineer",

    // Automotive
    "Automotive Engineer",
    "Automotive Design Engineer",
    "Automotive Manufacturing Engineer",

    // Aerospace
    "Aerospace Engineer",
    "Aerospace Design Engineer",
    "Avionics Engineer",

    // Chemical
    "Chemical Engineer",
    "Process Engineer",
    "Chemical Process Design Engineer",

    // Biomedical
    "Biomedical Engineer",
    "Medical Device Engineer",
    "Clinical Engineer"
];


// ============================================================
// SMALL HELPERS
// ============================================================

const getScoreClass = (score = 0) => {
    if (score >= 75) {
        return "github-score-good";
    }

    if (score >= 50) {
        return "github-score-medium";
    }

    return "github-score-low";
};


const formatDate = (date) => {
    if (!date) {
        return "Not available";
    }

    try {
        return new Date(date).toLocaleDateString(
            undefined,
            {
                year: "numeric",
                month: "short",
                day: "numeric"
            }
        );
    } catch {
        return "Not available";
    }
};


const formatNumber = (number = 0) => {
    return new Intl.NumberFormat().format(
        Number(number || 0)
    );
};


const getRepositoryLanguageList = (repository) => {
    if (!repository?.languages) {
        return [];
    }

    return Object.keys(repository.languages);
};


const getInitials = (name = "") => {
    const parts = name
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (parts.length === 0) {
        return "GH";
    }

    if (parts.length === 1) {
        return parts[0]
            .substring(0, 2)
            .toUpperCase();
    }

    return (
        parts[0][0] +
        parts[parts.length - 1][0]
    ).toUpperCase();
};


// ============================================================
// SCORE BAR COMPONENT
// ============================================================

const ScoreBar = ({
    label,
    score = 0
}) => {
    return (
        <div className="github-score-bar-wrapper">

            <div className="github-score-bar-header">

                <span>
                    {label}
                </span>

                <strong>
                    {score}/100
                </strong>

            </div>

            <div className="github-score-bar">

                <div
                    className={`github-score-bar-fill ${getScoreClass(
                        score
                    )}`}
                    style={{
                        width: `${Math.min(
                            Math.max(score, 0),
                            100
                        )}%`
                    }}
                />

            </div>

        </div>
    );
};


// ============================================================
// CHECK ITEM
// ============================================================

const CheckItem = ({
    passed,
    children
}) => {
    return (
        <div
            className={
                passed
                    ? "github-check-item github-check-success"
                    : "github-check-item github-check-warning"
            }
        >

            <span className="github-check-icon">
                {passed ? "✓" : "!"}
            </span>

            <span>
                {children}
            </span>

        </div>
    );
};


// ============================================================
// MAIN COMPONENT
// ============================================================

const GitHub = () => {

    const [username, setUsername] =
        useState("");

    const [role, setRole] =
        useState("Full Stack Developer");

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    const [result, setResult] =
        useState(null);


    // ========================================================
    // ANALYZE GITHUB
    // ========================================================

    const handleAnalyze = async (event) => {

        event.preventDefault();

        setError("");
        setSuccess("");


        if (!username.trim()) {

            setError(
                "Please enter a GitHub username."
            );

            return;
        }


        const token = getAuthToken();


        if (!token) {

            setError(
                "Authentication token not found. Please log in again."
            );

            return;
        }


        setLoading(true);


        try {

            const response =
                await fetch(
                    `${API_BASE_URL}/github/analyze`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            Authorization:
                                `Bearer ${token}`
                        },

                        body: JSON.stringify({
                            username:
                                username.trim(),

                            role
                        })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    data.error ||
                    "Failed to analyze GitHub profile."
                );
            }


            if (
                !data.success ||
                !data.data
            ) {

                throw new Error(
                    "Invalid GitHub analysis response."
                );
            }


            setResult(data.data);

            setSuccess(
                `GitHub profile "${data.data.username}" analyzed successfully.`
            );


            // Scroll to results

            setTimeout(() => {

                document
                    .getElementById(
                        "github-analysis-results"
                    )
                    ?.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });

            }, 100);

        } catch (err) {

            console.error(
                "GitHub Analysis Error:",
                err
            );

            setError(
                err.message ||
                "Failed to analyze GitHub profile."
            );

        } finally {

            setLoading(false);
        }
    };


    // ========================================================
    // DERIVED DATA
    // ========================================================

    const profile =
        result?.profile || null;

    const analysis =
        result?.analysis || null;

    const repositories =
        result?.repositories || [];

    const repositoryAnalysis =
        analysis?.repositories || {};

    const documentation =
        analysis?.documentation || {};

    const technologies =
        analysis?.technologies || {};

    const activity =
        analysis?.activity || {};

    const careerAlignment =
        analysis?.careerAlignment || {};

    const weaknesses =
        analysis?.weaknesses || [];

    const improvementPlan =
        analysis?.improvementPlan || [];


    // ========================================================
    // TECHNOLOGY DISPLAY
    // ========================================================

    const technologyList = useMemo(() => {

        return (
            technologies.technologies || []
        )
            .slice(0, 12);

    }, [technologies]);


    // ========================================================
    // TOP REPOSITORIES
    // ========================================================

    const topRepositories =
        useMemo(() => {

            return (
                repositoryAnalysis.analysis ||
                repositories
            ).slice(0, 10);

        }, [
            repositoryAnalysis,
            repositories
        ]);


    // ========================================================
    // PROFILE CHECKS
    // ========================================================

    const profileChecks = {

        hasName:
            Boolean(profile?.name),

        hasBio:
            Boolean(
                profile?.bio &&
                profile.bio.trim()
            ),

        hasLocation:
            Boolean(profile?.location),

        hasWebsite:
            Boolean(
                profile?.blog &&
                profile.blog.trim()
            ),

        hasRepositories:
            Number(
                profile?.publicRepos || 0
            ) > 0,

        hasAvatar:
            Boolean(profile?.avatarUrl)
    };


    // ========================================================
    // UI
    // ========================================================

    return (
        <div className="github-page">


            {/* ==================================================
                HEADER
            ================================================== */}

            <header className="github-page-header">

                <div>

                    <span className="github-eyebrow">
                        AI CAREER OS
                    </span>

                    <h1>
                        GitHub Professional Analyzer
                    </h1>

                    <p>
                        Analyze your public GitHub profile,
                        projects, technologies, activity,
                        documentation, and alignment with
                        your target career.
                    </p>

                </div>

                <div className="github-header-icon">
                    GH
                </div>

            </header>


            {/* ==================================================
                CONNECTION / INPUT
            ================================================== */}

            <section className="github-connect-card">

                <div className="github-section-heading">

                    <div className="github-step-number">
                        01
                    </div>

                    <div>

                        <h2>
                            Analyze Your GitHub
                        </h2>

                        <p>
                            Enter your GitHub username
                            and select the career role
                            you are targeting.
                        </p>

                    </div>

                </div>


                <form
                    className="github-analysis-form"
                    onSubmit={handleAnalyze}
                >

                    <div className="github-form-group">

                        <label htmlFor="github-username">
                            GitHub Username
                        </label>

                        <input
                            id="github-username"
                            type="text"
                            value={username}
                            onChange={(event) =>
                                setUsername(
                                    event.target.value
                                )
                            }
                            placeholder="e.g. ritikpatel01"
                            autoComplete="off"
                        />

                        <span className="github-input-help">
                            You can enter your GitHub
                            username or profile URL.
                        </span>

                    </div>


                    <div className="github-form-group">

                        <label htmlFor="github-role">
                            Target Role
                        </label>

                        <select
                            id="github-role"
                            value={role}
                            onChange={(event) =>
                                setRole(
                                    event.target.value
                                )
                            }
                        >

                            {TARGET_ROLES.map(
                                (targetRole) => (
                                    <option
                                        key={targetRole}
                                        value={targetRole}
                                    >
                                        {targetRole}
                                    </option>
                                )
                            )}

                        </select>

                        <span className="github-input-help">
                            Career alignment is based on
                            technologies detected in public
                            repository data.
                        </span>

                    </div>


                    <button
                        type="submit"
                        className="github-analyze-button"
                        disabled={loading}
                    >

                        {loading ? (
                            <>
                                <span className="github-spinner" />
                                Analyzing GitHub...
                            </>
                        ) : (
                            <>
                                Analyze GitHub
                                <span>→</span>
                            </>
                        )}

                    </button>

                </form>


                {error && (
                    <div className="github-message github-message-error">
                        <span>!</span>
                        {error}
                    </div>
                )}


                {success && (
                    <div className="github-message github-message-success">
                        <span>✓</span>
                        {success}
                    </div>
                )}

            </section>


            {/* ==================================================
                EMPTY STATE
            ================================================== */}

            {!result && !loading && (

                <section className="github-empty-state">

                    <div className="github-empty-icon">
                        GH
                    </div>

                    <h2>
                        Turn Your GitHub Into Career Evidence
                    </h2>

                    <p>
                        We will inspect your public GitHub
                        profile and provide evidence-based
                        feedback on profile quality, projects,
                        documentation, technology usage,
                        activity, and target-role alignment.
                    </p>

                    <div className="github-empty-features">

                        <span>
                            ✓ Profile Quality
                        </span>

                        <span>
                            ✓ Repository Analysis
                        </span>

                        <span>
                            ✓ Technology Profile
                        </span>

                        <span>
                            ✓ Career Alignment
                        </span>

                        <span>
                            ✓ Improvement Plan
                        </span>

                    </div>

                </section>

            )}


            {/* ==================================================
                LOADING
            ================================================== */}

            {loading && (

                <section className="github-loading-card">

                    <div className="github-large-spinner" />

                    <h2>
                        Analyzing GitHub Profile
                    </h2>

                    <p>
                        Collecting profile data,
                        repositories, documentation,
                        technologies, and activity...
                    </p>

                    <div className="github-loading-steps">

                        <span>
                            ✓ GitHub profile
                        </span>

                        <span>
                            ✓ Repositories
                        </span>

                        <span>
                            ✓ README files
                        </span>

                        <span>
                            ✓ Technologies
                        </span>

                        <span>
                            ✓ Activity
                        </span>

                    </div>

                </section>

            )}


            {/* ==================================================
                RESULTS
            ================================================== */}

            {result && !loading && (

                <div
                    id="github-analysis-results"
                    className="github-results"
                >


                    {/* ==========================================
                        PROFILE CARD
                    ========================================== */}

                    <section className="github-profile-card">

                        <div className="github-profile-main">

                            {profile?.avatarUrl ? (

                                <img
                                    src={
                                        profile.avatarUrl
                                    }
                                    alt={
                                        profile.name ||
                                        profile.login
                                    }
                                    className="github-profile-avatar"
                                />

                            ) : (

                                <div className="github-profile-avatar github-profile-initials">
                                    {getInitials(
                                        profile?.name ||
                                        profile?.login
                                    )}
                                </div>

                            )}


                            <div className="github-profile-info">

                                <div className="github-profile-name-row">

                                    <h2>
                                        {profile?.name ||
                                            profile?.login}
                                    </h2>

                                    <span className="github-profile-role">
                                        {role}
                                    </span>

                                </div>

                                <p className="github-profile-username">
                                    @{profile?.login}
                                </p>

                                <p className="github-profile-bio">
                                    {profile?.bio ||
                                        "No public GitHub bio provided."}
                                </p>


                                <div className="github-profile-links">

                                    {profile?.htmlUrl && (
                                        <a
                                            href={
                                                profile.htmlUrl
                                            }
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            View GitHub Profile →
                                        </a>
                                    )}

                                    {profile?.blog && (
                                        <a
                                            href={
                                                profile.blog.startsWith(
                                                    "http"
                                                )
                                                    ? profile.blog
                                                    : `https://${profile.blog}`
                                            }
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            Portfolio →
                                        </a>
                                    )}

                                </div>

                            </div>

                        </div>


                        <div className="github-profile-stats">

                            <div className="github-stat">
                                <span>
                                    Repositories
                                </span>
                                <strong>
                                    {formatNumber(
                                        profile?.publicRepos
                                    )}
                                </strong>
                            </div>

                            <div className="github-stat">
                                <span>
                                    Followers
                                </span>
                                <strong>
                                    {formatNumber(
                                        profile?.followers
                                    )}
                                </strong>
                            </div>

                            <div className="github-stat">
                                <span>
                                    Following
                                </span>
                                <strong>
                                    {formatNumber(
                                        profile?.following
                                    )}
                                </strong>
                            </div>

                            <div className="github-stat">
                                <span>
                                    Location
                                </span>
                                <strong>
                                    {profile?.location ||
                                        "Not provided"}
                                </strong>
                            </div>

                        </div>

                    </section>


                    {/* ==========================================
                        HEALTH SCORE
                    ========================================== */}

                    <section className="github-health-card">

                        <div className="github-card-title-row">

                            <div>

                                <span className="github-card-eyebrow">
                                    GITHUB HEALTH
                                </span>

                                <h2>
                                    Professional Profile Signals
                                </h2>

                                <p>
                                    A transparent summary of
                                    the public evidence found
                                    in this GitHub profile.
                                </p>

                            </div>

                            <div
                                className={`github-health-score ${getScoreClass(
                                    analysis?.healthScore
                                )}`}
                            >
                                <strong>
                                    {analysis?.healthScore ??
                                        0}
                                </strong>

                                <span>
                                    / 100
                                </span>
                            </div>

                        </div>


                        <div className="github-score-grid">

                            <ScoreBar
                                label="Profile Quality"
                                score={
                                    analysis?.profile?.score ||
                                    0
                                }
                            />

                            <ScoreBar
                                label="Repositories"
                                score={
                                    repositoryAnalysis?.score ||
                                    0
                                }
                            />

                            <ScoreBar
                                label="Documentation"
                                score={
                                    documentation?.score ||
                                    0
                                }
                            />

                            <ScoreBar
                                label="Activity"
                                score={
                                    activity?.score ||
                                    0
                                }
                            />

                            <ScoreBar
                                label="Career Alignment"
                                score={
                                    careerAlignment?.score ||
                                    0
                                }
                            />

                        </div>

                    </section>


                    {/* ==========================================
                        TWO COLUMN ANALYSIS
                    ========================================== */}

                    <div className="github-two-column">


                        {/* ======================================
                            PROFILE QUALITY
                        ====================================== */}

                        <section className="github-card">

                            <div className="github-card-header">

                                <div>

                                    <span className="github-card-eyebrow">
                                        PROFILE
                                    </span>

                                    <h2>
                                        Profile Quality
                                    </h2>

                                </div>

                                <span
                                    className={`github-mini-score ${getScoreClass(
                                        analysis?.profile?.score
                                    )}`}
                                >
                                    {analysis?.profile?.score ||
                                        0}
                                </span>

                            </div>


                            <div className="github-check-list">

                                <CheckItem
                                    passed={
                                        profileChecks.hasName
                                    }
                                >
                                    Professional name
                                </CheckItem>

                                <CheckItem
                                    passed={
                                        profileChecks.hasBio
                                    }
                                >
                                    Professional bio
                                </CheckItem>

                                <CheckItem
                                    passed={
                                        profileChecks.hasAvatar
                                    }
                                >
                                    Profile picture
                                </CheckItem>

                                <CheckItem
                                    passed={
                                        profileChecks.hasLocation
                                    }
                                >
                                    Location
                                </CheckItem>

                                <CheckItem
                                    passed={
                                        profileChecks.hasWebsite
                                    }
                                >
                                    Portfolio / website
                                </CheckItem>

                                <CheckItem
                                    passed={
                                        profileChecks.hasRepositories
                                    }
                                >
                                    Public repositories
                                </CheckItem>

                            </div>


                            <div className="github-profile-details">

                                <div>
                                    <span>
                                        Account created
                                    </span>

                                    <strong>
                                        {formatDate(
                                            profile?.createdAt
                                        )}
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Public Gists
                                    </span>

                                    <strong>
                                        {formatNumber(
                                            profile?.publicGists
                                        )}
                                    </strong>
                                </div>

                            </div>

                        </section>


                        {/* ======================================
                            CAREER ALIGNMENT
                        ====================================== */}

                        <section className="github-card">

                            <div className="github-card-header">

                                <div>

                                    <span className="github-card-eyebrow">
                                        CAREER
                                    </span>

                                    <h2>
                                        Career Alignment
                                    </h2>

                                </div>

                                <span
                                    className={`github-mini-score ${getScoreClass(
                                        careerAlignment?.score
                                    )}`}
                                >
                                    {careerAlignment?.score ||
                                        0}
                                </span>

                            </div>


                            <div className="github-role-label">
                                Target Role
                            </div>

                            <div className="github-target-role">
                                {careerAlignment?.role ||
                                    role}
                            </div>


                            <div className="github-alignment-section">

                                <h3>
                                    Detected
                                </h3>

                                <div className="github-tag-list">

                                    {(
                                        careerAlignment
                                            ?.matchedTechnologies ||
                                        []
                                    ).map(
                                        (technology) => (
                                            <span
                                                key={technology}
                                                className="github-tag github-tag-success"
                                            >
                                                ✓ {technology}
                                            </span>
                                        )
                                    )}

                                    {(
                                        careerAlignment
                                            ?.matchedTechnologies ||
                                        []
                                    ).length === 0 && (
                                        <span className="github-muted">
                                            No matching technologies
                                            detected.
                                        </span>
                                    )}

                                </div>

                            </div>


                            <div className="github-alignment-section">

                                <h3>
                                    Not detected
                                </h3>

                                <div className="github-tag-list">

                                    {(
                                        careerAlignment
                                            ?.missingTechnologies ||
                                        []
                                    )
                                        .slice(0, 8)
                                        .map(
                                            (technology) => (
                                                <span
                                                    key={
                                                        technology
                                                    }
                                                    className="github-tag github-tag-warning"
                                                >
                                                    {technology}
                                                </span>
                                            )
                                        )}

                                    {(
                                        careerAlignment
                                            ?.missingTechnologies ||
                                        []
                                    ).length === 0 && (
                                        <span className="github-muted">
                                            No missing technologies
                                            from the configured role
                                            profile.
                                        </span>
                                    )}

                                </div>

                            </div>


                            <p className="github-card-note">
                                {careerAlignment?.note}
                            </p>

                        </section>

                    </div>


                    {/* ==========================================
                        TECHNOLOGY PROFILE
                    ========================================== */}

                    <section className="github-card">

                        <div className="github-card-header">

                            <div>

                                <span className="github-card-eyebrow">
                                    TECHNOLOGY
                                </span>

                                <h2>
                                    Technology Profile
                                </h2>

                                <p>
                                    Languages detected across
                                    the analyzed repositories.
                                </p>

                            </div>

                            <span className="github-count-badge">
                                {technologies?.technologyCount ||
                                    0}{" "}
                                technologies
                            </span>

                        </div>


                        {technologyList.length > 0 ? (

                            <div className="github-technology-list">

                                {technologyList.map(
                                    (item, index) => {

                                        const maxCount =
                                            technologyList[0]
                                                ?.repositoryCount ||
                                            1;

                                        const percentage =
                                            Math.max(
                                                12,
                                                Math.round(
                                                    (
                                                        item.repositoryCount /
                                                        maxCount
                                                    ) *
                                                    100
                                                )
                                            );

                                        return (
                                            <div
                                                key={
                                                    item.technology
                                                }
                                                className="github-tech-row"
                                            >

                                                <div className="github-tech-name">
                                                    <span>
                                                        {item.technology}
                                                    </span>

                                                    <strong>
                                                        {
                                                            item.repositoryCount
                                                        }{" "}
                                                        repos
                                                    </strong>
                                                </div>

                                                <div className="github-tech-bar">
                                                    <div
                                                        style={{
                                                            width: `${percentage}%`
                                                        }}
                                                    />
                                                </div>

                                            </div>
                                        );
                                    }
                                )}

                            </div>

                        ) : (

                            <div className="github-empty-inline">
                                No technology data detected.
                            </div>

                        )}

                    </section>


                    {/* ==========================================
                        REPOSITORIES
                    ========================================== */}

                    <section className="github-card">

                        <div className="github-card-header">

                            <div>

                                <span className="github-card-eyebrow">
                                    PROJECTS
                                </span>

                                <h2>
                                    Repository Analysis
                                </h2>

                                <p>
                                    Quality signals from your
                                    public repositories.
                                </p>

                            </div>

                            <span className="github-count-badge">
                                {
                                    repositoryAnalysis
                                        ?.repositoryCount ||
                                    repositories.length
                                }{" "}
                                analyzed
                            </span>

                        </div>


                        {topRepositories.length > 0 ? (

                            <div className="github-repository-list">

                                {topRepositories.map(
                                    (repository) => {

                                        const repoScore =
                                            repository.score ??
                                            null;

                                        const languages =
                                            repository.languages ||
                                            {};

                                        const languageList =
                                            Object.keys(
                                                languages
                                            ).slice(0, 5);

                                        const metrics =
                                            repository.metrics ||
                                            {};

                                        return (
                                            <article
                                                key={
                                                    repository.name ||
                                                    repository.id
                                                }
                                                className="github-repository-card"
                                            >

                                                <div className="github-repository-top">

                                                    <div>

                                                        <h3>
                                                            {repository.name}
                                                        </h3>

                                                        <p>
                                                            {repository.description ||
                                                                "No repository description provided."}
                                                        </p>

                                                    </div>

                                                    {repoScore !== null && (
                                                        <div
                                                            className={`github-repo-score ${getScoreClass(
                                                                repoScore
                                                            )}`}
                                                        >
                                                            {repoScore}
                                                        </div>
                                                    )}

                                                </div>


                                                <div className="github-repository-meta">

                                                    <span>
                                                        ⭐{" "}
                                                        {formatNumber(
                                                            metrics.stars ??
                                                            repository.stars
                                                        )}
                                                    </span>

                                                    <span>
                                                        Forks:{" "}
                                                        {formatNumber(
                                                            metrics.forks ??
                                                            repository.forks
                                                        )}
                                                    </span>

                                                    {metrics.hasReadme !==
                                                        undefined && (
                                                        <span>
                                                            README{" "}
                                                            {metrics.hasReadme
                                                                ? "✓"
                                                                : "!"}
                                                        </span>
                                                    )}

                                                    {metrics.hasDescription !==
                                                        undefined && (
                                                        <span>
                                                            Description{" "}
                                                            {metrics.hasDescription
                                                                ? "✓"
                                                                : "!"}
                                                        </span>
                                                    )}

                                                </div>


                                                {languageList.length >
                                                    0 && (

                                                    <div className="github-repository-tags">

                                                        {languageList.map(
                                                            (
                                                                language
                                                            ) => (
                                                                <span
                                                                    key={
                                                                        language
                                                                    }
                                                                    className="github-tag"
                                                                >
                                                                    {
                                                                        language
                                                                    }
                                                                </span>
                                                            )
                                                        )}

                                                    </div>

                                                )}


                                                <div className="github-repository-bottom">

                                                    <div className="github-repository-checks">

                                                        {metrics.hasReadme !==
                                                            undefined && (
                                                            <span
                                                                className={
                                                                    metrics.hasReadme
                                                                        ? "github-pass"
                                                                        : "github-warning"
                                                                }
                                                            >
                                                                {metrics.hasReadme
                                                                    ? "✓ README"
                                                                    : "! README"}
                                                            </span>
                                                        )}

                                                        {metrics.hasTopics !==
                                                            undefined && (
                                                            <span
                                                                className={
                                                                    metrics.hasTopics
                                                                        ? "github-pass"
                                                                        : "github-warning"
                                                                }
                                                            >
                                                                {metrics.hasTopics
                                                                    ? "✓ Topics"
                                                                    : "! Topics"}
                                                            </span>
                                                        )}

                                                        {metrics.hasCommits !==
                                                            undefined && (
                                                            <span
                                                                className={
                                                                    metrics.hasCommits
                                                                        ? "github-pass"
                                                                        : "github-warning"
                                                                }
                                                            >
                                                                {metrics.hasCommits
                                                                    ? "✓ Commits"
                                                                    : "! Activity"}
                                                            </span>
                                                        )}

                                                    </div>


                                                    {repository.htmlUrl && (
                                                        <a
                                                            href={
                                                                repository.htmlUrl
                                                            }
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="github-repository-link"
                                                        >
                                                            View Repository →
                                                        </a>
                                                    )}

                                                </div>

                                            </article>
                                        );
                                    }
                                )}

                            </div>

                        ) : (

                            <div className="github-empty-inline">
                                No public repositories were available
                                for detailed analysis.
                            </div>

                        )}

                    </section>


                    {/* ==========================================
                        ACTIVITY
                    ========================================== */}

                    <section className="github-card">

                        <div className="github-card-header">

                            <div>

                                <span className="github-card-eyebrow">
                                    ACTIVITY
                                </span>

                                <h2>
                                    Development Activity
                                </h2>

                                <p>
                                    Public GitHub activity signals
                                    available to the analyzer.
                                </p>

                            </div>

                            <span
                                className={`github-mini-score ${getScoreClass(
                                    activity?.score
                                )}`}
                            >
                                {activity?.score || 0}
                            </span>

                        </div>


                        <div className="github-activity-grid">

                            <div>
                                <strong>
                                    {
                                        activity?.metrics
                                            ?.totalEvents || 0
                                    }
                                </strong>

                                <span>
                                    Public events
                                </span>
                            </div>

                            <div>
                                <strong>
                                    {
                                        activity?.metrics
                                            ?.pushEvents || 0
                                    }
                                </strong>

                                <span>
                                    Push events
                                </span>
                            </div>

                            <div>
                                <strong>
                                    {
                                        activity?.metrics
                                            ?.pullRequestEvents ||
                                        0
                                    }
                                </strong>

                                <span>
                                    Pull requests
                                </span>
                            </div>

                            <div>
                                <strong>
                                    {
                                        activity?.metrics
                                            ?.issueEvents || 0
                                    }
                                </strong>

                                <span>
                                    Issues
                                </span>
                            </div>

                            <div>
                                <strong>
                                    {
                                        activity?.metrics
                                            ?.activeRepositories ||
                                        0
                                    }
                                </strong>

                                <span>
                                    Active repositories
                                </span>
                            </div>

                        </div>


                        <p className="github-card-note">
                            {activity?.note}
                        </p>

                    </section>


                    {/* ==========================================
                        DOCUMENTATION
                    ========================================== */}

                    <section className="github-card">

                        <div className="github-card-header">

                            <div>

                                <span className="github-card-eyebrow">
                                    DOCUMENTATION
                                </span>

                                <h2>
                                    Project Documentation
                                </h2>

                                <p>
                                    Clear documentation helps
                                    visitors understand your work.
                                </p>

                            </div>

                            <span
                                className={`github-mini-score ${getScoreClass(
                                    documentation?.score
                                )}`}
                            >
                                {documentation?.score || 0}
                            </span>

                        </div>


                        <div className="github-documentation-stats">

                            <div>
                                <strong>
                                    {
                                        documentation
                                            ?.repositoriesWithReadme ||
                                        0
                                    }
                                </strong>

                                <span>
                                    With README
                                </span>
                            </div>

                            <div>
                                <strong>
                                    {
                                        documentation
                                            ?.repositoriesWithDescription ||
                                        0
                                    }
                                </strong>

                                <span>
                                    With description
                                </span>
                            </div>

                            <div>
                                <strong>
                                    {
                                        documentation
                                            ?.totalRepositories ||
                                        0
                                    }
                                </strong>

                                <span>
                                    Total analyzed
                                </span>
                            </div>

                        </div>


                        <div className="github-recommendation-list">

                            {(
                                documentation
                                    ?.recommendations ||
                                []
                            ).map(
                                (recommendation) => (
                                    <div
                                        key={
                                            recommendation
                                        }
                                        className="github-recommendation"
                                    >
                                        <span>
                                            →
                                        </span>

                                        {recommendation}
                                    </div>
                                )
                            )}

                        </div>

                    </section>


                    {/* ==========================================
                        WEAKNESSES
                    ========================================== */}

                    <section className="github-card">

                        <div className="github-card-header">

                            <div>

                                <span className="github-card-eyebrow">
                                    GAPS
                                </span>

                                <h2>
                                    Areas That Need Attention
                                </h2>

                                <p>
                                    Specific weaknesses identified
                                    from the available GitHub evidence.
                                </p>

                            </div>

                            <span className="github-count-badge">
                                {weaknesses.length} areas
                            </span>

                        </div>


                        {weaknesses.length > 0 ? (

                            <div className="github-weakness-list">

                                {weaknesses.map(
                                    (weakness, index) => (
                                        <div
                                            key={`${weakness.area}-${index}`}
                                            className="github-weakness"
                                        >

                                            <div className="github-weakness-icon">
                                                !
                                            </div>

                                            <div>

                                                <span>
                                                    {
                                                        weakness.area
                                                    }
                                                </span>

                                                <p>
                                                    {
                                                        weakness.issue
                                                    }
                                                </p>

                                            </div>

                                        </div>
                                    )
                                )}

                            </div>

                        ) : (

                            <div className="github-positive-message">
                                No major weakness signals were
                                identified by the configured checks.
                            </div>

                        )}

                    </section>


                    {/* ==========================================
                        IMPROVEMENT PLAN
                    ========================================== */}

                    <section className="github-improvement-card">

                        <div className="github-card-header">

                            <div>

                                <span className="github-card-eyebrow">
                                    ACTION PLAN
                                </span>

                                <h2>
                                    Improve Your GitHub
                                </h2>

                                <p>
                                    Practical actions based on
                                    the detected evidence.
                                </p>

                            </div>

                        </div>


                        <div className="github-improvement-list">

                            {improvementPlan.map(
                                (item, index) => (

                                    <div
                                        key={`${item.area}-${index}`}
                                        className="github-improvement-item"
                                    >

                                        <div
                                            className={`github-priority github-priority-${String(
                                                item.priority
                                            ).toLowerCase()}`}
                                        >
                                            {item.priority}
                                        </div>

                                        <div className="github-improvement-content">

                                            <span>
                                                {item.area}
                                            </span>

                                            <p>
                                                {item.action}
                                            </p>


                                            {item.technologies &&
                                                item.technologies
                                                    .length > 0 && (

                                                    <div className="github-tag-list">

                                                        {item.technologies.map(
                                                            (
                                                                technology
                                                            ) => (
                                                                <span
                                                                    key={
                                                                        technology
                                                                    }
                                                                    className="github-tag"
                                                                >
                                                                    {
                                                                        technology
                                                                    }
                                                                </span>
                                                            )
                                                        )}

                                                    </div>

                                                )}

                                        </div>

                                    </div>

                                )
                            )}

                        </div>

                    </section>


                    {/* ==========================================
                        PROFESSIONAL READINESS
                    ========================================== */}

                    <section className="github-readiness-card">

                        <div className="github-readiness-header">

                            <div>

                                <span className="github-card-eyebrow">
                                    PROFESSIONAL READINESS
                                </span>

                                <h2>
                                    GitHub Evidence Summary
                                </h2>

                                <p>
                                    Use these signals to decide
                                    what to improve before sharing
                                    your GitHub profile professionally.
                                </p>

                            </div>

                            <div className="github-readiness-icon">
                                ✓
                            </div>

                        </div>


                        <div className="github-readiness-grid">

                            <div>
                                <span>
                                    Profile
                                </span>

                                <strong>
                                    {getScoreClass(
                                        analysis?.profile?.score
                                    ) === "github-score-good"
                                        ? "Strong evidence"
                                        : getScoreClass(
                                              analysis?.profile?.score
                                          ) ===
                                          "github-score-medium"
                                        ? "Some improvements"
                                        : "Needs attention"}
                                </strong>
                            </div>


                            <div>
                                <span>
                                    Projects
                                </span>

                                <strong>
                                    {getScoreClass(
                                        repositoryAnalysis?.score
                                    ) === "github-score-good"
                                        ? "Strong evidence"
                                        : getScoreClass(
                                              repositoryAnalysis?.score
                                          ) ===
                                          "github-score-medium"
                                        ? "Some improvements"
                                        : "Needs attention"}
                                </strong>
                            </div>


                            <div>
                                <span>
                                    Documentation
                                </span>

                                <strong>
                                    {getScoreClass(
                                        documentation?.score
                                    ) === "github-score-good"
                                        ? "Strong evidence"
                                        : getScoreClass(
                                              documentation?.score
                                          ) ===
                                          "github-score-medium"
                                        ? "Some improvements"
                                        : "Needs attention"}
                                </strong>
                            </div>


                            <div>
                                <span>
                                    Role Alignment
                                </span>

                                <strong>
                                    {getScoreClass(
                                        careerAlignment?.score
                                    ) === "github-score-good"
                                        ? "Strong evidence"
                                        : getScoreClass(
                                              careerAlignment?.score
                                          ) ===
                                          "github-score-medium"
                                        ? "Some improvements"
                                        : "Needs attention"}
                                </strong>
                            </div>

                        </div>


                        <div className="github-trust-note">

                            <strong>
                                Important:
                            </strong>

                            <span>
                                This analysis uses public GitHub
                                evidence and configured checks.
                                It is not a hiring decision or a
                                guarantee of job readiness.
                            </span>

                        </div>

                    </section>

                </div>
            )}

        </div>
    );
};


export default function GitHubDesktopCanvas() {
    return (
        <div className="github-desktop-scroll" role="region" aria-label="GitHub page. Scroll horizontally to view all content on narrow screens." tabIndex={0}>
            <div className="github-desktop-canvas">
                <GitHub />
            </div>
        </div>
    );
}
