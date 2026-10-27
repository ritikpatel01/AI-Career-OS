const {
    getResumes,
    createResume,
    getResumeById,
    updateResume,
    deleteResume
} = require("../services/resumeService");

const {
    extractResumeText
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
        console.error("Get Resumes Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch resumes",
            error: error.message
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
        console.error("Create Resume Error:", error);

        return res.status(400).json({
            success: false,
            message: "Failed to create resume",
            error: error.message
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
        console.error(
            "Get Single Resume Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch resume",
            error: error.message
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
        console.error(
            "Update Resume Error:",
            error
        );

        return res.status(400).json({
            success: false,
            message: "Failed to update resume",
            error: error.message
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
        console.error(
            "Delete Resume Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to delete resume",
            error: error.message
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
            "File:",
            req.file?.originalname || "No file"
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
                    targetRole
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

        // ==========================================
        // ANALYSIS ERROR
        // ==========================================

        console.error("");
        console.error("=========================================");
        console.error("       RESUME ANALYSIS ERROR");
        console.error("=========================================");

        console.error(
            error.stack || error.message
        );

        console.error("=========================================");
        console.error("");


        return res.status(500).json({

            success: false,

            message:
                "Resume analysis failed",

            error:
                error.message
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