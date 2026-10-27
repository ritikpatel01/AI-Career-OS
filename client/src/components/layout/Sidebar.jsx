
import { useAuth } from "../../context/AuthContext";
import { NavLink, useNavigate } from "react-router-dom";
import "./Sidebar.css";

const navigationGroups = [
    { label: "Overview", items: [
        { label: "Dashboard", path: "/dashboard", icon: "▦" },
    ] },
    { label: "Learning", items: [
        { label: "Roadmap", path: "/roadmap", icon: "⌁" },
        { label: "Skills", path: "/skills", icon: "✳" },
        { label: "DSA", path: "/dsa", icon: "⌘" },
        { label: "Interview", path: "/interview", icon: "◎" },
    ] },
    { label: "Career", items: [
        { label: "Projects", path: "/projects", icon: "▣" },
        { label: "Resume", path: "/resume", icon: "▤" },
        { label: "Jobs", path: "/jobs", icon: "▱" },
        { label: "GitHub", path: "/github", icon: "⌘" },
    ] },
    { label: "Workspace", items: [
        { label: "Knowledge", path: "/knowledge", icon: "▧" },
        { label: "Documents", path: "/documents", icon: "▤" },
        { label: "Progress", path: "/progress", icon: "↗" },
        { label: "Activities", path: "/activities", icon: "◷" },
        { label: "Notifications", path: "/notifications", icon: "♧" },
    ] },
];

const accountNavigation = [
    { label: "Profile", path: "/profile", icon: "◉" },
    { label: "Settings", path: "/settings", icon: "⚙" },
];

const adminNavigation = [
    { label: "Manage Users", path: "/admin/users", icon: "♙" },
    { label: "Evidence Review", path: "/admin/evidence", icon: "✓" },
    { label: "Admin Data Center", path: "/admin/data", icon: "▦" },
];

const SidebarLink = ({ item, onNavigate, unreadCount }) => {
    const isNotificationsLink = item.path === "/notifications";
    const hasUnreadCount = Number.isInteger(unreadCount) && unreadCount > 0;

    return (
        <NavLink
            to={item.path}
            end={item.path === "/dashboard"}
            onClick={onNavigate}
            aria-label={isNotificationsLink
                ? unreadCount === null
                    ? "Notifications, unread count unavailable"
                    : hasUnreadCount
                        ? `Notifications, ${unreadCount} unread`
                        : "Notifications"
                : undefined}
            className={({ isActive }) =>
                `sidebar-link${isActive ? " active" : ""}`
            }
        >
            <span className="sidebar-link-icon" aria-hidden="true">
                {item.icon}
            </span>

            <span className="sidebar-link-label">
                {item.label}
            </span>

            {isNotificationsLink && hasUnreadCount && (
                <span className="sidebar-notification-badge" aria-hidden="true">
                    {unreadCount > 99 ? "99+" : unreadCount}
                </span>
            )}
        </NavLink>
    );
};

const Sidebar = ({
    isAdmin = false,
    isMobileMenuOpen = false,
    onNavigate,
    unreadCount = null,
}) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const accountName = typeof user?.name === "string" && user.name.trim() ? user.name.trim() : "Your account";
    const accountEmail = typeof user?.email === "string" ? user.email.trim() : "";
    const signOut = () => {
        logout();
        onNavigate?.();
        navigate("/login", { replace: true });
    };
    return (
        <aside
            id="career-sidebar"
            className={`sidebar${isMobileMenuOpen ? " sidebar-open" : ""}`}
            aria-label="Application sidebar"
        >
            <div className="sidebar-brand">
                <NavLink
                    to="/dashboard"
                    className="sidebar-brand-link"
                    onClick={onNavigate}
                >
                    <span
                        className="sidebar-brand-icon"
                        aria-hidden="true"
                    >
                        ✳
                    </span>

                    <span>AI Career OS</span>
                </NavLink>
            </div>

            <nav
                className="sidebar-navigation"
                aria-label="Main navigation"
            >
                {navigationGroups.map((group) => (
                    <div key={group.label}>
                        <p className="sidebar-section-title">{group.label}</p>
                        {group.items.map((item) => (
                            <SidebarLink key={item.path} item={item} onNavigate={onNavigate} unreadCount={unreadCount} />
                        ))}
                    </div>
                ))}

                {isAdmin && (
                    <>
                        <p className="sidebar-section-title sidebar-admin-heading">
                            ADMINISTRATION
                        </p>

                        {adminNavigation.map((item) => (
                            <SidebarLink
                                key={item.path}
                                item={item}
                                onNavigate={onNavigate}
                            />
                        ))}
                    </>
                )}
            </nav>

            <nav className="sidebar-account" aria-label="Account">
                <p className="sidebar-section-title">Account</p>
                <div className="sidebar-account-identity">
                    <strong>{accountName}</strong>
                    {accountEmail && <span>{accountEmail}</span>}
                </div>
                {accountNavigation.map((item) => (
                    <SidebarLink key={item.path} item={item} onNavigate={onNavigate} />
                ))}
                <button type="button" className="sidebar-link sidebar-signout" onClick={signOut}>
                    <span className="sidebar-link-icon" aria-hidden="true">↪</span>
                    <span className="sidebar-link-label">Sign out</span>
                </button>
            </nav>
        </aside>
    );
};

export default Sidebar;
