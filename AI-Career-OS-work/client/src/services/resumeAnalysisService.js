// =========================================================
// AI CAREER OS
// RESUME INTELLIGENCE ENGINE
// Evidence-based scoring with separate ATS compatibility
// =========================================================

const ROLE_KNOWLEDGE_BASE = require("./roleKnowledgeBase");

// ---------------------------------------------------------
// ROLE PROFILES
// ---------------------------------------------------------

const ROLE_ALIASES = {
    "full stack": "full stack developer",
    "fullstack": "full stack developer",
    "fullstack developer": "full stack developer",

    "frontend": "frontend developer",
    "front end": "frontend developer",
    "front-end": "frontend developer",

    "backend": "backend developer",
    "back end": "backend developer",
    "back-end": "backend developer",

    "software developer": "software engineer",
    "sde": "software engineer",

    "java": "java developer",
    "java dev": "java developer",

    "python": "python developer",

    "data science": "data scientist",
    "data scientis": "data scientist",

    "ml engineer": "machine learning engineer",
    "machine learning": "machine learning engineer",

    "ai": "ai engineer",
    "ai developer": "ai engineer",

    "cloud": "cloud engineer",

    "devops": "devops engineer",

    "cyber security": "cybersecurity engineer",
    "cybersecurity": "cybersecurity engineer",

    "network": "network engineer",

    "embedded": "embedded engineer",

    "mechanical": "mechanical engineer",

    "civil": "civil engineer",

    "electrical": "electrical engineer",

    "electronics": "electronics engineer",

    "chemical": "chemical engineer",

    "biomedical": "biomedical engineer",

    "automotive": "automotive engineer",

    "aerospace": "aerospace engineer"
};

const buildRoleProfiles = () => {
    const profiles = {};

    for (
        const [roleName, role]
        of Object.entries(ROLE_KNOWLEDGE_BASE || {})
    ) {
        const coreSkills =
            Array.isArray(role.coreSkills)
                ? role.coreSkills
                : [];

        const importantSkills =
            Array.isArray(role.importantSkills)
                ? role.importantSkills
                : [];

        const optionalSkills =
            Array.isArray(role.optionalSkills)
                ? role.optionalSkills
                : [];

        const tools =
            Array.isArray(role.tools)
                ? role.tools
                : [];

        const concepts =
            Array.isArray(role.concepts)
                ? role.concepts
                : [];

        const keywords = [
            ...new Set(
                [
                    ...coreSkills,
                    ...importantSkills,
                    ...optionalSkills,
                    ...tools,
                    ...concepts
                ]
                    .map(
                        value =>
                            String(value)
                                .trim()
                                .toLowerCase()
                    )
                    .filter(Boolean)
            )
        ];

        profiles[roleName] = {
            ...role,

            coreSkills,
            importantSkills,
            optionalSkills,
            tools,
            concepts,

            keywords,

            displayNames:
                Object.fromEntries(
                    keywords.map(
                        skill => [
                            skill,
                            displayName(skill)
                        ]
                    )
                )
        };
    }

    return profiles;
};

const ROLE_PROFILES =
    buildRoleProfiles();

// ---------------------------------------------------------
// NORMALIZATION / MATCHING
// ---------------------------------------------------------

const SKILL_ALIASES = {
    javascript: [
        "javascript",
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
        "expressjs"
    ],

    "rest api": [
        "rest api",
        "rest apis",
        "restful api",
        "restful apis"
    ],

    mongodb: [
        "mongodb",
        "mongo db"
    ],

    "scikit-learn": [
        "scikit-learn",
        "scikit learn",
        "sklearn"
    ],

    python: [
        "python",
        "python3"
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

    "object oriented programming": [
        "object oriented programming",
        "object-oriented programming",
        "object oriented",
        "object-oriented"
    ],

    "ci/cd": [
        "ci/cd",
        "ci cd",
        "ci-cd",
        "continuous integration",
        "continuous deployment",
        "continuous delivery"
    ],

    "tcp/ip": [
        "tcp/ip",
        "tcp ip"
    ],

    i2c: [
        "i2c",
        "i²c"
    ],

    "data visualization": [
        "data visualization",
        "data visualisation"
    ],

    "machine learning": [
        "machine learning",
        "machine-learning"
    ]
};

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
        "technologies",
        "technical expertise"
    ],

    experience: [
        "experience",
        "work experience",
        "professional experience",
        "employment",
        "internship",
        "internships"
    ],

    projects: [
        "projects",
        "project",
        "project experience",
        "personal projects",
        "academic projects",
        "technical projects"
    ],

    education: [
        "education",
        "academic background",
        "academic qualifications",
        "qualifications"
    ],

    certifications: [
        "certifications",
        "certification",
        "licenses",
        "certificates",
        "licenses & certifications"
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

const ACTION_VERBS = [
    "built",
    "developed",
    "implemented",
    "created",
    "designed",
    "engineered",
    "deployed",
    "configured",
    "automated",
    "analyzed",
    "analysed",
    "optimized",
    "integrated",
    "tested",
    "improved",
    "trained",
    "evaluated",
    "applied",
    "managed",
    "maintained",
    "delivered",
    "architected",
    "migrated",
    "refactored",
    "led"
];

// ---------------------------------------------------------
// TEXT HELPERS
// ---------------------------------------------------------

const normalizeText = text =>
    String(text || "")
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

const normalizeLine = line =>
    String(line || "")
        .toLowerCase()
        .replace(/[•●▪◦■□◆◇]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

const escapeRegExp = value =>
    String(value).replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );

const displayName = skill =>
    String(skill)
        .split(" ")
        .map(word => {
            if (word.length <= 3) {
                return word.toUpperCase();
            }

            return (
                word.charAt(0).toUpperCase() +
                word.slice(1)
            );
        })
        .join(" ");

const phraseExists = (
    text,
    phrase
) => {
    if (!text || !phrase) {
        return false;
    }

    const normalizedText =
        normalizeLine(text);

    const key =
        String(phrase)
            .toLowerCase()
            .trim();

    const variants = [
        key,
        ...(SKILL_ALIASES[key] || [])
    ];

    return variants.some(
        variant => {
            const escaped =
                escapeRegExp(
                    normalizeLine(
                        variant
                    )
                );

            return new RegExp(
                `(^|[^a-z0-9+#])${escaped}([^a-z0-9+#]|$)`,
                "i"
            ).test(
                normalizedText
            );
        }
    );
};

// ---------------------------------------------------------
// ROLE NORMALIZATION
// ---------------------------------------------------------

const normalizeRole = targetRole => {
    if (
        typeof targetRole !==
        "string"
    ) {
        return null;
    }

    const normalized =
        targetRole
            .toLowerCase()
            .trim()
            .replace(
                /[.,!?]+$/g,
                ""
            )
            .replace(
                /\s+/g,
                " "
            );

    return (
        ROLE_ALIASES[
            normalized
        ] ||
        normalized
    );
};

// ---------------------------------------------------------
// SECTION PARSING
// ---------------------------------------------------------

const detectSection = line => {
    const clean =
        normalizeLine(line)
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
            aliases.some(
                alias =>
                    clean === alias
            )
        ) {
            return section;
        }
    }

    return null;
};

const parseResumeSections =
    resumeText => {
        const sections = {
            header: [],
            summary: [],
            skills: [],
            experience: [],
            projects: [],
            education: [],
            certifications: [],
            achievements: [],
            publications: [],
            other: []
        };

        let current =
            "header";

        for (
            const raw
            of normalizeText(
                resumeText
            ).split("\n")
        ) {
            const line =
                raw.trim();

            if (!line) {
                continue;
            }

            const section =
                detectSection(
                    line
                );

            if (section) {
                current = section;
                continue;
            }

            sections[
                current
            ].push(line);
        }

        return sections;
    };

const sectionText = (
    sections,
    name
) =>
    (
        sections[name] ||
        []
    ).join("\n");

// ---------------------------------------------------------
// EVIDENCE ANALYSIS
// ---------------------------------------------------------

const requirementMetadata = (
    profile,
    skill
) => {
    if (
        profile.coreSkills.includes(
            skill
        )
    ) {
        return {
            type: "core",
            weight: 1.00
        };
    }

    if (
        profile.importantSkills.includes(
            skill
        )
    ) {
        return {
            type: "important",
            weight: 0.80
        };
    }

    if (
        profile.tools.includes(
            skill
        )
    ) {
        return {
            type: "tool",
            weight: 0.60
        };
    }

    if (
        profile.concepts.includes(
            skill
        )
    ) {
        return {
            type: "concept",
            weight: 0.70
        };
    }

    if (
        profile.optionalSkills.includes(
            skill
        )
    ) {
        return {
            type: "optional",
            weight: 0.40
        };
    }

    return {
        type: "requirement",
        weight: 0.70
    };
};

const actionEvidence =
    line =>
        ACTION_VERBS.some(
            verb =>
                phraseExists(
                    line,
                    verb
                )
        );

const getSkillOccurrences = (
    sections,
    skill
) => {
    const results = [];

    for (
        const [
            section,
            lines
        ]
        of Object.entries(
            sections
        )
    ) {
        if (
            !Array.isArray(
                lines
            )
        ) {
            continue;
        }

        for (
            const line
            of lines
        ) {
            if (
                !phraseExists(
                    line,
                    skill
                )
            ) {
                continue;
            }

            let strength =
                0.20;

            let evidenceType =
                "mentioned";

            if (
                section ===
                    "experience" &&
                actionEvidence(line)
            ) {
                strength = 1.00;
                evidenceType =
                    "demonstrated";
            }

            else if (
                section ===
                    "projects" &&
                actionEvidence(line)
            ) {
                strength = 0.95;
                evidenceType =
                    "demonstrated";
            }

            else if (
                (
                    section ===
                        "experience" ||
                    section ===
                        "projects"
                ) &&
                line.length >= 45
            ) {
                strength = 0.75;
                evidenceType =
                    "supported";
            }

            else if (
                section ===
                "certifications"
            ) {
                strength = 0.70;
                evidenceType =
                    "supported";
            }

            else if (
                section ===
                "skills"
            ) {
                strength = 0.55;
                evidenceType =
                    "mentioned";
            }

            else if (
                section ===
                "education"
            ) {
                strength = 0.45;
                evidenceType =
                    "mentioned";
            }

            else if (
                section ===
                "summary"
            ) {
                strength = 0.40;
                evidenceType =
                    "mentioned";
            }

            results.push({
                section,
                line,
                strength,
                evidenceType
            });
        }
    }

    return results;
};

// ---------------------------------------------------------
// ANALYZE ONE SKILL
// ---------------------------------------------------------

const analyzeSkill = (
    sections,
    profile,
    skill
) => {
    const requirement =
        requirementMetadata(
            profile,
            skill
        );

    const occurrences =
        getSkillOccurrences(
            sections,
            skill
        );

    if (
        !occurrences.length
    ) {
        return {
            skill,

            displayName:
                profile
                    .displayNames[
                    skill
                ] ||
                displayName(skill),

            status:
                "missing",

            confidence:
                0,

            sources: [],

            evidence:
                null,

            evidenceDetails:
                [],

            requirementType:
                requirement.type,

            importanceWeight:
                requirement.weight
        };
    }

    const best =
        occurrences.reduce(
            (a, b) =>
                b.strength >
                a.strength
                    ? b
                    : a
        );

    const status =
        best.strength >= 0.90
            ? "demonstrated"
            : best.strength >= 0.65
                ? "supported"
                : "mentioned";

    return {
        skill,

        displayName:
            profile
                .displayNames[
                skill
            ] ||
            displayName(skill),

        status,

        confidence:
            Math.round(
                best.strength *
                100
            ),

        sources: [
            ...new Set(
                occurrences.map(
                    item =>
                        item.section
                )
            )
        ],

        evidence:
            best.line,

        evidenceDetails:
            occurrences,

        requirementType:
            requirement.type,

        importanceWeight:
            requirement.weight
    };
};

// ---------------------------------------------------------
// EVIDENCE VALUES
// ---------------------------------------------------------

const evidenceValue =
    status => ({
        demonstrated: 1.00,
        supported: 0.70,
        mentioned: 0.20,
        missing: 0
    }[status] ?? 0);

// ---------------------------------------------------------
// WEIGHTED SCORE
// ---------------------------------------------------------

const weightedScore =
    details => {
        if (
            !details.length
        ) {
            return 0;
        }

        let earned = 0;
        let total = 0;

        for (
            const item
            of details
        ) {
            const weight =
                Number(
                    item.importanceWeight
                ) || 0.70;

            total += weight;

            earned +=
                weight *
                evidenceValue(
                    item.status
                );
        }

        return total
            ? Math.round(
                (
                    earned /
                    total
                ) * 100
            )
            : 0;
    };

// ---------------------------------------------------------
// ROLE ALIGNMENT
// ---------------------------------------------------------

const calculateRoleAlignment =
    details => {
        const applicable =
            details.filter(
                item =>
                    item.requirementType !==
                    "optional"
            );

        return {
            score:
                weightedScore(
                    applicable
                ),

            rawScore:
                applicable.reduce(
                    (
                        sum,
                        item
                    ) =>
                        sum +
                        item.importanceWeight *
                        evidenceValue(
                            item.status
                        ),
                    0
                ),

            totalWeight:
                applicable.reduce(
                    (
                        sum,
                        item
                    ) =>
                        sum +
                        item.importanceWeight,
                    0
                )
        };
    };

// ---------------------------------------------------------
// TECHNICAL SKILLS
// ---------------------------------------------------------

const calculateTechnicalSkills =
    details => {
        const technical =
            details.filter(
                item =>
                    [
                        "core",
                        "important",
                        "tool",
                        "concept"
                    ].includes(
                        item.requirementType
                    )
            );

        return weightedScore(
            technical
        );
    };

// ---------------------------------------------------------
// RESUME QUALITY HELPERS
// ---------------------------------------------------------

const countWords =
    text =>
        normalizeText(
            text
        )
            .split(/\s+/)
            .filter(Boolean)
            .length;

const calculateContactScore =
    text => {
        let score = 0;

        if (
            /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i
                .test(text)
        ) {
            score += 35;
        }

        if (
            /(?:\+?\d[\d\s().-]{7,}\d)/
                .test(text)
        ) {
            score += 25;
        }

        if (
            /\blinkedin(?:\.com)?\b/i
                .test(text)
        ) {
            score += 20;
        }

        if (
            /\bgithub(?:\.com)?\b/i
                .test(text)
        ) {
            score += 20;
        }

        return Math.min(
            100,
            score
        );
    };

const calculateSectionScore =
    sections => {
        const core = [
            "skills",
            "experience",
            "projects",
            "education"
        ];

        const optional = [
            "summary",
            "certifications"
        ];

        const corePresent =
            core.filter(
                section =>
                    sections[
                        section
                    ]?.length > 0
            ).length;

        const optionalPresent =
            optional.filter(
                section =>
                    sections[
                        section
                    ]?.length > 0
            ).length;

        return Math.round(
            (
                corePresent /
                core.length
            ) * 85 +
            (
                optionalPresent /
                optional.length
            ) * 15
        );
    };

const calculateActionScore =
    text => {
        const found =
            new Set(
                ACTION_VERBS.filter(
                    verb =>
                        phraseExists(
                            text,
                            verb
                        )
                )
            ).size;

        if (found >= 8) {
            return 100;
        }

        if (found >= 6) {
            return 90;
        }

        if (found >= 4) {
            return 75;
        }

        if (found >= 2) {
            return 55;
        }

        if (found === 1) {
            return 35;
        }

        return 10;
    };

const calculateMetricsScore =
    text => {
        const matches =
            text.match(
                /\b\d+(?:\.\d+)?\s*(?:%|users?|requests?|ms|seconds?|hours?|days?|months?|years?|projects?|records?|clients?|customers?)\b/gi
            ) || [];

        const count =
            matches.length;

        if (count >= 6) {
            return 100;
        }

        if (count >= 4) {
            return 85;
        }

        if (count >= 2) {
            return 65;
        }

        if (count === 1) {
            return 45;
        }

        return 10;
    };

const calculateReadabilityScore =
    text => {
        const lines =
            normalizeText(
                text
            ).split("\n");

        const longLines =
            lines.filter(
                line =>
                    line.length > 180
            ).length;

        const extremelyLong =
            lines.filter(
                line =>
                    line.length > 280
            ).length;

        const bullets =
            lines.filter(
                line =>
                    /^[•●▪◦*-]\s+/.test(
                        line
                    )
            ).length;

        let score = 100;

        score -= Math.min(
            35,
            longLines * 5
        );

        score -= Math.min(
            30,
            extremelyLong * 10
        );

        if (
            bullets === 0
        ) {
            score -= 12;
        }

        return Math.max(
            0,
            Math.min(
                100,
                score
            )
        );
    };

// ---------------------------------------------------------
// ATS COMPATIBILITY
// ---------------------------------------------------------
//
// IMPORTANT:
// This is NOT an employer's private ATS score.
// It is a text-level compatibility estimate.
// ---------------------------------------------------------

const calculateAtsCompatibility =
    (
        text,
        sections
    ) => {
        const normalized =
            normalizeText(
                text
            );

        let score = 0;

        const checks = {};

        // Text extraction
        const wordCount =
            countWords(
                normalized
            );

        checks.textExtracted =
            wordCount >= 120;

        score +=
            checks.textExtracted
                ? 15
                : 0;

        // Email
        checks.email =
            /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i
                .test(normalized);

        score +=
            checks.email
                ? 10
                : 0;

        // Phone
        checks.phone =
            /(?:\+?\d[\d\s().-]{7,}\d)/
                .test(normalized);

        score +=
            checks.phone
                ? 8
                : 0;

        // Standard sections
        const headingCount =
            [
                "skills",
                "experience",
                "projects",
                "education",
                "certifications",
                "summary"
            ].filter(
                section =>
                    sections[
                        section
                    ]?.length > 0
            ).length;

        checks.standardSections =
            headingCount >= 3;

        score +=
            checks.standardSections
                ? 15
                : headingCount * 4;

        // Parser noise
        const replacementChars =
            (
                normalized.match(
                    /�/g
                ) || []
            ).length;

        const repeatedSeparators =
            (
                normalized.match(
                    /[_=]{5,}/g
                ) || []
            ).length;

        checks.cleanText =
            replacementChars === 0 &&
            repeatedSeparators <= 1;

        score +=
            checks.cleanText
                ? 12
                : 4;

        // Reasonable length
        checks.reasonableLength =
            wordCount >= 180 &&
            wordCount <= 1200;

        score +=
            checks.reasonableLength
                ? 10
                : wordCount >= 100
                    ? 6
                    : 2;

        // Bullet structure
        const bulletCount =
            normalized
                .split("\n")
                .filter(
                    line =>
                        /^[•●▪◦*-]\s+/.test(
                            line
                        )
                ).length;

        checks.bullets =
            bulletCount >= 3;

        score +=
            checks.bullets
                ? 8
                : 3;

        // Text-level only
        checks.textLevelOnly =
            true;

        score += 14;

        return {
            score:
                Math.max(
                    0,
                    Math.min(
                        100,
                        Math.round(
                            score
                        )
                    )
                ),

            checks,

            scope:
                "text-level parsing and structure compatibility"
        };
    };

// ---------------------------------------------------------
// RESUME QUALITY
// ---------------------------------------------------------

const calculateResumeQuality =
    (
        text,
        sections
    ) => {
        const contact =
            calculateContactScore(
                text
            );

        const sectionsScore =
            calculateSectionScore(
                sections
            );

        const actionVerbs =
            calculateActionScore(
                text
            );

        const metrics =
            calculateMetricsScore(
                text
            );

        const readability =
            calculateReadabilityScore(
                text
            );

        const words =
            countWords(text);

        const contentLength =
            Math.min(
                100,
                words >= 300 &&
                words <= 900
                    ? 100
                    : words >= 180
                        ? 75
                        : 40
            );

        const atsSafety =
            calculateAtsCompatibility(
                text,
                sections
            );

        // Resume quality is separate from ATS compatibility.
        const score =
            Math.round(
                contact * 0.15 +
                sectionsScore * 0.20 +
                actionVerbs * 0.15 +
                metrics * 0.15 +
                readability * 0.15 +
                contentLength * 0.10 +
                atsSafety.score * 0.10
            );

        return {
            score:
                Math.max(
                    0,
                    Math.min(
                        100,
                        score
                    )
                ),

            contact,

            sections:
                sectionsScore,

            actionVerbs,

            metrics,

            readability,

            contentLength,

            atsSafety,

            experience: {
                score:
                    sections
                        .experience
                        ?.length
                        ? 70
                        : 0,

                hasExperience:
                    Boolean(
                        sections
                            .experience
                            ?.length
                    )
            },

            projects: {
                score:
                    sections
                        .projects
                        ?.length
                        ? 70
                        : 0,

                hasProjects:
                    Boolean(
                        sections
                            .projects
                            ?.length
                    )
            }
        };
    };

// ---------------------------------------------------------
// REQUIREMENT BREAKDOWN
// ---------------------------------------------------------

const calculateRequirementBreakdown =
    details => {
        const result = {};

        for (
            const item
            of details
        ) {
            const type =
                result[
                    item.requirementType
                ] ||
                {
                    total: 0,
                    demonstrated: 0,
                    supported: 0,
                    mentioned: 0,
                    missing: 0
                };

            type.total += 1;

            type[
                item.status
            ] += 1;

            result[
                item.requirementType
            ] = type;
        }

        return result;
    };

// ---------------------------------------------------------
// STRENGTHS
// ---------------------------------------------------------

const generateStrengths =
    details =>
        details
            .filter(
                item =>
                    [
                        "demonstrated",
                        "supported"
                    ].includes(
                        item.status
                    )
            )
            .sort(
                (a, b) =>
                    b.confidence -
                    a.confidence
            )
            .slice(0, 8)
            .map(
                item => ({
                    type:
                        "strength",

                    title:
                        `${item.displayName} demonstrated`,

                    detail:
                        "Practical evidence found in the resume.",

                    skill:
                        item.skill,

                    evidence:
                        item.evidence,

                    source:
                        item.sources.join(
                            ", "
                        )
                })
            );

// ---------------------------------------------------------
// WEAK AREAS
// ---------------------------------------------------------

const generateWeakAreas =
    details =>
        details
            .filter(
                item =>
                    item.status !==
                    "demonstrated"
            )
            .sort(
                (a, b) => {
                    const order = {
                        missing: 0,
                        mentioned: 1,
                        supported: 2
                    };

                    return (
                        order[
                            a.status
                        ] -
                        order[
                            b.status
                        ]
                    );
                }
            )
            .slice(0, 12)
            .map(
                item => ({
                    type:
                        item.status ===
                        "missing"
                            ? "gap"
                            : "weak",

                    title:
                        item.displayName,

                    detail:
                        item.status ===
                        "missing"
                            ? "No supporting evidence was detected."
                            : item.status ===
                              "mentioned"
                                ? "Listed or mentioned, but practical evidence is limited."
                                : "Some evidence exists; stronger implementation evidence would help.",

                    skill:
                        item.skill
                })
            );

// ---------------------------------------------------------
// RECOMMENDATIONS
// ---------------------------------------------------------

const generateRecommendations =
    (
        details,
        sections
    ) => {
        const recommendations =
            [];

        const missing =
            details.filter(
                item =>
                    item.status ===
                    "missing"
            );

        const mentioned =
            details.filter(
                item =>
                    item.status ===
                    "mentioned"
            );

        for (
            const item
            of missing.slice(0, 6)
        ) {
            recommendations.push({
                priority:
                    item.requirementType ===
                    "core"
                        ? "high"
                        : "medium",

                category:
                    "skills",

                action:
                    `Build evidence for ${item.displayName}`,

                reason:
                    `The selected role profile expects ${item.displayName}, but it was not detected in the resume.`
            });
        }

        if (
            mentioned.length
        ) {
            recommendations.push({
                priority:
                    "medium",

                category:
                    "evidence",

                action:
                    "Turn listed skills into evidence",

                reason:
                    "Show where important skills were used in projects, experience, research, or certifications."
            });
        }

        if (
            !sections.projects?.length
        ) {
            recommendations.push({
                priority:
                    "high",

                category:
                    "projects",

                action:
                    "Add relevant projects",

                reason:
                    "Projects provide practical evidence of technical ability."
            });
        }

        if (
            !sections.experience?.length
        ) {
            recommendations.push({
                priority:
                    "medium",

                category:
                    "experience",

                action:
                    "Add relevant experience",

                reason:
                    "Internships, employment, research, or practical work can strengthen role evidence."
            });
        }

        recommendations.push({
            priority:
                "high",

            category:
                "accuracy",

            action:
                "Keep every claim truthful",

            reason:
                "The analyzer should improve presentation of real experience, not encourage invented skills or achievements."
        });

        return recommendations.slice(
            0,
            10
        );
    };

// ---------------------------------------------------------
// EVIDENCE REPORT
// ---------------------------------------------------------

const generateEvidenceReport =
    details =>
        details.map(
            item => ({
                skill:
                    item.skill,

                title:
                    item.displayName,

                status:
                    item.status,

                confidence:
                    item.confidence,

                requirementType:
                    item.requirementType,

                evidence:
                    item.evidence,

                source:
                    item.sources
            })
        );

// ---------------------------------------------------------
// SCORE INTERPRETATION
// ---------------------------------------------------------

const interpretScore =
    score => {
        if (score >= 85) {
            return "Strong";
        }

        if (score >= 70) {
            return "Good";
        }

        if (score >= 50) {
            return "Developing";
        }

        if (score >= 30) {
            return "Needs significant work";
        }

        return "Early stage";
    };

// =========================================================
// MAIN ANALYZER
// =========================================================

const analyzeResume = (
    resumeText,
    targetRole
) => {
    if (
        !resumeText ||
        !String(
            resumeText
        ).trim()
    ) {
        throw new Error(
            "Resume text is required"
        );
    }

    if (
        !targetRole ||
        !String(
            targetRole
        ).trim()
    ) {
        throw new Error(
            "Target role is required"
        );
    }

    const normalizedRole =
        normalizeRole(
            targetRole
        );

    const profile =
        ROLE_PROFILES[
            normalizedRole
        ];

    // -----------------------------------------------------
    // UNSUPPORTED ROLE
    // -----------------------------------------------------

    if (!profile) {
        return {
            success:
                false,

            supportedRole:
                false,

            targetRole,

            normalizedRole:
                null,

            overallScore:
                0,

            matchScore:
                0,

            skillScore:
                0,

            resumeQuality:
                0,

            atsScore:
                0,

            scores: {
                overall:
                    0,

                roleAlignment:
                    0,

                technicalSkills:
                    0,

                resumeQuality:
                    0,

                atsCompatibility:
                    0
            },

            matchedSkills:
                [],

            missingSkills:
                [],

            skillDetails:
                [],

            strengths:
                [],

            weakAreas: [
                {
                    type:
                        "unsupported",

                    title:
                        "Unsupported target role",

                    detail:
                        "This role is not present in the configured role knowledge base."
                }
            ],

            recommendations: [
                {
                    priority:
                        "high",

                    category:
                        "role",

                    action:
                        "Choose a supported target role",

                    reason:
                        "Role-specific scoring requires a configured role profile."
                }
            ],

            limitations: [
                "Role-specific analysis requires a configured role profile."
            ],

            analysisVersion:
                "6.0-evidence-based"
        };
    }

    // -----------------------------------------------------
    // PARSE RESUME
    // -----------------------------------------------------

    const text =
        normalizeText(
            resumeText
        );

    const sections =
        parseResumeSections(
            text
        );

    // -----------------------------------------------------
    // ANALYZE SKILLS
    // -----------------------------------------------------

    const skillDetails =
        profile.keywords.map(
            skill =>
                analyzeSkill(
                    sections,
                    profile,
                    skill
                )
        );

    // -----------------------------------------------------
    // CALCULATE SCORES
    // -----------------------------------------------------

    const roleAlignment =
        calculateRoleAlignment(
            skillDetails
        );

    const technicalSkills =
        calculateTechnicalSkills(
            skillDetails
        );

    const quality =
        calculateResumeQuality(
            text,
            sections
        );

    // IMPORTANT:
    // ATS is now independent from resume quality.
    const atsCompatibility =
        quality.atsSafety.score;

    // -----------------------------------------------------
    // OVERALL SCORE
    // -----------------------------------------------------
    //
    // Resume Quality  = 40%
    // Role Alignment  = 35%
    // Technical Skills = 25%
    //
    // -----------------------------------------------------

    const overallScore =
        Math.round(
            quality.score * 0.40 +
            roleAlignment.score * 0.35 +
            technicalSkills * 0.25
        );

    // -----------------------------------------------------
    // MATCHED SKILLS
    // -----------------------------------------------------

    const matchedSkills =
        skillDetails
            .filter(
                item =>
                    [
                        "demonstrated",
                        "supported"
                    ].includes(
                        item.status
                    )
            )
            .map(
                item =>
                    item.displayName
            );

    // -----------------------------------------------------
    // MENTIONED SKILLS
    // -----------------------------------------------------

    const mentionedSkills =
        skillDetails
            .filter(
                item =>
                    item.status ===
                    "mentioned"
            )
            .map(
                item =>
                    item.displayName
            );

    // -----------------------------------------------------
    // MISSING SKILLS
    // -----------------------------------------------------

    const missingSkills =
        skillDetails
            .filter(
                item =>
                    item.status ===
                    "missing"
            )
            .map(
                item =>
                    item.displayName
            );

    // -----------------------------------------------------
    // EVIDENCE SUMMARY
    // -----------------------------------------------------

    const evidenceSummary = {
        demonstrated:
            skillDetails.filter(
                item =>
                    item.status ===
                    "demonstrated"
            ).length,

        supported:
            skillDetails.filter(
                item =>
                    item.status ===
                    "supported"
            ).length,

        mentioned:
            skillDetails.filter(
                item =>
                    item.status ===
                    "mentioned"
            ).length,

        missing:
            skillDetails.filter(
                item =>
                    item.status ===
                    "missing"
            ).length
    };

    // -----------------------------------------------------
    // REQUIREMENT BREAKDOWN
    // -----------------------------------------------------

    const requirementBreakdown =
        calculateRequirementBreakdown(
            skillDetails
        );

    // -----------------------------------------------------
    // INSIGHTS
    // -----------------------------------------------------

    const strengths =
        generateStrengths(
            skillDetails
        );

    const weakAreas =
        generateWeakAreas(
            skillDetails
        );

    const recommendations =
        generateRecommendations(
            skillDetails,
            sections
        );

    // -----------------------------------------------------
    // ROLE GAPS
    // -----------------------------------------------------

    const roleGaps =
        skillDetails
            .filter(
                item =>
                    item.status ===
                    "missing"
            )
            .map(
                item => ({
                    skill:
                        item.skill,

                    title:
                        item.displayName,

                    requirementType:
                        item.requirementType
                })
            );

    // -----------------------------------------------------
    // SCORE BREAKDOWN
    // -----------------------------------------------------

    const scoreBreakdown = {
        overall: {
            resumeQuality: {
                weight:
                    40,

                score:
                    quality.score,

                contribution:
                    Math.round(
                        quality.score *
                        0.40
                    )
            },

            roleAlignment: {
                weight:
                    35,

                score:
                    roleAlignment.score,

                contribution:
                    Math.round(
                        roleAlignment.score *
                        0.35
                    )
            },

            technicalSkills: {
                weight:
                    25,

                score:
                    technicalSkills,

                contribution:
                    Math.round(
                        technicalSkills *
                        0.25
                    )
            }
        },

        resumeQuality:
            quality,

        requirementBreakdown
    };

    // =====================================================
    // FINAL REPORT
    // =====================================================

    return {
        success:
            true,

        supportedRole:
            true,

        analysisVersion:
            "6.0-evidence-based",

        analyzedAt:
            new Date().toISOString(),

        targetRole,

        normalizedRole,

        // -------------------------------------------------
        // MAIN SCORES
        // -------------------------------------------------

        overallScore,

        matchScore:
            roleAlignment.score,

        resumeMatch:
            roleAlignment.score,

        skillScore:
            technicalSkills,

        // -------------------------------------------------
        // ATS
        // -------------------------------------------------
        //
        // IMPORTANT:
        // atsScore is now ATS compatibility.
        // It is NOT resume quality.
        //

        atsScore:
            atsCompatibility,

        atsCompatibility,

        // -------------------------------------------------
        // SCORE OBJECT
        // -------------------------------------------------

        scores: {
            overall:
                overallScore,

            roleAlignment:
                roleAlignment.score,

            technicalSkills,

            resumeQuality:
                quality.score,

            atsCompatibility,

            projectStrength:
                quality.projects.score,

            experienceStrength:
                quality.experience.score,

            impactStrength:
                quality.metrics,

            readability:
                quality.readability
        },

        // -------------------------------------------------
        // INTERPRETATIONS
        // -------------------------------------------------

        scoreInterpretations: {
            overall:
                interpretScore(
                    overallScore
                ),

            roleAlignment:
                interpretScore(
                    roleAlignment.score
                ),

            technicalSkills:
                interpretScore(
                    technicalSkills
                ),

            resumeQuality:
                interpretScore(
                    quality.score
                ),

            atsCompatibility:
                interpretScore(
                    atsCompatibility
                )
        },

        // -------------------------------------------------
        // ROLE ALIGNMENT
        // -------------------------------------------------

        roleAlignment: {
            score:
                roleAlignment.score,

            interpretation:
                interpretScore(
                    roleAlignment.score
                ),

            rawScore:
                roleAlignment.rawScore,

            totalWeight:
                roleAlignment.totalWeight
        },

        // -------------------------------------------------
        // SKILLS
        // -------------------------------------------------

        matchedSkills,

        mentionedSkills,

        missingSkills,

        roleGaps,

        skillDetails,

        // -------------------------------------------------
        // EVIDENCE
        // -------------------------------------------------

        evidenceSummary,

        evidenceReport:
            generateEvidenceReport(
                skillDetails
            ),

        // -------------------------------------------------
        // REQUIREMENTS
        // -------------------------------------------------

        requirementBreakdown,

        // -------------------------------------------------
        // RESUME QUALITY
        // -------------------------------------------------

        resumeQuality: {
            score:
                quality.score,

            contact:
                quality.contact,

            sections:
                quality.sections,

            actionVerbs:
                quality.actionVerbs,

            metrics:
                quality.metrics,

            readability:
                quality.readability,

            contentLength:
                quality.contentLength,

            atsSafety:
                quality.atsSafety,

            experience:
                quality.experience,

            projects:
                quality.projects
        },

        // -------------------------------------------------
        // INSIGHTS
        // -------------------------------------------------

        strengths,

        weakAreas,

        recommendations,

        // -------------------------------------------------
        // SCORE BREAKDOWN
        // -------------------------------------------------

        scoreBreakdown,

        // -------------------------------------------------
        // METHODOLOGY
        // -------------------------------------------------

        scoreMethodology: {
            overallWeights: {
                resumeQuality:
                    0.40,

                roleAlignment:
                    0.35,

                technicalSkills:
                    0.25
            },

            evidenceValues: {
                demonstrated:
                    1.00,

                supported:
                    0.70,

                mentioned:
                    0.20,

                missing:
                    0
            },

            requirementWeights: {
                core:
                    1.00,

                important:
                    0.80,

                tool:
                    0.60,

                concept:
                    0.70,

                optional:
                    0.40
            },

            atsCompatibility:
                "Text-level parsing and structure heuristic. It is not an employer ATS score and cannot inspect every visual/template rule from extracted text alone."
        },

        // -------------------------------------------------
        // LIMITATIONS
        // -------------------------------------------------

        limitations: [
            "Scores are estimates based on extracted resume text and the selected role profile.",

            "A detected skill does not prove real-world proficiency.",

            "A missing skill means it was not detected in the analyzed text; it does not prove the candidate lacks that skill.",

            "ATS compatibility is a text-level heuristic and can vary between ATS products and employer configurations.",

            "Without a job description, role alignment is measured against the configured role knowledge base rather than a specific vacancy.",

            "The analyzer does not verify the truth of resume claims.",

            "The system does not invent achievements, qualifications, metrics, or experience."
        ]
    };
};

// =========================================================
// EXPORTS
// =========================================================

module.exports = {
    analyzeResume,

    normalizeRole,

    parseResumeSections,

    analyzeSkill,

    calculateResumeQuality,

    calculateAtsCompatibility,

    calculateRoleAlignment,

    calculateTechnicalSkills,

    ROLE_PROFILES,

    ROLE_KNOWLEDGE_BASE
};