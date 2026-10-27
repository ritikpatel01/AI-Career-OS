const crypto = require("node:crypto");
const path = require("node:path");
const mongoose = require("mongoose");

require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const Job = require("../models/Job");

const sampleJobs = [
    ["Full Stack Developer", "Northstar Digital", "Bengaluru, India", "Build and maintain customer-facing web products across React interfaces and Node.js services. Work with product and design to ship reliable features.", ["React", "Node.js", "Express", "MongoDB", "REST APIs"], "full-time", "2–4 years", "₹12–20 LPA"],
    ["Full Stack Developer", "Harborline Systems", "Pune, India", "Develop end-to-end workflow tools, improve API performance, and contribute to code reviews and production support.", ["JavaScript", "React", "Node.js", "PostgreSQL", "Git"], "full-time", "3–5 years", "₹14–22 LPA"],
    ["Full Stack Developer", "Cedar Labs", "Remote, India", "Deliver accessible web features from database design through deployment in a small cross-functional engineering team.", ["TypeScript", "React", "Python", "Django", "Docker"], "contract", "1–3 years", "₹900–1,400 per hour"],

    ["Frontend Developer", "BrightPath Studio", "Hyderabad, India", "Create responsive interfaces for a SaaS analytics platform and improve usability across desktop and mobile browsers.", ["React", "TypeScript", "CSS", "HTML", "Accessibility"], "full-time", "1–3 years", "₹8–14 LPA"],
    ["Frontend Developer", "Orbit Commerce", "Mumbai, India", "Build storefront experiences, collaborate on design systems, and improve page performance and cross-browser behavior.", ["JavaScript", "React", "Next.js", "CSS", "Web Performance"], "full-time", "3–5 years", "₹14–22 LPA"],
    ["Frontend Developer", "Fieldnote Software", "Remote, India", "Implement product dashboards and reusable UI components with a focus on testability and inclusive design.", ["Vue.js", "JavaScript", "HTML", "CSS", "Playwright"], "contract", "2–4 years", "₹700–1,100 per hour"],

    ["Backend Developer", "Granite Cloud", "Bengaluru, India", "Design API services and data workflows for a multi-tenant business platform with clear monitoring and operational ownership.", ["Node.js", "Express", "MongoDB", "Redis", "REST APIs"], "full-time", "2–4 years", "₹12–19 LPA"],
    ["Backend Developer", "Maple Ledger", "Chennai, India", "Build secure payment and account services, maintain integration tests, and investigate production incidents.", ["Java", "Spring Boot", "PostgreSQL", "Kafka", "JUnit"], "full-time", "3–6 years", "₹16–25 LPA"],
    ["Backend Developer", "SignalWorks", "Remote, India", "Develop internal APIs and background processing services for a growing logistics product.", ["Python", "FastAPI", "PostgreSQL", "Docker", "AWS"], "contract", "1–3 years", "₹800–1,200 per hour"],

    ["Java Developer", "Keystone Platforms", "Pune, India", "Build and support Java services for enterprise workflows, including API development, testing, and code review.", ["Java", "Spring Boot", "SQL", "Maven", "JUnit"], "full-time", "2–4 years", "₹11–18 LPA"],
    ["Java Developer", "Meridian Finance Systems", "Mumbai, India", "Maintain transaction-processing services and improve reliability across distributed backend components.", ["Java", "Spring", "Kafka", "Oracle", "Microservices"], "full-time", "4–7 years", "₹18–28 LPA"],
    ["Java Developer", "Pinecone Consulting", "Noida, India", "Contribute to a client modernization project by developing tested services and documenting deployment changes.", ["Java", "Spring Boot", "PostgreSQL", "REST APIs", "Git"], "contract", "1–3 years", "₹700–1,000 per hour"],

    ["Python Developer", "Bluejay Analytics", "Bengaluru, India", "Develop data-backed application services and automation tools used by internal research and operations teams.", ["Python", "Django", "PostgreSQL", "REST APIs", "Pytest"], "full-time", "1–3 years", "₹9–15 LPA"],
    ["Python Developer", "Summit Robotics", "Hyderabad, India", "Build Python services that connect device telemetry, internal APIs, and cloud data pipelines.", ["Python", "FastAPI", "AWS", "Docker", "SQL"], "full-time", "3–5 years", "₹15–23 LPA"],
    ["Python Developer", "Willow Research Tools", "Remote, India", "Create maintainable Python utilities and data integrations for a scientific software team.", ["Python", "Pandas", "Flask", "Git", "Linux"], "part-time", "0–2 years", "₹35,000–₹60,000 per month"],

    ["Data Scientist", "Juniper Insights", "Bengaluru, India", "Develop and evaluate statistical models that help product teams understand user behavior and forecast demand.", ["Python", "Pandas", "Scikit-learn", "Statistics", "SQL"], "full-time", "2–4 years", "₹14–22 LPA"],
    ["Data Scientist", "Clearwater Health Analytics", "Pune, India", "Analyze clinical operations data, validate predictive models, and communicate limitations to business stakeholders.", ["Python", "Machine Learning", "Pandas", "SQL", "Experiment Design"], "full-time", "3–6 years", "₹16–26 LPA"],
    ["Data Scientist", "Redwood Market Research", "Remote, India", "Run customer and market analyses, build reproducible notebooks, and present evidence-based recommendations.", ["Python", "R", "Statistics", "SQL", "Jupyter"], "contract", "1–3 years", "₹900–1,400 per hour"],

    ["Data Analyst", "Cobalt Retail Group", "Mumbai, India", "Prepare recurring business reports, investigate performance changes, and help teams define reliable metrics.", ["SQL", "Excel", "Power BI", "Data Cleaning", "Communication"], "full-time", "1–3 years", "₹7–12 LPA"],
    ["Data Analyst", "Riverbend Mobility", "Bengaluru, India", "Analyze trip and service data, maintain dashboards, and share findings with operations and product partners.", ["SQL", "Python", "Tableau", "Excel", "Statistics"], "full-time", "2–4 years", "₹10–16 LPA"],
    ["Data Analyst", "Evergreen Learning Services", "Remote, India", "Support education program teams with clean datasets, scheduled reports, and clear analysis documentation.", ["Excel", "SQL", "Looker Studio", "Data Visualization", "Google Sheets"], "part-time", "0–2 years", "₹30,000–₹50,000 per month"],

    ["Machine Learning Engineer", "Aster Model Labs", "Bengaluru, India", "Productionize ranking and classification models, improve evaluation pipelines, and monitor model quality after release.", ["Python", "PyTorch", "Scikit-learn", "MLflow", "Docker"], "full-time", "2–4 years", "₹18–28 LPA"],
    ["Machine Learning Engineer", "Northwind Vision", "Hyderabad, India", "Build computer vision services and optimize model inference for image-based quality inspection.", ["Python", "PyTorch", "Computer Vision", "ONNX", "AWS"], "full-time", "3–6 years", "₹22–34 LPA"],
    ["Machine Learning Engineer", "Lattice Forecasting", "Remote, India", "Create reproducible model training workflows and collaborate with data scientists on production deployments.", ["Python", "TensorFlow", "Feature Engineering", "Kubernetes", "SQL"], "contract", "2–5 years", "₹1,200–1,800 per hour"],

    ["AI Engineer", "Crescent AI Studio", "Bengaluru, India", "Integrate language models into customer support workflows with evaluation, privacy, and reliability safeguards.", ["Python", "LLM APIs", "RAG", "FastAPI", "Vector Search"], "full-time", "2–4 years", "₹18–30 LPA"],
    ["AI Engineer", "Saffron Automation", "Pune, India", "Prototype and deploy AI-assisted document processing tools, measuring quality against representative test cases.", ["Python", "Machine Learning", "OCR", "Prompt Evaluation", "Docker"], "full-time", "1–4 years", "₹14–24 LPA"],
    ["AI Engineer", "Cloudberry Intelligence", "Remote, India", "Build secure AI features and supporting APIs in partnership with product, security, and data teams.", ["Python", "LLM Applications", "REST APIs", "AWS", "Evaluation"], "contract", "3–6 years", "₹1,300–2,000 per hour"],

    ["Cloud Engineer", "Skyline Infrastructure", "Bengaluru, India", "Provision and operate cloud environments, improve observability, and help application teams adopt reliable deployment patterns.", ["AWS", "Terraform", "Linux", "Networking", "CloudWatch"], "full-time", "2–4 years", "₹14–22 LPA"],
    ["Cloud Engineer", "Ironwood Networks", "Chennai, India", "Support secure cloud migrations and maintain resilient infrastructure for customer-facing services.", ["Azure", "Terraform", "Kubernetes", "Networking", "Security"], "full-time", "3–6 years", "₹17–27 LPA"],
    ["Cloud Engineer", "Mosaic Systems", "Remote, India", "Automate cloud account setup, cost reporting, and operational checks across development environments.", ["GCP", "Terraform", "Python", "IAM", "Monitoring"], "contract", "1–3 years", "₹900–1,400 per hour"],

    ["DevOps Engineer", "Copperline Technologies", "Hyderabad, India", "Improve build and release pipelines, maintain container platforms, and partner with engineers on service reliability.", ["Docker", "Kubernetes", "Jenkins", "AWS", "Linux"], "full-time", "2–4 years", "₹13–21 LPA"],
    ["DevOps Engineer", "Bluepeak Commerce", "Bengaluru, India", "Own deployment automation and observability for a high-availability commerce platform.", ["GitHub Actions", "Kubernetes", "Terraform", "Prometheus", "AWS"], "full-time", "4–7 years", "₹20–31 LPA"],
    ["DevOps Engineer", "OpenTrail Software", "Remote, India", "Help a distributed team standardize infrastructure-as-code and improve incident response practices.", ["Linux", "Docker", "Ansible", "CI/CD", "Monitoring"], "contract", "1–3 years", "₹800–1,300 per hour"],

    ["Cybersecurity Engineer", "Stonebridge Security", "Bengaluru, India", "Assess application security findings, improve secure development guidance, and support remediation with engineering teams.", ["Application Security", "OWASP", "Burp Suite", "Python", "Threat Modeling"], "full-time", "2–4 years", "₹15–24 LPA"],
    ["Cybersecurity Engineer", "Silverfern Payments", "Mumbai, India", "Strengthen cloud and platform security controls and help investigate security events.", ["Cloud Security", "SIEM", "IAM", "AWS", "Incident Response"], "full-time", "3–6 years", "₹19–30 LPA"],
    ["Cybersecurity Engineer", "Redcliff Advisory", "Remote, India", "Support vulnerability assessments, security documentation, and practical remediation plans for client systems.", ["Vulnerability Management", "Linux", "Networking", "NIST", "Scripting"], "contract", "1–3 years", "₹900–1,400 per hour"],

    ["Civil Engineer", "Oakridge Civil Works", "Pune, India", "Prepare design calculations and site documentation for road and drainage projects under senior engineering review.", ["AutoCAD", "Civil 3D", "Structural Basics", "Site Inspection", "Technical Reports"], "full-time", "1–3 years", "₹5–9 LPA"],
    ["Civil Engineer", "TerraSpan Infrastructure", "Ahmedabad, India", "Coordinate engineering drawings, material checks, and contractor queries for commercial construction projects.", ["AutoCAD", "Quantity Estimation", "Quality Control", "Construction Codes", "Excel"], "full-time", "3–6 years", "₹9–15 LPA"],
    ["Civil Engineer", "Greenway Engineering Partners", "Remote, India", "Assist with project documentation, preliminary design reviews, and progress reporting for infrastructure work.", ["Civil Design", "AutoCAD", "Project Coordination", "MS Project", "Excel"], "contract", "2–4 years", "₹500–800 per hour"],

    ["Mechanical Engineer", "ForgeLine Manufacturing", "Chennai, India", "Support equipment design and production improvements through drawing reviews, testing, and root-cause analysis.", ["SolidWorks", "Mechanical Design", "GD&T", "Manufacturing", "Root Cause Analysis"], "full-time", "1–3 years", "₹6–10 LPA"],
    ["Mechanical Engineer", "Summit Motion Systems", "Pune, India", "Develop mechanical assemblies for industrial automation equipment and coordinate prototype validation.", ["Creo", "CAD", "Materials", "Tolerance Analysis", "DFM"], "full-time", "3–6 years", "₹10–17 LPA"],
    ["Mechanical Engineer", "Harbor Works Engineering", "Bengaluru, India", "Maintain design records and assist senior engineers with test planning for rotating machinery.", ["AutoCAD", "SolidWorks", "Thermodynamics", "Testing", "Technical Documentation"], "contract", "0–2 years", "₹450–700 per hour"],

    ["Electrical Engineer", "VoltEdge Energy", "Bengaluru, India", "Design and review electrical systems for renewable energy installations, including drawings and commissioning support.", ["ETAP", "AutoCAD Electrical", "Power Systems", "Electrical Safety", "Testing"], "full-time", "2–4 years", "₹8–14 LPA"],
    ["Electrical Engineer", "Crestview Controls", "Hyderabad, India", "Support plant electrical upgrades, panel documentation, and troubleshooting with maintenance teams.", ["PLC", "Electrical Design", "Control Systems", "EPLAN", "Safety Standards"], "full-time", "3–6 years", "₹11–18 LPA"],
    ["Electrical Engineer", "MeadowGrid Projects", "Remote, India", "Prepare electrical calculations and design documentation for distributed energy projects.", ["Power Distribution", "AutoCAD", "Load Analysis", "Excel", "Technical Reports"], "contract", "1–3 years", "₹600–900 per hour"],

    ["Software Engineer", "Willowtree Product Co.", "Bengaluru, India", "Design, implement, and support product features across well-tested services and web application components.", ["JavaScript", "TypeScript", "React", "Node.js", "Testing"], "full-time", "2–4 years", "₹12–20 LPA"],
    ["Software Engineer", "Granite Peak Software", "Gurugram, India", "Work with an engineering team to build dependable internal platforms and improve code quality through reviews.", ["Java", "Spring Boot", "SQL", "REST APIs", "Git"], "full-time", "3–6 years", "₹16–25 LPA"],
    ["Software Engineer", "Daybreak Applications", "Remote, India", "Deliver small product improvements and automated tests in a collaborative remote engineering team.", ["Python", "Django", "PostgreSQL", "Pytest", "Docker"], "contract", "1–3 years", "₹800–1,200 per hour"],

    ["UI/UX Designer", "Paperplane Product Studio", "Bengaluru, India", "Research user needs and create clear interaction flows, prototypes, and production-ready interface specifications.", ["Figma", "User Research", "Prototyping", "Design Systems", "Accessibility"], "full-time", "2–4 years", "₹9–15 LPA"],
    ["UI/UX Designer", "Lighthouse Health Products", "Pune, India", "Design accessible patient and provider experiences, using usability feedback to refine workflows.", ["Figma", "Interaction Design", "Usability Testing", "Wireframing", "WCAG"], "full-time", "3–6 years", "₹12–19 LPA"],
    ["UI/UX Designer", "CanvasRoute", "Remote, India", "Create visual concepts and clickable prototypes for a new education platform with product and engineering partners.", ["Figma", "Visual Design", "Prototyping", "User Flows", "Design Documentation"], "contract", "1–3 years", "₹700–1,100 per hour"],

    ["Mobile App Developer", "Pocket Harbor Apps", "Bengaluru, India", "Build and maintain Android and iOS product features, collaborating on release quality and app performance.", ["React Native", "TypeScript", "REST APIs", "Mobile Testing", "Git"], "full-time", "2–4 years", "₹12–20 LPA"],
    ["Mobile App Developer", "Citrus Mobility", "Chennai, India", "Develop native Android experiences for travel services and improve stability across a range of devices.", ["Kotlin", "Android", "Jetpack Compose", "Room", "Firebase"], "full-time", "1–4 years", "₹10–18 LPA"],
    ["Mobile App Developer", "Northwind Wellness", "Remote, India", "Implement cross-platform health and wellness app features with attention to privacy and accessibility.", ["Flutter", "Dart", "Firebase", "REST APIs", "Mobile Accessibility"], "contract", "2–5 years", "₹900–1,400 per hour"],

    ["QA Engineer", "Clearpath Software", "Hyderabad, India", "Plan and execute functional and regression tests for web releases, documenting clear reproduction steps.", ["Manual Testing", "Test Cases", "Jira", "API Testing", "Browser Testing"], "full-time", "1–3 years", "₹6–10 LPA"],
    ["QA Engineer", "Maple Leaf Commerce", "Bengaluru, India", "Expand automated coverage for checkout and account flows and work with developers to prevent regressions.", ["Playwright", "JavaScript", "API Testing", "CI/CD", "SQL"], "full-time", "2–5 years", "₹10–17 LPA"],
    ["QA Engineer", "Silverline Digital Services", "Remote, India", "Validate mobile and web releases, maintain test evidence, and support accessibility checks.", ["Mobile Testing", "Appium", "Regression Testing", "Accessibility", "Postman"], "contract", "1–3 years", "₹500–800 per hour"],

    ["Business Analyst", "CedarBridge Consulting", "Mumbai, India", "Gather requirements, map current workflows, and translate stakeholder needs into clear delivery documentation.", ["Requirements Analysis", "SQL", "Process Mapping", "Excel", "Stakeholder Management"], "full-time", "2–4 years", "₹9–15 LPA"],
    ["Business Analyst", "Riverstone Banking Services", "Pune, India", "Analyze operational processes, define acceptance criteria, and coordinate validation with business and technology teams.", ["Business Analysis", "Jira", "SQL", "BPMN", "UAT"], "full-time", "3–6 years", "₹12–19 LPA"],
    ["Business Analyst", "Brightfield Operations", "Remote, India", "Prepare process documentation and support reporting improvements for a distributed operations team.", ["Excel", "Power BI", "Process Improvement", "Documentation", "Communication"], "contract", "1–3 years", "₹600–900 per hour"]
].map(([title, company, location, description, skills, jobType, experienceLevel, salary]) => ({
    title,
    company,
    location,
    description,
    skills,
    jobType,
    experienceLevel,
    salary,
    applyUrl: `https://example.com/careers/${company.toLowerCase().replace(/[^a-z0-9]+/g, "-")}/${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
}));

const stableJobId = (job) => {
    const stableKey = `ai-career-os-sample-job:${job.title}:${job.company}`;
    const hexId = crypto.createHash("sha256").update(stableKey).digest("hex").slice(0, 24);
    return new mongoose.Types.ObjectId(hexId);
};

const seedJobs = async () => {
    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI is required. Configure it in server/.env before seeding.");
    }

    await mongoose.connect(process.env.MONGO_URI);

    let inserted = 0;
    for (const job of sampleJobs) {
        const _id = stableJobId(job);
        const result = await Job.updateOne(
            { _id },
            { $setOnInsert: { _id, ...job } },
            { upsert: true, runValidators: true }
        );
        inserted += result.upsertedCount || 0;
    }

    console.log(`Sample job seed complete: ${inserted} inserted, ${sampleJobs.length - inserted} already present.`);
};

seedJobs()
    .catch((error) => {
        console.error("Sample job seed failed:", error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });
