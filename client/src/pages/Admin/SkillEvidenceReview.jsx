import { useCallback, useEffect, useState } from "react";

import {
    getSkillEvidenceReviewQueue,
    updateSkillEvidenceReview
} from "../../services/skillEvidenceReviewService";

import "./SkillEvidenceReview.css";

const FILTERS = [
    { value: "unverified", label: "Unverified" },
    { value: "under-review", label: "Under Review" },
    { value: "verified", label: "Verified" },
    { value: "rejected", label: "Rejected" },
    { value: "all", label: "All Evidence" }
];

const STATUS_LABELS = {
    unverified: "Unverified",
    "under-review": "Under Review",
    verified: "Verified",
    rejected: "Rejected"
};

const SkillEvidenceReview = () => {
    const [evidence, setEvidence] = useState([]);
    const [filter, setFilter] = useState("unverified");
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState("");
    const [rejectingId, setRejectingId] = useState("");
    const [reviewNote, setReviewNote] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const loadEvidence = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response =
                await getSkillEvidenceReviewQueue(filter);

            setEvidence(
                Array.isArray(response?.data)
                    ? response.data
                    : []
            );
        } catch (err) {
            setEvidence([]);

            setError(
                err?.message ||
                    "Unable to load evidence. Check your admin access."
            );
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        loadEvidence();
    }, [loadEvidence]);

    const handleFilterChange = (event) => {
        setFilter(event.target.value);
        setSuccess("");
        setError("");
        setRejectingId("");
        setReviewNote("");
    };

    const handleReview = async (
        item,
        verificationStatus,
        note = ""
    ) => {
        if (
            verificationStatus === "rejected" &&
            !note.trim()
        ) {
            setError("Enter a reason before rejecting evidence.");
            return;
        }

        const action =
            verificationStatus === "verified"
                ? "verify"
                : verificationStatus === "rejected"
                ? "reject"
                : "move to under review";

        const confirmed = window.confirm(
            `Are you sure you want to ${action} "${item.title}"?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setBusyId(item._id);
            setError("");
            setSuccess("");

            const response =
                await updateSkillEvidenceReview(
                    item._id,
                    {
                        verificationStatus,
                        reviewNote: note.trim()
                    }
                );

            setSuccess(
                response?.message ||
                    "Evidence review saved successfully."
            );

            setRejectingId("");
            setReviewNote("");

            await loadEvidence();
        } catch (err) {
            setError(
                err?.message ||
                    "Unable to save the review decision."
            );
        } finally {
            setBusyId("");
        }
    };

    const formatDate = (date) => {
        if (!date) {
            return "Not available";
        }

        const parsed = new Date(date);

        return Number.isNaN(parsed.getTime())
            ? "Not available"
            : parsed.toLocaleDateString();
    };

    const formatType = (type) => {
        if (!type) {
            return "Evidence";
        }

        return type
            .replace(/-/g, " ")
            .replace(/\b\w/g, (letter) =>
                letter.toUpperCase()
            );
    };

    return (
        <main className="evidence-review-page">
            <header className="evidence-review-header">
                <div>
                    <span className="evidence-review-eyebrow">
                        ADMINISTRATION
                    </span>

                    <h1>Skill Evidence Review</h1>

                    <p>
                        Review submitted projects and evidence before
                        accepting or rejecting a skill claim.
                    </p>
                </div>

                <div className="evidence-review-header-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 3 4 6v6c0 4 8 9 8 9s8-5 8-9V6l-8-3Z" />
                        <path d="m8.5 12 2.5 2.5 4.5-5" />
                    </svg>
                </div>
            </header>

            <section className="evidence-review-summary">
                <div className="evidence-review-summary-icon" aria-hidden="true">
                    <span>i</span>
                </div>

                <div>
                    <h2>Review each submission on its merits</h2>

                    <p>
                        Each submission is reviewed individually.
                        Adding a link does not automatically verify a skill.
                    </p>
                </div>
            </section>

            {error && (
                <div
                    className="evidence-review-alert evidence-review-error"
                    role="alert"
                >
                    {error}

                    {error.includes("Admin") ||
                    error.includes("admin") ||
                    error.includes("403") ? (
                        <p>
                            Sign in with an account whose database role
                            is admin, then try again.
                        </p>
                    ) : null}
                </div>
            )}

            {success && (
                <div
                    className="evidence-review-alert evidence-review-success"
                    role="status"
                >
                    {success}
                </div>
            )}

            <section className="evidence-review-panel">
                <div className="evidence-review-toolbar">
                    <div>
                        <h2>Submitted evidence</h2>

                        <p>
                            {loading
                                ? "Loading submissions..."
                                : error && evidence.length === 0 ? "Queue unavailable · use Refresh to retry" : `${evidence.length} item${
                                      evidence.length === 1 ? "" : "s"
                                  } in this view`}
                        </p>
                    </div>

                    <div className="evidence-review-filter">
                        <label htmlFor="evidence-status-filter">
                            Filter status
                        </label>

                        <select
                            id="evidence-status-filter"
                            value={filter}
                            onChange={handleFilterChange}
                            disabled={Boolean(busyId)}
                        >
                            {FILTERS.map((option) => (
                                <option
                                    key={option.value}
                                    value={option.value}
                                >
                                    {option.label}
                                </option>
                            ))}
                        </select>

                        <button
                            type="button"
                            className="evidence-review-refresh"
                            onClick={loadEvidence}
                            disabled={loading || Boolean(busyId)}
                        >
                            Refresh
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="evidence-review-state">
                        <div className="evidence-review-spinner" />
                        <p>Loading evidence submissions...</p>
                    </div>
                ) : error && evidence.length === 0 ? (
                    <div className="evidence-review-state">
                        <h3>Unable to display the queue</h3>
                        <p>Review the error above, then use Refresh to try again.</p>
                    </div>
                ) : evidence.length === 0 ? (
                    <div className="evidence-review-state">
                        <div className="evidence-review-empty-icon">
                            —
                        </div>

                        <h3>No evidence found</h3>

                        <p>
                            There are no submissions matching this filter.
                        </p>
                    </div>
                ) : (
                    <div className="evidence-review-list">
                        {evidence.map((item) => {
                            const owner =
                                item.user &&
                                typeof item.user === "object"
                                    ? item.user
                                    : null;

                            const skill =
                                item.skill &&
                                typeof item.skill === "object"
                                    ? item.skill
                                    : null;

                            const status =
                                item.verificationStatus || "unverified";

                            const isBusy = busyId === item._id;

                            return (
                                <article
                                    className="evidence-review-card"
                                    key={item._id}
                                >
                                    <div className="evidence-review-card-top">
                                        <div className="evidence-review-type">
                                            {formatType(item.type)}
                                        </div>

                                        <span
                                            className={
                                                "evidence-review-status " +
                                                `evidence-review-status-${status}`
                                            }
                                        >
                                            {STATUS_LABELS[status] ||
                                                status}
                                        </span>
                                    </div>

                                    <h3>{item.title}</h3>

                                    <p className="evidence-review-skill">
                                        Skill:{" "}
                                        <strong>
                                            {skill?.name || "Unknown skill"}
                                        </strong>

                                        {skill?.category
                                            ? ` · ${skill.category}`
                                            : ""}
                                    </p>

                                    <div className="evidence-review-owner">
                                        <div className="evidence-review-avatar">
                                            {(
                                                owner?.name ||
                                                owner?.email ||
                                                "U"
                                            )
                                                .charAt(0)
                                                .toUpperCase()}
                                        </div>

                                        <div>
                                            <strong>
                                                {owner?.name ||
                                                    "Unknown user"}
                                            </strong>

                                            <span>
                                                {owner?.email ||
                                                    "Email unavailable"}
                                            </span>
                                        </div>
                                    </div>

                                    {item.description && (
                                        <div className="evidence-review-description">
                                            <span>Description</span>
                                            <p>{item.description}</p>
                                        </div>
                                    )}

                                    {item.url && (
                                        <a
                                            className="evidence-review-link"
                                            href={item.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Open submitted evidence ↗
                                        </a>
                                    )}

                                    <div className="evidence-review-metadata">
                                        <span>
                                            Submitted:{" "}
                                            {formatDate(item.createdAt)}
                                        </span>

                                        {item.reviewedAt && (
                                            <span>
                                                Reviewed:{" "}
                                                {formatDate(item.reviewedAt)}
                                            </span>
                                        )}
                                    </div>

                                    {item.reviewNote && (
                                        <div className="evidence-review-note">
                                            <strong>Review note</strong>
                                            <p>{item.reviewNote}</p>
                                        </div>
                                    )}

                                    <div className="evidence-review-actions">
                                        {status === "unverified" && (
                                            <button
                                                type="button"
                                                className="evidence-review-secondary"
                                                disabled={Boolean(busyId)}
                                                onClick={() =>
                                                    handleReview(
                                                        item,
                                                        "under-review",
                                                        "Evidence review started."
                                                    )
                                                }
                                            >
                                                {isBusy
                                                    ? "Saving..."
                                                    : "Start Review"}
                                            </button>
                                        )}

                                        {status !== "verified" && (
                                            <button
                                                type="button"
                                                className="evidence-review-verify"
                                                disabled={Boolean(busyId)}
                                                onClick={() =>
                                                    handleReview(
                                                        item,
                                                        "verified",
                                                        "Evidence reviewed and accepted."
                                                    )
                                                }
                                            >
                                                {isBusy
                                                    ? "Saving..."
                                                    : "✓ Verify"}
                                            </button>
                                        )}

                                        {status !== "rejected" && (
                                            <button
                                                type="button"
                                                className="evidence-review-reject"
                                                disabled={Boolean(busyId)}
                                                onClick={() => {
                                                    setRejectingId(
                                                        rejectingId === item._id
                                                            ? ""
                                                            : item._id
                                                    );

                                                    setReviewNote("");
                                                    setError("");
                                                }}
                                            >
                                                Reject
                                            </button>
                                        )}
                                    </div>

                                    {rejectingId === item._id && (
                                        <form
                                            className="evidence-review-reject-form"
                                            onSubmit={(event) => {
                                                event.preventDefault();

                                                handleReview(
                                                    item,
                                                    "rejected",
                                                    reviewNote
                                                );
                                            }}
                                        >
                                            <label
                                                htmlFor={`review-note-${item._id}`}
                                            >
                                                Reason for rejection
                                            </label>

                                            <textarea
                                                id={`review-note-${item._id}`}
                                                value={reviewNote}
                                                onChange={(event) =>
                                                    setReviewNote(
                                                        event.target.value
                                                    )
                                                }
                                                maxLength={1000}
                                                rows={3}
                                                placeholder="Explain what needs to be corrected..."
                                                required
                                            />

                                            <div className="evidence-review-reject-actions">
                                                <button
                                                    type="button"
                                                    className="evidence-review-secondary"
                                                    onClick={() => {
                                                        setRejectingId("");
                                                        setReviewNote("");
                                                    }}
                                                    disabled={Boolean(busyId)}
                                                >
                                                    Cancel
                                                </button>

                                                <button
                                                    type="submit"
                                                    className="evidence-review-reject"
                                                    disabled={Boolean(busyId)}
                                                >
                                                    {isBusy
                                                        ? "Saving..."
                                                        : "Confirm Rejection"}
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>

            <p className="evidence-review-security-note">
                Admin decisions are saved by the server. Ordinary users
                cannot change verification statuses through this page.
            </p>
        </main>
    );
};

function SkillEvidenceReviewDesktopCanvas() {
    return (
        <div className="evidence-review-desktop-scroll" role="region" aria-label="Evidence Review page. Scroll horizontally to view all content on narrow screens." tabIndex={0}>
            <div className="evidence-review-desktop-canvas">
                <SkillEvidenceReview />
            </div>
        </div>
    );
}

export default SkillEvidenceReviewDesktopCanvas;
