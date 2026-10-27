const express = require("express");

const {
    getProfile,
    getRepositories,
    analyzeProfile
} = require("../controllers/githubController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


// ============================================================
// ANALYZE GITHUB PROFILE
// ============================================================
//
// POST /api/github/analyze
//
// Body:
// {
//     "username": "your-github-username",
//     "role": "Full Stack Developer"
// }
//
// This route:
// 1. Gets GitHub data
// 2. Analyzes repositories
// 3. Analyzes documentation
// 4. Analyzes technologies
// 5. Analyzes activity
// 6. Calculates career alignment
// 7. Generates weaknesses
// 8. Generates improvement plan
//

router.post(
    "/analyze",
    authMiddleware,
    analyzeProfile
);


// ============================================================
// GET GITHUB REPOSITORIES
// ============================================================
//
// GET /api/github/:username/repositories
//
// Example:
// GET /api/github/ritikpatel/repositories
//
// Authentication required.
//

router.get(
    "/:username/repositories",
    authMiddleware,
    getRepositories
);


// ============================================================
// GET GITHUB PROFILE
// ============================================================
//
// GET /api/github/:username
//
// Example:
// GET /api/github/ritikpatel
//
// Authentication required.
//

router.get(
    "/:username",
    authMiddleware,
    getProfile
);


// ============================================================
// EXPORT ROUTER
// ============================================================

module.exports = router;