// ============================================================
// AI CAREER OS
// GITHUB ANALYSIS SERVICE
// ============================================================
//
// Purpose:
// Analyze REAL GitHub data collected by githubService.js.
//
// This service does NOT invent GitHub information.
// It analyzes:
// - Profile quality
// - Repository quality
// - Documentation
// - Technologies
// - GitHub activity
// - Target-role alignment
// - Weaknesses
// - Improvement plan
//
// ============================================================


// ============================================================
// ROLE TECHNOLOGY PROFILES
// ============================================================

const ROLE_TECHNOLOGIES = {

    "Full Stack Developer": [
        "JavaScript",
        "TypeScript",
        "React",
        "Node.js",
        "Express",
        "MongoDB",
        "SQL",
        "Git",
        "HTML",
        "CSS"
    ],

    "Frontend Developer": [
        "JavaScript",
        "TypeScript",
        "React",
        "HTML",
        "CSS",
        "Git"
    ],

    "Backend Developer": [
        "JavaScript",
        "TypeScript",
        "Node.js",
        "Express",
        "Python",
        "Java",
        "MongoDB",
        "SQL",
        "Git"
    ],

    "Software Engineer": [
        "JavaScript",
        "TypeScript",
        "Python",
        "Java",
        "C++",
        "SQL",
        "Git"
    ],

    "Java Developer": [
        "Java",
        "Spring",
        "Spring Boot",
        "SQL",
        "Git"
    ],

    "Python Developer": [
        "Python",
        "Django",
        "Flask",
        "FastAPI",
        "SQL",
        "Git"
    ],

    "Cloud Engineer": [
        "AWS",
        "Azure",
        "GCP",
        "Docker",
        "Kubernetes",
        "Linux",
        "Terraform",
        "Git"
    ],

    "DevOps Engineer": [
        "Docker",
        "Kubernetes",
        "AWS",
        "Azure",
        "Linux",
        "Terraform",
        "CI/CD",
        "Git"
    ],

    "Data Scientist": [
        "Python",
        "SQL",
        "Pandas",
        "NumPy",
        "Scikit-learn",
        "Jupyter"
    ],

    "Data Analyst": [
        "Python",
        "SQL",
        "Pandas",
        "NumPy",
        "Power BI",
        "Excel"
    ],

    "Machine Learning Engineer": [
        "Python",
        "TensorFlow",
        "PyTorch",
        "Scikit-learn",
        "NumPy",
        "Pandas"
    ],

    "AI Engineer": [
        "Python",
        "PyTorch",
        "TensorFlow",
        "Machine Learning",
        "NLP",
        "LLM"
    ],

    "Cybersecurity Engineer": [
        "Python",
        "Linux",
        "Bash",
        "Networking",
        "Docker"
    ],

    "Mechanical Engineer": [
        "Python",
        "MATLAB",
        "C++",
        "CAD"
    ],

    "Mechanical Design Engineer": [
        "CAD",
        "SolidWorks",
        "AutoCAD",
        "CATIA"
    ],

    "Manufacturing Engineer": [
        "CAD",
        "MATLAB",
        "Python",
        "CNC"
    ],

    "Production Engineer": [
        "Python",
        "MATLAB",
        "CAD"
    ],

    "Civil Engineer": [
        "AutoCAD",
        "Civil 3D",
        "MATLAB",
        "Python"
    ],

    "Structural Engineer": [
        "AutoCAD",
        "STAAD",
        "ETABS",
        "MATLAB"
    ],

    "Site Engineer": [
        "AutoCAD",
        "Civil 3D"
    ],

    "Construction Engineer": [
        "AutoCAD",
        "Civil 3D",
        "Project Management"
    ],

    "Electrical Engineer": [
        "MATLAB",
        "Simulink",
        "Python",
        "C",
        "C++"
    ],

    "Electrical Design Engineer": [
        "AutoCAD",
        "MATLAB",
        "Simulink"
    ],

    "Power Systems Engineer": [
        "MATLAB",
        "Simulink",
        "Power Systems"
    ],

    "Control Systems Engineer": [
        "MATLAB",
        "Simulink",
        "Python",
        "C++"
    ],

    "Electronics Engineer": [
        "C",
        "C++",
        "Python",
        "MATLAB"
    ],

    "Embedded Engineer": [
        "C",
        "C++",
        "Embedded C",
        "Arduino",
        "STM32"
    ],

    "Electronics Design Engineer": [
        "C",
        "C++",
        "MATLAB",
        "PCB"
    ],

    "VLSI Engineer": [
        "Verilog",
        "SystemVerilog",
        "VHDL",
        "C",
        "C++"
    ],

    "Automotive Engineer": [
        "C++",
        "MATLAB",
        "Simulink",
        "Python"
    ],

    "Automotive Design Engineer": [
        "CATIA",
        "SolidWorks",
        "AutoCAD",
        "MATLAB"
    ],

    "Automotive Manufacturing Engineer": [
        "CAD",
        "MATLAB",
        "Python"
    ],

    "Aerospace Engineer": [
        "MATLAB",
        "Python",
        "C++",
        "Simulink"
    ],

    "Aerospace Design Engineer": [
        "CAD",
        "CATIA",
        "MATLAB",
        "Python"
    ],

    "Avionics Engineer": [
        "C",
        "C++",
        "MATLAB",
        "Simulink",
        "Embedded"
    ],

    "Chemical Engineer": [
        "MATLAB",
        "Python",
        "Aspen"
    ],

    "Process Engineer": [
        "MATLAB",
        "Python",
        "Aspen"
    ],

    "Chemical Process Design Engineer": [
        "MATLAB",
        "Python",
        "Aspen"
    ],

    "Biomedical Engineer": [
        "Python",
        "MATLAB",
        "C++"
    ],

    "Medical Device Engineer": [
        "C",
        "C++",
        "MATLAB",
        "Python"
    ],

    "Clinical Engineer": [
        "Python",
        "MATLAB",
        "C++"
    ]
};


// ============================================================
// NORMALIZE TEXT
// ============================================================

const normalizeTechnology = (value) => {

    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
};


// ============================================================
// TECHNOLOGY ALIASES
// ============================================================

const TECHNOLOGY_ALIASES = {

    javascript: [
        "javascript",
        "js"
    ],

    typescript: [
        "typescript",
        "ts"
    ],

    react: [
        "react",
        "react.js",
        "reactjs"
    ],

    "node.js": [
        "node",
        "node.js",
        "nodejs"
    ],

    express: [
        "express",
        "express.js",
        "expressjs"
    ],

    mongodb: [
        "mongodb",
        "mongo",
        "mongo db"
    ],

    sql: [
        "sql",
        "mysql",
        "postgresql",
        "postgres"
    ],

    html: [
        "html",
        "html5"
    ],

    css: [
        "css",
        "css3"
    ],

    python: [
        "python",
        "python3"
    ],

    "c++": [
        "c++",
        "cpp"
    ],

    "c": [
        "c",
        "c programming"
    ],

    "scikit-learn": [
        "scikit-learn",
        "scikit learn",
        "sklearn"
    ],

    docker: [
        "docker"
    ],

    kubernetes: [
        "kubernetes",
        "k8s"
    ],

    "ci/cd": [
        "ci/cd",
        "ci cd",
        "continuous integration",
        "continuous deployment"
    ]
};


// ============================================================
// CHECK TECHNOLOGY MATCH
// ============================================================

const technologyMatches = (
    detectedTechnology,
    targetTechnology
) => {

    const detected =
        normalizeTechnology(
            detectedTechnology
        );

    const target =
        normalizeTechnology(
            targetTechnology
        );


    if (detected === target) {
        return true;
    }


    const aliases =
        TECHNOLOGY_ALIASES[target];


    if (!aliases) {
        return false;
    }


    return aliases.some(
        (alias) =>
            normalizeTechnology(alias) ===
            detected
    );
};


// ============================================================
// PROFILE ANALYSIS
// ============================================================

const analyzeProfile = (
    profile
) => {

    let score = 0;


    const checks = {

        hasName:
            Boolean(
                profile?.name
            ),

        hasBio:
            Boolean(
                profile?.bio &&
                profile.bio.trim()
            ),

        hasAvatar:
            Boolean(
                profile?.avatarUrl ||
                profile?.avatar_url
            ),

        hasLocation:
            Boolean(
                profile?.location
            ),

        hasWebsite:
            Boolean(
                profile?.blog
            ),

        hasRepositories:
            Number(
                profile?.publicRepos ??
                profile?.public_repos ??
                0
            ) > 0
    };


    if (checks.hasName) {
        score += 20;
    }

    if (checks.hasBio) {
        score += 25;
    }

    if (checks.hasAvatar) {
        score += 15;
    }

    if (checks.hasLocation) {
        score += 10;
    }

    if (checks.hasWebsite) {
        score += 20;
    }

    if (checks.hasRepositories) {
        score += 10;
    }


    return {

        score,

        checks
    };
};


// ============================================================
// REPOSITORY ANALYSIS
// ============================================================

const analyzeRepositories = (
    repositories
) => {

    const safeRepositories =
        Array.isArray(repositories)
            ? repositories
            : [];


    if (!safeRepositories.length) {

        return {

            score: 0,

            repositoryCount: 0,

            analysis: []
        };
    }


    const analysis =
        safeRepositories.map(
            (repository) => {

                const hasReadme =
                    Boolean(
                        repository.readme?.exists
                    );


                const hasDescription =
                    Boolean(
                        repository.description &&
                        repository.description.trim()
                    );


                const hasTopics =
                    Array.isArray(
                        repository.topics
                    ) &&
                    repository.topics.length > 0;


                const hasCommits =
                    Array.isArray(
                        repository.recentCommits
                    ) &&
                    repository.recentCommits.length > 0;


                let score = 0;


                if (hasDescription) {
                    score += 20;
                }


                if (hasReadme) {
                    score += 30;
                }


                if (hasTopics) {
                    score += 10;
                }


                if (hasCommits) {
                    score += 20;
                }


                if (
                    Number(
                        repository.stars || 0
                    ) > 0
                ) {
                    score += 10;
                }


                if (
                    repository.license
                ) {
                    score += 10;
                }


                return {

                    ...repository,

                    score,

                    metrics: {

                        stars:
                            repository.stars || 0,

                        forks:
                            repository.forks || 0,

                        hasReadme,

                        hasDescription,

                        hasTopics,

                        hasCommits
                    }
                };
            }
        );


    const totalScore =
        analysis.reduce(
            (
                total,
                repository
            ) =>
                total +
                repository.score,
            0
        );


    return {

        score:
            Math.round(
                totalScore /
                analysis.length
            ),

        repositoryCount:
            analysis.length,

        analysis:
            analysis.sort(
                (a, b) =>
                    b.score -
                    a.score
            )
    };
};


// ============================================================
// DOCUMENTATION ANALYSIS
// ============================================================

const analyzeDocumentation = (
    repositories
) => {

    const safeRepositories =
        Array.isArray(repositories)
            ? repositories
            : [];


    const total =
        safeRepositories.length;


    if (!total) {

        return {

            score: 0,

            totalRepositories: 0,

            repositoriesWithReadme: 0,

            repositoriesWithDescription: 0,

            recommendations: []
        };
    }


    const repositoriesWithReadme =
        safeRepositories.filter(
            (repository) =>
                repository.readme?.exists
        ).length;


    const repositoriesWithDescription =
        safeRepositories.filter(
            (repository) =>
                Boolean(
                    repository.description &&
                    repository.description.trim()
                )
        ).length;


    const readmePercentage =
        (
            repositoriesWithReadme /
            total
        ) * 100;


    const descriptionPercentage =
        (
            repositoriesWithDescription /
            total
        ) * 100;


    const score =
        Math.round(
            (
                readmePercentage * 0.60
            ) +
            (
                descriptionPercentage * 0.40
            )
        );


    const recommendations = [];


    if (
        repositoriesWithReadme <
        total
    ) {

        recommendations.push(
            "Add a clear README to repositories that do not have one."
        );
    }


    if (
        repositoriesWithDescription <
        total
    ) {

        recommendations.push(
            "Add concise descriptions explaining each project's purpose and technologies."
        );
    }


    if (
        repositoriesWithReadme === total
    ) {

        recommendations.push(
            "Keep README files focused on setup, features, architecture and usage."
        );
    }


    return {

        score,

        totalRepositories:
            total,

        repositoriesWithReadme,

        repositoriesWithDescription,

        recommendations
    };
};


// ============================================================
// TECHNOLOGY ANALYSIS
// ============================================================

const analyzeTechnologies = (
    repositories
) => {

    const technologyMap =
        new Map();


    for (
        const repository
        of repositories
    ) {

        const languages =
            repository.languages || {};


        for (
            const language
            of Object.keys(languages)
        ) {

            const normalized =
                normalizeTechnology(
                    language
                );


            if (!normalized) {
                continue;
            }


            const existing =
                technologyMap.get(
                    normalized
                );


            if (existing) {

                existing.repositoryCount += 1;

            } else {

                technologyMap.set(
                    normalized,
                    {
                        technology:
                            language,

                        repositoryCount:
                            1
                    }
                );
            }
        }
    }


    const technologies =
        Array.from(
            technologyMap.values()
        )
            .sort(
                (a, b) =>
                    b.repositoryCount -
                    a.repositoryCount
            );


    return {

        technologyCount:
            technologies.length,

        technologies
    };
};


// ============================================================
// ACTIVITY ANALYSIS
// ============================================================

const analyzeActivity = (
    events
) => {

    const safeEvents =
        Array.isArray(events)
            ? events
            : [];


    const pushEvents =
        safeEvents.filter(
            (event) =>
                event.type ===
                "PushEvent"
        ).length;


    const pullRequestEvents =
        safeEvents.filter(
            (event) =>
                event.type ===
                "PullRequestEvent"
        ).length;


    const issueEvents =
        safeEvents.filter(
            (event) =>
                event.type ===
                "IssuesEvent"
        ).length;


    const repositories =
        new Set(
            safeEvents
                .map(
                    (event) =>
                        event.repo
                )
                .filter(Boolean)
        );


    let score;


    if (safeEvents.length >= 20) {

        score = 100;

    } else if (safeEvents.length >= 10) {

        score = 80;

    } else if (safeEvents.length >= 5) {

        score = 65;

    } else if (safeEvents.length >= 1) {

        score = 45;

    } else {

        score = 20;
    }


    return {

        score,

        metrics: {

            totalEvents:
                safeEvents.length,

            pushEvents,

            pullRequestEvents,

            issueEvents,

            activeRepositories:
                repositories.size
        },

        note:
            safeEvents.length > 0
                ? "Recent public GitHub activity was detected."
                : "No recent public GitHub activity was available from the events endpoint."
    };
};


// ============================================================
// CAREER ALIGNMENT
// ============================================================

const analyzeCareerAlignment = (
    role,
    technologyData
) => {

    const targetTechnologies =
        ROLE_TECHNOLOGIES[role] || [];


    const detectedTechnologies =
        technologyData.technologies || [];


    const matchedTechnologies = [];


    const missingTechnologies = [];


    for (
        const targetTechnology
        of targetTechnologies
    ) {

        const matched =
            detectedTechnologies.find(
                (item) =>
                    technologyMatches(
                        item.technology,
                        targetTechnology
                    )
            );


        if (matched) {

            matchedTechnologies.push(
                targetTechnology
            );

        } else {

            missingTechnologies.push(
                targetTechnology
            );
        }
    }


    let score = 0;


    if (
        targetTechnologies.length
    ) {

        score =
            Math.round(
                (
                    matchedTechnologies.length /
                    targetTechnologies.length
                ) * 100
            );
    }


    return {

        score,

        role,

        matchedTechnologies,

        missingTechnologies,

        note:
            targetTechnologies.length
                ? `Detected ${matchedTechnologies.length} of ${targetTechnologies.length} configured technologies for ${role}.`
                : "No configured technology profile exists for this role yet."
    };
};


// ============================================================
// WEAKNESSES
// ============================================================

const generateWeaknesses = ({
    profile,
    repositories,
    documentation,
    careerAlignment,
    activity
}) => {

    const weaknesses = [];


    if (
        profile.score < 70
    ) {

        weaknesses.push({

            area: "Profile",

            priority: "High",

            issue:
                "Your GitHub profile is missing some professional profile information."
        });
    }


    if (
        repositories.score < 60
    ) {

        weaknesses.push({

            area: "Repositories",

            priority: "High",

            issue:
                "Some repositories can be improved through better descriptions, README files, topics or development evidence."
        });
    }


    if (
        documentation.score < 70
    ) {

        weaknesses.push({

            area: "Documentation",

            priority: "High",

            issue:
                "Some repositories do not have strong documentation signals."
        });
    }


    if (
        careerAlignment.score < 50
    ) {

        weaknesses.push({

            area: "Career Alignment",

            priority: "Medium",

            issue:
                `The detected technologies currently have limited overlap with the selected ${careerAlignment.role} role.`
        });
    }


    if (
        activity.score < 50
    ) {

        weaknesses.push({

            area: "Activity",

            priority: "Medium",

            issue:
                "Limited recent public activity was available from the GitHub events endpoint."
        });
    }


    return weaknesses;
};


// ============================================================
// IMPROVEMENT PLAN
// ============================================================

const generateImprovementPlan = ({
    profile,
    documentation,
    careerAlignment,
    activity
}) => {

    const plan = [];


    if (
        !profile.checks.hasBio
    ) {

        plan.push({

            priority: "High",

            area: "Profile",

            action:
                "Add a concise professional GitHub bio describing your technical focus and career direction."
        });
    }


    if (
        !profile.checks.hasWebsite
    ) {

        plan.push({

            priority: "Medium",

            area: "Portfolio",

            action:
                "Add your portfolio, LinkedIn profile or professional website to your GitHub profile."
        });
    }


    if (
        !documentation.totalRepositories ||
        documentation.score < 70
    ) {

        plan.push({

            priority: "High",

            area: "Documentation",

            action:
                "Improve README files for your most important repositories with project purpose, features, technologies, setup and usage."
        });
    }


    if (
        careerAlignment.missingTechnologies.length
    ) {

        plan.push({

            priority: "Medium",

            area: "Target Role",

            action:
                `Build or contribute to projects that demonstrate technologies relevant to ${careerAlignment.role}.`,

            technologies:
                careerAlignment
                    .missingTechnologies
                    .slice(0, 5)
        });
    }


    if (
        activity.score < 50
    ) {

        plan.push({

            priority: "Medium",

            area: "Activity",

            action:
                "Continue maintaining meaningful projects so your public GitHub profile reflects recent work."
        });
    }


    if (!plan.length) {

        plan.push({

            priority: "Low",

            area: "Maintenance",

            action:
                "Continue maintaining your strongest repositories and keep documentation current."
        });
    }


    return plan;
};


// ============================================================
// MAIN GITHUB ANALYZER
// ============================================================

const analyzeGithubData = ({
    username,
    role,
    githubData
}) => {

    const profile =
        githubData?.profile || {};


    const repositories =
        Array.isArray(
            githubData?.repositories
        )
            ? githubData.repositories
            : [];


    const events =
        Array.isArray(
            githubData?.events
        )
            ? githubData.events
            : [];


    // --------------------------------------------------------
    // Profile
    // --------------------------------------------------------

    const profileAnalysis =
        analyzeProfile(
            profile
        );


    // --------------------------------------------------------
    // Repositories
    // --------------------------------------------------------

    const repositoryAnalysis =
        analyzeRepositories(
            repositories
        );


    // --------------------------------------------------------
    // Documentation
    // --------------------------------------------------------

    const documentation =
        analyzeDocumentation(
            repositories
        );


    // --------------------------------------------------------
    // Technologies
    // --------------------------------------------------------

    const technologyData =
        analyzeTechnologies(
            repositories
        );


    // --------------------------------------------------------
    // Activity
    // --------------------------------------------------------

    const activity =
        analyzeActivity(
            events
        );


    // --------------------------------------------------------
    // Career Alignment
    // --------------------------------------------------------

    const careerAlignment =
        analyzeCareerAlignment(
            role,
            technologyData
        );


    // --------------------------------------------------------
    // Weaknesses
    // --------------------------------------------------------

    const weaknesses =
        generateWeaknesses({

            profile:
                profileAnalysis,

            repositories:
                repositoryAnalysis,

            documentation,

            careerAlignment,

            activity
        });


    // --------------------------------------------------------
    // Improvement Plan
    // --------------------------------------------------------

    const improvementPlan =
        generateImprovementPlan({

            profile:
                profileAnalysis,

            documentation,

            careerAlignment,

            activity
        });


    // --------------------------------------------------------
    // Overall Health Score
    // --------------------------------------------------------

    const healthScore =
        Math.round(

            profileAnalysis.score * 0.20 +

            repositoryAnalysis.score * 0.30 +

            documentation.score * 0.20 +

            activity.score * 0.10 +

            careerAlignment.score * 0.20
        );


    // --------------------------------------------------------
    // FINAL RESULT
    // --------------------------------------------------------

    return {

        username,

        role,

        profile,

        repositories:
            repositoryAnalysis.analysis,

        analysis: {

            healthScore,

            profile:
                profileAnalysis,

            repositories:
                repositoryAnalysis,

            documentation,

            technologies:
                technologyData,

            activity,

            careerAlignment,

            weaknesses,

            improvementPlan
        }
    };
};


// ============================================================
// EXPORT
// ============================================================
//
// IMPORTANT:
// githubController.js imports analyzeGithubData.
// Therefore this exact name MUST be exported.
//
// ============================================================

module.exports = {
    analyzeGithubData
};