
import React from "react";
import ReactDOM from "react-dom/client";

import "./index.css";
import "./styles/theme.css";

import App from "./App";
import { AuthProvider } from "./context/AuthContext";

/* =========================================
   AI CAREER OS — GLOBAL THEME INITIALIZATION
   Dark mode is the default theme.
   A saved user preference takes priority.
========================================= */

const SETTINGS_KEY = "ai-career-os-settings";

function applySavedTheme() {
    let theme = "dark";

    try {
        const rawSettings = localStorage.getItem(SETTINGS_KEY);
        const savedSettings = rawSettings
            ? JSON.parse(rawSettings)
            : {};

        // Use light only when the user explicitly saved light mode.
        theme = savedSettings?.theme === "light" ? "light" : "dark";
    } catch (error) {
        console.error(
            "Unable to read saved theme settings:",
            error
        );
    }

    // Apply theme before React renders.
    document.documentElement.dataset.theme = theme;
    document.body.dataset.theme = theme;

    document.documentElement.style.colorScheme = theme;
    document.body.style.colorScheme = theme;

    return theme;
}

applySavedTheme();

/* =========================================
   RENDER APPLICATION
========================================= */

const rootElement = document.getElementById("root");

if (!rootElement) {
    throw new Error(
        'Root element not found. Check index.html for <div id="root"></div>.'
    );
}

ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
        <AuthProvider>
            <App />
        </AuthProvider>
    </React.StrictMode>
);
