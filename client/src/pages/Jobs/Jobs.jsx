import { createPortal } from "react-dom";
import React, { useEffect, useMemo, useState } from "react";
import { getAllJobs, getJobById, getJobs } from "../../services/jobService";
import "./Jobs.css";

// Match the content query that hides the inline details pane, including tablets
// where the desktop sidebar leaves less room than the viewport suggests.
const usesCompactJobDetails = () => {
    const page = document.querySelector(".jobs-page:not(.jobs-dialog-portal)");
    if (page) return page.clientWidth <= 768;
    const zoom = document.documentElement.dataset;
    return zoom.appZoom === "on"
        ? zoom.appZoomCompact === "true"
        : window.matchMedia("(max-width: 768px)").matches;
};

const ROLE_CATEGORIES = [
    { label: "Software and IT", roles: ["Full Stack Developer", "Frontend Developer", "Backend Developer", "Software Engineer", "Java Developer", "Python Developer", "Mobile App Developer", "DevOps Engineer", "Cloud Engineer", "Cybersecurity Engineer"] },
    { label: "AI and Data", roles: ["Data Scientist", "Data Analyst", "Machine Learning Engineer", "AI Engineer", "Data Engineer", "Business Intelligence Analyst"] },
    { label: "Civil and Construction", roles: ["Civil Engineer", "Structural Engineer", "Site Engineer", "Construction Manager", "Quantity Surveyor", "Architect"] },
    { label: "Mechanical and Automotive", roles: ["Mechanical Engineer", "Automotive Engineer", "Production Engineer", "Manufacturing Engineer", "CAD Engineer"] },
    { label: "Electrical and Electronics", roles: ["Electrical Engineer", "Electronics Engineer", "Embedded Systems Engineer", "Robotics Engineer", "Instrumentation Engineer"] },
    { label: "Business and Finance", roles: ["Business Analyst", "Financial Analyst", "Accountant", "Marketing Executive", "Sales Executive", "Human Resources Specialist", "Project Manager"] },
    { label: "Healthcare and Life Sciences", roles: ["Doctor", "Nurse", "Pharmacist", "Medical Laboratory Technologist", "Biotechnologist"] },
    { label: "Education and Research", roles: ["Teacher", "Lecturer", "Research Assistant", "Professor"] },
    { label: "Design and Media", roles: ["UI/UX Designer", "Graphic Designer", "Product Designer", "Video Editor", "Content Writer"] },
    { label: "Other Fields", roles: ["Lawyer", "Supply Chain Analyst", "Logistics Manager", "Operations Manager", "Environmental Engineer", "Agricultural Engineer"] }
];

const ROLE_LEVEL_WORDS = new Set(["senior", "sr", "junior", "jr", "mid", "midlevel", "lead", "principal", "staff", "associate", "entry", "level", "i", "ii", "iii", "iv"]);
const ROLE_ALIASES = {
    "full stack developer": ["full stack engineer", "fullstack developer", "fullstack engineer", "full stack software engineer"],
    "frontend developer": ["front end developer", "frontend engineer", "front end engineer", "frontend software engineer"],
    "backend developer": ["back end developer", "backend engineer", "back end engineer", "backend software engineer"],
    "software engineer": ["software developer"],
    "java developer": ["java engineer", "java programmer"],
    "python developer": ["python engineer", "python programmer"],
    "mobile app developer": ["mobile application developer", "mobile app engineer", "mobile application engineer"],
    "devops engineer": ["devops developer"],
    "cloud engineer": ["cloud developer"],
    "cybersecurity engineer": ["cyber security engineer"],
    "ml engineer": ["machine learning developer", "ml developer"],
    "ai engineer": ["artificial intelligence engineer", "ai developer"],
    "bi analyst": ["business intelligence analyst"]
};
const JOB_TYPE_VALUES = {
    "Full Time": "full-time",
    "Part Time": "part-time",
    Internship: "internship",
    Contract: "contract"
};
const PAGE_SIZE = 12;
const MAX_JOB_OFFSET = 10000;
const MAX_SERVER_PAGE = Math.floor(MAX_JOB_OFFSET / PAGE_SIZE) + 1;
const SAVED_STORAGE_KEY = "aiCareerOS_savedJobIds";
const DEFAULT_FILTERS = {
    role: "Any Role",
    location: "Any Location",
    workMode: "Any Work Mode",
    experience: "Any Experience",
    jobType: "Any Job Type",
    salary: "Any Salary",
    skills: []
};
const readSavedJobIds = () => {
    try {
        const value = JSON.parse(localStorage.getItem(SAVED_STORAGE_KEY) || "[]");
        return Array.isArray(value) ? [...new Set(value.filter((id) => typeof id === "string"))].slice(-100) : [];
    } catch {
        return [];
    }
};

const normalizeRoleTitle = (value) => String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\bfront[ -]?end\b/g, "frontend")
    .replace(/\bback[ -]?end\b/g, "backend")
    .replace(/\bfullstack\b/g, "full stack")
    .replace(/\bcyber security\b/g, "cybersecurity")
    .replace(/\bmobile application\b/g, "mobile app")
    .replace(/\bmachine learning\b/g, "ml")
    .replace(/\bartificial intelligence\b/g, "ai")
    .replace(/\bbusiness intelligence\b/g, "bi")
    .replace(/\buser interface\b/g, "ui")
    .replace(/\buser experience\b/g, "ux")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const roleMatches = (title, selectedRole) => {
    const titleWords = new Set(normalizeRoleTitle(title).split(" ").filter((word) => word && !ROLE_LEVEL_WORDS.has(word)));
    const normalizedRole = normalizeRoleTitle(selectedRole);
    return [selectedRole, ...(ROLE_ALIASES[normalizedRole] || [])].some((candidate) => {
        const words = normalizeRoleTitle(candidate).split(" ").filter((word) => word && !ROLE_LEVEL_WORDS.has(word));
        return words.length > 0 && words.every((word) => titleWords.has(word));
    });
};

const normalizeLocation = (value) => String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\bbangalore\b/g, "bengaluru")
    .replace(/\bbhubaneshwar\b/g, "bhubaneswar")
    .replace(/\s+/g, " ")
    .trim();

const normalizeJobType = (value) => String(value || "").trim().toLowerCase().replace(/\s+/g, "-");
const formatJobType = (value) => ({
    "full-time": "Full Time",
    "part-time": "Part Time",
    internship: "Internship",
    contract: "Contract"
}[normalizeJobType(value)] || (value ? String(value) : "Not specified"));

const inferWorkMode = (job) => {
    const listingText = `${job.location || ""} ${job.description || ""}`.toLowerCase();
    if (/\b(remote|work from home|fully distributed|remote-first)\b/.test(listingText)) return { value: "Remote", inferred: true };
    if (/\bhybrid\b/.test(listingText)) return { value: "Hybrid", inferred: true };
    if (/on[ -]?site|in[ -]?office|office[ -]?based/.test(listingText)) return { value: "On-site", inferred: true };
    return { value: "Not specified", inferred: false };
};

const formatPostedDate = (createdAt) => {
    if (!createdAt) return "Date unavailable";
    const date = new Date(createdAt);
    return Number.isNaN(date.getTime()) ? "Date unavailable" : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
};

const normalizeJob = (job) => {
    const mode = inferWorkMode(job);
    return {
        ...job,
        id: String(job._id || job.id || ""),
        title: job.title || "Untitled role",
        company: job.company || "Company not specified",
        location: job.location || "Not specified",
        description: job.description || "",
        skills: Array.isArray(job.skills) ? job.skills.filter((skill) => typeof skill === "string" && skill.trim()) : [],
        jobTypeValue: normalizeJobType(job.jobType),
        jobType: formatJobType(job.jobType),
        experience: job.experienceLevel || "",
        salary: typeof job.salary === "string" ? job.salary.trim() : "",
        workMode: mode.value,
        workModeInferred: mode.inferred,
        posted: formatPostedDate(job.createdAt),
        applyUrl: job.applyUrl || ""
    };
};

const parseExperienceRange = (value) => {
    const text = String(value || "").toLowerCase().replace(/[–—]/g, "-").replace(/\byears?\b/g, "").trim();
    const range = text.match(/(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)/);
    if (range) return { min: Number(range[1]), max: Number(range[2]) };
    const open = text.match(/(\d+(?:\.\d+)?)\s*\+/);
    return open ? { min: Number(open[1]), max: Infinity } : null;
};

const experienceKey = (value) => {
    const range = parseExperienceRange(value);
    return range ? `${range.min}-${range.max}` : String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
};

const matchesExperience = (jobValue, selectedValue) => {
    const jobRange = parseExperienceRange(jobValue);
    const selectedRange = parseExperienceRange(selectedValue);
    if (jobRange && selectedRange) return jobRange.min <= selectedRange.max && selectedRange.min <= jobRange.max;
    return experienceKey(jobValue) === experienceKey(selectedValue);
};

const parseSalaryLpa = (value) => {
    const text = String(value || "").toLowerCase().replace(/,/g, "").replace(/[–—]/g, "-");
    if (!/\blpa\b|\blakh(?:s)?\b/.test(text)) return null;
    const values = [...text.matchAll(/\d+(?:\.\d+)?/g)].map((match) => Number(match[0]));
    return values.length > 1 ? { min: values[0], max: values[1] } : values.length === 1 ? { min: values[0], max: values[0] } : null;
};

const matchesSalary = (value, selected) => {
    if (selected === "Any Salary") return true;
    const range = parseSalaryLpa(value);
    if (!range) return false;
    if (selected === "Under ₹5 LPA") return range.min < 5;
    if (selected === "₹5–10 LPA") return range.max >= 5 && range.min <= 10;
    if (selected === "₹10–20 LPA") return range.max >= 10 && range.min <= 20;
    if (selected === "₹20+ LPA") return range.max >= 20;
    return false;
};

const getSafeApplyUrl = (value) => {
    try {
        const url = new URL(value);
        if (!["http:", "https:"].includes(url.protocol)) return "";
        if (url.hostname === "example.com" || url.hostname.endsWith(".example.com")) return "";
        return url.href;
    } catch {
        return "";
    }
};

const sortJobs = (jobs, order) => {
    const sorted = [...jobs];
    if (order === "title") return sorted.sort((a, b) => a.title.localeCompare(b.title));
    if (order === "salary-high" || order === "salary-low") {
        return sorted.sort((a, b) => {
            const aRange = parseSalaryLpa(a.salary);
            const bRange = parseSalaryLpa(b.salary);
            if (!aRange && !bRange) return 0;
            if (!aRange) return 1;
            if (!bRange) return -1;
            const aValue = (aRange.min + aRange.max) / 2;
            const bValue = (bRange.min + bRange.max) / 2;
            return order === "salary-high" ? bValue - aValue : aValue - bValue;
        });
    }
    return sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
};

const filterJobs = (jobs, { search, filters }) => {
    const query = search.trim().toLocaleLowerCase();
    return jobs.filter((job) => {
        const searchable = [job.title, job.company, job.location, job.description, ...job.skills].join(" ").toLocaleLowerCase();
        const location = normalizeLocation(job.location);
        const locationFilter = normalizeLocation(filters.location);
        return (!query || searchable.includes(query)) &&
            (filters.role === "Any Role" || roleMatches(job.title, filters.role)) &&
            (filters.location === "Any Location" || location.includes(locationFilter) || (locationFilter === "remote" && job.workMode === "Remote")) &&
            (filters.workMode === "Any Work Mode" || job.workMode === filters.workMode) &&
            (filters.experience === "Any Experience" || matchesExperience(job.experience, filters.experience)) &&
            (filters.jobType === "Any Job Type" || job.jobTypeValue === JOB_TYPE_VALUES[filters.jobType]) &&
            (filters.skills.length === 0 || filters.skills.some((skill) => job.skills.some((jobSkill) => jobSkill.toLowerCase() === skill.toLowerCase()))) &&
            matchesSalary(job.salary, filters.salary);
    });
};

const Jobs = () => {
    const [jobs, setJobs] = useState([]);
    const [apiPagination, setApiPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, pages: 1 });
    const [jobsLoading, setJobsLoading] = useState(true);
    const [jobsError, setJobsError] = useState("");
    const [jobsComplete, setJobsComplete] = useState(true);
    const [reloadJobs, setReloadJobs] = useState(0);
    const [page, setPage] = useState(1);
    const [searchDraft, setSearchDraft] = useState("");
    const [activeSearch, setActiveSearch] = useState("");
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [sortOrder, setSortOrder] = useState("newest");
    const [savedIds, setSavedIds] = useState(readSavedJobIds);
    const [savedStorageError, setSavedStorageError] = useState("");
    const [savedRecords, setSavedRecords] = useState([]);
    const [savedLoading, setSavedLoading] = useState(false);
    const [savedError, setSavedError] = useState("");
    const [savedRetry, setSavedRetry] = useState(0);
    const [activeTab, setActiveTab] = useState("jobs");
    const [selectedJobId, setSelectedJobId] = useState("");
    const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [discoveredTitles, setDiscoveredTitles] = useState([]);
    const [discoveredLocations, setDiscoveredLocations] = useState([]);
    const [discoveredExperience, setDiscoveredExperience] = useState([]);
    const [discoveredSkills, setDiscoveredSkills] = useState([]);

    useEffect(() => {
        try {
            localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(savedIds));
            setSavedStorageError("");
        } catch {
            setSavedStorageError("Saved-job changes could not be stored in this browser. They are available for this session only and may be lost on refresh.");
        }
    }, [savedIds]);

    const hasClientFilters = Boolean(
        activeSearch || filters.role !== DEFAULT_FILTERS.role || filters.location !== DEFAULT_FILTERS.location ||
        filters.workMode !== DEFAULT_FILTERS.workMode || filters.experience !== DEFAULT_FILTERS.experience ||
        filters.salary !== DEFAULT_FILTERS.salary || filters.skills.length > 0 || sortOrder !== "newest"
    );
    const requestedType = filters.jobType === "Any Job Type" ? undefined : JOB_TYPE_VALUES[filters.jobType];
    const requestKey = hasClientFilters
        ? JSON.stringify({ search: activeSearch, filters, sortOrder })
        : `${requestedType || "all"}:${page}`;
    const requestConfig = useMemo(() => ({ hasClientFilters, page, requestedType }), [hasClientFilters, page, requestedType]);

    useEffect(() => {
        if (activeTab === "saved") {
            setJobsLoading(false);
            return undefined;
        }
        const controller = new AbortController();
        setJobsLoading(true);
        setJobsError("");
        const request = requestConfig.hasClientFilters
            ? getAllJobs({ type: requestConfig.requestedType, signal: controller.signal })
            : getJobs({ page: requestConfig.page, limit: PAGE_SIZE, type: requestConfig.requestedType, signal: controller.signal });

        request.then((result) => {
            if (controller.signal.aborted) return;
            const received = requestConfig.hasClientFilters ? result.jobs : result.data;
            if (!Array.isArray(received)) throw new Error("The jobs API returned an invalid response.");
            const normalized = received.map(normalizeJob);
            setJobs(normalized);
            setDiscoveredTitles((current) => [...new Set([...current, ...normalized.map((job) => job.title).filter(Boolean)])]);
            setDiscoveredLocations((current) => [...new Set([...current, ...normalized.map((job) => job.location).filter((location) => location && location !== "Not specified")])]);
            setDiscoveredExperience((current) => [...new Set([...current, ...normalized.map((job) => job.experience).filter(Boolean)])]);
            setDiscoveredSkills((current) => [...new Set([...current, ...normalized.flatMap((job) => job.skills)])].sort((a, b) => a.localeCompare(b)));
            if (requestConfig.hasClientFilters) {
                setApiPagination({ page: 1, limit: PAGE_SIZE, total: result.total ?? normalized.length, pages: Math.max(1, Math.ceil(normalized.length / PAGE_SIZE)) });
                setJobsComplete(result.isComplete);
            } else {
                setApiPagination(result.pagination || { page, limit: PAGE_SIZE, total: normalized.length, pages: 1 });
                setJobsComplete(true);
            }
        }).catch((error) => {
            if (controller.signal.aborted) return;
            setJobs([]);
            setJobsError(error.message || "Unable to load job listings.");
        }).finally(() => {
            if (!controller.signal.aborted) setJobsLoading(false);
        });

        return () => controller.abort();
    }, [requestKey, requestConfig, reloadJobs, activeTab]);

    useEffect(() => {
        if (activeTab !== "saved") return undefined;
        let active = true;
        setSavedLoading(true);
        setSavedError("");
        if (savedIds.length === 0) {
            setSavedRecords([]);
            setSavedLoading(false);
            return undefined;
        }
        Promise.allSettled(savedIds.map((id) => getJobById(id)))
            .then((results) => {
                if (!active) return;
                const valid = results.filter((item) => item.status === "fulfilled" && item.value?.data).map((item) => normalizeJob(item.value.data));
                setSavedRecords(valid);
                if (valid.length !== savedIds.length) setSavedError("Some saved listings are no longer available from the jobs API.");
            })
            .catch(() => {
                if (active) setSavedError("Saved listings could not be loaded.");
            })
            .finally(() => { if (active) setSavedLoading(false); });
        return () => { active = false; };
    }, [activeTab, savedIds, savedRetry]);

    useEffect(() => {
        const closeOnEscape = (event) => {
            if (event.key === "Escape") {
                setMobileDetailsOpen(false);
                setFiltersOpen(false);
            }
        };
        window.addEventListener("keydown", closeOnEscape);
        return () => window.removeEventListener("keydown", closeOnEscape);
    }, []);

    // Details live outside the panning canvas so they remain viewport-sized.
    useEffect(() => {
        if (!mobileDetailsOpen) return undefined;
        const dialog = document.querySelector(".jobs-dialog-portal [role='dialog']");
        if (!dialog) return undefined;
        const opener = document.activeElement;
        const canvas = document.querySelector(".jobs-desktop-scroll");
        const previousInert = canvas?.inert;
        const previousOverflow = document.body.style.overflow;
        if (canvas) canvas.inert = true;
        document.body.style.overflow = "hidden";
        const controls = () => [...dialog.querySelectorAll("button, a[href], input, select, textarea")]
            .filter(element => !element.disabled && element.getClientRects().length > 0);
        controls()[0]?.focus();
        const containFocus = event => {
            if (event.key !== "Tab") return;
            const items = controls();
            const index = items.indexOf(document.activeElement);
            if (event.shiftKey && index <= 0) {
                event.preventDefault();
                items.at(-1)?.focus();
            } else if (!event.shiftKey && (index < 0 || index === items.length - 1)) {
                event.preventDefault();
                items[0]?.focus();
            }
        };
        const closeOnDesktop = () => {
            if (!usesCompactJobDetails()) setMobileDetailsOpen(false);
        };
        document.addEventListener("keydown", containFocus);
        window.addEventListener("resize", closeOnDesktop);
        return () => {
            document.removeEventListener("keydown", containFocus);
            window.removeEventListener("resize", closeOnDesktop);
            if (canvas) canvas.inert = previousInert;
            document.body.style.overflow = previousOverflow;
            if (opener?.isConnected) opener.focus();
        };
    }, [mobileDetailsOpen]);

    const roleOptions = useMemo(() => {
        const predefined = new Set(ROLE_CATEGORIES.flatMap((category) => category.roles).map(normalizeRoleTitle));
        const additional = [...new Map(discoveredTitles.map((title) => [normalizeRoleTitle(title), title])).values()]
            .filter((title) => !predefined.has(normalizeRoleTitle(title)));
        return [...ROLE_CATEGORIES, ...(additional.length ? [{ label: "Titles in listings", roles: additional }] : [])];
    }, [discoveredTitles]);

    const locationOptions = useMemo(() => {
        const items = new Map();
        for (const raw of discoveredLocations) {
            const label = String(raw || "").trim();
            const key = normalizeLocation(label);
            if (!label || label === "Not specified" || items.has(key)) continue;
            items.set(key, { label, value: label });
        }
        return [{ label: "Any Location", value: "Any Location" }, ...items.values()];
    }, [discoveredLocations]);

    const experienceOptions = useMemo(() => {
        const options = ["0–2 years", "1–3 years", "3–5 years", "5+ years"];
        const keys = new Set(options.map((value) => experienceKey(value)));
        for (const value of discoveredExperience) {
            if (value && !keys.has(experienceKey(value))) {
                keys.add(experienceKey(value));
                options.push(value);
            }
        }
        return ["Any Experience", ...options];
    }, [discoveredExperience]);

    const visiblePool = useMemo(() => {
        const source = activeTab === "saved" ? savedRecords : jobs;
        const matched = filterJobs(source, { search: activeSearch, filters });
        return sortJobs(matched, sortOrder);
    }, [activeTab, savedRecords, jobs, activeSearch, filters, sortOrder]);

    const clientPaginated = hasClientFilters || activeTab === "saved";
    const totalResults = clientPaginated ? visiblePool.length : apiPagination.total;
    const pageCount = clientPaginated
        ? Math.max(1, Math.ceil(visiblePool.length / PAGE_SIZE))
        : Math.min(MAX_SERVER_PAGE, Math.max(1, apiPagination.pages || 1));
    const pageJobs = clientPaginated ? visiblePool.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) : visiblePool;
    const selectedJob = pageJobs.find((job) => job.id === selectedJobId) || pageJobs[0] || null;

    useEffect(() => {
        if (page > pageCount) setPage(pageCount);
    }, [page, pageCount]);

    useEffect(() => {
        if (pageJobs.length && !pageJobs.some((job) => job.id === selectedJobId)) setSelectedJobId(pageJobs[0].id);
        if (!pageJobs.length && selectedJobId) setSelectedJobId("");
    }, [pageJobs, selectedJobId]);

    const activeFilterCount = [
        activeSearch,
        filters.role !== DEFAULT_FILTERS.role,
        filters.location !== DEFAULT_FILTERS.location,
        filters.workMode !== DEFAULT_FILTERS.workMode,
        filters.experience !== DEFAULT_FILTERS.experience,
        filters.jobType !== DEFAULT_FILTERS.jobType,
        filters.salary !== DEFAULT_FILTERS.salary,
        filters.skills.length > 0
    ].filter(Boolean).length;

    const updateFilter = (name, value) => {
        setFilters((current) => ({ ...current, [name]: value }));
        setPage(1);
        setActiveTab("jobs");
    };

    const resetFilters = () => {
        setSearchDraft("");
        setActiveSearch("");
        setFilters(DEFAULT_FILTERS);
        setSortOrder("newest");
        setPage(1);
        setActiveTab("jobs");
        setFiltersOpen(false);
    };

    const toggleSave = (job) => {
        setSavedIds((current) => current.includes(job.id) ? current.filter((id) => id !== job.id) : [...current, job.id].slice(-100));
    };

    const searchJobs = (event) => {
        event.preventDefault();
        setActiveSearch(searchDraft.trim());
        setPage(1);
        setActiveTab("jobs");
    };

    const clearSearch = () => {
        setSearchDraft("");
        setActiveSearch("");
        setPage(1);
    };

    const openDetails = (job) => {
        setSelectedJobId(job.id);
        if (usesCompactJobDetails()) {
            setMobileDetailsOpen(true);
        }
    };

    const toggleSkill = (skill) => {
        setFilters((current) => ({
            ...current,
            skills: current.skills.includes(skill)
                ? current.skills.filter((item) => item !== skill)
                : [...current.skills, skill]
        }));
        setPage(1);
        setActiveTab("jobs");
    };

    const resetAll = () => {
        setPage(1);
        setActiveSearch("");
        setSearchDraft("");
        setFilters(DEFAULT_FILTERS);
        setSortOrder("newest");
        setFiltersOpen(false);
    };

    const companiesInView = new Set(pageJobs.map((job) => job.company).filter(Boolean)).size;
    const locationsInView = new Set(pageJobs.map((job) => job.location).filter((location) => location && location !== "Not specified")).size;

    const dataNote = !jobsComplete && !jobsLoading && !jobsError
        ? `Fetched ${jobs.length}${apiPagination.total ? ` of ${apiPagination.total} API-reported records` : " listings"}; the API pagination limit prevented confirming that every record was loaded.`
        : !clientPaginated && apiPagination.pages > MAX_SERVER_PAGE
            ? `The API reports ${apiPagination.total.toLocaleString()} listings. Browsing is limited to the first ${MAX_SERVER_PAGE} pages by the server offset limit; use filters to narrow results.`
            : "";

    return (
        <div className="jobs-page">
            <div className="jobs-shell">
                <nav className="jobs-workspace-nav" aria-label="Jobs workspace">
                    <div className="workspace-crumb"><span className="workspace-brand-mark">A</span><span>Career workspace</span><b>/</b><strong>Jobs</strong></div>
                    <span className="workspace-api-status"><i aria-hidden="true" /> Connected listings</span>
                </nav>

                <section className="jobs-hero">
                    <div className="hero-copy">
                        <span className="jobs-eyebrow">CAREER OPPORTUNITIES</span>
                        <h1>Find Your Next Opportunity</h1>
                        <p>Explore roles from the AI Career OS jobs database and find a position that fits your next move.</p>
                    </div>
                    <form className="job-search-row" onSubmit={searchJobs} role="search">
                        <span className="search-icon" aria-hidden="true">⌕</span>
                        <label className="sr-only" htmlFor="jobs-keyword-search">Search jobs by title, company, skills, location, or description</label>
                        <input id="jobs-keyword-search" type="search" value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} placeholder="Search job title, company, skills, or keyword" />
                        {searchDraft && <button type="button" className="clear-search" onClick={clearSearch} aria-label="Clear search">×</button>}
                        <button className="search-button" type="submit"><span aria-hidden="true">⌕</span> Search jobs</button>
                    </form>
                    <div className="hero-stats" aria-live="polite">
                        <Stat label="Job listings" value={jobsLoading ? "—" : jobsError ? "—" : totalResults.toLocaleString()} />
                        <Stat label="Companies on page" value={jobsLoading || jobsError ? "—" : companiesInView.toLocaleString()} />
                        <Stat label="Locations on page" value={jobsLoading || jobsError ? "—" : locationsInView.toLocaleString()} />
                    </div>
                </section>

                {savedStorageError && <p className="jobs-data-note" role="alert">{savedStorageError}</p>}
                {dataNote && <p className="jobs-data-note" role="status">{dataNote}</p>}

                <div className="jobs-mobile-toolbar">
                    <button type="button" className="mobile-filter-toggle" aria-expanded={filtersOpen} onClick={() => setFiltersOpen((open) => !open)}><span aria-hidden="true">☷</span> Filters {activeFilterCount > 0 && <b>{activeFilterCount}</b>}</button>
                    <span>{jobsLoading || savedLoading ? "Loading listings…" : jobsError && activeTab === "jobs" ? "Listing count unavailable" : `${totalResults.toLocaleString()} ${totalResults === 1 ? "listing" : "listings"}`}</span>
                </div>

                {filtersOpen && <button type="button" className="filter-drawer-backdrop" aria-label="Close filters" onClick={() => setFiltersOpen(false)} />}

                <div className="jobs-workspace">
                    <aside className={`job-filter-sidebar${filtersOpen ? " is-open" : ""}`} aria-label="Job filters">
                        <div className="filter-sidebar-heading"><div><span className="panel-kicker">REFINE RESULTS</span><h2>Filters</h2></div><button type="button" className="reset-all-button" onClick={resetFilters}>Reset all</button></div>
                        <div className="filter-sidebar-content">
                            <Filter label="Target role" value={filters.role} options={["Any Role", ...roleOptions]} onChange={(value) => updateFilter("role", value)} />
                            <Filter label="Location" value={filters.location} options={locationOptions} onChange={(value) => updateFilter("location", value)} />
                            <Filter label="Work mode" value={filters.workMode} options={["Any Work Mode", "Remote", "Hybrid", "On-site", "Not specified"]} onChange={(value) => updateFilter("workMode", value)} />
                            <Filter label="Experience" value={filters.experience} options={experienceOptions} onChange={(value) => updateFilter("experience", value)} />
                            <Filter label="Job type" value={filters.jobType} options={["Any Job Type", ...Object.keys(JOB_TYPE_VALUES)]} onChange={(value) => updateFilter("jobType", value)} />
                            <Filter label="Salary range" value={filters.salary} options={["Any Salary", "Under ₹5 LPA", "₹5–10 LPA", "₹10–20 LPA", "₹20+ LPA"]} onChange={(value) => updateFilter("salary", value)} />
                            <fieldset className="skills-filter">
                                <legend>Skills</legend>
                                {discoveredSkills.length ? <div className="skills-filter-list">{discoveredSkills.map((skill) => <label key={skill}><input type="checkbox" checked={filters.skills.includes(skill)} onChange={() => toggleSkill(skill)} /><span>{skill}</span></label>)}</div> : <p className="filter-hint">Skills appear here when listings include them.</p>}
                                {filters.skills.length > 0 && <button className="clear-skills-button" type="button" onClick={() => setFilters((current) => ({ ...current, skills: [] }))}>Clear skills</button>}
                            </fieldset>
                        </div>
                        <div className="filter-sidebar-footer"><span>{activeFilterCount ? `${activeFilterCount} active ${activeFilterCount === 1 ? "filter" : "filters"}` : "All listings"}</span>{activeFilterCount > 0 && <button type="button" onClick={resetFilters}>Clear filters</button>}</div>
                    </aside>

                    <section className="jobs-results-column" aria-label="Job results">
                        <div className="results-toolbar">
                            <div className="jobs-tabs" aria-label="Job listing view">
                                <button type="button" aria-pressed={activeTab === "jobs"} className={activeTab === "jobs" ? "active" : ""} onClick={() => { setActiveTab("jobs"); setPage(1); }}>All Jobs</button>
                                <button type="button" aria-pressed={activeTab === "saved"} className={activeTab === "saved" ? "active" : ""} onClick={() => { setActiveTab("saved"); setPage(1); }}>Saved <span>{savedIds.length}</span></button>
                            </div>
                            <JobSort value={sortOrder} onChange={(value) => { setSortOrder(value); setPage(1); }} />
                        </div>
                        <div className="results-heading-row"><div><h2>{activeTab === "saved" ? "Saved jobs" : "Open opportunities"}</h2><p>{activeTab === "saved" ? savedStorageError ? "Session-only saved jobs; browser storage is unavailable. Applications are not tracked." : "Saved privately in this browser; applications are not tracked." : "Select a listing to see its full details."}</p></div><span className="result-total">{jobsLoading || savedLoading ? "Loading…" : jobsError && activeTab === "jobs" ? "Count unavailable" : `${totalResults.toLocaleString()} results`}</span></div>

                        {activeTab === "saved" && savedLoading ? <JobSkeletons /> : jobsLoading ? <JobSkeletons /> : activeTab === "saved" && savedError ? (
                            <div className="jobs-state" role="alert"><h3>Saved listings could not be fully loaded</h3><p>{savedError}</p><div className="state-actions"><button className="primary-button" type="button" onClick={() => setSavedRetry((count) => count + 1)}>Retry saved jobs</button><button className="secondary-button" type="button" onClick={() => setActiveTab("jobs")}>Return to job search</button></div></div>
                        ) : jobsError && activeTab === "jobs" ? (
                            <div className="jobs-state" role="alert"><span className="state-icon">!</span><h3>Could not load job listings</h3><p>{jobsError}</p><button className="primary-button" type="button" onClick={() => setReloadJobs((count) => count + 1)}>Retry</button></div>
                        ) : pageJobs.length === 0 ? (
                            <div className="jobs-state"><span className="state-icon">⌕</span><h3>{activeTab === "saved" ? "No saved jobs" : jobs.length === 0 ? "No listings available" : "No matching jobs"}</h3><p>{activeTab === "saved" ? "Save a listing to find it here later in this browser." : jobs.length === 0 ? "The API returned no job records." : "Adjust your keywords or filters to broaden the search."}</p>{(activeFilterCount > 0 || activeTab === "saved") && <button className="secondary-button" type="button" onClick={activeTab === "saved" ? () => setActiveTab("jobs") : resetAll}>{activeTab === "saved" ? "Browse jobs" : "Reset all filters"}</button>}</div>
                        ) : (
                            <>
                                <div className="job-list" aria-live="polite">
                                    {pageJobs.map((job) => <JobCard key={job.id} job={job} saved={savedIds.includes(job.id)} selected={selectedJob?.id === job.id} onSelect={() => setSelectedJobId(job.id)} onDetails={() => openDetails(job)} onSave={() => toggleSave(job)} />)}
                                </div>
                                <Pagination page={page} pageCount={pageCount} total={totalResults} pageSize={PAGE_SIZE} onChange={(nextPage) => { setPage(nextPage); if (!hasClientFilters) window.scrollTo({ top: 0, behavior: "smooth" }); }} />
                            </>
                        )}
                    </section>

                    <aside className="job-details-column" aria-label="Selected job details">
                        <JobDetails job={selectedJob} saved={Boolean(selectedJob && savedIds.includes(selectedJob.id))} onSave={() => selectedJob && toggleSave(selectedJob)} />
                    </aside>
                </div>

                <footer className="jobs-page-note">Listing information and application links come from the jobs API. Work mode labels inferred from listing text are marked as inferred. Applications are not tracked.</footer>

                {mobileDetailsOpen && selectedJob && createPortal(<div className="jobs-page jobs-dialog-portal"><div className="mobile-details-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setMobileDetailsOpen(false); }}><div className="mobile-details-dialog" role="dialog" aria-modal="true" aria-label={`${selectedJob.title} details`}><div className="mobile-dialog-header"><span>JOB DETAILS</span><button type="button" aria-label="Close details" onClick={() => setMobileDetailsOpen(false)}>×</button></div><JobDetails job={selectedJob} saved={savedIds.includes(selectedJob.id)} onSave={() => toggleSave(selectedJob)} /></div></div></div>, document.body)}
            </div>
        </div>
    );
};

const SORT_OPTIONS = [
    { label: "Newest first", value: "newest" },
    { label: "Salary: high to low", value: "salary-high" },
    { label: "Salary: low to high", value: "salary-low" },
    { label: "Title: A to Z", value: "title" },
];

const JobSort = ({ value, onChange }) => (
    <details className="jobs-sort-control">
        <summary><span>Sort: {SORT_OPTIONS.find((option) => option.value === value)?.label || "Newest first"}</span><span aria-hidden="true">⌄</span></summary>
        <div className="jobs-sort-options" role="group" aria-label="Sort job listings">
            {SORT_OPTIONS.map((option) => <button key={option.value} type="button" aria-pressed={value === option.value} onClick={(event) => {
                onChange(option.value);
                const control = event.currentTarget.closest("details");
                control.open = false;
                control.querySelector("summary").focus();
            }}><span>{option.label}</span>{value === option.value && <span aria-hidden="true">✓</span>}</button>)}
        </div>
    </details>
);

const Filter = ({ label, value, options, onChange }) => (
    <label className="filter-field"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => {
            if (typeof option === "string") return <option key={option} value={option}>{option}</option>;
            if (option.roles) return <optgroup key={option.label} label={option.label}>{option.roles.map((role) => <option key={role} value={role}>{role}</option>)}</optgroup>;
            return <option key={option.value} value={option.value}>{option.label}</option>;
        })}
    </select></label>
);

const Stat = ({ label, value }) => <div className="hero-stat"><strong>{value}</strong><span>{label}</span></div>;

const JobCard = ({ job, saved, selected, onSelect, onDetails, onSave }) => {
    const applyUrl = getSafeApplyUrl(job.applyUrl);
    return <article className={`job-card${selected ? " selected" : ""}`} onClick={onSelect}>
        <div className="job-card-topline"><div className="company-mark" aria-hidden="true">{job.company.charAt(0).toUpperCase()}</div><div className="job-card-title-wrap"><button className="job-title-button" type="button" onClick={(event) => { event.stopPropagation(); onDetails(); }}>{job.title}</button><p className="company-name">{job.company}</p></div><button className={`save-button${saved ? " saved" : ""}`} type="button" aria-label={saved ? `Unsave ${job.title} at ${job.company}` : `Save ${job.title} at ${job.company}`} aria-pressed={saved} onClick={(event) => { event.stopPropagation(); onSave(); }}>{saved ? "♥" : "♡"}</button></div>
        <div className="job-card-meta"><span>{job.location}</span>{job.jobType !== "Not specified" && <span>{job.jobType}</span>}{job.experience && <span>{job.experience}</span>}{job.workMode !== "Not specified" && <span title="Inferred from listing text; not independently verified">{job.workMode}{job.workModeInferred ? " · inferred" : ""}</span>}</div>
        <p className="job-card-description">{job.description || "Description not provided."}</p>
        {job.skills.length > 0 && <div className="job-skills">{job.skills.slice(0, 5).map((skill) => <span key={skill}>{skill}</span>)}{job.skills.length > 5 && <span className="skills-more">+{job.skills.length - 5}</span>}</div>}
        <div className="job-card-footer"><div className="job-card-salary">{job.salary || <span className="unknown-value">Salary not provided</span>}<small>Posted {job.posted}</small></div><div className="job-card-actions"><button type="button" className="details-button" onClick={(event) => { event.stopPropagation(); onDetails(); }}>View details</button>{applyUrl && <a href={applyUrl} target="_blank" rel="noopener noreferrer" className="apply-button" onClick={(event) => event.stopPropagation()}>Apply ↗</a>}</div></div>
    </article>;
};

const JobDetails = ({ job, saved, onSave }) => {
    if (!job) return <div className="details-empty"><span aria-hidden="true">↖</span><h2>Select a job</h2><p>Choose a listing to view its details here.</p></div>;
    const applyUrl = getSafeApplyUrl(job.applyUrl);
    return <div className="details-content">
        <div className="details-title-row"><div className="company-mark large" aria-hidden="true">{job.company.charAt(0).toUpperCase()}</div><div><span className="details-eyebrow">JOB DETAILS</span><h2>{job.title}</h2><p>{job.company}</p></div></div>
        <div className="details-meta"><span>{job.location}</span>{job.workMode !== "Not specified" && <span title="Inferred from listing text; not independently verified">{job.workMode}{job.workModeInferred ? " · inferred" : ""}</span>}{job.jobType !== "Not specified" && <span>{job.jobType}</span>}{job.experience && <span>{job.experience}</span>}{job.salary && <span>{job.salary}</span>}<span>Posted {job.posted}</span></div>
        <div className="details-actions"><button className={`details-save${saved ? " saved" : ""}`} type="button" aria-pressed={saved} onClick={onSave}>{saved ? "♥ Saved" : "♡ Save job"}</button>{applyUrl ? <a className="apply-button details-apply" href={applyUrl} target="_blank" rel="noopener noreferrer">Apply Now ↗</a> : <button className="apply-button details-apply apply-disabled" type="button" disabled>Apply Now</button>}</div>
        <section className="details-section"><h3>Description</h3><p>{job.description || "Not provided in this listing."}</p></section>
        <section className="details-section"><h3>Required skills</h3>{job.skills.length ? <div className="job-skills detail-skills">{job.skills.map((skill) => <span key={skill}>{skill}</span>)}</div> : <p>Skills were not provided in this listing.</p>}</section>
        {(job.experience || job.salary) && <section className="details-section"><h3>Experience and compensation</h3><p>{[job.experience && `Experience: ${job.experience}`, job.salary && `Salary: ${job.salary}`].filter(Boolean).join(" · ")}</p></section>}
        <section className="details-section application-instructions"><h3>Application</h3><p>{applyUrl ? "Continue using the employer link provided with this listing. Application progress is not tracked in AI Career OS." : "Application link unavailable for this listing."}</p></section>
    </div>;
};

const JobSkeletons = () => <div className="job-skeleton-list" aria-label="Loading jobs" aria-busy="true">{[1, 2, 3, 4].map((item) => <div className="job-skeleton" key={item}><span /><div><i /><i /><i /><i /></div></div>)}</div>;

const Pagination = ({ page, pageCount, total, pageSize, onChange }) => {
    const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, total);
    return <nav className="jobs-pagination" aria-label="Job results pages"><span>Showing {start}–{end} of {total}</span><div><button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">Previous</button><span aria-live="polite">Page {page} of {pageCount}</span><button type="button" disabled={page >= pageCount} onClick={() => onChange(page + 1)} aria-label="Next page">Next</button></div></nav>;
};

export default function JobsDesktopCanvas() {
    return (
        <div className="jobs-desktop-scroll" role="region" aria-label="Jobs page. Scroll horizontally to view all content on narrow screens." tabIndex={0}>
            <div className="jobs-desktop-canvas">
                <Jobs />
            </div>
        </div>
    );
}
