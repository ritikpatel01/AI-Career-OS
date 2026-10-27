import React, {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import { getAuthToken } from "../../services/api";
import "./Interview.css";

/* =========================================================
   API
   ========================================================= */

const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";

/* =========================================================
   CAREER ROLES
   ========================================================= */

const ROLE_GROUPS = [
    {
        name: "Software & Technology",
        icon: "💻",
        roles: [
            "Full Stack Developer",
            "Frontend Developer",
            "Backend Developer",
            "Software Engineer",
            "Java Developer",
            "Python Developer",
            "Cloud Engineer",
            "DevOps Engineer",
            "Data Scientist",
            "Data Analyst",
            "Machine Learning Engineer",
            "AI Engineer",
            "Cybersecurity Engineer",
        ],
    },
    {
        name: "Mechanical Engineering",
        icon: "⚙️",
        roles: [
            "Mechanical Engineer",
            "Mechanical Design Engineer",
            "Manufacturing Engineer",
            "Production Engineer",
        ],
    },
    {
        name: "Civil Engineering",
        icon: "🏗️",
        roles: [
            "Civil Engineer",
            "Structural Engineer",
            "Site Engineer",
            "Construction Engineer",
        ],
    },
    {
        name: "Electrical Engineering",
        icon: "⚡",
        roles: [
            "Electrical Engineer",
            "Electrical Design Engineer",
            "Power Systems Engineer",
            "Control Systems Engineer",
        ],
    },
    {
        name: "Electronics & Embedded",
        icon: "🔌",
        roles: [
            "Electronics Engineer",
            "Embedded Engineer",
            "Electronics Design Engineer",
            "VLSI Engineer",
        ],
    },
    {
        name: "Automotive Engineering",
        icon: "🚗",
        roles: [
            "Automotive Engineer",
            "Automotive Design Engineer",
            "Automotive Manufacturing Engineer",
        ],
    },
    {
        name: "Aerospace Engineering",
        icon: "✈️",
        roles: [
            "Aerospace Engineer",
            "Aerospace Design Engineer",
            "Avionics Engineer",
        ],
    },
    {
        name: "Chemical Engineering",
        icon: "🧪",
        roles: [
            "Chemical Engineer",
            "Process Engineer",
            "Chemical Process Design Engineer",
        ],
    },
    {
        name: "Biomedical Engineering",
        icon: "🧬",
        roles: [
            "Biomedical Engineer",
            "Medical Device Engineer",
            "Clinical Engineer",
        ],
    },
];

/* =========================================================
   QUESTION HELPER

   Every question now contains:
   - expectedConcepts
   - criticalConcepts
   - commonMistakes

   These are sent to the backend AI evaluator.
   ========================================================= */

const createQuestion = ({
    category,
    difficulty,
    topic,
    question,
    hint,
    expectedConcepts = [],
    criticalConcepts = [],
    commonMistakes = [],
}) => ({
    category,
    difficulty,
    topic,
    question,
    hint,

    expectedConcepts:
        expectedConcepts.length > 0
            ? expectedConcepts
            : [topic],

    criticalConcepts:
        criticalConcepts.length > 0
            ? criticalConcepts
            : [topic],

    commonMistakes,
});

/* =========================================================
   QUESTION BANK
   ========================================================= */

const QUESTION_BANKS = {
    /* =====================================================
       SOFTWARE
       ===================================================== */

    "Full Stack Developer": [
        createQuestion({
            category: "Technical",
            difficulty: "Intermediate",
            topic: "Web Development",
            question:
                "What are the most important concepts you would expect a Full Stack Developer to understand?",
            hint:
                "Think about frontend, backend, databases, APIs, authentication and deployment.",
            expectedConcepts: [
                "frontend development",
                "backend development",
                "databases",
                "REST APIs",
                "authentication",
                "deployment",
            ],
            criticalConcepts: [
                "frontend",
                "backend",
                "database",
                "API",
            ],
            commonMistakes: [
                "Only discussing frontend development",
                "Only discussing backend development",
                "Ignoring databases or APIs",
            ],
        }),

        createQuestion({
            category: "Technical",
            difficulty: "Intermediate",
            topic: "REST APIs",
            question:
                "Explain how a REST API works and how a frontend application communicates with a backend.",
            hint:
                "Explain the request-response cycle and HTTP methods.",
            expectedConcepts: [
                "HTTP request",
                "HTTP response",
                "GET",
                "POST",
                "PUT",
                "PATCH",
                "DELETE",
                "status codes",
                "JSON",
            ],
            criticalConcepts: [
                "request-response cycle",
                "HTTP methods",
                "HTTP status codes",
            ],
            commonMistakes: [
                "Calling REST an independent programming language",
                "Confusing frontend and backend responsibilities",
            ],
        }),

        createQuestion({
            category: "Technical",
            difficulty: "Intermediate",
            topic: "Databases",
            question:
                "What is the difference between SQL and NoSQL databases, and when would you choose each?",
            hint:
                "Think about data structure, relationships, scalability and use cases.",
            expectedConcepts: [
                "relational database",
                "tables",
                "schemas",
                "SQL",
                "documents",
                "NoSQL",
                "relationships",
                "scalability",
            ],
            criticalConcepts: [
                "relational vs non-relational",
                "schema",
                "use case",
            ],
            commonMistakes: [
                "Saying NoSQL means no structure",
                "Saying NoSQL is always faster",
            ],
        }),

        createQuestion({
            category: "Technical",
            difficulty: "Advanced",
            topic: "Authentication",
            question:
                "How would you design authentication and authorization for a production web application?",
            hint:
                "Consider passwords, tokens, sessions, cookies, roles and security.",
            expectedConcepts: [
                "password hashing",
                "authentication",
                "authorization",
                "JWT",
                "sessions",
                "cookies",
                "access control",
                "token expiration",
            ],
            criticalConcepts: [
                "authentication",
                "authorization",
                "secure credential handling",
            ],
            commonMistakes: [
                "Storing plain-text passwords",
                "Confusing authentication with authorization",
                "Putting secrets in frontend code",
            ],
        }),

        createQuestion({
            category: "System Design",
            difficulty: "Advanced",
            topic: "Scalability",
            question:
                "How would you design a scalable web application that serves millions of users?",
            hint:
                "Think about load balancing, caching, databases, queues and horizontal scaling.",
            expectedConcepts: [
                "load balancing",
                "horizontal scaling",
                "caching",
                "database scaling",
                "CDN",
                "message queues",
                "monitoring",
            ],
            criticalConcepts: [
                "horizontal scaling",
                "load balancing",
                "caching",
            ],
            commonMistakes: [
                "Only increasing server size",
                "Ignoring database bottlenecks",
            ],
        }),

        createQuestion({
            category: "Practical",
            difficulty: "Intermediate",
            topic: "Debugging",
            question:
                "A production API suddenly becomes slow. How would you investigate the problem?",
            hint:
                "Think about logs, metrics, database queries, network latency and recent deployments.",
            expectedConcepts: [
                "logs",
                "metrics",
                "database queries",
                "latency",
                "recent deployments",
                "profiling",
            ],
            criticalConcepts: [
                "identify bottleneck",
                "logs and metrics",
                "database/network investigation",
            ],
            commonMistakes: [
                "Immediately rewriting the application",
                "Changing multiple things without measuring",
            ],
        }),

        createQuestion({
            category: "Technical",
            difficulty: "Intermediate",
            topic: "JavaScript",
            question:
                "Explain asynchronous JavaScript, Promises and async/await.",
            hint:
                "Explain how JavaScript handles work that finishes later.",
            expectedConcepts: [
                "asynchronous execution",
                "Promise",
                "pending",
                "fulfilled",
                "rejected",
                "resolve",
                "reject",
                "async",
                "await",
            ],
            criticalConcepts: [
                "Promise",
                "resolve/reject",
                "async/await",
            ],
            commonMistakes: [
                "Saying JavaScript pauses completely",
                "Confusing asynchronous code with multithreading",
            ],
        }),

        createQuestion({
            category: "Technical",
            difficulty: "Intermediate",
            topic: "React",
            question:
                "How does React state work and when would you use useEffect?",
            hint:
                "Think about component state and side effects.",
            expectedConcepts: [
                "state",
                "component rendering",
                "state updates",
                "side effects",
                "useEffect",
                "dependency array",
            ],
            criticalConcepts: [
                "state",
                "side effects",
                "useEffect",
            ],
            commonMistakes: [
                "Using useEffect for every calculation",
                "Ignoring dependencies",
            ],
        }),
    ],

    "Frontend Developer": [
        createQuestion({
            category: "Technical",
            difficulty: "Beginner",
            topic: "HTML",
            question:
                "What is semantic HTML and why is it important?",
            hint:
                "Think about accessibility, SEO and document structure.",
            expectedConcepts: [
                "semantic elements",
                "accessibility",
                "SEO",
                "document structure",
            ],
            criticalConcepts: [
                "semantic elements",
                "accessibility",
            ],
            commonMistakes: [
                "Using div for everything",
                "Saying semantic HTML is only about styling",
            ],
        }),

        createQuestion({
            category: "Technical",
            difficulty: "Intermediate",
            topic: "CSS",
            question:
                "Explain the difference between Flexbox and CSS Grid.",
            hint:
                "Think about one-dimensional versus two-dimensional layouts.",
            expectedConcepts: [
                "Flexbox",
                "one-dimensional layout",
                "CSS Grid",
                "two-dimensional layout",
                "rows",
                "columns",
            ],
            criticalConcepts: [
                "one-dimensional",
                "two-dimensional",
            ],
        }),

        createQuestion({
            category: "Technical",
            difficulty: "Intermediate",
            topic: "JavaScript",
            question:
                "Explain closures in JavaScript with a practical example.",
            hint:
                "Think about a function remembering variables from its outer scope.",
            expectedConcepts: [
                "lexical scope",
                "outer scope",
                "function",
                "retained variables",
            ],
            criticalConcepts: [
                "function retains access to outer scope",
            ],
        }),

        createQuestion({
            category: "Technical",
            difficulty: "Intermediate",
            topic: "React",
            question:
                "What is the purpose of React components, props and state?",
            hint:
                "Explain how data flows through a React application.",
            expectedConcepts: [
                "components",
                "props",
                "state",
                "data flow",
                "reusability",
            ],
            criticalConcepts: [
                "props",
                "state",
                "components",
            ],
        }),

        createQuestion({
            category: "Performance",
            difficulty: "Advanced",
            topic: "Optimization",
            question:
                "How would you improve the performance of a slow React application?",
            hint:
                "Think about rendering, bundle size, lazy loading and network requests.",
            expectedConcepts: [
                "unnecessary renders",
                "memoization",
                "code splitting",
                "lazy loading",
                "bundle size",
                "network requests",
            ],
            criticalConcepts: [
                "measure bottleneck",
                "rendering optimization",
            ],
        }),
    ],

    "Backend Developer": [
        createQuestion({
            category: "Technical",
            difficulty: "Intermediate",
            topic: "Node.js",
            question:
                "What is Node.js and why is it useful for backend development?",
            hint:
                "Think about the JavaScript runtime and event-driven architecture.",
            expectedConcepts: [
                "JavaScript runtime",
                "V8",
                "event loop",
                "non-blocking I/O",
            ],
            criticalConcepts: [
                "runtime",
                "event-driven",
                "non-blocking I/O",
            ],
        }),

        createQuestion({
            category: "Technical",
            difficulty: "Intermediate",
            topic: "Express",
            question:
                "How does middleware work in Express.js?",
            hint:
                "Think about the request-response pipeline.",
            expectedConcepts: [
                "middleware",
                "request",
                "response",
                "next",
                "authentication",
                "logging",
                "error handling",
            ],
            criticalConcepts: [
                "request-response pipeline",
                "next",
            ],
        }),

        createQuestion({
            category: "Technical",
            difficulty: "Intermediate",
            topic: "Databases",
            question:
                "How would you design a database for an e-commerce application?",
            hint:
                "Think about users, products, carts and orders.",
            expectedConcepts: [
                "users",
                "products",
                "cart",
                "orders",
                "relationships",
                "indexes",
            ],
            criticalConcepts: [
                "entities",
                "relationships",
                "indexes",
            ],
        }),

        createQuestion({
            category: "Security",
            difficulty: "Advanced",
            topic: "Authentication",
            question:
                "How would you securely implement JWT authentication?",
            hint:
                "Consider token storage, expiration, refresh tokens and authorization.",
            expectedConcepts: [
                "JWT",
                "access token",
                "refresh token",
                "expiration",
                "authorization",
                "secure storage",
            ],
            criticalConcepts: [
                "token validation",
                "expiration",
                "authorization",
            ],
            commonMistakes: [
                "Putting secrets in frontend code",
                "Never expiring tokens",
            ],
        }),

        createQuestion({
            category: "System Design",
            difficulty: "Advanced",
            topic: "Scalability",
            question:
                "How would you scale a backend API when traffic increases significantly?",
            hint:
                "Think about caching, load balancing and database optimization.",
            expectedConcepts: [
                "load balancing",
                "horizontal scaling",
                "caching",
                "database optimization",
                "queues",
                "monitoring",
            ],
            criticalConcepts: [
                "horizontal scaling",
                "load balancing",
            ],
        }),
    ],

    "Software Engineer": [
        createQuestion({
            category: "Technical",
            difficulty: "Intermediate",
            topic: "Problem Solving",
            question:
                "Walk through your approach to solving a complex software engineering problem.",
            hint:
                "Explain requirements, decomposition, implementation and testing.",
            expectedConcepts: [
                "requirements",
                "problem decomposition",
                "implementation",
                "testing",
                "validation",
            ],
            criticalConcepts: [
                "problem decomposition",
                "validation",
            ],
        }),

        createQuestion({
            category: "Technical",
            difficulty: "Intermediate",
            topic: "Data Structures",
            question:
                "Why are data structures important in software engineering?",
            hint:
                "Discuss performance, organization and algorithm complexity.",
            expectedConcepts: [
                "data organization",
                "time complexity",
                "space complexity",
                "performance",
            ],
            criticalConcepts: [
                "performance",
                "complexity",
            ],
        }),

        createQuestion({
            category: "Engineering",
            difficulty: "Intermediate",
            topic: "Testing",
            question:
                "What types of testing should be used in a production software project?",
            hint:
                "Think about unit, integration, system and end-to-end testing.",
            expectedConcepts: [
                "unit testing",
                "integration testing",
                "system testing",
                "end-to-end testing",
            ],
            criticalConcepts: [
                "unit testing",
                "integration testing",
            ],
        }),

        createQuestion({
            category: "Engineering",
            difficulty: "Advanced",
            topic: "Architecture",
            question:
                "How would you design a maintainable software architecture for a growing product?",
            hint:
                "Think about separation of concerns, modules, interfaces and testing.",
            expectedConcepts: [
                "separation of concerns",
                "modularity",
                "interfaces",
                "testing",
                "maintainability",
            ],
            criticalConcepts: [
                "separation of concerns",
                "modularity",
            ],
        }),
    ],

    "Java Developer": [
        createQuestion({
            category: "Java",
            difficulty: "Intermediate",
            topic: "OOP",
            question:
                "Explain the four pillars of object-oriented programming in Java.",
            hint:
                "Think about encapsulation, inheritance, abstraction and polymorphism.",
            expectedConcepts: [
                "encapsulation",
                "inheritance",
                "abstraction",
                "polymorphism",
            ],
            criticalConcepts: [
                "four OOP principles",
            ],
        }),

        createQuestion({
            category: "Java",
            difficulty: "Intermediate",
            topic: "Collections",
            question:
                "What is the difference between ArrayList, LinkedList, HashSet and HashMap?",
            hint:
                "Compare ordering, duplicates and lookup behavior.",
            expectedConcepts: [
                "ArrayList",
                "LinkedList",
                "HashSet",
                "HashMap",
                "duplicates",
                "key-value",
                "lookup",
            ],
            criticalConcepts: [
                "collection behavior",
                "HashMap key-value",
            ],
        }),

        createQuestion({
            category: "Java",
            difficulty: "Advanced",
            topic: "Concurrency",
            question:
                "How does multithreading work in Java?",
            hint:
                "Discuss threads, synchronization and shared resources.",
            expectedConcepts: [
                "threads",
                "concurrency",
                "synchronization",
                "shared resources",
                "race conditions",
            ],
            criticalConcepts: [
                "threads",
                "synchronization",
            ],
        }),
    ],

    "Python Developer": [
        createQuestion({
            category: "Python",
            difficulty: "Beginner",
            topic: "Language",
            question:
                "What makes Python different from compiled programming languages?",
            hint:
                "Discuss interpretation, typing and developer productivity.",
            expectedConcepts: [
                "Python runtime",
                "interpreted execution",
                "dynamic typing",
                "productivity",
            ],
            criticalConcepts: [
                "dynamic typing",
                "Python runtime",
            ],
        }),

        createQuestion({
            category: "Python",
            difficulty: "Intermediate",
            topic: "Functions",
            question:
                "Explain decorators and generators in Python.",
            hint:
                "Think about function modification and lazy iteration.",
            expectedConcepts: [
                "decorators",
                "higher-order behavior",
                "generators",
                "yield",
                "lazy evaluation",
            ],
            criticalConcepts: [
                "decorators",
                "yield/generators",
            ],
        }),

        createQuestion({
            category: "Backend",
            difficulty: "Intermediate",
            topic: "APIs",
            question:
                "How would you build a production REST API using Python?",
            hint:
                "Think about FastAPI or Django, validation, authentication and databases.",
            expectedConcepts: [
                "REST",
                "routing",
                "validation",
                "authentication",
                "database",
                "error handling",
            ],
            criticalConcepts: [
                "routing",
                "validation",
                "authentication",
            ],
        }),
    ],

    "Cloud Engineer": [
        createQuestion({
            category: "Cloud",
            difficulty: "Intermediate",
            topic: "Infrastructure",
            question:
                "What is the difference between IaaS, PaaS and SaaS?",
            hint:
                "Think about how much infrastructure the customer manages.",
            expectedConcepts: [
                "IaaS",
                "PaaS",
                "SaaS",
                "infrastructure responsibility",
            ],
            criticalConcepts: [
                "responsibility model",
                "IaaS/PaaS/SaaS",
            ],
        }),

        createQuestion({
            category: "Cloud",
            difficulty: "Intermediate",
            topic: "Scalability",
            question:
                "How does auto-scaling work in cloud environments?",
            hint:
                "Think about demand, instances and resource metrics.",
            expectedConcepts: [
                "metrics",
                "scaling policy",
                "instances",
                "load",
                "horizontal scaling",
            ],
            criticalConcepts: [
                "metrics",
                "automatic resource scaling",
            ],
        }),

        createQuestion({
            category: "Cloud",
            difficulty: "Advanced",
            topic: "Architecture",
            question:
                "How would you design a highly available cloud application?",
            hint:
                "Think about regions, availability zones, load balancing and failover.",
            expectedConcepts: [
                "availability zones",
                "load balancing",
                "redundancy",
                "failover",
                "monitoring",
                "disaster recovery",
            ],
            criticalConcepts: [
                "redundancy",
                "failover",
            ],
        }),
    ],

    "DevOps Engineer": [
        createQuestion({
            category: "DevOps",
            difficulty: "Intermediate",
            topic: "CI/CD",
            question:
                "What is CI/CD and why is it important?",
            hint:
                "Explain automated testing, builds and deployments.",
            expectedConcepts: [
                "continuous integration",
                "continuous delivery/deployment",
                "automated testing",
                "build",
                "deployment",
            ],
            criticalConcepts: [
                "automation",
                "CI/CD pipeline",
            ],
        }),

        createQuestion({
            category: "DevOps",
            difficulty: "Intermediate",
            topic: "Docker",
            question:
                "What problem does Docker solve?",
            hint:
                "Think about consistent application environments.",
            expectedConcepts: [
                "containers",
                "isolated environment",
                "images",
                "dependencies",
                "portability",
            ],
            criticalConcepts: [
                "containerization",
                "consistent environment",
            ],
        }),

        createQuestion({
            category: "DevOps",
            difficulty: "Advanced",
            topic: "Kubernetes",
            question:
                "What problem does Kubernetes solve in modern infrastructure?",
            hint:
                "Think about containers, orchestration, scaling and service management.",
            expectedConcepts: [
                "container orchestration",
                "pods",
                "services",
                "scaling",
                "deployment",
                "self-healing",
            ],
            criticalConcepts: [
                "container orchestration",
                "scaling",
            ],
        }),
    ],

    "Data Scientist": [
        createQuestion({
            category: "Data Science",
            difficulty: "Intermediate",
            topic: "Statistics",
            question:
                "Why is statistical analysis important in data science?",
            hint:
                "Think about uncertainty, distributions and drawing conclusions from data.",
            expectedConcepts: [
                "uncertainty",
                "distributions",
                "sampling",
                "hypothesis testing",
                "inference",
            ],
            criticalConcepts: [
                "uncertainty",
                "statistical inference",
            ],
        }),

        createQuestion({
            category: "Machine Learning",
            difficulty: "Intermediate",
            topic: "Modeling",
            question:
                "What is overfitting and how can you reduce it?",
            hint:
                "Think about generalization, regularization and validation.",
            expectedConcepts: [
                "overfitting",
                "generalization",
                "validation",
                "regularization",
                "cross-validation",
            ],
            criticalConcepts: [
                "generalization",
                "overfitting",
            ],
        }),

        createQuestion({
            category: "Data Science",
            difficulty: "Advanced",
            topic: "Evaluation",
            question:
                "How would you select an evaluation metric for a machine learning model?",
            hint:
                "Consider the business problem and type of prediction.",
            expectedConcepts: [
                "problem type",
                "business objective",
                "classification metrics",
                "regression metrics",
                "precision",
                "recall",
                "F1",
            ],
            criticalConcepts: [
                "metric matches objective",
            ],
        }),
    ],

    "Data Analyst": [
        createQuestion({
            category: "Analytics",
            difficulty: "Beginner",
            topic: "Data",
            question:
                "What steps would you follow when analyzing a new dataset?",
            hint:
                "Think about cleaning, exploration, analysis and communication.",
            expectedConcepts: [
                "data cleaning",
                "exploratory analysis",
                "missing values",
                "outliers",
                "visualization",
                "communication",
            ],
            criticalConcepts: [
                "cleaning",
                "exploration",
                "communication",
            ],
        }),

        createQuestion({
            category: "SQL",
            difficulty: "Intermediate",
            topic: "Queries",
            question:
                "Explain JOINs in SQL and when you would use them.",
            hint:
                "Think about combining related tables.",
            expectedConcepts: [
                "JOIN",
                "INNER JOIN",
                "LEFT JOIN",
                "related tables",
                "keys",
            ],
            criticalConcepts: [
                "joining related tables",
                "join condition",
            ],
        }),

        createQuestion({
            category: "Analytics",
            difficulty: "Intermediate",
            topic: "Visualization",
            question:
                "How do you choose an appropriate chart for a business problem?",
            hint:
                "Think about comparison, trend, distribution and relationship.",
            expectedConcepts: [
                "comparison",
                "trend",
                "distribution",
                "relationship",
                "audience",
            ],
            criticalConcepts: [
                "chart matches analytical goal",
            ],
        }),
    ],

    "Machine Learning Engineer": [
        createQuestion({
            category: "Machine Learning",
            difficulty: "Intermediate",
            topic: "Training",
            question:
                "Explain the difference between training, validation and test datasets.",
            hint:
                "Explain the role of each dataset.",
            expectedConcepts: [
                "training set",
                "validation set",
                "test set",
                "model fitting",
                "hyperparameter tuning",
                "final evaluation",
            ],
            criticalConcepts: [
                "separate training and evaluation",
            ],
        }),

        createQuestion({
            category: "Machine Learning",
            difficulty: "Advanced",
            topic: "Deployment",
            question:
                "How would you deploy a machine learning model into production?",
            hint:
                "Think about APIs, containers, monitoring and model versioning.",
            expectedConcepts: [
                "model serving",
                "API",
                "containerization",
                "monitoring",
                "versioning",
                "rollback",
            ],
            criticalConcepts: [
                "model serving",
                "monitoring",
            ],
        }),

        createQuestion({
            category: "MLOps",
            difficulty: "Advanced",
            topic: "Monitoring",
            question:
                "What is model drift and how would you detect it?",
            hint:
                "Think about changes in data and model performance.",
            expectedConcepts: [
                "data drift",
                "concept drift",
                "performance monitoring",
                "distribution changes",
                "alerts",
            ],
            criticalConcepts: [
                "drift",
                "monitoring",
            ],
        }),
    ],

    "AI Engineer": [
        createQuestion({
            category: "AI",
            difficulty: "Intermediate",
            topic: "LLMs",
            question:
                "What is a large language model and how does it generate text?",
            hint:
                "Think about tokens, transformer models and next-token prediction.",
            expectedConcepts: [
                "tokens",
                "transformer",
                "next-token prediction",
                "training",
                "inference",
            ],
            criticalConcepts: [
                "next-token prediction",
                "transformer",
            ],
        }),

        createQuestion({
            category: "AI",
            difficulty: "Advanced",
            topic: "RAG",
            question:
                "What is Retrieval-Augmented Generation and why would you use it?",
            hint:
                "Think about retrieving external knowledge before generation.",
            expectedConcepts: [
                "retrieval",
                "embeddings",
                "vector database",
                "context",
                "generation",
                "grounding",
            ],
            criticalConcepts: [
                "retrieval",
                "context supplied to model",
            ],
        }),

        createQuestion({
            category: "AI",
            difficulty: "Advanced",
            topic: "Agents",
            question:
                "What is an AI agent and how is it different from a normal chatbot?",
            hint:
                "Think about tools, planning, state and multi-step execution.",
            expectedConcepts: [
                "tools",
                "planning",
                "state",
                "multi-step execution",
                "environment interaction",
            ],
            criticalConcepts: [
                "tool use",
                "multi-step execution",
            ],
        }),
    ],

    "Cybersecurity Engineer": [
        createQuestion({
            category: "Security",
            difficulty: "Intermediate",
            topic: "Threats",
            question:
                "What are some common vulnerabilities found in web applications?",
            hint:
                "Think about injection, authentication and access control.",
            expectedConcepts: [
                "injection",
                "broken authentication",
                "access control",
                "XSS",
                "CSRF",
                "security misconfiguration",
            ],
            criticalConcepts: [
                "injection",
                "authentication/access control",
            ],
        }),

        createQuestion({
            category: "Security",
            difficulty: "Intermediate",
            topic: "Authentication",
            question:
                "What is the difference between authentication and authorization?",
            hint:
                "One verifies identity; the other controls access.",
            expectedConcepts: [
                "authentication",
                "identity",
                "authorization",
                "permissions",
                "access control",
            ],
            criticalConcepts: [
                "identity vs permissions",
            ],
        }),

        createQuestion({
            category: "Security",
            difficulty: "Advanced",
            topic: "Incident Response",
            question:
                "How would you respond to a suspected production security incident?",
            hint:
                "Think about detection, containment, investigation and recovery.",
            expectedConcepts: [
                "detection",
                "containment",
                "investigation",
                "eradication",
                "recovery",
                "documentation",
            ],
            criticalConcepts: [
                "containment",
                "investigation",
                "recovery",
            ],
        }),
    ],

    /* =====================================================
       MECHANICAL
       ===================================================== */

    "Mechanical Engineer": [
        createQuestion({
            category: "Mechanical",
            difficulty: "Intermediate",
            topic: "Engineering",
            question:
                "Explain the relationship between stress, strain and Young's modulus.",
            hint:
                "Think about material deformation and elastic behavior.",
            expectedConcepts: [
                "stress",
                "strain",
                "Young's modulus",
                "elastic deformation",
                "Hooke's law",
            ],
            criticalConcepts: [
                "stress-strain relationship",
                "Young's modulus",
            ],
        }),

        createQuestion({
            category: "Mechanical",
            difficulty: "Intermediate",
            topic: "Thermodynamics",
            question:
                "Explain the first law of thermodynamics and a practical application.",
            hint:
                "Think about conservation of energy.",
            expectedConcepts: [
                "conservation of energy",
                "system",
                "heat",
                "work",
                "internal energy",
            ],
            criticalConcepts: [
                "energy conservation",
            ],
        }),

        createQuestion({
            category: "Mechanical",
            difficulty: "Advanced",
            topic: "Design",
            question:
                "What factors would you consider when designing a mechanical component?",
            hint:
                "Think about loads, material, manufacturing, safety and cost.",
            expectedConcepts: [
                "loads",
                "material",
                "stress",
                "fatigue",
                "manufacturing",
                "safety factor",
                "cost",
            ],
            criticalConcepts: [
                "loads",
                "material",
                "safety",
            ],
        }),
    ],

    "Mechanical Design Engineer": [
        createQuestion({
            category: "Design",
            difficulty: "Intermediate",
            topic: "CAD",
            question:
                "What factors do you consider when creating a mechanical CAD design?",
            hint:
                "Think about tolerances, materials, manufacturability and loads.",
            expectedConcepts: [
                "CAD",
                "tolerances",
                "materials",
                "loads",
                "manufacturability",
            ],
            criticalConcepts: [
                "manufacturability",
                "tolerances",
            ],
        }),

        createQuestion({
            category: "Design",
            difficulty: "Intermediate",
            topic: "Tolerances",
            question:
                "Why are dimensional tolerances important in mechanical design?",
            hint:
                "Think about manufacturing variation and assembly.",
            expectedConcepts: [
                "manufacturing variation",
                "fit",
                "assembly",
                "functional requirements",
            ],
            criticalConcepts: [
                "variation",
                "fit/assembly",
            ],
        }),

        createQuestion({
            category: "Engineering",
            difficulty: "Advanced",
            topic: "Design Validation",
            question:
                "How would you validate a mechanical component before production?",
            hint:
                "Think about simulation, testing and safety factors.",
            expectedConcepts: [
                "requirements",
                "simulation",
                "prototype",
                "testing",
                "safety factor",
                "validation",
            ],
            criticalConcepts: [
                "testing",
                "validation",
            ],
        }),
    ],

    "Manufacturing Engineer": [
        createQuestion({
            category: "Manufacturing",
            difficulty: "Intermediate",
            topic: "Processes",
            question:
                "How would you select a manufacturing process for a new component?",
            hint:
                "Think about material, volume, tolerance, cost and geometry.",
            expectedConcepts: [
                "material",
                "production volume",
                "tolerance",
                "cost",
                "geometry",
                "process capability",
            ],
            criticalConcepts: [
                "volume",
                "material",
                "cost",
            ],
        }),

        createQuestion({
            category: "Manufacturing",
            difficulty: "Intermediate",
            topic: "Quality",
            question:
                "What is process capability and why is it important?",
            hint:
                "Think about variation and specification limits.",
            expectedConcepts: [
                "process variation",
                "specification limits",
                "Cp",
                "Cpk",
                "quality",
            ],
            criticalConcepts: [
                "variation vs specification",
            ],
        }),
    ],

    "Production Engineer": [
        createQuestion({
            category: "Production",
            difficulty: "Intermediate",
            topic: "Operations",
            question:
                "How would you improve production efficiency on a manufacturing line?",
            hint:
                "Think about bottlenecks, waste, downtime and process flow.",
            expectedConcepts: [
                "bottleneck",
                "cycle time",
                "downtime",
                "waste",
                "process flow",
                "continuous improvement",
            ],
            criticalConcepts: [
                "bottleneck",
                "waste",
            ],
        }),

        createQuestion({
            category: "Production",
            difficulty: "Intermediate",
            topic: "Quality",
            question:
                "How would you reduce defects in a production process?",
            hint:
                "Think about root-cause analysis and process control.",
            expectedConcepts: [
                "defect analysis",
                "root cause",
                "process control",
                "quality metrics",
                "corrective action",
            ],
            criticalConcepts: [
                "root-cause analysis",
                "process control",
            ],
        }),
    ],

    /* =====================================================
       CIVIL
       ===================================================== */

    "Civil Engineer": [
        createQuestion({
            category: "Civil",
            difficulty: "Intermediate",
            topic: "Structures",
            question:
                "What factors must be considered when designing a building structure?",
            hint:
                "Think about loads, materials, soil, safety and codes.",
            expectedConcepts: [
                "dead load",
                "live load",
                "materials",
                "soil",
                "structural system",
                "building codes",
                "safety",
            ],
            criticalConcepts: [
                "loads",
                "materials",
                "safety/code",
            ],
        }),

        createQuestion({
            category: "Civil",
            difficulty: "Intermediate",
            topic: "Concrete",
            question:
                "What factors affect the strength of concrete?",
            hint:
                "Think about water-cement ratio, curing and materials.",
            expectedConcepts: [
                "water-cement ratio",
                "curing",
                "cement",
                "aggregates",
                "age",
                "mix design",
            ],
            criticalConcepts: [
                "water-cement ratio",
                "curing",
            ],
        }),
    ],

    "Structural Engineer": [
        createQuestion({
            category: "Structural",
            difficulty: "Intermediate",
            topic: "Structures",
            question:
                "What is the difference between dead load and live load?",
            hint:
                "Think about permanent versus variable loads.",
            expectedConcepts: [
                "dead load",
                "live load",
                "permanent load",
                "variable load",
            ],
            criticalConcepts: [
                "permanent vs variable loads",
            ],
        }),

        createQuestion({
            category: "Structural",
            difficulty: "Advanced",
            topic: "Design",
            question:
                "How would you approach the structural design of a multi-storey building?",
            hint:
                "Think about loads, structural system, analysis and code requirements.",
            expectedConcepts: [
                "loads",
                "structural system",
                "load paths",
                "analysis",
                "materials",
                "codes",
                "foundation",
            ],
            criticalConcepts: [
                "load path",
                "structural analysis",
            ],
        }),
    ],

    "Site Engineer": [
        createQuestion({
            category: "Construction",
            difficulty: "Intermediate",
            topic: "Site Management",
            question:
                "What are the major responsibilities of a site engineer?",
            hint:
                "Think about drawings, execution, quality, safety and coordination.",
            expectedConcepts: [
                "drawings",
                "site execution",
                "quality",
                "safety",
                "coordination",
                "measurement",
            ],
            criticalConcepts: [
                "execution",
                "quality",
                "safety",
            ],
        }),

        createQuestion({
            category: "Construction",
            difficulty: "Intermediate",
            topic: "Quality",
            question:
                "How would you handle a construction activity that does not match the approved drawing?",
            hint:
                "Think about stopping, verifying and coordinating with the responsible team.",
            expectedConcepts: [
                "verify drawing",
                "stop affected work",
                "raise issue",
                "coordinate",
                "corrective action",
            ],
            criticalConcepts: [
                "verification",
                "corrective action",
            ],
        }),
    ],

    "Construction Engineer": [
        createQuestion({
            category: "Construction",
            difficulty: "Intermediate",
            topic: "Planning",
            question:
                "How would you plan and monitor a construction project?",
            hint:
                "Think about schedule, resources, cost, quality and safety.",
            expectedConcepts: [
                "schedule",
                "resources",
                "cost",
                "quality",
                "safety",
                "progress monitoring",
            ],
            criticalConcepts: [
                "schedule",
                "resource planning",
                "monitoring",
            ],
        }),

        createQuestion({
            category: "Construction",
            difficulty: "Intermediate",
            topic: "Safety",
            question:
                "Why is construction safety management important?",
            hint:
                "Think about hazards, workers and project continuity.",
            expectedConcepts: [
                "hazard identification",
                "risk assessment",
                "PPE",
                "safe procedures",
                "worker safety",
            ],
            criticalConcepts: [
                "hazard identification",
                "risk control",
            ],
        }),
    ],

    /* =====================================================
       ELECTRICAL
       ===================================================== */

    "Electrical Engineer": [
        createQuestion({
            category: "Electrical",
            difficulty: "Beginner",
            topic: "Fundamentals",
            question:
                "Explain Ohm's law and Kirchhoff's laws.",
            hint:
                "Think about voltage, current, resistance and circuit conservation.",
            expectedConcepts: [
                "Ohm's law",
                "voltage",
                "current",
                "resistance",
                "KCL",
                "KVL",
            ],
            criticalConcepts: [
                "V = IR",
                "KCL/KVL",
            ],
        }),

        createQuestion({
            category: "Electrical",
            difficulty: "Intermediate",
            topic: "Machines",
            question:
                "Explain the basic working principle of an electric motor.",
            hint:
                "Think about magnetic fields and electromagnetic force.",
            expectedConcepts: [
                "magnetic field",
                "current",
                "electromagnetic force",
                "torque",
                "rotor",
                "stator",
            ],
            criticalConcepts: [
                "electromagnetic force",
                "torque",
            ],
        }),
    ],

    "Electrical Design Engineer": [
        createQuestion({
            category: "Electrical Design",
            difficulty: "Intermediate",
            topic: "Design",
            question:
                "What factors should be considered when designing an electrical system?",
            hint:
                "Think about load, protection, safety, voltage and standards.",
            expectedConcepts: [
                "load",
                "voltage",
                "current",
                "protection",
                "grounding",
                "safety",
                "standards",
            ],
            criticalConcepts: [
                "load calculation",
                "protection",
                "safety",
            ],
        }),

        createQuestion({
            category: "Electrical Design",
            difficulty: "Advanced",
            topic: "Protection",
            question:
                "How would you design protection for an electrical installation?",
            hint:
                "Think about breakers, relays, grounding and fault conditions.",
            expectedConcepts: [
                "circuit breakers",
                "relays",
                "overcurrent",
                "short circuit",
                "grounding",
                "coordination",
            ],
            criticalConcepts: [
                "fault protection",
                "overcurrent protection",
            ],
        }),
    ],

    "Power Systems Engineer": [
        createQuestion({
            category: "Power Systems",
            difficulty: "Intermediate",
            topic: "Power",
            question:
                "What are the main components of a power system?",
            hint:
                "Think about generation, transmission, distribution and loads.",
            expectedConcepts: [
                "generation",
                "transmission",
                "distribution",
                "loads",
                "substations",
            ],
            criticalConcepts: [
                "generation",
                "transmission",
                "distribution",
            ],
        }),

        createQuestion({
            category: "Power Systems",
            difficulty: "Advanced",
            topic: "Stability",
            question:
                "What is power system stability and why does it matter?",
            hint:
                "Think about maintaining synchronism after disturbances.",
            expectedConcepts: [
                "stability",
                "disturbance",
                "synchronism",
                "transient stability",
                "frequency",
            ],
            criticalConcepts: [
                "synchronism",
                "response to disturbance",
            ],
        }),
    ],

    "Control Systems Engineer": [
        createQuestion({
            category: "Control",
            difficulty: "Intermediate",
            topic: "Control Systems",
            question:
                "Explain open-loop and closed-loop control systems.",
            hint:
                "Think about feedback.",
            expectedConcepts: [
                "open loop",
                "closed loop",
                "feedback",
                "controller",
                "reference",
                "error",
            ],
            criticalConcepts: [
                "feedback",
                "error correction",
            ],
        }),

        createQuestion({
            category: "Control",
            difficulty: "Advanced",
            topic: "PID",
            question:
                "Explain the role of the P, I and D terms in a PID controller.",
            hint:
                "Think about present error, accumulated error and rate of change.",
            expectedConcepts: [
                "proportional",
                "integral",
                "derivative",
                "error",
                "overshoot",
                "steady-state error",
            ],
            criticalConcepts: [
                "P/I/D roles",
            ],
        }),
    ],

    /* =====================================================
       ELECTRONICS
       ===================================================== */

    "Electronics Engineer": [
        createQuestion({
            category: "Electronics",
            difficulty: "Intermediate",
            topic: "Circuits",
            question:
                "Explain the difference between analog and digital electronics.",
            hint:
                "Think about continuous and discrete signals.",
            expectedConcepts: [
                "analog",
                "digital",
                "continuous signal",
                "discrete signal",
                "logic levels",
            ],
            criticalConcepts: [
                "continuous vs discrete",
            ],
        }),

        createQuestion({
            category: "Electronics",
            difficulty: "Intermediate",
            topic: "Semiconductors",
            question:
                "Explain how a diode works.",
            hint:
                "Think about the PN junction and current direction.",
            expectedConcepts: [
                "PN junction",
                "forward bias",
                "reverse bias",
                "depletion region",
                "current flow",
            ],
            criticalConcepts: [
                "PN junction",
                "forward/reverse bias",
            ],
        }),
    ],

    "Embedded Engineer": [
        createQuestion({
            category: "Embedded",
            difficulty: "Intermediate",
            topic: "Microcontrollers",
            question:
                "What is a microcontroller and how is it different from a microprocessor?",
            hint:
                "Think about integrated peripherals and typical applications.",
            expectedConcepts: [
                "CPU",
                "memory",
                "peripherals",
                "microcontroller",
                "microprocessor",
                "embedded systems",
            ],
            criticalConcepts: [
                "integrated peripherals",
                "embedded use",
            ],
        }),

        createQuestion({
            category: "Embedded",
            difficulty: "Advanced",
            topic: "RTOS",
            question:
                "Why would you use an RTOS in an embedded system?",
            hint:
                "Think about scheduling, timing and concurrent tasks.",
            expectedConcepts: [
                "real-time",
                "task scheduling",
                "priorities",
                "timing",
                "concurrency",
                "deterministic behavior",
            ],
            criticalConcepts: [
                "task scheduling",
                "real-time constraints",
            ],
        }),
    ],

    "Electronics Design Engineer": [
        createQuestion({
            category: "Electronics",
            difficulty: "Intermediate",
            topic: "PCB",
            question:
                "What factors should be considered when designing a PCB?",
            hint:
                "Think about signal integrity, power, thermal design and manufacturability.",
            expectedConcepts: [
                "signal integrity",
                "power distribution",
                "thermal management",
                "grounding",
                "component placement",
                "manufacturability",
            ],
            criticalConcepts: [
                "signal integrity",
                "power/grounding",
            ],
        }),

        createQuestion({
            category: "Electronics",
            difficulty: "Advanced",
            topic: "Design",
            question:
                "How would you validate an electronic circuit before production?",
            hint:
                "Think about simulation, prototype testing and measurements.",
            expectedConcepts: [
                "requirements",
                "simulation",
                "prototype",
                "measurements",
                "testing",
                "validation",
            ],
            criticalConcepts: [
                "testing",
                "validation",
            ],
        }),
    ],

    "VLSI Engineer": [
        createQuestion({
            category: "VLSI",
            difficulty: "Intermediate",
            topic: "Digital Design",
            question:
                "Explain the difference between combinational and sequential logic.",
            hint:
                "Think about whether the output depends on previous state.",
            expectedConcepts: [
                "combinational logic",
                "sequential logic",
                "memory",
                "clock",
                "current input",
                "previous state",
            ],
            criticalConcepts: [
                "state/memory difference",
            ],
        }),

        createQuestion({
            category: "VLSI",
            difficulty: "Advanced",
            topic: "RTL",
            question:
                "What is RTL design and where is Verilog or SystemVerilog used?",
            hint:
                "Think about describing digital hardware before synthesis.",
            expectedConcepts: [
                "RTL",
                "hardware description language",
                "Verilog",
                "SystemVerilog",
                "synthesis",
                "digital logic",
            ],
            criticalConcepts: [
                "RTL",
                "hardware description",
            ],
        }),
    ],

    /* =====================================================
       AUTOMOTIVE
       ===================================================== */

    "Automotive Engineer": [
        createQuestion({
            category: "Automotive",
            difficulty: "Intermediate",
            topic: "Vehicles",
            question:
                "What are the major systems in a modern automobile?",
            hint:
                "Think about powertrain, chassis, braking, steering and electronics.",
            expectedConcepts: [
                "powertrain",
                "chassis",
                "braking",
                "steering",
                "suspension",
                "electronics",
            ],
            criticalConcepts: [
                "powertrain",
                "chassis",
                "safety systems",
            ],
        }),

        createQuestion({
            category: "Automotive",
            difficulty: "Advanced",
            topic: "EV",
            question:
                "What are the main engineering challenges in electric vehicles?",
            hint:
                "Think about battery, thermal management, power electronics and range.",
            expectedConcepts: [
                "battery",
                "thermal management",
                "power electronics",
                "range",
                "charging",
                "weight",
            ],
            criticalConcepts: [
                "battery",
                "thermal management",
            ],
        }),
    ],

    "Automotive Design Engineer": [
        createQuestion({
            category: "Automotive Design",
            difficulty: "Intermediate",
            topic: "Design",
            question:
                "What factors should be considered when designing an automotive component?",
            hint:
                "Think about safety, loads, materials, weight and manufacturability.",
            expectedConcepts: [
                "loads",
                "materials",
                "weight",
                "safety",
                "manufacturability",
                "durability",
            ],
            criticalConcepts: [
                "safety",
                "loads",
                "manufacturability",
            ],
        }),

        createQuestion({
            category: "Automotive Design",
            difficulty: "Advanced",
            topic: "Validation",
            question:
                "How would you validate a new automotive component?",
            hint:
                "Think about simulation, prototype testing and regulatory requirements.",
            expectedConcepts: [
                "requirements",
                "simulation",
                "prototype",
                "testing",
                "durability",
                "regulatory requirements",
            ],
            criticalConcepts: [
                "testing",
                "validation",
            ],
        }),
    ],

    "Automotive Manufacturing Engineer": [
        createQuestion({
            category: "Manufacturing",
            difficulty: "Intermediate",
            topic: "Production",
            question:
                "How would you improve efficiency in an automotive production line?",
            hint:
                "Think about bottlenecks, cycle time, defects and downtime.",
            expectedConcepts: [
                "bottlenecks",
                "cycle time",
                "defects",
                "downtime",
                "process improvement",
            ],
            criticalConcepts: [
                "bottleneck",
                "cycle time",
            ],
        }),

        createQuestion({
            category: "Manufacturing",
            difficulty: "Intermediate",
            topic: "Quality",
            question:
                "How would you identify the root cause of repeated manufacturing defects?",
            hint:
                "Think about data, process mapping and root-cause analysis.",
            expectedConcepts: [
                "data collection",
                "process mapping",
                "root-cause analysis",
                "5 Whys",
                "corrective action",
            ],
            criticalConcepts: [
                "root-cause analysis",
                "corrective action",
            ],
        }),
    ],

    /* =====================================================
       AEROSPACE
       ===================================================== */

    "Aerospace Engineer": [
        createQuestion({
            category: "Aerospace",
            difficulty: "Intermediate",
            topic: "Aerodynamics",
            question:
                "Explain the four major forces acting on an aircraft.",
            hint:
                "Think about lift, weight, thrust and drag.",
            expectedConcepts: [
                "lift",
                "weight",
                "thrust",
                "drag",
            ],
            criticalConcepts: [
                "four forces",
            ],
        }),

        createQuestion({
            category: "Aerospace",
            difficulty: "Advanced",
            topic: "Design",
            question:
                "What factors are important when designing an aerospace structure?",
            hint:
                "Think about weight, strength, fatigue, safety and materials.",
            expectedConcepts: [
                "weight",
                "strength",
                "fatigue",
                "materials",
                "safety",
                "loads",
            ],
            criticalConcepts: [
                "weight",
                "strength",
                "fatigue",
            ],
        }),
    ],

    "Aerospace Design Engineer": [
        createQuestion({
            category: "Aerospace Design",
            difficulty: "Advanced",
            topic: "Design",
            question:
                "How would you approach the preliminary design of an aircraft component?",
            hint:
                "Think about requirements, loads, materials, simulation and validation.",
            expectedConcepts: [
                "requirements",
                "loads",
                "materials",
                "CAD",
                "simulation",
                "validation",
            ],
            criticalConcepts: [
                "requirements",
                "loads",
                "validation",
            ],
        }),

        createQuestion({
            category: "Aerospace Design",
            difficulty: "Intermediate",
            topic: "Materials",
            question:
                "Why are lightweight materials important in aerospace engineering?",
            hint:
                "Think about weight, fuel efficiency and structural performance.",
            expectedConcepts: [
                "weight reduction",
                "fuel efficiency",
                "strength-to-weight ratio",
                "structural performance",
            ],
            criticalConcepts: [
                "strength-to-weight ratio",
                "weight reduction",
            ],
        }),
    ],

    "Avionics Engineer": [
        createQuestion({
            category: "Avionics",
            difficulty: "Intermediate",
            topic: "Systems",
            question:
                "What systems are commonly considered part of aircraft avionics?",
            hint:
                "Think about navigation, communication, flight control and instrumentation.",
            expectedConcepts: [
                "navigation",
                "communication",
                "flight control",
                "instrumentation",
                "sensors",
            ],
            criticalConcepts: [
                "navigation",
                "communication",
                "flight systems",
            ],
        }),

        createQuestion({
            category: "Avionics",
            difficulty: "Advanced",
            topic: "Safety",
            question:
                "Why is redundancy important in avionics systems?",
            hint:
                "Think about failure tolerance and flight safety.",
            expectedConcepts: [
                "redundancy",
                "fault tolerance",
                "failure detection",
                "safety",
                "backup systems",
            ],
            criticalConcepts: [
                "fault tolerance",
                "redundancy",
            ],
        }),
    ],

    /* =====================================================
       CHEMICAL
       ===================================================== */

    "Chemical Engineer": [
        createQuestion({
            category: "Chemical",
            difficulty: "Intermediate",
            topic: "Processes",
            question:
                "What are the main principles used when designing a chemical process?",
            hint:
                "Think about material balances, energy balances, safety and economics.",
            expectedConcepts: [
                "material balance",
                "energy balance",
                "process conditions",
                "safety",
                "economics",
            ],
            criticalConcepts: [
                "material balance",
                "energy balance",
                "safety",
            ],
        }),

        createQuestion({
            category: "Chemical",
            difficulty: "Intermediate",
            topic: "Thermodynamics",
            question:
                "Why is thermodynamics important in chemical engineering?",
            hint:
                "Think about energy, equilibrium and process feasibility.",
            expectedConcepts: [
                "energy",
                "equilibrium",
                "enthalpy",
                "entropy",
                "process feasibility",
            ],
            criticalConcepts: [
                "energy",
                "equilibrium",
            ],
        }),
    ],

    "Process Engineer": [
        createQuestion({
            category: "Process",
            difficulty: "Intermediate",
            topic: "Optimization",
            question:
                "How would you improve the efficiency of an industrial process?",
            hint:
                "Think about throughput, energy, waste and bottlenecks.",
            expectedConcepts: [
                "throughput",
                "energy consumption",
                "waste",
                "bottlenecks",
                "process optimization",
            ],
            criticalConcepts: [
                "bottleneck",
                "process optimization",
            ],
        }),

        createQuestion({
            category: "Process",
            difficulty: "Advanced",
            topic: "Safety",
            question:
                "How would you identify and reduce risks in a chemical process?",
            hint:
                "Think about hazards, operating conditions and process safeguards.",
            expectedConcepts: [
                "hazard identification",
                "risk assessment",
                "operating conditions",
                "safeguards",
                "emergency procedures",
            ],
            criticalConcepts: [
                "hazard identification",
                "risk reduction",
            ],
        }),
    ],

    "Chemical Process Design Engineer": [
        createQuestion({
            category: "Process Design",
            difficulty: "Intermediate",
            topic: "Process Design",
            question:
                "What information is needed before designing a chemical process?",
            hint:
                "Think about feed, products, operating conditions and constraints.",
            expectedConcepts: [
                "feed",
                "products",
                "operating conditions",
                "capacity",
                "constraints",
                "material balance",
            ],
            criticalConcepts: [
                "feed/products",
                "operating conditions",
            ],
        }),

        createQuestion({
            category: "Process Design",
            difficulty: "Advanced",
            topic: "Equipment",
            question:
                "How would you select equipment for a chemical process?",
            hint:
                "Think about operating conditions, capacity, materials and safety.",
            expectedConcepts: [
                "capacity",
                "pressure",
                "temperature",
                "materials",
                "corrosion",
                "safety",
                "maintenance",
            ],
            criticalConcepts: [
                "operating conditions",
                "material compatibility",
            ],
        }),
    ],

    /* =====================================================
       BIOMEDICAL
       ===================================================== */

    "Biomedical Engineer": [
        createQuestion({
            category: "Biomedical",
            difficulty: "Intermediate",
            topic: "Devices",
            question:
                "What factors should be considered when designing a biomedical device?",
            hint:
                "Think about safety, biocompatibility, usability and reliability.",
            expectedConcepts: [
                "patient safety",
                "biocompatibility",
                "usability",
                "reliability",
                "risk management",
                "validation",
            ],
            criticalConcepts: [
                "patient safety",
                "biocompatibility",
            ],
        }),

        createQuestion({
            category: "Biomedical",
            difficulty: "Advanced",
            topic: "Regulation",
            question:
                "Why are testing and regulatory requirements important for medical devices?",
            hint:
                "Think about patient safety and device reliability.",
            expectedConcepts: [
                "patient safety",
                "testing",
                "validation",
                "risk management",
                "regulatory compliance",
                "documentation",
            ],
            criticalConcepts: [
                "safety",
                "validation",
                "regulatory compliance",
            ],
        }),
    ],

    "Medical Device Engineer": [
        createQuestion({
            category: "Medical Devices",
            difficulty: "Intermediate",
            topic: "Design",
            question:
                "What are the key stages in developing a medical device?",
            hint:
                "Think about requirements, design, prototype, testing and validation.",
            expectedConcepts: [
                "requirements",
                "design",
                "prototype",
                "verification",
                "validation",
                "manufacturing",
            ],
            criticalConcepts: [
                "requirements",
                "verification/validation",
            ],
        }),

        createQuestion({
            category: "Medical Devices",
            difficulty: "Advanced",
            topic: "Risk",
            question:
                "How would you approach risk management for a medical device?",
            hint:
                "Think about identifying hazards, evaluating risks and controls.",
            expectedConcepts: [
                "hazard identification",
                "risk analysis",
                "risk controls",
                "verification",
                "residual risk",
                "documentation",
            ],
            criticalConcepts: [
                "risk identification",
                "risk controls",
            ],
        }),
    ],

    "Clinical Engineer": [
        createQuestion({
            category: "Clinical Engineering",
            difficulty: "Intermediate",
            topic: "Healthcare",
            question:
                "What is the role of a clinical engineer in a healthcare environment?",
            hint:
                "Think about medical equipment, safety, maintenance and clinical teams.",
            expectedConcepts: [
                "medical equipment",
                "maintenance",
                "safety",
                "clinical teams",
                "technology management",
            ],
            criticalConcepts: [
                "medical equipment",
                "patient safety",
            ],
        }),

        createQuestion({
            category: "Clinical Engineering",
            difficulty: "Intermediate",
            topic: "Safety",
            question:
                "How would you evaluate the safety of medical equipment used in a hospital?",
            hint:
                "Think about testing, maintenance, electrical safety and documentation.",
            expectedConcepts: [
                "testing",
                "maintenance",
                "electrical safety",
                "calibration",
                "documentation",
                "risk assessment",
            ],
            criticalConcepts: [
                "testing",
                "risk assessment",
            ],
        }),
    ],
};

/* =========================================================
   GENERIC QUESTIONS
   ========================================================= */

const GENERIC_QUESTIONS = [
    createQuestion({
        category: "Technical",
        difficulty: "Intermediate",
        topic: "Fundamentals",
        question:
            "What are the most important fundamentals a professional in this role should understand?",
        hint:
            "Identify the core concepts, tools and principles used in the role.",
        expectedConcepts: [
            "core fundamentals",
            "role-specific knowledge",
            "tools",
            "principles",
        ],
        criticalConcepts: [
            "role fundamentals",
        ],
    }),

    createQuestion({
        category: "Problem Solving",
        difficulty: "Intermediate",
        topic: "Problem Solving",
        question:
            "Describe how you would approach a difficult technical problem in your field.",
        hint:
            "Start with requirements, break the problem down, investigate and validate your solution.",
        expectedConcepts: [
            "requirements",
            "problem decomposition",
            "investigation",
            "solution",
            "validation",
        ],
        criticalConcepts: [
            "problem decomposition",
            "validation",
        ],
    }),

    createQuestion({
        category: "Practical",
        difficulty: "Intermediate",
        topic: "Projects",
        question:
            "Tell me about a project where you applied your technical knowledge to solve a real problem.",
        hint:
            "Explain the problem, your responsibility, approach, result and what you learned.",
        expectedConcepts: [
            "problem",
            "responsibility",
            "approach",
            "result",
            "learning",
        ],
        criticalConcepts: [
            "personal contribution",
            "result",
        ],
    }),

    createQuestion({
        category: "Professional",
        difficulty: "Intermediate",
        topic: "Communication",
        question:
            "How would you explain a complex technical concept to someone without a technical background?",
        hint:
            "Focus on clarity, examples and avoiding unnecessary jargon.",
        expectedConcepts: [
            "simple language",
            "examples",
            "audience awareness",
            "clarity",
            "avoid jargon",
        ],
        criticalConcepts: [
            "audience adaptation",
            "clarity",
        ],
    }),

    createQuestion({
        category: "Advanced",
        difficulty: "Advanced",
        topic: "Decision Making",
        question:
            "Describe a technical decision where you had to balance quality, cost, time and reliability.",
        hint:
            "Explain the trade-offs and why you selected your approach.",
        expectedConcepts: [
            "trade-offs",
            "quality",
            "cost",
            "time",
            "reliability",
            "decision reasoning",
        ],
        criticalConcepts: [
            "trade-offs",
            "decision reasoning",
        ],
    }),
];

/* =========================================================
   HELPERS
   ========================================================= */

const getRoleIcon = (role) => {
    for (const group of ROLE_GROUPS) {
        if (group.roles.includes(role)) {
            return group.icon;
        }
    }

    return "🎯";
};

const getQuestionsForRole = (role) => {
    return QUESTION_BANKS[role] || GENERIC_QUESTIONS;
};

const getInitialRole = () => {
    return "Full Stack Developer";
};

/* =========================================================
   DIFFICULTY
   ========================================================= */

const normalizeDifficultyForApi = (difficulty) => {
    const map = {
        Beginner: "Easy",
        Intermediate: "Intermediate",
        Advanced: "Hard",

        Easy: "Easy",
        Hard: "Hard",

        easy: "Easy",
        medium: "Intermediate",
        hard: "Hard",
    };

    return map[difficulty] || "Intermediate";
};

/* =========================================================
   AI EVALUATION API
   ========================================================= */

const evaluateAnswerWithAI = async (payload) => {
    const token = getAuthToken();

    if (!token) {
        throw new Error(
            "Authentication token not found. Please login again."
        );
    }

    const controller = new AbortController();

    const timeoutId = setTimeout(() => {
        controller.abort();
    }, 360000);

    try {
        const response = await fetch(
            `${API_BASE_URL}/interviews/answer`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },

                body: JSON.stringify(payload),

                signal: controller.signal,
            }
        );

        let result;

        try {
            result = await response.json();
        } catch {
            throw new Error(
                "The server returned an invalid response."
            );
        }

        if (!response.ok) {
            throw new Error(
                result?.message ||
                    result?.error ||
                    "Failed to evaluate interview answer."
            );
        }

        if (
            !result?.success ||
            !result?.data ||
            !result?.data?.evaluation
        ) {
            throw new Error(
                "Invalid AI evaluation response from server."
            );
        }

        return result.data.evaluation;
    } catch (error) {
        if (error.name === "AbortError") {
            throw new Error(
                "AI evaluation timed out. Ollama may need more time to process this answer."
            );
        }

        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
};

/* =========================================================
   MAIN COMPONENT
   ========================================================= */

const Interview = () => {
    const [screen, setScreen] =
        useState("setup");

    const [selectedRole, setSelectedRole] =
        useState(getInitialRole);

    const [difficulty, setDifficulty] =
        useState("Mixed");

    const [questionCount, setQuestionCount] =
        useState(5);

    const [roleMenuOpen, setRoleMenuOpen] =
        useState(false);

    const [roleSearch, setRoleSearch] =
        useState("");

    const [questions, setQuestions] =
        useState([]);

    const [currentIndex, setCurrentIndex] =
        useState(0);

    const [answer, setAnswer] =
        useState("");

    const [submittedAnswers, setSubmittedAnswers] =
        useState([]);

    const [feedback, setFeedback] =
        useState(null);

    const [showHint, setShowHint] =
        useState(false);

    const [secondsLeft, setSecondsLeft] =
        useState(20 * 60);

    const [evaluating, setEvaluating] =
        useState(false);

    const [evaluationError, setEvaluationError] =
        useState("");

    const timeoutHandledRef =
        useRef(false);

    /* =====================================================
       FILTERED ROLES
       ===================================================== */

    const filteredGroups = useMemo(() => {
        const search =
            roleSearch.trim().toLowerCase();

        if (!search) {
            return ROLE_GROUPS;
        }

        return ROLE_GROUPS
            .map((group) => ({
                ...group,

                roles: group.roles.filter(
                    (role) =>
                        role
                            .toLowerCase()
                            .includes(search)
                ),
            }))
            .filter(
                (group) =>
                    group.roles.length > 0
            );
    }, [roleSearch]);

    /* =====================================================
       CURRENT QUESTION
       ===================================================== */

    const currentQuestion =
        questions[currentIndex];

    /* =====================================================
       TIMER
       ===================================================== */

    useEffect(() => {
        if (screen !== "interview") {
            return undefined;
        }

        if (secondsLeft <= 0) {
            if (
                !evaluating &&
                !timeoutHandledRef.current
            ) {
                timeoutHandledRef.current = true;

                handleSubmit(true);
            }

            return undefined;
        }

        const timer = setInterval(() => {
            setSecondsLeft((previous) =>
                Math.max(0, previous - 1)
            );
        }, 1000);

        return () =>
            clearInterval(timer);
    }, [
        screen,
        secondsLeft,
        evaluating,
    ]);

    /* =====================================================
       TIMER FORMAT
       ===================================================== */

    const formattedTime = useMemo(() => {
        const minutes = Math.floor(
            secondsLeft / 60
        );

        const seconds =
            secondsLeft % 60;

        return `${String(minutes).padStart(
            2,
            "0"
        )}:${String(seconds).padStart(
            2,
            "0"
        )}`;
    }, [secondsLeft]);

    /* =====================================================
       START INTERVIEW
       ===================================================== */

    const startInterview = () => {
        let roleQuestions = [
            ...getQuestionsForRole(
                selectedRole
            ),
        ];

        if (difficulty !== "Mixed") {
            const filtered =
                roleQuestions.filter(
                    (item) =>
                        item.difficulty ===
                        difficulty
                );

            if (filtered.length > 0) {
                roleQuestions = filtered;
            }
        }

        roleQuestions = [
            ...roleQuestions,
        ].sort(
            () => Math.random() - 0.5
        );

        /*
         * IMPORTANT:
         * Never repeat the same question just because
         * the user selected 15 questions.
         *
         * If the role has only 5 questions,
         * the interview will contain 5 questions.
         */

        const totalQuestions = Math.min(
            questionCount,
            roleQuestions.length
        );

        const finalQuestions =
            roleQuestions.slice(
                0,
                totalQuestions
            );

        setQuestions(finalQuestions);

        setCurrentIndex(0);

        setAnswer("");

        setFeedback(null);

        setSubmittedAnswers([]);

        setShowHint(false);

        setEvaluating(false);

        setEvaluationError("");

        timeoutHandledRef.current =
            false;

        setSecondsLeft(
            Math.max(
                1,
                totalQuestions
            ) *
                4 *
                60
        );

        setScreen("interview");
    };

    /* =====================================================
       LOAD QUESTION
       ===================================================== */

    const loadQuestion = (index) => {
        const saved =
            submittedAnswers[index];

        setCurrentIndex(index);

        setAnswer(
            saved?.answer || ""
        );

        setFeedback(
            saved || null
        );

        setEvaluationError("");

        setShowHint(false);

        setEvaluating(false);
    };

    /* =====================================================
       SUBMIT ANSWER
       ===================================================== */

    const handleSubmit = async (
        automatic = false
    ) => {
        if (!currentQuestion) {
            return;
        }

        if (evaluating) {
            return;
        }

        const cleanAnswer =
            answer.trim();

        /*
         * IMPORTANT TIMER FIX
         *
         * Previously timeout + blank answer caused
         * handleSubmit() to stop forever.
         *
         * Now the timeout is submitted as a special
         * no-answer value so the AI can evaluate it
         * as an unanswered question.
         */

        const answerForEvaluation =
            automatic && !cleanAnswer
                ? "[NO ANSWER SUBMITTED — TIME EXPIRED]"
                : cleanAnswer;

        if (
            !automatic &&
            !cleanAnswer
        ) {
            setEvaluationError(
                "Please provide an answer before submitting."
            );

            return;
        }

        try {
            setEvaluating(true);

            setEvaluationError("");

            setFeedback(null);

            const payload = {
                role: selectedRole,

                category:
                    currentQuestion.category ||
                    "Technical",

                topic:
                    currentQuestion.topic ||
                    "General",

                difficulty:
                    normalizeDifficultyForApi(
                        currentQuestion.difficulty
                    ),

                question:
                    currentQuestion.question,

                /*
                 * REAL QUESTION METADATA
                 *
                 * This is much better than the previous:
                 *
                 * expectedConcepts: [topic, category]
                 *
                 * because the AI now knows what a good
                 * answer should actually contain.
                 */

                expectedConcepts:
                    currentQuestion.expectedConcepts ||
                    [],

                criticalConcepts:
                    currentQuestion.criticalConcepts ||
                    [],

                commonMistakes:
                    currentQuestion.commonMistakes ||
                    [],

                answer:
                    answerForEvaluation,
            };

            console.log(
                "Submitting interview answer for AI evaluation..."
            );

            const evaluation =
                await evaluateAnswerWithAI(
                    payload
                );

            console.log(
                "AI evaluation received:",
                evaluation
            );

            const strengths =
                Array.isArray(
                    evaluation.strengths
                )
                    ? evaluation.strengths
                    : [];

            const weaknesses =
                Array.isArray(
                    evaluation.weaknesses
                )
                    ? evaluation.weaknesses
                    : [];

            const missingConcepts =
                Array.isArray(
                    evaluation.missingConcepts
                )
                    ? evaluation.missingConcepts
                    : [];

            const incorrectClaims =
                Array.isArray(
                    evaluation.incorrectClaims
                )
                    ? evaluation.incorrectClaims
                    : [];

            const record = {
                question:
                    currentQuestion.question,

                answer:
                    cleanAnswer ||
                    "[No answer submitted]",

                score:
                    Number(
                        evaluation.score
                    ) || 0,

                level:
                    evaluation.verdict ||
                    "Evaluated",

                verdict:
                    evaluation.verdict ||
                    "Evaluated",

                dimensions:
                    evaluation.dimensions ||
                    {},

                explanation:
                    evaluation.explanation ||
                    "",

                strengths,

                weaknesses,

                improvements:
                    weaknesses,

                missingConcepts,

                incorrectClaims,

                improvementAdvice:
                    evaluation.improvementAdvice ||
                    "",

                idealAnswer:
                    evaluation.idealAnswer ||
                    "",

                learning:
                    missingConcepts.length >
                    0
                        ? missingConcepts[0]
                        : currentQuestion.topic,
            };

            setSubmittedAnswers(
                (previous) => {
                    const copy = [
                        ...previous,
                    ];

                    copy[currentIndex] =
                        record;

                    return copy;
                }
            );

            setFeedback(record);

            /*
             * Automatic timeout:
             * automatically continue after evaluation.
             */

            if (automatic) {
                setTimeout(() => {
                    if (
                        currentIndex <
                        questions.length - 1
                    ) {
                        goToNextQuestion();
                    } else {
                        finishInterview();
                    }
                }, 700);
            }
        } catch (error) {
            console.error(
                "Interview AI Evaluation Error:",
                error
            );

            /*
             * If timeout evaluation failed,
             * allow retry instead of getting stuck.
             */

            if (automatic) {
                timeoutHandledRef.current =
                    false;
            }

            setEvaluationError(
                error.message ||
                    "Failed to evaluate your answer. Please try again."
            );
        } finally {
            setEvaluating(false);
        }
    };

    /* =====================================================
       EDIT ANSWER
       ===================================================== */

    const editCurrentAnswer = () => {
        setFeedback(null);

        setEvaluationError("");

        setShowHint(false);
    };

    /* =====================================================
       NEXT
       ===================================================== */

    const goToNextQuestion = () => {
        if (
            currentIndex >=
            questions.length - 1
        ) {
            finishInterview();

            return;
        }

        const nextIndex =
            currentIndex + 1;

        loadQuestion(nextIndex);
    };

    /* =====================================================
       PREVIOUS
       ===================================================== */

    const goToPreviousQuestion = () => {
        if (currentIndex <= 0) {
            return;
        }

        const previousIndex =
            currentIndex - 1;

        loadQuestion(previousIndex);
    };

    /* =====================================================
       FINISH
       ===================================================== */

    const finishInterview = () => {
        setScreen("result");
    };

    /* =====================================================
       REVIEW
       ===================================================== */

    const reviewInterview = () => {
        const firstAnsweredIndex =
            submittedAnswers.findIndex(
                Boolean
            );

        const index =
            firstAnsweredIndex >= 0
                ? firstAnsweredIndex
                : 0;

        loadQuestion(index);

        setScreen("interview");
    };

    /* =====================================================
       RESTART
       ===================================================== */

    const restartInterview = () => {
        setScreen("setup");

        setQuestions([]);

        setCurrentIndex(0);

        setAnswer("");

        setFeedback(null);

        setSubmittedAnswers([]);

        setShowHint(false);

        setEvaluating(false);

        setEvaluationError("");

        timeoutHandledRef.current =
            false;

        setSecondsLeft(20 * 60);
    };

    /* =====================================================
       FINAL SCORE
       ===================================================== */

    const finalScore = useMemo(() => {
        const completed =
            submittedAnswers.filter(
                Boolean
            );

        if (!completed.length) {
            return 0;
        }

        const total =
            completed.reduce(
                (sum, item) =>
                    sum +
                    (Number(
                        item.score
                    ) || 0),
                0
            );

        return Math.round(
            total / completed.length
        );
    }, [submittedAnswers]);

    /* =====================================================
       COMPLETED COUNT
       ===================================================== */

    const completedCount =
        submittedAnswers.filter(
            Boolean
        ).length;

    /* =====================================================
       SETUP SCREEN
       ===================================================== */

    if (screen === "setup") {
        const availableQuestions =
            getQuestionsForRole(
                selectedRole
            ).length;

        return (
            <div className="interview-page">
                <div className="interview-container">

                    {/* HEADER */}

                    <header className="interview-header">
                        <div>
                            <span className="eyebrow">
                                AI INTERVIEW PRACTICE
                            </span>

                            <h1>
                                Practice like the
                                <br />
                                real interview.
                            </h1>

                            <p>
                                Choose your target
                                career, configure
                                your interview and
                                practice technical,
                                practical and
                                problem-solving
                                questions.
                            </p>
                        </div>

                        <div className="header-icon">
                            🎯
                        </div>
                    </header>

                    {/* STATS */}

                    <div className="interview-stats">

                        <div className="stat-card">
                            <span>
                                CAREER ROLES
                            </span>

                            <strong>
                                40+
                            </strong>

                            <p>
                                <span className="interview-stat-detail">Software and engineering careers supported.</span>
                                <span className="interview-stat-short">Career paths</span>
                            </p>
                        </div>

                        <div className="stat-card">
                            <span>
                                INTERVIEW MODES
                            </span>

                            <strong>
                                3
                            </strong>

                            <p>
                                <span className="interview-stat-detail">Technical, practical and problem-solving.</span>
                                <span className="interview-stat-short">Practice styles</span>
                            </p>
                        </div>

                        <div className="stat-card">
                            <span>
                                AI EVALUATION
                            </span>

                            <strong>
                                Qwen3
                            </strong>

                            <p>
                                <span className="interview-stat-detail">Local AI-powered answer evaluation.</span>
                                <span className="interview-stat-short">AI feedback</span>
                            </p>
                        </div>

                    </div>

                    {/* ROLE */}

                    <section className="setup-card">

                        <div className="section-title">

                            <div className="step-number">
                                01
                            </div>

                            <div>
                                <h2>
                                    Select your target
                                    role
                                </h2>

                                <p>
                                    Your interview
                                    questions will be
                                    based on this
                                    career.
                                </p>
                            </div>

                        </div>

                        <div className="role-selector">

                            <button
                                type="button"
                                className="role-selector-button"
                                onClick={() =>
                                    setRoleMenuOpen(
                                        (previous) =>
                                            !previous
                                    )
                                }
                            >

                                <div className="selected-role-info">

                                    <div className="selected-role-icon">
                                        {getRoleIcon(
                                            selectedRole
                                        )}
                                    </div>

                                    <div>
                                        <span>
                                            TARGET ROLE
                                        </span>

                                        <strong>
                                            {
                                                selectedRole
                                            }
                                        </strong>
                                    </div>

                                </div>

                                <span className="chevron">
                                    {roleMenuOpen
                                        ? "▲"
                                        : "▼"}
                                </span>

                            </button>

                            {roleMenuOpen && (
                                <div className="role-menu">

                                    <div className="role-search">

                                        <input
                                            type="text"
                                            value={
                                                roleSearch
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setRoleSearch(
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                            placeholder="Search a career..."
                                            autoFocus
                                        />

                                    </div>

                                    <div className="role-list">

                                        {filteredGroups.map(
                                            (group) => (
                                                <div
                                                    className="role-group"
                                                    key={
                                                        group.name
                                                    }
                                                >

                                                    <div className="role-group-title">
                                                        {
                                                            group.icon
                                                        }{" "}
                                                        {
                                                            group.name
                                                        }
                                                    </div>

                                                    {group.roles.map(
                                                        (
                                                            role
                                                        ) => (
                                                            <button
                                                                type="button"
                                                                key={
                                                                    role
                                                                }
                                                                className={`role-option ${
                                                                    selectedRole ===
                                                                    role
                                                                        ? "active"
                                                                        : ""
                                                                }`}
                                                                onClick={() => {
                                                                    setSelectedRole(
                                                                        role
                                                                    );

                                                                    setRoleMenuOpen(
                                                                        false
                                                                    );

                                                                    setRoleSearch(
                                                                        ""
                                                                    );
                                                                }}
                                                            >
                                                                {
                                                                    role
                                                                }
                                                            </button>
                                                        )
                                                    )}

                                                </div>
                                            )
                                        )}

                                    </div>

                                </div>
                            )}

                        </div>

                        <div className="role-preview">

                            <div>

                                <span>
                                    INTERVIEW FOCUS
                                </span>

                                <div className="skill-tags">

                                    {getQuestionsForRole(
                                        selectedRole
                                    )
                                        .slice(
                                            0,
                                            6
                                        )
                                        .map(
                                            (
                                                item,
                                                index
                                            ) => (
                                                <span
                                                    key={`${item.topic}-${index}`}
                                                >
                                                    {
                                                        item.topic
                                                    }
                                                </span>
                                            )
                                        )}

                                </div>

                            </div>

                        </div>

                        <div
                            style={{
                                marginTop: "14px",
                                fontSize: "13px",
                                opacity: 0.7,
                            }}
                        >
                            {availableQuestions}{" "}
                            role-specific questions
                            currently available.
                        </div>

                    </section>

                    {/* OPTIONS */}

                    <section className="options-card">

                        <div className="section-title">

                            <div className="step-number">
                                02
                            </div>

                            <div>
                                <h2>
                                    Configure your
                                    interview
                                </h2>

                                <p>
                                    Choose the
                                    difficulty and
                                    number of
                                    questions.
                                </p>
                            </div>

                        </div>

                        <div className="option-grid">

                            <div className="option-block">

                                <label>
                                    Difficulty
                                </label>

                                <div className="option-buttons">

                                    {[
                                        "Beginner",
                                        "Intermediate",
                                        "Advanced",
                                        "Mixed",
                                    ].map(
                                        (item) => (
                                            <button
                                                type="button"
                                                key={
                                                    item
                                                }
                                                className={`option-button ${
                                                    difficulty ===
                                                    item
                                                        ? "selected"
                                                        : ""
                                                }`}
                                                onClick={() =>
                                                    setDifficulty(
                                                        item
                                                    )
                                                }
                                            >
                                                {
                                                    item
                                                }
                                            </button>
                                        )
                                    )}

                                </div>

                            </div>

                            <div className="option-block">

                                <label>
                                    Number of
                                    questions
                                </label>

                                <div className="question-count">

                                    {[5, 10, 15].map(
                                        (
                                            number
                                        ) => (
                                            <button
                                                type="button"
                                                key={
                                                    number
                                                }
                                                className={`count-button ${
                                                    questionCount ===
                                                    number
                                                        ? "selected"
                                                        : ""
                                                }`}
                                                onClick={() =>
                                                    setQuestionCount(
                                                        number
                                                    )
                                                }
                                            >
                                                {
                                                    number
                                                }
                                            </button>
                                        )
                                    )}

                                </div>

                            </div>

                        </div>

                    </section>

                    {/* START */}

                    <section className="start-card">

                        <div>

                            <div className="start-icon">
                                🚀
                            </div>

                            <div>

                                <span className="eyebrow">
                                    READY TO
                                    PRACTICE?
                                </span>

                                <h2>
                                    {
                                        selectedRole
                                    }{" "}
                                    interview
                                </h2>

                                <p>
                                    Up to{" "}
                                    {
                                        Math.min(
                                            questionCount,
                                            availableQuestions
                                        )
                                    }{" "}
                                    questions ·{" "}
                                    {difficulty} ·
                                    timed session
                                </p>

                            </div>

                        </div>

                        <button
                            type="button"
                            className="start-button"
                            onClick={
                                startInterview
                            }
                        >
                            Start Interview →
                        </button>

                    </section>

                    {/* HOW IT WORKS */}

                    <section className="how-section">

                        <div className="how-heading">

                            <span className="eyebrow">
                                HOW IT WORKS
                            </span>

                            <h2>
                                Your interview loop
                            </h2>

                        </div>

                        <div className="how-grid">

                            <div className="how-card">
                                <span>
                                    01
                                </span>

                                <div>
                                    <h3>
                                        Answer naturally
                                    </h3>

                                    <p>
                                        Explain your
                                        reasoning as if
                                        you were speaking
                                        to a real
                                        interviewer.
                                    </p>
                                </div>
                            </div>

                            <div className="how-card">
                                <span>
                                    02
                                </span>

                                <div>
                                    <h3>
                                        Get AI feedback
                                    </h3>

                                    <p>
                                        Review your
                                        score, strengths,
                                        weaknesses and
                                        missing concepts.
                                    </p>
                                </div>
                            </div>

                            <div className="how-card">
                                <span>
                                    03
                                </span>

                                <div>
                                    <h3>
                                        Review answers
                                    </h3>

                                    <p>
                                        Revisit your
                                        submitted answers
                                        and compare them
                                        with the ideal
                                        answer.
                                    </p>
                                </div>
                            </div>

                            <div className="how-card">
                                <span>
                                    04
                                </span>

                                <div>
                                    <h3>
                                        Improve
                                    </h3>

                                    <p>
                                        Use missing
                                        concepts and
                                        improvement advice
                                        to guide your next
                                        practice session.
                                    </p>
                                </div>
                            </div>

                        </div>

                    </section>

                </div>
            </div>
        );
    }

    /* =====================================================
       RESULT SCREEN
       ===================================================== */

    if (screen === "result") {
        return (
            <div className="interview-page">

                <div className="interview-container">

                    <div className="result-card">

                        <div className="result-icon">
                            🏆
                        </div>

                        <span className="eyebrow">
                            INTERVIEW COMPLETE
                        </span>

                        <h1>
                            Interview complete.
                        </h1>

                        <p className="result-description">
                            Here is your performance
                            summary for the{" "}
                            <strong>
                                {selectedRole}
                            </strong>{" "}
                            interview.
                        </p>

                        <div className="score-circle">

                            <strong>
                                {finalScore}
                            </strong>

                            <span>
                                / 100
                            </span>

                        </div>

                        <div className="result-grid">

                            <div>
                                <span>
                                    ROLE
                                </span>

                                <strong>
                                    {selectedRole}
                                </strong>
                            </div>

                            <div>
                                <span>
                                    QUESTIONS
                                </span>

                                <strong>
                                    {
                                        questions.length
                                    }
                                </strong>
                            </div>

                            <div>
                                <span>
                                    DIFFICULTY
                                </span>

                                <strong>
                                    {difficulty}
                                </strong>
                            </div>

                            <div>
                                <span>
                                    COMPLETED
                                </span>

                                <strong>
                                    {
                                        completedCount
                                    }
                                    /
                                    {
                                        questions.length
                                    }
                                </strong>
                            </div>

                        </div>

                        <div
                            className="ai-status-card"
                            style={{
                                marginTop: "20px",
                            }}
                        >
                            <span className="status-dot" />

                            <div>
                                <strong>
                                    AI-assisted evaluation
                                </strong>

                                <p>
                                    Scores are generated
                                    using the configured
                                    evaluation rubric and
                                    local AI model. They
                                    should be used as
                                    practice feedback, not
                                    as a scientific
                                    measurement.
                                </p>
                            </div>
                        </div>

                        <div className="result-actions">

                            <button
                                type="button"
                                className="secondary-button"
                                onClick={
                                    restartInterview
                                }
                            >
                                New Interview
                            </button>

                            <button
                                type="button"
                                className="primary-button"
                                onClick={
                                    reviewInterview
                                }
                            >
                                Review Answers →
                            </button>

                        </div>

                    </div>

                </div>

            </div>
        );
    }

    /* =====================================================
       INTERVIEW SCREEN
       ===================================================== */

    return (
        <div className="interview-page">

            <div className="interview-container">

                {/* HEADER */}

                <div className="active-header">

                    <div>

                        <span className="eyebrow">
                            AI INTERVIEW
                        </span>

                        <h1>
                            {getRoleIcon(
                                selectedRole
                            )}{" "}
                            {selectedRole}
                        </h1>

                    </div>

                    <div className="interview-header-actions">

                        <div
                            className={`timer ${
                                secondsLeft <
                                60
                                    ? "danger"
                                    : ""
                            }`}
                        >
                            <span>
                                ⏱
                            </span>

                            {
                                formattedTime
                            }
                        </div>

                        <button
                            type="button"
                            className="exit-button"
                            onClick={() =>
                                setScreen(
                                    "setup"
                                )
                            }
                        >
                            Exit
                        </button>

                    </div>

                </div>

                {/* PROGRESS */}

                <div className="interview-progress">

                    <div className="progress-top">

                        <span>
                            Question{" "}
                            {currentIndex + 1}{" "}
                            of{" "}
                            {
                                questions.length
                            }
                        </span>

                        <strong>
                            {Math.round(
                                ((currentIndex +
                                    1) /
                                    questions.length) *
                                    100
                            )}
                            %
                        </strong>

                    </div>

                    <div className="progress-track">

                        <div
                            className="progress-fill"
                            style={{
                                width: `${
                                    ((currentIndex +
                                        1) /
                                        questions.length) *
                                    100
                                }%`,
                            }}
                        />

                    </div>

                </div>

                <div className="interview-layout">

                    {/* QUESTION */}

                    <main className="question-card">

                        {currentQuestion && (
                            <>

                                <div className="question-meta">

                                    <span className="question-number">
                                        {String(
                                            currentIndex +
                                                1
                                        ).padStart(
                                            2,
                                            "0"
                                        )}
                                    </span>

                                    <span className="question-category">
                                        {
                                            currentQuestion.category
                                        }
                                    </span>

                                    <span className="question-difficulty">
                                        {
                                            currentQuestion.difficulty
                                        }
                                    </span>

                                </div>

                                <div className="topic-label">
                                    {
                                        currentQuestion.topic
                                    }
                                </div>

                                <h2>
                                    {
                                        currentQuestion.question
                                    }
                                </h2>

                                <p className="question-help">
                                    Explain your
                                    reasoning clearly.
                                    Use examples
                                    where possible.
                                </p>

                                {/* HINT */}

                                {showHint && (
                                    <div className="hint-box">

                                        <span>
                                            💡
                                        </span>

                                        <div>

                                            <strong>
                                                Interview
                                                hint
                                            </strong>

                                            <p>
                                                {
                                                    currentQuestion.hint
                                                }
                                            </p>

                                        </div>

                                    </div>
                                )}

                                {/* ANSWER */}

                                <textarea
                                    value={
                                        answer
                                    }
                                    onChange={(
                                        event
                                    ) => {
                                        setAnswer(
                                            event
                                                .target
                                                .value
                                        );

                                        if (
                                            evaluationError
                                        ) {
                                            setEvaluationError(
                                                ""
                                            );
                                        }
                                    }}
                                    placeholder="Type your answer here..."
                                    maxLength={
                                        10000
                                    }
                                    disabled={
                                        Boolean(
                                            feedback
                                        ) ||
                                        evaluating
                                    }
                                />

                                <div className="answer-footer">

                                    <span>
                                        {
                                            answer.length
                                        }{" "}
                                        / 10000
                                        characters
                                    </span>

                                    <div className="answer-actions">

                                        <button
                                            type="button"
                                            className="hint-button"
                                            onClick={() =>
                                                setShowHint(
                                                    (
                                                        previous
                                                    ) =>
                                                        !previous
                                                )
                                            }
                                            disabled={
                                                evaluating
                                            }
                                        >
                                            💡{" "}
                                            {showHint
                                                ? "Hide Hint"
                                                : "Get Hint"}
                                        </button>

                                        {!feedback ? (
                                            <button
                                                type="button"
                                                className="primary-button"
                                                onClick={() =>
                                                    handleSubmit(
                                                        false
                                                    )
                                                }
                                                disabled={
                                                    evaluating ||
                                                    !answer.trim()
                                                }
                                            >
                                                {evaluating
                                                    ? "AI is evaluating..."
                                                    : "Submit Answer →"}
                                            </button>
                                        ) : (
                                            <>
                                                <button
                                                    type="button"
                                                    className="secondary-button"
                                                    onClick={
                                                        editCurrentAnswer
                                                    }
                                                    disabled={
                                                        evaluating
                                                    }
                                                >
                                                    Edit Answer
                                                </button>

                                                <button
                                                    type="button"
                                                    className="primary-button"
                                                    onClick={
                                                        goToNextQuestion
                                                    }
                                                >
                                                    {currentIndex ===
                                                    questions.length -
                                                        1
                                                        ? "Finish Interview"
                                                        : "Next Question →"}
                                                </button>
                                            </>
                                        )}

                                    </div>

                                </div>

                                {/* ERROR */}

                                {evaluationError && (
                                    <div
                                        className="hint-box"
                                        style={{
                                            marginTop:
                                                "16px",
                                            borderColor:
                                                "#ef4444",
                                        }}
                                    >

                                        <span>
                                            ⚠️
                                        </span>

                                        <div>

                                            <strong>
                                                Evaluation
                                                Error
                                            </strong>

                                            <p>
                                                {
                                                    evaluationError
                                                }
                                            </p>

                                            <button
                                                type="button"
                                                className="hint-button"
                                                onClick={() =>
                                                    handleSubmit(
                                                        false
                                                    )
                                                }
                                                disabled={
                                                    evaluating ||
                                                    !answer.trim()
                                                }
                                            >
                                                {evaluating
                                                    ? "Retrying..."
                                                    : "Try Again"}
                                            </button>

                                        </div>

                                    </div>
                                )}

                                {/* AI FEEDBACK */}

                                {feedback && (
                                    <div className="feedback-panel">

                                        <div className="feedback-panel-header">

                                            <div>

                                                <span className="eyebrow">
                                                    AI FEEDBACK
                                                </span>

                                                <h3>
                                                    {
                                                        feedback.verdict
                                                    }
                                                </h3>

                                            </div>

                                            <div className="feedback-score">
                                                {
                                                    feedback.score
                                                }
                                            </div>

                                        </div>

                                        {/* EXPLANATION */}

                                        {feedback.explanation && (
                                            <div
                                                className="learning-recommendation"
                                                style={{
                                                    marginBottom:
                                                        "20px",
                                                }}
                                            >
                                                <strong>
                                                    Evaluation
                                                </strong>

                                                <p>
                                                    {
                                                        feedback.explanation
                                                    }
                                                </p>
                                            </div>
                                        )}

                                        {/* DIMENSIONS */}

                                        <div className="feedback-dimensions">

                                            {[
                                                [
                                                    "Accuracy",
                                                    feedback
                                                        .dimensions
                                                        ?.accuracy,
                                                ],
                                                [
                                                    "Relevance",
                                                    feedback
                                                        .dimensions
                                                        ?.relevance,
                                                ],
                                                [
                                                    "Completeness",
                                                    feedback
                                                        .dimensions
                                                        ?.completeness,
                                                ],
                                                [
                                                    "Technical Depth",
                                                    feedback
                                                        .dimensions
                                                        ?.technicalDepth,
                                                ],
                                                [
                                                    "Clarity",
                                                    feedback
                                                        .dimensions
                                                        ?.clarity,
                                                ],
                                            ].map(
                                                (
                                                    [
                                                        label,
                                                        value,
                                                    ]
                                                ) => (
                                                    <div
                                                        key={
                                                            label
                                                        }
                                                        className="dimension-card"
                                                    >
                                                        <span>
                                                            {
                                                                label
                                                            }
                                                        </span>

                                                        <strong>
                                                            {
                                                                value ??
                                                                    0
                                                            }
                                                            /5
                                                        </strong>
                                                    </div>
                                                )
                                            )}

                                        </div>

                                        {/* STRENGTHS */}

                                        {feedback
                                            .strengths
                                            ?.length >
                                            0 && (
                                            <div className="feedback-section">

                                                <h4>
                                                    Strengths
                                                </h4>

                                                <ul>
                                                    {feedback.strengths.map(
                                                        (
                                                            item,
                                                            index
                                                        ) => (
                                                            <li
                                                                key={`${item}-${index}`}
                                                            >
                                                                <span>
                                                                    ✓
                                                                </span>

                                                                {
                                                                    item
                                                                }
                                                            </li>
                                                        )
                                                    )}
                                                </ul>

                                            </div>
                                        )}

                                        {/* WEAKNESSES */}

                                        {feedback
                                            .weaknesses
                                            ?.length >
                                            0 && (
                                            <div className="feedback-section">

                                                <h4>
                                                    Areas to
                                                    improve
                                                </h4>

                                                <ul>
                                                    {feedback.weaknesses.map(
                                                        (
                                                            item,
                                                            index
                                                        ) => (
                                                            <li
                                                                key={`${item}-${index}`}
                                                            >
                                                                <span>
                                                                    !
                                                                </span>

                                                                {
                                                                    item
                                                                }
                                                            </li>
                                                        )
                                                    )}
                                                </ul>

                                            </div>
                                        )}

                                        {/* MISSING */}

                                        {feedback
                                            .missingConcepts
                                            ?.length >
                                            0 && (
                                            <div className="feedback-section">

                                                <h4>
                                                    Missing
                                                    concepts
                                                </h4>

                                                <div className="skill-tags">

                                                    {feedback.missingConcepts.map(
                                                        (
                                                            item,
                                                            index
                                                        ) => (
                                                            <span
                                                                key={`${item}-${index}`}
                                                            >
                                                                {
                                                                    item
                                                                }
                                                            </span>
                                                        )
                                                    )}

                                                </div>

                                            </div>
                                        )}

                                        {/* INCORRECT CLAIMS */}

                                        {feedback
                                            .incorrectClaims
                                            ?.length >
                                            0 && (
                                            <div className="feedback-section">

                                                <h4>
                                                    Incorrect
                                                    claims
                                                </h4>

                                                <ul>
                                                    {feedback.incorrectClaims.map(
                                                        (
                                                            item,
                                                            index
                                                        ) => (
                                                            <li
                                                                key={`${item}-${index}`}
                                                            >
                                                                <span>
                                                                    ×
                                                                </span>

                                                                {
                                                                    item
                                                                }
                                                            </li>
                                                        )
                                                    )}
                                                </ul>

                                            </div>
                                        )}

                                        {/* IMPROVEMENT */}

                                        {feedback.improvementAdvice && (
                                            <div className="learning-recommendation">

                                                <strong>
                                                    How to
                                                    improve
                                                </strong>

                                                <p>
                                                    {
                                                        feedback.improvementAdvice
                                                    }
                                                </p>

                                            </div>
                                        )}

                                        {/* IDEAL ANSWER */}

                                        {feedback.idealAnswer && (
                                            <div className="ideal-answer">

                                                <div className="ideal-answer-header">

                                                    <span>
                                                        💡
                                                    </span>

                                                    <strong>
                                                        Example
                                                        of a
                                                        stronger
                                                        answer
                                                    </strong>

                                                </div>

                                                <p>
                                                    {
                                                        feedback.idealAnswer
                                                    }
                                                </p>

                                            </div>
                                        )}

                                        {/* LEARNING */}

                                        {feedback.learning && (
                                            <div className="learning-recommendation">

                                                <strong>
                                                    Suggested
                                                    learning
                                                </strong>

                                                <p>
                                                    Focus on{" "}
                                                    <strong>
                                                        {
                                                            feedback.learning
                                                        }
                                                    </strong>{" "}
                                                    before
                                                    attempting
                                                    similar
                                                    interview
                                                    questions.
                                                </p>

                                            </div>
                                        )}

                                    </div>
                                )}

                            </>
                        )}

                    </main>

                    {/* SIDEBAR */}

                    <aside className="interview-sidebar">

                        <div className="sidebar-card">

                            <div className="sidebar-heading">

                                <div>
                                    <span className="eyebrow">
                                        QUESTIONS
                                    </span>

                                    <h3>
                                        Interview map
                                    </h3>
                                </div>

                                <span>
                                    {
                                        completedCount
                                    }
                                    /
                                    {
                                        questions.length
                                    }
                                </span>

                            </div>

                            <div className="question-map">

                                {questions.map(
                                    (
                                        item,
                                        index
                                    ) => {
                                        const completed =
                                            Boolean(
                                                submittedAnswers[
                                                    index
                                                ]
                                            );

                                        const active =
                                            index ===
                                            currentIndex;

                                        return (
                                            <button
                                                type="button"
                                                key={`${item.topic}-${index}`}
                                                className={`map-item ${
                                                    active
                                                        ? "active"
                                                        : ""
                                                } ${
                                                    completed
                                                        ? "completed"
                                                        : ""
                                                }`}
                                                onClick={() =>
                                                    loadQuestion(
                                                        index
                                                    )
                                                }
                                            >

                                                <span>
                                                    {String(
                                                        index +
                                                            1
                                                    ).padStart(
                                                        2,
                                                        "0"
                                                    )}
                                                </span>

                                                <div>
                                                    <strong>
                                                        {
                                                            item.topic
                                                        }
                                                    </strong>

                                                    <small>
                                                        {
                                                            item.category
                                                        }
                                                    </small>
                                                </div>

                                                {completed && (
                                                    <b>
                                                        ✓
                                                    </b>
                                                )}

                                            </button>
                                        );
                                    }
                                )}

                            </div>

                        </div>

                        {/* AI STATUS */}

                        <div className="ai-status-card">

                            <span className="status-dot" />

                            <div>

                                <strong>
                                    Local AI evaluator
                                </strong>

                                <p>
                                    Qwen3 evaluates
                                    your answer
                                    against the
                                    question-specific
                                    concepts and
                                    rubric.
                                </p>

                            </div>

                        </div>

                    </aside>

                </div>

                {/* BOTTOM NAV */}

                <div className="interview-bottom-nav">

                    <button
                        type="button"
                        className="secondary-button"
                        onClick={
                            goToPreviousQuestion
                        }
                        disabled={
                            currentIndex === 0
                        }
                    >
                        ← Previous
                    </button>

                    <span>
                        {
                            currentIndex + 1
                        }{" "}
                        /{" "}
                        {
                            questions.length
                        }
                    </span>

                    {feedback && (
                        <button
                            type="button"
                            className="primary-button"
                            onClick={
                                goToNextQuestion
                            }
                        >
                            {currentIndex ===
                            questions.length - 1
                                ? "Finish Interview"
                                : "Next →"}
                        </button>
                    )}

                </div>

            </div>

        </div>
    );
};

export default function InterviewDesktopCanvas() {
    return (
        <div className="interview-desktop-scroll" role="region" aria-label="Interview page. Scroll horizontally to view all content on narrow screens." tabIndex={0}>
            <div className="interview-desktop-canvas">
                <Interview />
            </div>
        </div>
    );
}
