
import { useEffect } from "react";

import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";

// =========================================
// LANDING PAGE
// =========================================
import Landing from "./pages/Landing/Landing";

// =========================================
// SETTINGS PAGE
// =========================================
import Settings from "./pages/Settings/Settings";

// =========================================
// ADMIN PAGES
// =========================================
import ManageUsers from "./pages/Admin/ManageUsers";
import SkillEvidenceReview from "./pages/Admin/SkillEvidenceReview";
import AdminDataCenter from "./pages/Admin/AdminDataCenter";

// =========================================
// AUTHENTICATION PAGES
// =========================================
import ForgotPassword from "./pages/Auth/ForgotPassword";
import ResetPassword from "./pages/Auth/ResetPassword";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";

// =========================================
// MAIN APPLICATION PAGES
// =========================================
import Dashboard from "./pages/Dashboard/Dashboard";
import Profile from "./pages/Profile/Profile";
import Projects from "./pages/Projects/Projects";
import Resume from "./pages/Resume/Resume";
import Roadmap from "./pages/Roadmap/Roadmap";
import Skills from "./pages/Skills/Skills";
import DSA from "./pages/DSA/DSA";
import Interview from "./pages/Interview/Interview";
import Jobs from "./pages/Jobs/Jobs";
import Notifications from "./pages/Notifications/Notifications";
import GitHub from "./pages/GitHub/GitHub";
import Knowledge from "./pages/KnowledgeBase/KnowledgeBase";
import Progress from "./pages/Progress/Progress";
import Activities from "./pages/Activities/Activities";
import Documents from "./pages/Documents/Documents";

// =========================================
// COMMON COMPONENTS
// =========================================
import ProtectedRoute from "./components/common/ProtectedRoute";
import Layout from "./components/common/Layout";

// =========================================
// GLOBAL THEME INITIALIZATION
// =========================================
const App = () => {
    useEffect(() => {
        const applySavedTheme = () => {
            try {
                const savedSettings = JSON.parse(
                    localStorage.getItem("ai-career-os-settings") || "{}"
                );

                const theme =
                    savedSettings.theme === "dark" ? "dark" : "light";

                document.documentElement.dataset.theme = theme;
                document.body.dataset.theme = theme;
                document.documentElement.style.colorScheme = theme;
                document.body.style.colorScheme = theme;
            } catch (error) {
                console.error("Unable to load saved theme:", error);

                document.documentElement.dataset.theme = "light";
                document.body.dataset.theme = "light";
                document.documentElement.style.colorScheme = "light";
                document.body.style.colorScheme = "light";
            }
        };

        applySavedTheme();
    }, []);

    return (
        <BrowserRouter>
            <Routes>

                {/* =====================================
                    PUBLIC ROUTES
                    Accessible without login
                ===================================== */}

                <Route
                    path="/"
                    element={<Landing />}
                />

                {/* Authentication */}
                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/register"
                    element={<Register />}
                />

                <Route
                    path="/forgot-password"
                    element={<ForgotPassword />}
                />

                <Route
                    path="/reset-password"
                    element={<ResetPassword />}
                />

                {/* =====================================
                    PROTECTED APPLICATION ROUTES
                    Requires authentication
                ===================================== */}

                <Route
                    element={
                        <ProtectedRoute>
                            <Layout />
                        </ProtectedRoute>
                    }
                >

                    {/* DASHBOARD */}
                    <Route
                        path="/dashboard"
                        element={<Dashboard />}
                    />

                    {/* PROFILE */}
                    <Route
                        path="/profile"
                        element={<Profile />}
                    />

                    {/* PROJECTS */}
                    <Route
                        path="/projects"
                        element={<Projects />}
                    />

                    {/* RESUME */}
                    <Route
                        path="/resume"
                        element={<Resume />}
                    />

                    {/* CAREER ROADMAP */}
                    <Route
                        path="/roadmap"
                        element={<Roadmap />}
                    />

                    {/* SKILLS */}
                    <Route
                        path="/skills"
                        element={<Skills />}
                    />

                    {/* DATA STRUCTURES AND ALGORITHMS */}
                    <Route
                        path="/dsa"
                        element={<DSA />}
                    />

                    {/* INTERVIEW PREPARATION */}
                    <Route
                        path="/interview"
                        element={<Interview />}
                    />

                    {/* JOBS */}
                    <Route
                        path="/jobs"
                        element={<Jobs />}
                    />

                    {/* NOTIFICATIONS */}
                    <Route
                        path="/notifications"
                        element={<Notifications />}
                    />

                    {/* GITHUB INTEGRATION */}
                    <Route
                        path="/github"
                        element={<GitHub />}
                    />

                    {/* KNOWLEDGE BASE */}
                    <Route
                        path="/knowledge"
                        element={<Knowledge />}
                    />

                    {/* PROGRESS TRACKING */}
                    <Route
                        path="/progress"
                        element={<Progress />}
                    />

                    {/* ACTIVITIES */}
                    <Route
                        path="/activities"
                        element={<Activities />}
                    />

                    {/* DOCUMENTS */}
                    <Route
                        path="/documents"
                        element={<Documents />}
                    />

                    {/* SETTINGS PAGE */}
                    <Route
                        path="/settings"
                        element={<Settings />}
                    />

                    {/* ADMIN PAGES */}
                    <Route
                        path="/admin/users"
                        element={<ManageUsers />}
                    />

                    <Route
                        path="/admin/evidence"
                        element={<SkillEvidenceReview />}
                    />

                    <Route
                        path="/admin/data"
                        element={<AdminDataCenter />}
                    />

                </Route>

                {/* =====================================
                    UNKNOWN ROUTES
                ===================================== */}

                <Route
                    path="*"
                    element={
                        <Navigate
                            to="/"
                            replace
                        />
                    }
                />

            </Routes>
        </BrowserRouter>
    );
};

export default App;
