import React, { useEffect, useMemo, useRef, useState } from "react";
import "./Documents.css";

/*
========================================================
DOCUMENT CENTER
========================================================

Purpose:

- Upload career / learning documents
- Search documents
- Filter documents
- Track processing status
- Open documents
- Ask AI about documents
- Delete documents
- Keep the UI ready for future RAG integration

Backend API expected later:

GET    /api/documents
POST   /api/documents
DELETE /api/documents/:id

The UI also works in local mode if the API is not available.
========================================================
*/


/*
========================================================
CONSTANTS
========================================================
*/

const STORAGE_KEY = "ai_career_os_documents";

const API_BASE =
    import.meta.env.VITE_API_URL || "http://localhost:5000";

const API_ENDPOINT = `${API_BASE}/api/documents`;


/*
========================================================
DEFAULT DOCUMENTS
========================================================

These are only starter examples.

They are stored locally so the page does not look empty
for a new user.

You can remove these later when your backend contains
real user documents.
========================================================
*/

const starterDocuments = [
    {
        id: "demo-javascript-notes",
        title: "JavaScript Notes",
        fileName: "javascript-notes.pdf",
        fileType: "PDF",
        category: "Programming",
        size: "2.4 MB",
        status: "processed",
        description:
            "Personal JavaScript learning notes covering variables, functions, scope, DOM, promises and async programming.",
        tags: [
            "JavaScript",
            "Programming",
            "Frontend"
        ],
        createdAt:
            new Date(
                Date.now() - 2 * 60 * 60 * 1000
            ).toISOString(),
        url: ""
    },

    {
        id: "demo-react-interview",
        title: "React Interview Questions",
        fileName: "react-interview-questions.pdf",
        fileType: "PDF",
        category: "Interview",
        size: "1.8 MB",
        status: "processed",
        description:
            "React interview preparation material covering components, hooks, state, props, rendering and performance.",
        tags: [
            "React",
            "Interview",
            "Frontend"
        ],
        createdAt:
            new Date(
                Date.now() - 24 * 60 * 60 * 1000
            ).toISOString(),
        url: ""
    },

    {
        id: "demo-node-notes",
        title: "Node.js Backend Notes",
        fileName: "node-backend-notes.pdf",
        fileType: "PDF",
        category: "Programming",
        size: "3.1 MB",
        status: "processed",
        description:
            "Backend development notes covering Node.js, Express.js, REST APIs, authentication and MongoDB.",
        tags: [
            "Node.js",
            "Express",
            "MongoDB"
        ],
        createdAt:
            new Date(
                Date.now() - 2 * 24 * 60 * 60 * 1000
            ).toISOString(),
        url: ""
    },

    {
        id: "demo-dsa",
        title: "DSA Interview Preparation",
        fileName: "dsa-preparation.pdf",
        fileType: "PDF",
        category: "DSA",
        size: "4.2 MB",
        status: "processing",
        description:
            "Data structures and algorithms preparation material for technical interviews.",
        tags: [
            "DSA",
            "Algorithms",
            "Interview"
        ],
        createdAt:
            new Date(
                Date.now() - 4 * 24 * 60 * 60 * 1000
            ).toISOString(),
        url: ""
    }
];


/*
========================================================
HELPER FUNCTIONS
========================================================
*/


const getStoredDocuments = () => {
    try {
        const stored =
            localStorage.getItem(
                STORAGE_KEY
            );

        if (!stored) {
            return starterDocuments;
        }

        const parsed =
            JSON.parse(stored);

        if (!Array.isArray(parsed)) {
            return starterDocuments;
        }

        return parsed;
    } catch (error) {
        console.error(
            "Failed to load documents:",
            error
        );

        return starterDocuments;
    }
};


const saveDocumentsToStorage = (
    documents
) => {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(documents)
        );
    } catch (error) {
        console.error(
            "Failed to save documents:",
            error
        );
    }
};


const formatDate = (date) => {
    if (!date) {
        return "Unknown date";
    }

    const parsedDate =
        new Date(date);

    if (
        Number.isNaN(
            parsedDate.getTime()
        )
    ) {
        return "Unknown date";
    }

    return parsedDate.toLocaleDateString(
        undefined,
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );
};


const formatRelativeDate = (
    date
) => {
    if (!date) {
        return "Recently";
    }

    const parsedDate =
        new Date(date);

    if (
        Number.isNaN(
            parsedDate.getTime()
        )
    ) {
        return "Recently";
    }

    const now =
        Date.now();

    const difference =
        now -
        parsedDate.getTime();

    const minute =
        60 * 1000;

    const hour =
        60 * minute;

    const day =
        24 * hour;

    if (difference < minute) {
        return "Just now";
    }

    if (difference < hour) {
        return `${Math.floor(
            difference / minute
        )} min ago`;
    }

    if (difference < day) {
        return `${Math.floor(
            difference / hour
        )} hr ago`;
    }

    if (difference < 7 * day) {
        return `${Math.floor(
            difference / day
        )} days ago`;
    }

    return formatDate(date);
};


const getFileIcon = (
    fileType
) => {
    const type =
        String(fileType || "")
            .toLowerCase();

    if (type.includes("pdf")) {
        return "📕";
    }

    if (
        type.includes("word") ||
        type.includes("doc")
    ) {
        return "📘";
    }

    if (
        type.includes("text") ||
        type.includes("txt")
    ) {
        return "📄";
    }

    if (
        type.includes("presentation") ||
        type.includes("ppt")
    ) {
        return "📙";
    }

    return "📄";
};


const getStatusLabel = (
    status
) => {
    switch (status) {
        case "processed":
            return "Processed";

        case "processing":
            return "Processing";

        case "failed":
            return "Failed";

        case "pending":
            return "Pending";

        default:
            return "Available";
    }
};


/*
========================================================
MAIN COMPONENT
========================================================
*/

const Documents = () => {

    /*
    ----------------------------------------------------
    STATE
    ----------------------------------------------------
    */

    const [
        documents,
        setDocuments
    ] = useState(
        []
    );

    const [
        search,
        setSearch
    ] = useState("");

    const [
        category,
        setCategory
    ] = useState("All");

    const [
        status,
        setStatus
    ] = useState("All");

    const [
        selectedDocument,
        setSelectedDocument
    ] = useState(null);

    const [
        showUploadModal,
        setShowUploadModal
    ] = useState(false);

    const [
        showAskModal,
        setShowAskModal
    ] = useState(false);

    const [
        askQuestion,
        setAskQuestion
    ] = useState("");

    const [
        loading,
        setLoading
    ] = useState(false);

    const [
        uploading,
        setUploading
    ] = useState(false);

    const [
        error,
        setError
    ] = useState("");

    const [
        success,
        setSuccess
    ] = useState("");

    const [
        uploadData,
        setUploadData
    ] = useState({
        title: "",
        category: "Programming",
        description: "",
        file: null
    });

    const fileInputRef =
        useRef(null);


    /*
    ----------------------------------------------------
    INITIAL LOAD
    ----------------------------------------------------
    */

    useEffect(() => {
        loadDocuments();
    }, []);


    /*
    ----------------------------------------------------
    LOAD DOCUMENTS
    ----------------------------------------------------
    */

    const loadDocuments =
        async () => {

            setLoading(true);
            setError("");

            try {

                const token =
                    localStorage.getItem(
                        "token"
                    ) ||
                    localStorage.getItem(
                        "accessToken"
                    );

                const response =
                    await fetch(
                        API_ENDPOINT,
                        {
                            method: "GET",

                            headers:
                                token
                                    ? {
                                          Authorization:
                                              `Bearer ${token}`
                                      }
                                    : {}
                        }
                    );


                /*
                ------------------------------------------------
                If backend exists and responds correctly,
                use real documents.
                ------------------------------------------------
                */

                if (response.ok) {

                    const result =
                        await response.json();

                    const apiDocuments =
                        Array.isArray(
                            result?.data
                        )
                            ? result.data
                            : Array.isArray(
                                  result?.documents
                              )
                            ? result.documents
                            : Array.isArray(
                                  result
                              )
                            ? result
                            : [];

                    setDocuments(
                        apiDocuments
                    );

                    saveDocumentsToStorage(
                        apiDocuments
                    );

                    return;
                }

                /*
                ------------------------------------------------
                Backend unavailable or endpoint not ready.

                Use local storage so the UI remains usable.
                ------------------------------------------------
                */

                const localDocuments =
                    getStoredDocuments();

                setDocuments(
                    localDocuments
                );

            } catch (requestError) {

                console.warn(
                    "Documents API unavailable. Using local storage.",
                    requestError
                );

                const localDocuments =
                    getStoredDocuments();

                setDocuments(
                    localDocuments
                );

            } finally {

                setLoading(false);
            }
        };


    /*
    ----------------------------------------------------
    CATEGORY LIST
    ----------------------------------------------------
    */

    const categories =
        useMemo(() => {

            const uniqueCategories =
                documents
                    .map(
                        (document) =>
                            document.category
                    )
                    .filter(Boolean);

            return [
                "All",
                ...Array.from(
                    new Set(
                        uniqueCategories
                    )
                )
            ];

        }, [documents]);


    /*
    ----------------------------------------------------
    FILTER DOCUMENTS
    ----------------------------------------------------
    */

    const filteredDocuments =
        useMemo(() => {

            const query =
                search
                    .trim()
                    .toLowerCase();

            return documents.filter(
                (document) => {

                    const matchesSearch =
                        !query ||
                        String(
                            document.title ||
                                ""
                        )
                            .toLowerCase()
                            .includes(query) ||
                        String(
                            document.fileName ||
                                ""
                        )
                            .toLowerCase()
                            .includes(query) ||
                        String(
                            document.description ||
                                ""
                        )
                            .toLowerCase()
                            .includes(query) ||
                        (
                            Array.isArray(
                                document.tags
                            )
                                ? document.tags
                                : []
                        )
                            .join(" ")
                            .toLowerCase()
                            .includes(query);


                    const matchesCategory =
                        category ===
                            "All" ||
                        document.category ===
                            category;


                    const matchesStatus =
                        status ===
                            "All" ||
                        document.status ===
                            status;


                    return (
                        matchesSearch &&
                        matchesCategory &&
                        matchesStatus
                    );
                }
            );

        }, [
            documents,
            search,
            category,
            status
        ]);


    /*
    ----------------------------------------------------
    STATISTICS
    ----------------------------------------------------
    */

    const totalDocuments =
        documents.length;

    const processedDocuments =
        documents.filter(
            (document) =>
                document.status ===
                "processed"
        ).length;

    const processingDocuments =
        documents.filter(
            (document) =>
                document.status ===
                "processing"
        ).length;

    const categoryCount =
        new Set(
            documents
                .map(
                    (document) =>
                        document.category
                )
                .filter(Boolean)
        ).size;


    /*
    ----------------------------------------------------
    UPLOAD INPUT
    ----------------------------------------------------
    */

    const handleFileChange =
        (event) => {

            const file =
                event.target.files?.[0];

            if (!file) {
                return;
            }


            const allowedTypes = [
                "application/pdf",
                "text/plain",

                "application/msword",

                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            ];


            const maxSize =
                10 * 1024 * 1024;


            if (
                !allowedTypes.includes(
                    file.type
                )
            ) {

                setError(
                    "Please upload a PDF, TXT, DOC, or DOCX file."
                );

                return;
            }


            if (
                file.size >
                maxSize
            ) {

                setError(
                    "File size must be 10 MB or smaller."
                );

                return;
            }


            const extension =
                file.name
                    .split(".")
                    .pop()
                    ?.toUpperCase() ||
                "FILE";


            setUploadData(
                (previous) => ({
                    ...previous,

                    title:
                        previous.title ||
                        file.name.replace(
                            /\.[^/.]+$/,
                            ""
                        ),

                    file,

                    fileType:
                        extension,

                    size:
                        formatFileSize(
                            file.size
                        )
                })
            );


            setError("");
        };


    /*
    ----------------------------------------------------
    FILE SIZE
    ----------------------------------------------------
    */

    const formatFileSize =
        (bytes) => {

            if (
                !bytes ||
                bytes === 0
            ) {
                return "0 KB";
            }

            const units = [
                "Bytes",
                "KB",
                "MB",
                "GB"
            ];

            const index =
                Math.floor(
                    Math.log(bytes) /
                        Math.log(1024)
                );

            const value =
                bytes /
                Math.pow(
                    1024,
                    index
                );

            return `${value.toFixed(
                index === 0
                    ? 0
                    : 1
            )} ${units[index]}`;
        };


    /*
    ----------------------------------------------------
    UPLOAD DOCUMENT
    ----------------------------------------------------
    */

    const handleUpload =
        async (event) => {

            event.preventDefault();

            setError("");
            setSuccess("");


            if (
                !uploadData.file
            ) {

                setError(
                    "Please choose a document first."
                );

                return;
            }


            if (
                !uploadData.title.trim()
            ) {

                setError(
                    "Please enter a document title."
                );

                return;
            }


            setUploading(true);


            try {

                const token =
                    localStorage.getItem(
                        "token"
                    ) ||
                    localStorage.getItem(
                        "accessToken"
                    );


                const formData =
                    new FormData();


                formData.append(
                    "file",
                    uploadData.file
                );


                formData.append(
                    "title",
                    uploadData.title.trim()
                );


                formData.append(
                    "category",
                    uploadData.category
                );


                formData.append(
                    "description",
                    uploadData.description.trim()
                );


                const response =
                    await fetch(
                        API_ENDPOINT,
                        {
                            method: "POST",

                            headers:
                                token
                                    ? {
                                          Authorization:
                                              `Bearer ${token}`
                                      }
                                    : {},

                            body: formData
                        }
                    );


                if (response.ok) {

                    const result =
                        await response.json();


                    const newDocument =
                        result?.data ||
                        result?.document;


                    if (
                        newDocument
                    ) {

                        const updatedDocuments =
                            [
                                newDocument,
                                ...documents
                            ];

                        setDocuments(
                            updatedDocuments
                        );

                        saveDocumentsToStorage(
                            updatedDocuments
                        );

                    } else {

                        await loadDocuments();
                    }


                    setSuccess(
                        "Document uploaded successfully."
                    );


                } else {

                    /*
                    ------------------------------------------------
                    If backend upload endpoint is not ready,
                    create a local document record.

                    This keeps the UI functional during development.
                    ------------------------------------------------
                    */

                    const localDocument = {
                        id:
                            `local-${Date.now()}`,

                        title:
                            uploadData.title.trim(),

                        fileName:
                            uploadData.file.name,

                        fileType:
                            uploadData.fileType ||
                            "FILE",

                        category:
                            uploadData.category,

                        size:
                            uploadData.size ||
                            formatFileSize(
                                uploadData.file.size
                            ),

                        status:
                            "processed",

                        description:
                            uploadData.description.trim() ||
                            "Uploaded career or learning document.",

                        tags: [
                            uploadData.category
                        ],

                        createdAt:
                            new Date().toISOString(),

                        url:
                            URL.createObjectURL(
                                uploadData.file
                            )
                    };


                    const updatedDocuments =
                        [
                            localDocument,
                            ...documents
                        ];


                    setDocuments(
                        updatedDocuments
                    );


                    saveDocumentsToStorage(
                        updatedDocuments
                    );


                    setSuccess(
                        "Document added to your document library."
                    );
                }


                setUploadData({
                    title: "",
                    category: "Programming",
                    description: "",
                    file: null
                });


                if (
                    fileInputRef.current
                ) {

                    fileInputRef.current.value =
                        "";
                }


                setShowUploadModal(
                    false
                );


            } catch (uploadError) {

                console.error(
                    "Upload error:",
                    uploadError
                );


                setError(
                    "Upload failed. Please try again."
                );

            } finally {

                setUploading(false);
            }
        };


    /*
    ----------------------------------------------------
    DELETE DOCUMENT
    ----------------------------------------------------
    */

    const handleDelete =
        async (document) => {

            const confirmed =
                window.confirm(
                    `Delete "${document.title}"?`
                );


            if (!confirmed) {
                return;
            }


            try {

                const token =
                    localStorage.getItem(
                        "token"
                    ) ||
                    localStorage.getItem(
                        "accessToken"
                    );


                const response =
                    await fetch(
                        `${API_ENDPOINT}/${document.id}`,
                        {
                            method: "DELETE",

                            headers:
                                token
                                    ? {
                                          Authorization:
                                              `Bearer ${token}`
                                      }
                                    : {}
                        }
                    );


                /*
                ------------------------------------------------
                Remove locally even if backend is not connected.
                ------------------------------------------------
                */

                const updatedDocuments =
                    documents.filter(
                        (item) =>
                            item.id !==
                            document.id
                    );


                setDocuments(
                    updatedDocuments
                );


                saveDocumentsToStorage(
                    updatedDocuments
                );


                if (
                    response.ok
                ) {

                    setSuccess(
                        "Document deleted successfully."
                    );

                } else {

                    setSuccess(
                        "Document removed from your library."
                    );
                }

            } catch (deleteError) {

                console.error(
                    "Delete error:",
                    deleteError
                );


                const updatedDocuments =
                    documents.filter(
                        (item) =>
                            item.id !==
                            document.id
                    );


                setDocuments(
                    updatedDocuments
                );


                saveDocumentsToStorage(
                    updatedDocuments
                );


                setSuccess(
                    "Document removed from your library."
                );
            }
        };


    /*
    ----------------------------------------------------
    OPEN DOCUMENT
    ----------------------------------------------------
    */

    const handleOpenDocument =
        (document) => {

            if (
                document.url
            ) {

                window.open(
                    document.url,
                    "_blank",
                    "noopener,noreferrer"
                );

                return;
            }


            setSelectedDocument(
                document
            );
        };


    /*
    ----------------------------------------------------
    ASK AI
    ----------------------------------------------------
    */

    const handleAskAI =
        (document) => {

            setSelectedDocument(
                document
            );

            setAskQuestion("");

            setShowAskModal(
                true
            );
        };


    /*
    ----------------------------------------------------
    ASK AI SUBMIT
    ----------------------------------------------------
    */

    const handleAskQuestion =
        async (event) => {

            event.preventDefault();


            if (
                !askQuestion.trim()
            ) {

                return;
            }


            /*
            ------------------------------------------------
            Future RAG endpoint:

            POST /api/documents/:id/ask

            For now we show a clear product message
            instead of pretending that an AI answer exists.
            ------------------------------------------------
            */

            setSuccess(
                "Your document question is ready for the AI knowledge assistant."
            );


            setShowAskModal(
                false
            );

            setAskQuestion("");
        };


    /*
    ----------------------------------------------------
    RESET FILTERS
    ----------------------------------------------------
    */

    const clearFilters =
        () => {

            setSearch("");
            setCategory("All");
            setStatus("All");
        };


    /*
    ----------------------------------------------------
    AUTO HIDE MESSAGES
    ----------------------------------------------------
    */

    useEffect(() => {

        if (
            !success &&
            !error
        ) {
            return;
        }


        const timer =
            setTimeout(() => {

                setSuccess("");
                setError("");

            }, 5000);


        return () =>
            clearTimeout(
                timer
            );

    }, [
        success,
        error
    ]);


    /*
    ====================================================
    RENDER
    ====================================================
    */

    return (
        <div className="documents-page">

            {/* =========================================
                PAGE HEADER
            ========================================== */}

            <header className="documents-header">

                <div>

                    <div className="documents-eyebrow">
                        CAREER WORKSPACE
                    </div>

                    <h1>
                        Document Center
                    </h1>

                    <p>
                        Store, organize, and use your
                        career and learning documents
                        inside AI Career OS.
                    </p>

                </div>


                <button
                    type="button"
                    className="documents-primary-button"
                    onClick={() =>
                        setShowUploadModal(
                            true
                        )
                    }
                >
                    <span>＋</span>
                    Upload Document
                </button>

            </header>


            {/* =========================================
                SUCCESS / ERROR
            ========================================== */}

            {success && (
                <div className="documents-alert documents-alert-success">
                    <span>✓</span>
                    {success}
                </div>
            )}


            {error && (
                <div className="documents-alert documents-alert-error">
                    <span>!</span>
                    {error}
                </div>
            )}


            {/* =========================================
                QUICK VALUE CARDS
            ========================================== */}

            <section className="documents-stats">

                <div className="document-stat-card">

                    <div className="document-stat-icon">
                        📚
                    </div>

                    <div>

                        <span>
                            Total Documents
                        </span>

                        <strong>
                            {totalDocuments}
                        </strong>

                    </div>

                </div>


                <div className="document-stat-card">

                    <div className="document-stat-icon">
                        ✓
                    </div>

                    <div>

                        <span>
                            Processed
                        </span>

                        <strong>
                            {processedDocuments}
                        </strong>

                    </div>

                </div>


                <div className="document-stat-card">

                    <div className="document-stat-icon">
                        ⚙️
                    </div>

                    <div>

                        <span>
                            Processing
                        </span>

                        <strong>
                            {processingDocuments}
                        </strong>

                    </div>

                </div>


                <div className="document-stat-card">

                    <div className="document-stat-icon">
                        🗂️
                    </div>

                    <div>

                        <span>
                            Categories
                        </span>

                        <strong>
                            {categoryCount}
                        </strong>

                    </div>

                </div>

            </section>


            {/* =========================================
                MAIN GRID
            ========================================== */}

            <div className="documents-layout">


                {/* =====================================
                    MAIN CONTENT
                ====================================== */}

                <main className="documents-main">


                    {/* =================================
                        UPLOAD BANNER
                    ================================== */}

                    <section className="documents-upload-banner">

                        <div className="documents-upload-banner-icon">
                            📤
                        </div>


                        <div className="documents-upload-banner-content">

                            <h2>
                                Build your private career library
                            </h2>

                            <p>
                                Upload resumes, notes,
                                interview preparation,
                                project documentation,
                                certifications, and other
                                useful career resources.
                            </p>

                            <div className="documents-benefits">

                                <span>
                                    ✓ Organized
                                </span>

                                <span>
                                    ✓ Searchable
                                </span>

                                <span>
                                    ✓ AI-ready
                                </span>

                                <span>
                                    ✓ Private to your account
                                </span>

                            </div>

                        </div>


                        <button
                            type="button"
                            className="documents-secondary-button"
                            onClick={() =>
                                setShowUploadModal(
                                    true
                                )
                            }
                        >
                            Add Document
                        </button>

                    </section>


                    {/* =================================
                        SEARCH + FILTERS
                    ================================== */}

                    <section className="documents-toolbar">

                        <div className="documents-search">

                            <span>
                                🔍
                            </span>

                            <input
                                type="text"
                                value={search}
                                onChange={(event) =>
                                    setSearch(
                                        event.target.value
                                    )
                                }
                                placeholder="Search documents, topics, technologies..."
                            />

                            {search && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setSearch("")
                                    }
                                >
                                    ×
                                </button>
                            )}

                        </div>


                        <div className="documents-filters">

                            <select
                                value={category}
                                onChange={(event) =>
                                    setCategory(
                                        event.target.value
                                    )
                                }
                            >

                                <option value="All">
                                    All Categories
                                </option>

                                {categories
                                    .filter(
                                        (item) =>
                                            item !==
                                            "All"
                                    )
                                    .map(
                                        (item) => (
                                            <option
                                                key={item}
                                                value={item}
                                            >
                                                {item}
                                            </option>
                                        )
                                    )}

                            </select>


                            <select
                                value={status}
                                onChange={(event) =>
                                    setStatus(
                                        event.target.value
                                    )
                                }
                            >

                                <option value="All">
                                    All Status
                                </option>

                                <option value="processed">
                                    Processed
                                </option>

                                <option value="processing">
                                    Processing
                                </option>

                                <option value="pending">
                                    Pending
                                </option>

                                <option value="failed">
                                    Failed
                                </option>

                            </select>


                            {(search ||
                                category !==
                                    "All" ||
                                status !==
                                    "All") && (
                                <button
                                    type="button"
                                    className="documents-clear-button"
                                    onClick={
                                        clearFilters
                                    }
                                >
                                    Clear
                                </button>
                            )}

                        </div>

                    </section>


                    {/* =================================
                        DOCUMENT LIST HEADER
                    ================================== */}

                    <div className="documents-list-header">

                        <div>

                            <h2>
                                Your Documents
                            </h2>

                            <p>
                                {filteredDocuments.length}{" "}
                                {filteredDocuments.length ===
                                1
                                    ? "document"
                                    : "documents"}{" "}
                                found
                            </p>

                        </div>

                    </div>


                    {/* =================================
                        LOADING
                    ================================== */}

                    {loading && (
                        <div className="documents-empty">

                            <div className="documents-spinner">
                                ⟳
                            </div>

                            <h3>
                                Loading your documents...
                            </h3>

                            <p>
                                Connecting to your document
                                workspace.
                            </p>

                        </div>
                    )}


                    {/* =================================
                        EMPTY SEARCH RESULT
                    ================================== */}

                    {!loading &&
                        filteredDocuments.length ===
                            0 && (
                            <div className="documents-empty">

                                <div className="documents-empty-icon">
                                    📂
                                </div>

                                <h3>
                                    No documents found
                                </h3>

                                <p>
                                    Try another search or
                                    upload your first
                                    document.
                                </p>

                                <button
                                    type="button"
                                    className="documents-primary-button"
                                    onClick={() =>
                                        setShowUploadModal(
                                            true
                                        )
                                    }
                                >
                                    Upload Document
                                </button>

                            </div>
                        )}


                    {/* =================================
                        DOCUMENT CARDS
                    ================================== */}

                    {!loading &&
                        filteredDocuments.length >
                            0 && (
                            <div className="documents-list">

                                {filteredDocuments.map(
                                    (document) => (

                                        <article
                                            className="document-card"
                                            key={
                                                document.id ||
                                                document._id
                                            }
                                        >

                                            <div className="document-card-icon">
                                                {getFileIcon(
                                                    document.fileType
                                                )}
                                            </div>


                                            <div className="document-card-content">

                                                <div className="document-card-top">

                                                    <div>

                                                        <h3>
                                                            {
                                                                document.title
                                                            }
                                                        </h3>

                                                        <p className="document-file-name">
                                                            {
                                                                document.fileName
                                                            }
                                                        </p>

                                                    </div>


                                                    <span
                                                        className={`document-status document-status-${document.status}`}
                                                    >
                                                        <span>
                                                            ●
                                                        </span>

                                                        {getStatusLabel(
                                                            document.status
                                                        )}
                                                    </span>

                                                </div>


                                                <p className="document-description">

                                                    {
                                                        document.description ||
                                                        "No description available."
                                                    }

                                                </p>


                                                <div className="document-meta">

                                                    <span>
                                                        📄{" "}
                                                        {
                                                            document.fileType
                                                        }
                                                    </span>

                                                    <span>
                                                        💾{" "}
                                                        {
                                                            document.size ||
                                                            "Unknown size"
                                                        }
                                                    </span>

                                                    <span>
                                                        🗓️{" "}
                                                        {
                                                            formatRelativeDate(
                                                                document.createdAt
                                                            )
                                                        }
                                                    </span>

                                                    <span>
                                                        🗂️{" "}
                                                        {
                                                            document.category ||
                                                            "General"
                                                        }
                                                    </span>

                                                </div>


                                                <div className="document-tags">

                                                    {Array.isArray(
                                                        document.tags
                                                    ) &&
                                                        document.tags
                                                            .slice(
                                                                0,
                                                                4
                                                            )
                                                            .map(
                                                                (
                                                                    tag
                                                                ) => (
                                                                    <span
                                                                        key={
                                                                            tag
                                                                        }
                                                                    >
                                                                        {
                                                                            tag
                                                                        }
                                                                    </span>
                                                                )
                                                            )}

                                                </div>


                                                <div className="document-actions">

                                                    <button
                                                        type="button"
                                                        className="document-action-primary"
                                                        onClick={() =>
                                                            handleOpenDocument(
                                                                document
                                                            )
                                                        }
                                                    >
                                                        Open
                                                    </button>


                                                    <button
                                                        type="button"
                                                        className="document-action-secondary"
                                                        onClick={() =>
                                                            handleAskAI(
                                                                document
                                                            )
                                                        }
                                                    >
                                                        🤖 Ask AI
                                                    </button>


                                                    <button
                                                        type="button"
                                                        className="document-action-danger"
                                                        onClick={() =>
                                                            handleDelete(
                                                                document
                                                            )
                                                        }
                                                    >
                                                        Delete
                                                    </button>

                                                </div>

                                            </div>

                                        </article>

                                    )
                                )}

                            </div>
                        )}

                </main>


                {/* =====================================
                    SIDEBAR
                ====================================== */}

                <aside className="documents-sidebar">


                    {/* =================================
                        AI KNOWLEDGE CARD
                    ================================== */}

                    <section className="documents-sidebar-card documents-ai-card">

                        <div className="documents-sidebar-icon">
                            🤖
                        </div>

                        <span className="documents-sidebar-eyebrow">
                            AI KNOWLEDGE
                        </span>

                        <h2>
                            Learn from your own documents
                        </h2>

                        <p>
                            Your uploaded material can
                            become the foundation for
                            personalized AI answers.
                        </p>


                        <div className="documents-ai-example">

                            <span>
                                Example
                            </span>

                            <p>
                                "Explain closures according
                                to my JavaScript notes."
                            </p>

                        </div>


                        <button
                            type="button"
                            className="documents-sidebar-button"
                            onClick={() => {

                                if (
                                    documents.length >
                                    0
                                ) {

                                    handleAskAI(
                                        documents[0]
                                    );

                                } else {

                                    setShowUploadModal(
                                        true
                                    );
                                }
                            }}
                        >
                            Ask About Documents →
                        </button>

                    </section>


                    {/* =================================
                        HOW IT WORKS
                    ================================== */}

                    <section className="documents-sidebar-card">

                        <span className="documents-sidebar-eyebrow">
                            WORKFLOW
                        </span>

                        <h2>
                            How it works
                        </h2>


                        <div className="documents-workflow">

                            <div className="workflow-step">

                                <span>
                                    1
                                </span>

                                <div>

                                    <strong>
                                        Upload
                                    </strong>

                                    <p>
                                        Add your career or
                                        learning document.
                                    </p>

                                </div>

                            </div>


                            <div className="workflow-line" />


                            <div className="workflow-step">

                                <span>
                                    2
                                </span>

                                <div>

                                    <strong>
                                        Process
                                    </strong>

                                    <p>
                                        The document is
                                        prepared for search
                                        and AI use.
                                    </p>

                                </div>

                            </div>


                            <div className="workflow-line" />


                            <div className="workflow-step">

                                <span>
                                    3
                                </span>

                                <div>

                                    <strong>
                                        Ask
                                    </strong>

                                    <p>
                                        Get answers based on
                                        your own material.
                                    </p>

                                </div>

                            </div>

                        </div>

                    </section>


                    {/* =================================
                        RECOMMENDED DOCUMENT TYPES
                    ================================== */}

                    <section className="documents-sidebar-card">

                        <span className="documents-sidebar-eyebrow">
                            USEFUL RESOURCES
                        </span>

                        <h2>
                            What should you upload?
                        </h2>


                        <ul className="documents-recommendations">

                            <li>
                                <span>📄</span>
                                Resume versions
                            </li>

                            <li>
                                <span>📚</span>
                                Programming notes
                            </li>

                            <li>
                                <span>🎯</span>
                                Interview preparation
                            </li>

                            <li>
                                <span>💻</span>
                                Project documentation
                            </li>

                            <li>
                                <span>🏆</span>
                                Certifications
                            </li>

                            <li>
                                <span>📝</span>
                                Course material
                            </li>

                        </ul>

                    </section>


                    {/* =================================
                        PRIVACY
                    ================================== */}

                    <section className="documents-privacy-card">

                        <span>
                            🔒
                        </span>

                        <div>

                            <strong>
                                Your documents are private
                            </strong>

                            <p>
                                Keep personal and career
                                documents inside your own
                                workspace. Do not upload
                                passwords, API keys, or other
                                sensitive secrets.
                            </p>

                        </div>

                    </section>

                </aside>

            </div>


            {/* =========================================
                UPLOAD MODAL
            ========================================== */}

            {showUploadModal && (

                <div
                    className="documents-modal-overlay"
                    onMouseDown={(event) => {

                        if (
                            event.target ===
                            event.currentTarget
                        ) {

                            setShowUploadModal(
                                false
                            );
                        }
                    }}
                >

                    <div className="documents-modal">

                        <div className="documents-modal-header">

                            <div>

                                <span className="documents-modal-eyebrow">
                                    ADD TO LIBRARY
                                </span>

                                <h2>
                                    Upload Document
                                </h2>

                                <p>
                                    Add a career or learning
                                    resource to your private
                                    workspace.
                                </p>

                            </div>


                            <button
                                type="button"
                                className="documents-modal-close"
                                onClick={() =>
                                    setShowUploadModal(
                                        false
                                    )
                                }
                            >
                                ×
                            </button>

                        </div>


                        <form
                            className="documents-upload-form"
                            onSubmit={
                                handleUpload
                            }
                        >

                            <div className="documents-dropzone">

                                <div className="documents-dropzone-icon">
                                    📤
                                </div>

                                <h3>
                                    Choose your document
                                </h3>

                                <p>
                                    PDF, TXT, DOC or DOCX
                                    up to 10 MB
                                </p>


                                <input
                                    ref={
                                        fileInputRef
                                    }
                                    type="file"
                                    accept=".pdf,.txt,.doc,.docx"
                                    onChange={
                                        handleFileChange
                                    }
                                />


                                {uploadData.file && (

                                    <div className="selected-file">

                                        <span>
                                            📄
                                        </span>

                                        <div>

                                            <strong>
                                                {
                                                    uploadData
                                                        .file
                                                        .name
                                                }
                                            </strong>

                                            <small>
                                                {
                                                    uploadData
                                                        .size
                                                }
                                            </small>

                                        </div>

                                    </div>

                                )}

                            </div>


                            <div className="documents-form-field">

                                <label>
                                    Document Title
                                </label>

                                <input
                                    type="text"
                                    value={
                                        uploadData.title
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setUploadData(
                                            (
                                                previous
                                            ) => ({
                                                ...previous,
                                                title:
                                                    event
                                                        .target
                                                        .value
                                            })
                                        )
                                    }
                                    placeholder="e.g. JavaScript Interview Notes"
                                    required
                                />

                            </div>


                            <div className="documents-form-grid">

                                <div className="documents-form-field">

                                    <label>
                                        Category
                                    </label>

                                    <select
                                        value={
                                            uploadData.category
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setUploadData(
                                                (
                                                    previous
                                                ) => ({
                                                    ...previous,
                                                    category:
                                                        event
                                                            .target
                                                            .value
                                                })
                                            )
                                        }
                                    >

                                        <option value="Programming">
                                            Programming
                                        </option>

                                        <option value="Interview">
                                            Interview
                                        </option>

                                        <option value="DSA">
                                            DSA
                                        </option>

                                        <option value="Resume">
                                            Resume
                                        </option>

                                        <option value="Projects">
                                            Projects
                                        </option>

                                        <option value="Career">
                                            Career
                                        </option>

                                        <option value="Education">
                                            Education
                                        </option>

                                        <option value="Certifications">
                                            Certifications
                                        </option>

                                        <option value="Other">
                                            Other
                                        </option>

                                    </select>

                                </div>


                                <div className="documents-form-field">

                                    <label>
                                        File Type
                                    </label>

                                    <input
                                        type="text"
                                        value={
                                            uploadData
                                                .fileType ||
                                            "Automatically detected"
                                        }
                                        readOnly
                                    />

                                </div>

                            </div>


                            <div className="documents-form-field">

                                <label>
                                    Description
                                    <span>
                                        Optional
                                    </span>
                                </label>

                                <textarea
                                    rows="4"
                                    value={
                                        uploadData.description
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setUploadData(
                                            (
                                                previous
                                            ) => ({
                                                ...previous,
                                                description:
                                                    event
                                                        .target
                                                        .value
                                            })
                                        )
                                    }
                                    placeholder="What is this document useful for?"
                                />

                            </div>


                            <div className="documents-form-note">

                                <span>
                                    🔒
                                </span>

                                <p>
                                    We will use the document
                                    information to organize
                                    your career workspace.
                                    Never upload passwords,
                                    private keys, or API
                                    secrets.
                                </p>

                            </div>


                            <div className="documents-modal-actions">

                                <button
                                    type="button"
                                    className="documents-cancel-button"
                                    onClick={() =>
                                        setShowUploadModal(
                                            false
                                        )
                                    }
                                >
                                    Cancel
                                </button>


                                <button
                                    type="submit"
                                    className="documents-primary-button"
                                    disabled={
                                        uploading
                                    }
                                >

                                    {uploading
                                        ? "Uploading..."
                                        : "Upload Document"}

                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}


            {/* =========================================
                DOCUMENT DETAILS MODAL
            ========================================== */}

            {selectedDocument &&
                !showAskModal && (

                    <div
                        className="documents-modal-overlay"
                        onMouseDown={(
                            event
                        ) => {

                            if (
                                event.target ===
                                event.currentTarget
                            ) {

                                setSelectedDocument(
                                    null
                                );
                            }
                        }}
                    >

                        <div className="documents-modal documents-preview-modal">

                            <div className="documents-modal-header">

                                <div>

                                    <span className="documents-modal-eyebrow">
                                        DOCUMENT DETAILS
                                    </span>

                                    <h2>
                                        {
                                            selectedDocument.title
                                        }
                                    </h2>

                                    <p>
                                        {
                                            selectedDocument.fileName
                                        }
                                    </p>

                                </div>


                                <button
                                    type="button"
                                    className="documents-modal-close"
                                    onClick={() =>
                                        setSelectedDocument(
                                            null
                                        )
                                    }
                                >
                                    ×
                                </button>

                            </div>


                            <div className="document-preview-content">

                                <div className="document-preview-icon">
                                    {getFileIcon(
                                        selectedDocument.fileType
                                    )}
                                </div>


                                <h3>
                                    {
                                        selectedDocument.title
                                    }
                                </h3>


                                <p>
                                    {
                                        selectedDocument.description ||
                                        "No description available."
                                    }
                                </p>


                                <div className="document-preview-details">

                                    <div>
                                        <span>
                                            Category
                                        </span>

                                        <strong>
                                            {
                                                selectedDocument.category ||
                                                "General"
                                            }
                                        </strong>
                                    </div>


                                    <div>
                                        <span>
                                            File Type
                                        </span>

                                        <strong>
                                            {
                                                selectedDocument.fileType ||
                                                "File"
                                            }
                                        </strong>
                                    </div>


                                    <div>
                                        <span>
                                            Size
                                        </span>

                                        <strong>
                                            {
                                                selectedDocument.size ||
                                                "Unknown"
                                            }
                                        </strong>
                                    </div>


                                    <div>
                                        <span>
                                            Added
                                        </span>

                                        <strong>
                                            {
                                                formatDate(
                                                    selectedDocument.createdAt
                                                )
                                            }
                                        </strong>
                                    </div>

                                </div>


                                <div className="documents-modal-actions">

                                    <button
                                        type="button"
                                        className="documents-cancel-button"
                                        onClick={() =>
                                            setSelectedDocument(
                                                null
                                            )
                                        }
                                    >
                                        Close
                                    </button>


                                    <button
                                        type="button"
                                        className="documents-primary-button"
                                        onClick={() =>
                                            handleAskAI(
                                                selectedDocument
                                            )
                                        }
                                    >
                                        🤖 Ask AI
                                    </button>

                                </div>

                            </div>

                        </div>

                    </div>

                )}


            {/* =========================================
                ASK AI MODAL
            ========================================== */}

            {showAskModal &&
                selectedDocument && (

                    <div
                        className="documents-modal-overlay"
                        onMouseDown={(
                            event
                        ) => {

                            if (
                                event.target ===
                                event.currentTarget
                            ) {

                                setShowAskModal(
                                    false
                                );
                            }
                        }}
                    >

                        <div className="documents-modal documents-ai-modal">

                            <div className="documents-modal-header">

                                <div>

                                    <span className="documents-modal-eyebrow">
                                        DOCUMENT AI
                                    </span>

                                    <h2>
                                        Ask about your document
                                    </h2>

                                    <p>
                                        Ask a question using{" "}
                                        <strong>
                                            {
                                                selectedDocument.title
                                            }
                                        </strong>
                                        .
                                    </p>

                                </div>


                                <button
                                    type="button"
                                    className="documents-modal-close"
                                    onClick={() =>
                                        setShowAskModal(
                                            false
                                        )
                                    }
                                >
                                    ×
                                </button>

                            </div>


                            <form
                                className="documents-ai-form"
                                onSubmit={
                                    handleAskQuestion
                                }
                            >

                                <div className="documents-ai-context">

                                    <span>
                                        📄
                                    </span>

                                    <div>

                                        <strong>
                                            {
                                                selectedDocument.title
                                            }
                                        </strong>

                                        <small>
                                            {
                                                selectedDocument.category ||
                                                "Document"
                                            }
                                        </small>

                                    </div>

                                </div>


                                <label>
                                    Your question
                                </label>


                                <textarea
                                    rows="6"
                                    value={
                                        askQuestion
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setAskQuestion(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    placeholder="Example: Explain the main concepts in this document..."
                                    autoFocus
                                />


                                <div className="documents-question-examples">

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setAskQuestion(
                                                "Summarize the most important concepts in this document."
                                            )
                                        }
                                    >
                                        Summarize it
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setAskQuestion(
                                                "What should I remember from this document for an interview?"
                                            )
                                        }
                                    >
                                        Interview points
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setAskQuestion(
                                                "Explain the difficult concepts in simple language."
                                            )
                                        }
                                    >
                                        Explain simply
                                    </button>

                                </div>


                                <div className="documents-ai-note">

                                    <span>
                                        💡
                                    </span>

                                    <p>
                                        The full RAG-powered
                                        answer system can be
                                        connected to this
                                        interface through your
                                        document AI endpoint.
                                    </p>

                                </div>


                                <div className="documents-modal-actions">

                                    <button
                                        type="button"
                                        className="documents-cancel-button"
                                        onClick={() =>
                                            setShowAskModal(
                                                false
                                            )
                                        }
                                    >
                                        Cancel
                                    </button>


                                    <button
                                        type="submit"
                                        className="documents-primary-button"
                                    >
                                        Ask Document AI
                                    </button>

                                </div>

                            </form>

                        </div>

                    </div>

                )}

        </div>
    );
};


export default Documents;