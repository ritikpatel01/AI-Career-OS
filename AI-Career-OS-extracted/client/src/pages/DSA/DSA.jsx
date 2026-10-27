import { useEffect, useState } from "react";

import {
    getDSA,
    updateDSA
} from "../../services/dsaService";

import "./DSA.css";

const DSA = () => {
    const [topics, setTopics] = useState([]);

    const [formData, setFormData] = useState({
        topic: "",
        category: "",
        difficulty: "easy",
        status: "not-started",
        problemsSolved: 0,
        notes: ""
    });

    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // ==========================================
    // FETCH DSA TOPICS
    // ==========================================

    const fetchDSA = async () => {
        try {
            setError("");

            const response = await getDSA();

            console.log("DSA API Response:", response);

            if (Array.isArray(response?.data?.topics)) {
                setTopics(response.data.topics);
            } else if (Array.isArray(response?.data)) {
                setTopics(response.data);
            } else {
                setTopics([]);
            }
        } catch (error) {
            console.error("DSA Fetch Error:", error);

            setError(
                error.message ||
                "Failed to load DSA topics."
            );

            setTopics([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDSA();
    }, []);

    // ==========================================
    // HANDLE INPUT CHANGE
    // ==========================================

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((previousData) => ({
            ...previousData,
            [name]: value
        }));
    };

    // ==========================================
    // RESET FORM
    // ==========================================

    const resetForm = () => {
        setFormData({
            topic: "",
            category: "",
            difficulty: "easy",
            status: "not-started",
            problemsSolved: 0,
            notes: ""
        });

        setEditingId(null);
        setError("");
    };

    // ==========================================
    // EDIT TOPIC
    // ==========================================

    const handleEdit = (item) => {
        setFormData({
            topic: item.topic || "",
            category: item.category || "",
            difficulty: item.difficulty || "easy",
            status: item.status || "not-started",
            problemsSolved: item.problemsSolved ?? 0,
            notes: item.notes || ""
        });

        setEditingId(item._id);

        setError("");
        setSuccess("");

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    // ==========================================
    // UPDATE TOPIC
    // ==========================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!editingId) {
            setError(
                "Please select a DSA topic below to update."
            );
            return;
        }

        try {
            setError("");
            setSuccess("");
            setSaving(true);

            const dsaData = {
                topic: formData.topic.trim(),
                category: formData.category.trim(),
                difficulty: formData.difficulty,
                status: formData.status,
                problemsSolved: Number(
                    formData.problemsSolved
                ),
                notes: formData.notes.trim()
            };

            await updateDSA(
                editingId,
                dsaData
            );

            setSuccess(
                "DSA topic updated successfully."
            );

            await fetchDSA();

            setFormData({
                topic: "",
                category: "",
                difficulty: "easy",
                status: "not-started",
                problemsSolved: 0,
                notes: ""
            });

            setEditingId(null);

        } catch (error) {
            console.error(
                "DSA Update Error:",
                error
            );

            setError(
                error.message ||
                "Failed to update DSA topic."
            );
        } finally {
            setSaving(false);
        }
    };

    // ==========================================
    // CALCULATE TOPIC PROGRESS
    // ==========================================

    const getTopicProgress = (item) => {
        const solved =
            Number(item.problemsSolved) || 0;

        const target =
            Number(item.problemTarget) || 1;

        return Math.min(
            Math.round(
                (solved / target) * 100
            ),
            100
        );
    };

    // ==========================================
    // STATUS LABEL
    // ==========================================

    const getStatusLabel = (status) => {
        switch (status) {
            case "in-progress":
                return "In Progress";

            case "completed":
                return "Completed";

            default:
                return "Not Started";
        }
    };

    // ==========================================
    // DIFFICULTY LABEL
    // ==========================================

    const getDifficultyLabel = (difficulty) => {
        if (!difficulty) {
            return "Easy";
        }

        return (
            difficulty.charAt(0).toUpperCase() +
            difficulty.slice(1)
        );
    };

    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {
        return (
            <div className="dsa-page">
                <div className="dsa-loading">
                    Loading DSA progress...
                </div>
            </div>
        );
    }

    // ==========================================
    // UI
    // ==========================================

    return (
        <div className="dsa-page">

            {/* PAGE HEADER */}

            <div className="dsa-page-header">

                <div>
                    <span className="dsa-eyebrow">
                        DSA PREPARATION
                    </span>

                    <h1>
                        DSA Progress
                    </h1>

                    <p>
                        Track your data structures and
                        algorithms preparation, solved
                        problems and progress.
                    </p>
                </div>

                <div className="dsa-header-icon">
                    🧠
                </div>

            </div>


            {/* ERROR */}

            {error && (
                <div className="dsa-message dsa-error">
                    {error}
                </div>
            )}


            {/* SUCCESS */}

            {success && (
                <div className="dsa-message dsa-success">
                    {success}
                </div>
            )}


            {/* UPDATE FORM */}

            <section className="dsa-form-card">

                <div className="dsa-section-header">

                    <div className="dsa-section-icon">
                        ✏️
                    </div>

                    <div>

                        <h2>
                            Update DSA Topic
                        </h2>

                        <p>
                            Select a topic below and
                            update your preparation progress.
                        </p>

                    </div>

                </div>


                <form onSubmit={handleSubmit}>

                    <div className="dsa-form-grid">

                        {/* TOPIC */}

                        <div className="dsa-field dsa-full-width">

                            <label htmlFor="topic">
                                Topic
                            </label>

                            <input
                                id="topic"
                                type="text"
                                name="topic"
                                value={formData.topic}
                                onChange={handleChange}
                                placeholder="Select a topic below"
                                readOnly
                            />

                        </div>


                        {/* CATEGORY */}

                        <div className="dsa-field">

                            <label htmlFor="category">
                                Category
                            </label>

                            <input
                                id="category"
                                type="text"
                                name="category"
                                value={formData.category}
                                readOnly
                            />

                        </div>


                        {/* DIFFICULTY */}

                        <div className="dsa-field">

                            <label htmlFor="difficulty">
                                Difficulty
                            </label>

                            <select
                                id="difficulty"
                                name="difficulty"
                                value={formData.difficulty}
                                onChange={handleChange}
                                disabled={!editingId}
                            >
                                <option value="easy">
                                    Easy
                                </option>

                                <option value="medium">
                                    Medium
                                </option>

                                <option value="hard">
                                    Hard
                                </option>
                            </select>

                        </div>


                        {/* STATUS */}

                        <div className="dsa-field">

                            <label htmlFor="status">
                                Status
                            </label>

                            <select
                                id="status"
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                disabled={!editingId}
                            >
                                <option value="not-started">
                                    Not Started
                                </option>

                                <option value="in-progress">
                                    In Progress
                                </option>

                                <option value="completed">
                                    Completed
                                </option>
                            </select>

                        </div>


                        {/* PROBLEMS SOLVED */}

                        <div className="dsa-field">

                            <label htmlFor="problemsSolved">
                                Problems Solved
                            </label>

                            <input
                                id="problemsSolved"
                                type="number"
                                name="problemsSolved"
                                value={formData.problemsSolved}
                                onChange={handleChange}
                                min="0"
                                disabled={!editingId}
                            />

                        </div>


                        {/* NOTES */}

                        <div className="dsa-field dsa-full-width">

                            <label htmlFor="notes">
                                Notes
                            </label>

                            <textarea
                                id="notes"
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                placeholder="Select a topic below to add notes..."
                                rows="5"
                                disabled={!editingId}
                            />

                        </div>

                    </div>


                    {/* BUTTONS */}

                    <div className="dsa-form-actions">

                        <button
                            type="submit"
                            className="dsa-primary-button"
                            disabled={
                                saving ||
                                !editingId
                            }
                        >
                            {saving
                                ? "Updating..."
                                : "Update DSA"}
                        </button>


                        {editingId && (
                            <button
                                type="button"
                                className="dsa-secondary-button"
                                onClick={resetForm}
                            >
                                Cancel
                            </button>
                        )}

                    </div>

                </form>

            </section>


            {/* TOPICS */}

            <section className="dsa-topics-section">

                <div className="dsa-section-title">

                    <div>

                        <span className="dsa-eyebrow">
                            YOUR DSA ROADMAP
                        </span>

                        <h2>
                            DSA Topics
                        </h2>

                    </div>

                    <span className="dsa-topic-count">
                        {topics.length} Topics
                    </span>

                </div>


                {/* TOPICS */}

                {topics.length === 0 ? (

                    <div className="dsa-empty-state">

                        <div className="dsa-empty-icon">
                            📖
                        </div>

                        <h3>
                            DSA roadmap is empty
                        </h3>

                        <p>
                            No DSA roadmap topics were
                            found.
                        </p>

                    </div>

                ) : (

                    <div className="dsa-topics-grid">

                        {topics.map((item) => {

                            const topicProgress =
                                getTopicProgress(item);

                            return (
                                <div
                                    className="dsa-topic-card"
                                    key={item._id}
                                >

                                    {/* HEADER */}

                                    <div className="dsa-topic-header">

                                        <div>

                                            <h3>
                                                {item.topic}
                                            </h3>

                                            <p>
                                                {item.category}
                                            </p>

                                        </div>

                                        <span
                                            className={`dsa-difficulty ${item.difficulty}`}
                                        >
                                            {getDifficultyLabel(
                                                item.difficulty
                                            )}
                                        </span>

                                    </div>


                                    {/* STATUS */}

                                    <div className="dsa-topic-status">

                                        <span
                                            className={`dsa-status ${item.status}`}
                                        >
                                            {getStatusLabel(
                                                item.status
                                            )}
                                        </span>

                                    </div>


                                    {/* PROBLEM PROGRESS */}

                                    <div className="dsa-topic-info">

                                        <div>

                                            <span>
                                                Problems Solved
                                            </span>

                                            <strong>
                                                {item.problemsSolved || 0}
                                                {" / "}
                                                {item.problemTarget || 0}
                                            </strong>

                                        </div>


                                        <div>

                                            <span>
                                                Progress
                                            </span>

                                            <strong>
                                                {topicProgress}%
                                            </strong>

                                        </div>

                                    </div>


                                    {/* PROGRESS BAR */}

                                    <div className="dsa-progress-container">

                                        <div className="dsa-progress-bar">

                                            <div
                                                className="dsa-progress-fill"
                                                style={{
                                                    width:
                                                        `${topicProgress}%`
                                                }}
                                            />

                                        </div>

                                    </div>


                                    {/* NOTES */}

                                    {item.notes && (

                                        <div className="dsa-topic-notes">

                                            <span>
                                                Notes
                                            </span>

                                            <p>
                                                {item.notes}
                                            </p>

                                        </div>

                                    )}


                                    {/* EDIT BUTTON */}

                                    <div className="dsa-topic-actions">

                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleEdit(item)
                                            }
                                        >
                                            Edit Topic
                                        </button>

                                    </div>

                                </div>
                            );
                        })}

                    </div>

                )}

            </section>

        </div>
    );
};

export default DSA;