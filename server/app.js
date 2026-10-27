
const express = require("express");
const cors = require("cors");

// =====================================================
// ROUTES
// =====================================================
const adminDataRoutes = require("./routes/adminDataRoutes");
const adminUserRoutes = require("./routes/adminUserRoutes");
const skillEvidenceReviewRoutes = require("./routes/skillEvidenceReviewRoutes");

const authRoutes = require("./routes/authRoutes");
const passwordResetRoutes = require("./routes/passwordResetRoutes");

const profileRoutes = require("./routes/profileRoutes");
const projectRoutes = require("./routes/projectRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const roadmapRoutes = require("./routes/roadmapRoutes");
const skillRoutes = require("./routes/skillRoutes");

const dsaRoutes = require("./routes/dsaRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const jobRoutes = require("./routes/jobRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const githubRoutes = require("./routes/githubRoutes");
const knowledgeRoutes = require("./routes/knowledgeRoutes");
const progressRoutes = require("./routes/progressRoutes");
const activityRoutes = require("./routes/activityRoutes");
const documentRoutes = require("./routes/documentRoutes");

// =====================================================
// MIDDLEWARE
// =====================================================
const rateLimitMiddleware = require("./middleware/rateLimitMiddleware");
const notFoundMiddleware = require("./middleware/notFoundMiddleware");
const errorMiddleware = require("./middleware/errorMiddleware");

// =====================================================
// CREATE EXPRESS APP
// =====================================================
const app = express();

// =====================================================
// CORS CONFIGURATION
// Supports Vite frontend on ports 5173 and 5174.
// =====================================================
const { corsOptions } = require("./config/runtime");
app.use(cors(corsOptions()));

// =====================================================
// BODY PARSERS
// =====================================================
app.use(express.json());

app.use(
    express.urlencoded({
        extended: true,
    })
);

// =====================================================
// REQUEST LOGGER
// =====================================================
app.use((req, res, next) => {
    console.log(
        `[${new Date().toISOString()}] ${req.method} ${req.path}`
    );

    next();
});

// =====================================================
// RATE LIMIT
// =====================================================
// Health probes do not consume the public API abuse budget.
const { liveness, readiness } = require("./controllers/healthController");
app.get("/api/health", liveness);
app.get("/api/ready", readiness);
app.use(rateLimitMiddleware);

// =====================================================
// AUTHENTICATION ROUTES
// =====================================================
app.use("/api/auth", authRoutes);

// =====================================================
// PASSWORD RESET ROUTES
// =====================================================
app.use("/api/auth", passwordResetRoutes);

// =====================================================
// PROFILE ROUTES
// =====================================================
app.use("/api/profile", profileRoutes);

// =====================================================
// PROJECT ROUTES
// =====================================================
app.use("/api/projects", projectRoutes);

// =====================================================
// RESUME ROUTES
// =====================================================
app.use("/api/resumes", resumeRoutes);

// =====================================================
// ROADMAP ROUTES
// =====================================================
app.use("/api/roadmaps", roadmapRoutes);

// =====================================================
// SKILLS AND SKILL EVIDENCE ROUTES
// =====================================================
app.use("/api/skills", skillRoutes);

// =====================================================
// ADMIN USER MANAGEMENT ROUTES
// =====================================================
app.use("/api/admin/users", adminUserRoutes);

// =====================================================
// ADMIN DATA CENTER
// =====================================================
app.use("/api/admin/data", adminDataRoutes);

// =====================================================
// ADMIN SKILL EVIDENCE REVIEW ROUTES
// =====================================================
app.use("/api/admin/skill-evidence", skillEvidenceReviewRoutes);

// =====================================================
// DSA ROUTES
// =====================================================
app.use("/api/dsa", dsaRoutes);

// =====================================================
// INTERVIEW ROUTES
// =====================================================
app.use("/api/interviews", interviewRoutes);

// =====================================================
// JOB ROUTES
// =====================================================
app.use("/api/jobs", jobRoutes);

// =====================================================
// NOTIFICATION ROUTES
// =====================================================
app.use("/api/notifications", notificationRoutes);

// =====================================================
// GITHUB ROUTES
// =====================================================
app.use("/api/github", githubRoutes);

// =====================================================
// KNOWLEDGE BASE ROUTES
// =====================================================
app.use("/api/knowledge", knowledgeRoutes);

// =====================================================
// PROGRESS ROUTES
// =====================================================
app.use("/api/progress", progressRoutes);

// =====================================================
// ACTIVITY ROUTES
// =====================================================
app.use("/api/activities", activityRoutes);

// =====================================================
// DOCUMENT ROUTES
// =====================================================
app.use("/api/documents", documentRoutes);

// =====================================================
// NOT FOUND MIDDLEWARE
// =====================================================
app.use(notFoundMiddleware);

// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================
app.use(errorMiddleware);

// =====================================================
// EXPORT APP
// =====================================================
module.exports = app;
