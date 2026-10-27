
import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../layout/Sidebar";

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
    const location = useLocation();
    const user = getCurrentUser();

    const isAdmin =
        String(user?.role || "").trim().toLowerCase() === "admin";

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

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isMobileMenuOpen]);

    // Close the drawer when returning to desktop width.
    useEffect(() => {
        const mediaQuery = window.matchMedia("(min-width: 769px)");

        const handleScreenChange = (event) => {
            if (event.matches) {
                setIsMobileMenuOpen(false);
            }
        };

        mediaQuery.addEventListener("change", handleScreenChange);

        return () => {
            mediaQuery.removeEventListener("change", handleScreenChange);
        };
    }, []);

    return (
        <div className="app-layout">
            <button
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
                    onClick={closeMobileMenu}
                    aria-label="Close navigation menu"
                />
            )}

            <Sidebar
                isAdmin={isAdmin}
                isMobileMenuOpen={isMobileMenuOpen}
                onNavigate={closeMobileMenu}
            />

            <main className="app-main">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
