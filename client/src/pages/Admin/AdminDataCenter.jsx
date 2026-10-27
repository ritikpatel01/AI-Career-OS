import { Fragment, useEffect, useRef, useState } from "react";
import { getAdminUsers } from "../../services/adminUserService";
import { getAdminDataSummary, getAdminDataRecords } from "../../services/adminDataService";
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

const recordTitle = (record, resource) => {
    if (resource === "interviews") return record.role || record.topic || record.question || "Interview record";
    if (resource === "profiles") return record.fullName || record.name || record.user?.name || "Career profile";
    return record.title || record.name || record.topic || record.question || record.fileName || record.category || "Untitled record";
};
const displayValue = (value) => {
    if (value === null || value === undefined || value === "") return "—";
    return typeof value === "object" ? JSON.stringify(value, null, 2) : String(value);
};

const fieldLabel = (key) => ({
    _id: "ID", id: "ID", userId: "User ID", github: "GitHub",
    linkedin: "LinkedIn", portfolio: "Portfolio", socialLinks: "Social Links"
}[key] || key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/_/g, " ").trim());

// Presentation only: keep structured values intact, including false and zero.
const RecordFields = ({ value, context = "" }) => {
    const defaults = context === "user" ? { name: null, email: null, role: null, _id: null }
        : context === "socialLinks" ? { github: null, linkedin: null, portfolio: null } : {};
    const entries = Object.entries({ ...defaults, ...value }).filter(([key]) => key !== "__v");
    return <dl className="admin-data-detail-fields">{entries.map(([key, item]) => (
        <div key={key} data-field={key} className={item && typeof item === "object" && Object.keys(item).length ? "admin-data-field-group" : undefined}>
            <dt>{fieldLabel(key)}</dt>
            <dd><RecordValue value={item} context={key} /></dd>
        </div>
    ))}</dl>;
};

const RecordValue = ({ value, context }) => {
    if (value === null || value === undefined || (typeof value === "string" && !value.trim())) {
        return <span className="admin-data-missing">Not provided</span>;
    }
    if (Array.isArray(value)) {
        return value.length ? <ol className="admin-data-detail-list">{value.map((item, index) => (
            <li key={index}><RecordValue value={item} /></li>
        ))}</ol> : <span className="admin-data-missing">Not provided</span>;
    }
    if (typeof value === "object") {
        return Object.keys(value).length || context === "user" || context === "socialLinks"
            ? <RecordFields value={value} context={context} />
            : <span className="admin-data-missing">Not provided</span>;
    }
    return String(value);
};
const dateLabel = (value) => {
    const date = value ? new Date(value) : null;
    return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString() : "—";
};
const statusTone = (value) => {
    if (/^(verified|completed|approved|active)$/i.test(value)) return "positive";
    if (/^(rejected|failed|inactive)$/i.test(value)) return "negative";
    return "neutral";
};

const AdminDataCenter = () => {
    const [isAdmin] = useState(() => String(getCurrentUser()?.role || "").toLowerCase() === "admin");
    const [users, setUsers] = useState([]);
    const [accountTotal, setAccountTotal] = useState(null);
    const [summary, setSummary] = useState([]);
    const [overviewErrors, setOverviewErrors] = useState({ accounts: "", summary: "" });
    const [overviewLoading, setOverviewLoading] = useState(true);
    const [overviewRevision, setOverviewRevision] = useState(0);
    const [records, setRecords] = useState([]);
    const [resource, setResource] = useState("profiles");
    const [userId, setUserId] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(true);
    const [recordError, setRecordError] = useState("");
    const [recordRevision, setRecordRevision] = useState(0);
    const [expandedId, setExpandedId] = useState("");
    const refreshLock = useRef(false);

    useEffect(() => {
        if (!isAdmin) { setOverviewLoading(false); return; }
        let active = true;
        setOverviewLoading(true);
        setOverviewErrors({ accounts: "", summary: "" });
        const loadOverview = async () => {
            const results = await Promise.allSettled([
                getAdminUsers({ page: 1, limit: 100 }), getAdminDataSummary()
            ]);
            if (!active) return;
            const [accounts, collections] = results;
            const errors = { accounts: "", summary: "" };
            if (accounts.status === "fulfilled" && accounts.value?.success && Array.isArray(accounts.value.data)) {
                setUsers(accounts.value.data);
                const total = accounts.value.pagination?.total;
                setAccountTotal(Number.isSafeInteger(total) && total >= 0 ? total : null);
            } else {
                setUsers([]);
                setAccountTotal(null);
                errors.accounts = accounts.reason?.message || "Account information is unavailable.";
            }
            if (collections.status === "fulfilled" && collections.value?.success && Array.isArray(collections.value.data)) {
                setSummary(collections.value.data);
            } else {
                setSummary([]);
                errors.summary = collections.reason?.message || "Collection counts are unavailable.";
            }
            setOverviewErrors(errors);
            setOverviewLoading(false);
        };
        loadOverview();
        return () => { active = false; };
    }, [isAdmin, overviewRevision]);

    useEffect(() => {
        if (!isAdmin) { setLoading(false); return; }
        let active = true;
        setLoading(true);
        setRecordError("");
        setPagination(null);
        setExpandedId("");
        const loadRecords = async () => {
            try {
                const result = await getAdminDataRecords({ resource, userId, search, page, limit: 25 });
                if (!active) return;
                if (!result?.success || !Array.isArray(result.data) || !result.pagination || !Number.isSafeInteger(result.pagination.total)) {
                    throw new Error("The records response is unavailable. Please retry.");
                }
                setRecords(result.data);
                setPagination(result.pagination);
            } catch (err) {
                if (!active) return;
                setRecords([]);
                setPagination(null);
                setRecordError(err.message || "Could not load records.");
            } finally {
                if (active) setLoading(false);
            }
        };
        loadRecords();
        return () => { active = false; };
    }, [isAdmin, resource, userId, search, page, recordRevision]);

    useEffect(() => {
        if (!loading && !overviewLoading) refreshLock.current = false;
    }, [loading, overviewLoading]);

    const refresh = () => {
        if (refreshLock.current || loading || overviewLoading) return;
        refreshLock.current = true;
        setLoading(true);
        setOverviewLoading(true);
        setOverviewRevision((value) => value + 1);
        setRecordRevision((value) => value + 1);
    };
    const selectResource = (value) => { setResource(value); setPage(1); };
    const resourceLabel = RESOURCES.find(([value]) => value === resource)?.[1] || resource;
    const busy = loading || overviewLoading;
    const pages = pagination ? Math.max(1, pagination.pages || 1) : null;
    const counts = new Map(summary.map((item) => [item.resource, item.count]));
    const countLabel = (value) => Number.isSafeInteger(value) && value >= 0 ? value.toLocaleString() : "—";

    if (!isAdmin) return <div className="admin-data-page"><div className="admin-data-message"><h1>Admin access required</h1><p>Sign in with an authorized administrator account.</p></div></div>;

    return (
        <div className="admin-data-page">
            <header className="admin-data-header">
                <div><span className="admin-data-eyebrow">ADMINISTRATION</span><h1>Admin Data Center</h1><p>Inspect account-owned career records across your workspace.</p></div>
                <button type="button" className="admin-data-button secondary" onClick={refresh} disabled={busy}>{busy ? "Loading data…" : "Refresh data"}</button>
            </header>
            <p className="admin-data-scope-note">Read-only inspection · Changes and deletions are not available on this page.</p>
            <section className="admin-data-stats" aria-label="Data overview" aria-busy={overviewLoading}>
                <article><span>Registered accounts</span><strong>{overviewLoading ? "…" : countLabel(accountTotal)}</strong><small>{overviewLoading ? "Loading account information" : accountTotal === null ? "Total unavailable" : `${users.length} accounts loaded for owner filtering`}</small></article>
                <article><span>Resource collections</span><strong>{RESOURCES.length}</strong><small>Available for inspection</small></article>
                <article><span>Matching records</span><strong>{loading ? "…" : pagination ? countLabel(pagination.total) : "—"}</strong><small>{recordError ? "Record count unavailable" : `Current ${resourceLabel.toLowerCase()} filters`}</small></article>
            </section>
            {(overviewErrors.accounts || overviewErrors.summary) && <div className="admin-data-error" role="alert"><div><strong>Some overview information could not be loaded.</strong>{overviewErrors.accounts && <p>Accounts: {overviewErrors.accounts}</p>}{overviewErrors.summary && <p>Collections: {overviewErrors.summary}</p>}</div><button type="button" className="admin-data-button secondary" disabled={overviewLoading} onClick={() => setOverviewRevision((value) => value + 1)}>Retry overview</button></div>}

            <section className="admin-data-collections" aria-labelledby="collection-heading">
                <div className="admin-data-section-heading"><h2 id="collection-heading">Collections</h2><span>{overviewLoading ? "Loading counts…" : "Select a collection to browse"}</span></div>
                <nav className="admin-data-counts" aria-label="Resource collections">
                    {RESOURCES.map(([value, label]) => <button key={value} type="button" className={`admin-data-count${resource === value ? " active" : ""}`} aria-pressed={resource === value} onClick={() => selectResource(value)}><span>{label}</span><strong>{overviewLoading ? "…" : countLabel(counts.get(value))}</strong></button>)}
                </nav>
                {!overviewLoading && !overviewErrors.summary && summary.length === 0 && <p className="admin-data-subtitle">No collection counts were returned. You can still browse records below.</p>}
            </section>

            <section className="admin-data-panel" aria-labelledby="browse-records-heading">
                <div className="admin-data-panel-heading"><div><h2 id="browse-records-heading">{resourceLabel}</h2><p className="admin-data-subtitle">Browse records and inspect their stored details.</p></div><span className="admin-data-page-size">25 records per page</span></div>
                <div className="admin-data-filters">
                    <label>Resource<select value={resource} onChange={(event) => selectResource(event.target.value)}>{RESOURCES.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                    <label>Owner<select value={userId} disabled={overviewLoading || Boolean(overviewErrors.accounts)} onChange={(event) => {setUserId(event.target.value);setPage(1);}}><option value="">All users</option>{users.map((user) => <option key={user._id} value={user._id}>{user.name || user.email || user._id}{user.role === "admin" ? " (Admin)" : ""}</option>)}</select></label>
                    <form onSubmit={(event) => {event.preventDefault();setSearch(searchInput.trim());setPage(1);}}><label htmlFor="admin-data-search">Search records</label><div className="admin-data-search-row"><input id="admin-data-search" type="search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search this collection…"/><button type="submit" className="admin-data-button">Search</button></div></form>
                </div>
                {accountTotal !== null && accountTotal > users.length && !overviewLoading && <p className="admin-data-filter-note">The owner selector includes the first {users.length} of {accountTotal.toLocaleString()} accounts. All users includes every owner.</p>}
                <div className="admin-data-results" aria-busy={loading}>
                    {loading ? <div className="admin-data-empty" role="status"><strong>Loading {resourceLabel.toLowerCase()}…</strong><p>Retrieving records for your current filters.</p></div> : recordError ? <div className="admin-data-error" role="alert"><div><strong>Records could not be loaded</strong><p>{recordError}</p></div><button type="button" className="admin-data-button secondary" onClick={() => setRecordRevision((value) => value + 1)}>Retry records</button></div> : records.length === 0 ? <div className="admin-data-empty" role="status"><h3>No matching records</h3><p>Try another collection, owner, or search term.</p>{(search || userId) && <button type="button" className="admin-data-button secondary" onClick={() => {setSearch("");setSearchInput("");setUserId("");setPage(1);}}>Clear filters</button>}</div> : (
                        <div className="admin-data-table-wrap" role="region" aria-label={`${resourceLabel} records. Scroll horizontally to see all columns.`} tabIndex={0}>
                            <table className="admin-data-table"><caption className="admin-data-sr-only">{resourceLabel} records matching the current filters</caption><thead><tr><th scope="col">Record</th><th scope="col">Owner</th><th scope="col">Status / Type</th><th scope="col">Created</th><th scope="col">Details</th></tr></thead><tbody>
                                {records.map((record, index) => {
                                    const title = String(recordTitle(record, resource));
                                    const expanded = expandedId === record._id;
                                    const detailId = `admin-record-details-${index}`;
                                    const status = displayValue(record.verificationStatus || record.status || record.level || record.type || record.category);
                                    return <Fragment key={record._id}><tr className={expanded ? "admin-data-row-expanded" : ""}>
                                        <td><strong className="admin-data-record-title" title={title}>{title}</strong><small>{record._id}</small></td>
                                        <td>{typeof record.user === "object" ? record.user?.name || record.user?.email || record.user?._id || "Unknown" : record.user || "No owner"}{record.user?.email && record.user?.name && <small>{record.user.email}</small>}</td>
                                        <td><span className={`admin-data-status ${statusTone(status)}`}>{status}</span></td>
                                        <td>{dateLabel(record.createdAt)}</td>
                                        <td><button type="button" className="admin-data-view" aria-label={`${expanded ? "Hide" : "View"} details for ${title}`} aria-expanded={expanded} aria-controls={detailId} onClick={() => setExpandedId(expanded ? "" : record._id)}>{expanded ? "Hide" : "View"}</button></td>
                                    </tr><tr id={detailId} hidden={!expanded} className="admin-data-detail-row"><td colSpan={5}>{expanded && <section className="admin-data-record-details" aria-label={`Details for ${title}`}><h3>{title}</h3><p className="admin-data-subtitle">Stored record details · {record._id}</p><RecordFields value={record} /><details><summary>View raw JSON</summary><pre className="admin-data-json" tabIndex={0} role="region" aria-label="Raw record JSON">{JSON.stringify(record,null,2)}</pre></details></section>}</td></tr></Fragment>;
                                })}
                            </tbody></table>
                        </div>
                    )}
                </div>
                {!loading && !recordError && pagination && <div className="admin-data-pagination"><span role="status">Page {pagination.page || page} of {pages} · {countLabel(pagination.total)} records</span><div><button type="button" className="admin-data-button secondary" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button><button type="button" className="admin-data-button secondary" disabled={page >= pages} onClick={() => setPage((value) => value + 1)}>Next</button></div></div>}
            </section>
            <p className="admin-data-security-note">Access is restricted to authorized administrators and enforced by the backend. Collection counts describe stored records, not service health.</p>
        </div>
    );
};

function AdminDataCenterDesktopCanvas() {
    return (
        <div className="admin-data-desktop-scroll" role="region" aria-label="Admin Data Center page. Scroll horizontally to view all content on narrow screens." tabIndex={0}>
            <div className="admin-data-desktop-canvas">
                <AdminDataCenter />
            </div>
        </div>
    );
}

export default AdminDataCenterDesktopCanvas;
