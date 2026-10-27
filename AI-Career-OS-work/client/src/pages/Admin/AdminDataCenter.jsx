
import { useEffect, useState } from "react";
import { getAdminUsers } from "../../services/adminUserService";
import {
    getAdminDataSummary,
    getAdminDataRecords
} from "../../services/adminDataService";
import "./AdminDataCenter.css";

const RESOURCES = [
    ["profiles", "Profiles"],
    ["projects", "Projects"],
    ["resumes", "Resumes"],
    ["skills", "Skills"],
    ["documents", "Documents"],
    ["dsa", "DSA Records"],
    ["interviews", "Interviews"],
    ["progress", "Progress"],
    ["activities", "Activities"],
    ["notifications", "Notifications"],
    ["roadmaps", "Roadmaps"],
    ["skill-evidence", "Skill Evidence"]
];

const getCurrentUser = () => {
    try {
        const raw =
            localStorage.getItem("user") ||
            sessionStorage.getItem("user");

        if (!raw) return null;

        const parsed = JSON.parse(raw);
        return parsed?.data?.user || parsed?.user || parsed;
    } catch {
        return null;
    }
};

const AdminDataCenter = () => {
    const [isAdmin] = useState(
        () => String(getCurrentUser()?.role || "").toLowerCase() === "admin"
    );

    const [users, setUsers] = useState([]);
    const [summary, setSummary] = useState([]);
    const [records, setRecords] = useState([]);
    const [resource, setResource] = useState("profiles");
    const [userId, setUserId] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({
        page: 1, limit: 25, total: 0, pages: 0
    });
    const [loading, setLoading] = useState(true);
    const [overviewLoading, setOverviewLoading] = useState(true);
    const [error, setError] = useState("");
    const [expandedId, setExpandedId] = useState("");

    useEffect(() => {
        if (!isAdmin) {
            setOverviewLoading(false);
            return;
        }

        let active = true;

        const loadOverview = async () => {
            try {
                const [userResult, summaryResult] = await Promise.all([
                    getAdminUsers({ page: 1, limit: 100 }),
                    getAdminDataSummary()
                ]);

                if (!active) return;

                setUsers(Array.isArray(userResult?.data) ? userResult.data : []);
                setSummary(
                    Array.isArray(summaryResult?.data)
                        ? summaryResult.data
                        : []
                );
            } catch (err) {
                if (active) {
                    setError(err.message || "Could not load the admin overview.");
                }
            } finally {
                if (active) setOverviewLoading(false);
            }
        };

        loadOverview();

        return () => {
            active = false;
        };
    }, [isAdmin]);

    useEffect(() => {
        if (!isAdmin) {
            setLoading(false);
            return;
        }

        let active = true;

        const loadRecords = async () => {
            setLoading(true);
            setError("");
            setExpandedId("");

            try {
                const result = await getAdminDataRecords({
                    resource,
                    userId,
                    search,
                    page,
                    limit: 25
                });

                if (!active) return;

                setRecords(Array.isArray(result?.data) ? result.data : []);
                setPagination(result?.pagination || {
                    page, limit: 25, total: 0, pages: 0
                });
            } catch (err) {
                if (!active) return;
                setRecords([]);
                setError(err.message || "Could not load records.");
            } finally {
                if (active) setLoading(false);
            }
        };

        loadRecords();

        return () => {
            active = false;
        };
    }, [isAdmin, resource, userId, search, page]);

    const submitSearch = (event) => {
        event.preventDefault();
        setPage(1);
        setSearch(searchInput.trim());
    };

    if (!isAdmin) {
        return (
            <div className="admin-data-page">
                <div className="admin-data-message">
                    <h1>Admin access required</h1>
                    <p>Sign in with an authorized administrator account.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-data-page">
            <header className="admin-data-header">
                <div>
                    <span className="admin-data-eyebrow">ADMINISTRATION</span>
                    <h1>Admin Data Center</h1>
                    <p>
                        Explore career records across your AI Career OS users.
                    </p>
                </div>
                <div className="admin-data-header-icon">◈</div>
            </header>

            <section className="admin-data-stats">
                <article>
                    <span>Registered accounts</span>
                    <strong>{overviewLoading ? "…" : users.length}</strong>
                    <small>First 100 accounts loaded</small>
                </article>
                <article>
                    <span>Resource types</span>
                    <strong>{RESOURCES.length}</strong>
                    <small>Available data collections</small>
                </article>
                <article>
                    <span>Matching records</span>
                    <strong>{loading ? "…" : pagination.total}</strong>
                    <small>Based on your current filters</small>
                </article>
            </section>

            <section className="admin-data-panel">
                <h2>Database overview</h2>
                <p className="admin-data-subtitle">
                    Select a resource below to inspect its records.
                </p>

                {overviewLoading ? (
                    <p>Loading resource counts…</p>
                ) : (
                    <div className="admin-data-counts">
                        {summary.map((item) => (
                            <button
                                key={item.resource}
                                type="button"
                                className={
                                    resource === item.resource
                                        ? "admin-data-count active"
                                        : "admin-data-count"
                                }
                                onClick={() => {
                                    setResource(item.resource);
                                    setPage(1);
                                }}
                            >
                                <span>
                                    {RESOURCES.find(
                                        (entry) => entry[0] === item.resource
                                    )?.[1] || item.resource}
                                </span>
                                <strong>{item.count}</strong>
                            </button>
                        ))}
                    </div>
                )}
            </section>

            <section className="admin-data-panel">
                <div className="admin-data-panel-heading">
                    <div>
                        <h2>Browse records</h2>
                        <p className="admin-data-subtitle">
                            Choose a data type and optionally select an owner.
                        </p>
                    </div>
                    <button
                        type="button"
                        className="admin-data-button secondary"
                        onClick={() => setPage((current) => current)}
                        disabled={loading}
                    >
                        {loading ? "Loading…" : "Refresh"}
                    </button>
                </div>

                <div className="admin-data-filters">
                    <label>
                        Resource
                        <select
                            value={resource}
                            onChange={(event) => {
                                setResource(event.target.value);
                                setPage(1);
                            }}
                        >
                            {RESOURCES.map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label>
                        Filter by user
                        <select
                            value={userId}
                            onChange={(event) => {
                                setUserId(event.target.value);
                                setPage(1);
                            }}
                        >
                            <option value="">All users</option>
                            {users.map((user) => (
                                <option key={user._id} value={user._id}>
                                    {user.name || user.email || user._id}
                                    {user.role === "admin" ? " (Admin)" : ""}
                                </option>
                            ))}
                        </select>
                    </label>

                    <form onSubmit={submitSearch}>
                        <label htmlFor="admin-data-search">Search records</label>
                        <div className="admin-data-search-row">
                            <input
                                id="admin-data-search"
                                type="search"
                                value={searchInput}
                                onChange={(event) =>
                                    setSearchInput(event.target.value)
                                }
                                placeholder="Search titles, topics..."
                            />
                            <button
                                className="admin-data-button"
                                type="submit"
                            >
                                Search
                            </button>
                        </div>
                    </form>
                </div>

                {error && (
                    <div className="admin-data-error" role="alert">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="admin-data-empty">Loading records…</div>
                ) : records.length === 0 ? (
                    <div className="admin-data-empty">
                        <h3>No records found</h3>
                        <p>Try another resource, user, or search term.</p>
                    </div>
                ) : (
                    <>
                        <div className="admin-data-table-wrap">
                            <table className="admin-data-table">
                                <thead>
                                    <tr>
                                        <th>Record</th>
                                        <th>Owner</th>
                                        <th>Status / Type</th>
                                        <th>Created</th>
                                        <th>Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.map((record) => (
                                        <tr key={record._id}>
                                            <td>
                                                <strong>
                                                    {record.title ||
                                                        record.name ||
                                                        record.topic ||
                                                        record.question ||
                                                        record.fileName ||
                                                        record.category ||
                                                        record._id}
                                                </strong>
                                                <small>{record._id}</small>
                                            </td>
                                            <td>
                                                {typeof record.user === "object"
                                                    ? record.user?.name ||
                                                      record.user?.email ||
                                                      record.user?._id ||
                                                      "Unknown"
                                                    : record.user ||
                                                      "No owner"}
                                                {record.user?.email && (
                                                    <small>{record.user.email}</small>
                                                )}
                                            </td>
                                            <td>
                                                {record.verificationStatus ||
                                                    record.status ||
                                                    record.level ||
                                                    record.type ||
                                                    record.category ||
                                                    "—"}
                                            </td>
                                            <td>
                                                {record.createdAt
                                                    ? new Date(
                                                          record.createdAt
                                                      ).toLocaleDateString()
                                                    : "—"}
                                            </td>
                                            <td>
                                                <button
                                                    type="button"
                                                    className="admin-data-view"
                                                    onClick={() =>
                                                        setExpandedId(
                                                            expandedId === record._id
                                                                ? ""
                                                                : record._id
                                                        )
                                                    }
                                                >
                                                    {expandedId === record._id
                                                        ? "Hide"
                                                        : "View"}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {expandedId && (
                            <pre className="admin-data-json">
                                {JSON.stringify(
                                    records.find(
                                        (record) => record._id === expandedId
                                    ),
                                    null,
                                    2
                                )}
                            </pre>
                        )}
                    </>
                )}

                <div className="admin-data-pagination">
                    <span>
                        Page {pagination.page || page} of{" "}
                        {Math.max(1, pagination.pages || 1)}
                        {" · "}
                        {pagination.total || 0} records
                    </span>
                    <div>
                        <button
                            type="button"
                            className="admin-data-button secondary"
                            disabled={loading || page <= 1}
                            onClick={() => setPage((value) => value - 1)}
                        >
                            Previous
                        </button>
                        <button
                            type="button"
                            className="admin-data-button secondary"
                            disabled={
                                loading ||
                                page >= Math.max(1, pagination.pages || 1)
                            }
                            onClick={() => setPage((value) => value + 1)}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </section>

            <p className="admin-data-security-note">
                Admin access is enforced by the backend. This page provides
                read-only inspection; updates and deletions are not exposed here.
            </p>
        </div>
    );
};

export default AdminDataCenter;
