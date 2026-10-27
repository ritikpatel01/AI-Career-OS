import React, { useMemo, useState } from "react";
import "./Jobs.css";


// ============================================================
// DEMO JOB DATA
// ============================================================

const initialJobs = [
    {
        id: 1,
        title: "Full Stack Developer",
        company: "Tech Solutions",
        location: "Bengaluru, India",
        workMode: "Hybrid",
        jobType: "Full Time",
        experience: "0–2 years",
        salary: "₹6–10 LPA",
        posted: "2 days ago",
        match: 92,
        skills: [
            "JavaScript",
            "React",
            "Node.js",
            "MongoDB",
            "Express",
            "Git"
        ],
        description:
            "Build modern web applications using JavaScript, React, Node.js and scalable backend technologies.",
        applyUrl: "https://example.com"
    },

    {
        id: 2,
        title: "Software Engineer",
        company: "Product Labs",
        location: "Hyderabad, India",
        workMode: "On-site",
        jobType: "Full Time",
        experience: "0–3 years",
        salary: "₹7–12 LPA",
        posted: "3 days ago",
        match: 85,
        skills: [
            "React",
            "Node.js",
            "TypeScript",
            "MongoDB",
            "Express"
        ],
        description:
            "Work with an engineering team to build reliable products and scalable software systems.",
        applyUrl: "https://example.com"
    },

    {
        id: 3,
        title: "Backend Developer",
        company: "Cloud Systems",
        location: "Remote",
        workMode: "Remote",
        jobType: "Full Time",
        experience: "1–3 years",
        salary: "₹8–14 LPA",
        posted: "1 day ago",
        match: 78,
        skills: [
            "Node.js",
            "Express",
            "MongoDB",
            "REST API",
            "Docker"
        ],
        description:
            "Develop backend services, REST APIs and database-driven applications.",
        applyUrl: "https://example.com"
    },

    {
        id: 4,
        title: "Frontend Developer",
        company: "Digital Works",
        location: "Pune, India",
        workMode: "Hybrid",
        jobType: "Full Time",
        experience: "0–2 years",
        salary: "₹5–9 LPA",
        posted: "5 days ago",
        match: 72,
        skills: [
            "React",
            "JavaScript",
            "HTML",
            "CSS",
            "Git"
        ],
        description:
            "Create responsive and accessible interfaces using React and modern frontend technologies.",
        applyUrl: "https://example.com"
    },

    {
        id: 5,
        title: "Data Scientist",
        company: "Analytics Labs",
        location: "Mumbai, India",
        workMode: "Remote",
        jobType: "Internship",
        experience: "0–2 years",
        salary: "₹6–10 LPA",
        posted: "1 day ago",
        match: 81,
        skills: [
            "Python",
            "Pandas",
            "NumPy",
            "Machine Learning",
            "SQL"
        ],
        description:
            "Analyze datasets and build machine learning models to solve business problems.",
        applyUrl: "https://example.com"
    },

    {
        id: 6,
        title: "Python Developer",
        company: "Data Systems",
        location: "Mumbai, India",
        workMode: "Remote",
        jobType: "Internship",
        experience: "0–2 years",
        salary: "₹5–8 LPA",
        posted: "2 days ago",
        match: 76,
        skills: [
            "Python",
            "Django",
            "REST API",
            "SQL",
            "Git"
        ],
        description:
            "Develop Python-based backend services and data-driven applications.",
        applyUrl: "https://example.com"
    },

    {
        id: 7,
        title: "DevOps Engineer",
        company: "Cloud Infrastructure",
        location: "Bengaluru, India",
        workMode: "Hybrid",
        jobType: "Full Time",
        experience: "1–3 years",
        salary: "₹8–15 LPA",
        posted: "4 days ago",
        match: 68,
        skills: [
            "AWS",
            "Docker",
            "Kubernetes",
            "Linux",
            "CI/CD"
        ],
        description:
            "Manage cloud infrastructure, deployment pipelines and scalable production systems.",
        applyUrl: "https://example.com"
    },

    {
        id: 8,
        title: "AI Engineer",
        company: "Intelligence Labs",
        location: "Delhi, India",
        workMode: "Remote",
        jobType: "Full Time",
        experience: "1–3 years",
        salary: "₹9–16 LPA",
        posted: "3 days ago",
        match: 64,
        skills: [
            "Python",
            "Machine Learning",
            "LLM",
            "APIs",
            "PyTorch"
        ],
        description:
            "Develop AI-powered applications and machine learning systems.",
        applyUrl: "https://example.com"
    },

    {
        id: 9,
        title: "Java Developer",
        company: "Enterprise Systems",
        location: "Hyderabad, India",
        workMode: "On-site",
        jobType: "Full Time",
        experience: "1–3 years",
        salary: "₹7–13 LPA",
        posted: "2 days ago",
        match: 71,
        skills: [
            "Java",
            "Spring Boot",
            "REST API",
            "SQL",
            "Git"
        ],
        description:
            "Build enterprise applications and scalable backend services using Java and Spring Boot.",
        applyUrl: "https://example.com"
    },

    {
        id: 10,
        title: "Cybersecurity Engineer",
        company: "SecureTech",
        location: "Delhi, India",
        workMode: "Hybrid",
        jobType: "Full Time",
        experience: "1–3 years",
        salary: "₹8–14 LPA",
        posted: "6 days ago",
        match: 59,
        skills: [
            "Linux",
            "Networking",
            "Security",
            "Python",
            "Cloud"
        ],
        description:
            "Help secure applications, infrastructure and cloud environments.",
        applyUrl: "https://example.com"
    }
];


// ============================================================
// ROLE OPTIONS
// ============================================================

const roleOptions = [
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
    "Cybersecurity Engineer"
];


// ============================================================
// JOBS COMPONENT
// ============================================================

const Jobs = () => {

    const [jobs, setJobs] = useState(initialJobs);

    const [search, setSearch] = useState("");

    const [filters, setFilters] = useState({
        role: "Full Stack Developer",
        location: "Any Location",
        workMode: "Any Work Mode",
        experience: "Any Experience",
        jobType: "Any Job Type",
        salary: "Any Salary"
    });

    const [activeTab, setActiveTab] =
        useState("recommended");

    const [savedJobs, setSavedJobs] =
        useState([]);

    const [applications, setApplications] =
        useState([]);

    const [interviews, setInterviews] =
        useState([]);

    const [showAddJob, setShowAddJob] =
        useState(false);

    const [showDetails, setShowDetails] =
        useState(null);

    const [newJob, setNewJob] = useState({
        title: "",
        company: "",
        location: "",
        workMode: "Remote",
        jobType: "Full Time",
        experience: "0–2 years",
        salary: "",
        skills: "",
        description: "",
        applyUrl: ""
    });


    // ========================================================
    // FILTER JOBS
    // ========================================================

    const filteredJobs = useMemo(() => {

        const query =
            search.trim().toLowerCase();

        return jobs.filter((job) => {

            // SEARCH
            const matchesSearch =
                !query ||
                job.title
                    .toLowerCase()
                    .includes(query) ||
                job.company
                    .toLowerCase()
                    .includes(query) ||
                job.skills.some((skill) =>
                    skill
                        .toLowerCase()
                        .includes(query)
                );


            // ROLE
            const matchesRole =
                filters.role === "Any Role" ||
                job.title
                    .toLowerCase()
                    .includes(
                        filters.role
                            .toLowerCase()
                            .replace(" developer", "")
                            .replace(" engineer", "")
                    ) ||
                (
                    filters.role === "Software Engineer" &&
                    job.title
                        .toLowerCase()
                        .includes("engineer")
                );


            // LOCATION
            const matchesLocation =
                filters.location === "Any Location" ||
                job.location
                    .toLowerCase()
                    .includes(
                        filters.location.toLowerCase()
                    ) ||
                (
                    filters.location === "Remote" &&
                    job.workMode === "Remote"
                );


            // WORK MODE
            const matchesWorkMode =
                filters.workMode === "Any Work Mode" ||
                job.workMode === filters.workMode;


            // EXPERIENCE
            const matchesExperience =
                filters.experience === "Any Experience" ||
                job.experience === filters.experience;


            // JOB TYPE
            const matchesJobType =
                filters.jobType === "Any Job Type" ||
                job.jobType === filters.jobType;


            // SALARY
            const matchesSalary =
                filters.salary === "Any Salary" ||
                job.salary.includes(
                    filters.salary
                        .replace("₹", "")
                        .replace(" LPA", "")
                        .split("–")[0]
                );


            return (
                matchesSearch &&
                matchesRole &&
                matchesLocation &&
                matchesWorkMode &&
                matchesExperience &&
                matchesJobType &&
                matchesSalary
            );
        });

    }, [jobs, search, filters]);


    // ========================================================
    // SEARCH BUTTON
    // ========================================================

    const handleSearch = () => {

        setActiveTab("recommended");

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    };


    // ========================================================
    // CLEAR SEARCH
    // ========================================================

    const clearSearch = () => {
        setSearch("");
    };


    // ========================================================
    // RESET FILTERS
    // ========================================================

    const resetFilters = () => {

        setSearch("");

        setFilters({
            role: "Any Role",
            location: "Any Location",
            workMode: "Any Work Mode",
            experience: "Any Experience",
            jobType: "Any Job Type",
            salary: "Any Salary"
        });

        setActiveTab("recommended");

    };


    // ========================================================
    // SAVE / UNSAVE JOB
    // ========================================================

    const toggleSaveJob = (jobId) => {

        setSavedJobs((current) => {

            if (current.includes(jobId)) {

                return current.filter(
                    (id) => id !== jobId
                );

            }

            return [
                ...current,
                jobId
            ];

        });

    };


    // ========================================================
    // FILTER CHANGE
    // ========================================================

    const updateFilter = (
        name,
        value
    ) => {

        setFilters((current) => ({
            ...current,
            [name]: value
        }));

        setActiveTab("recommended");

    };


    // ========================================================
    // ADD JOB INPUT
    // ========================================================

    const updateNewJob = (
        name,
        value
    ) => {

        setNewJob((current) => ({
            ...current,
            [name]: value
        }));

    };


    // ========================================================
    // SAVE NEW JOB
    // ========================================================

    const handleAddJob = () => {

        if (
            !newJob.title.trim() ||
            !newJob.company.trim()
        ) {

            alert(
                "Please enter Job Title and Company."
            );

            return;
        }


        const createdJob = {

            id:
                Date.now(),

            title:
                newJob.title.trim(),

            company:
                newJob.company.trim(),

            location:
                newJob.location.trim() ||
                "Not specified",

            workMode:
                newJob.workMode,

            jobType:
                newJob.jobType,

            experience:
                newJob.experience,

            salary:
                newJob.salary.trim() ||
                "Not specified",

            posted:
                "Just now",

            match:
                0,

            skills:
                newJob.skills
                    .split(",")
                    .map((skill) =>
                        skill.trim()
                    )
                    .filter(Boolean),

            description:
                newJob.description.trim() ||
                "No description provided.",

            applyUrl:
                newJob.applyUrl.trim()
        };


        setJobs((current) => [
            createdJob,
            ...current
        ]);


        setShowAddJob(false);


        setNewJob({
            title: "",
            company: "",
            location: "",
            workMode: "Remote",
            jobType: "Full Time",
            experience: "0–2 years",
            salary: "",
            skills: "",
            description: "",
            applyUrl: ""
        });


        setActiveTab("recommended");

    };


    // ========================================================
    // APPLY JOB
    // ========================================================

    const handleApply = (job) => {

        setApplications((current) => {

            if (
                current.some(
                    (item) =>
                        item.id === job.id
                )
            ) {
                return current;
            }

            return [
                ...current,
                job
            ];

        });


        if (job.applyUrl) {

            window.open(
                job.applyUrl,
                "_blank",
                "noopener,noreferrer"
            );

        }

    };


    // ========================================================
    // VIEW ALL RECOMMENDED ROLES
    // ========================================================

    const handleViewAllRoles = () => {

        resetFilters();

    };


    // ========================================================
    // VIEW SKILL GAPS
    // ========================================================

    const handleSkillGaps = () => {

        window.location.href =
            "/skills";

    };


    // ========================================================
    // GET DISPLAY JOBS
    // ========================================================

    const displayJobs =
        activeTab === "saved"
            ? jobs.filter((job) =>
                savedJobs.includes(job.id)
            )
            : filteredJobs;


    // ========================================================
    // RENDER
    // ========================================================

    return (

        <div className="jobs-page">


            {/* ==================================================
                HEADER
            ================================================== */}

            <header className="jobs-header">

                <div className="jobs-header-content">

                    <div className="jobs-eyebrow">
                        CAREER OPPORTUNITIES
                    </div>

                    <h1>
                        Job Opportunities
                    </h1>

                    <p>
                        Find and track job opportunities
                        that match your skills and career goals.
                    </p>

                </div>


                <button
                    className="save-job-top-button"
                    onClick={() =>
                        setShowAddJob(true)
                    }
                    type="button"
                >

                    <span>
                        ＋
                    </span>

                    Save a Job

                </button>

            </header>


            {/* ==================================================
                SEARCH
            ================================================== */}

            <section className="job-search-panel">

                <div className="job-search-row">

                    <div className="job-search-box">

                        <span className="search-icon">
                            ⌕
                        </span>


                        <input
                            type="text"
                            placeholder="Search jobs, companies, skills..."
                            value={search}
                            onChange={(e) =>
                                setSearch(
                                    e.target.value
                                )
                            }
                            onKeyDown={(e) => {

                                if (
                                    e.key === "Enter"
                                ) {
                                    handleSearch();
                                }

                            }}
                        />


                        {search && (

                            <button
                                className="clear-search"
                                onClick={clearSearch}
                                type="button"
                            >
                                ×
                            </button>

                        )}

                    </div>


                    <button
                        className="search-button"
                        onClick={handleSearch}
                        type="button"
                    >

                        <span>
                            ⌕
                        </span>

                        Search Jobs

                    </button>

                </div>


                {/* ==================================================
                    FILTERS
                ================================================== */}

                <div className="job-filter-grid">

                    <Filter
                        label="Target Role"
                        value={filters.role}
                        options={[
                            "Any Role",
                            ...roleOptions
                        ]}
                        onChange={(value) =>
                            updateFilter(
                                "role",
                                value
                            )
                        }
                    />


                    <Filter
                        label="Location"
                        value={filters.location}
                        options={[
                            "Any Location",
                            "Bengaluru",
                            "Hyderabad",
                            "Pune",
                            "Mumbai",
                            "Delhi",
                            "Bhubaneswar",
                            "Remote"
                        ]}
                        onChange={(value) =>
                            updateFilter(
                                "location",
                                value
                            )
                        }
                    />


                    <Filter
                        label="Work Mode"
                        value={filters.workMode}
                        options={[
                            "Any Work Mode",
                            "Remote",
                            "Hybrid",
                            "On-site"
                        ]}
                        onChange={(value) =>
                            updateFilter(
                                "workMode",
                                value
                            )
                        }
                    />


                    <Filter
                        label="Experience"
                        value={filters.experience}
                        options={[
                            "Any Experience",
                            "0–2 years",
                            "0–3 years",
                            "1–3 years",
                            "3–5 years"
                        ]}
                        onChange={(value) =>
                            updateFilter(
                                "experience",
                                value
                            )
                        }
                    />


                    <Filter
                        label="Job Type"
                        value={filters.jobType}
                        options={[
                            "Any Job Type",
                            "Full Time",
                            "Internship",
                            "Contract"
                        ]}
                        onChange={(value) =>
                            updateFilter(
                                "jobType",
                                value
                            )
                        }
                    />


                    <Filter
                        label="Salary"
                        value={filters.salary}
                        options={[
                            "Any Salary",
                            "₹3–6 LPA",
                            "₹6–10 LPA",
                            "₹10–15 LPA",
                            "₹15+ LPA"
                        ]}
                        onChange={(value) =>
                            updateFilter(
                                "salary",
                                value
                            )
                        }
                    />

                </div>


                {/* RESET */}

                {(
                    search ||
                    filters.role !== "Full Stack Developer" ||
                    filters.location !== "Any Location" ||
                    filters.workMode !== "Any Work Mode" ||
                    filters.experience !== "Any Experience" ||
                    filters.jobType !== "Any Job Type" ||
                    filters.salary !== "Any Salary"
                ) && (

                    <button
                        className="reset-filters-button"
                        onClick={resetFilters}
                        type="button"
                    >
                        Reset all filters
                    </button>

                )}

            </section>


            {/* ==================================================
                MAIN CONTENT
            ================================================== */}

            <div className="jobs-content-grid">


                {/* ==================================================
                    MAIN
                ================================================== */}

                <main className="jobs-main">


                    {/* TABS */}

                    <div className="jobs-tabs">

                        <Tab
                            active={
                                activeTab ===
                                "recommended"
                            }
                            icon="✦"
                            label="Recommended"
                            count={
                                filteredJobs.length
                            }
                            onClick={() =>
                                setActiveTab(
                                    "recommended"
                                )
                            }
                        />


                        <Tab
                            active={
                                activeTab ===
                                "saved"
                            }
                            icon="♡"
                            label="Saved Jobs"
                            count={
                                savedJobs.length
                            }
                            onClick={() =>
                                setActiveTab(
                                    "saved"
                                )
                            }
                        />


                        <Tab
                            active={
                                activeTab ===
                                "applications"
                            }
                            icon="▣"
                            label="Applications"
                            count={
                                applications.length
                            }
                            onClick={() =>
                                setActiveTab(
                                    "applications"
                                )
                            }
                        />


                        <Tab
                            active={
                                activeTab ===
                                "interviews"
                            }
                            icon="◷"
                            label="Interviews"
                            count={
                                interviews.length
                            }
                            onClick={() =>
                                setActiveTab(
                                    "interviews"
                                )
                            }
                        />

                    </div>


                    {/* SECTION HEADER */}

                    <div className="jobs-section-header">

                        <div>

                            <h2>

                                {activeTab ===
                                "recommended"
                                    ? "Recommended for You"
                                    : activeTab ===
                                      "saved"
                                    ? "Saved Jobs"
                                    : activeTab ===
                                      "applications"
                                    ? "Applications"
                                    : "Interviews"}

                            </h2>


                            <p>

                                {activeTab ===
                                "recommended"
                                    ? "Opportunities based on your selected career filters."
                                    : activeTab ===
                                      "saved"
                                    ? "Jobs you saved for later."
                                    : activeTab ===
                                      "applications"
                                    ? "Jobs you have started applying to."
                                    : "Track interview opportunities here."}

                            </p>

                        </div>


                        <span className="results-count">

                            {activeTab ===
                            "saved"
                                ? displayJobs.length
                                : activeTab ===
                                  "applications"
                                ? applications.length
                                : activeTab ===
                                  "interviews"
                                ? interviews.length
                                : filteredJobs.length}

                            {" "}jobs

                        </span>

                    </div>


                    {/* ==================================================
                        APPLICATIONS
                    ================================================== */}

                    {activeTab ===
                        "applications" && (

                        applications.length ===
                        0 ? (

                            <EmptyState
                                title="No applications yet"
                                text="Click Apply Now on a job to track your application here."
                            />

                        ) : (

                            applications.map(
                                (job) => (

                                    <JobCard
                                        key={
                                            job.id
                                        }
                                        job={
                                            job
                                        }
                                        saved={
                                            savedJobs.includes(
                                                job.id
                                            )
                                        }
                                        onSave={() =>
                                            toggleSaveJob(
                                                job.id
                                            )
                                        }
                                        onView={() =>
                                            setShowDetails(
                                                job
                                            )
                                        }
                                    />

                                )
                            )

                        )
                    )}


                    {/* ==================================================
                        INTERVIEWS
                    ================================================== */}

                    {activeTab ===
                        "interviews" && (

                        <EmptyState
                            title="No interviews yet"
                            text="Interview opportunities will appear here when connected to your application workflow."
                        />

                    )}


                    {/* ==================================================
                        RECOMMENDED / SAVED
                    ================================================== */}

                    {(activeTab ===
                        "recommended" ||
                        activeTab ===
                        "saved") && (

                        displayJobs.length ===
                        0 ? (

                            <EmptyState
                                title={
                                    activeTab ===
                                    "saved"
                                        ? "No saved jobs"
                                        : "No matching jobs"
                                }
                                text={
                                    activeTab ===
                                    "saved"
                                        ? "Save jobs you are interested in and they will appear here."
                                        : "Try changing your filters or search terms."
                                }
                            />

                        ) : (

                            displayJobs.map(
                                (job) => (

                                    <JobCard
                                        key={
                                            job.id
                                        }
                                        job={
                                            job
                                        }
                                        saved={
                                            savedJobs.includes(
                                                job.id
                                            )
                                        }
                                        onSave={() =>
                                            toggleSaveJob(
                                                job.id
                                            )
                                        }
                                        onView={() =>
                                            setShowDetails(
                                                job
                                            )
                                        }
                                    />

                                )
                            )

                        )

                    )}

                </main>


                {/* ==================================================
                    RIGHT SIDEBAR
                ================================================== */}

                <aside className="jobs-sidebar">


                    {/* OVERVIEW */}

                    <div className="overview-card">

                        <div className="card-title-row">

                            <h3>
                                Your Job Search
                            </h3>

                            <span>
                                Last 30 days
                            </span>

                        </div>


                        <div className="overview-grid">

                            <MiniStat
                                icon="✦"
                                number={
                                    filteredJobs.length
                                }
                                label="Recommended"
                                type="blue"
                            />

                            <MiniStat
                                icon="♡"
                                number={
                                    savedJobs.length
                                }
                                label="Saved Jobs"
                                type="pink"
                            />

                            <MiniStat
                                icon="▣"
                                number={
                                    applications.length
                                }
                                label="Applied"
                                type="orange"
                            />

                            <MiniStat
                                icon="✓"
                                number={
                                    interviews.length
                                }
                                label="Interviews"
                                type="green"
                            />

                        </div>

                    </div>


                    {/* ROLE MATCHES */}

                    <div className="sidebar-card">

                        <div className="sidebar-card-header">

                            <div>

                                <div className="small-blue-icon">
                                    ✦
                                </div>

                                <h3>
                                    Recommended for You
                                </h3>

                            </div>


                            <button
                                type="button"
                                onClick={
                                    handleViewAllRoles
                                }
                            >
                                View All →
                            </button>

                        </div>


                        <RoleMatch
                            role="Full Stack Developer"
                            percentage={92}
                            onClick={() => {
                                updateFilter(
                                    "role",
                                    "Full Stack Developer"
                                );
                            }}
                        />

                        <RoleMatch
                            role="Backend Developer"
                            percentage={78}
                            onClick={() => {
                                updateFilter(
                                    "role",
                                    "Backend Developer"
                                );
                            }}
                        />

                        <RoleMatch
                            role="Frontend Developer"
                            percentage={72}
                            onClick={() => {
                                updateFilter(
                                    "role",
                                    "Frontend Developer"
                                );
                            }}
                        />

                        <RoleMatch
                            role="Software Engineer"
                            percentage={65}
                            onClick={() => {
                                updateFilter(
                                    "role",
                                    "Software Engineer"
                                );
                            }}
                        />

                        <RoleMatch
                            role="DevOps Engineer"
                            percentage={48}
                            onClick={() => {
                                updateFilter(
                                    "role",
                                    "DevOps Engineer"
                                );
                            }}
                        />

                    </div>


                    {/* SKILL GAP */}

                    <div className="skill-gap-card">

                        <div className="skill-gap-icon">
                            ◎
                        </div>

                        <h3>
                            Improve Your Job Matches
                        </h3>

                        <p>
                            Your profile can match
                            more opportunities by
                            improving relevant skills.
                        </p>

                        <button
                            type="button"
                            onClick={
                                handleSkillGaps
                            }
                        >
                            View Skill Gaps →
                        </button>

                    </div>

                </aside>

            </div>


            {/* ==================================================
                ADD JOB MODAL
            ================================================== */}

            {showAddJob && (

                <div
                    className="modal-overlay"
                    onClick={() =>
                        setShowAddJob(false)
                    }
                >

                    <div
                        className="job-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <div className="modal-header">

                            <div>

                                <h2>
                                    Save a Job
                                </h2>

                                <p>
                                    Add a job opportunity
                                    to your career workspace.
                                </p>

                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setShowAddJob(
                                        false
                                    )
                                }
                            >
                                ×
                            </button>

                        </div>


                        <div className="modal-form">


                            <label>
                                Job Title

                                <input
                                    value={
                                        newJob.title
                                    }
                                    onChange={(e) =>
                                        updateNewJob(
                                            "title",
                                            e.target.value
                                        )
                                    }
                                    placeholder="e.g. Full Stack Developer"
                                />

                            </label>


                            <label>
                                Company

                                <input
                                    value={
                                        newJob.company
                                    }
                                    onChange={(e) =>
                                        updateNewJob(
                                            "company",
                                            e.target.value
                                        )
                                    }
                                    placeholder="Company name"
                                />

                            </label>


                            <div className="modal-two-columns">

                                <label>
                                    Location

                                    <input
                                        value={
                                            newJob.location
                                        }
                                        onChange={(e) =>
                                            updateNewJob(
                                                "location",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Bhubaneswar / Remote"
                                    />

                                </label>


                                <label>
                                    Work Mode

                                    <select
                                        value={
                                            newJob.workMode
                                        }
                                        onChange={(e) =>
                                            updateNewJob(
                                                "workMode",
                                                e.target.value
                                            )
                                        }
                                    >

                                        <option>
                                            Remote
                                        </option>

                                        <option>
                                            Hybrid
                                        </option>

                                        <option>
                                            On-site
                                        </option>

                                    </select>

                                </label>

                            </div>


                            <div className="modal-two-columns">

                                <label>
                                    Job Type

                                    <select
                                        value={
                                            newJob.jobType
                                        }
                                        onChange={(e) =>
                                            updateNewJob(
                                                "jobType",
                                                e.target.value
                                            )
                                        }
                                    >

                                        <option>
                                            Full Time
                                        </option>

                                        <option>
                                            Internship
                                        </option>

                                        <option>
                                            Contract
                                        </option>

                                    </select>

                                </label>


                                <label>
                                    Experience

                                    <select
                                        value={
                                            newJob.experience
                                        }
                                        onChange={(e) =>
                                            updateNewJob(
                                                "experience",
                                                e.target.value
                                            )
                                        }
                                    >

                                        <option>
                                            0–2 years
                                        </option>

                                        <option>
                                            0–3 years
                                        </option>

                                        <option>
                                            1–3 years
                                        </option>

                                        <option>
                                            3–5 years
                                        </option>

                                    </select>

                                </label>

                            </div>


                            <label>
                                Salary

                                <input
                                    value={
                                        newJob.salary
                                    }
                                    onChange={(e) =>
                                        updateNewJob(
                                            "salary",
                                            e.target.value
                                        )
                                    }
                                    placeholder="₹6–10 LPA"
                                />

                            </label>


                            <label>
                                Required Skills

                                <input
                                    value={
                                        newJob.skills
                                    }
                                    onChange={(e) =>
                                        updateNewJob(
                                            "skills",
                                            e.target.value
                                        )
                                    }
                                    placeholder="React, Node.js, MongoDB"
                                />

                            </label>


                            <label>
                                Description

                                <textarea
                                    value={
                                        newJob.description
                                    }
                                    onChange={(e) =>
                                        updateNewJob(
                                            "description",
                                            e.target.value
                                        )
                                    }
                                    placeholder="Describe the job..."
                                    rows="4"
                                />

                            </label>


                            <label>
                                Apply URL

                                <input
                                    value={
                                        newJob.applyUrl
                                    }
                                    onChange={(e) =>
                                        updateNewJob(
                                            "applyUrl",
                                            e.target.value
                                        )
                                    }
                                    placeholder="https://company.com/jobs/..."
                                />

                            </label>


                            <div className="modal-actions">

                                <button
                                    className="cancel-button"
                                    type="button"
                                    onClick={() =>
                                        setShowAddJob(
                                            false
                                        )
                                    }
                                >
                                    Cancel
                                </button>


                                <button
                                    className="primary-button"
                                    type="button"
                                    onClick={
                                        handleAddJob
                                    }
                                >
                                    Save Job
                                </button>

                            </div>

                        </div>

                    </div>

                </div>

            )}


            {/* ==================================================
                DETAILS MODAL
            ================================================== */}

            {showDetails && (

                <div
                    className="modal-overlay"
                    onClick={() =>
                        setShowDetails(null)
                    }
                >

                    <div
                        className="job-details-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <div className="details-header">

                            <div className="company-logo-large">

                                {showDetails.company
                                    .charAt(0)
                                    .toUpperCase()}

                            </div>


                            <button
                                className="close-details"
                                type="button"
                                onClick={() =>
                                    setShowDetails(
                                        null
                                    )
                                }
                            >
                                ×
                            </button>

                        </div>


                        <h2>
                            {showDetails.title}
                        </h2>


                        <p className="details-company">
                            {showDetails.company}
                        </p>


                        <div className="details-meta">

                            <span>
                                📍 {showDetails.location}
                            </span>

                            <span>
                                💼 {showDetails.jobType}
                            </span>

                            <span>
                                🎓 {showDetails.experience}
                            </span>

                            <span>
                                💰 {showDetails.salary}
                            </span>

                            <span>
                                ◉ {showDetails.workMode}
                            </span>

                        </div>


                        <div className="match-box">

                            <div>

                                <span>
                                    Profile Match
                                </span>

                                <strong>
                                    {showDetails.match}%
                                </strong>

                            </div>


                            <div className="match-progress">

                                <span
                                    style={{
                                        width:
                                            `${showDetails.match}%`
                                    }}
                                />

                            </div>

                        </div>


                        <h3>
                            About this role
                        </h3>


                        <p className="details-description">
                            {showDetails.description}
                        </p>


                        <h3>
                            Required Skills
                        </h3>


                        <div className="details-skills">

                            {showDetails.skills.map(
                                (skill) => (

                                    <span
                                        key={skill}
                                    >
                                        {skill}
                                    </span>

                                )
                            )}

                        </div>


                        <div className="details-actions">

                            <button
                                className="save-details-button"
                                type="button"
                                onClick={() =>
                                    toggleSaveJob(
                                        showDetails.id
                                    )
                                }
                            >

                                {savedJobs.includes(
                                    showDetails.id
                                )
                                    ? "✓ Saved"
                                    : "♡ Save Job"}

                            </button>


                            <button
                                className="apply-button"
                                type="button"
                                onClick={() =>
                                    handleApply(
                                        showDetails
                                    )
                                }
                            >
                                Apply Now →
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
};


// ============================================================
// FILTER COMPONENT
// ============================================================

const Filter = ({
    label,
    value,
    options,
    onChange
}) => {

    return (

        <label className="filter-field">

            <span>
                {label}
            </span>


            <select
                value={value}
                onChange={(e) =>
                    onChange(
                        e.target.value
                    )
                }
            >

                {options.map(
                    (option) => (

                        <option
                            key={option}
                            value={option}
                        >
                            {option}
                        </option>

                    )
                )}

            </select>

        </label>

    );
};


// ============================================================
// TAB
// ============================================================

const Tab = ({
    active,
    icon,
    label,
    count,
    onClick
}) => {

    return (

        <button
            className={`job-tab ${
                active
                    ? "active"
                    : ""
            }`}
            onClick={onClick}
            type="button"
        >

            <span>
                {icon}
            </span>

            {label}

            <b>
                {count}
            </b>

        </button>

    );
};


// ============================================================
// JOB CARD
// ============================================================

const JobCard = ({
    job,
    saved,
    onSave,
    onView
}) => {

    return (

        <article className="job-card">

            <div className="company-logo">

                {job.company
                    .charAt(0)
                    .toUpperCase()}

            </div>


            <div className="job-card-content">


                <div className="job-card-top">

                    <div>

                        <h3>
                            {job.title}
                        </h3>

                        <div className="company-name">
                            {job.company}
                        </div>

                    </div>


                    <div className="job-match">

                        <strong>
                            {job.match > 0
                                ? `${job.match}% Match`
                                : "New Job"}
                        </strong>


                        <button
                            className={
                                saved
                                    ? "saved"
                                    : ""
                            }
                            onClick={onSave}
                            type="button"
                            title={
                                saved
                                    ? "Remove from saved"
                                    : "Save job"
                            }
                        >

                            {saved
                                ? "♥"
                                : "♡"}

                        </button>

                    </div>

                </div>


                <div className="job-meta">

                    <span>
                        📍 {job.location}
                    </span>

                    <span>
                        ▣ {job.workMode}
                    </span>

                    <span>
                        💼 {job.jobType}
                    </span>

                    <span>
                        👤 {job.experience}
                    </span>

                </div>


                <p className="job-description">
                    {job.description}
                </p>


                <div className="job-card-bottom">

                    <div className="job-skills">

                        {job.skills
                            .slice(0, 6)
                            .map(
                                (skill) => (

                                    <span
                                        key={skill}
                                    >
                                        {skill}
                                    </span>

                                )
                            )}

                    </div>


                    <div className="job-right">

                        <strong className="job-salary">
                            {job.salary}
                        </strong>

                        <span className="job-posted">
                            {job.posted}
                        </span>

                    </div>

                </div>


                <button
                    className="view-job-button"
                    onClick={onView}
                    type="button"
                >
                    View Details →
                </button>

            </div>

        </article>

    );
};


// ============================================================
// MINI STAT
// ============================================================

const MiniStat = ({
    icon,
    number,
    label,
    type
}) => {

    return (

        <div
            className={`mini-stat ${type}`}
        >

            <span>
                {icon}
            </span>

            <strong>
                {number}
            </strong>

            <small>
                {label}
            </small>

        </div>

    );
};


// ============================================================
// ROLE MATCH
// ============================================================

const RoleMatch = ({
    role,
    percentage,
    onClick
}) => {

    return (

        <button
            className="role-match role-match-button"
            onClick={onClick}
            type="button"
        >

            <div className="role-match-header">

                <span>
                    {role}
                </span>

                <strong>
                    {percentage}%
                </strong>

            </div>


            <div className="role-progress">

                <span
                    style={{
                        width:
                            `${percentage}%`
                    }}
                />

            </div>

        </button>

    );
};


// ============================================================
// EMPTY STATE
// ============================================================

const EmptyState = ({
    title,
    text
}) => {

    return (

        <div className="jobs-empty">

            <div className="empty-icon">
                ◫
            </div>

            <h3>
                {title}
            </h3>

            <p>
                {text}
            </p>

        </div>

    );
};


export default Jobs;