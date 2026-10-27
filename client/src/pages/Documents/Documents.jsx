import { createPortal } from "react-dom";
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
    askDocumentQuestion,
    createDocument,
    deleteDocument,
    downloadDocument,
    getDocuments
} from "../../services/documentService";
import "./Documents.css";

/*
========================================================
DOCUMENT CENTER
========================================================

Documents are loaded and stored through the authenticated Documents API.
========================================================
*/

/*
========================================================
HELPER FUNCTIONS
========================================================
*/

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

const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;
const ALLOWED_DOCUMENT_EXTENSIONS = new Set(["pdf", "txt", "doc", "docx"]);


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

const normalizeDocument = (document) => ({
    ...document,
    id: String(document?._id || document?.id || ""),
    fileName: document?.fileName || "Document file",
    fileType: document?.fileType || "File",
    category: document?.category || "Other",
    description: document?.description || "",
    size: document?.size || (
        Number.isFinite(document?.fileSize)
            ? `${(document.fileSize / (1024 * 1024)).toFixed(1)} MB`
            : "Unknown size"
    ),
    tags: Array.isArray(document?.tags)
        ? document.tags
        : document?.category
            ? [document.category]
            : [],
    url: document?.fileUrl || null
});


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

    const [askAnswer, setAskAnswer] = useState("");
    const [askError, setAskError] = useState("");
    const [askingAI, setAskingAI] = useState(false);
    const [answerCopied, setAnswerCopied] = useState(false);
    const [copyError, setCopyError] = useState("");

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
        loadError,
        setLoadError
    ] = useState(false);

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
    const askAnswerRef = useRef(null);
    const dialogRef = useRef(null);
    const dialogOpenerRef = useRef(null);
    const previousDialogRef = useRef(null);
    const dialogKind = showUploadModal ? "upload" : selectedDocument ? (showAskModal ? "ai" : "preview") : null;
    const activeDialogRef = useRef(dialogKind);
    activeDialogRef.current = dialogKind;

    useLayoutEffect(() => {
        if (!dialogKind || !dialogRef.current) return undefined;
        const dialog = dialogRef.current;
        if (!dialogOpenerRef.current) dialogOpenerRef.current = document.activeElement;
        const isolated = [];
        // Isolate siblings up to body, including the shared shell.
        for (let node = dialog; node.parentElement && node !== document.body; node = node.parentElement) {
            for (const sibling of node.parentElement.children) {
                if (sibling !== node) {
                    isolated.push([sibling, sibling.inert]);
                    sibling.inert = true;
                }
            }
        }
        const oldOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const controls = () => [...dialog.querySelectorAll('a[href], button, input, select, textarea, [tabindex]')]
            .filter((node) => !node.disabled && node.tabIndex >= 0 && !node.closest('[inert]') && node.getClientRects().length > 0);
        const initial = previousDialogRef.current === "ai" && dialogKind === "preview"
            ? dialog.querySelector('#documents-preview-ask') : null;
        (initial || controls()[0] || dialog).focus();
        previousDialogRef.current = dialogKind;
        const handleKey = (event) => {
            if (event.key === "Escape") {
                event.preventDefault();
                event.stopPropagation();
                if (dialogKind === "upload") setShowUploadModal(false);
                else if (dialogKind === "ai") setShowAskModal(false);
                else setSelectedDocument(null);
            } else if (event.key === "Tab") {
                const items = controls();
                const index = items.indexOf(document.activeElement);
                if (!items.length) { event.preventDefault(); dialog.focus(); }
                else if (event.shiftKey && index <= 0) { event.preventDefault(); items.at(-1).focus(); }
                else if (!event.shiftKey && (index < 0 || index === items.length - 1)) { event.preventDefault(); items[0].focus(); }
            }
        };
        const containFocus = (event) => {
            if (!dialog.contains(event.target)) (controls()[0] || dialog).focus();
        };
        document.addEventListener("keydown", handleKey, true);
        document.addEventListener("focusin", containFocus);
        return () => {
            document.removeEventListener("keydown", handleKey, true);
            document.removeEventListener("focusin", containFocus);
            isolated.forEach(([node, inert]) => { node.inert = inert; });
            document.body.style.overflow = oldOverflow;
            if (!activeDialogRef.current) {
                if (dialogOpenerRef.current?.isConnected) dialogOpenerRef.current.focus();
                dialogOpenerRef.current = null;
                previousDialogRef.current = null;
            }
        };
    }, [dialogKind]);

    useLayoutEffect(() => () => {
        if (dialogOpenerRef.current?.isConnected) dialogOpenerRef.current.focus();
        dialogOpenerRef.current = null;
    }, []);




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
            setLoadError(false);

            try {
                const result = await getDocuments();
                if (!Array.isArray(result?.data)) {
                    throw new Error("Unable to load documents: the server returned an invalid list. Please retry.");
                }
                const apiDocuments = result.data;
                setDocuments(apiDocuments.map(normalizeDocument));

            } catch (requestError) {
                setLoadError(true);
                setError(requestError?.message || "Unable to load documents.");

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
                setUploadData((previous) => ({
                    ...previous,
                    file: null,
                    fileType: "",
                    size: ""
                }));
                return;
            }

            const extension =
                file.name.split(".").pop()?.toLowerCase() || "";


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
                        ALLOWED_DOCUMENT_EXTENSIONS.has(extension)
                            ? extension.toUpperCase()
                            : "Unsupported",

                    size:
                        formatFileSize(
                            file.size
                        )
                })
            );


            if (!ALLOWED_DOCUMENT_EXTENSIONS.has(extension)) {
                setError("Unsupported file type. Please upload PDF, TXT, DOC, or DOCX.");
                return;
            }

            if (file.size > MAX_DOCUMENT_SIZE) {
                setError("File is larger than 10 MiB. Please choose a smaller file.");
                return;
            }

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

            const extension =
                uploadData.file.name.split(".").pop()?.toLowerCase() || "";

            if (!ALLOWED_DOCUMENT_EXTENSIONS.has(extension)) {
                setError("Unsupported file type. Please upload PDF, TXT, DOC, or DOCX.");
                return;
            }

            if (uploadData.file.size > MAX_DOCUMENT_SIZE) {
                setError("File is larger than 10 MiB. Please choose a smaller file.");
                return;
            }


            const submittedFields = new FormData(event.currentTarget);
            const documentTitle = String(
                submittedFields.get("title") ?? uploadData.title
            ).trim();

            if (!documentTitle) {

                setError(
                    "Please enter a document title."
                );

                return;
            }

            if (documentTitle.length < 2) {
                setError("Document title must be at least 2 characters.");
                return;
            }


            setUploading(true);


            try {
                const formData = new FormData();
                formData.append("file", uploadData.file);
                formData.append("title", documentTitle);
                formData.append("category", uploadData.category);
                formData.append("description", uploadData.description.trim());

                const result = await createDocument(formData);
                if (!result?.success || !result?.data) {
                    throw new Error("The server did not confirm that the document was saved.");
                }

                setLoadError(false);
                setDocuments((current) => [
                    normalizeDocument(result.data),
                    ...current
                ]);
                setSuccess("Document uploaded successfully.");


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
                setError(
                    uploadError instanceof TypeError
                        ? "Unable to reach the server. Check your connection and try again."
                        : uploadError?.message || "Upload failed. Please try again."
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
                await deleteDocument(document.id);
                setDocuments((current) =>
                    current.filter((item) => item.id !== document.id)
                );
                if (selectedDocument?.id === document.id) {
                    setSelectedDocument(null);
                }
                setSuccess("Document deleted successfully.");

            } catch (deleteError) {
                setError(deleteError?.message || "Unable to delete this document.");
            }
        };


    /*
    ----------------------------------------------------
    OPEN DOCUMENT
    ----------------------------------------------------
    */

    const handleOpenDocument = async (document) => {
        if (!document.url) {
            setError("This document record has no privately stored file available to open.");
            return;
        }

        const previewWindow = window.open("about:blank", "_blank");
        if (!previewWindow) {
            setError("Allow pop-ups to open this document.");
            return;
        }
        previewWindow.opener = null;

        try {
            const blob = await downloadDocument(document.id);
            const objectUrl = URL.createObjectURL(blob);
            previewWindow.location.href = objectUrl;
            window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
        } catch (openError) {
            previewWindow.close();
            setError(openError?.message || "Unable to open this document.");
        }
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
            setAskAnswer("");
            setAskError("");
            setAnswerCopied(false);
            setCopyError("");

            setShowAskModal(
                true
            );
        };

    const chooseQuestionPrompt = (prompt) => {
        setAskQuestion(prompt);
        setAskAnswer("");
        setAskError("");
        setAnswerCopied(false);
        setCopyError("");
    };


    /*
    ----------------------------------------------------
    ASK AI SUBMIT
    ----------------------------------------------------
    */

    const handleAskQuestion = async (event) => {
        event.preventDefault();

        const question = askQuestion.trim();
        if (!question) {
            setAskError("Enter a question about this document.");
            return;
        }

        setAskingAI(true);
        setAskError("");
        setAskAnswer("");
        setAnswerCopied(false);
        setCopyError("");

        try {
            const result = await askDocumentQuestion(
                selectedDocument.id || selectedDocument._id,
                question
            );
            const answer = result?.data?.answer?.trim();
            if (!result?.success || !answer) {
                throw new Error("The AI service returned no answer. Please try again.");
            }
            setAskAnswer(answer);
        } catch (requestError) {
            if (requestError instanceof TypeError) {
                setAskError("Unable to connect to Document AI. Check your connection and try again.");
            } else if (requestError.status === 401) {
                setAskError("Your session has expired. Sign in again to ask about this document.");
            } else if (requestError.status === 404) {
                setAskError("This document is no longer available in your account.");
            } else if (requestError.status === 429) {
                setAskError("Document AI is receiving too many requests. Please try again shortly.");
            } else {
                setAskError(requestError.message || "Unable to answer this question. Please try again.");
            }
        } finally {
            setAskingAI(false);
        }
    };

    const handleCopyAnswer = async () => {
        const readableText = askAnswerRef.current?.innerText?.trim();
        if (!readableText) return;

        try {
            await navigator.clipboard.writeText(readableText);
            setAnswerCopied(true);
            setCopyError("");
        } catch {
            setAnswerCopied(false);
            setCopyError("Unable to copy the answer. Check clipboard permissions and try again.");
        }
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
                    <span aria-hidden="true">＋</span>
                    <span className="documents-upload-label-desktop">Upload Document</span>
                    <span className="documents-upload-label-mobile">Upload</span>
                </button>

            </header>


            {/* =========================================
                SUCCESS / ERROR
            ========================================== */}

            {success && (
                <div className="documents-alert documents-alert-success" role="status">
                    <span>✓</span>
                    {success}
                </div>
            )}


            {error && !dialogKind && (
                <div className="documents-alert documents-alert-error" role="alert">
                    <span>!</span>
                    {error}
                    {loadError && (
                        <button type="button" onClick={loadDocuments}>
                            Retry
                        </button>
                    )}
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
                                aria-label="Search documents"
                            />

                            {search && (
                                <button aria-label="Clear search"
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

                            <select aria-label="Filter documents by category"
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


                            <select aria-label="Filter documents by status"
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

                    {!loading && loadError && documents.length === 0 && (
                        <div className="documents-empty" role="alert">
                            <div className="documents-empty-icon">⚠️</div>
                            <h3>Documents could not be loaded</h3>
                            <p>Check your connection and try again.</p>
                            <button
                                type="button"
                                className="documents-primary-button"
                                onClick={loadDocuments}
                            >
                                Retry
                            </button>
                        </div>
                    )}


                    {/* =================================
                        EMPTY SEARCH RESULT
                    ================================== */}

                    {!loading &&
                        !loadError &&
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

            {showUploadModal && createPortal(<div className="documents-page documents-dialog-portal">

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

                    <div className="documents-modal" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="documents-upload-title" tabIndex={-1}>
                            {error && <div className="documents-alert documents-alert-error" role="alert">{error}</div>}

                        <div className="documents-modal-header">

                            <div>

                                <span className="documents-modal-eyebrow">
                                    ADD TO LIBRARY
                                </span>

                                <h2 id="documents-upload-title">
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
                                    aria-label="Close dialog"
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
                                    aria-label="Choose document file"
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

                                <label htmlFor="documents-title">
                                    Document Title
                                </label>

                                <input id="documents-title"
                                    type="text"
                                    name="title"
                                    value={
                                        uploadData.title
                                    }
                                    onChange={(
                                        event
                                    ) => {
                                        const { value } = event.target;
                                        setUploadData(
                                            (
                                                previous
                                            ) => ({
                                                ...previous,
                                                title: value
                                            })
                                        );
                                        setError((current) =>
                                            current === "Document title must be at least 2 characters."
                                                ? ""
                                                : current
                                        );
                                    }}
                                    placeholder="e.g. JavaScript Interview Notes"
                                    required
                                />

                            </div>


                            <div className="documents-form-grid">

                                <div className="documents-form-field">

                                    <label htmlFor="documents-category">
                                    Category
                                    </label>

                                    <select id="documents-category"
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

                                    <label htmlFor="documents-file-type">
                                    File Type
                                    </label>

                                    <input id="documents-file-type"
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

                                <label htmlFor="documents-description">
                                    Description
                                    <span>
                                        Optional
                                    </span>
                                </label>

                                <textarea id="documents-description"
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

            </div>, document.body)}


            {/* =========================================
                DOCUMENT DETAILS MODAL
            ========================================== */}

            {selectedDocument &&
                !showUploadModal && !showAskModal && createPortal(<div className="documents-page documents-dialog-portal">

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

                        <div className="documents-modal documents-preview-modal" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="documents-preview-title" tabIndex={-1}>
                            {error && <div className="documents-alert documents-alert-error" role="alert">{error}</div>}

                            <div className="documents-modal-header">

                                <div>

                                    <span className="documents-modal-eyebrow">
                                        DOCUMENT DETAILS
                                    </span>

                                    <h2 id="documents-preview-title">
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
                                    aria-label="Close dialog"
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
                                        id="documents-preview-ask"
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

                </div>, document.body)}


            {/* =========================================
                ASK AI MODAL
            ========================================== */}

            {showAskModal &&
                !showUploadModal && selectedDocument && createPortal(<div className="documents-page documents-dialog-portal">

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

                        <div className="documents-modal documents-ai-modal" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="documents-ai-title" tabIndex={-1}>
                            {error && <div className="documents-alert documents-alert-error" role="alert">{error}</div>}

                            <div className="documents-modal-header">

                                <div>

                                    <span className="documents-modal-eyebrow">
                                        DOCUMENT AI
                                    </span>

                                    <h2 id="documents-ai-title">
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
                                    aria-label="Close dialog"
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


                                <label htmlFor="documents-question">
                                    Your question
                                </label>


                                <textarea id="documents-question"
                                    rows="6"
                                    value={
                                        askQuestion
                                    }
                                    onChange={(event) => {
                                        setAskQuestion(event.target.value);
                                        setAskAnswer("");
                                        setAskError("");
                                        setAnswerCopied(false);
                                        setCopyError("");
                                    }}
                                    placeholder="Example: Explain the main concepts in this document..."
                                    autoFocus
                                    disabled={askingAI}
                                />


                                <div className="documents-question-examples">

                                    <button
                                        type="button"
                                        onClick={() => chooseQuestionPrompt(
                                            "Summarize the most important concepts in this document."
                                        )}
                                        disabled={askingAI}
                                    >
                                        Summarize it
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => chooseQuestionPrompt(
                                            "What should I remember from this document for an interview?"
                                        )}
                                        disabled={askingAI}
                                    >
                                        Interview points
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => chooseQuestionPrompt(
                                            "Explain the difficult concepts in simple language."
                                        )}
                                        disabled={askingAI}
                                    >
                                        Explain simply
                                    </button>

                                </div>


                                <div className="documents-ai-note">

                                    <span>
                                        💡
                                    </span>

                                    <p>
                                        Answers use text extracted from this document and are sent to the configured AI provider for this request.
                                    </p>

                                </div>

                                {askError && (
                                    <div className="documents-ai-error" role="alert">
                                        {askError}
                                    </div>
                                )}

                                {askingAI && (
                                    <div className="documents-ai-loading" role="status" aria-live="polite">
                                        Reading the document and preparing an answer…
                                    </div>
                                )}

                                {askAnswer && (
                                    <section className="documents-ai-answer" aria-live="polite">
                                        <div className="documents-ai-answer-header">
                                            <h3>Answer</h3>
                                            <button
                                                type="button"
                                                className="documents-ai-copy-button"
                                                onClick={handleCopyAnswer}
                                                aria-label="Copy answer as plain text"
                                            >
                                                {answerCopied ? "Copied" : "Copy answer"}
                                            </button>
                                        </div>
                                        <div className="documents-ai-answer-content" ref={askAnswerRef}>
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {askAnswer}
                                            </ReactMarkdown>
                                        </div>
                                        {copyError && (
                                            <p className="documents-ai-copy-error" role="status">
                                                {copyError}
                                            </p>
                                        )}
                                    </section>
                                )}


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
                                        disabled={askingAI}
                                    >
                                        {askingAI ? "Working..." : "Ask Document AI"}
                                    </button>

                                </div>

                            </form>

                        </div>

                    </div>

                </div>, document.body)}

        </div>
    );
};


export default function DocumentsDesktopCanvas() {
    return (
        <div className="documents-desktop-scroll" role="region" aria-label="Documents page. Scroll horizontally to view all content on narrow screens." tabIndex={0}>
            <div className="documents-desktop-canvas">
                <Documents />
            </div>
        </div>
    );
}
