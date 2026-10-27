// ============================================================
// CAREER ROADMAP DATA
// ============================================================

const resourceDescriptions = {
    "MDN Web Docs": "Browser and web-platform reference material for the foundations used in this phase.",
    "HTTP MDN Guide": "Learn HTTP methods, headers, messages, and how browser clients communicate with servers.",
    "How the Web Works": "An introductory walkthrough of what happens between entering a URL and viewing a page.",
    "MDN HTML": "Reference for semantic elements, forms, document structure, and accessible markup.",
    "MDN CSS": "Reference for styling, layout, selectors, and responsive presentation.",
    "MDN Flexbox": "A focused guide to one-dimensional CSS layout and alignment.",
    "MDN CSS Grid": "A focused guide to two-dimensional CSS layout with rows and columns.",
    "Tailwind CSS": "Utility-class documentation for composing responsive interface styles.",
    "MDN JavaScript": "JavaScript language reference for syntax, built-ins, and browser APIs.",
    "JavaScript Guide": "A structured guide to JavaScript language concepts and common patterns.",
    "JavaScript.info": "A progressive JavaScript tutorial with explanations and practical examples.",
    "React Documentation": "Official React reference for building component-based user interfaces.",
    "React Learn": "Guided lessons covering components, state, events, and common React workflows.",
    "React Router": "Routing documentation for navigation and nested views in React applications.",
    "Node.js Documentation": "Official reference for Node.js runtime APIs and server-side JavaScript.",
    "Express.js Documentation": "Official Express guides and API reference for web servers and middleware.",
    "Express Documentation": "Official Express guides and API reference for web servers and middleware.",
    "npm Documentation": "Reference for package installation, scripts, publishing, and dependency management.",
    "MongoDB Documentation": "Official MongoDB reference for data modeling, queries, and database operations.",
    "Mongoose Documentation": "Mongoose guides for schemas, validation, models, and MongoDB queries.",
    "PostgreSQL Documentation": "Official PostgreSQL manual for SQL, data types, and database features.",
    "OWASP": "Security guidance and community-maintained resources for safer application development.",
    "OWASP Top 10": "The OWASP overview of major web application security risk categories.",
    "MDN Web Security": "Browser-focused security guidance covering web platform protections and risks.",
    "Jest Documentation": "Jest setup and reference material for JavaScript unit and integration tests.",
    "Vitest Documentation": "Vitest guides for fast unit testing in modern JavaScript projects.",
    "Postman Learning Center": "Guides for sending requests, organizing collections, and testing APIs.",
    "Git Documentation": "Official Git reference and book for version control workflows.",
    "Docker Documentation": "Official documentation for building, running, and managing containers.",
    "GitHub Actions": "Official workflow documentation for automating build and deployment tasks.",
    "System Design Primer": "An open study guide covering common system design concepts and trade-offs.",
    "GitHub": "A platform reference for hosting repositories and collaborating on project code.",
    "MDN": "Web platform reference material for frontend implementation and browser behavior.",
    "LeetCode": "A coding-practice platform for solving algorithm and interview-style problems.",
    "NeetCode": "Structured algorithm practice and explanations organized around common patterns.",
    "LinkedIn": "A professional profile and networking platform useful during job preparation.",
    "Python Documentation": "Official Python language tutorial and library reference.",
    "NumPy Documentation": "NumPy reference for arrays, numerical operations, and scientific computing.",
    "Pandas Documentation": "Pandas guides and reference for tabular data cleaning and analysis.",
    "scikit-learn Documentation": "Guides and API reference for classical machine-learning workflows.",
    "PyTorch Documentation": "Official PyTorch tutorials and reference for tensor and neural-network work.",
    "TensorFlow Documentation": "TensorFlow tutorials and reference for machine-learning model development.",
    "Hugging Face": "Model, dataset, and library documentation for the open machine-learning ecosystem.",
    "OpenAI API Documentation": "API reference and guides for building applications with OpenAI models.",
    "Pinecone Learn": "Vector-search learning material covering retrieval and semantic search concepts.",
    "Hugging Face Agents": "Documentation for building tool-using agents with the smolagents library.",
    "LangChain Documentation": "Framework documentation for composing model, retrieval, and tool workflows.",
    "FastAPI Documentation": "Official guides and reference for building Python APIs with FastAPI."
};

const resource = (title, type, url = "") => {
    let provider = "Provider unavailable";
    try {
        provider = new URL(url).hostname.replace(/^www\./, "");
    } catch {
        // Invalid or missing URLs remain display-only and are never linked.
    }

    const normalizedType = String(type).toLowerCase();
    const resourceType = normalizedType.includes("practice")
        ? "Practice"
        : normalizedType.includes("reference") || normalizedType.includes("platform") || normalizedType === "security"
        ? "Reference"
        : normalizedType.includes("guide") || normalizedType.includes("course")
        ? "Tutorials"
        : "Official Documentation";

    return {
        title,
        provider,
        description: resourceDescriptions[title] || `Phase-relevant learning material from ${provider}.`,
        type: resourceType,
        url,
    };
};

const practice = (title, difficulty = "Easy") => ({
    id: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    title,
    difficulty
});


// ============================================================
// FULL STACK DEVELOPER
// ============================================================

const FULL_STACK_PHASES = [

    {
        title: "Web Fundamentals",
        icon: "🌐",
        description: "Understand how the web and internet work.",

        topics: [
            "How the Internet Works",
            "Client vs Server",
            "HTTP & HTTPS",
            "DNS",
            "Browsers & Rendering",
            "REST APIs",
            "JSON",
            "Web Security Basics",
        ],

        resources: [
            resource(
                "MDN Web Docs",
                "Documentation",
                "https://developer.mozilla.org/"
            ),
            resource(
                "HTTP MDN Guide",
                "Documentation",
                "https://developer.mozilla.org/en-US/docs/Web/HTTP"
            ),
            resource(
                "How the Web Works",
                "Guide",
                "https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/How_the_Web_works"
            ),
        ],

        practice: [
            practice("Explain client vs server", "Easy"),
            practice("Explain HTTP request and response", "Easy"),
            practice("Explain DNS with an example", "Easy"),
            practice("Create a simple REST API request", "Easy"),
            practice("Inspect requests using browser DevTools", "Medium"),
        ],
    },


    {
        title: "HTML & CSS",
        icon: "🎨",
        description: "Build structured and responsive web interfaces.",

        topics: [
            "HTML Fundamentals",
            "Semantic HTML",
            "Forms",
            "CSS Fundamentals",
            "Box Model",
            "Flexbox",
            "CSS Grid",
            "Responsive Design",
            "Animations",
            "Tailwind CSS",
        ],

        resources: [
            resource(
                "MDN HTML",
                "Documentation",
                "https://developer.mozilla.org/en-US/docs/Web/HTML"
            ),
            resource(
                "MDN CSS",
                "Documentation",
                "https://developer.mozilla.org/en-US/docs/Web/CSS"
            ),
            resource(
                "MDN Flexbox",
                "Documentation",
                "https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Flexbox"
            ),
            resource(
                "MDN CSS Grid",
                "Documentation",
                "https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Grids"
            ),
            resource(
                "Tailwind CSS",
                "Documentation",
                "https://tailwindcss.com/docs"
            ),
        ],

        practice: [
            practice("Create a semantic HTML page", "Easy"),
            practice("Build a registration form", "Easy"),
            practice("Create a Flexbox layout", "Easy"),
            practice("Create a CSS Grid dashboard", "Medium"),
            practice("Build a responsive landing page", "Medium"),
            practice("Build a responsive portfolio", "Medium"),
            practice("Recreate a modern website UI", "Hard"),
        ],
    },


    {
        title: "JavaScript",
        icon: "🟨",
        description:
            "Master modern JavaScript and asynchronous programming.",

        topics: [
            "Variables & Data Types",
            "Conditions",
            "Loops",
            "Functions",
            "Arrays",
            "Objects",
            "DOM",
            "Events",
            "ES6+",
            "Promises",
            "Async/Await",
            "Fetch API",
            "Modules",
            "Error Handling",
            "Local Storage",
        ],

        resources: [
            resource(
                "MDN JavaScript",
                "Documentation",
                "https://developer.mozilla.org/en-US/docs/Web/JavaScript"
            ),
            resource(
                "JavaScript Guide",
                "Guide",
                "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide"
            ),
            resource(
                "JavaScript.info",
                "Guide",
                "https://javascript.info/"
            ),
        ],

        practice: [
            practice("Build a calculator", "Easy"),
            practice("Build a number guessing game", "Easy"),
            practice("Practice array methods", "Easy"),
            practice("Build a Todo application", "Medium"),
            practice("Consume a public REST API", "Medium"),
            practice("Build a weather application", "Medium"),
            practice("Build an async JavaScript project", "Hard"),
        ],
    },


    {
        title: "React.js",
        icon: "⚛️",
        description:
            "Build modern interactive frontend applications.",

        topics: [
            "React Fundamentals",
            "Components",
            "Props",
            "State",
            "Events",
            "Hooks",
            "useEffect",
            "Context API",
            "React Router",
            "Forms",
            "API Integration",
            "Authentication",
        ],

        resources: [
            resource(
                "React Documentation",
                "Documentation",
                "https://react.dev/"
            ),
            resource(
                "React Learn",
                "Course",
                "https://react.dev/learn"
            ),
            resource(
                "React Router",
                "Documentation",
                "https://reactrouter.com/"
            ),
        ],

        practice: [
            practice("Build reusable React components", "Easy"),
            practice("Create a counter using state", "Easy"),
            practice("Build a Todo app with React", "Easy"),
            practice("Build a React dashboard", "Medium"),
            practice("Connect React to a REST API", "Medium"),
            practice("Implement React authentication", "Medium"),
            practice("Build a production-style React project", "Hard"),
        ],
    },


    {
        title: "Backend Development",
        icon: "🟢",
        description:
            "Build scalable APIs and server-side applications.",

        topics: [
            "Node.js",
            "NPM",
            "Express.js",
            "Routing",
            "Middleware",
            "REST APIs",
            "Controllers",
            "Services",
            "Validation",
            "Error Handling",
            "File Uploads",
            "Authentication",
            "Authorization",
            "JWT",
        ],

        resources: [
            resource(
                "Node.js Documentation",
                "Documentation",
                "https://nodejs.org/docs/latest/api/"
            ),
            resource(
                "Express.js Documentation",
                "Documentation",
                "https://expressjs.com/"
            ),
            resource(
                "npm Documentation",
                "Documentation",
                "https://docs.npmjs.com/"
            ),
        ],

        practice: [
            practice("Create a Node.js server", "Easy"),
            practice("Create an Express API", "Easy"),
            practice("Build CRUD routes", "Medium"),
            practice("Create custom middleware", "Medium"),
            practice("Build JWT authentication", "Medium"),
            practice("Build a file upload API", "Medium"),
            practice("Build a production-ready REST API", "Hard"),
        ],
    },


    {
        title: "Databases",
        icon: "🗄️",
        description:
            "Learn database design and data management.",

        topics: [
            "Database Fundamentals",
            "MongoDB",
            "Mongoose",
            "CRUD Operations",
            "Schema Design",
            "Relationships",
            "Indexes",
            "Aggregation",
            "SQL Fundamentals",
            "PostgreSQL",
            "Transactions",
            "Database Security",
        ],

        resources: [
            resource(
                "MongoDB Documentation",
                "Documentation",
                "https://www.mongodb.com/docs/"
            ),
            resource(
                "Mongoose Documentation",
                "Documentation",
                "https://mongoosejs.com/docs/"
            ),
            resource(
                "PostgreSQL Documentation",
                "Documentation",
                "https://www.postgresql.org/docs/"
            ),
        ],

        practice: [
            practice("Create a MongoDB database", "Easy"),
            practice("Perform MongoDB CRUD", "Easy"),
            practice("Create Mongoose schemas", "Medium"),
            practice("Design related collections", "Medium"),
            practice("Write aggregation queries", "Medium"),
            practice("Build a PostgreSQL CRUD application", "Hard"),
        ],
    },


    {
        title: "Authentication & Security",
        icon: "🔐",
        description:
            "Secure applications and protect user data.",

        topics: [
            "Password Hashing",
            "JWT",
            "Sessions",
            "Cookies",
            "CORS",
            "CSRF",
            "XSS",
            "SQL Injection",
            "Rate Limiting",
            "Input Validation",
        ],

        resources: [
            resource(
                "OWASP",
                "Security Guide",
                "https://owasp.org/"
            ),
            resource(
                "OWASP Top 10",
                "Security Guide",
                "https://owasp.org/www-project-top-ten/"
            ),
            resource(
                "MDN Web Security",
                "Documentation",
                "https://developer.mozilla.org/en-US/docs/Web/Security"
            ),
        ],

        practice: [
            practice("Hash passwords securely", "Easy"),
            practice("Implement JWT authentication", "Medium"),
            practice("Implement protected routes", "Medium"),
            practice("Configure CORS securely", "Medium"),
            practice("Add rate limiting", "Medium"),
            practice("Audit an API for common vulnerabilities", "Hard"),
        ],
    },


    {
        title: "Testing",
        icon: "🧪",
        description:
            "Learn how to test frontend, backend and APIs.",

        topics: [
            "Testing Fundamentals",
            "Unit Testing",
            "Integration Testing",
            "API Testing",
            "Jest",
            "Vitest",
            "React Testing",
            "Postman",
        ],

        resources: [
            resource(
                "Jest Documentation",
                "Documentation",
                "https://jestjs.io/docs/getting-started"
            ),
            resource(
                "Vitest Documentation",
                "Documentation",
                "https://vitest.dev/"
            ),
            resource(
                "Postman Learning Center",
                "Guide",
                "https://learning.postman.com/"
            ),
        ],

        practice: [
            practice("Write your first unit test", "Easy"),
            practice("Test an Express API", "Easy"),
            practice("Create Postman API tests", "Medium"),
            practice("Write integration tests", "Medium"),
            practice("Test React components", "Medium"),
        ],
    },


    {
        title: "DevOps & Deployment",
        icon: "🚀",
        description:
            "Deploy and maintain production applications.",

        topics: [
            "Linux",
            "Environment Variables",
            "Git",
            "GitHub",
            "Docker",
            "Docker Compose",
            "CI/CD",
            "GitHub Actions",
            "Cloud Basics",
            "Deployment",
            "Monitoring",
        ],

        resources: [
            resource(
                "Git Documentation",
                "Documentation",
                "https://git-scm.com/doc"
            ),
            resource(
                "Docker Documentation",
                "Documentation",
                "https://docs.docker.com/"
            ),
            resource(
                "GitHub Actions",
                "Documentation",
                "https://docs.github.com/en/actions"
            ),
        ],

        practice: [
            practice("Create a Git repository", "Easy"),
            practice("Create a Dockerfile", "Easy"),
            practice("Dockerize an Express API", "Medium"),
            practice("Create a Docker Compose setup", "Medium"),
            practice("Create a GitHub Actions workflow", "Medium"),
            practice("Deploy a full stack application", "Hard"),
        ],
    },


    {
        title: "Web Security",
        icon: "🛡️",
        description:
            "Understand common web vulnerabilities and protection.",

        topics: [
            "OWASP Basics",
            "HTTPS",
            "CORS",
            "XSS",
            "CSRF",
            "Injection Attacks",
            "Authentication Security",
            "Authorization",
            "Secrets Management",
        ],

        resources: [
            resource(
                "OWASP",
                "Security",
                "https://owasp.org/"
            ),
            resource(
                "OWASP Top 10",
                "Security",
                "https://owasp.org/www-project-top-ten/"
            ),
        ],

        practice: [
            practice("Identify an XSS vulnerability", "Easy"),
            practice("Secure an API against injection", "Medium"),
            practice("Configure security headers", "Medium"),
            practice("Implement secure authentication", "Medium"),
            practice("Perform a basic application security audit", "Hard"),
        ],
    },


    {
        title: "System Design",
        icon: "🏗️",
        description:
            "Understand how large-scale applications are designed.",

        topics: [
            "System Design Basics",
            "Scalability",
            "Load Balancing",
            "Caching",
            "CDN",
            "Queues",
            "Database Scaling",
            "Microservices",
            "API Gateway",
            "Architecture Patterns",
        ],

        resources: [
            resource(
                "System Design Primer",
                "Guide",
                "https://github.com/donnemartin/system-design-primer"
            ),
        ],

        practice: [
            practice("Design a URL shortener", "Easy"),
            practice("Design a notification system", "Medium"),
            practice("Design a chat application", "Medium"),
            practice("Design an e-commerce system", "Hard"),
            practice("Design a scalable social platform", "Hard"),
        ],
    },


    {
        title: "Real-World Projects",
        icon: "💻",
        description:
            "Turn your knowledge into portfolio projects.",

        topics: [
            "Todo Application",
            "Blog Application",
            "Weather Application",
            "Chat Application",
            "E-Commerce API",
            "E-Commerce Application",
            "Social Media Application",
            "Real-Time Application",
            "Production Full Stack Project",
        ],

        resources: [
            resource(
                "GitHub",
                "Platform",
                "https://github.com/"
            ),
            resource(
                "MDN",
                "Documentation",
                "https://developer.mozilla.org/"
            ),
        ],

        practice: [
            practice("Build a Todo application", "Easy"),
            practice("Build a Blog application", "Easy"),
            practice("Build a Chat application", "Medium"),
            practice("Build an E-Commerce API", "Medium"),
            practice("Build an E-Commerce application", "Hard"),
            practice("Build a production full stack project", "Hard"),
        ],
    },


    {
        title: "DSA",
        icon: "🧠",
        description:
            "Build problem-solving skills for technical interviews.",

        topics: [
            "Arrays",
            "Strings",
            "Hash Maps",
            "Linked Lists",
            "Stacks",
            "Queues",
            "Recursion",
            "Trees",
            "Binary Search",
            "Heaps",
            "Graphs",
            "Dynamic Programming",
            "Greedy Algorithms",
        ],

        resources: [
            resource(
                "LeetCode",
                "Practice",
                "https://leetcode.com/"
            ),
            resource(
                "NeetCode",
                "Practice",
                "https://neetcode.io/"
            ),
        ],

        practice: [
            practice("Solve array problems", "Easy"),
            practice("Solve string problems", "Easy"),
            practice("Solve linked list problems", "Medium"),
            practice("Solve tree problems", "Medium"),
            practice("Solve graph problems", "Hard"),
            practice("Solve dynamic programming problems", "Hard"),
        ],
    },


    {
        title: "Interview Preparation",
        icon: "🎯",
        description:
            "Prepare for technical and behavioral interviews.",

        topics: [
            "JavaScript Interview",
            "React Interview",
            "Node.js Interview",
            "Database Interview",
            "API Interview",
            "System Design Interview",
            "DSA Interview",
            "Project Explanation",
            "HR Questions",
            "Mock Interviews",
        ],

        resources: [
            resource(
                "LeetCode",
                "Practice",
                "https://leetcode.com/"
            ),
            resource(
                "MDN",
                "Reference",
                "https://developer.mozilla.org/"
            ),
        ],

        practice: [
            practice("Explain your main project", "Easy"),
            practice("Answer JavaScript questions", "Medium"),
            practice("Answer React questions", "Medium"),
            practice("Answer Node.js questions", "Medium"),
            practice("Solve a DSA interview problem", "Medium"),
            practice("Complete a mock interview", "Hard"),
        ],
    },


    {
        title: "Job Preparation",
        icon: "💼",
        description:
            "Prepare your profile and start applying.",

        topics: [
            "Resume",
            "GitHub Profile",
            "Portfolio",
            "LinkedIn Profile",
            "Project Documentation",
            "Job Search",
            "Job Applications",
            "Networking",
            "Technical Screening",
            "Offer Preparation",
        ],

        resources: [
            resource(
                "GitHub",
                "Platform",
                "https://github.com/"
            ),
            resource(
                "LinkedIn",
                "Platform",
                "https://www.linkedin.com/"
            ),
        ],

        practice: [
            practice("Create a developer resume", "Easy"),
            practice("Improve your GitHub profile", "Easy"),
            practice("Create a portfolio", "Medium"),
            practice("Document your projects", "Medium"),
            practice("Practice technical screening", "Medium"),
            practice("Prepare for behavioral interviews", "Medium"),
        ],
    },
];


// ============================================================
// FRONTEND DEVELOPER
// ============================================================

const FRONTEND_PHASES = [

    {
        title: "Web Fundamentals",
        icon: "🌐",
        description: "Understand how the web works.",

        topics: [
            "Internet",
            "HTTP",
            "DNS",
            "Client vs Server",
            "Browser",
        ],

        resources: [
            resource(
                "MDN Web Docs",
                "Documentation",
                "https://developer.mozilla.org/"
            ),
            resource(
                "How the Web Works",
                "Guide",
                "https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/How_the_Web_works"
            ),
        ],

        practice: [
            practice("Explain how a browser loads a page", "Easy"),
            practice("Explain HTTP", "Easy"),
            practice("Explain DNS", "Easy"),
        ],
    },


    {
        title: "HTML & CSS",
        icon: "🎨",
        description: "Build responsive web interfaces.",

        topics: [
            "HTML",
            "Semantic HTML",
            "Forms",
            "CSS",
            "Flexbox",
            "Grid",
            "Responsive Design",
            "Tailwind CSS",
        ],

        resources: [
            resource(
                "MDN HTML",
                "Documentation",
                "https://developer.mozilla.org/en-US/docs/Web/HTML"
            ),
            resource(
                "MDN CSS",
                "Documentation",
                "https://developer.mozilla.org/en-US/docs/Web/CSS"
            ),
            resource(
                "Tailwind CSS",
                "Documentation",
                "https://tailwindcss.com/docs"
            ),
        ],

        practice: [
            practice("Build a semantic webpage", "Easy"),
            practice("Build a responsive landing page", "Medium"),
            practice("Build a dashboard using Grid", "Medium"),
            practice("Recreate a website UI", "Hard"),
        ],
    },


    {
        title: "JavaScript",
        icon: "🟨",
        description: "Master JavaScript for frontend development.",

        topics: [
            "JavaScript Fundamentals",
            "Arrays",
            "Objects",
            "DOM",
            "Events",
            "ES6",
            "Promises",
            "Async/Await",
            "APIs",
        ],

        resources: [
            resource(
                "MDN JavaScript",
                "Documentation",
                "https://developer.mozilla.org/en-US/docs/Web/JavaScript"
            ),
            resource(
                "JavaScript.info",
                "Guide",
                "https://javascript.info/"
            ),
        ],

        practice: [
            practice("Build a calculator", "Easy"),
            practice("Build a Todo application", "Easy"),
            practice("Build a weather application", "Medium"),
            practice("Consume a REST API", "Medium"),
        ],
    },


    {
        title: "React",
        icon: "⚛️",
        description: "Build modern React applications.",

        topics: [
            "Components",
            "Props",
            "State",
            "Hooks",
            "Context",
            "Router",
            "Forms",
            "API Integration",
        ],

        resources: [
            resource(
                "React Documentation",
                "Documentation",
                "https://react.dev/"
            ),
            resource(
                "React Learn",
                "Course",
                "https://react.dev/learn"
            ),
        ],

        practice: [
            practice("Build reusable components", "Easy"),
            practice("Build a Todo app", "Easy"),
            practice("Build a dashboard", "Medium"),
            practice("Build authentication", "Medium"),
            practice("Build a production React application", "Hard"),
        ],
    },


    {
        title: "Advanced Frontend",
        icon: "🚀",
        description: "Develop advanced frontend engineering skills.",

        topics: [
            "TypeScript",
            "State Management",
            "Performance",
            "Testing",
            "Accessibility",
            "SEO",
            "Deployment",
        ],

        resources: [
            resource(
                "TypeScript Documentation",
                "Documentation",
                "https://www.typescriptlang.org/docs/"
            ),
            resource(
                "Web Accessibility",
                "Guide",
                "https://developer.mozilla.org/en-US/docs/Web/Accessibility"
            ),
        ],

        practice: [
            practice("Convert a React project to TypeScript", "Medium"),
            practice("Optimize React rendering", "Medium"),
            practice("Add frontend tests", "Medium"),
            practice("Improve accessibility", "Medium"),
            practice("Deploy a frontend application", "Easy"),
        ],
    },


    {
        title: "Projects & Interview",
        icon: "🎯",
        description: "Build projects and prepare for interviews.",

        topics: [
            "Portfolio",
            "E-Commerce",
            "Dashboard",
            "Chat App",
            "Frontend Interview",
            "DSA",
        ],

        resources: [
            resource(
                "GitHub",
                "Platform",
                "https://github.com/"
            ),
            resource(
                "LeetCode",
                "Practice",
                "https://leetcode.com/"
            ),
        ],

        practice: [
            practice("Build a portfolio", "Easy"),
            practice("Build an e-commerce frontend", "Medium"),
            practice("Build a dashboard", "Medium"),
            practice("Complete a frontend mock interview", "Hard"),
        ],
    },
];


// ============================================================
// BACKEND DEVELOPER
// ============================================================

const BACKEND_PHASES = [

    {
        title: "Programming",
        icon: "💻",
        description: "Build strong programming fundamentals.",

        topics: [
            "Programming Fundamentals",
            "Functions",
            "OOP",
            "Error Handling",
            "Data Structures",
        ],

        resources: [
            resource(
                "MDN JavaScript",
                "Documentation",
                "https://developer.mozilla.org/en-US/docs/Web/JavaScript"
            ),
        ],

        practice: [
            practice("Solve programming exercises", "Easy"),
            practice("Build functions for common tasks", "Easy"),
            practice("Create an OOP project", "Medium"),
            practice("Practice data structures", "Medium"),
        ],
    },


    {
        title: "Node.js",
        icon: "🟢",
        description: "Learn server-side JavaScript.",

        topics: [
            "Node.js",
            "NPM",
            "Modules",
            "File System",
            "Events",
            "Async Programming",
        ],

        resources: [
            resource(
                "Node.js Documentation",
                "Documentation",
                "https://nodejs.org/docs/latest/api/"
            ),
            resource(
                "npm Documentation",
                "Documentation",
                "https://docs.npmjs.com/"
            ),
        ],

        practice: [
            practice("Create a Node.js server", "Easy"),
            practice("Create a CLI application", "Easy"),
            practice("Work with the File System", "Medium"),
            practice("Build an asynchronous application", "Medium"),
        ],
    },


    {
        title: "Express.js",
        icon: "⚡",
        description: "Build REST APIs with Express.",

        topics: [
            "Express",
            "Routing",
            "Middleware",
            "Controllers",
            "REST APIs",
            "Validation",
            "Error Handling",
        ],

        resources: [
            resource(
                "Express Documentation",
                "Documentation",
                "https://expressjs.com/"
            ),
        ],

        practice: [
            practice("Create Express routes", "Easy"),
            practice("Create custom middleware", "Medium"),
            practice("Build a CRUD API", "Medium"),
            practice("Add validation", "Medium"),
            practice("Create centralized error handling", "Medium"),
        ],
    },


    {
        title: "Databases",
        icon: "🗄️",
        description: "Learn database systems and design.",

        topics: [
            "MongoDB",
            "Mongoose",
            "SQL",
            "PostgreSQL",
            "Indexes",
            "Transactions",
            "Database Design",
        ],

        resources: [
            resource(
                "MongoDB Documentation",
                "Documentation",
                "https://www.mongodb.com/docs/"
            ),
            resource(
                "Mongoose Documentation",
                "Documentation",
                "https://mongoosejs.com/docs/"
            ),
            resource(
                "PostgreSQL Documentation",
                "Documentation",
                "https://www.postgresql.org/docs/"
            ),
        ],

        practice: [
            practice("Create MongoDB CRUD APIs", "Easy"),
            practice("Design MongoDB schemas", "Medium"),
            practice("Write PostgreSQL queries", "Medium"),
            practice("Design relational tables", "Medium"),
            practice("Implement database transactions", "Hard"),
        ],
    },


    {
        title: "Authentication & Security",
        icon: "🔐",
        description: "Secure backend applications.",

        topics: [
            "JWT",
            "Sessions",
            "Password Hashing",
            "Authorization",
            "CORS",
            "OWASP",
            "Rate Limiting",
        ],

        resources: [
            resource(
                "OWASP",
                "Security",
                "https://owasp.org/"
            ),
            resource(
                "OWASP Top 10",
                "Security",
                "https://owasp.org/www-project-top-ten/"
            ),
        ],

        practice: [
            practice("Hash user passwords", "Easy"),
            practice("Implement JWT authentication", "Medium"),
            practice("Create role-based authorization", "Medium"),
            practice("Protect an API against common attacks", "Hard"),
        ],
    },


    {
        title: "Deployment & System Design",
        icon: "🏗️",
        description: "Deploy scalable backend systems.",

        topics: [
            "Linux",
            "Docker",
            "CI/CD",
            "Cloud",
            "Caching",
            "Queues",
            "Scalability",
        ],

        resources: [
            resource(
                "Docker Documentation",
                "Documentation",
                "https://docs.docker.com/"
            ),
            resource(
                "GitHub Actions",
                "Documentation",
                "https://docs.github.com/en/actions"
            ),
        ],

        practice: [
            practice("Dockerize an API", "Easy"),
            practice("Create a CI/CD workflow", "Medium"),
            practice("Deploy an API", "Medium"),
            practice("Design a scalable backend", "Hard"),
        ],
    },
];


// ============================================================
// AI ENGINEER
// ============================================================

const AI_ENGINEER_PHASES = [

    {
        title: "Python",
        icon: "🐍",
        description: "Build strong Python and data foundations.",

        topics: [
            "Python Fundamentals",
            "Functions",
            "OOP",
            "NumPy",
            "Pandas",
            "APIs",
        ],

        resources: [
            resource(
                "Python Documentation",
                "Documentation",
                "https://docs.python.org/3/"
            ),
            resource(
                "NumPy Documentation",
                "Documentation",
                "https://numpy.org/doc/"
            ),
            resource(
                "Pandas Documentation",
                "Documentation",
                "https://pandas.pydata.org/docs/"
            ),
        ],

        practice: [
            practice("Solve Python programming exercises", "Easy"),
            practice("Build a Python CLI application", "Easy"),
            practice("Analyze a dataset with Pandas", "Medium"),
            practice("Build a Python API client", "Medium"),
        ],
    },


    {
        title: "Machine Learning",
        icon: "🤖",
        description: "Learn machine learning fundamentals.",

        topics: [
            "ML Fundamentals",
            "Regression",
            "Classification",
            "Clustering",
            "Feature Engineering",
            "Model Evaluation",
        ],

        resources: [
            resource(
                "scikit-learn Documentation",
                "Documentation",
                "https://scikit-learn.org/stable/"
            ),
        ],

        practice: [
            practice("Build a regression model", "Easy"),
            practice("Build a classification model", "Medium"),
            practice("Perform feature engineering", "Medium"),
            practice("Compare ML models", "Medium"),
            practice("Build an end-to-end ML project", "Hard"),
        ],
    },


    {
        title: "Deep Learning",
        icon: "🧠",
        description: "Learn neural networks and deep learning.",

        topics: [
            "Neural Networks",
            "PyTorch",
            "TensorFlow",
            "CNN",
            "RNN",
            "Transformers",
        ],

        resources: [
            resource(
                "PyTorch Documentation",
                "Documentation",
                "https://pytorch.org/docs/"
            ),
            resource(
                "TensorFlow Documentation",
                "Documentation",
                "https://www.tensorflow.org/learn"
            ),
        ],

        practice: [
            practice("Build a neural network", "Medium"),
            practice("Train an image classifier", "Medium"),
            practice("Build a CNN project", "Hard"),
            practice("Build a sequence model", "Hard"),
        ],
    },


    {
        title: "LLM Engineering",
        icon: "✨",
        description: "Build applications powered by large language models.",

        topics: [
            "LLM Fundamentals",
            "Prompt Engineering",
            "Structured Output",
            "Function Calling",
            "Embeddings",
            "Fine Tuning",
        ],

        resources: [
            resource(
                "Hugging Face",
                "Platform",
                "https://huggingface.co/docs"
            ),
            resource(
                "OpenAI API Documentation",
                "Documentation",
                "https://platform.openai.com/docs/"
            ),
        ],

        practice: [
            practice("Build a prompt-based application", "Easy"),
            practice("Generate structured JSON output", "Easy"),
            practice("Build tool calling", "Medium"),
            practice("Create an embedding pipeline", "Medium"),
            practice("Experiment with fine tuning", "Hard"),
        ],
    },


    {
        title: "RAG",
        icon: "📚",
        description: "Build retrieval augmented generation systems.",

        topics: [
            "Vector Databases",
            "Chunking",
            "Embeddings",
            "Retrieval",
            "Reranking",
            "RAG Evaluation",
        ],

        resources: [
            resource(
                "Pinecone Learn",
                "Guide",
                "https://www.pinecone.io/learn/"
            ),
            resource(
                "Hugging Face",
                "Documentation",
                "https://huggingface.co/docs"
            ),
        ],

        practice: [
            practice("Create document chunks", "Easy"),
            practice("Generate embeddings", "Medium"),
            practice("Build vector search", "Medium"),
            practice("Build a document Q&A application", "Hard"),
            practice("Evaluate a RAG system", "Hard"),
        ],
    },


    {
        title: "AI Agents",
        icon: "🧩",
        description: "Build tool-using and autonomous AI systems.",

        topics: [
            "Tool Calling",
            "Agent Architecture",
            "Memory",
            "Planning",
            "Multi-Agent Systems",
            "Agent Evaluation",
        ],

        resources: [
            resource(
                "Hugging Face Agents",
                "Guide",
                "https://huggingface.co/docs/smolagents/"
            ),
            resource(
                "LangChain Documentation",
                "Documentation",
                "https://python.langchain.com/docs/"
            ),
        ],

        practice: [
            practice("Build a tool-calling agent", "Medium"),
            practice("Add memory to an agent", "Medium"),
            practice("Build a research agent", "Hard"),
            practice("Build a multi-agent workflow", "Hard"),
            practice("Evaluate an AI agent", "Hard"),
        ],
    },


    {
        title: "AI Applications",
        icon: "🚀",
        description: "Turn AI knowledge into real applications.",

        topics: [
            "AI Chatbot",
            "RAG Application",
            "AI Career Assistant",
            "AI Interviewer",
            "AI Agent",
            "Deployment",
        ],

        resources: [
            resource(
                "Hugging Face",
                "Platform",
                "https://huggingface.co/"
            ),
            resource(
                "FastAPI Documentation",
                "Documentation",
                "https://fastapi.tiangolo.com/"
            ),
        ],

        practice: [
            practice("Build an AI chatbot", "Medium"),
            practice("Build a RAG application", "Hard"),
            practice("Build an AI career assistant", "Hard"),
            practice("Build an AI interviewer", "Hard"),
            practice("Deploy an AI application", "Hard"),
        ],
    },
];


// ============================================================
// ROADMAPS
// ============================================================

export const ROADMAPS = {

    "Full Stack Developer": {
        description:
            "Become a production-ready full stack developer by mastering frontend, backend, databases, DevOps and real-world development.",

        duration: "12–18 months",

        level: "Beginner Friendly",

        projects: "10+",

        phases: FULL_STACK_PHASES,
    },


    "Frontend Developer": {
        description:
            "Master modern frontend development and build high-quality user interfaces.",

        duration: "6–10 months",

        level: "Beginner Friendly",

        projects: "8+",

        phases: FRONTEND_PHASES,
    },


    "Backend Developer": {
        description:
            "Build reliable APIs, databases and scalable backend systems.",

        duration: "7–12 months",

        level: "Intermediate Friendly",

        projects: "8+",

        phases: BACKEND_PHASES,
    },


    "AI Engineer": {
        description:
            "Build AI-powered applications using machine learning, LLMs, RAG and agents.",

        duration: "10–18 months",

        level: "Intermediate",

        projects: "10+",

        phases: AI_ENGINEER_PHASES,
    },
};
