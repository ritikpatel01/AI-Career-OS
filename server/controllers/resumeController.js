const {
    getResumes,
    createResume,
    getResumeById,
    updateResume,
    deleteResume
} = require("../services/resumeService");

const {
    extractResumeText,
    ResumeDocumentError
} = require("../services/resumeParserService");

const {
    analyzeResume: analyzeResumeService
} = require("../services/resumeAnalysisService");


// ==========================================
// GET ALL RESUMES
// ==========================================

const getAllResumes = async (req, res) => {
    try {
        const userId = req.user.userId;

        const resumes = await getResumes(userId);

        return res.status(200).json({
            success: true,
            message: "Resumes fetched successfully",
            data: resumes
        });

    } catch (error) {
        console.error("Get Resumes Error:");

        return res.status(500).json({
            success: false,
            message: "Failed to fetch resumes",
            error: "Failed to fetch resumes"
        });
    }
};


// ==========================================
// CREATE RESUME
// ==========================================

const createNewResume = async (req, res) => {
    try {
        const userId = req.user.userId;

        const resume = await createResume(
            userId,
            req.body
        );

        return res.status(201).json({
            success: true,
            message: "Resume created successfully",
            data: resume
        });

    } catch (error) {
        console.error("Create Resume Error:");

        return res.status(400).json({
            success: false,
            message: "Failed to create resume",
            error: "Failed to create resume"
        });
    }
};


// ==========================================
// GET SINGLE RESUME
// ==========================================

const getResume = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        const resume = await getResumeById(
            userId,
            id
        );

        if (!resume) {
            return res.status(404).json({
                success: false,
                message: "Resume not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Resume fetched successfully",
            data: resume
        });

    } catch (error) {
        console.error("Get Single Resume Error:");

        return res.status(500).json({
            success: false,
            message: "Failed to fetch resume",
            error: "Failed to fetch resume"
        });
    }
};


// ==========================================
// UPDATE RESUME
// ==========================================

const updateResumeData = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        const resume = await updateResume(
            userId,
            id,
            req.body
        );

        if (!resume) {
            return res.status(404).json({
                success: false,
                message: "Resume not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Resume updated successfully",
            data: resume
        });

    } catch (error) {
        console.error("Update Resume Error:");

        return res.status(400).json({
            success: false,
            message: "Failed to update resume",
            error: "Failed to update resume"
        });
    }
};


// ==========================================
// DELETE RESUME
// ==========================================

const removeResume = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        const resume = await deleteResume(
            userId,
            id
        );

        if (!resume) {
            return res.status(404).json({
                success: false,
                message: "Resume not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Resume deleted successfully"
        });

    } catch (error) {
        console.error("Delete Resume Error:");

        return res.status(500).json({
            success: false,
            message: "Failed to delete resume",
            error: "Failed to delete resume"
        });
    }
};


// ==========================================
// ANALYZE RESUME
// ==========================================

const analyzeResume = async (req, res) => {
    try {

        console.log("");
        console.log("=========================================");
        console.log("       RESUME ANALYSIS REQUEST");
        console.log("=========================================");

        console.log(
            "File received:",
            Boolean(req.file)
        );

        console.log(
            "Type:",
            req.file?.mimetype || "Unknown"
        );

        console.log(
            "Size:",
            req.file?.size || 0
        );

        console.log(
            "Target Role:",
            req.body?.targetRole || "Not provided"
        );

        console.log("=========================================");
        console.log("");


        // ==========================================
        // CHECK FILE
        // ==========================================

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Resume file is required"
            });
        }


        // ==========================================
        // CHECK TARGET ROLE
        // ==========================================

        const targetRole =
            req.body?.targetRole?.trim();


        if (!targetRole) {
            return res.status(400).json({
                success: false,
                message: "Target job role is required"
            });
        }


        const jobDescription = req.body?.jobDescription === undefined ? "" : req.body.jobDescription;
        if (typeof jobDescription !== "string" || jobDescription.length > 20000) {
            return res.status(400).json({ success: false, message: "Job description must be a string of at most 20,000 characters." });
        }

        // ==========================================
        // EXTRACT RESUME TEXT
        // ==========================================

        const resumeText =
            await extractResumeText(
                req.file
            );


        // ==========================================
        // CHECK EXTRACTED TEXT
        // ==========================================

        if (
            !resumeText ||
            typeof resumeText !== "string" ||
            !resumeText.trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Could not extract readable text from resume"
            });
        }


        // ==========================================
        // ANALYZE RESUME
        // ==========================================

        const analysis =
            await Promise.resolve(
                analyzeResumeService(
                    resumeText,
                    targetRole,
                    jobDescription.trim()
                )
            );


        // ==========================================
        // CHECK ANALYSIS RESULT
        // ==========================================

        if (!analysis) {
            return res.status(500).json({
                success: false,
                message:
                    "Resume analysis returned no result"
            });
        }


        // ==========================================
        // UNSUPPORTED ROLE
        // ==========================================

        if (
            analysis.supportedRole === false
        ) {
            return res.status(422).json({
                success: false,
                message:
                    analysis.message ||
                    `Target role "${targetRole}" is not currently supported.`,
                data: {
                    targetRole,
                    normalizedRole:
                        analysis.normalizedRole || null,
                    supportedRole: false,
                    availableRoles:
                        analysis.availableRoles || []
                }
            });
        }


        // ==========================================
        // VALIDATE NEW ANALYSIS STRUCTURE
        // ==========================================

        if (
            analysis.success === false
        ) {
            return res.status(422).json({
                success: false,
                message:
                    analysis.message ||
                    "Resume could not be analyzed",
                data: {
                    analysis
                }
            });
        }


        // ==========================================
        // ANALYSIS RESULT LOG
        // ==========================================

        console.log("");
        console.log("=========================================");
        console.log("       RESUME ANALYSIS RESULT");
        console.log("=========================================");

        console.log(
            "Analysis Version:",
            analysis.analysisVersion
        );

        console.log(
            "Target Role:",
            analysis.targetRole
        );

        console.log(
            "Overall Score:",
            analysis.scores?.overall
        );

        console.log(
            "Role Alignment:",
            analysis.scores?.roleAlignment
        );

        console.log(
            "Technical Skills:",
            analysis.scores?.technicalSkills
        );

        console.log(
            "Resume Quality:",
            analysis.scores?.resumeQuality
        );

        console.log(
            "ATS Compatibility:",
            analysis.scores?.atsCompatibility
        );

        console.log(
            "Matched Skills:",
            analysis.matchedSkills?.length || 0
        );

        console.log(
            "Missing Skills:",
            analysis.missingSkills?.length || 0
        );

        console.log("=========================================");
        console.log("");


        // ==========================================
        // SUCCESS RESPONSE
        // ==========================================

        return res.status(200).json({

            success: true,

            message:
                "Resume analyzed successfully",

            data: {

                fileName:
                    req.file.originalname,

                fileType:
                    req.file.mimetype,

                fileSize:
                    req.file.size,

                targetRole,

                analysis

            }
        });


    } catch (error) {

        const documentError = error instanceof ResumeDocumentError;
        // Never log parser messages, stacks, filenames, or extracted contents.
        console.error("Resume analysis failed", {
            category: documentError ? "document-input" : "internal"
        });
        const message = documentError ? error.message : "Resume analysis failed";
        return res.status(documentError ? 422 : 500).json({
            success: false,
            message,
            error: message
        });
    }
};


// ==========================================
// EXPORT CONTROLLERS
// ==========================================

module.exports = {

    getAllResumes,

    createNewResume,

    getResume,

    updateResumeData,

    removeResume,

    analyzeResume

};
