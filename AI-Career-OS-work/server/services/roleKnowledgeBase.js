// =========================================================
// AI CAREER OS
// ROLE KNOWLEDGE BASE
// =========================================================

const ROLE_KNOWLEDGE_BASE = {

    // =====================================================
    // SOFTWARE / WEB
    // =====================================================

    "full stack developer": {
        category: "software",
        coreSkills: [
            "javascript",
            "html",
            "css",
            "react",
            "node.js",
            "express",
            "rest api",
            "database"
        ],
        importantSkills: [
            "git",
            "authentication",
            "testing",
            "responsive design"
        ],
        tools: [
            "mongodb",
            "sql",
            "postman",
            "docker"
        ],
        concepts: [
            "crud",
            "mvc",
            "api development"
        ]
    },

    "frontend developer": {
        category: "software",
        coreSkills: [
            "html",
            "css",
            "javascript",
            "react"
        ],
        importantSkills: [
            "typescript",
            "responsive design",
            "accessibility",
            "testing",
            "git"
        ],
        tools: [
            "npm",
            "webpack",
            "vite"
        ],
        concepts: [
            "dom",
            "web performance",
            "user interface"
        ]
    },

    "backend developer": {
        category: "software",
        coreSkills: [
            "node.js",
            "python",
            "java",
            "rest api",
            "database",
            "authentication"
        ],
        importantSkills: [
            "sql",
            "mongodb",
            "testing",
            "git"
        ],
        tools: [
            "docker",
            "postman"
        ],
        concepts: [
            "api development",
            "crud",
            "caching",
            "system design"
        ]
    },

    "software engineer": {
        category: "software",
        coreSkills: [
            "data structures",
            "algorithms",
            "programming",
            "object oriented programming"
        ],
        importantSkills: [
            "git",
            "sql",
            "testing",
            "rest api"
        ],
        tools: [
            "github",
            "docker"
        ],
        concepts: [
            "software development",
            "system design",
            "debugging"
        ]
    },

    "java developer": {
        category: "software",
        coreSkills: [
            "java",
            "spring",
            "spring boot",
            "sql",
            "rest api"
        ],
        importantSkills: [
            "hibernate",
            "maven",
            "junit",
            "git",
            "object oriented programming"
        ],
        tools: [
            "docker",
            "postman"
        ],
        concepts: [
            "microservices",
            "api development"
        ]
    },

    "python developer": {
        category: "software",
        coreSkills: [
            "python",
            "rest api",
            "database"
        ],
        importantSkills: [
            "django",
            "flask",
            "fastapi",
            "sql",
            "git",
            "testing"
        ],
        tools: [
            "docker",
            "postman"
        ],
        concepts: [
            "api development",
            "web development"
        ]
    },


    // =====================================================
    // DATA / AI
    // =====================================================

    "data scientist": {
        category: "data-ai",
        coreSkills: [
            "python",
            "statistics",
            "machine learning",
            "pandas",
            "numpy"
        ],
        importantSkills: [
            "sql",
            "scikit-learn",
            "data visualization",
            "matplotlib"
        ],
        tools: [
            "jupyter",
            "power bi",
            "tableau"
        ],
        concepts: [
            "data analysis",
            "feature engineering",
            "model evaluation",
            "exploratory data analysis"
        ]
    },

    "data analyst": {
        category: "data-ai",
        coreSkills: [
            "sql",
            "excel",
            "statistics",
            "data analysis"
        ],
        importantSkills: [
            "python",
            "pandas",
            "numpy",
            "data visualization"
        ],
        tools: [
            "power bi",
            "tableau"
        ],
        concepts: [
            "exploratory data analysis",
            "business intelligence",
            "reporting"
        ]
    },

    "machine learning engineer": {
        category: "data-ai",
        coreSkills: [
            "python",
            "machine learning",
            "scikit-learn",
            "model evaluation"
        ],
        importantSkills: [
            "pandas",
            "numpy",
            "tensorflow",
            "pytorch",
            "sql"
        ],
        tools: [
            "docker",
            "jupyter"
        ],
        concepts: [
            "model deployment",
            "feature engineering",
            "mlops"
        ]
    },

    "ai engineer": {
        category: "data-ai",
        coreSkills: [
            "python",
            "machine learning",
            "deep learning"
        ],
        importantSkills: [
            "pytorch",
            "tensorflow",
            "llm",
            "nlp",
            "rest api"
        ],
        tools: [
            "docker",
            "git"
        ],
        concepts: [
            "generative ai",
            "rag",
            "embeddings",
            "model deployment"
        ]
    },


    // =====================================================
    // CLOUD / DEVOPS
    // =====================================================

    "cloud engineer": {
        category: "cloud-devops",
        coreSkills: [
            "aws",
            "azure",
            "google cloud",
            "linux",
            "networking"
        ],
        importantSkills: [
            "docker",
            "kubernetes",
            "terraform",
            "iam",
            "ci/cd"
        ],
        tools: [
            "cloudwatch",
            "git"
        ],
        concepts: [
            "infrastructure as code",
            "cloud security",
            "monitoring"
        ]
    },

    "devops engineer": {
        category: "cloud-devops",
        coreSkills: [
            "linux",
            "docker",
            "kubernetes",
            "ci/cd"
        ],
        importantSkills: [
            "terraform",
            "aws",
            "azure",
            "git",
            "monitoring"
        ],
        tools: [
            "jenkins",
            "github actions"
        ],
        concepts: [
            "infrastructure as code",
            "automation",
            "deployment"
        ]
    },


    // =====================================================
    // CYBERSECURITY / NETWORKING
    // =====================================================

    "cybersecurity engineer": {
        category: "security",
        coreSkills: [
            "cybersecurity",
            "network security",
            "linux",
            "firewall"
        ],
        importantSkills: [
            "siem",
            "iam",
            "penetration testing",
            "vulnerability assessment",
            "owasp"
        ],
        tools: [
            "wireshark",
            "splunk"
        ],
        concepts: [
            "threat detection",
            "incident response",
            "security monitoring"
        ]
    },

    "network engineer": {
        category: "networking",
        coreSkills: [
            "networking",
            "tcp/ip",
            "routing",
            "switching"
        ],
        importantSkills: [
            "dns",
            "dhcp",
            "firewall",
            "vpn",
            "linux"
        ],
        tools: [
            "wireshark",
            "cisco"
        ],
        concepts: [
            "network security",
            "network troubleshooting"
        ]
    },


    // =====================================================
    // EMBEDDED
    // =====================================================

    "embedded engineer": {
        category: "embedded",
        coreSkills: [
            "c",
            "c++",
            "microcontrollers",
            "embedded systems"
        ],
        importantSkills: [
            "rtos",
            "uart",
            "spi",
            "i2c",
            "debugging"
        ],
        tools: [
            "git"
        ],
        concepts: [
            "firmware",
            "real-time systems",
            "hardware interfacing"
        ]
    },


    // =====================================================
    // CORE ENGINEERING
    // =====================================================

    "mechanical engineer": {
        category: "engineering",
        coreSkills: [
            "mechanical design",
            "engineering drawing",
            "cad"
        ],
        importantSkills: [
            "solidworks",
            "autocad",
            "ansys",
            "manufacturing"
        ],
        tools: [
            "solidworks",
            "autocad"
        ],
        concepts: [
            "thermodynamics",
            "fluid mechanics",
            "materials",
            "mechanics"
        ]
    },

    "civil engineer": {
        category: "engineering",
        coreSkills: [
            "structural design",
            "construction",
            "engineering drawing"
        ],
        importantSkills: [
            "autocad",
            "staad pro",
            "revit",
            "surveying"
        ],
        tools: [
            "autocad",
            "revit",
            "staad pro"
        ],
        concepts: [
            "structural engineering",
            "geotechnical engineering",
            "construction management"
        ]
    },

    "electrical engineer": {
        category: "engineering",
        coreSkills: [
            "electrical circuits",
            "power systems",
            "electrical machines"
        ],
        importantSkills: [
            "matlab",
            "simulink",
            "plc",
            "autocad"
        ],
        tools: [
            "matlab",
            "simulink"
        ],
        concepts: [
            "control systems",
            "power electronics",
            "signal processing"
        ]
    },

    "electronics engineer": {
        category: "engineering",
        coreSkills: [
            "electronics",
            "digital electronics",
            "analog electronics"
        ],
        importantSkills: [
            "microcontrollers",
            "embedded systems",
            "pcb design",
            "signal processing"
        ],
        tools: [
            "matlab",
            "altium",
            "kicad"
        ],
        concepts: [
            "communication systems",
            "embedded systems",
            "circuit design"
        ]
    },

    "chemical engineer": {
        category: "engineering",
        coreSkills: [
            "chemical engineering",
            "process engineering",
            "thermodynamics"
        ],
        importantSkills: [
            "process simulation",
            "heat transfer",
            "mass transfer",
            "fluid mechanics"
        ],
        tools: [
            "aspentech",
            "matlab"
        ],
        concepts: [
            "process control",
            "reaction engineering",
            "process design"
        ]
    },

    "biomedical engineer": {
        category: "engineering",
        coreSkills: [
            "biomedical engineering",
            "medical devices",
            "biomedical instrumentation"
        ],
        importantSkills: [
            "signal processing",
            "matlab",
            "biomaterials"
        ],
        tools: [
            "matlab",
            "python"
        ],
        concepts: [
            "medical imaging",
            "biomechanics",
            "healthcare technology"
        ]
    },

    "automotive engineer": {
        category: "engineering",
        coreSkills: [
            "automotive engineering",
            "vehicle dynamics",
            "automotive systems"
        ],
        importantSkills: [
            "cad",
            "matlab",
            "simulink",
            "automotive electronics"
        ],
        tools: [
            "matlab",
            "simulink",
            "catia"
        ],
        concepts: [
            "engine systems",
            "electric vehicles",
            "vehicle control"
        ]
    },

    "aerospace engineer": {
        category: "engineering",
        coreSkills: [
            "aerospace engineering",
            "aerodynamics",
            "aircraft design"
        ],
        importantSkills: [
            "cad",
            "matlab",
            "simulink",
            "flight dynamics"
        ],
        tools: [
            "matlab",
            "ansys"
        ],
        concepts: [
            "propulsion",
            "aerostructures",
            "flight mechanics"
        ]
    }
};


// =========================================================
// EXPORT
// =========================================================

module.exports = ROLE_KNOWLEDGE_BASE;