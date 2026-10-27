
import { NavLink } from "react-router-dom";
import "./Sidebar.css";

const mainNavigation = [
    { label: "Dashboard", path: "/dashboard", icon: "▦" },
    { label: "Profile", path: "/profile", icon: "◉" },
    { label: "Projects", path: "/projects", icon: "▣" },
    { label: "Resume", path: "/resume", icon: "▤" },
    { label: "Roadmap", path: "/roadmap", icon: "⌁" },
    { label: "Skills", path: "/skills", icon: "✳" },
    { label: "DSA", path: "/dsa", icon: "⌘" },
    { label: "Interview", path: "/interview", icon: "◎" },
    { label: "Jobs", path: "/jobs", icon: "▱" },
    { label: "Notifications", path: "/notifications", icon: "♧" },
    { label: "GitHub", path: "/github", icon: "⌘" },
    { label: "Knowledge", path: "/knowledge", icon: "▧" },
    { label: "Progress", path: "/progress", icon: "↗" },
    { label: "Activities", path: "/activities", icon: "◷" },
    { label: "Documents", path: "/documents", icon: "▤" },
];

const preferencesNavigation = [
    { label: "Settings", path: "/settings", icon: "⚙" },
];

const adminNavigation = [
    { label: "Manage Users", path: "/admin/users", icon: "♙" },
    { label: "Evidence Review", path: "/admin/evidence", icon: "✓" },
    { label: "Admin Data Center", path: "/admin/data", icon: "▦" },
];

const SidebarLink = ({ item, onNavigate }) => (
    <NavLink
        to={item.path}
        end={item.path === "/dashboard"}
        onClick={onNavigate}
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
    </NavLink>
);

const Sidebar = ({
    isAdmin = false,
    isMobileMenuOpen = false,
    onNavigate = () => {},
}) => {
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
                <p className="sidebar-section-title">
                    WORKSPACE
                </p>

                {mainNavigation.map((item) => (
                    <SidebarLink
                        key={item.path}
                        item={item}
                        onNavigate={onNavigate}
                    />
                ))}

                <p className="sidebar-section-title sidebar-settings-heading">
                    PREFERENCES
                </p>

                {preferencesNavigation.map((item) => (
                    <SidebarLink
                        key={item.path}
                        item={item}
                        onNavigate={onNavigate}
                    />
                ))}

                {isAdmin && (
                    <div className="sidebar-admin-section">
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
                    </div>
                )}
            </nav>

            <div className="sidebar-footer">
                <div
                    className="sidebar-footer-icon"
                    aria-hidden="true"
                >
                    ✦
                </div>

                <div className="sidebar-footer-content">
                    <strong>Keep growing.</strong>

                    <p>
                        Learn, build, and move your career forward.
                    </p>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
