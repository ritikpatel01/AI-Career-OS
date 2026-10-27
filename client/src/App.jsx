
import { lazy, useEffect } from "react";
import "./styles/routeStyles.js";
import RouteContent from "./components/common/RouteContent";

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
const Settings = lazy(() => import("./pages/Settings/Settings"));

// =========================================
// ADMIN PAGES
// =========================================
const ManageUsers = lazy(() => import("./pages/Admin/ManageUsers"));
const SkillEvidenceReview = lazy(() => import("./pages/Admin/SkillEvidenceReview"));
const AdminDataCenter = lazy(() => import("./pages/Admin/AdminDataCenter"));

// =========================================
// AUTHENTICATION PAGES
// =========================================
const ForgotPassword = lazy(() => import("./pages/Auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/Auth/ResetPassword"));
const Login = lazy(() => import("./pages/Auth/Login"));
const Register = lazy(() => import("./pages/Auth/Register"));

// =========================================
// MAIN APPLICATION PAGES
// =========================================
const Dashboard = lazy(() => import("./pages/Dashboard/Dashboard"));
const Profile = lazy(() => import("./pages/Profile/Profile"));
const Projects = lazy(() => import("./pages/Projects/Projects"));
const Resume = lazy(() => import("./pages/Resume/Resume"));
const Roadmap = lazy(() => import("./pages/Roadmap/Roadmap"));
const Skills = lazy(() => import("./pages/Skills/Skills"));
const DSA = lazy(() => import("./pages/DSA/DSA"));
const Interview = lazy(() => import("./pages/Interview/Interview"));
const Jobs = lazy(() => import("./pages/Jobs/Jobs"));
const Notifications = lazy(() => import("./pages/Notifications/Notifications"));
const GitHub = lazy(() => import("./pages/GitHub/GitHub"));
const Knowledge = lazy(() => import("./pages/KnowledgeBase/KnowledgeBase"));
const Progress = lazy(() => import("./pages/Progress/Progress"));
const Activities = lazy(() => import("./pages/Activities/Activities"));
const Documents = lazy(() => import("./pages/Documents/Documents"));

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
                    savedSettings.theme === "light" ||
                    savedSettings.theme === "dark"
                        ? savedSettings.theme
                        : "dark";

                if (document.documentElement.dataset.theme !== theme) {
                    document.documentElement.dataset.theme = theme;
                }
                if (document.body.dataset.theme !== theme) {
                    document.body.dataset.theme = theme;
                }
                if (document.documentElement.style.colorScheme !== theme) {
                    document.documentElement.style.colorScheme = theme;
                }
                if (document.body.style.colorScheme !== theme) {
                    document.body.style.colorScheme = theme;
                }
            } catch (error) {
                console.error("Unable to load saved theme:", error);

                if (document.documentElement.dataset.theme !== "dark") {
                    document.documentElement.dataset.theme = "dark";
                }
                if (document.body.dataset.theme !== "dark") {
                    document.body.dataset.theme = "dark";
                }
                if (document.documentElement.style.colorScheme !== "dark") {
                    document.documentElement.style.colorScheme = "dark";
                }
                if (document.body.style.colorScheme !== "dark") {
                    document.body.style.colorScheme = "dark";
                }
            }
        };

        applySavedTheme();
    }, []);

    return (
        <BrowserRouter>
            <RouteContent>
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
            </RouteContent>
        </BrowserRouter>
    );
};

export default App;
