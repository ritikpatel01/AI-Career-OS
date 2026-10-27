import { useEffect, useMemo, useRef, useState } from "react";
import { API_BASE_URL, getAuthToken } from "../../services/api";

import {
    getResumes,
    deleteResume
} from "../../services/resumeService";

import {
    CAREER_CATEGORIES,
    ALL_CAREER_ROLES,
    getCareerByName
} from "../../data/careers/careerCatalog";

import { getRoadmaps, createRoadmap } from "../../services/roadmapService";

import "./Resume.css";


/* =========================================================
   SAFE VALUE HELPERS
========================================================= */

const safeText = (value, fallback = "") => {
    if (value === null || value === undefined) {
        return fallback;
    }

    if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
    ) {
        return String(value);
    }

    if (Array.isArray(value)) {
        return value
            .map((item) => safeText(item))
            .filter(Boolean)
            .join(", ");
    }

    if (typeof value === "object") {
        return (
            value.title ||
            value.name ||
            value.skill ||
            value.label ||
            value.detail ||
            value.description ||
            value.reason ||
            value.message ||
            Object.values(value)
                .map((item) => safeText(item))
                .filter(Boolean)
                .join(", ")
        );
    }

    return fallback;
};


const getScore = (...values) => {
    for (const value of values) {
        const number = Number(value);

        if (Number.isFinite(number)) {
            return Math.max(
                0,
                Math.min(100, Math.round(number))
            );
        }
    }

    return null;
};


const getReadinessLabel = (score) => {
    if (score === null) {
        return "Not available";
    }

    if (score >= 85) {
        return "Strongly aligned";
    }

    if (score >= 70) {
        return "Good foundation";
    }

    if (score >= 55) {
        return "Needs improvement";
    }

    return "Needs significant work";
};


const getStatusLabel = (status) => {
    const value = safeText(status).toLowerCase();

    if (value === "demonstrated") {
        return "Demonstrated";
    }

    if (value === "supported") {
        return "Supported";
    }

    if (value === "mentioned") {
        return "Mentioned";
    }

    if (value === "missing") {
        return "Not found";
    }

    if (value === "weak") {
        return "Limited evidence";
    }

    if (value === "strong") {
        return "Strong evidence";
    }

    if (value === "partial") {
        return "Partial evidence";
    }

    return safeText(
        status,
        "Reviewed"
    );
};


const getStatusClass = (status) => {
    const value = safeText(status).toLowerCase();

    if (
        value.includes("demonstrated") ||
        value.includes("strong")
    ) {
        return "status-strong";
    }

    if (
        value.includes("supported") ||
        value.includes("partial") ||
        value.includes("weak")
    ) {
        return "status-partial";
    }

    if (
        value.includes("missing") ||
        value.includes("not found")
    ) {
        return "status-missing";
    }

    return "status-neutral";
};


/* =========================================================
   ANALYSIS ITEM HELPERS
========================================================= */

const getItemTitle = (item) => {
    if (typeof item === "string") {
        return item;
    }

    if (
        typeof item === "number" ||
        typeof item === "boolean"
    ) {
        return String(item);
    }

    if (!item || typeof item !== "object") {
        return "Recommendation";
    }

    return safeText(
        item.title ||
        item.skill ||
        item.name ||
        item.action ||
        item.label,
        "Recommendation"
    );
};


const getItemDetail = (item) => {
    if (
        typeof item === "string" ||
        !item ||
        typeof item !== "object"
    ) {
        return "";
    }

    return safeText(
        item.detail ||
        item.reason ||
        item.description ||
        item.evidence ||
        item.message,
        ""
    );
};


/* =========================================================
   ROLE SUMMARY
========================================================= */

const getRoleSummaryText = (
    summary,
    role
) => {
    if (!summary) {
        return `Your resume has been evaluated for ${safeText(
            role,
            "your target role"
        )}.`;
    }

    if (typeof summary === "string") {
        return summary;
    }

    if (typeof summary !== "object") {
        return safeText(
            summary,
            `Your resume has been evaluated for ${safeText(
                role
            )}.`
        );
    }

    const core = Array.isArray(
        summary.coreRequirements
    )
        ? summary.coreRequirements.length
        : 0;

    const important = Array.isArray(
        summary.importantRequirements
    )
        ? summary.importantRequirements.length
        : 0;

    const tools = Array.isArray(
        summary.tools
    )
        ? summary.tools.length
        : 0;

    return (
        `Your resume was evaluated against ` +
        `${core} core requirements, ` +
        `${important} important requirements and ` +
        `${tools} relevant tools for ` +
        `${safeText(role, "your target role")}.`
    );
};


/* =========================================================
   COMPONENT
========================================================= */

const Resume = () => {

    const [resumes, setResumes] = useState([]);

    const [selectedFile, setSelectedFile] =
        useState(null);

    const [targetRole, setTargetRole] =
        useState("");

    const [jobDescription, setJobDescription] =
        useState("");

    const [loading, setLoading] =
        useState(true);

    const [analyzing, setAnalyzing] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    const [analysis, setAnalysis] =
        useState(null);

    const [activeTab, setActiveTab] =
        useState("overview");

    const [showJobDescription, setShowJobDescription] =
        useState(false);

    const [showAllSkills, setShowAllSkills] =
        useState(false);

    const [showAllRecommendations, setShowAllRecommendations] =
        useState(false);

    const [dragActive, setDragActive] =
        useState(false);


    const [roadmapSkills, setRoadmapSkills] = useState([]);
    const [roadmapLoading, setRoadmapLoading] = useState(true);
    const [roadmapError, setRoadmapError] = useState("");
    const [savingSkill, setSavingSkill] = useState("");
    const roadmapSaveLock = useRef(false);
    const skillKey = (value) => String(value).trim().replace(/\s+/g, " ").toLowerCase();

    const loadResumeSkills = async () => {
        setRoadmapLoading(true);
        setRoadmapError("");
        try {
            const response = await getRoadmaps();
            if (!response?.success || !Array.isArray(response.data)) throw new Error("Could not load saved skills.");
            setRoadmapSkills(response.data.filter((record) => record.goal === "resume-skill-gap-v1"));
        } catch (err) {
            setRoadmapError(err.message || "Could not load saved skills.");
        } finally {
            setRoadmapLoading(false);
        }
    };

    useEffect(() => { loadResumeSkills(); }, []);

    const addResumeSkill = async (item) => {
        if (roadmapSaveLock.current) return;
        const title = getItemTitle(item).trim().replace(/\s+/g, " ");
        const key = skillKey(title);
        roadmapSaveLock.current = true;
        setSavingSkill(key);
        setRoadmapError("");
        try {
            if (title.length < 2 || title.length > 100) throw new Error("Skill names must contain 2–100 characters.");
            const response = await getRoadmaps();
            if (!response?.success || !Array.isArray(response.data)) throw new Error("Could not check saved skills. Please retry.");
            const saved = response.data.filter((record) => record.goal === "resume-skill-gap-v1");
            if (saved.some((record) => skillKey(record.title) === key)) {
                setRoadmapSkills(saved);
                return;
            }
            const result = await createRoadmap({
                title,
                goal: "resume-skill-gap-v1",
                description: (getItemDetail(item) || "Skill identified for development during resume analysis.").slice(0, 1000),
                steps: [{ title, status: "pending", order: 0 }]
            });
            if (!result?.success || !result.data) throw new Error("The skill could not be saved. Please retry.");
            setRoadmapSkills([...saved, result.data]);
            setSuccess(`${title} saved to Roadmap → Resume Skill Gaps.`);
        } catch (err) {
            setRoadmapError(err.message || "Could not add skill to roadmap.");
        } finally {
            roadmapSaveLock.current = false;
            setSavingSkill("");
        }
    };

    /* =====================================================
       MASTER CAREER ROLES
    ===================================================== */

    const roles = useMemo(
        () => ALL_CAREER_ROLES,
        []
    );


    /* =====================================================
       FETCH RESUME HISTORY
    ===================================================== */

    const fetchResumes = async () => {
        try {
            setError("");

            const response =
                await getResumes();

            setResumes(
                Array.isArray(response?.data)
                    ? response.data
                    : []
            );

        } catch (error) {

            console.error(
                "Get Resumes Error:",
                error
            );

            setError(
                error?.message ||
                "Unable to load resume history."
            );

        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchResumes();
    }, []);


    /* =====================================================
       FILE VALIDATION
    ===================================================== */

    const validateFile = (file) => {

        if (!file) {
            return false;
        }

        const allowedTypes = [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ];

        const extension =
            `.${file.name
                .split(".")
                .pop()
                .toLowerCase()}`;

        if (
            !allowedTypes.includes(file.type) &&
            ![".pdf", ".docx"].includes(
                extension
            )
        ) {
            setError(
                "Please upload a PDF or DOCX resume."
            );

            return false;
        }

        if (
            file.size >
            5 * 1024 * 1024
        ) {
            setError(
                "Resume must be smaller than 5 MB."
            );

            return false;
        }

        return true;
    };


    const selectFile = (file) => {

        if (!validateFile(file)) {
            setSelectedFile(null);
            return;
        }

        setError("");
        setSuccess("");
        setAnalysis(null);

        setSelectedFile(file);
    };


    const handleFileChange = (event) => {

        const file =
            event.target.files?.[0];

        if (file) {
            selectFile(file);
        }
    };


    const handleDrop = (event) => {

        event.preventDefault();

        setDragActive(false);

        const file =
            event.dataTransfer.files?.[0];

        if (file) {
            selectFile(file);
        }
    };


    /* =====================================================
       ANALYZE RESUME
    ===================================================== */

    const handleAnalyze = async () => {

        if (!selectedFile) {
            setError(
                "Upload your resume before starting the analysis."
            );
            return;
        }

        if (!targetRole.trim()) {
            setError(
                "Select the role you are targeting."
            );
            return;
        }

        try {

            setError("");
            setSuccess("");
            setAnalysis(null);
            setAnalyzing(true);

            const formData =
                new FormData();

            formData.append(
                "resume",
                selectedFile
            );

            formData.append(
                "targetRole",
                targetRole.trim()
            );

            if (
                jobDescription.trim()
            ) {
                formData.append(
                    "jobDescription",
                    jobDescription.trim()
                );
            }


            const token = getAuthToken();

            if (!token) {
                throw new Error(
                    "Your session has expired. Please login again."
                );
            }


            const response =
                await fetch(
                    `${API_BASE_URL}/resumes/analyze`,
                    {
                        method: "POST",

                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        },

                        body: formData
                    }
                );


            let result;

            try {
                result =
                    await response.json();
            } catch {
                throw new Error(
                    "The analysis server returned an invalid response."
                );
            }


            if (!response.ok) {
                throw new Error(
                    result?.message ||
                    result?.error ||
                    "Resume analysis failed."
                );
            }


            /* DOCUMENT VALIDATION */

            const validation =
                result?.data?.documentValidation ||
                result?.documentValidation;

            if (
                validation &&
                validation.valid === false
            ) {

                setAnalysis(null);

                setError(
                    safeText(
                        validation.message,
                        "This document could not be identified as a resume."
                    )
                );

                return;
            }


            /* ANALYSIS */

            const returnedAnalysis =
                result?.data?.analysis ||
                result?.analysis;

            if (
                !returnedAnalysis ||
                typeof returnedAnalysis !== "object"
            ) {
                throw new Error(
                    "The server did not return a valid resume analysis."
                );
            }


            setAnalysis(
                returnedAnalysis
            );

            setSuccess(
                "Resume analysis completed."
            );

            await fetchResumes();

        } catch (error) {

            console.error(
                "Resume Analysis Error:",
                error
            );

            setError(
                error?.message ||
                "Unable to analyze your resume."
            );

        } finally {

            setAnalyzing(false);
        }
    };


    /* =====================================================
       DELETE
    ===================================================== */

    const handleDelete = async (id) => {

        const confirmed =
            window.confirm(
                "Delete this resume analysis?"
            );

        if (!confirmed) {
            return;
        }

        try {

            setError("");
            setSuccess("");

            await deleteResume(id);

            setSuccess(
                "Resume removed successfully."
            );

            await fetchResumes();

        } catch (error) {

            setError(
                error?.message ||
                "Unable to delete the resume."
            );
        }
    };


    /* =====================================================
       LOADING
    ===================================================== */

    if (loading) {

        return (
            <div className="resume-page">

                <div className="resume-loading">

                    <div className="resume-loading-spinner" />

                    <span>
                        Loading Resume Intelligence...
                    </span>

                </div>

            </div>
        );
    }


    /* =====================================================
       ANALYSIS VALUES
    ===================================================== */

    const overallScore =
        getScore(
            analysis?.overallScore,
            analysis?.scores?.overall
        );


    const roleScore =
        getScore(
            analysis?.matchScore,
            analysis?.resumeMatch,
            analysis?.scores?.roleAlignment,
            analysis?.roleAlignment?.score
        );


    const atsScore =
        getScore(
            analysis?.atsScore,
            analysis?.scores?.atsCompatibility,
            analysis?.resumeQuality?.atsSafety?.score
        );


    const qualityScore =
        getScore(
            analysis?.resumeQuality?.score,
            analysis?.scores?.resumeQuality
        );


    const skillScore =
        getScore(
            analysis?.skillScore,
            analysis?.scores?.technicalSkills
        );


    const normalizedRole =
        safeText(
            analysis?.targetRole ||
            analysis?.normalizedRole ||
            targetRole,
            targetRole
        );


    const selectedCareer =
        getCareerByName(
            targetRole
        );


    const skillDetails =
        Array.isArray(
            analysis?.skillDetails
        )
            ? analysis.skillDetails
            : [];


    const matchedSkills =
        Array.isArray(
            analysis?.matchedSkills
        )
            ? analysis.matchedSkills
            : skillDetails.filter(
                (skill) =>
                    skill?.status ===
                        "demonstrated" ||
                    skill?.status ===
                        "supported"
            );


    const missingSkills =
        Array.isArray(
            analysis?.missingSkills
        )
            ? analysis.missingSkills
            : Array.isArray(
                analysis?.roleGaps
            )
                ? analysis.roleGaps
                : skillDetails.filter(
                    (skill) =>
                        skill?.status ===
                        "missing"
                );


    const strengths =
        Array.isArray(
            analysis?.strengths
        )
            ? analysis.strengths
            : [];


    const weakAreas =
        Array.isArray(
            analysis?.weakAreas
        )
            ? analysis.weakAreas
            : [];


    const recommendations =
        Array.isArray(
            analysis?.recommendations
        )
            ? analysis.recommendations
            : [];


    const evidenceReport =
        Array.isArray(
            analysis?.evidenceReport
        )
            ? analysis.evidenceReport
            : [];


    const health =
        analysis?.resumeHealth &&
        typeof analysis.resumeHealth === "object"
            ? analysis.resumeHealth
            : {};


    const displayedSkills =
        showAllSkills
            ? skillDetails
            : skillDetails.slice(
                0,
                8
            );


    const displayedRecommendations =
        showAllRecommendations
            ? recommendations
            : recommendations.slice(
                0,
                5
            );


    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <main className="resume-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <header className="resume-header">

                <div className="resume-header-content">

                    <span className="resume-eyebrow">
                        RESUME INTELLIGENCE
                    </span>

                    <h1>
                        Resume analysis
                    </h1>

                    <p>
                        Compare your resume with your target role, identify skill gaps,
                        and find practical ways to strengthen your application.
                    </p>

                </div>


                {analysis && (
                    <button
                        type="button"
                        className="resume-outline-button"
                        onClick={() => {
                            setAnalysis(null);
                            setError("");
                            setSuccess("");
                            setActiveTab(
                                "overview"
                            );
                        }}
                    >
                        New analysis
                    </button>
                )}

            </header>


            {/* =================================================
                ALERTS
            ================================================= */}

            {error && (
                <div className="resume-alert resume-alert-error" role="alert">

                    <div className="resume-alert-symbol">
                        !
                    </div>

                    <div>

                        <strong>
                            Analysis could not be completed
                        </strong>

                        <p>
                            {safeText(error)}
                        </p>

                    </div>

                    <button
                        type="button"
                        aria-label="Dismiss error"
                        onClick={() =>
                            setError("")
                        }
                    >
                        ×
                    </button>

                </div>
            )}


            {success && !error && (
                <div className="resume-alert resume-alert-success" role="status">

                    <span className="resume-success-icon">
                        ✓
                    </span>

                    <span>
                        {safeText(success)}
                    </span>

                </div>
            )}


            {/* =================================================
                INPUT
            ================================================= */}

            {!analysis && (

                <section className="resume-intake" aria-busy={analyzing}>

                    <div className="resume-intake-top">

                        <span>
                            START HERE
                        </span>

                        <h2>
                            Start your resume review
                        </h2>

                        <p>
                            Your target role determines
                            which skills, experience and
                            requirements we evaluate.
                        </p>

                    </div>


                    <div className="resume-intake-grid">

                        {/* RESUME UPLOAD */}

                        <div className="resume-panel">

                            <span className="resume-label" id="resume-file-label">
                                Your resume
                            </span>


                            <label
                                htmlFor="resume-upload"
                                className={
                                    `resume-dropzone ${
                                        dragActive
                                            ? "drag-active"
                                            : ""
                                    } ${
                                        selectedFile
                                            ? "has-file"
                                            : ""
                                    }`
                                }
                                onDragOver={(event) => {
                                    event.preventDefault();
                                    setDragActive(true);
                                }}
                                onDragLeave={() =>
                                    setDragActive(false)
                                }
                                onDrop={
                                    handleDrop
                                }
                            >

                                <input
                                    id="resume-upload"
                                    type="file"
                                    accept=".pdf,.docx"
                                    aria-label="Browse resume files"
                                    aria-describedby="resume-upload-instructions resume-upload-limits"
                                    onChange={
                                        handleFileChange
                                    }
                                />


                                {selectedFile ? (

                                    <div className="resume-selected-file">

                                        <div className="resume-file-badge">

                                            {selectedFile.name
                                                .toLowerCase()
                                                .endsWith(
                                                    ".pdf"
                                                )
                                                ? "PDF"
                                                : "DOCX"}

                                        </div>


                                        <div className="resume-file-details">

                                            <strong>
                                                {safeText(
                                                    selectedFile.name,
                                                    "Resume"
                                                )}
                                            </strong>

                                            <span>
                                                {(
                                                    selectedFile.size /
                                                    (
                                                        1024 *
                                                        1024
                                                    )
                                                ).toFixed(2)}
                                                {" "}MB
                                            </span>

                                        </div>


                                        <span className="resume-file-success">
                                            ✓
                                        </span>

                                    </div>

                                ) : (

                                    <div className="resume-upload-empty">

                                        <div className="resume-upload-icon" aria-hidden="true">
                                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4m-4 4 4-4 4 4M4 16v4h16v-4" /></svg>
                                        </div>

                                        <strong>Drag and drop your resume</strong>
                                        <span id="resume-upload-instructions">Choose a file from your device to get started.</span>
                                        <span className="resume-browse-action">Browse Files</span>

                                    </div>

                                )}

                                <small className="resume-upload-limits" id="resume-upload-limits">PDF or DOCX · Maximum 5 MB</small>
                                {selectedFile && <span id="resume-upload-instructions" className="resume-file-hint">Select this area to browse for a different file.</span>}
                            </label>


                            {selectedFile && (

                                <button
                                    type="button"
                                    className="resume-change-button"
                                    onClick={() =>
                                        setSelectedFile(
                                            null
                                        )
                                    }
                                >
                                    Choose another file
                                </button>

                            )}

                        </div>


                        {/* TARGET ROLE */}

                        <div className="resume-panel">

                            <label
                                htmlFor="target-role"
                                className="resume-label"
                            >
                                Target role
                            </label>


                            <select
                                id="target-role"
                                className="resume-role-select"
                                aria-describedby="resume-role-help"
                                value={targetRole}
                                onChange={(event) => {

                                    const value =
                                        event.target.value;

                                    setTargetRole(
                                        value
                                    );

                                    setError("");
                                    setSuccess("");
                                    setAnalysis(null);
                                }}
                            >

                                <option value="">
                                    Select your target role
                                </option>


                                {CAREER_CATEGORIES.map(
                                    (category) => (

                                        <optgroup
                                            key={
                                                category.id
                                            }
                                            label={
                                                `${category.icon} ${category.label}`
                                            }
                                        >

                                            {category.roles.map(
                                                (role) => (

                                                    <option
                                                        key={
                                                            role.id
                                                        }
                                                        value={
                                                            role.name
                                                        }
                                                    >
                                                        {
                                                            role.name
                                                        }
                                                    </option>

                                                )
                                            )}

                                        </optgroup>

                                    )
                                )}

                            </select>


                            {/* SELECTED ROLE INFORMATION */}

                            {selectedCareer && (

                                <div className="resume-selected-role">

                                    <strong>
                                        {selectedCareer.name}
                                    </strong>

                                    <span>
                                        {selectedCareer.category}
                                    </span>

                                    {selectedCareer.description && (
                                        <p>
                                            {
                                                selectedCareer.description
                                            }
                                        </p>
                                    )}

                                </div>

                            )}


                            <p className="resume-help-text" id="resume-role-help">
                                Select the specific role
                                you are preparing for.
                                Resume analysis will use
                                the requirements of that
                                career.
                            </p>


                            {/* JOB DESCRIPTION */}

                            <button
                                type="button"
                                className="resume-jd-toggle"
                                aria-expanded={showJobDescription}
                                aria-controls="resume-job-description-panel"
                                onClick={() =>
                                    setShowJobDescription(
                                        !showJobDescription
                                    )
                                }
                            >

                                <span>
                                    {showJobDescription
                                        ? "−"
                                        : "+"}
                                </span>

                                <span className="resume-jd-toggle-label">Job description</span>

                                <small>
                                    Optional
                                </small>

                            </button>


                            {showJobDescription && (

                                <div className="resume-jd-wrapper" id="resume-job-description-panel">
                                    <label className="resume-label" htmlFor="resume-job-description">Job description (optional)</label>

                                    <textarea
                                        id="resume-job-description"
                                        maxLength={20000}
                                        aria-describedby="resume-jd-help"
                                        value={
                                            jobDescription
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setJobDescription(
                                                event.target.value
                                            )
                                        }
                                        placeholder="Paste the job description here..."
                                        rows={7}
                                    />

                                    <small id="resume-jd-help">
                                        Matching covers recognizable, explicit skill requirements. Maximum 20,000 characters.
                                    </small>

                                </div>

                            )}

                        </div>

                    </div>


                    {/* ACTION */}

                    <div className="resume-intake-action" aria-live="polite">

                        <div>

                            <strong>
                                {selectedFile
                                    ? "Resume ready"
                                    : "Upload your resume"}
                            </strong>

                            <span>
                                {targetRole ||
                                    "Select your target role"}
                            </span>

                        </div>


                        <button
                            type="button"
                            className="resume-primary-button"
                            disabled={
                                analyzing ||
                                !selectedFile ||
                                !targetRole.trim()
                            }
                            onClick={
                                handleAnalyze
                            }
                        >

                            {analyzing
                                ? "Analyzing resume…"
                                : "Analyze Resume"}

                        </button>

                    </div>

                </section>

            )}


            {/* =================================================
                RESULTS
            ================================================= */}

            {analysis && (

                <section className="resume-results">

                    {/* RESULT HEADER */}

                    <div className="resume-result-header">

                        <div>

                            <span className="resume-eyebrow">
                                ANALYSIS COMPLETE
                            </span>

                            <h2>
                                Resume analysis
                            </h2>

                            <p>
                                {safeText(
                                    selectedFile?.name,
                                    "Resume"
                                )}

                                {" · "}

                                <strong>
                                    {normalizedRole}
                                </strong>
                            </p>

                        </div>


                        <button
                            type="button"
                            className="resume-outline-button"
                            onClick={() => {

                                setAnalysis(null);
                                setError("");
                                setSuccess("");
                                setActiveTab(
                                    "overview"
                                );

                            }}
                        >
                            Analyze another
                        </button>

                    </div>


                    {/* SCORE GRID */}

                    <div className="resume-score-grid">

                        <div className="resume-score-card main">

                            <span>
                                RESUME READINESS
                            </span>

                            <strong>
                                {overallScore ?? "—"}
                            </strong>

                            <small>
                                / 100
                            </small>

                            <p>
                                {getReadinessLabel(
                                    overallScore
                                )}
                            </p>

                        </div>


                        <div className="resume-score-card">

                            <span>
                                ROLE ALIGNMENT
                            </span>

                            <strong>
                                {roleScore ?? "—"}
                            </strong>

                            <small>
                                / 100
                            </small>

                            <p>
                                Target role fit
                            </p>

                        </div>


                        <div className="resume-score-card">

                            <span>
                                ATS COMPATIBILITY
                            </span>

                            <strong>
                                {atsScore ?? "—"}
                            </strong>

                            <small>
                                / 100
                            </small>

                            <p>
                                Resume structure
                            </p>

                        </div>


                        <div className="resume-score-card">

                            <span>
                                TECHNICAL SKILLS
                            </span>

                            <strong>
                                {skillScore ?? "—"}
                            </strong>

                            <small>
                                / 100
                            </small>

                            <p>
                                Role requirements
                            </p>

                        </div>

                    </div>


                    {/* READINESS */}

                    <div className="resume-readiness">

                        <div className="resume-readiness-number">
                            {overallScore ?? "—"}
                        </div>

                        <div>

                            <span>
                                JOB READINESS
                            </span>

                            <h3>
                                {getReadinessLabel(
                                    overallScore
                                )}
                            </h3>

                            <p>
                                {getRoleSummaryText(
                                    analysis?.roleSummary,
                                    normalizedRole
                                )}
                            </p>

                        </div>

                    </div>


                    {analysis?.jobDescriptionMatch && (
                        <section className="resume-card" aria-labelledby="jd-match-heading">
                            <div className="resume-card-header">
                                <div>
                                    <span>JOB DESCRIPTION</span>
                                    <h3 id="jd-match-heading">Job-description evidence coverage</h3>
                                    <p>{analysis.jobDescriptionMatch.explanation}</p>
                                </div>
                                <strong>{analysis.jobDescriptionMatch.available ? `${analysis.jobDescriptionMatch.score}%` : "Unavailable"}</strong>
                            </div>
                            {!analysis.jobDescriptionMatch.available && <p>{analysis.jobDescriptionMatch.reason}</p>}
                            <p>Required weight: 2; preferred or unspecified: 1. Evidence: demonstrated 100%, supported 70%, mentioned 25%, missing 0%.</p>
                            <p>Weighted evidence: {analysis.jobDescriptionMatch.numerator} / {analysis.jobDescriptionMatch.denominator}. Recognized requirements: {analysis.jobDescriptionMatch.counts.total}.</p>
                            <p>Matched: {analysis.jobDescriptionMatch.counts.matched} · Partially supported: {analysis.jobDescriptionMatch.counts.partiallySupported} · Mentioned only: {analysis.jobDescriptionMatch.counts.mentioned} · Not detected: {analysis.jobDescriptionMatch.counts.missing}</p>
                            <div className="resume-development-grid">
                                {analysis.jobDescriptionMatch.requirements.map((item) => (
                                    <article className="resume-development-card" key={item.skill}>
                                        <div><strong>{item.displayName}</strong><span>{item.importance} · {({ demonstrated: "Matched with practical evidence", supported: "Partially supported", mentioned: "Mentioned only", missing: "Not detected" })[item.status]}</span></div>
                                        <p>Requirement: {item.jobDescriptionExcerpts.join(" · ")}</p>
                                        <p>Resume evidence: {item.resumeExcerpt || "No positive evidence detected in extracted text."}</p>
                                    </article>
                                ))}
                            </div>
                            {analysis.jobDescriptionMatch.unassessed.map((item, index) => <p key={index}>Excluded: {item.excerpt} — {item.reason}</p>)}
                            {analysis.jobDescriptionMatch.limitations.map((item) => <p key={item}>{item}</p>)}
                        </section>
                    )}

                    {/* TABS */}

                    <div className="resume-tabs">

                        <button
                            type="button"
                            className={
                                activeTab ===
                                "overview"
                                    ? "active"
                                    : ""
                            }
                            onClick={() =>
                                setActiveTab(
                                    "overview"
                                )
                            }
                        >
                            Overview
                        </button>


                        <button
                            type="button"
                            className={
                                activeTab ===
                                "skills"
                                    ? "active"
                                    : ""
                            }
                            onClick={() =>
                                setActiveTab(
                                    "skills"
                                )
                            }
                        >
                            Skills & evidence
                        </button>


                        <button
                            type="button"
                            className={
                                activeTab ===
                                "improve"
                                    ? "active"
                                    : ""
                            }
                            onClick={() =>
                                setActiveTab(
                                    "improve"
                                )
                            }
                        >
                            Improvements
                        </button>

                    </div>


                    {/* =================================================
                        OVERVIEW
                    ================================================= */}

                    {activeTab === "overview" && (

                        <div className="resume-content">

                            <div className="resume-two-column">

                                {/* ROLE ALIGNMENT */}

                                <section className="resume-card">

                                    <div className="resume-card-header">

                                        <div>

                                            <span>
                                                ROLE ALIGNMENT
                                            </span>

                                            <h3>
                                                {normalizedRole}
                                            </h3>

                                        </div>

                                        <strong>
                                            {roleScore !==
                                            null
                                                ? `${roleScore}%`
                                                : "—"}
                                        </strong>

                                    </div>


                                    <div className="resume-progress">

                                        <div
                                            style={{
                                                width:
                                                    `${roleScore ?? 0}%`
                                            }}
                                        />

                                    </div>


                                    <div className="resume-mini-stats">

                                        <div>

                                            <span>
                                                Matched
                                            </span>

                                            <strong>
                                                {
                                                    matchedSkills.length
                                                }
                                            </strong>

                                        </div>


                                        <div>

                                            <span>
                                                Missing
                                            </span>

                                            <strong>
                                                {
                                                    missingSkills.length
                                                }
                                            </strong>

                                        </div>


                                        <div>

                                            <span>
                                                Skill score
                                            </span>

                                            <strong>
                                                {skillScore !==
                                                null
                                                    ? `${skillScore}%`
                                                    : "—"}
                                            </strong>

                                        </div>

                                    </div>

                                </section>


                                {/* HEALTH */}

                                <section className="resume-card">

                                    <div className="resume-card-header">

                                        <div>

                                            <span>
                                                RESUME HEALTH
                                            </span>

                                            <h3>
                                                Content quality
                                            </h3>

                                        </div>

                                        <strong>
                                            {qualityScore !==
                                            null
                                                ? `${qualityScore}%`
                                                : "—"}
                                        </strong>

                                    </div>


                                    <div className="resume-health">

                                        {[
                                            [
                                                "Contact",
                                                health.contact?.score
                                            ],
                                            [
                                                "Sections",
                                                health.sections?.score
                                            ],
                                            [
                                                "Experience",
                                                health.experience?.score
                                            ],
                                            [
                                                "Impact",
                                                health.metrics?.score
                                            ],
                                            [
                                                "Readability",
                                                health.readability?.score
                                            ]
                                        ].map(
                                            ([
                                                label,
                                                value
                                            ]) => {

                                                const score =
                                                    getScore(
                                                        value
                                                    );

                                                return (

                                                    <div
                                                        className="resume-health-row"
                                                        key={
                                                            label
                                                        }
                                                    >

                                                        <span>
                                                            {
                                                                label
                                                            }
                                                        </span>

                                                        <div className="resume-health-track">

                                                            <div
                                                                style={{
                                                                    width:
                                                                        `${score ?? 0}%`
                                                                }}
                                                            />

                                                        </div>

                                                        <strong>
                                                            {score !==
                                                            null
                                                                ? `${score}%`
                                                                : "—"}
                                                        </strong>

                                                    </div>

                                                );
                                            }
                                        )}

                                    </div>

                                </section>

                            </div>


                            {/* STRENGTHS + GAPS */}

                            <div className="resume-two-column">

                                <section className="resume-card">

                                    <div className="resume-card-header">

                                        <div>

                                            <span>
                                                STRENGTHS
                                            </span>

                                            <h3>
                                                What your resume
                                                does well
                                            </h3>

                                        </div>

                                    </div>


                                    <div className="resume-list">

                                        {strengths.length ===
                                        0 ? (

                                            <p className="resume-empty-text">
                                                No major
                                                strengths
                                                were returned.
                                            </p>

                                        ) : (

                                            strengths
                                                .slice(
                                                    0,
                                                    6
                                                )
                                                .map(
                                                    (
                                                        item,
                                                        index
                                                    ) => (

                                                        <div
                                                            className="resume-list-item"
                                                            key={
                                                                index
                                                            }
                                                        >

                                                            <span className="resume-check">
                                                                ✓
                                                            </span>

                                                            <div>

                                                                <strong>
                                                                    {
                                                                        getItemTitle(
                                                                            item
                                                                        )
                                                                    }
                                                                </strong>

                                                                {getItemDetail(
                                                                    item
                                                                ) && (

                                                                    <p>
                                                                        {
                                                                            getItemDetail(
                                                                                item
                                                                            )
                                                                        }
                                                                    </p>

                                                                )}

                                                            </div>

                                                        </div>

                                                    )
                                                )

                                        )}

                                    </div>

                                </section>


                                <section className="resume-card">

                                    <div className="resume-card-header">

                                        <div>

                                            <span>
                                                GAPS
                                            </span>

                                            <h3>
                                                What needs
                                                attention
                                            </h3>

                                        </div>

                                    </div>


                                    <div className="resume-list">

                                        {missingSkills.length ===
                                        0 ? (

                                            <p className="resume-empty-text">
                                                No major
                                                skill gaps
                                                were
                                                identified.
                                            </p>

                                        ) : (

                                            missingSkills
                                                .slice(
                                                    0,
                                                    6
                                                )
                                                .map(
                                                    (
                                                        item,
                                                        index
                                                    ) => (

                                                        <div
                                                            className="resume-list-item"
                                                            key={
                                                                index
                                                            }
                                                        >

                                                            <span className="resume-warning">
                                                                !
                                                            </span>

                                                            <div>

                                                                <strong>
                                                                    {
                                                                        getItemTitle(
                                                                            item
                                                                        )
                                                                    }
                                                                </strong>

                                                                {getItemDetail(
                                                                    item
                                                                ) && (

                                                                    <p>
                                                                        {
                                                                            getItemDetail(
                                                                                item
                                                                            )
                                                                        }
                                                                    </p>

                                                                )}

                                                            </div>

                                                        </div>

                                                    )
                                                )

                                        )}

                                    </div>

                                </section>

                            </div>


                            {/* NEXT STEPS */}

                            <section className="resume-card">

                                <div className="resume-card-header">

                                    <div>

                                        <span>
                                            NEXT STEPS
                                        </span>

                                        <h3>
                                            Priority
                                            improvements
                                        </h3>

                                    </div>

                                    <button
                                        type="button"
                                        className="resume-text-button"
                                        onClick={() =>
                                            setActiveTab(
                                                "improve"
                                            )
                                        }
                                    >
                                        View all →
                                    </button>

                                </div>


                                <div className="resume-priority-list">

                                    {recommendations.length ===
                                    0 ? (

                                        <div className="resume-empty-state">
                                            No recommendations
                                            were returned.
                                        </div>

                                    ) : (

                                        recommendations
                                            .slice(
                                                0,
                                                4
                                            )
                                            .map(
                                                (
                                                    item,
                                                    index
                                                ) => (

                                                    <div
                                                        className="resume-priority-row"
                                                        key={
                                                            index
                                                        }
                                                    >

                                                        <span>
                                                            {String(
                                                                index +
                                                                    1
                                                            ).padStart(
                                                                2,
                                                                "0"
                                                            )}
                                                        </span>

                                                        <div>

                                                            <strong>
                                                                {
                                                                    getItemTitle(
                                                                        item
                                                                    )
                                                                }
                                                            </strong>

                                                            {getItemDetail(
                                                                item
                                                            ) && (

                                                                <p>
                                                                    {
                                                                        getItemDetail(
                                                                            item
                                                                        )
                                                                    }
                                                                </p>

                                                            )}

                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setActiveTab(
                                                                    "improve"
                                                                )
                                                            }
                                                        >
                                                            Review
                                                        </button>

                                                    </div>

                                                )
                                            )

                                    )}

                                </div>

                            </section>

                        </div>

                    )}


                    {/* =================================================
                        SKILLS
                    ================================================= */}

                    {activeTab === "skills" && (

                        <div className="resume-content">

                            <section className="resume-card">

                                <div className="resume-card-header">

                                    <div>

                                        <span>
                                            SKILL INTELLIGENCE
                                        </span>

                                        <h3>
                                            Skills for{" "}
                                            {
                                                normalizedRole
                                            }
                                        </h3>

                                        <p>
                                            Skills are
                                            classified
                                            using evidence
                                            found in your
                                            resume.
                                        </p>

                                    </div>

                                </div>


                                {displayedSkills.length ===
                                0 ? (

                                    <div className="resume-empty-state">
                                        No detailed skill
                                        evidence is
                                        available.
                                    </div>

                                ) : (

                                    <div className="resume-skill-table">

                                        <div className="resume-skill-header">

                                            <span>
                                                Skill
                                            </span>

                                            <span>
                                                Status
                                            </span>

                                            <span>
                                                Evidence
                                            </span>

                                        </div>


                                        {displayedSkills.map(
                                            (
                                                skill,
                                                index
                                            ) => {

                                                const name =
                                                    safeText(
                                                        skill?.skill ||
                                                        skill?.name ||
                                                        skill?.title ||
                                                        skill,
                                                        "Unknown skill"
                                                    );

                                                const status =
                                                    safeText(
                                                        skill?.status ||
                                                        skill?.level ||
                                                        "reviewed"
                                                    );

                                                const evidence =
                                                    safeText(
                                                        skill?.evidence ||
                                                        skill?.detail ||
                                                        skill?.source,
                                                        ""
                                                    );

                                                return (

                                                    <div
                                                        className="resume-skill-row"
                                                        key={`${name}-${index}`}
                                                    >

                                                        <strong>
                                                            {
                                                                name
                                                            }
                                                        </strong>

                                                        <span
                                                            className={
                                                                `resume-status ${getStatusClass(
                                                                    status
                                                                )}`
                                                            }
                                                        >
                                                            {getStatusLabel(
                                                                status
                                                            )}
                                                        </span>

                                                        <p>
                                                            {evidence ||
                                                                "No detailed evidence returned."}
                                                        </p>

                                                    </div>

                                                );
                                            }
                                        )}

                                    </div>

                                )}


                                {skillDetails.length >
                                    8 && (

                                    <button
                                        type="button"
                                        className="resume-show-more"
                                        onClick={() =>
                                            setShowAllSkills(
                                                !showAllSkills
                                            )
                                        }
                                    >
                                        {showAllSkills
                                            ? "Show less"
                                            : `Show all ${skillDetails.length} skills`}
                                    </button>

                                )}

                            </section>


                            {/* DEVELOPMENT */}

                            <section className="resume-card">

                                <div className="resume-card-header">

                                    <div>

                                        <span>
                                            DEVELOPMENT
                                        </span>

                                        <h3>
                                            Skills to develop
                                        </h3>

                                        <p>
                                            Save missing skills to the separate Resume Skill Gaps section on your Roadmap.
                                        </p>

                                    </div>

                                </div>


                                {roadmapLoading && <p role="status">Checking saved roadmap skills…</p>}
                                {roadmapError && <p className="resume-roadmap-error" role="alert">{roadmapError} <button type="button" onClick={loadResumeSkills} disabled={Boolean(savingSkill)}>Retry loading</button></p>}

                                <div className="resume-development-grid">

                                    {missingSkills.length ===
                                    0 ? (

                                        <div className="resume-empty-state">
                                            No missing skills
                                            were identified.
                                        </div>

                                    ) : (

                                        missingSkills
                                            .slice(
                                                0,
                                                8
                                            )
                                            .map(
                                                (
                                                    item,
                                                    index
                                                ) => (

                                                    <article
                                                        className="resume-development-card"
                                                        key={
                                                            index
                                                        }
                                                    >

                                                        <div>

                                                            <strong>
                                                                {
                                                                    getItemTitle(
                                                                        item
                                                                    )
                                                                }
                                                            </strong>

                                                            <span>
                                                                Gap
                                                            </span>

                                                        </div>

                                                        <p>
                                                            {
                                                                getItemDetail(
                                                                    item
                                                                ) ||
                                                                "This skill was not sufficiently demonstrated in the resume."
                                                            }
                                                        </p>

                                                        <button
                                                            type="button"
                                                            disabled={roadmapLoading || Boolean(savingSkill) || roadmapSkills.some((record) => skillKey(record.title) === skillKey(getItemTitle(item)))}
                                                            onClick={() => addResumeSkill(item)}
                                                        >
                                                            {savingSkill === skillKey(getItemTitle(item)) ? "Saving…" : roadmapSkills.some((record) => skillKey(record.title) === skillKey(getItemTitle(item))) ? "Already added ✓" : "Add to roadmap →"}
                                                        </button>

                                                    </article>

                                                )
                                            )

                                    )}

                                </div>

                            </section>


                            {/* EVIDENCE */}

                            <section className="resume-card">

                                <div className="resume-card-header">

                                    <div>

                                        <span>
                                            EVIDENCE
                                        </span>

                                        <h3>
                                            Why these results
                                            were produced
                                        </h3>

                                    </div>

                                </div>


                                <div className="resume-evidence">

                                    {evidenceReport.length ===
                                    0 ? (

                                        <div className="resume-empty-state">
                                            Detailed evidence
                                            will appear here
                                            when returned by
                                            the analysis
                                            engine.
                                        </div>

                                    ) : (

                                        evidenceReport
                                            .slice(
                                                0,
                                                10
                                            )
                                            .map(
                                                (
                                                    item,
                                                    index
                                                ) => (

                                                    <div
                                                        className="resume-evidence-row"
                                                        key={
                                                            index
                                                        }
                                                    >

                                                        <div>

                                                            <strong>
                                                                {
                                                                    getItemTitle(
                                                                        item
                                                                    )
                                                                }
                                                            </strong>

                                                            <p>
                                                                {
                                                                    getItemDetail(
                                                                        item
                                                                    )
                                                                }
                                                            </p>

                                                        </div>

                                                        {item?.source && (

                                                            <span>
                                                                {safeText(
                                                                    item.source
                                                                )}
                                                            </span>

                                                        )}

                                                    </div>

                                                )
                                            )

                                    )}

                                </div>

                            </section>

                        </div>

                    )}


                    {/* =================================================
                        IMPROVEMENTS
                    ================================================= */}

                    {activeTab === "improve" && (

                        <div className="resume-content">

                            <section className="resume-card">

                                <div className="resume-card-header">

                                    <div>

                                        <span>
                                            IMPROVEMENT PLAN
                                        </span>

                                        <h3>
                                            What should you
                                            change?
                                        </h3>

                                        <p>
                                            Improve the resume
                                            using information
                                            supported by your
                                            experience.
                                        </p>

                                    </div>

                                </div>


                                <div className="resume-action-list">

                                    {displayedRecommendations.length ===
                                    0 ? (

                                        <div className="resume-empty-state">
                                            No recommendations
                                            were returned.
                                        </div>

                                    ) : (

                                        displayedRecommendations.map(
                                            (
                                                item,
                                                index
                                            ) => (

                                                <div
                                                    className="resume-action-row"
                                                    key={
                                                        index
                                                    }
                                                >

                                                    <div className="resume-action-number">
                                                        {String(
                                                            index +
                                                                1
                                                        ).padStart(
                                                            2,
                                                            "0"
                                                        )}
                                                    </div>

                                                    <div>

                                                        <strong>
                                                            {
                                                                getItemTitle(
                                                                    item
                                                                )
                                                            }
                                                        </strong>

                                                        {getItemDetail(
                                                            item
                                                        ) && (

                                                            <p>
                                                                {
                                                                    getItemDetail(
                                                                        item
                                                                    )
                                                                }
                                                            </p>

                                                        )}

                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setSuccess(
                                                                "This improvement is ready to connect to your resume builder."
                                                            )
                                                        }
                                                    >
                                                        Review
                                                    </button>

                                                </div>

                                            )
                                        )

                                    )}

                                </div>


                                {recommendations.length >
                                    5 && (

                                    <button
                                        type="button"
                                        className="resume-show-more"
                                        onClick={() =>
                                            setShowAllRecommendations(
                                                !showAllRecommendations
                                            )
                                        }
                                    >
                                        {showAllRecommendations
                                            ? "Show less"
                                            : `Show all ${recommendations.length} recommendations`}
                                    </button>

                                )}

                            </section>


                            {/* WEAK AREAS */}

                            <section className="resume-card">

                                <div className="resume-card-header">

                                    <div>

                                        <span>
                                            WEAK AREAS
                                        </span>

                                        <h3>
                                            Focus areas
                                        </h3>

                                    </div>

                                </div>


                                {weakAreas.length ===
                                0 ? (

                                    <div className="resume-empty-state">
                                        No weak areas were
                                        returned by the
                                        analysis.
                                    </div>

                                ) : (

                                    <div className="resume-list">

                                        {weakAreas
                                            .slice(
                                                0,
                                                8
                                            )
                                            .map(
                                                (
                                                    item,
                                                    index
                                                ) => (

                                                    <div
                                                        className="resume-list-item"
                                                        key={
                                                            index
                                                        }
                                                    >

                                                        <span className="resume-warning">
                                                            !
                                                        </span>

                                                        <div>

                                                            <strong>
                                                                {
                                                                    getItemTitle(
                                                                        item
                                                                    )
                                                                }
                                                            </strong>

                                                            {getItemDetail(
                                                                item
                                                            ) && (

                                                                <p>
                                                                    {
                                                                        getItemDetail(
                                                                            item
                                                                        )
                                                                    }
                                                                </p>

                                                            )}

                                                        </div>

                                                    </div>

                                                )
                                            )}

                                    </div>

                                )}

                            </section>

                        </div>

                    )}

                </section>

            )}


            {/* =================================================
                RESUME HISTORY
            ================================================= */}

            {!analysis && resumes.length > 0 && (

                <section className="resume-history">

                    <div className="resume-card">

                        <div className="resume-card-header">

                            <div>

                                <span>
                                    HISTORY
                                </span>

                                <h3>
                                    Previous resume analyses
                                </h3>

                            </div>

                        </div>


                        <div className="resume-history-list">

                            {resumes.map(
                                (resume, index) => {

                                    const id =
                                        resume?._id ||
                                        resume?.id;

                                    const role =
                                        safeText(
                                            resume?.targetRole ||
                                            resume?.role ||
                                            resume?.analysis?.targetRole,
                                            "Unknown role"
                                        );

                                    const fileName =
                                        safeText(
                                            resume?.fileName ||
                                            resume?.originalName ||
                                            resume?.name,
                                            "Resume"
                                        );

                                    const score =
                                        getScore(
                                            resume?.overallScore,
                                            resume?.analysis?.overallScore,
                                            resume?.analysis?.scores?.overall
                                        );

                                    return (

                                        <div
                                            className="resume-history-row"
                                            key={
                                                id ||
                                                index
                                            }
                                        >

                                            <div>

                                                <strong>
                                                    {fileName}
                                                </strong>

                                                <span>
                                                    {role}
                                                </span>

                                            </div>


                                            <div>

                                                <strong>
                                                    {score !==
                                                    null
                                                        ? `${score}/100`
                                                        : "—"}
                                                </strong>

                                            </div>


                                            {id && (

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleDelete(
                                                            id
                                                        )
                                                    }
                                                >
                                                    Delete
                                                </button>

                                            )}

                                        </div>

                                    );
                                }
                            )}

                        </div>

                    </div>

                </section>

            )}

        </main>
    );
};


export default function ResumeDesktopCanvas() {
    return (
        <div className="resume-desktop-scroll" role="region" aria-label="Resume page. Scroll horizontally to view all content on narrow screens." tabIndex={0}>
            <div className="resume-desktop-canvas">
                <Resume />
            </div>
        </div>
    );
}
