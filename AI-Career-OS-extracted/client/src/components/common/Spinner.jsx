import { NavLink, useNavigate } from "react-router-dom";

// ============================================
// MAIN NAVIGATION
// ============================================

const navigationItems = [
    { label: "Dashboard", path: "/dashboard", icon: "🏠" },
    { label: "Profile", path: "/profile", icon: "👤" },
    { label: "Projects", path: "/projects", icon: "📁" },
    { label: "Resume", path: "/resume", icon: "📄" },
    { label: "Roadmap", path: "/roadmap", icon: "🧭" },
    { label: "Skills", path: "/skills", icon: "🧠" },
    { label: "DSA", path: "/dsa", icon: "💻" },
    { label: "Interview", path: "/interview", icon: "🎯" },
    { label: "Jobs", path: "/jobs", icon: "💼" },
    {
        label: "Notifications",
        path: "/notifications",
        icon: "🔔"
    },
    { label: "GitHub", path: "/github", icon: "🐙" },
    { label: "Knowledge", path: "/knowledge", icon: "📚" },
    { label: "Progress", path: "/progress", icon: "📈" },
    { label: "Activities", path: "/activities", icon: "⚡" },
    { label: "Documents", path: "/documents", icon: "🗂️" }
];

// ============================================
// ADMIN NAVIGATION
// ============================================

const adminNavigationItems = [
    {
        label: "Manage Users",
        path: "/admin/users",
        icon: "👥"
    },
    {
        label: "Evidence Review",
        path: "/admin/evidence",
        icon: "🛡️"
    }
];

// ============================================
// GET LOGGED-IN USER
// ============================================

const getStoredUser = () => {
    try {
        const storedUser =
            localStorage.getItem("user") ||
            sessionStorage.getItem("user");

        if (!storedUser) {
            return null;
        }

        const parsedUser = JSON.parse(storedUser);

        return (
            parsedUser?.user ||
            parsedUser?.data?.user ||
            parsedUser
        );
    } catch (error) {
        console.error(
            "Unable to read logged-in user:",
            error
        );

        return null;
    }
};

// ============================================
// SIDEBAR COMPONENT
// ============================================

const Sidebar = ({ isAdmin: adminProp }) => {
    const navigate = useNavigate();

    const user = getStoredUser();

    // Used only for displaying the admin navigation.
    // The backend must independently authorize admin APIs.
    const isAdmin =
        adminProp === true ||
        String(user?.role || "").toLowerCase() === "admin";

    // ========================================
    // LOGOUT
    // ========================================

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");

        sessionStorage.removeItem("token");
        sessionStorage.removeItem("authToken");
        sessionStorage.removeItem("user");

        navigate("/login", {
            replace: true
        });
    };

    // ========================================
    // RENDER NAVIGATION LINK
    // ========================================

    const renderNavigationLink = (item) => (
        <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
                `acos-sidebar-link ${
                    isActive ? "acos-sidebar-link-active" : ""
                }`
            }
        >
            <span
                className="acos-sidebar-icon"
                aria-hidden="true"
            >
                {item.icon}
            </span>

            <span className="acos-sidebar-link-label">
                {item.label}
            </span>
        </NavLink>
    );

    return (
        <>
            <style>{`
                .app-layout {
                    min-height: 100vh;
                }

                .acos-sidebar {
                    position: fixed;
                    top: 0;
                    left: 0;
                    bottom: 0;
                    z-index: 1000;
                    width: 254px;
                    display: flex;
                    flex-direction: column;
                    box-sizing: border-box;
                    background: #111827;
                    color: #f9fafb;
                    font-family: inherit;
                    border-right: 1px solid #263044;
                }

                .acos-sidebar-brand {
                    min-height: 82px;
                    box-sizing: border-box;
                    padding: 24px 28px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    flex-shrink: 0;
                    border-bottom: 1px solid #263044;
                }

                .acos-sidebar-brand-name {
                    margin: 0;
                    color: #ffffff;
                    font-size: 21px;
                    font-weight: 800;
                    letter-spacing: -0.5px;
                    white-space: nowrap;
                }

                .acos-sidebar-nav {
                    flex: 1;
                    min-height: 0;
                    overflow-y: auto;
                    padding: 16px 15px;
                    scrollbar-width: thin;
                    scrollbar-color: #364258 transparent;
                }

                .acos-sidebar-group-label {
                    margin: 22px 12px 10px;
                    color: #8e9ab0;
                    font-size: 10px;
                    font-weight: 800;
                    letter-spacing: 1.3px;
                }

                .acos-sidebar-link {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    min-height: 43px;
                    box-sizing: border-box;
                    margin: 4px 0;
                    padding: 10px 13px;
                    border-radius: 9px;
                    color: #e0e6f0;
                    text-decoration: none;
                    font-size: 14px;
                    font-weight: 500;
                    transition:
                        background 0.18s ease,
                        color 0.18s ease,
                        transform 0.18s ease;
                }

                .acos-sidebar-link:hover {
                    background: #202c42;
                    color: #ffffff;
                }

                .acos-sidebar-link-active {
                    background: #2861ed;
                    color: #ffffff;
                    font-weight: 700;
                }

                .acos-sidebar-link-active:hover {
                    background: #2861ed;
                    color: #ffffff;
                }

                .acos-sidebar-icon {
                    width: 22px;
                    flex-shrink: 0;
                    text-align: center;
                    font-size: 16px;
                }

                .acos-sidebar-link-label {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .acos-sidebar-admin-section {
                    margin-top: 22px;
                    padding-top: 8px;
                    border-top: 1px solid #303a4d;
                }

                .acos-sidebar-admin-badge {
                    margin-left: auto;
                    padding: 3px 6px;
                    border-radius: 5px;
                    background: #174b37;
                    color: #8ef0bc;
                    font-size: 9px;
                    font-weight: 800;
                    letter-spacing: 0.3px;
                }

                .acos-sidebar-footer {
                    flex-shrink: 0;
                    padding: 14px 15px;
                    border-top: 1px solid #263044;
                    background: #111827;
                }

                .acos-sidebar-account {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    min-width: 0;
                    padding: 8px 6px 12px;
                }

                .acos-sidebar-avatar {
                    display: grid;
                    width: 36px;
                    height: 36px;
                    flex-shrink: 0;
                    place-items: center;
                    border-radius: 50%;
                    background: #293854;
                    color: #ffffff;
                    font-size: 14px;
                    font-weight: 800;
                }

                .acos-sidebar-account-info {
                    display: flex;
                    flex: 1;
                    min-width: 0;
                    flex-direction: column;
                    gap: 4px;
                }

                .acos-sidebar-account-name {
                    overflow: hidden;
                    color: #ffffff;
                    font-size: 12px;
                    font-weight: 700;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .acos-sidebar-account-role {
                    color: #9daac0;
                    font-size: 11px;
                }

                .acos-sidebar-logout {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    gap: 11px;
                    padding: 10px 12px;
                    border: 1px solid #354056;
                    border-radius: 8px;
                    background: transparent;
                    color: #dce4f0;
                    font-family: inherit;
                    font-size: 13px;
                    font-weight: 600;
                    text-align: left;
                    cursor: pointer;
                    transition: background 0.18s ease;
                }

                .acos-sidebar-logout:hover {
                    background: #263349;
                }

                .app-main {
                    min-width: 0;
                    min-height: 100vh;
                    margin-left: 254px;
                    box-sizing: border-box;
                }

                @media (max-width: 800px) {
                    .acos-sidebar {
                        width: 220px;
                    }

                    .app-main {
                        margin-left: 220px;
                    }

                    .acos-sidebar-brand {
                        padding-left: 20px;
                    }

                    .acos-sidebar-brand-name {
                        font-size: 19px;
                    }

                    .acos-sidebar-nav {
                        padding-right: 10px;
                        padding-left: 10px;
                    }
                }

                @media (max-width: 560px) {
                    .acos-sidebar {
                        width: 72px;
                    }

                    .acos-sidebar-brand {
                        justify-content: center;
                        padding: 16px 4px;
                    }

                    .acos-sidebar-brand-name {
                        display: none;
                    }

                    .acos-sidebar-nav {
                        padding: 12px 8px;
                    }

                    .acos-sidebar-group-label {
                        overflow: hidden;
                        margin: 18px 0 8px;
                        font-size: 8px;
                        text-align: center;
                        white-space: nowrap;
                    }

                    .acos-sidebar-link {
                        justify-content: center;
                        gap: 0;
                        padding: 12px 4px;
                    }

                    .acos-sidebar-icon {
                        font-size: 18px;
                    }

                    .acos-sidebar-link-label,
                    .acos-sidebar-admin-badge {
                        display: none;
                    }

                    .acos-sidebar-footer {
                        padding: 10px 6px;
                    }

                    .acos-sidebar-account {
                        justify-content: center;
                        padding: 6px 0 10px;
                    }

                    .acos-sidebar-account-info {
                        display: none;
                    }

                    .acos-sidebar-logout {
                        justify-content: center;
                        padding: 11px 4px;
                        font-size: 0;
                    }

                    .acos-sidebar-logout-icon {
                        font-size: 16px;
                    }

                    .app-main {
                        margin-left: 72px;
                    }
                }
            `}</style>

            <aside className="acos-sidebar">
                {/* BRAND */}
                <div className="acos-sidebar-brand">
                    <span
                        aria-hidden="true"
                        style={{ fontSize: 24 }}
                    >
                        🧠
                    </span>

                    <h2 className="acos-sidebar-brand-name">
                        AI Career OS
                    </h2>
                </div>

                {/* MAIN NAVIGATION */}
                <nav
                    className="acos-sidebar-nav"
                    aria-label="Main navigation"
                >
                    {navigationItems.map(renderNavigationLink)}

                    {/* ADMIN-ONLY NAVIGATION */}
                    {isAdmin && (
                        <div className="acos-sidebar-admin-section">
                            <div className="acos-sidebar-group-label">
                                ADMINISTRATION
                            </div>

                            {adminNavigationItems.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) =>
                                        `acos-sidebar-link ${
                                            isActive
                                                ? "acos-sidebar-link-active"
                                                : ""
                                        }`
                                    }
                                >
                                    <span
                                        className="acos-sidebar-icon"
                                        aria-hidden="true"
                                    >
                                        {item.icon}
                                    </span>

                                    <span className="acos-sidebar-link-label">
                                        {item.label}
                                    </span>

                                    {item.path === "/admin/users" && (
                                        <span className="acos-sidebar-admin-badge">
                                            ADMIN
                                        </span>
                                    )}
                                </NavLink>
                            ))}
                        </div>
                    )}
                </nav>

                {/* ACCOUNT AND LOGOUT */}
                <div className="acos-sidebar-footer">
                    <div className="acos-sidebar-account">
                        <div className="acos-sidebar-avatar">
                            {(
                                user?.name ||
                                user?.email ||
                                "U"
                            )
                                .charAt(0)
                                .toUpperCase()}
                        </div>

                        <div className="acos-sidebar-account-info">
                            <span className="acos-sidebar-account-name">
                                {user?.name || "My Account"}
                            </span>

                            <span className="acos-sidebar-account-role">
                                {isAdmin ? "Administrator" : "Normal User"}
                            </span>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="acos-sidebar-logout"
                        onClick={handleLogout}
                    >
                        <span
                            className="acos-sidebar-logout-icon"
                            aria-hidden="true"
                        >
                            ↪
                        </span>

                        Sign Out
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;