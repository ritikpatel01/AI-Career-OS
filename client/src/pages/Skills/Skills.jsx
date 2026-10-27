import { useEffect, useState } from "react";

import {
    getSkills,
    createSkill,
    updateSkill,
    deleteSkill
} from "../../services/skillService";

import {
    getSkillEvidence,
    createSkillEvidence,
    updateSkillEvidence,
    deleteSkillEvidence
} from "../../services/skillEvidenceService";

import "./Skills.css";

const emptySkillForm = {
    name: "",
    category: "",
    level: "beginner",
    progress: 0
};

const emptyEvidenceForm = {
    title: "",
    type: "project",
    url: "",
    description: ""
};

const evidenceTypes = [
    { value: "project", label: "Project" },
    { value: "github", label: "GitHub repository" },
    { value: "assessment", label: "Assessment" },
    { value: "interview", label: "Interview result" },
    { value: "certificate", label: "Certificate" },
    { value: "other", label: "Other" }
];

const Skills = () => {
    const [skills, setSkills] = useState([]);

    const [formData, setFormData] =
        useState(emptySkillForm);

    const [editingId, setEditingId] = useState(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [expandedSkillId, setExpandedSkillId] =
        useState(null);

    const [evidenceBySkill, setEvidenceBySkill] =
        useState({});

    const [loadingEvidenceFor, setLoadingEvidenceFor] =
        useState(null);

    const [evidenceFormSkillId, setEvidenceFormSkillId] =
        useState(null);

    const [evidenceForm, setEvidenceForm] =
        useState(emptyEvidenceForm);

    const [editingEvidenceId, setEditingEvidenceId] =
        useState(null);

    const [savingEvidence, setSavingEvidence] =
        useState(false);

    /* =====================================
       FETCH SKILLS
    ===================================== */

    const fetchSkills = async () => {
        try {
            setError("");

            const response = await getSkills();

            setSkills(
                Array.isArray(response.data)
                    ? response.data
                    : []
            );
        } catch (error) {
            setError(
                error.message || "Failed to load skills."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSkills();
    }, []);

    /* =====================================
       AUTO-DISMISS FEEDBACK
    ===================================== */

    useEffect(() => {
        if (!error && !success) {
            return undefined;
        }

        const timer = window.setTimeout(() => {
            setError("");
            setSuccess("");
        }, 5000);

        return () => window.clearTimeout(timer);
    }, [error, success]);

    /* =====================================
       CALCULATED OVERVIEW
    ===================================== */

    const totalSkills = skills.length;

    const skillsInProgress = skills.filter((skill) => {
        const progress = Math.min(
            100,
            Math.max(0, Number(skill.progress) || 0)
        );

        return progress > 0 && progress < 100;
    }).length;

    const averageProgress = totalSkills
        ? Math.round(
            skills.reduce(
                (total, skill) =>
                    total +
                    Math.min(
                        100,
                        Math.max(
                            0,
                            Number(skill.progress) || 0
                        )
                    ),
                0
            ) / totalSkills
        )
        : 0;

    /* =====================================
       SKILL FORM
    ===================================== */

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const resetSkillForm = () => {
        setFormData({ ...emptySkillForm });
        setEditingId(null);
    };

    const handleSkillSubmit = async (event) => {
        event.preventDefault();

        if (saving) return;

        if (!formData.name.trim()) {
            setError("Please enter a skill name.");
            setSuccess("");
            return;
        }

        try {
            setError("");
            setSuccess("");
            setSaving(true);

            const skillData = {
                name: formData.name.trim(),
                category: formData.category.trim(),
                level: formData.level,
                progress: Number(formData.progress)
            };

            if (editingId) {
                await updateSkill(editingId, skillData);

                setSuccess("Skill updated successfully.");
            } else {
                await createSkill(skillData);

                setSuccess("Skill added successfully.");
            }

            resetSkillForm();
            await fetchSkills();
        } catch (error) {
            setError(
                error.message || "Failed to save skill."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleEditSkill = (skill) => {
        setFormData({
            name: skill.name || "",
            category: skill.category || "",
            level: skill.level || "beginner",
            progress: Math.min(
                100,
                Math.max(0, Number(skill.progress) || 0)
            )
        });

        setEditingId(skill._id);
        setError("");
        setSuccess("");

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    const handleDeleteSkill = async (id) => {
        const confirmed = window.confirm(
            "Delete this skill? Its linked evidence will also become inaccessible through this skill."
        );

        if (!confirmed) return;

        try {
            setError("");
            setSuccess("");

            await deleteSkill(id);

            setEvidenceBySkill((previous) => {
                const next = { ...previous };
                delete next[id];
                return next;
            });

            if (editingId === id) {
                resetSkillForm();
            }

            if (expandedSkillId === id) {
                setExpandedSkillId(null);
            }

            if (evidenceFormSkillId === id) {
                resetEvidenceForm();
            }

            setSuccess("Skill deleted successfully.");
            await fetchSkills();
        } catch (error) {
            setError(
                error.message || "Failed to delete skill."
            );
        }
    };

    const getLevelLabel = (level) => {
        const normalized = String(level || "beginner");

        return normalized.charAt(0).toUpperCase()
            + normalized.slice(1);
    };

    /* =====================================
       EVIDENCE FORM
    ===================================== */

    const resetEvidenceForm = () => {
        setEvidenceForm({ ...emptyEvidenceForm });
        setEvidenceFormSkillId(null);
        setEditingEvidenceId(null);
    };

    const handleEvidenceChange = (event) => {
        const { name, value } = event.target;

        setEvidenceForm((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const loadSkillEvidence = async (skillId) => {
        setLoadingEvidenceFor(skillId);
        setError("");

        try {
            const response = await getSkillEvidence(skillId);

            setEvidenceBySkill((previous) => ({
                ...previous,
                [skillId]: Array.isArray(response.data)
                    ? response.data
                    : []
            }));
        } catch (error) {
            setError(
                error.message || "Failed to load skill evidence."
            );
        } finally {
            setLoadingEvidenceFor(null);
        }
    };

    const toggleEvidence = async (skillId) => {
        if (expandedSkillId === skillId) {
            setExpandedSkillId(null);

            if (evidenceFormSkillId === skillId) {
                resetEvidenceForm();
            }

            return;
        }

        setExpandedSkillId(skillId);
        resetEvidenceForm();

        await loadSkillEvidence(skillId);
    };

    const openEvidenceForm = (skillId) => {
        setEvidenceForm({ ...emptyEvidenceForm });
        setEditingEvidenceId(null);
        setEvidenceFormSkillId(skillId);

        setError("");
        setSuccess("");
    };

    const handleEvidenceSubmit = async (event) => {
        event.preventDefault();

        if (savingEvidence || !evidenceFormSkillId) {
            return;
        }

        if (!evidenceForm.title.trim()) {
            setError("Enter a title for your evidence.");
            return;
        }

        const cleanUrl = evidenceForm.url.trim();

        if (cleanUrl) {
            try {
                const parsedUrl = new URL(cleanUrl);

                if (
                    parsedUrl.protocol !== "https:" &&
                    parsedUrl.protocol !== "http:"
                ) {
                    throw new Error("Unsupported URL scheme.");
                }
            } catch {
                setError(
                    "Enter a valid HTTP or HTTPS evidence URL."
                );
                return;
            }
        }

        const skillId = evidenceFormSkillId;

        const evidenceData = {
            title: evidenceForm.title.trim(),
            type: evidenceForm.type,
            url: cleanUrl,
            description: evidenceForm.description.trim()
        };

        try {
            setError("");
            setSuccess("");
            setSavingEvidence(true);

            if (editingEvidenceId) {
                await updateSkillEvidence(
                    skillId,
                    editingEvidenceId,
                    evidenceData
                );

                setSuccess("Evidence updated successfully.");
            } else {
                await createSkillEvidence(
                    skillId,
                    evidenceData
                );

                setSuccess("Evidence added successfully.");
            }

            resetEvidenceForm();
            await loadSkillEvidence(skillId);
        } catch (error) {
            setError(
                error.message || "Failed to save evidence."
            );
        } finally {
            setSavingEvidence(false);
        }
    };

    const handleEditEvidence = (skillId, evidence) => {
        setExpandedSkillId(skillId);
        setEvidenceFormSkillId(skillId);

        setEditingEvidenceId(evidence._id);

        setEvidenceForm({
            title: evidence.title || "",
            type: evidence.type || "other",
            url: evidence.url || "",
            description: evidence.description || ""
        });

        setError("");
        setSuccess("");
    };

    const handleDeleteEvidence = async (
        skillId,
        evidenceId
    ) => {
        const confirmed = window.confirm(
            "Delete this evidence record?"
        );

        if (!confirmed) return;

        try {
            setError("");
            setSuccess("");

            await deleteSkillEvidence(
                skillId,
                evidenceId
            );

            if (editingEvidenceId === evidenceId) {
                resetEvidenceForm();
            }

            setSuccess("Evidence deleted successfully.");

            await loadSkillEvidence(skillId);
        } catch (error) {
            setError(
                error.message || "Failed to delete evidence."
            );
        }
    };

    const getEvidenceTypeLabel = (type) => {
        return evidenceTypes.find(
            (item) => item.value === type
        )?.label || "Other";
    };

    const getVerificationLabel = (status) => {
        const labels = {
            unverified: "Unverified",
            "under-review": "Under review",
            verified: "Verified",
            rejected: "Rejected"
        };

        return labels[status] || "Unverified";
    };

    /* =====================================
       LOADING
    ===================================== */

    if (loading) {
        return (
            <div className="skills-page">
                <div className="skills-loading">
                    <div className="skills-loading-icon">
                        🧠
                    </div>

                    <h2>Loading your skills...</h2>

                    <p>Preparing your skill profile.</p>
                </div>
            </div>
        );
    }

    /* =====================================
       MAIN PAGE
    ===================================== */

    return (
        <div className="skills-page">

            <div className="skills-page-header">
                <span className="skills-eyebrow">
                    SKILL DEVELOPMENT
                </span>

                <h1>My Skills</h1>

                <p>
                    Track your technical skills, proficiency
                    levels, learning progress, and evidence.
                </p>
            </div>

            {/* FEEDBACK */}

            {error && (
                <div
                    className="skills-message skills-error"
                    role="alert"
                    aria-live="assertive"
                >
                    {error}
                </div>
            )}

            {success && (
                <div
                    className="skills-message skills-success"
                    role="status"
                    aria-live="polite"
                >
                    {success}
                </div>
            )}

            {/* OVERVIEW */}

            <section className="skills-progress-summary" aria-labelledby="skills-summary-heading">
                <div className="skills-progress-summary-heading">
                    <span className="skills-summary-kicker">YOUR PROGRESS</span>
                    <h2 id="skills-summary-heading">Average Skills Progress</h2>
                    <p>Average learning-plan completion across your saved skills.</p>
                </div>
                <strong className="skills-summary-percentage">{averageProgress}%</strong>
                <dl className="skills-summary-metrics">
                    <div><dt>Total Skills</dt><dd>{totalSkills}</dd></div>
                    <div><dt>In Progress</dt><dd>{skillsInProgress}</dd></div>
                    <div><dt>Average Progress</dt><dd>{averageProgress}%</dd></div>
                </dl>
                <div className="skills-summary-track" role="progressbar" aria-label="Average skills progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={averageProgress}>
                    <div className="skills-summary-fill" style={{ width: `${averageProgress}%` }} />
                </div>
            </section>

            {/* ADD / EDIT SKILL */}

            <section className="skills-card">
                <div className="skills-section-header">
                    <div className="skills-section-icon">
                        🧠
                    </div>

                    <div>
                        <h2>
                            {editingId ? "Edit Skill" : "Add New Skill"}
                        </h2>

                        <p>
                            Record your proficiency and learning
                            progress separately.
                        </p>
                    </div>
                </div>

                <form
                    className="skills-form"
                    onSubmit={handleSkillSubmit}
                >
                    <div className="skills-grid">
                        <div className="skills-field">
                            <label htmlFor="skill-name">
                                Skill Name
                            </label>

                            <input
                                id="skill-name"
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g. JavaScript"
                                maxLength={100}
                                required
                            />
                        </div>

                        <div className="skills-field">
                            <label htmlFor="skill-category">
                                Category
                            </label>

                            <input
                                id="skill-category"
                                type="text"
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                placeholder="e.g. Programming"
                                maxLength={100}
                            />
                        </div>
                    </div>

                    <div className="skills-grid">
                        <div className="skills-field">
                            <label htmlFor="skill-level">
                                Skill Level
                            </label>

                            <select
                                id="skill-level"
                                name="level"
                                value={formData.level}
                                onChange={handleChange}
                            >
                                <option value="beginner">
                                    Beginner
                                </option>

                                <option value="intermediate">
                                    Intermediate
                                </option>

                                <option value="advanced">
                                    Advanced
                                </option>

                                <option value="expert">
                                    Expert
                                </option>
                            </select>
                        </div>

                        <div className="skills-field">
                            <label htmlFor="skill-progress">
                                Learning Plan Progress
                            </label>

                            <div className="skills-progress-input">
                                <input
                                    id="skill-progress"
                                    type="range"
                                    name="progress"
                                    min="0"
                                    max="100"
                                    step="1"
                                    value={formData.progress}
                                    onChange={handleChange}
                                />

                                <span>
                                    {formData.progress}%
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="skills-form-actions">
                        {editingId && (
                            <button
                                type="button"
                                className="skills-cancel-button"
                                onClick={resetSkillForm}
                                disabled={saving}
                            >
                                Cancel
                            </button>
                        )}

                        <button
                            type="submit"
                            className="skills-save-button"
                            disabled={saving}
                        >
                            {saving
                                ? "Saving..."
                                : editingId
                                ? "Update Skill"
                                : "Add Skill"}
                        </button>
                    </div>
                </form>
            </section>

            {/* SAVED SKILLS */}

            <section className="skills-card">
                <div className="skills-section-header">
                    <div className="skills-section-icon">
                        📊
                    </div>

                    <div>
                        <h2>Your Skills</h2>

                        <p>
                            Manage skills and attach supporting
                            evidence to each one.
                        </p>
                    </div>
                </div>

                {skills.length === 0 ? (
                    <div className="skills-empty">
                        <div className="skills-empty-icon">
                            🧠
                        </div>

                        <h3>No skills added yet</h3>

                        <p>
                            Add your first skill above to start
                            tracking your development.
                        </p>
                    </div>
                ) : (
                    <div className="skills-list">
                        {skills.map((skill) => {
                            const progress = Math.min(
                                100,
                                Math.max(
                                    0,
                                    Number(skill.progress) || 0
                                )
                            );

                            const isExpanded =
                                expandedSkillId === skill._id;

                            const skillEvidence =
                                evidenceBySkill[skill._id] || [];

                            return (
                                <article
                                    className="skill-item"
                                    key={skill._id}
                                >
                                    <div className="skill-item-header">
                                        <div>
                                            <span className="skill-category">
                                                {skill.category || "General"}
                                            </span>

                                            <h3>{skill.name}</h3>
                                        </div>

                                        <span
                                            className={
                                                `skill-level skill-level-${skill.level || "beginner"}`
                                            }
                                        >
                                            {getLevelLabel(skill.level)}
                                        </span>
                                    </div>

                                    <div className="skill-progress-header">
                                        <span>
                                            Learning Plan Progress
                                        </span>

                                        <strong>
                                            {progress}%
                                        </strong>
                                    </div>

                                    <div
                                        className="skill-progress-bar"
                                        role="progressbar"
                                        aria-label={`${skill.name} learning progress`}
                                        aria-valuemin={0}
                                        aria-valuemax={100}
                                        aria-valuenow={progress}
                                    >
                                        <div
                                            className="skill-progress-fill"
                                            style={{
                                                width: `${progress}%`
                                            }}
                                        />
                                    </div>

                                    <div className="skill-actions">
                                        <button
                                            type="button"
                                            className="skill-edit-button"
                                            onClick={() =>
                                                handleEditSkill(skill)
                                            }
                                        >
                                            Edit Skill
                                        </button>

                                        <button
                                            type="button"
                                            className="skill-delete-button"
                                            onClick={() =>
                                                handleDeleteSkill(skill._id)
                                            }
                                        >
                                            Delete
                                        </button>
                                    </div>

                                    {/* EVIDENCE TOGGLE */}

                                    <div className="skill-evidence-toggle-row">
                                        <button
                                            type="button"
                                            className="skill-evidence-toggle"
                                            aria-expanded={isExpanded}
                                            onClick={() =>
                                                toggleEvidence(skill._id)
                                            }
                                        >
                                            {isExpanded
                                                ? "Hide Evidence"
                                                : `Skill Evidence (${skillEvidence.length})`
                                            }

                                            <span aria-hidden="true">
                                                {isExpanded ? "−" : "+"}
                                            </span>
                                        </button>
                                    </div>

                                    {/* EVIDENCE PANEL */}

                                    {isExpanded && (
                                        <div className="skill-evidence-panel">
                                            <div className="skill-evidence-header">
                                                <div>
                                                    <h4>
                                                        Evidence for {skill.name}
                                                    </h4>

                                                    <p>
                                                        Attach work or assessments
                                                        that support this skill.
                                                    </p>
                                                </div>

                                                {evidenceFormSkillId !== skill._id && (
                                                    <button
                                                        type="button"
                                                        className="skills-save-button"
                                                        onClick={() =>
                                                            openEvidenceForm(skill._id)
                                                        }
                                                    >
                                                        + Add Evidence
                                                    </button>
                                                )}
                                            </div>

                                            {loadingEvidenceFor === skill._id ? (
                                                <p className="skill-evidence-muted">
                                                    Loading evidence...
                                                </p>
                                            ) : skillEvidence.length === 0 ? (
                                                <div className="skill-evidence-empty">
                                                    <strong>
                                                        No evidence added yet
                                                    </strong>

                                                    <p>
                                                        Add a project, repository,
                                                        assessment, or certificate
                                                        that supports this skill.
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="skill-evidence-list">
                                                    {skillEvidence.map((evidence) => (
                                                        <article
                                                            className="skill-evidence-item"
                                                            key={evidence._id}
                                                        >
                                                            <div className="skill-evidence-item-header">
                                                                <div>
                                                                    <span className="skill-evidence-type">
                                                                        {getEvidenceTypeLabel(
                                                                            evidence.type
                                                                        )}
                                                                    </span>

                                                                    <h5>
                                                                        {evidence.title}
                                                                    </h5>
                                                                </div>

                                                                <span className="skill-evidence-status">
                                                                    {getVerificationLabel(
                                                                        evidence.verificationStatus
                                                                    )}
                                                                </span>
                                                            </div>

                                                            {evidence.description && (
                                                                <p className="skill-evidence-description">
                                                                    {evidence.description}
                                                                </p>
                                                            )}

                                                            {evidence.url && (
                                                                <a
                                                                    className="skill-evidence-link"
                                                                    href={evidence.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                >
                                                                    Open evidence ↗
                                                                </a>
                                                            )}

                                                            <div className="skill-evidence-actions">
                                                                <button
                                                                    type="button"
                                                                    className="skill-edit-button"
                                                                    onClick={() =>
                                                                        handleEditEvidence(
                                                                            skill._id,
                                                                            evidence
                                                                        )
                                                                    }
                                                                >
                                                                    Edit
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    className="skill-delete-button"
                                                                    onClick={() =>
                                                                        handleDeleteEvidence(
                                                                            skill._id,
                                                                            evidence._id
                                                                        )
                                                                    }
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </article>
                                                    ))}
                                                </div>
                                            )}

                                            {/* ADD / EDIT EVIDENCE FORM */}

                                            {evidenceFormSkillId === skill._id && (
                                                <form
                                                    className="skill-evidence-form"
                                                    onSubmit={handleEvidenceSubmit}
                                                >
                                                    <h4>
                                                        {editingEvidenceId
                                                            ? "Edit Evidence"
                                                            : "Add Evidence"
                                                        }
                                                    </h4>

                                                    <div className="skills-field">
                                                        <label
                                                            htmlFor={`evidence-title-${skill._id}`}
                                                        >
                                                            Evidence Title
                                                        </label>

                                                        <input
                                                            id={`evidence-title-${skill._id}`}
                                                            name="title"
                                                            value={evidenceForm.title}
                                                            onChange={handleEvidenceChange}
                                                            placeholder="e.g. React project"
                                                            maxLength={120}
                                                            required
                                                        />
                                                    </div>

                                                    <div className="skills-field">
                                                        <label
                                                            htmlFor={`evidence-type-${skill._id}`}
                                                        >
                                                            Evidence Type
                                                        </label>

                                                        <select
                                                            id={`evidence-type-${skill._id}`}
                                                            name="type"
                                                            value={evidenceForm.type}
                                                            onChange={handleEvidenceChange}
                                                            required
                                                        >
                                                            {evidenceTypes.map((type) => (
                                                                <option
                                                                    key={type.value}
                                                                    value={type.value}
                                                                >
                                                                    {type.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div className="skills-field">
                                                        <label
                                                            htmlFor={`evidence-url-${skill._id}`}
                                                        >
                                                            Evidence URL
                                                            <span className="optional-label">
                                                                {" "} (optional)
                                                            </span>
                                                        </label>

                                                        <input
                                                            id={`evidence-url-${skill._id}`}
                                                            type="url"
                                                            name="url"
                                                            value={evidenceForm.url}
                                                            onChange={handleEvidenceChange}
                                                            placeholder="https://github.com/username/repository"
                                                            maxLength={2048}
                                                        />
                                                    </div>

                                                    <div className="skills-field">
                                                        <label
                                                            htmlFor={`evidence-description-${skill._id}`}
                                                        >
                                                            Description
                                                            <span className="optional-label">
                                                                {" "} (optional)
                                                            </span>
                                                        </label>

                                                        <textarea
                                                            id={`evidence-description-${skill._id}`}
                                                            name="description"
                                                            value={evidenceForm.description}
                                                            onChange={handleEvidenceChange}
                                                            placeholder="Explain what this evidence demonstrates..."
                                                            maxLength={1000}
                                                            rows={3}
                                                        />
                                                    </div>

                                                    <div className="skills-form-actions">
                                                        <button
                                                            type="button"
                                                            className="skills-cancel-button"
                                                            onClick={resetEvidenceForm}
                                                            disabled={savingEvidence}
                                                        >
                                                            Cancel
                                                        </button>

                                                        <button
                                                            type="submit"
                                                            className="skills-save-button"
                                                            disabled={savingEvidence}
                                                        >
                                                            {savingEvidence
                                                                ? "Saving..."
                                                                : editingEvidenceId
                                                                ? "Update Evidence"
                                                                : "Save Evidence"
                                                            }
                                                        </button>
                                                    </div>
                                                </form>
                                            )}
                                        </div>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
};

export default function SkillsDesktopCanvas() {
    return (
        <div className="skills-desktop-scroll" role="region" aria-label="Skills page. Scroll horizontally to view all content on narrow screens." tabIndex={0}>
            <div className="skills-desktop-canvas">
                <Skills />
            </div>
        </div>
    );
}
