// ============================================================
// AI CAREER OS
// GITHUB CONTROLLER
// ============================================================

const {
    getGithubUser,
    getGithubRepositories,
    collectGithubData
} = require("../services/githubService");

const {
    analyzeGithubData
} = require("../services/githubAnalysisService");


// ============================================================
// GET GITHUB PROFILE
// ============================================================

const getProfile = async (req, res) => {

    try {

        const {
            username
        } = req.params;


        const profile =
            await getGithubUser(
                username
            );


        return res.status(200).json({

            success: true,

            message:
                "GitHub profile fetched successfully",

            data:
                profile
        });

    } catch (error) {

        console.error(
            "GitHub Profile Error:",
            error.message
        );


        if (
            error.response?.status === 404
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "GitHub user not found"
            });
        }


        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch GitHub profile",

            error:
                error.message
        });
    }
};


// ============================================================
// GET GITHUB REPOSITORIES
// ============================================================

const getRepositories = async (
    req,
    res
) => {

    try {

        const {
            username
        } = req.params;


        const repositories =
            await getGithubRepositories(
                username
            );


        return res.status(200).json({

            success: true,

            message:
                "GitHub repositories fetched successfully",

            data:
                repositories
        });

    } catch (error) {

        console.error(
            "GitHub Repositories Error:",
            error.message
        );


        if (
            error.response?.status === 404
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "GitHub user not found"
            });
        }


        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch GitHub repositories",

            error:
                error.message
        });
    }
};


// ============================================================
// ANALYZE GITHUB PROFILE
// ============================================================
//
// POST /api/github/analyze
//
// Body:
//
// {
//     "username": "ritikpatel01",
//     "role": "Full Stack Developer"
// }
//
// ============================================================

const analyzeProfile = async (
    req,
    res
) => {

    try {

        const {
            username,
            role
        } = req.body;


        // ====================================================
        // VALIDATE USERNAME
        // ====================================================

        if (
            !username ||
            typeof username !== "string" ||
            !username.trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "GitHub username is required"
            });
        }


        // ====================================================
        // CLEAN USERNAME
        // ====================================================

        const cleanUsername =
            username
                .trim()
                .replace(/^@/, "")
                .replace(
                    /^https?:\/\/github\.com\//i,
                    ""
                )
                .replace(
                    /\/.*$/,
                    ""
                );


        // ====================================================
        // TARGET ROLE
        // ====================================================

        const cleanRole =
            typeof role === "string" &&
            role.trim()
                ? role.trim()
                : "Full Stack Developer";


        // ====================================================
        // LOG
        // ====================================================

        console.log(
            "================================="
        );

        console.log(
            "Starting GitHub Analysis"
        );

        console.log(
            `Username: ${cleanUsername}`
        );

        console.log(
            `Target Role: ${cleanRole}`
        );

        console.log(
            "================================="
        );


        // ====================================================
        // STEP 1
        // COLLECT REAL GITHUB DATA
        // ====================================================

        const githubData =
            await collectGithubData(
                cleanUsername
            );


        // ====================================================
        // STEP 2
        // ANALYZE GITHUB DATA
        // ====================================================

        const analysis =
            analyzeGithubData({

                username:
                    githubData.profile.login,

                role:
                    cleanRole,

                githubData
            });


        // ====================================================
        // SUCCESS RESPONSE
        // ====================================================

        console.log(
            "================================="
        );

        console.log(
            "GitHub Analysis Completed"
        );

        console.log(
            `Username: ${cleanUsername}`
        );

        console.log(
            `Health Score: ${analysis.analysis.healthScore}`
        );

        console.log(
            "================================="
        );


        return res.status(200).json({

            success: true,

            message:
                "GitHub profile analyzed successfully",

            data: {

                username:
                    githubData.profile.login,

                profile:
                    analysis.profile,

                repositories:
                    analysis.repositories,

                events:
                    githubData.events,

                analysis:
                    analysis.analysis
            }
        });

    } catch (error) {

        console.error(
            "================================="
        );

        console.error(
            "GitHub Analysis Error:",
            error.message
        );

        console.error(
            "================================="
        );


        // ====================================================
        // GITHUB USER NOT FOUND
        // ====================================================

        if (
            error.response?.status === 404
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "GitHub user or resource was not found"
            });
        }


        // ====================================================
        // GITHUB RATE LIMIT
        // ====================================================

        if (
            error.response?.status === 403
        ) {

            return res.status(429).json({

                success: false,

                message:
                    "GitHub API rate limit reached. Please configure GITHUB_TOKEN or try again later."
            });
        }


        // ====================================================
        // NETWORK ERROR
        // ====================================================

        if (
            error.code ===
            "ECONNABORTED"
        ) {

            return res.status(504).json({

                success: false,

                message:
                    "GitHub API request timed out. Please try again."
            });
        }


        // ====================================================
        // GENERAL ERROR
        // ====================================================

        return res.status(500).json({

            success: false,

            message:
                "Failed to analyze GitHub profile",

            error:
                error.message
        });
    }
};


// ============================================================
// EXPORTS
// ============================================================

module.exports = {

    getProfile,

    getRepositories,

    analyzeProfile
};