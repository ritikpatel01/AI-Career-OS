
import { useCallback, useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../layout/Sidebar";
import RouteContent from "./RouteContent";
import "../../styles/navigation.css";
import { getNotifications } from "../../services/notificationService";

const getCurrentUser = () => {
    try {
        const storedUser =
            localStorage.getItem("user") ||
            sessionStorage.getItem("user");

        if (!storedUser) return null;

        const parsedUser = JSON.parse(storedUser);

        return parsedUser?.data?.user || parsedUser?.user || parsedUser;
    } catch (error) {
        console.error("Unable to read current user:", error);
        return null;
    }
};

const Layout = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const menuToggleRef = useRef(null);
    const unreadRequestPending = useRef(false);
    const [unreadCount, setUnreadCount] = useState(null);
    const location = useLocation();
    const isDashboard = location.pathname === "/dashboard";
    const user = getCurrentUser();

    const isAdmin =
        String(user?.role || "").trim().toLowerCase() === "admin";

    const syncUnreadCount = useCallback((notifications) => {
        if (!Array.isArray(notifications)) return;
        setUnreadCount(
            notifications.filter((notification) => notification?.isRead === false).length
        );
    }, []);

    const refreshUnreadCount = useCallback(async () => {
        if (navigator.onLine === false || unreadRequestPending.current) return false;
        unreadRequestPending.current = true;
        try {
            const response = await getNotifications();
            if (!Array.isArray(response?.data)) {
                throw new Error("Invalid notifications response");
            }
            syncUnreadCount(response.data);
            return true;
        } catch {
            // Keep the last confirmed count; null means no successful fetch yet.
            return false;
        } finally {
            unreadRequestPending.current = false;
        }
    }, [syncUnreadCount]);

    // Notifications loads the full list itself, so use that response on that route
    // instead of making a duplicate initial request from the shared layout.
    useEffect(() => {
        if (location.pathname !== "/notifications") {
            refreshUnreadCount();
        }

        const handleFocus = () => refreshUnreadCount();
        window.addEventListener("focus", handleFocus);
        window.addEventListener("online", handleFocus);
        const intervalId = window.setInterval(refreshUnreadCount, 60_000);

        return () => {
            window.removeEventListener("focus", handleFocus);
            window.removeEventListener("online", handleFocus);
            window.clearInterval(intervalId);
        };
    }, [location.pathname, refreshUnreadCount]);

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen((previous) => !previous);
    };

    // Close the drawer after navigating to another page.
    useEffect(() => {
        closeMobileMenu();
    }, [location.pathname]);

    // Close the drawer with Escape.
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                closeMobileMenu();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    // Lock background scrolling while the drawer is open.
    useEffect(() => {
        if (!isMobileMenuOpen) return undefined;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const sidebar = document.getElementById("career-sidebar");
        const links = () => [...sidebar.querySelectorAll('a[href], button:not([disabled])')];
        // Wait for the drawer's visibility rule to be applied before focusing it.
        const focusDrawer = () => {
            if (!sidebar.contains(document.activeElement)) links()[0]?.focus();
        };
        const focusFrame = window.requestAnimationFrame(focusDrawer);
        const handleTransitionEnd = (event) => {
            if (event.target === sidebar && event.propertyName === "transform") focusDrawer();
        };
        sidebar.addEventListener("transitionend", handleTransitionEnd);

        const containFocus = (event) => {
            if (event.key !== "Tab") return;
            const controls = [menuToggleRef.current, ...links()].filter(Boolean);
            const index = controls.indexOf(document.activeElement);
            if (event.shiftKey && index <= 0) {
                event.preventDefault();
                controls.at(-1)?.focus();
            } else if (!event.shiftKey && (index === -1 || index === controls.length - 1)) {
                event.preventDefault();
                controls[0]?.focus();
            }
        };
        document.addEventListener("keydown", containFocus);

        return () => {
            window.cancelAnimationFrame(focusFrame);
            sidebar.removeEventListener("transitionend", handleTransitionEnd);
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", containFocus);
            const zoomLayout = document.documentElement.dataset;
            if (zoomLayout.appZoom === "on" ? zoomLayout.appZoomCompact === "true" : window.matchMedia("(max-width: 768px)").matches) {
                menuToggleRef.current?.focus();
            }
        };
    }, [isMobileMenuOpen]);

    // Close the drawer when returning to desktop width.
    useEffect(() => {
        const mediaQuery = window.matchMedia("(min-width: 769px)");

        const handleScreenChange = () => {
            const zoomLayout = document.documentElement.dataset;
            const desktop = zoomLayout.appZoom === "on" ? zoomLayout.appZoomCompact !== "true" : mediaQuery.matches;
            if (desktop) {
                setIsMobileMenuOpen(false);
            }
        };

        mediaQuery.addEventListener("change", handleScreenChange);
        window.addEventListener("resize", handleScreenChange);

        return () => {
            mediaQuery.removeEventListener("change", handleScreenChange);
            window.removeEventListener("resize", handleScreenChange);
        };
    }, []);

    return (
        <div className="app-layout">
            <a className="skip-to-content" href="#main-content">Skip to content</a>
            <button
                ref={menuToggleRef}
                type="button"
                className="mobile-menu-toggle"
                onClick={toggleMobileMenu}
                aria-label={
                    isMobileMenuOpen
                        ? "Close navigation menu"
                        : "Open navigation menu"
                }
                aria-expanded={isMobileMenuOpen}
                aria-controls="career-sidebar"
            >
                <span className="mobile-menu-toggle-icon" aria-hidden="true">
                    {isMobileMenuOpen ? "✕" : "☰"}
                </span>

                <span className="mobile-menu-toggle-label">
                    AI Career OS
                </span>
            </button>

            {isMobileMenuOpen && (
                <button
                    type="button"
                    className="mobile-menu-backdrop"
                    tabIndex={-1}
                    onClick={closeMobileMenu}
                    aria-label="Close navigation menu"
                />
            )}

            <Sidebar
                isAdmin={isAdmin}
                isMobileMenuOpen={isMobileMenuOpen}
                onNavigate={closeMobileMenu}
                unreadCount={unreadCount}
            />

            <main id="main-content" className="app-main" tabIndex={-1} inert={isMobileMenuOpen}>
                {isDashboard ? (
                    <div className="dashboard-canvas-scroll" role="region" aria-label="Dashboard. Scroll horizontally to view all content on narrow screens." tabIndex={0}>
                        <div className="dashboard-canvas">
                            <RouteContent>
                                <Outlet context={{ refreshUnreadCount, syncUnreadCount }} />
                            </RouteContent>
                        </div>
                    </div>
                ) : (
                    <RouteContent>
                        <Outlet context={{ refreshUnreadCount, syncUnreadCount }} />
                    </RouteContent>
                )}
            </main>
        </div>
    );
};

export default Layout;
