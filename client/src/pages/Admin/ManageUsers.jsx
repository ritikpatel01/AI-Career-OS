import { useCallback, useEffect, useRef, useState } from "react";

import {
    getAdminUsers,
    changeAdminUserRole
} from "../../services/adminUserService";

import "./ManageUsers.css";

const PAGE_SIZE = 25;

const ManageUsers = () => {
    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: PAGE_SIZE,
        total: 0,
        pages: 0
    });

    const [searchInput, setSearchInput] = useState("");
    const [query, setQuery] = useState({ page: 1, search: "", revision: 0 });
    const activeSearch = query.search;
    const queryRef = useRef(query);
    queryRef.current = query;
    const requestSequence = useRef(0);

    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState("");
    const [error, setError] = useState("");
    const [loadError, setLoadError] = useState(false);
    const [success, setSuccess] = useState("");

    const tableResizeObserver = useRef(null);
    const attachTable = useCallback(element => {
        tableResizeObserver.current?.disconnect();
        tableResizeObserver.current = null;
        if (!element) return;

        // A fresh result set and a changed viewport both start with User visible.
        element.scrollLeft = 0;
        let width = element.clientWidth;
        if (typeof ResizeObserver !== "undefined") {
            const observer = new ResizeObserver(() => {
                const nextWidth = element.clientWidth;
                if (nextWidth !== width) {
                    element.scrollLeft = 0;
                    width = nextWidth;
                }
            });
            observer.observe(element);
            tableResizeObserver.current = observer;
        }
    }, [users]);

    const loadUsers = useCallback(async () => {
        const requestId = ++requestSequence.current;
        const currentQuery = queryRef.current;
        try {
            setLoading(true);
            setError("");
            setLoadError(false);

            const response = await getAdminUsers({
                page: currentQuery.page,
                limit: PAGE_SIZE,
                search: currentQuery.search
            });

            if (requestId !== requestSequence.current) return;
            if (!Array.isArray(response?.data) || !response?.pagination ||
                !["page", "limit", "total", "pages"].every(key =>
                    Number.isInteger(response.pagination[key]) && response.pagination[key] >= 0
                ) || response.pagination.page < 1 || response.pagination.limit < 1) {
                throw new Error("Invalid user list response. Please refresh and try again.");
            }

            setUsers(response.data);
            setPagination(response.pagination);
        } catch (err) {
            if (requestId !== requestSequence.current) return;
            setUsers([]);
            setLoadError(true);
            setPagination({ page: currentQuery.page, limit: PAGE_SIZE, total: 0, pages: 0 });
            setError(
                err?.message ||
                    "Unable to load users. Check your admin permissions."
            );
        } finally {
            if (requestId === requestSequence.current) setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUsers();
        return () => { requestSequence.current++; };
    }, [loadUsers, query]);

    const requestUsers = (page, search) => {
        // Invalidate immediately, before React renders the next query/effect.
        requestSequence.current++;
        setLoading(true);
        setError("");
        setLoadError(false);
        setSuccess("");
        setQuery(previous => ({ page, search, revision: previous.revision + 1 }));
    };

    const handleSearch = (event) => {
        event.preventDefault();

        const search = searchInput.trim().replace(/\s+/gu, " ");
        setSearchInput(search);
        requestUsers(1, search);
    };

    const handleRefresh = () => {
        setSearchInput("");
        requestUsers(1, "");
    };

    const handleRoleChange = async (user, newRole) => {
        if (user.role === newRole) {
            return;
        }

        const action =
            newRole === "admin"
                ? `promote ${user.name || user.email} to admin`
                : `change ${user.name || user.email} back to a normal user`;

        const confirmed = window.confirm(
            `Are you sure you want to ${action}?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setUpdatingId(user._id);
            setError("");
            setSuccess("");

            const response = await changeAdminUserRole(
                user._id,
                newRole
            );

            setSuccess(
                response?.message || "User role updated successfully."
            );

            await loadUsers();
        } catch (err) {
            setError(
                err?.message || "Unable to update this user's role."
            );
        } finally {
            setUpdatingId("");
        }
    };

    const changePage = (nextPage) => {
        requestUsers(nextPage, activeSearch);
    };

    return (
        <div className="manage-users-page">
            <header className="manage-users-header">
                <div>
                    <span className="manage-users-eyebrow">
                        ADMINISTRATION
                    </span>

                    <h1>Manage Users</h1>

                    <p>
                        Manage registered accounts and control
                        administrator access to AI Career OS.
                    </p>
                </div>
            </header>

            <section className="manage-users-stats">
                <article className="manage-users-stat">
                    <span>{activeSearch ? "Matching accounts" : "Total registered users"}</span>

                    <strong>
                        {loading || loadError ? "—" : pagination.total}
                    </strong>

                    <small>
                        {activeSearch ? `Results for “${activeSearch}”` : "All registered accounts"}
                    </small>
                </article>

                <article className="manage-users-stat">
                    <span>Showing on this page</span>

                    <strong>{loading || loadError ? "—" : users.length}</strong>

                    <small>
                        Maximum {PAGE_SIZE} accounts per page
                    </small>
                </article>
            </section>

            {error && (
                <div
                    className="manage-users-alert manage-users-alert-error"
                    role="alert"
                >
                    {error}
                </div>
            )}

            {success && (
                <div
                    className="manage-users-alert manage-users-alert-success"
                    role="status"
                >
                    {success}
                </div>
            )}

            <section className="manage-users-panel">
                <div className="manage-users-panel-heading">
                    <div>
                        <h2>Registered accounts</h2>

                        <p>
                            Search accounts by name or email address.
                        </p>
                    </div>
                </div>

                <form
                    className="manage-users-search"
                    onSubmit={handleSearch}
                >
                    <input
                        type="search"
                        value={searchInput}
                        onChange={(event) =>
                            setSearchInput(event.target.value)
                        }
                        placeholder="Search name or email..."
                        aria-label="Search users"
                    />

                    <button type="submit" disabled={Boolean(updatingId)}>
                        Search
                    </button>

                    <button
                        type="button"
                        className="manage-users-refresh"
                        onClick={handleRefresh}
                        disabled={Boolean(updatingId)}
                    >
                        Refresh
                    </button>
                </form>

                {loading ? (
                    <div className="manage-users-state">
                        <div className="manage-users-spinner" />

                        <p>Loading registered users...</p>
                    </div>
                ) : loadError ? (
                    <div className="manage-users-state">
                        <h3>Unable to load accounts</h3>
                        <p>Use Refresh to retry loading the complete user list.</p>
                    </div>
                ) : users.length === 0 ? (
                    <div className="manage-users-state">
                        <span className="manage-users-empty-icon">
                            👥
                        </span>

                        <h3>No users found</h3>

                        <p>
                            Try another search or refresh the list.
                        </p>
                    </div>
                ) : (
                    <>
                    <p className="manage-users-table-hint">
                        Scroll horizontally to view all account details.
                    </p>
                    <div className="manage-users-table-wrapper" ref={attachTable} tabIndex={0}>
                        <table className="manage-users-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Registered</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {users.map((user) => (
                                    <tr key={user._id}>
                                        <td>
                                            <div className="manage-users-user">
                                                <div className="manage-users-avatar">
                                                    {(
                                                        user.name ||
                                                        user.email ||
                                                        "U"
                                                    )
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </div>

                                                <strong>
                                                    {user.name || "Unnamed user"}
                                                </strong>
                                            </div>
                                        </td>

                                        <td className="manage-users-email">
                                            {user.email}
                                        </td>

                                        <td>
                                            <span
                                                className={`manage-users-role ${
                                                    user.role === "admin"
                                                        ? "manage-users-role-admin"
                                                        : "manage-users-role-user"
                                                }`}
                                            >
                                                {user.role === "admin"
                                                    ? "Admin"
                                                    : "Normal User"}
                                            </span>
                                        </td>

                                        <td>
                                            {user.createdAt
                                                ? new Date(
                                                      user.createdAt
                                                  ).toLocaleDateString()
                                                : "—"}
                                        </td>

                                        <td>
                                            {user.role === "admin" ? (
                                                <button
                                                    type="button"
                                                    className="manage-users-demote"
                                                    onClick={() =>
                                                        handleRoleChange(
                                                            user,
                                                            "user"
                                                        )
                                                    }
                                                    disabled={
                                                        Boolean(updatingId)
                                                    }
                                                >
                                                    {updatingId === user._id
                                                        ? "Updating..."
                                                        : "Make User"}
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="manage-users-promote"
                                                    onClick={() =>
                                                        handleRoleChange(
                                                            user,
                                                            "admin"
                                                        )
                                                    }
                                                    disabled={
                                                        Boolean(updatingId)
                                                    }
                                                >
                                                    {updatingId === user._id
                                                        ? "Updating..."
                                                        : "Make Admin"}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    </>
                )}

                {!loading && !loadError && <div className="manage-users-pagination">
                    <span>
                        Page {pagination.page} of{" "}
                        {Math.max(1, pagination.pages)}
                    </span>

                    <div>
                        <button
                            type="button"
                            onClick={() =>
                                changePage(pagination.page - 1)
                            }
                            disabled={
                                loading || pagination.page <= 1
                            }
                        >
                            Previous
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                changePage(pagination.page + 1)
                            }
                            disabled={
                                loading ||
                                pagination.page >= pagination.pages
                            }
                        >
                            Next
                        </button>
                    </div>
                </div>}
            </section>

            <p className="manage-users-security-note">
                🔒 Role changes require server-side admin authorization.
                The backend prevents self-role changes and demotion of the
                last administrator.
            </p>
        </div>
    );
};

function ManageUsersDesktopCanvas() {
    return (
        <div className="manage-users-desktop-scroll" role="region" aria-label="Manage Users page. Scroll horizontally to view all content on narrow screens." tabIndex={0}>
            <div className="manage-users-desktop-canvas">
                <ManageUsers />
            </div>
        </div>
    );
}

export default ManageUsersDesktopCanvas;
