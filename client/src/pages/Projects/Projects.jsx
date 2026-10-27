import { useEffect, useRef, useState } from "react";

import {
    getProjects,
    createProject,
    updateProject,
    deleteProject
} from "../../services/projectService";

import "./Projects.css";

const Projects = () => {
    const [projects, setProjects] = useState([]);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        technologies: "",
        githubUrl: "",
        liveUrl: "",
        status: "completed"
    });

    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [saving, setSaving] = useState(false);
    const saveInFlight = useRef(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const fetchProjects = async () => {
        try {
            setError("");
            setLoadError(false);

            const response = await getProjects();
            if (!Array.isArray(response?.data)) {
                throw new Error("Unable to load projects: the server returned an invalid list. Please retry.");
            }
            setProjects(response.data);
        } catch (error) {
            setLoadError(true);
            setError(error?.message || "Unable to load projects. Please retry.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleChange = (e) => {
        if (saveInFlight.current) return;
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const resetForm = () => {
        setFormData({
            title: "",
            description: "",
            technologies: "",
            githubUrl: "",
            liveUrl: "",
            status: "completed"
        });

        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (saveInFlight.current) return;

        try {
            setError("");
            setSuccess("");
            saveInFlight.current = true;
            setSaving(true);

            const projectData = {
                title: formData.title,
                description: formData.description,

                technologies: formData.technologies
                    .split(",")
                    .map((technology) => technology.trim())
                    .filter(Boolean),

                githubUrl: formData.githubUrl,
                liveUrl: formData.liveUrl,
                status: formData.status
            };

            if (editingId) {
                await updateProject(editingId, projectData);

                setSuccess("Project updated successfully.");
            } else {
                await createProject(projectData);

                setSuccess("Project created successfully.");
            }

            resetForm();

            await fetchProjects();
        } catch (error) {
            setError(error.message);
        } finally {
            saveInFlight.current = false;
            setSaving(false);
        }
    };

    const handleEdit = (project) => {
        if (saveInFlight.current) return;
        setFormData({
            title: project.title || "",

            description:
                project.description || "",

            technologies:
                Array.isArray(project.technologies)
                    ? project.technologies.join(", ")
                    : "",

            githubUrl:
                project.githubUrl || "",

            liveUrl:
                project.liveUrl || "",

            status:
                project.status || "completed"
        });

        setEditingId(project._id);

        setError("");
        setSuccess("");

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    const handleDelete = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this project?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setError("");
            setSuccess("");

            await deleteProject(id);

            setSuccess("Project deleted successfully.");

            await fetchProjects();
        } catch (error) {
            setError(error.message);
        }
    };

    const getStatusLabel = (status) => {
        if (status === "in-progress") {
            return "In Progress";
        }

        if (status === "planned") {
            return "Planned";
        }

        return "Completed";
    };

    if (loading) {
        return (
            <div className="projects-page">
                <div className="projects-loading" role="status">
                    Loading projects...
                </div>
            </div>
        );
    }

    return (
        <div className="projects-page">

            {/* Page Header */}

            <div className="projects-page-header">
                <span className="projects-eyebrow">
                    PORTFOLIO
                </span>

                <h1>My Projects</h1>

                <p>
                    Showcase your projects, technologies and
                    achievements in one place.
                </p>
            </div>

            {/* Messages */}

            {error && (
                <div className="projects-message projects-error" role="alert">
                    {error}
                    {loadError && (
                        <button type="button" className="projects-secondary-button" onClick={fetchProjects} disabled={saving}>
                            Retry
                        </button>
                    )}
                </div>
            )}

            {success && (
                <div className="projects-message projects-success" role="status">
                    {success}
                </div>
            )}

            {/* Add / Edit Project */}

            <section className="projects-section">

                <div className="projects-section-header">

                    <div className="projects-section-icon">
                        💻
                    </div>

                    <div>
                        <h2>
                            {editingId
                                ? "Edit Project"
                                : "Add New Project"}
                        </h2>

                        <p>
                            Add details about your project and
                            showcase your work.
                        </p>
                    </div>

                </div>

                <form
                    className="projects-form"
                    onSubmit={handleSubmit}
                >

                    <div className="projects-field">

                        <label htmlFor="title">
                            Project Title
                        </label>

                        <input
                            disabled={saving}
                            id="title"
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="e.g. AI Career OS"
                            required
                        />

                    </div>

                    <div className="projects-field">

                        <label htmlFor="description">
                            Description
                        </label>

                        <textarea
                            disabled={saving}
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Describe what you built, the problem it solves and your role."
                            rows="5"
                            required
                        />

                    </div>

                    <div className="projects-field">

                        <label htmlFor="technologies">
                            Technologies
                        </label>

                        <input
                            disabled={saving}
                            id="technologies"
                            type="text"
                            name="technologies"
                            value={formData.technologies}
                            onChange={handleChange}
                            placeholder="React, Node.js, MongoDB, Express"
                        />

                        <small>
                            Separate technologies with commas.
                        </small>

                    </div>

                    <div className="projects-grid">

                        <div className="projects-field">

                            <label htmlFor="githubUrl">
                                GitHub URL
                            </label>

                            <input
                            disabled={saving}
                                id="githubUrl"
                                type="url"
                                name="githubUrl"
                                value={formData.githubUrl}
                                onChange={handleChange}
                                placeholder="https://github.com/username/project"
                            />

                        </div>

                        <div className="projects-field">

                            <label htmlFor="liveUrl">
                                Live Project URL
                            </label>

                            <input
                            disabled={saving}
                                id="liveUrl"
                                type="url"
                                name="liveUrl"
                                value={formData.liveUrl}
                                onChange={handleChange}
                                placeholder="https://your-project.com"
                            />

                        </div>

                    </div>

                    <div className="projects-field">

                        <label htmlFor="status">
                            Project Status
                        </label>

                        <select
                            disabled={saving}
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                        >
                            <option value="completed">
                                Completed
                            </option>

                            <option value="in-progress">
                                In Progress
                            </option>

                            <option value="planned">
                                Planned
                            </option>
                        </select>

                    </div>

                    <div className="projects-form-actions">

                        <button
                            type="submit"
                            className="projects-primary-button"
                            disabled={saving}
                        >
                            {saving
                                ? "Saving..."
                                : editingId
                                ? "Update Project"
                                : "Add Project"}
                        </button>

                        {editingId && (
                            <button
                                type="button"
                                className="projects-secondary-button"
                                disabled={saving}
                                onClick={() => {
                                    if (!saveInFlight.current) resetForm();
                                }}
                            >
                                Cancel
                            </button>
                        )}

                    </div>

                </form>

            </section>

            {/* Projects List */}

            <section className="projects-section">

                <div className="projects-section-header">

                    <div className="projects-section-icon">
                        📁
                    </div>

                    <div>
                        <h2>Your Projects</h2>

                        <p>
                            Manage and showcase your completed
                            and ongoing work.
                        </p>
                    </div>

                </div>

                {loadError && projects.length === 0 ? null : projects.length === 0 ? (

                    <div className="projects-empty">

                        <div className="projects-empty-icon">
                            📂
                        </div>

                        <h3>
                            No projects yet
                        </h3>

                        <p>
                            Add your first project using the
                            form above.
                        </p>

                    </div>

                ) : (

                    <div className="projects-list">

                        {projects.map((project) => (

                            <article
                                className="project-card"
                                key={project._id}
                            >

                                <div className="project-card-top">

                                    <div>

                                        <h3>
                                            {project.title}
                                        </h3>

                                        <span
                                            className={`project-status project-status-${project.status}`}
                                        >
                                            {getStatusLabel(
                                                project.status
                                            )}
                                        </span>

                                    </div>

                                </div>

                                <p className="project-description">
                                    {project.description}
                                </p>

                                {Array.isArray(
                                    project.technologies
                                ) &&
                                    project.technologies.length > 0 && (

                                        <div className="project-technologies">

                                            {project.technologies.map(
                                                (
                                                    technology,
                                                    index
                                                ) => (

                                                    <span
                                                        className="technology-tag"
                                                        key={`${technology}-${index}`}
                                                    >
                                                        {technology}
                                                    </span>

                                                )
                                            )}

                                        </div>
                                    )}

                                <div className="project-links">

                                    {project.githubUrl && (
                                        <a
                                            href={
                                                project.githubUrl
                                            }
                                            target="_blank"
                                            rel="noreferrer"
                                            className="project-link"
                                        >
                                            GitHub ↗
                                        </a>
                                    )}

                                    {project.liveUrl && (
                                        <a
                                            href={
                                                project.liveUrl
                                            }
                                            target="_blank"
                                            rel="noreferrer"
                                            className="project-link"
                                        >
                                            Live Project ↗
                                        </a>
                                    )}

                                </div>

                                <div className="project-card-actions">

                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleEdit(project)
                                        }
                                        disabled={saving}
                                        className="project-edit-button"
                                    >
                                        Edit
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleDelete(
                                                project._id
                                            )
                                        }
                                        className="project-delete-button"
                                    >
                                        Delete
                                    </button>

                                </div>

                            </article>

                        ))}

                    </div>

                )}

            </section>

        </div>
    );
};

export default function ProjectsDesktopCanvas() {
    return (
        <div className="projects-desktop-scroll" role="region" aria-label="Projects page. Scroll horizontally to view all content on narrow screens." tabIndex={0}>
            <div className="projects-desktop-canvas">
                <Projects />
            </div>
        </div>
    );
}