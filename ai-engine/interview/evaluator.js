const { evaluatePrompt, InterviewAIError } = require("./provider");

/*
==========================================================
AI CAREER OS
PROFESSIONAL INTERVIEW EVALUATOR
==========================================================

FLOW

Candidate Answer
      ↓
Validation
      ↓
Nonsense Detection
      ↓
Question / Concept Evidence
      ↓
Qwen3 Semantic Evaluation
      ↓
AI Result Validation
      ↓
Consistency Check
      ↓
Backend Score Calculation
      ↓
Professional Feedback

IMPORTANT

- AI does NOT directly control the final score.
- Keywords alone do NOT create a high score.
- Correct answers receive credit.
- Correct but incomplete answers receive partial credit.
- Wrong answers receive low scores.
- Gibberish receives 0.
- AI contradictions are corrected by backend evidence.
==========================================================
*/


/*
==========================================================
OLLAMA CONFIG
==========================================================
*/

/*
==========================================================
SCORING
==========================================================
*/

const SCORE_WEIGHTS = {
    accuracy: 30,
    relevance: 20,
    completeness: 20,
    technicalDepth: 20,
    clarity: 10,
};

const DIMENSIONS = [
    "accuracy",
    "relevance",
    "completeness",
    "technicalDepth",
    "clarity",
];


/*
==========================================================
UTILITY
==========================================================
*/

const clamp = (value, min, max) => {
    return Math.max(
        min,
        Math.min(max, value)
    );
};


const cleanText = (value) => {
    if (typeof value !== "string") {
        return "";
    }

    return value
        .replace(/\s+/g, " ")
        .trim();
};


const cleanAnswer = (value) => {
    if (typeof value !== "string") {
        return "";
    }

    return value
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .trim();
};


const safeArray = (
    value,
    limit = 10
) => {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .filter(
            (item) =>
                typeof item === "string"
        )
        .map(
            (item) =>
                item.trim()
        )
        .filter(Boolean)
        .slice(0, limit);
};


/*
==========================================================
TECHNICAL TERMS
==========================================================
*/

const TECHNICAL_TERMS = new Set([
    "javascript",
    "typescript",
    "react",
    "reactjs",
    "component",
    "components",
    "props",
    "state",
    "usestate",
    "useeffect",
    "usememo",
    "usecallback",
    "usecontext",
    "jsx",
    "tsx",

    "html",
    "html5",
    "css",

    "node",
    "nodejs",
    "express",
    "expressjs",

    "mongodb",
    "mongoose",
    "mysql",
    "postgres",
    "postgresql",
    "sql",
    "nosql",

    "api",
    "apis",
    "rest",
    "restful",
    "graphql",

    "http",
    "https",
    "json",

    "jwt",
    "oauth",
    "authentication",
    "authorization",

    "database",
    "databases",

    "server",
    "client",
    "frontend",
    "backend",
    "fullstack",

    "function",
    "functions",
    "closure",
    "closures",
    "scope",
    "lexical",

    "variable",
    "variables",

    "array",
    "arrays",
    "object",
    "objects",

    "class",
    "classes",

    "async",
    "await",
    "promise",
    "promises",

    "callback",
    "callbacks",

    "dom",
    "event",
    "events",

    "fetch",
    "axios",

    "docker",
    "kubernetes",

    "aws",
    "azure",
    "gcp",

    "redis",
    "cache",
    "caching",

    "scaling",
    "scalable",
    "scalability",

    "architecture",
    "latency",
    "throughput",

    "query",
    "queries",

    "security",
    "middleware",

    "routing",
    "router",
    "controller",
    "service",
    "model",
    "schema",

    "python",
    "java",
    "spring",
    "django",
    "flask",
    "fastapi",

    "angular",
    "vue",
    "next",
    "nextjs",

    "redux",
    "tailwind",

    "git",
    "github",

    "algorithm",
    "algorithms",

    "recursion",
    "complexity",

    "stack",
    "queue",
    "heap",
    "tree",
    "graph",

    "testing",
    "jest",
    "cypress",

    "microservices",
    "loadbalancer",
    "cdn",

    "kafka",
    "rabbitmq",

    "linux",
    "terraform",
    "ansible",

    "devops",
    "cloud",

    "encryption",
    "hashing",
    "token",
    "session",
]);


/*
==========================================================
CODE DETECTION
==========================================================
*/

const CODE_PATTERNS = [
    /\b(const|let|var)\s+[A-Za-z_$][\w$]*/,
    /\bfunction\s+[A-Za-z_$][\w$]*\s*\(/,
    /\breturn\s*/,
    /\b(import|export)\s+/,
    /=>/,
    /\bconsole\.(log|error|warn)\s*\(/,
    /\b(useState|useEffect|useMemo|useCallback|useContext)\s*\(/,
    /\bset[A-Z][A-Za-z0-9_$]*\s*\(/,
    /\bon[A-Z][A-Za-z0-9_$]*\s*=/,
    /<\/?[A-Za-z][^>]*>/,
    /\bnew\s+[A-Za-z_$][\w$]*\s*\(/,
    /\basync\s+function\b/,
    /\bawait\s+[A-Za-z_$]/,
    /\bJSON\.(parse|stringify)\s*\(/,
    /\bfetch\s*\(/,
    /\baxios\.(get|post|put|patch|delete)\s*\(/,
];


const containsCode = (text) => {
    return CODE_PATTERNS.some(
        (pattern) =>
            pattern.test(text)
    );
};


/*
==========================================================
RANDOM TOKEN DETECTION
==========================================================
*/

const normalizeToken = (token) => {
    return String(token || "")
        .toLowerCase()
        .replace(
            /^[^a-zA-Z0-9_$]+|[^a-zA-Z0-9_$]+$/g,
            ""
        );
};


const looksLikeRandomToken = (token) => {
    const original =
        String(token || "").trim();

    if (!original) {
        return false;
    }

    const word =
        normalizeToken(original);

    if (!word) {
        return false;
    }

    if (
        TECHNICAL_TERMS.has(word)
    ) {
        return false;
    }

    /*
     * Programming identifiers are allowed.
     */
    if (
        /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(
            original
        )
    ) {
        return false;
    }

    /*
     * URLs / paths / email addresses.
     */
    if (
        /[@/:\\]/.test(original)
    ) {
        return false;
    }

    /*
     * Extremely obvious random text.
     */
    if (
        word.length >= 10 &&
        !/[aeiou]/i.test(word)
    ) {
        return true;
    }

    if (
        /[^aeiou]{9,}/i.test(word)
    ) {
        return true;
    }

    return false;
};


/*
==========================================================
NONSENSE DETECTOR
==========================================================
*/

const looksLikeNonsense = (answer) => {
    const text =
        cleanAnswer(answer);

    if (!text) {
        return true;
    }

    const compact =
        text
            .replace(/\s+/g, "")
            .toLowerCase();

    const keyboardPatterns = [
        /^asdf+$/i,
        /^asdfgh+$/i,
        /^qwerty+$/i,
        /^qwert+$/i,
        /^zxcv+$/i,
        /^hjkl+$/i,
    ];

    if (
        keyboardPatterns.some(
            (pattern) =>
                pattern.test(compact)
        )
    ) {
        return true;
    }

    if (
        /(.)\1{10,}/.test(text)
    ) {
        return true;
    }

    const words =
        text
            .split(/\s+/)
            .filter(Boolean);

    if (!words.length) {
        return true;
    }

    const randomTokens =
        words.filter(
            looksLikeRandomToken
        );

    /*
     * Code can naturally contain identifiers.
     */
    if (
        containsCode(text)
    ) {
        return (
            words.length >= 12 &&
            randomTokens.length /
                words.length >=
            0.80
        );
    }

    /*
     * Normal text.
     */
    if (
        words.length >= 6 &&
        randomTokens.length /
            words.length >=
        0.65
    ) {
        return true;
    }

    /*
     * Very short random answer.
     */
    if (
        words.length <= 4 &&
        randomTokens.length ===
            words.length
    ) {
        return true;
    }

    return false;
};


/*
==========================================================
ZERO EVALUATION
==========================================================
*/

const createZeroEvaluation = ({
    explanation,
    criticalConcepts = [],
    weaknesses = [],
}) => {
    return {
        score: 0,

        verdict: "Incorrect",

        dimensions: {
            accuracy: 0,
            relevance: 0,
            completeness: 0,
            technicalDepth: 0,
            clarity: 0,
        },

        explanation,

        strengths: [],

        weaknesses:
            weaknesses.length
                ? weaknesses
                : [
                      "The answer does not demonstrate understanding of the question.",
                  ],

        missingConcepts:
            safeArray(
                criticalConcepts
            ),

        incorrectClaims: [],

        improvementAdvice:
            "Answer the question directly using correct technical concepts.",

        idealAnswer: "",
    };
};


/*
==========================================================
CONCEPT MATCHING
==========================================================
*/

const conceptMatches = (
    answer,
    concepts
) => {
    const text =
        cleanText(answer)
            .toLowerCase();

    return safeArray(
        concepts,
        20
    ).filter(
        (concept) => {
            const normalized =
                concept
                    .toLowerCase()
                    .trim();

            if (!normalized) {
                return false;
            }

            /*
             * Exact phrase.
             */
            if (
                text.includes(
                    normalized
                )
            ) {
                return true;
            }

            /*
             * Individual words.
             */
            const parts =
                normalized
                    .split(/\s+/)
                    .map(
                        (part) =>
                            part.replace(
                                /[^a-z0-9_$+#]/gi,
                                ""
                            )
                    )
                    .filter(
                        (part) =>
                            part.length >= 3
                    );

            if (!parts.length) {
                return false;
            }

            const matched =
                parts.filter(
                    (part) =>
                        text.includes(
                            part
                        )
                ).length;

            if (
                parts.length === 1
            ) {
                return matched === 1;
            }

            return (
                matched /
                    parts.length >=
                0.5
            );
        }
    );
};


/*
==========================================================
ANSWER EVIDENCE
==========================================================
*/

const analyzeAnswerEvidence = ({
    answer,
    expectedConcepts,
    criticalConcepts,
}) => {
    const text =
        cleanAnswer(answer)
            .toLowerCase();

    const expectedMatches =
        conceptMatches(
            text,
            expectedConcepts
        );

    const criticalMatches =
        conceptMatches(
            text,
            criticalConcepts
        );

    const technicalMatches =
        [...TECHNICAL_TERMS].filter(
            (term) => {
                const escaped =
                    term.replace(
                        /[.*+?^${}()|[\]\\]/g,
                        "\\$&"
                    );

                return new RegExp(
                    `\\b${escaped}\\b`,
                    "i"
                ).test(text);
            }
        );

    return {
        hasCode:
            containsCode(answer),

        technicalMatches,

        expectedMatches,

        criticalMatches,

        expectedCoverage:
            expectedConcepts.length
                ? expectedMatches.length /
                  expectedConcepts.length
                : 0,

        criticalCoverage:
            criticalConcepts.length
                ? criticalMatches.length /
                  criticalConcepts.length
                : 0,

        meaningfulTechnicalContent:
            technicalMatches.length > 0 ||
            expectedMatches.length > 0 ||
            criticalMatches.length > 0 ||
            containsCode(answer),
    };
};


/*
==========================================================
BACKEND SCORE
==========================================================
*/

const calculateScore = (
    dimensions
) => {
    const weighted =
        dimensions.accuracy *
            SCORE_WEIGHTS.accuracy +

        dimensions.relevance *
            SCORE_WEIGHTS.relevance +

        dimensions.completeness *
            SCORE_WEIGHTS.completeness +

        dimensions.technicalDepth *
            SCORE_WEIGHTS.technicalDepth +

        dimensions.clarity *
            SCORE_WEIGHTS.clarity;

    return clamp(
        Math.round(
            weighted / 5
        ),
        0,
        100
    );
};


/*
==========================================================
VERDICT
==========================================================
*/

const getVerdict = (
    score
) => {
    if (score >= 85) {
        return "Excellent";
    }

    if (score >= 70) {
        return "Good";
    }

    if (score >= 50) {
        return "Partial";
    }

    if (score >= 25) {
        return "Weak";
    }

    return "Incorrect";
};


/*
==========================================================
JSON PARSER
==========================================================
*/


const parseOllamaJson = (raw) => {
    if (
        typeof raw !== "string" ||
        !raw.trim()
    ) {
        throw new Error(
            "OLLAMA_EMPTY_RESPONSE"
        );
    }

    let text = raw.trim();

    /*
     * Remove markdown fences if present.
     */
    text = text
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

    /*
     * Direct JSON parse.
     */
    try {
        return JSON.parse(text);
    } catch (_) {
        // Continue.
    }

    /*
     * Sometimes Ollama may return text
     * before or after the JSON object.
     */
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");

    if (
        start !== -1 &&
        end > start
    ) {
        const jsonText =
            text.slice(
                start,
                end + 1
            );

        try {
            return JSON.parse(
                jsonText
            );
        } catch (_) {
            // Continue.
        }
    }

    /*
     * Do not invent missing evaluation data.
     */
    throw new Error(
        "OLLAMA_INVALID_JSON"
    );
};


/*
==========================================================
VALIDATE AI RESULT
==========================================================
*/

const validateAIResult = (
    result
) => {
    if (
        !result ||
        typeof result !== "object" ||
        Array.isArray(result)
    ) {
        return false;
    }

    return DIMENSIONS.every(
        (dimension) => {
            const value =
                Number(
                    result[
                        dimension
                    ]
                );

            return (
                Number.isFinite(
                    value
                ) &&
                value >= 1 &&
                value <= 5
            );
        }
    );
};


/*
==========================================================
NORMALIZE AI RESULT
==========================================================
*/

const normalizeAIResult = (
    raw
) => {
    if (
        !validateAIResult(
            raw
        )
    ) {
        throw new Error(
            "OLLAMA_INVALID_SCORES"
        );
    }

    const dimensions = {};

    for (
        const dimension
        of DIMENSIONS
    ) {
        dimensions[
            dimension
        ] =
            clamp(
                Math.round(
                    Number(
                        raw[
                            dimension
                        ]
                    )
                ),
                1,
                5
            );
    }

    return {
        dimensions,

        explanation:
            cleanText(
                raw.explanation
            ).slice(
                0,
                300
            ),

        strengths:
            safeArray(
                raw.strengths,
                5
            ),

        weaknesses:
            safeArray(
                raw.weaknesses,
                5
            ),

        missingConcepts:
            safeArray(
                raw.missingConcepts,
                8
            ),

        incorrectClaims:
            safeArray(
                raw.incorrectClaims,
                5
            ),

        improvementAdvice:
            cleanText(
                raw.improvementAdvice
            ).slice(
                0,
                300
            ),

        idealAnswer:
            cleanText(
                raw.idealAnswer
            ).slice(
                0,
                500
            ),

        assessment:
            cleanText(
                raw.assessment
            ).toLowerCase(),
    };
};


/*
==========================================================
AI CONSISTENCY CHECK
==========================================================

This is the important fix.

If AI says:

"answer correctly describes the basic flow"

but gives:

1,1,1,1,1

we don't blindly accept it.

The backend checks:

- meaningful technical content
- expected concept coverage
- critical concept coverage
- AI assessment
- AI explanation

We only adjust obvious contradictions.

We do NOT give everybody a minimum score.
==========================================================
*/

const reconcileEvaluation = ({
    evaluation,
    evidence,
    expectedConcepts,
    criticalConcepts,
}) => {
    const dimensions = {
        ...evaluation.dimensions,
    };

    const expected =
        safeArray(
            expectedConcepts,
            20
        );

    const critical =
        safeArray(
            criticalConcepts,
            20
        );

    const explanation =
        cleanText(
            evaluation.explanation
        ).toLowerCase();

    const assessment =
        cleanText(
            evaluation.assessment
        ).toLowerCase();

    /*
    ======================================================
    CASE 1
    Completely no technical/question evidence.

    Here a high AI score is suspicious.
    ======================================================
    */

    if (
        !evidence.meaningfulTechnicalContent
    ) {
        dimensions.accuracy =
            Math.min(
                dimensions.accuracy,
                1
            );

        dimensions.relevance =
            Math.min(
                dimensions.relevance,
                1
            );

        dimensions.technicalDepth =
            Math.min(
                dimensions.technicalDepth,
                1
            );
    }


    /*
    ======================================================
    CASE 2
    Expected concepts exist.

    Coverage controls COMPLETENESS only.

    It does NOT artificially make accuracy high.
    ======================================================
    */

    if (
        expected.length > 0
    ) {
        const coverage =
            evidence.expectedMatches.length /
            expected.length;

        if (
            coverage === 0
        ) {
            dimensions.completeness =
                Math.min(
                    dimensions.completeness,
                    1
                );
        }

        else if (
            coverage < 0.34
        ) {
            dimensions.completeness =
                Math.min(
                    dimensions.completeness,
                    2
                );
        }

        else if (
            coverage < 0.67
        ) {
            dimensions.completeness =
                Math.min(
                    dimensions.completeness,
                    3
                );
        }
    }


    /*
    ======================================================
    CASE 3
    Critical concept missing.
    ======================================================
    */

    if (
        critical.length > 0 &&
        evidence.criticalMatches.length === 0
    ) {
        dimensions.completeness =
            Math.min(
                dimensions.completeness,
                2
            );
    }


    /*
    ======================================================
    CASE 4
    AI contradiction.

    Example:

    Explanation:
    "The answer correctly describes the basic flow."

    But dimensions:
    1,1,1,1,1

    AND meaningful technical evidence exists.

    This is an obvious contradiction.

    We don't make it perfect.
    We give the AI a reasonable partial
    evaluation based on the evidence.
    ======================================================
    */

    const saysCorrect =
        /correct|accurate|valid|good|strong|properly|correctly/.test(
            explanation
        );

    const saysPartial =
        /partial|basic|mostly|main idea|core idea|some|missing|lacks/.test(
            explanation
        );

    const allOnes =
        DIMENSIONS.every(
            (dimension) =>
                dimensions[dimension] === 1
        );

    const hasStrongEvidence =
        evidence.meaningfulTechnicalContent &&
        (
            evidence.expectedMatches.length >= 2 ||
            evidence.criticalMatches.length >= 1 ||
            evidence.technicalMatches.length >= 3 ||
            evidence.hasCode
        );

    /*
     * Obvious contradiction:
     *
     * AI says correct/partial
     * but gives all 1.
     */
    if (
        allOnes &&
        hasStrongEvidence &&
        (
            saysCorrect ||
            saysPartial ||
            assessment === "correct" ||
            assessment === "partial"
        )
    ) {
        /*
         * This is NOT a blanket minimum score.
         *
         * We reconstruct a conservative partial
         * evaluation from actual evidence.
         */

        dimensions.accuracy =
            Math.max(
                dimensions.accuracy,
                3
            );

        dimensions.relevance =
            Math.max(
                dimensions.relevance,
                4
            );

        dimensions.technicalDepth =
            Math.max(
                dimensions.technicalDepth,
                3
            );

        dimensions.clarity =
            Math.max(
                dimensions.clarity,
                3
            );

        /*
         * Completeness is based on concept coverage.
         */
        if (
            expected.length === 0
        ) {
            dimensions.completeness =
                Math.max(
                    dimensions.completeness,
                    3
                );
        }
        else {
            const coverage =
                evidence.expectedMatches.length /
                expected.length;

            if (
                coverage >= 0.67
            ) {
                dimensions.completeness =
                    Math.max(
                        dimensions.completeness,
                        4
                    );
            }
            else if (
                coverage >= 0.34
            ) {
                dimensions.completeness =
                    Math.max(
                        dimensions.completeness,
                        3
                    );
            }
            else {
                dimensions.completeness =
                    Math.max(
                        dimensions.completeness,
                        2
                    );
            }
        }
    }


    /*
    ======================================================
    CASE 5
    AI says answer is incorrect.

    We do NOT override this simply because keywords
    exist.

    Keywords/evidence alone cannot prove correctness.
    ======================================================
    */


    /*
    ======================================================
    CASE 6
    Correct assessment + strong evidence.

    If AI accidentally gives one dimension too low,
    we make only conservative corrections.
    ======================================================
    */

    if (
        hasStrongEvidence &&
        (
            assessment === "correct" ||
            saysCorrect
        )
    ) {
        /*
         * Relevance should not normally be 1
         * if the answer clearly addresses the topic.
         */
        if (
            dimensions.relevance === 1
        ) {
            dimensions.relevance = 3;
        }

        /*
         * Technical depth should not be 1
         * when technical content is actually present.
         */
        if (
            dimensions.technicalDepth === 1
        ) {
            dimensions.technicalDepth = 2;
        }
    }


    return {
        ...evaluation,

        dimensions,

        score:
            calculateScore(
                dimensions
            ),
    };
};


/*
==========================================================
PROMPT
==========================================================
*/

const buildPrompt = ({
    role,
    category,
    difficulty,
    topic,
    question,
    expectedConcepts,
    criticalConcepts,
    commonMistakes,
    answer,
}) => {
    return `
You are a senior technical interviewer.

Evaluate the candidate answer against the question.

ROLE:
${role || "Not specified"}

CATEGORY:
${category || "Technical"}

DIFFICULTY:
${difficulty || "Intermediate"}

TOPIC:
${topic || "General"}

QUESTION:
${question}

EXPECTED CONCEPTS:
${
    expectedConcepts.length
        ? expectedConcepts.join(", ")
        : "Not provided"
}

CRITICAL CONCEPTS:
${
    criticalConcepts.length
        ? criticalConcepts.join(", ")
        : "Not provided"
}

COMMON MISTAKES:
${
    commonMistakes.length
        ? commonMistakes.join(", ")
        : "Not provided"
}

CANDIDATE ANSWER:
${answer}

IMPORTANT EVALUATION RULES:

1. Judge the meaning of the answer.

2. Do NOT score based on answer length.

3. A short correct answer must receive credit.

4. A correct but incomplete answer is NOT incorrect.

5. If the candidate explains the core concept correctly but misses advanced details, use:
   accuracy = 3 or 4
   relevance = 4 or 5
   completeness = 2, 3 or 4
   technicalDepth = 2, 3 or 4

6. Only use accuracy = 1 when the technical explanation is fundamentally wrong.

7. Only use relevance = 1 when the answer is unrelated to the question.

8. Do not use all 1s for an answer that correctly explains the core concept.

9. Missing details reduce completeness, not automatically accuracy.

10. Keyword presence does NOT prove correctness.

11. Accept technically valid alternative terminology.

12. If the answer contains a correct practical example, give appropriate credit.

13. If the answer contains a factual technical error, reduce accuracy.

14. Distinguish:
   - incorrect
   - partially correct
   - correct but incomplete
   - strongly correct

SCORING:

5 = excellent
4 = strong
3 = partially correct
2 = weak
1 = incorrect

Return ONLY JSON.

Use this exact structure:

{
  "assessment": "correct",
  "accuracy": 1,
  "relevance": 1,
  "completeness": 1,
  "technicalDepth": 1,
  "clarity": 1,
  "explanation": "short reason",
  "missingConcepts": []
}

assessment must be exactly one of:

"incorrect"
"partial"
"correct"

No markdown.
No code fences.
No text outside JSON.
Keep explanation under 20 words.
`;
};


/*
==========================================================
CALL OLLAMA
==========================================================
*/

const callAI = async prompt => parseOllamaJson(await evaluatePrompt(prompt));

/*
==========================================================
MAIN EVALUATOR
==========================================================
*/

const evaluateInterviewAnswer = async ({
    role,
    category,
    difficulty,
    topic,
    question,
    expectedConcepts = [],
    criticalConcepts = [],
    commonMistakes = [],
    answer,
}) => {

    /*
    ======================================================
    QUESTION VALIDATION
    ======================================================
    */

    if (
        !question ||
        !question.trim()
    ) {
        throw new Error(
            "Interview question is required"
        );
    }


    /*
    ======================================================
    ANSWER CLEANING
    ======================================================
    */

    const cleanAnswerValue =
        cleanAnswer(answer);


    /*
    ======================================================
    EMPTY ANSWER
    ======================================================
    */

    if (
        !cleanAnswerValue
    ) {
        return createZeroEvaluation({
            explanation:
                "No answer was provided.",

            criticalConcepts,

            weaknesses: [
                "No answer was submitted.",
            ],
        });
    }


    /*
    ======================================================
    NO ANSWER MARKERS
    ======================================================
    */

    const noAnswerMarkers = new Set([
        "no answer",
        "no answer submitted",
        "answer not submitted",
        "time expired",
        "time has expired",
    ]);

    if (
        noAnswerMarkers.has(
            cleanAnswerValue.toLowerCase()
        )
    ) {
        return createZeroEvaluation({
            explanation:
                "No answer was submitted.",

            criticalConcepts,
        });
    }


    /*
    ======================================================
    LOCAL NONSENSE DETECTION
    ======================================================
    */

    if (
        looksLikeNonsense(
            cleanAnswerValue
        )
    ) {

        return createZeroEvaluation({
            explanation:
                "The submitted answer appears to be random or unintelligible text.",

            criticalConcepts,

            weaknesses: [
                "The response does not contain meaningful technical information.",
            ],
        });
    }


    /*
    ======================================================
    CLEAN QUESTION DATA
    ======================================================
    */

    const safeExpected =
        safeArray(
            expectedConcepts,
            20
        );

    const safeCritical =
        safeArray(
            criticalConcepts,
            20
        );

    const safeMistakes =
        safeArray(
            commonMistakes,
            20
        );


    /*
    ======================================================
    EVIDENCE
    ======================================================
    */

    const evidence =
        analyzeAnswerEvidence({
            answer:
                cleanAnswerValue,

            expectedConcepts:
                safeExpected,

            criticalConcepts:
                safeCritical,
        });


    /*
    ======================================================
    BUILD PROMPT
    ======================================================
    */

    const prompt =
        buildPrompt({
            role,
            category,
            difficulty,
            topic,

            question:
                cleanText(
                    question
                ),

            expectedConcepts:
                safeExpected,

            criticalConcepts:
                safeCritical,

            commonMistakes:
                safeMistakes,

            answer:
                cleanAnswerValue,
        });


    /*
    ======================================================
    CALL LOCAL AI
    ======================================================
    */

    try {

        const rawEvaluation =
            await callAI(
                prompt
            );


        /*
        ==================================================
        NORMALIZE
        ==================================================
        */

        let evaluation =
            normalizeAIResult(
                rawEvaluation
            );


        /*
        ==================================================
        RECONCILE
        ==================================================
        */

        evaluation =
            reconcileEvaluation({
                evaluation,

                evidence,

                expectedConcepts:
                    safeExpected,

                criticalConcepts:
                    safeCritical,
            });


        /*
        ==================================================
        BACKEND FINAL SCORE
        ==================================================
        */

        evaluation.score =
            calculateScore(
                evaluation.dimensions
            );

        evaluation.verdict =
            getVerdict(
                evaluation.score
            );


        /*
        ==================================================
        MISSING CONCEPTS
        ==================================================
        */

        if (
            !evaluation.missingConcepts.length
        ) {
            const missingCritical =
                safeCritical.filter(
                    (concept) =>
                        !evidence.criticalMatches.includes(
                            concept
                        )
                );

            evaluation.missingConcepts =
                missingCritical.slice(
                    0,
                    5
                );
        }


        /*
        ==================================================
        LOCAL PROFESSIONAL FEEDBACK
        ==================================================
        */

        if (
            !evaluation.strengths.length
        ) {
            const strengths = [];

            if (
                evaluation.dimensions.accuracy >= 4
            ) {
                strengths.push(
                    "Technically accurate explanation."
                );
            }

            if (
                evaluation.dimensions.relevance >= 4
            ) {
                strengths.push(
                    "Directly addresses the question."
                );
            }

            if (
                evaluation.dimensions.clarity >= 4
            ) {
                strengths.push(
                    "Clear and understandable explanation."
                );
            }

            if (
                evidence.hasCode
            ) {
                strengths.push(
                    "Includes a practical code example."
                );
            }

            evaluation.strengths =
                strengths.slice(
                    0,
                    3
                );
        }


        if (
            !evaluation.weaknesses.length
        ) {
            const weaknesses = [];

            if (
                evaluation.dimensions.accuracy < 4
            ) {
                weaknesses.push(
                    "Technical accuracy can be improved."
                );
            }

            if (
                evaluation.dimensions.completeness < 4
            ) {
                weaknesses.push(
                    "Some important concepts are missing."
                );
            }

            if (
                evaluation.dimensions.technicalDepth < 4
            ) {
                weaknesses.push(
                    "The answer could include more technical depth."
                );
            }

            if (
                evaluation.dimensions.clarity < 4
            ) {
                weaknesses.push(
                    "The explanation could be clearer."
                );
            }

            evaluation.weaknesses =
                weaknesses.slice(
                    0,
                    4
                );
        }


        /*
        ==================================================
        IMPROVEMENT ADVICE
        ==================================================
        */

        if (
            !evaluation.improvementAdvice
        ) {
            if (
                evaluation.score >= 85
            ) {
                evaluation.improvementAdvice =
                    "Strong answer. Add practical examples where useful.";
            }

            else if (
                evaluation.score >= 70
            ) {
                evaluation.improvementAdvice =
                    "Good answer. Add deeper technical details to strengthen it.";
            }

            else if (
                evaluation.score >= 50
            ) {
                evaluation.improvementAdvice =
                    "The core idea is present. Add the missing concepts and explain them more precisely.";
            }

            else {
                evaluation.improvementAdvice =
                    "Review the core concept and answer the question directly.";
            }
        }


        /*
        ==================================================
        IDEAL ANSWER
        ==================================================

        We intentionally don't ask Ollama for a large
        ideal answer anymore because that slows CPU
        inference.

        The frontend can still safely show:
        "Review the missing concepts..."
        ==================================================
        */

        if (
            !evaluation.idealAnswer
        ) {
            evaluation.idealAnswer = "";
        }


        /*
        ==================================================
        FINAL LOG
        ==================================================
        */


        return evaluation;

    } catch (error) {
        if (error instanceof InterviewAIError) throw error;
        if (['OLLAMA_INVALID_JSON', 'OLLAMA_EMPTY_RESPONSE', 'OLLAMA_INVALID_SCORES'].includes(error.message)) {
            throw new InterviewAIError('INTERVIEW_AI_RESPONSE');
        }
        throw new InterviewAIError('INTERVIEW_AI_FAILED');
    }
};


/*
==========================================================
EXPORT
==========================================================
*/

module.exports = {
    evaluateInterviewAnswer,
};