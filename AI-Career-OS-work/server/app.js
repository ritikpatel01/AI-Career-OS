
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
// CORS
// Allow the local frontend and mobile frontend.
// =====================================================
const allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://10.22.17.193:5173",
];

app.use(
    cors({
        origin: allowedOrigins,
        credentials: true,
        methods: [
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS",
        ],
        allowedHeaders: [
            "Content-Type",
            "Authorization",
        ],
    })
);

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
        `[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`
    );

    next();
});

// =====================================================
// RATE LIMIT
// =====================================================
app.use(rateLimitMiddleware);

// =====================================================
// HEALTH CHECK
// GET /api/health
// =====================================================
app.get("/api/health", (req, res) => {
    return res.status(200).json({
        success: true,
        message: "AI Career OS API is running",
    });
});

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
