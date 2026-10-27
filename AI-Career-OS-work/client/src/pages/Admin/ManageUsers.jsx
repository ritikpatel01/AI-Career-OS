import { useCallback, useEffect, useState } from "react";

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
    const [activeSearch, setActiveSearch] = useState("");

    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const loadUsers = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await getAdminUsers({
                page: pagination.page,
                limit: PAGE_SIZE,
                search: activeSearch
            });

            setUsers(
                Array.isArray(response?.data)
                    ? response.data
                    : []
            );

            setPagination((previous) => ({
                ...previous,
                ...(response?.pagination || {})
            }));
        } catch (err) {
            setUsers([]);
            setError(
                err?.message ||
                    "Unable to load users. Check your admin permissions."
            );
        } finally {
            setLoading(false);
        }
    }, [pagination.page, activeSearch]);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    const handleSearch = (event) => {
        event.preventDefault();

        setPagination((previous) => ({
            ...previous,
            page: 1
        }));

        setActiveSearch(searchInput.trim());
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
        setPagination((previous) => ({
            ...previous,
            page: nextPage
        }));
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

                <div className="manage-users-header-icon">
                    🛡️
                </div>
            </header>

            <section className="manage-users-stats">
                <article className="manage-users-stat">
                    <span>Total registered users</span>

                    <strong>
                        {pagination.total}
                    </strong>

                    <small>
                        Accounts matching your search
                    </small>
                </article>

                <article className="manage-users-stat">
                    <span>Showing on this page</span>

                    <strong>{users.length}</strong>

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

                    <button
                        type="button"
                        className="manage-users-refresh"
                        onClick={loadUsers}
                        disabled={loading || Boolean(updatingId)}
                    >
                        Refresh
                    </button>
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

                    <button type="submit" disabled={loading}>
                        Search
                    </button>
                </form>

                {loading ? (
                    <div className="manage-users-state">
                        <div className="manage-users-spinner" />

                        <p>Loading registered users...</p>
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
                    <div className="manage-users-table-wrapper">
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
                )}

                <div className="manage-users-pagination">
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
                </div>
            </section>

            <p className="manage-users-security-note">
                🔒 Role changes require server-side admin authorization.
                The backend prevents self-role changes and demotion of the
                last administrator.
            </p>
        </div>
    );
};

export default ManageUsers;