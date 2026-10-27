// =========================================================
// AI CAREER OS
// UNIVERSAL RESUME ANALYSIS ENGINE
// VERSION 5.0
// =========================================================

const ROLE_KNOWLEDGE_BASE =
    require("./roleKnowledgeBase");


// =========================================================
// 1. ROLE PROFILE ADAPTER
// =========================================================

const normalizeKey = (value) => {
    return String(value || "")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ");
};


const buildRoleProfiles = () => {

    if (
        !ROLE_KNOWLEDGE_BASE ||
        typeof ROLE_KNOWLEDGE_BASE !== "object"
    ) {
        return {};
    }

    const profiles = {};

    Object.entries(
        ROLE_KNOWLEDGE_BASE
    ).forEach(([roleKey, profile]) => {

        if (
            !profile ||
            typeof profile !== "object"
        ) {
            return;
        }

        const coreSkills = Array.isArray(
            profile.coreSkills
        )
            ? profile.coreSkills.map(normalizeKey)
            : [];

        const importantSkills = Array.isArray(
            profile.importantSkills
        )
            ? profile.importantSkills.map(normalizeKey)
            : [];

        const optionalSkills = Array.isArray(
            profile.optionalSkills
        )
            ? profile.optionalSkills.map(normalizeKey)
            : [];

        const tools = Array.isArray(
            profile.tools
        )
            ? profile.tools.map(normalizeKey)
            : [];

        const concepts = Array.isArray(
            profile.concepts
        )
            ? profile.concepts.map(normalizeKey)
            : [];

        const keywords = [
            ...coreSkills,
            ...importantSkills,
            ...optionalSkills,
            ...tools,
            ...concepts
        ];

        const uniqueKeywords = [
            ...new Set(keywords)
        ];

        const displayNames = {};

        uniqueKeywords.forEach((skill) => {

            displayNames[skill] =
                skill
                    .split(" ")
                    .map((word) => {

                        if (
                            word.length <= 3
                        ) {
                            return word.toUpperCase();
                        }

                        return (
                            word.charAt(0)
                                .toUpperCase() +
                            word.slice(1)
                        );
                    })
                    .join(" ");
        });

        profiles[
            normalizeKey(roleKey)
        ] = {

            ...profile,

            coreSkills,
            importantSkills,
            optionalSkills,
            tools,
            concepts,

            keywords:
                uniqueKeywords,

            displayNames
        };
    });

    return profiles;
};


const ROLE_PROFILES =
    buildRoleProfiles();


// =========================================================
// 2. ROLE ALIASES
// =========================================================

const ROLE_ALIASES = {

    "full stack":
        "full stack developer",

    "fullstack":
        "full stack developer",

    "fullstack developer":
        "full stack developer",

    "frontend":
        "frontend developer",

    "front end":
        "frontend developer",

    "front-end":
        "frontend developer",

    "front end developer":
        "frontend developer",

    "front-end developer":
        "frontend developer",

    "backend":
        "backend developer",

    "back end":
        "backend developer",

    "back-end":
        "backend developer",

    "back end developer":
        "backend developer",

    "back-end developer":
        "backend developer",

    "software developer":
        "software engineer",

    "sde":
        "software engineer",

    "java":
        "java developer",

    "java dev":
        "java developer",

    "python":
        "python developer",

    "python dev":
        "python developer",

    "data science":
        "data scientist",

    "data scientis":
        "data scientist",

    "data analyst":
        "data analyst",

    "machine learning":
        "machine learning engineer",

    "ml":
        "machine learning engineer",

    "ml engineer":
        "machine learning engineer",

    "artificial intelligence":
        "ai engineer",

    "artificial intelligence engineer":
        "ai engineer",

    "ai":
        "ai engineer",

    "ai developer":
        "ai engineer",

    "cloud":
        "cloud engineer",

    "cloud computing":
        "cloud engineer",

    "devops":
        "devops engineer",

    "cyber security":
        "cybersecurity engineer",

    "cybersecurity":
        "cybersecurity engineer",

    "network":
        "network engineer",

    "networking":
        "network engineer",

    "embedded":
        "embedded engineer",

    "embedded systems":
        "embedded engineer",

    "mechanical":
        "mechanical engineer",

    "civil":
        "civil engineer",

    "electrical":
        "electrical engineer",

    "electronics":
        "electronics engineer",

    "chemical":
        "chemical engineer",

    "biomedical":
        "biomedical engineer",

    "automotive":
        "automotive engineer",

    "aerospace":
        "aerospace engineer",

    "ui ux":
        "ui/ux designer",

    "ui/ux":
        "ui/ux designer"
};


// =========================================================
// 3. ROLE NORMALIZATION
// =========================================================

const normalizeRole = (
    targetRole
) => {

    if (
        !targetRole ||
        typeof targetRole !== "string"
    ) {
        return null;
    }

    const role =
        normalizeKey(targetRole);

    return (
        ROLE_ALIASES[role] ||
        role
    );
};


// =========================================================
// 4. RESOLVE ROLE PROFILE
// =========================================================

const resolveRoleProfile = (
    normalizedRole
) => {

    if (!normalizedRole) {
        return null;
    }

    // Exact match
    if (
        ROLE_PROFILES[
            normalizedRole
        ]
    ) {
        return {
            key: normalizedRole,
            profile:
                ROLE_PROFILES[
                    normalizedRole
                ]
        };
    }

    // Alias match
    const alias =
        ROLE_ALIASES[
            normalizedRole
        ];

    if (
        alias &&
        ROLE_PROFILES[alias]
    ) {
        return {
            key: alias,
            profile:
                ROLE_PROFILES[alias]
        };
    }

    // Flexible match
    const matchingKey =
        Object.keys(
            ROLE_PROFILES
        ).find((key) => {

            return (
                key === normalizedRole ||
                key.includes(normalizedRole) ||
                normalizedRole.includes(key)
            );
        });

    if (matchingKey) {
        return {
            key: matchingKey,
            profile:
                ROLE_PROFILES[
                    matchingKey
                ]
        };
    }

    return null;
};


// =========================================================
// 5. TEXT NORMALIZATION
// =========================================================

const normalizeText = (
    text
) => {

    return String(text || "")
        .toLowerCase()
        .replace(/\r/g, " ")
        .replace(/\n/g, " ")
        .replace(/[•●▪◦]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
};


const normalizeLine = (
    line
) => {

    return String(line || "")
        .toLowerCase()
        .replace(/[•●▪◦]/g, " ")
        .replace(
            /[^a-z0-9+#/ .&_-]/gi,
            " "
        )
        .replace(/\s+/g, " ")
        .trim();
};


const escapeRegExp = (
    value
) => {

    return String(value || "")
        .replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
        );
};


// =========================================================
// 6. SAFE SKILL ALIASES
// =========================================================

const SKILL_ALIASES = {

    javascript: [
        "javascript",
        "java script",
        "js",
        "ecmascript"
    ],

    html: [
        "html",
        "html5"
    ],

    css: [
        "css",
        "css3"
    ],

    react: [
        "react",
        "react.js",
        "reactjs"
    ],

    "node.js": [
        "node.js",
        "node js",
        "nodejs"
    ],

    express: [
        "express",
        "express.js",
        "express js",
        "expressjs"
    ],

    mongodb: [
        "mongodb",
        "mongo db"
    ],

    "rest api": [
        "rest api",
        "rest apis",
        "restful api",
        "restful apis",
        "rest api development"
    ],

    git: [
        "git"
    ],

    github: [
        "github",
        "git hub"
    ],

    sql: [
        "sql",
        "mysql",
        "postgresql",
        "postgres"
    ],

    python: [
        "python",
        "python3"
    ],

    java: [
        "java"
    ],

    c: [
        "c",
        "c programming",
        "c language"
    ],

    "c++": [
        "c++",
        "cpp"
    ],

    "machine learning": [
        "machine learning",
        "machine-learning",
        "ml"
    ],

    "deep learning": [
        "deep learning",
        "deep-learning",
        "dl"
    ],

    "scikit-learn": [
        "scikit-learn",
        "scikit learn",
        "sklearn"
    ],

    pandas: [
        "pandas"
    ],

    numpy: [
        "numpy"
    ],

    "power bi": [
        "power bi",
        "powerbi"
    ],

    docker: [
        "docker",
        "dockerized",
        "docker container",
        "docker containers"
    ],

    kubernetes: [
        "kubernetes",
        "k8s"
    ],

    "ci/cd": [
        "ci/cd",
        "ci / cd",
        "ci-cd",
        "continuous integration",
        "continuous deployment"
    ],

    "tcp/ip": [
        "tcp/ip",
        "tcp ip"
    ],

    i2c: [
        "i2c",
        "i²c"
    ],

    spi: [
        "spi"
    ],

    uart: [
        "uart"
    ],

    jupyter: [
        "jupyter",
        "jupyter notebook"
    ],

    "data visualization": [
        "data visualization",
        "data visualisation"
    ],

    "object oriented programming": [
        "object oriented programming",
        "object-oriented programming",
        "object oriented",
        "object-oriented",
        "oop"
    ]
};


// =========================================================
// 7. SKILL VARIANTS
// =========================================================

const getSkillVariants = (
    skill
) => {

    const normalized =
        normalizeKey(skill);

    return (
        SKILL_ALIASES[
            normalized
        ] || [
            normalized
        ]
    );
};


// =========================================================
// 8. EXACT SKILL MATCH
// =========================================================

const phraseExists = (
    text,
    phrase
) => {

    if (
        !text ||
        !phrase
    ) {
        return false;
    }

    const normalized =
        normalizeText(text);

    const variants =
        getSkillVariants(
            phrase
        );

    return variants.some(
        (variant) => {

            const escaped =
                escapeRegExp(
                    variant
                );

            const pattern =
                new RegExp(
                    `(^|[^a-z0-9+#])${escaped}([^a-z0-9+#]|$)`,
                    "i"
                );

            return pattern.test(
                normalized
            );
        }
    );
};


// =========================================================
// 9. RESUME SECTION DEFINITIONS
// =========================================================

const SECTION_ALIASES = {

    summary: [
        "summary",
        "professional summary",
        "profile",
        "objective",
        "career objective"
    ],

    skills: [
        "skills",
        "technical skills",
        "technical skill",
        "technical expertise",
        "technologies",
        "technical competencies",
        "skills & technologies",
        "skills and technologies"
    ],

    experience: [
        "experience",
        "work experience",
        "professional experience",
        "employment",
        "internship",
        "internships",
        "work history",
        "relevant experience",
        "professional employment"
    ],

    projects: [
        "projects",
        "project",
        "project experience",
        "personal projects",
        "academic projects",
        "project work",
        "professional projects",
        "selected projects"
    ],

    education: [
        "education",
        "academic background",
        "academic qualifications",
        "educational background"
    ],

    certifications: [
        "certifications",
        "certification",
        "licenses",
        "certificates"
    ],

    achievements: [
        "achievements",
        "awards",
        "accomplishments"
    ],

    publications: [
        "publications",
        "research",
        "papers"
    ]
};


// =========================================================
// 10. SECTION DETECTION
// =========================================================

const detectSection = (
    line
) => {

    const clean =
        normalizeLine(line)
            .replace(
                /^[-•●▪◦]+\s*/,
                ""
            )
            .replace(
                /[:\-]+$/,
                ""
            )
            .trim();

    for (
        const [
            section,
            aliases
        ]
        of Object.entries(
            SECTION_ALIASES
        )
    ) {

        if (
            aliases.includes(clean)
        ) {
            return section;
        }
    }

    return null;
};


// =========================================================
// 11. PARSE RESUME
// =========================================================

const parseResumeSections = (
    resumeText
) => {

    const sections = {
        header: []
    };

    let currentSection =
        "header";

    const lines =
        String(resumeText || "")
            .split(/\r?\n/);

    lines.forEach(
        (rawLine) => {

            const line =
                String(rawLine || "")
                    .trim();

            if (!line) {
                return;
            }

            // Recognize an inline heading only when its entire prefix is a
            // known alias; ordinary prose containing "projects" stays content.
            const inline = line.match(/^(.{1,60}?):\s*(.+)$/);
            const section = detectSection(inline ? inline[1] : line);

            if (section) {

                currentSection =
                    section;

                if (
                    !sections[
                        currentSection
                    ]
                ) {
                    sections[
                        currentSection
                    ] = [];
                }

                if (inline) sections[currentSection].push(inline[2].trim());
                return;
            }

            if (
                !sections[
                    currentSection
                ]
            ) {
                sections[
                    currentSection
                ] = [];
            }

            sections[
                currentSection
            ].push(line);
        }
    );

    return sections;
};


// =========================================================
// 12. SECTION TEXT
// =========================================================

const getSectionText = (
    sections,
    names
) => {

    return names
        .flatMap(
            (name) =>
                sections[name] || []
        )
        .join(" ");
};


// =========================================================
// 13. ACTION VERBS
// =========================================================

const ACTION_VERBS = [

    "developed",
    "built",
    "implemented",
    "created",
    "designed",
    "engineered",
    "configured",
    "deployed",
    "automated",
    "analyzed",
    "analysed",
    "optimized",
    "optimised",
    "processed",
    "visualized",
    "visualised",
    "tested",
    "managed",
    "maintained",
    "integrated",
    "trained",
    "evaluated",
    "applied",
    "performed",
    "led",
    "delivered",
    "improved",
    "launched",
    "architected",
    "programmed",
    "modeled",
    "modelled",
    "simulated",
    "fabricated",
    "calculated",
    "inspected",
    "monitored",
    "operated"
];


const hasActionEvidence = (
    line
) => {

    return ACTION_VERBS.some(
        (verb) =>
            phraseExists(
                line,
                verb
            )
    );
};


// =========================================================
// 14. FIND SKILL OCCURRENCES
// =========================================================

// Keep skill matching tied to a clause rather than borrowing action verbs
// from an unrelated sentence. Preserve dots inside aliases such as Node.js.
const getEvidenceClauses = (line) => String(line)
    .replace(/([.!?])\s+/g, "$1\n")
    .split(new RegExp(`\\n|;|,\\s*(?=(?:(?:i|we)\\s+)?(?:${ACTION_VERBS.join("|")})\\b)|\\bbut\\b|\\bhowever\\b`, "i"))
    .map((clause) => clause.trim())
    .filter(Boolean);

const isNegativeSkillClause = (clause, skill, variants = getSkillVariants(skill)) => {
    const text = normalizeText(clause).replace(/[’‘]/g, "'")
        .replace(/\bnot only\b/g, "");
    return variants.some((variant) => {
        const pattern = new RegExp(`(^|[^a-z0-9+#])${escapeRegExp(variant)}([^a-z0-9+#]|$)`, "ig");
        return [...text.matchAll(pattern)].some((match) => {
            const before = text.slice(0, match.index + match[1].length);
            const after = text.slice(match.index + match[0].length);
            // Negation before the skill or an explicit negative proficiency
            // statement after it. "Not only" is affirmative, not a denial.
            return /\b(?:no|never|without|not|cannot|can't|haven't|hasn't|hadn't|don't|doesn't|didn't|lack|lacks|lacking)\b[^.!?;]*$/.test(before)
                || /^\s*[:—-]?\s*(?:(?:is|was|experience is|knowledge is)\s+)?(?:not\b|never\b|no\s+(?:experience|knowledge|proficiency)|unfamiliar\b|absent\b)/.test(after);
        });
    });
};

const findSkillOccurrences = (sections, skill) => {
    const occurrences = [];
    const orderedSections = [
        "experience", "projects", "certifications", "skills", "summary",
        "education", "achievements", "publications", "header"
    ];
    orderedSections.forEach((section) => {
        (sections[section] || []).forEach((line) => {
            getEvidenceClauses(line).forEach((clause) => {
                if (phraseExists(clause, skill) && !isNegativeSkillClause(clause, skill)) {
                    occurrences.push({ section, line, clause });
                }
            });
        });
    });
    return occurrences;
};


// =========================================================
// 15. EVIDENCE STRENGTH
// =========================================================

const determineEvidenceStrength = (
    occurrence
) => {

    const section =
        occurrence.section;

    const line =
        occurrence.clause || occurrence.line;

    const action =
        hasActionEvidence(
            line
        );

    // Aspirations and learning interests are mentions even inside a
    // projects section; they do not establish practical use.
    if (/\b(?:learning interest|interested in|want to learn|plan to learn|hoping to|would like to)\b/i.test(line)) {
        return { strength: 0.25, status: "mentioned" };
    }

    if (
        section === "experience"
    ) {

        return {
            strength:
                action
                    ? 1.00
                    : 0.75,

            status:
                action
                    ? "demonstrated"
                    : "supported"
        };
    }

    if (
        section === "projects"
    ) {

        return {
            strength:
                action
                    ? 0.95
                    : 0.70,

            status:
                action
                    ? "demonstrated"
                    : "supported"
        };
    }

    if (
        section === "certifications"
    ) {

        return {
            strength: 0.70,
            status: "supported"
        };
    }

    if (
        section === "skills"
    ) {

        return {
            strength: 0.25,
            status: "mentioned"
        };
    }

    if (
        section === "summary"
    ) {

        return {
            strength: 0.25,
            status: "mentioned"
        };
    }

    if (
        section === "education"
    ) {

        return {
            strength: 0.25,
            status: "mentioned"
        };
    }

    return {
        strength: 0.20,
        status: "mentioned"
    };
};


// =========================================================
// 16. REQUIREMENT TYPE
// =========================================================

const getRequirementMetadata = (
    profile,
    skill
) => {

    const normalized =
        normalizeKey(skill);

    const inList = (
        list
    ) => {

        return (
            Array.isArray(list) &&
            list.some(
                (item) =>
                    normalizeKey(item) ===
                    normalized
            )
        );
    };

    if (
        inList(
            profile.coreSkills
        )
    ) {

        return {
            type: "core",
            weight: 1.00
        };
    }

    if (
        inList(
            profile.importantSkills
        )
    ) {

        return {
            type: "important",
            weight: 0.80
        };
    }

    if (
        inList(
            profile.tools
        )
    ) {

        return {
            type: "tool",
            weight: 0.60
        };
    }

    if (
        inList(
            profile.concepts
        )
    ) {

        return {
            type: "concept",
            weight: 0.70
        };
    }

    if (
        inList(
            profile.optionalSkills
        )
    ) {

        return {
            type: "optional",
            weight: 0.40
        };
    }

    return {
        type: "requirement",
        weight: 0.50
    };
};


// =========================================================
// 17. ANALYZE ONE SKILL
// =========================================================

const analyzeSkillEvidence = (
    sections,
    profile,
    skill,
    occurrences = findSkillOccurrences(sections, skill)
) => {

    const requirement =
        getRequirementMetadata(
            profile,
            skill
        );

    const displayName =
        profile.displayNames?.[
            skill
        ] ||
        skill
            .split(" ")
            .map(
                (word) =>
                    word.length <= 3
                        ? word.toUpperCase()
                        : word.charAt(0)
                            .toUpperCase() +
                          word.slice(1)
            )
            .join(" ");

    if (
        occurrences.length === 0
    ) {

        return {

            skill,

            displayName,

            status:
                "missing",

            confidence: 0,

            strength: 0,

            sources: [],

            evidence: null,

            evidenceDetails: [],

            requirementType:
                requirement.type,

            importanceWeight:
                requirement.weight,

            reason:
                "No supporting evidence found in the resume."
        };
    }

    const evidenceDetails =
        occurrences.map(
            (occurrence) => {

                const evidence =
                    determineEvidenceStrength(
                        occurrence
                    );

                return {

                    source:
                        occurrence.section,

                    section:
                        occurrence.section,

                    line:
                        occurrence.line,

                    strength:
                        evidence.strength,

                    status:
                        evidence.status
                };
            }
        );

    const bestEvidence =
        evidenceDetails.reduce(
            (best, current) =>
                current.strength >
                best.strength
                    ? current
                    : best
        );

    const status =
        bestEvidence.status;

    const sources = [
        ...new Set(
            evidenceDetails.map(
                (item) =>
                    item.source
            )
        )
    ];

    return {

        skill,

        displayName,

        status,

        confidence:
            Math.round(
                bestEvidence.strength *
                100
            ),

        strength:
            bestEvidence.strength,

        sources,

        evidence:
            bestEvidence.line,

        evidenceDetails,

        requirementType:
            requirement.type,

        importanceWeight:
            requirement.weight,

        reason:
            getEvidenceReason(
                status,
                bestEvidence.source
            )
    };
};


// =========================================================
// 18. EVIDENCE REASON
// =========================================================

const getEvidenceReason = (
    status,
    source
) => {

    if (
        status === "demonstrated"
    ) {

        return `Practical evidence found in ${source}.`;
    }

    if (
        status === "supported"
    ) {

        return `Supporting evidence found in ${source}.`;
    }

    if (
        status === "mentioned"
    ) {

        return `The skill is mentioned but strong practical evidence was not found.`;
    }

    return (
        "No supporting evidence found."
    );
};


// =========================================================
// 19. ANALYZE ALL ROLE SKILLS
// =========================================================

const analyzeRoleSkills = (
    sections,
    profile
) => {

    return (
        profile.keywords || []
    ).map(
        (skill) =>
            analyzeSkillEvidence(
                sections,
                profile,
                skill
            )
    );
};


// =========================================================
// 20. EVIDENCE SCORE
// =========================================================

const getEvidenceScore = (
    status
) => {

    switch (status) {

        case "demonstrated":
            return 1.00;

        case "supported":
            return 0.70;

        case "mentioned":
            return 0.25;

        default:
            return 0;
    }
};


// =========================================================
// 21. ROLE ALIGNMENT
// =========================================================

const calculateRoleAlignment = (
    skillDetails
) => {

    if (
        !skillDetails.length
    ) {
        return 0;
    }

    let earned = 0;
    let possible = 0;

    skillDetails.forEach(
        (item) => {

            const weight =
                Number(
                    item.importanceWeight
                ) || 0.50;

            const evidence =
                getEvidenceScore(
                    item.status
                );

            earned +=
                weight *
                evidence;

            possible +=
                weight;
        }
    );

    if (
        possible === 0
    ) {
        return 0;
    }

    return Math.round(
        (
            earned /
            possible
        ) * 100
    );
};


// =========================================================
// 22. TECHNICAL SKILL SCORE
// =========================================================

const calculateTechnicalSkillScore = (
    skillDetails
) => {

    if (
        !skillDetails.length
    ) {
        return 0;
    }

    let total = 0;

    skillDetails.forEach(
        (item) => {

            total +=
                getEvidenceScore(
                    item.status
                );
        }
    );

    return Math.round(
        (
            total /
            skillDetails.length
        ) * 100
    );
};


// =========================================================
// 23. REQUIREMENT BREAKDOWN
// =========================================================

const calculateRequirementBreakdown = (
    skillDetails
) => {

    const breakdown = {

        core: createRequirementGroup(),

        important:
            createRequirementGroup(),

        tool:
            createRequirementGroup(),

        concept:
            createRequirementGroup(),

        optional:
            createRequirementGroup(),

        requirement:
            createRequirementGroup()
    };

    skillDetails.forEach(
        (item) => {

            const type =
                breakdown[
                    item.requirementType
                ]
                    ? item.requirementType
                    : "requirement";

            const group =
                breakdown[type];

            group.total += 1;

            group[
                item.status
            ] += 1;
        }
    );

    Object.values(
        breakdown
    ).forEach(
        (group) => {

            if (
                group.total === 0
            ) {

                group.score = 0;
                return;
            }

            let earned = 0;

            earned +=
                group.demonstrated *
                1.00;

            earned +=
                group.supported *
                0.70;

            earned +=
                group.mentioned *
                0.25;

            group.score =
                Math.round(
                    (
                        earned /
                        group.total
                    ) * 100
                );
        }
    );

    return breakdown;
};


const createRequirementGroup = () => {

    return {

        total: 0,

        demonstrated: 0,

        supported: 0,

        mentioned: 0,

        missing: 0,

        score: 0
    };
};


// =========================================================
// 24. EVIDENCE SUMMARY
// =========================================================

const calculateEvidenceSummary = (
    skillDetails
) => {

    const summary = {

        demonstrated: 0,

        supported: 0,

        mentioned: 0,

        missing: 0
    };

    skillDetails.forEach(
        (item) => {

            if (
                summary[
                    item.status
                ] !== undefined
            ) {

                summary[
                    item.status
                ] += 1;
            }
        }
    );

    return summary;
};


// =========================================================
// 25. CONTACT ANALYSIS
// =========================================================

const analyzeContactInformation = (
    resumeText
) => {

    const text =
        String(resumeText || "");

    let score = 0;

    const email =
        /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i
            .test(text);

    const phone =
        /(?:\+?\d[\d\s().-]{7,}\d)/
            .test(text);

    const linkedin =
        /linkedin/i.test(text);

    const github =
        /github/i.test(text);

    const portfolio =
        /portfolio|https?:\/\//i
            .test(text);

    if (email) {
        score += 35;
    }

    if (phone) {
        score += 25;
    }

    if (linkedin) {
        score += 15;
    }

    if (github) {
        score += 15;
    }

    if (portfolio) {
        score += 10;
    }

    return {

        score:
            Math.min(
                100,
                score
            ),

        email,

        phone,

        linkedin,

        github,

        portfolio
    };
};


// =========================================================
// 26. SECTION QUALITY
// =========================================================

const analyzeSectionQuality = (
    sections
) => {

    const required = [
        "education",
        "skills"
    ];

    const useful = [
        "experience",
        "projects",
        "certifications",
        "summary"
    ];

    const presentRequired =
        required.filter(
            (section) =>
                (
                    sections[
                        section
                    ] || []
                ).length > 0
        ).length;

    const presentUseful =
        useful.filter(
            (section) =>
                (
                    sections[
                        section
                    ] || []
                ).length > 0
        ).length;

    const score =
        Math.round(
            (
                (
                    presentRequired /
                    required.length
                ) * 60
            ) +
            (
                (
                    presentUseful /
                    useful.length
                ) * 40
            )
        );

    return {

        score:
            Math.min(
                100,
                score
            ),

        presentRequired,

        totalRequired:
            required.length,

        presentUseful,

        totalUseful:
            useful.length,

        missingRequired:
            required.filter(
                (section) =>
                    !(
                        sections[
                            section
                        ] || []
                    ).length
            )
    };
};


// =========================================================
// 27. ACTION VERB ANALYSIS
// =========================================================

const analyzeActionVerbs = (
    sections
) => {

    const lines = [
        ...(sections.experience || []),
        ...(sections.projects || [])
    ];

    if (!lines.length) {
        return {
            score: 0,
            count: 0
        };
    }

    let count = 0;

    lines.forEach(
        (line) => {

            if (
                hasActionEvidence(
                    line
                )
            ) {
                count += 1;
            }
        }
    );

    const ratio =
        count /
        lines.length;

    return {

        score:
            Math.min(
                100,
                Math.round(
                    ratio * 100
                )
            ),

        count,

        totalLines:
            lines.length
    };
};


// =========================================================
// 28. METRICS ANALYSIS
// =========================================================

const analyzeMetrics = (
    resumeText
) => {

    const matches =
        String(resumeText || "")
            .match(
                /\b\d+(?:\.\d+)?\s*(?:%|users?|requests?|ms|seconds?|hours?|days?|months?|years?|projects?|records?|clients?|devices?|systems?)\b/gi
            ) || [];

    let score = 0;

    if (
        matches.length >= 6
    ) {
        score = 100;
    } else if (
        matches.length >= 4
    ) {
        score = 85;
    } else if (
        matches.length >= 2
    ) {
        score = 65;
    } else if (
        matches.length === 1
    ) {
        score = 40;
    }

    return {

        score,

        count:
            matches.length,

        examples:
            [
                ...new Set(
                    matches
                )
            ].slice(
                0,
                10
            )
    };
};


// =========================================================
// 29. READABILITY ANALYSIS
// =========================================================

const analyzeReadability = (
    resumeText,
    sections
) => {

    const text =
        String(resumeText || "");

    const words =
        text
            .split(/\s+/)
            .filter(Boolean);

    const sentences =
        text
            .split(/[.!?]+/)
            .filter(
                (item) =>
                    item.trim()
            );

    const averageWords =
        sentences.length
            ? words.length /
              sentences.length
            : words.length;

    const bullets =
        (
            text.match(
                /(?:^|\n)\s*[•●▪◦*-]\s+/g
            ) || []
        ).length;

    let score = 100;

    if (
        averageWords > 30
    ) {
        score -= 20;
    }

    if (
        averageWords > 40
    ) {
        score -= 20;
    }

    if (
        bullets < 3
    ) {
        score -= 15;
    }

    if (
        !sections.projects &&
        !sections.experience
    ) {
        score -= 20;
    }

    return {

        score:
            Math.max(
                0,
                Math.min(
                    100,
                    score
                )
            ),

        wordCount:
            words.length,

        bulletCount:
            bullets,

        averageWordsPerSentence:
            Math.round(
                averageWords
            )
    };
};


// =========================================================
// 30. ATS TEXT SAFETY
// =========================================================

const analyzeATSTextSafety = (
    resumeText
) => {

    const text =
        String(resumeText || "");

    let score = 100;

    const brokenCharacters =
        (
            text.match(
                /�/g
            ) || []
        ).length;

    const unusualCharacters =
        (
            text.match(
                /[★☆✦✧◆◇■□]/g
            ) || []
        ).length;

    if (
        brokenCharacters > 0
    ) {
        score -= 30;
    }

    if (
        unusualCharacters > 3
    ) {
        score -= 15;
    }

    return {

        score:
            Math.max(
                0,
                score
            ),

        brokenCharacters,

        unusualCharacters
    };
};


// =========================================================
// 31. EXPERIENCE QUALITY
// =========================================================

const analyzeExperienceQuality = (
    sections
) => {

    const lines =
        sections.experience || [];

    if (!lines.length) {

        return {
            score: 50,
            present: false
        };
    }

    const actionLines =
        lines.filter(
            (line) =>
                hasActionEvidence(
                    line
                )
        ).length;

    const score =
        Math.round(
            (
                actionLines /
                lines.length
            ) * 100
        );

    return {

        score,

        present: true,

        actionLines,

        totalLines:
            lines.length
    };
};


// =========================================================
// 32. PROJECT QUALITY
// =========================================================

const analyzeProjectQuality = (
    sections
) => {

    const lines =
        sections.projects || [];

    if (!lines.length) {

        return {
            score: 0,
            present: false
        };
    }

    const actionLines =
        lines.filter(
            (line) =>
                hasActionEvidence(
                    line
                )
        ).length;

    const score =
        Math.round(
            (
                actionLines /
                lines.length
            ) * 100
        );

    return {

        score,

        present: true,

        actionLines,

        totalLines:
            lines.length
    };
};


// =========================================================
// 33. RESUME QUALITY
// =========================================================

const calculateResumeQuality = (
    resumeText,
    sections
) => {

    const contact =
        analyzeContactInformation(
            resumeText
        );

    const sectionQuality =
        analyzeSectionQuality(
            sections
        );

    const actionVerbs =
        analyzeActionVerbs(
            sections
        );

    const metrics =
        analyzeMetrics(
            resumeText
        );

    const readability =
        analyzeReadability(
            resumeText,
            sections
        );

    const atsSafety =
        analyzeATSTextSafety(
            resumeText
        );

    const experience =
        analyzeExperienceQuality(
            sections
        );

    const projects =
        analyzeProjectQuality(
            sections
        );

    const score =
        Math.round(

            contact.score * 0.10 +

            sectionQuality.score * 0.15 +

            actionVerbs.score * 0.15 +

            metrics.score * 0.15 +

            readability.score * 0.10 +

            atsSafety.score * 0.15 +

            experience.score * 0.10 +

            projects.score * 0.10
        );

    return {

        score:
            Math.min(
                100,
                Math.max(
                    0,
                    score
                )
            ),

        contact,

        sections:
            sectionQuality,

        actionVerbs,

        metrics,

        readability,

        atsSafety,

        experience,

        projects
    };
};


// =========================================================
// 34. ATS SCORE
// =========================================================

const calculateATSScore = (
    quality
) => {

    return Math.round(

        quality.atsSafety.score * 0.40 +

        quality.sections.score * 0.25 +

        quality.readability.score * 0.20 +

        quality.contact.score * 0.15
    );
};


// =========================================================
// 35. SCORE INTERPRETATION
// =========================================================

const interpretScore = (
    score
) => {

    if (score >= 90) {
        return "excellent";
    }

    if (score >= 80) {
        return "strong";
    }

    if (score >= 70) {
        return "good";
    }

    if (score >= 60) {
        return "developing";
    }

    if (score >= 45) {
        return "needs improvement";
    }

    return "weak";
};


// =========================================================
// 36. STRENGTHS
// =========================================================

const generateStrengths = (
    skillDetails,
    quality
) => {

    const strengths = [];

    const demonstrated =
        skillDetails
            .filter(
                (item) =>
                    item.status ===
                    "demonstrated"
            )
            .sort(
                (a, b) =>
                    b.importanceWeight -
                    a.importanceWeight
            );

    demonstrated
        .slice(0, 6)
        .forEach(
            (item) => {

                strengths.push({
                    type: "skill",
                    title:
                        `${item.displayName} demonstrated`,
                    detail:
                        item.reason,
                    skill:
                        item.displayName,
                    evidence:
                        item.evidence,
                    source:
                        item.sources
                });
            }
        );

    if (
        quality.projects.score >= 70
    ) {

        strengths.push({
            type: "resume",
            title:
                "Strong project evidence",
            detail:
                "Projects contain action-oriented evidence of practical work."
        });
    }

    if (
        quality.experience.score >= 70
    ) {

        strengths.push({
            type: "resume",
            title:
                "Relevant experience evidence",
            detail:
                "Experience contains practical and action-oriented statements."
        });
    }

    if (
        quality.metrics.score >= 60
    ) {

        strengths.push({
            type: "resume",
            title:
                "Quantified achievements",
            detail:
                "The resume contains measurable results or quantities."
        });
    }

    if (
        quality.atsSafety.score >= 85
    ) {

        strengths.push({
            type: "ats",
            title:
                "ATS-friendly text structure",
            detail:
                "Extracted resume text contains few detectable ATS safety issues."
        });
    }

    return strengths.slice(
        0,
        8
    );
};


// =========================================================
// 37. WEAK AREAS
// =========================================================

const generateWeakAreas = (
    skillDetails,
    quality
) => {

    const weakAreas = [];

    const missingCore =
        skillDetails.filter(
            (item) =>
                item.status ===
                    "missing" &&
                item.requirementType ===
                    "core"
        );

    missingCore
        .slice(0, 5)
        .forEach(
            (item) => {

                weakAreas.push({
                    type: "missing-core-skill",
                    priority: "high",
                    title:
                        `${item.displayName} not demonstrated`,
                    detail:
                        `No evidence of ${item.displayName} was found in projects, experience, education, certifications, or the skills section.`,
                    skill:
                        item.displayName
                });
            }
        );

    const missingImportant =
        skillDetails.filter(
            (item) =>
                item.status ===
                    "missing" &&
                item.requirementType ===
                    "important"
        );

    missingImportant
        .slice(0, 5)
        .forEach(
            (item) => {

                weakAreas.push({
                    type: "missing-important-skill",
                    priority: "medium",
                    title:
                        `${item.displayName} not demonstrated`,
                    detail:
                        `This important role requirement does not have supporting resume evidence.`,
                    skill:
                        item.displayName
                });
            }
        );

    const mentioned =
        skillDetails.filter(
            (item) =>
                item.status ===
                "mentioned"
        );

    mentioned
        .slice(0, 5)
        .forEach(
            (item) => {

                weakAreas.push({
                    type: "weak-evidence",
                    priority: "medium",
                    title:
                        `${item.displayName} needs stronger evidence`,
                    detail:
                        "The skill is mentioned but the resume does not strongly demonstrate practical use.",
                    skill:
                        item.displayName
                });
            }
        );

    if (
        quality.metrics.score < 60
    ) {

        weakAreas.push({
            type: "impact",
            priority: "high",
            title:
                "Limited measurable impact",
            detail:
                "Several bullets could be strengthened with truthful measurable outcomes where appropriate."
        });
    }

    if (
        quality.actionVerbs.score < 65
    ) {

        weakAreas.push({
            type: "action-verbs",
            priority: "medium",
            title:
                "Action-oriented wording can improve",
            detail:
                "Some experience or project statements could use clearer action verbs."
        });
    }

    if (
        quality.projects.score < 60
    ) {

        weakAreas.push({
            type: "projects",
            priority: "medium",
            title:
                "Project evidence can be stronger",
            detail:
                "Projects should clearly describe the problem, implementation, technologies, and outcome."
        });
    }

    if (
        quality.experience.score < 60
    ) {

        weakAreas.push({
            type: "experience",
            priority: "medium",
            title:
                "Experience evidence can be stronger",
            detail:
                "Experience bullets should clearly explain responsibilities, technologies, and results."
        });
    }

    quality.sections.missingRequired
        .forEach(
            (section) => {

                weakAreas.push({
                    type: "section",
                    priority: "high",
                    title:
                        `${capitalize(section)} section missing`,
                    detail:
                        `A ${section} section was not detected in the extracted resume text.`
                });
            }
        );

    if (
        quality.contact.score < 80
    ) {

        weakAreas.push({
            type: "contact",
            priority: "medium",
            title:
                "Contact/profile information can improve",
            detail:
                "Consider including relevant professional contact and profile links."
        });
    }

    if (
        quality.atsSafety.score < 80
    ) {

        weakAreas.push({
            type: "ats",
            priority: "high",
            title:
                "ATS text safety needs attention",
            detail:
                "Some extracted characters or formatting patterns may reduce text parsing reliability."
        });
    }

    if (
        quality.readability.score < 70
    ) {

        weakAreas.push({
            type: "readability",
            priority: "medium",
            title:
                "Readability can improve",
            detail:
                "Some resume content may benefit from shorter, clearer bullet points."
        });
    }

    const priorityOrder = {
        high: 1,
        medium: 2,
        low: 3
    };

    return weakAreas
        .sort(
            (a, b) =>
                priorityOrder[a.priority] -
                priorityOrder[b.priority]
        )
        .slice(
            0,
            20
        );
};


// =========================================================
// 38. RECOMMENDATIONS
// =========================================================

const generateRecommendations = (
    weakAreas,
    skillDetails
) => {

    const recommendations = [];

    weakAreas.forEach(
        (weakArea) => {

            switch (
                weakArea.type
            ) {

                case "missing-core-skill":

                    recommendations.push({
                        priority: "high",
                        title:
                            `Build evidence for ${weakArea.skill}`,
                        action:
                            `If you genuinely have experience with ${weakArea.skill}, add the relevant project, internship, coursework, or responsibility. If you do not, consider learning it and building a relevant project before claiming it.`
                    });

                    break;


                case "missing-important-skill":

                    recommendations.push({
                        priority: "medium",
                        title:
                            `Strengthen ${weakArea.skill}`,
                        action:
                            `Add truthful evidence showing how you used ${weakArea.skill} in a practical context.`
                    });

                    break;


                case "weak-evidence":

                    recommendations.push({
                        priority: "medium",
                        title:
                            `Demonstrate ${weakArea.skill}`,
                        action:
                            `Move beyond listing ${weakArea.skill}; explain what you built, analyzed, designed, tested, or improved with it.`
                    });

                    break;


                case "impact":

                    recommendations.push({
                        priority: "high",
                        title:
                            "Add measurable impact",
                        action:
                            "Where truthful and available, include measurable outcomes such as performance improvements, scale, time saved, users served, test results, cost reductions, accuracy, or project scope."
                    });

                    break;


                case "action-verbs":

                    recommendations.push({
                        priority: "medium",
                        title:
                            "Strengthen action-oriented bullets",
                        action:
                            "Use a structure such as Action + What you did + Technology/context + Result."
                    });

                    break;


                case "projects":

                    recommendations.push({
                        priority: "medium",
                        title:
                            "Improve project descriptions",
                        action:
                            "For each important project, explain the problem, implementation, technologies used, and truthful outcome."
                    });

                    break;


                case "experience":

                    recommendations.push({
                        priority: "medium",
                        title:
                            "Strengthen experience bullets",
                        action:
                            "Describe concrete responsibilities, technologies, contributions, and outcomes instead of generic participation statements."
                    });

                    break;


                case "section":

                    recommendations.push({
                        priority: "high",
                        title:
                            `Add ${weakArea.title}`,
                        action:
                            "Add the missing section if it contains relevant information that improves the resume."
                    });

                    break;


                case "contact":

                    recommendations.push({
                        priority: "medium",
                        title:
                            "Improve professional contact information",
                        action:
                            "Ensure the resume contains a professional email, phone number, and relevant professional profiles where appropriate."
                    });

                    break;


                case "ats":

                    recommendations.push({
                        priority: "high",
                        title:
                            "Improve ATS text safety",
                        action:
                            "Prefer simple headings, readable text, standard characters, and clear section structure."
                    });

                    break;


                case "readability":

                    recommendations.push({
                        priority: "medium",
                        title:
                            "Improve readability",
                        action:
                            "Shorten long bullets, remove unnecessary repetition, and keep formatting consistent."
                    });

                    break;
            }
        }
    );


    // Remove duplicates
    const unique = [];

    const seen = new Set();

    recommendations.forEach(
        (item) => {

            const key =
                item.title;

            if (
                !seen.has(key)
            ) {

                seen.add(key);

                unique.push(
                    item
                );
            }
        }
    );

    return unique.slice(
        0,
        15
    );
};


// =========================================================
// 39. ROLE SUMMARY
// =========================================================

const buildRoleSummary = (
    roleKey,
    profile
) => {

    return {

        role:
            roleKey,

        coreRequirements:
            (
                profile.coreSkills ||
                []
            ).map(
                (skill) =>
                    profile.displayNames?.[
                        skill
                    ] || skill
            ),

        importantRequirements:
            (
                profile.importantSkills ||
                []
            ).map(
                (skill) =>
                    profile.displayNames?.[
                        skill
                    ] || skill
            ),

        tools:
            (
                profile.tools ||
                []
            ).map(
                (skill) =>
                    profile.displayNames?.[
                        skill
                    ] || skill
            ),

        concepts:
            (
                profile.concepts ||
                []
            ).map(
                (skill) =>
                    profile.displayNames?.[
                        skill
                    ] || skill
            ),

        optionalRequirements:
            (
                profile.optionalSkills ||
                []
            ).map(
                (skill) =>
                    profile.displayNames?.[
                        skill
                    ] || skill
            )
    };
};


// =========================================================
// 40. SECTION SUMMARY
// =========================================================

const buildSectionSummary = (
    sections
) => {

    const summary = {};

    Object.entries(
        sections
    ).forEach(
        ([section, lines]) => {

            summary[section] = {
                present:
                    Array.isArray(lines) &&
                    lines.length > 0,

                lineCount:
                    Array.isArray(lines)
                        ? lines.length
                        : 0
            };
        }
    );

    return summary;
};


// =========================================================
// 41. EVIDENCE REPORT
// =========================================================

const buildEvidenceReport = (
    skillDetails
) => {

    return skillDetails.map(
        (item) => {

            return {

                skill:
                    item.displayName,

                status:
                    item.status,

                confidence:
                    item.confidence,

                requirementType:
                    item.requirementType,

                importanceWeight:
                    item.importanceWeight,

                source:
                    item.sources,

                evidence:
                    item.evidence,

                reason:
                    item.reason
            };
        }
    );
};


// =========================================================
// 42. MATCHED / MISSING / WEAK SKILLS
// =========================================================

const getMatchedSkills = (
    skillDetails
) => {

    return skillDetails
        .filter(
            (item) =>
                item.status ===
                    "demonstrated" ||
                item.status ===
                    "supported"
        )
        .map(
            (item) =>
                item.displayName
        );
};


const getMissingSkills = (
    skillDetails
) => {

    return skillDetails
        .filter(
            (item) =>
                item.status ===
                "missing"
        )
        .map(
            (item) =>
                item.displayName
        );
};


const getWeakSkills = (
    skillDetails
) => {

    return skillDetails
        .filter(
            (item) =>
                item.status ===
                "mentioned"
        )
        .map(
            (item) =>
                item.displayName
        );
};


// =========================================================
// 43. SCORE BREAKDOWN FOR FRONTEND
// =========================================================

const buildScoreBreakdown = (
    quality,
    roleAlignment,
    technicalSkillScore,
    atsScore
) => {

    return {

        roleAlignment: {
            score:
                roleAlignment,
            interpretation:
                interpretScore(
                    roleAlignment
                )
        },

        technicalSkills: {
            score:
                technicalSkillScore,
            interpretation:
                interpretScore(
                    technicalSkillScore
                )
        },

        resumeQuality: {
            score:
                quality.score,
            interpretation:
                interpretScore(
                    quality.score
                )
        },

        atsCompatibility: {
            score:
                atsScore,
            interpretation:
                interpretScore(
                    atsScore
                )
        },

        resumeHealth: {

            contact:
                quality.contact.score,

            sections:
                quality.sections.score,

            actionVerbs:
                quality.actionVerbs.score,

            quantification:
                quality.metrics.score,

            readability:
                quality.readability.score,

            atsSafety:
                quality.atsSafety.score
        }
    };
};


// Job-description matching is additive: it never changes role-profile scores.
// JD database identities are deliberately narrower than the legacy role
// aliases. Do not change SKILL_ALIASES: existing role scores depend on them.
const JD_DATABASE_VARIANTS = {
    sql: ["sql"],
    postgresql: ["postgresql", "postgres"],
    mysql: ["mysql"]
};
const getJdVariants = (skill) => JD_DATABASE_VARIANTS[skill] || getSkillVariants(skill);
const jdPhraseExists = (line, variant) => new RegExp(
    `(^|[^a-z0-9+#.])${escapeRegExp(variant)}(?=$|[^a-z0-9+#.]|[.](?:\\s|$))`, "i"
).test(line);
const getJdDatabaseOccurrences = (sections, skill) => {
    const variants = getJdVariants(skill);
    const occurrences = [];
    for (const section of ["experience", "projects", "certifications", "skills", "summary", "education", "achievements", "publications", "header"]) {
        for (const line of sections[section] || []) {
            for (const clause of getEvidenceClauses(line)) {
                if (variants.some((variant) => jdPhraseExists(clause, variant)) && !isNegativeSkillClause(clause, skill, variants)) {
                    occurrences.push({ section, line, clause });
                }
            }
        }
    }
    return occurrences;
};

const buildJobDescriptionMatch = (description, sections) => {
    const vocabulary = new Set(Object.values(ROLE_PROFILES).flatMap((profile) => profile.keywords));
    const canonical = (skill) => Object.keys(JD_DATABASE_VARIANTS).find((key) => JD_DATABASE_VARIANTS[key].includes(skill))
        || Object.keys(SKILL_ALIASES).find((key) => getSkillVariants(key).includes(skill)) || skill;
    const skills = [...new Set([...vocabulary].map(canonical).concat(Object.keys(JD_DATABASE_VARIANTS)))];
    const requirements = new Map();
    const unassessed = [];
    let context = null;
    const priority = { unspecified: 0, preferred: 1, required: 2 };
    for (const raw of description.split(/\r?\n/)) {
        // An explicit inline label governs its comma-separated list, not the
        // next unrelated sentence. Standalone headings keep section context.
        for (const segment of raw.split(/;\s*|(?=\b(?:required|preferred)(?: skills)?:)/i)) {
            let line = segment.trim().replace(/^[-•*]+\s*/, "");
            let inlineContext = null;
            const inline = line.match(/^(requirements|required|preferred|required skills|preferred skills|technical skills):\s*(.+)$/i);
            if (inline) {
                const importance = /^preferred/i.test(inline[1]) ? "preferred" : /^technical/i.test(inline[1]) ? "unspecified" : "required";
                if (/^(required|preferred)$/i.test(inline[1])) inlineContext = importance;
                else context = importance;
                line = inline[2];
            }
            if (!line) continue;
            const heading = line.replace(/:$/, "").toLowerCase();
            if (/^(?:about(?: us| the company)?|company(?: overview)?|benefits|perks|what we offer|our team|responsibilities|about the role)$/.test(heading)) {
                context = "ignore";
                continue;
            }
            if (/^(?:requirements|required(?: skills| qualifications)?|minimum qualifications|must[- ]haves)$/.test(heading)) { context = "required"; continue; }
            if (/^(?:preferred(?: skills| qualifications)?|nice[- ]to[- ]haves|bonus skills)$/.test(heading)) { context = "preferred"; continue; }
            if (/^(?:skills|qualifications|technical skills)$/.test(heading)) { context = "unspecified"; continue; }
            const effectiveContext = inlineContext || context;
            if (effectiveContext === "ignore") continue;
            // Commas/semicolons delimit individual requirements. Split an "and"
            // clause only when the preceding phrase has its own modifier, so a
            // shared suffix ("Python and Django optional") remains shared.
            const lineHasRequirementCue = /\b(?:required|must|need(?:ed)?|experience (?:with|in)|knowledge of|proficien(?:cy|t) (?:in|with)|familiar(?:ity)? with|preferred|nice to have|skills? (?:in|with))\b/i.test(line);
            const phrases = line.split(/[,;]/).flatMap((part) => {
                const pieces = part.split(/\s+and\s+/i);
                if (pieces.length > 1 && pieces.slice(0, -1).every((piece) => /\b(?:required|must|preferred|optional|necessary|mandatory)\b/i.test(piece))) return pieces;
                return [part];
            });
            for (const phrase of phrases) {
                const recognized = skills.filter((skill) => getJdVariants(skill).some((variant) => jdPhraseExists(phrase, variant)));
                if (!recognized.length) continue;
                if (/\b(?:not required|no .{0,40} required|optional|not necessary|unnecessary|need not|don't need|do not need)\b/i.test(phrase)) {
                    unassessed.push({ excerpt: phrase.trim(), reason: "Explicitly unnecessary or optional; excluded from coverage." });
                    continue;
                }
                if (/\bor\b|\/|\band\/or\b/i.test(phrase)) {
                    unassessed.push({ excerpt: phrase.trim(), reason: "Alternative requirements are ambiguous; excluded from coverage." });
                    continue;
                }
                const explicit = /\b(?:required|must|need(?:ed)?|experience (?:with|in)|knowledge of|proficien(?:cy|t) (?:in|with)|familiar(?:ity)? with|preferred|nice to have|skills? (?:in|with))\b/i.test(phrase);
                if (!effectiveContext && !explicit && !lineHasRequirementCue) continue;
                const required = /\b(?:required|must|essential|mandatory)\b/i.test(phrase);
                const preferred = /\b(?:preferred|nice to have|desirable|bonus)\b/i.test(phrase);
                const importance = required && preferred ? "unspecified" : required ? "required" : preferred ? "preferred" : effectiveContext || "unspecified";
                for (const skill of recognized) {
                    const previous = requirements.get(skill);
                    if (previous) {
                        if (!previous.jobDescriptionExcerpts.includes(raw.trim())) previous.jobDescriptionExcerpts.push(raw.trim());
                        if (priority[importance] > priority[previous.importance]) previous.importance = importance;
                    } else requirements.set(skill, { skill, importance, jobDescriptionExcerpts: [raw.trim()] });
                }
            }
        }
    }
    const values = { demonstrated: 1, supported: 0.70, mentioned: 0.25, missing: 0 };
    const counts = { matched: 0, partiallySupported: 0, mentioned: 0, missing: 0, total: requirements.size };
    let numerator = 0;
    let denominator = 0;
    const items = [...requirements.values()].map((requirement) => {
        const evidence = analyzeSkillEvidence(sections, {}, requirement.skill,
            Object.hasOwn(JD_DATABASE_VARIANTS, requirement.skill) ? getJdDatabaseOccurrences(sections, requirement.skill) : undefined);
        const weight = requirement.importance === "required" ? 2 : 1;
        const value = values[evidence.status];
        numerator += weight * value;
        denominator += weight;
        counts[{ demonstrated: "matched", supported: "partiallySupported", mentioned: "mentioned", missing: "missing" }[evidence.status]]++;
        return { ...requirement, displayName: evidence.displayName, weight, evidenceValue: value,
            status: evidence.status, resumeExcerpt: evidence.evidence, evidenceDetails: evidence.evidenceDetails };
    });
    return {
        available: denominator > 0,
        score: denominator ? Math.round(100 * numerator / denominator) : null,
        numerator: Math.round(numerator * 1000000) / 1000000, denominator, counts, requirements: items, unassessed,
        weights: { required: 2, preferred: 1, unspecified: 1 }, evidenceValues: values,
        explanation: "Weighted evidence coverage of recognized, explicit job-description skill requirements. Not an official ATS score or a prediction of hiring success.",
        limitations: ["Unknown skills, experience duration, eligibility, qualifications, and ambiguous alternatives are not assessed.",
            "Only extracted resume text is assessed; absence of evidence does not establish lack of proficiency."],
        ...(!denominator ? { reason: "No recognizable, explicit skill requirements could be reliably assessed." } : {})
    };
};

// Assess extracted evidence, never the JD or any calculated/fallback score.
// This is a conservative sufficiency check, not document-type certification.
const hasAssessableResumeEvidence = (resumeText, sections) => {
    const lines = String(resumeText).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const words = (line) => line.toLowerCase().match(/[\p{L}][\p{L}+#.-]*/gu) || [];
    const substantive = (line, minimum = 4) => words(line).length >= minimum && new Set(words(line)).size >= minimum;
    const contact = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(resumeText)
        || /(?:^|\s)\+?[0-9][0-9 ().-]{7,}[0-9](?:\s|$)/m.test(resumeText)
        || /https?:\/\/(?:www\.)?(?:linkedin\.com\/in|github\.com)\/[a-z0-9_-]+/i.test(resumeText);
    const education = lines.some((line) => substantive(line)
        && /\b(?:bachelor|master|degree|diploma|phd|b\.?tech|m\.?tech|certified)\b/i.test(line)
        && /\b(?:university|college|institute|school|degree|engineering|science|certified)\b/i.test(line));
    const practical = lines.filter((line) => substantive(line, 5) && hasActionEvidence(line)
        && !/\b(?:never|not|would|want|wish|plan)\b/i.test(line));
    const vocabulary = [...new Set(Object.values(ROLE_PROFILES).flatMap((profile) => profile.keywords))];
    const skills = vocabulary.some((skill) => findSkillOccurrences(sections, skill).length > 0);
    const domains = [contact, skills, education, practical.length > 0].filter(Boolean).length;
    // A content-rich project/work narrative can stand alone, without a
    // prescribed heading, contact details, or role-vocabulary overlap.
    const richNarrative = new Set(practical).size >= 2
        || practical.some((line) => substantive(line, 12));
    return ((education || practical.length > 0) && domains >= 2) || richNarrative;
};

// =========================================================
// 44. MAIN ANALYZER
// =========================================================

const analyzeResume = (
    resumeText,
    targetRole,
    jobDescription = ""
) => {

    if (typeof jobDescription !== "string" || jobDescription.length > 20000) {
        throw new Error("Job description must be a string of at most 20,000 characters.");
    }

    // -------------------------------------------------------
    // VALIDATION
    // -------------------------------------------------------

    if (
        !resumeText ||
        typeof resumeText !== "string"
    ) {

        throw new Error(
            "Resume text is required"
        );
    }

    if (
        !targetRole ||
        typeof targetRole !== "string"
    ) {

        throw new Error(
            "Target role is required"
        );
    }


    // -------------------------------------------------------
    // NORMALIZE ROLE
    // -------------------------------------------------------

    const normalizedRole =
        normalizeRole(
            targetRole
        );


    // -------------------------------------------------------
    // RESOLVE PROFILE
    // -------------------------------------------------------

    const resolved =
        resolveRoleProfile(
            normalizedRole
        );


    // -------------------------------------------------------
    // UNSUPPORTED ROLE
    // -------------------------------------------------------

    if (!resolved) {

        return {

            success: false,

            targetRole,

            normalizedRole,

            supportedRole: false,

            matchScore: 0,

            resumeQuality: 0,

            atsScore: 0,

            skillScore: 0,

            matchedSkills: [],

            missingSkills: [],

            weakSkills: [],

            skillDetails: [],

            evidenceSummary: {

                demonstrated: 0,

                supported: 0,

                mentioned: 0,

                missing: 0
            },

            strengths: [],

            weakAreas: [],

            recommendations: [],

            scoreBreakdown: {},

            limitations: [

                `Target role "${targetRole}" is not currently supported by the knowledge base.`
            ],

            message:
                `Target role "${targetRole}" is not currently supported.`,

            analysisVersion:
                "5.0-evidence-based"
        };
    }


    const roleKey =
        resolved.key;

    const profile =
        resolved.profile;


    // -------------------------------------------------------
    // PARSE RESUME
    // -------------------------------------------------------

    const sections =
        parseResumeSections(
            resumeText
        );


    if (!hasAssessableResumeEvidence(resumeText, sections)) {
        return {
            success: false,
            targetRole,
            normalizedRole: roleKey,
            supportedRole: true,
            message: "There is not enough recognizable resume information in the extracted text to provide a useful assessment. Upload a text-based resume containing your skills, education, projects, or work history."
        };
    }

    // -------------------------------------------------------
    // ANALYZE SKILLS
    // -------------------------------------------------------

    const skillDetails =
        analyzeRoleSkills(
            sections,
            profile
        );


    // -------------------------------------------------------
    // ROLE ALIGNMENT
    // -------------------------------------------------------

    const roleAlignment =
        calculateRoleAlignment(
            skillDetails
        );


    // -------------------------------------------------------
    // TECHNICAL SKILL SCORE
    // -------------------------------------------------------

    const technicalSkillScore =
        calculateTechnicalSkillScore(
            skillDetails
        );


    // -------------------------------------------------------
    // REQUIREMENT BREAKDOWN
    // -------------------------------------------------------

    const requirementBreakdown =
        calculateRequirementBreakdown(
            skillDetails
        );


    // -------------------------------------------------------
    // EVIDENCE SUMMARY
    // -------------------------------------------------------

    const evidenceSummary =
        calculateEvidenceSummary(
            skillDetails
        );


    // -------------------------------------------------------
    // RESUME QUALITY
    // -------------------------------------------------------

    const quality =
        calculateResumeQuality(
            resumeText,
            sections
        );


    // -------------------------------------------------------
    // ATS SCORE
    // -------------------------------------------------------

    const atsScore =
        calculateATSScore(
            quality
        );


    // -------------------------------------------------------
    // OVERALL SCORE
    // -------------------------------------------------------

    const overallScore =
        Math.round(

            quality.score * 0.40 +

            roleAlignment * 0.35 +

            technicalSkillScore * 0.25
        );


    // -------------------------------------------------------
    // STRENGTHS
    // -------------------------------------------------------

    const strengths =
        generateStrengths(
            skillDetails,
            quality
        );


    // -------------------------------------------------------
    // WEAK AREAS
    // -------------------------------------------------------

    const weakAreas =
        generateWeakAreas(
            skillDetails,
            quality
        );


    // -------------------------------------------------------
    // RECOMMENDATIONS
    // -------------------------------------------------------

    const recommendations =
        generateRecommendations(
            weakAreas,
            skillDetails
        );


    // -------------------------------------------------------
    // SKILL GROUPS
    // -------------------------------------------------------

    const matchedSkills =
        getMatchedSkills(
            skillDetails
        );

    const missingSkills =
        getMissingSkills(
            skillDetails
        );

    const weakSkills =
        getWeakSkills(
            skillDetails
        );


    // -------------------------------------------------------
    // SCORE BREAKDOWN
    // -------------------------------------------------------

    const scoreBreakdown =
        buildScoreBreakdown(
            quality,
            roleAlignment,
            technicalSkillScore,
            atsScore
        );


    // -------------------------------------------------------
    // ROLE SUMMARY
    // -------------------------------------------------------

    const roleSummary =
        buildRoleSummary(
            roleKey,
            profile
        );


    // -------------------------------------------------------
    // SECTION SUMMARY
    // -------------------------------------------------------

    const sectionSummary =
        buildSectionSummary(
            sections
        );


    // -------------------------------------------------------
    // EVIDENCE REPORT
    // -------------------------------------------------------

    const evidenceReport =
        buildEvidenceReport(
            skillDetails
        );


    // -------------------------------------------------------
    // LIMITATIONS
    // -------------------------------------------------------

    const limitations = [

        "Analysis is based on the text successfully extracted from the uploaded resume.",

        "A resume statement is not independent proof of real-world proficiency.",

        "Role alignment is evaluated against the selected role knowledge base, not a specific employer's job description.",

        "ATS compatibility varies between applicant tracking systems and employer configurations.",

        "Recommendations should only be implemented when they accurately reflect the candidate's real experience."
    ];


    // -------------------------------------------------------
    // SCORE METHODOLOGY
    // -------------------------------------------------------

    const scoreMethodology = {

        overall:
            "Overall score combines resume quality, target-role alignment, and technical skill evidence.",

        overallWeights: {
            resumeQuality: 40,
            roleAlignment: 35,
            technicalSkills: 25
        },

        roleAlignment:
            "Weighted evidence score based on the selected role's requirements.",

        technicalSkills:
            "Average evidence score across role-specific skills.",

        resumeQuality:
            "Evaluates contact information, resume sections, action verbs, measurable results, readability, ATS text safety, experience, and projects.",

        atsCompatibility:
            "Separate estimate based on extracted text safety, section structure, readability, and contact information.",

        evidenceLevels: {

            demonstrated:
                "Strong practical evidence appears in project or professional experience.",

            supported:
                "Supporting evidence appears in projects, experience, certifications, or related sections.",

            mentioned:
                "The skill is listed or referenced but strong practical evidence was not found.",

            missing:
                "No supporting evidence was found."
        }
    };


    // -------------------------------------------------------
    // FINAL RESULT
    // -------------------------------------------------------

    return {

        success: true,

        ...(jobDescription.trim() ? { jobDescriptionMatch: buildJobDescriptionMatch(jobDescription.trim(), sections) } : {}),

        targetRole,

        normalizedRole:
            roleKey,

        supportedRole: true,


        // -----------------------------------------------
        // PRIMARY SCORES
        // -----------------------------------------------

        overallScore,

        matchScore:
            roleAlignment,

        resumeMatch:
            roleAlignment,

        skillScore:
            technicalSkillScore,

        resumeQuality:
            quality.score,

        atsScore,


        // -----------------------------------------------
        // SCORE INTERPRETATIONS
        // -----------------------------------------------

        scoreInterpretations: {

            overall:
                interpretScore(
                    overallScore
                ),

            roleAlignment:
                interpretScore(
                    roleAlignment
                ),

            technicalSkills:
                interpretScore(
                    technicalSkillScore
                ),

            resumeQuality:
                interpretScore(
                    quality.score
                ),

            atsCompatibility:
                interpretScore(
                    atsScore
                )
        },


        // -----------------------------------------------
        // FRONTEND SCORE OBJECT
        // -----------------------------------------------

        scores: {

            overall:
                overallScore,

            roleAlignment,

            technicalSkills:
                technicalSkillScore,

            resumeQuality:
                quality.score,

            atsCompatibility:
                atsScore
        },


        // -----------------------------------------------
        // ROLE INFORMATION
        // -----------------------------------------------

        roleSummary,


        // -----------------------------------------------
        // SKILLS
        // -----------------------------------------------

        matchedSkills,

        missingSkills,

        weakSkills,

        skillDetails,


        // -----------------------------------------------
        // EVIDENCE
        // -----------------------------------------------

        evidenceSummary,

        evidenceReport,


        // -----------------------------------------------
        // REQUIREMENTS
        // -----------------------------------------------

        requirementBreakdown,


        // -----------------------------------------------
        // RESUME QUALITY
        // -----------------------------------------------

        resumeHealth: {

            contact:
                quality.contact,

            sections:
                quality.sections,

            actionVerbs:
                quality.actionVerbs,

            quantification:
                quality.metrics,

            readability:
                quality.readability,

            atsSafety:
                quality.atsSafety,

            experience:
                quality.experience,

            projects:
                quality.projects
        },


        // -----------------------------------------------
        // SECTION INFORMATION
        // -----------------------------------------------

        sectionSummary,


        // -----------------------------------------------
        // INSIGHTS
        // -----------------------------------------------

        strengths,

        weakAreas,

        recommendations,


        // -----------------------------------------------
        // BREAKDOWN
        // -----------------------------------------------

        scoreBreakdown: {

            ...scoreBreakdown,

            requirementBreakdown
        },


        // -----------------------------------------------
        // METHODOLOGY
        // -----------------------------------------------

        scoreMethodology,


        // -----------------------------------------------
        // LIMITATIONS
        // -----------------------------------------------

        limitations,


        // -----------------------------------------------
        // VERSION
        // -----------------------------------------------

        analysisVersion:
            "5.0-evidence-based"
    };
};


// =========================================================
// 45. UTILITY
// =========================================================

const capitalize = (
    value
) => {

    const text =
        String(value || "");

    if (!text) {
        return "";
    }

    return (
        text.charAt(0)
            .toUpperCase() +
        text.slice(1)
    );
};


// =========================================================
// 46. EXPORTS
// =========================================================

module.exports = {

    analyzeResume,

    ROLE_PROFILES,

    ROLE_KNOWLEDGE_BASE,

    normalizeRole
};