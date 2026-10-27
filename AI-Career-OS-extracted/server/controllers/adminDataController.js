
const mongoose = require("mongoose");

const Profile = require("../models/Profile");
const Project = require("../models/Project");
const Resume = require("../models/Resume");
const Skill = require("../models/Skill");
const Document = require("../models/Document");
const DSA = require("../models/DSA");
const Interview = require("../models/Interview");
const Progress = require("../models/Progress");
const Activity = require("../models/Activity");
const Notification = require("../models/Notification");
const Roadmap = require("../models/Roadmap");
const SkillEvidence = require("../models/SkillEvidence");

// ==========================================
// AVAILABLE ADMIN DATA RESOURCES
// Only explicitly listed models are accessible.
// ==========================================
const DATA_RESOURCES = {
    profiles: {
        model: Profile,
        searchFields: ["bio", "phone", "location"],
        editableFields: [
            "bio",
            "phone",
            "location",
            "education",
            "experience",
            "socialLinks"
        ]
    },

    projects: {
        model: Project,
        searchFields: ["title", "description"],
        editableFields: [
            "title",
            "description",
            "technologies",
            "githubUrl",
            "liveUrl",
            "status"
        ]
    },

    resumes: {
        model: Resume,
        searchFields: ["title", "fullName", "jobTitle", "email"],
        editableFields: [
            "title",
            "fullName",
            "jobTitle",
            "email",
            "phone",
            "location",
            "github",
            "linkedin",
            "portfolio",
            "summary",
            "skills",
            "education",
            "experience",
            "projects",
            "certifications",
            "achievements",
            "resumeUrl"
        ]
    },

    skills: {
        model: Skill,
        searchFields: ["name", "category", "level"],
        editableFields: [
            "name",
            "category",
            "level",
            "progress"
        ]
    },

    documents: {
        model: Document,
        searchFields: ["title", "fileName", "fileType", "status"],
        editableFields: [
            "title",
            "fileName",
            "fileUrl",
            "fileType",
            "extractedText",
            "status"
        ]
    },

    dsa: {
        model: DSA,
        searchFields: ["topic", "category", "difficulty", "status"],
        editableFields: [
            "topic",
            "category",
            "difficulty",
            "status",
            "problemsSolved",
            "problemTarget",
            "notes"
        ]
    },

    interviews: {
        model: Interview,
        searchFields: ["role", "category", "topic", "question"],
        editableFields: [
            "role",
            "category",
            "topic",
            "difficulty",
            "question",
            "expectedConcepts",
            "criticalConcepts",
            "commonMistakes",
            "answer",
            "evaluation",
            "score",
            "status"
        ]
    },

    progress: {
        model: Progress,
        searchFields: ["category"],
        editableFields: [
            "category",
            "completed",
            "total",
            "percentage"
        ]
    },

    activities: {
        model: Activity,
        searchFields: ["type", "title", "description"],
        editableFields: [
            "type",
            "title",
            "description",
            "metadata"
        ]
    },

    notifications: {
        model: Notification,
        searchFields: ["title", "message", "type"],
        editableFields: [
            "title",
            "message",
            "type",
            "isRead",
            "link"
        ]
    },

    roadmaps: {
        model: Roadmap,
        searchFields: ["title", "description", "goal"],
        editableFields: [
            "title",
            "description",
            "goal",
            "steps",
            "progress"
        ]
    },

    "skill-evidence": {
        model: SkillEvidence,
        searchFields: [
            "title",
            "type",
            "url",
            "verificationStatus"
        ],
        // Evidence reviews use the dedicated review controller.
        editableFields: []
    }
};

// ==========================================
// POPULATE SAFE RELATED USER INFORMATION
// ==========================================
const populateReferences = (query, Model) => {
    if (Model.schema.path("user")) {
        query = query.populate({
            path: "user",
            select: "_id name email role"
        });
    }

    if (Model.schema.path("skill")) {
        query = query.populate({
            path: "skill",
            select: "_id name category"
        });
    }

    if (Model.schema.path("reviewedBy")) {
        query = query.populate({
            path: "reviewedBy",
            select: "_id name email"
        });
    }

    return query;
};

// ==========================================
// GET ADMIN DATA SUMMARY
// GET /api/admin/data/summary
// ==========================================
const getAdminDataSummary = async (req, res) => {
    try {
        const entries = Object.entries(DATA_RESOURCES);

        const counts = await Promise.all(
            entries.map(async ([resource, config]) => ({
                resource,
                count: await config.model.countDocuments()
            }))
        );

        return res.status(200).json({
            success: true,
            message: "Admin data summary fetched successfully",
            data: counts
        });
    } catch (error) {
        console.error("Admin data summary error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch admin data summary"
        });
    }
};

// ==========================================
// GET RECORDS ACROSS USERS
// GET /api/admin/data/:resource
//
// Optional query parameters:
// ?userId=USER_ID&page=1&limit=25&search=text
// ==========================================
const getAdminDataRecords = async (req, res) => {
    try {
        const { resource } = req.params;
        const config = DATA_RESOURCES[resource];

        if (!config) {
            return res.status(404).json({
                success: false,
                message: "Unknown data resource"
            });
        }

        const Model = config.model;

        const parsedPage = Number.parseInt(req.query.page, 10);
        const parsedLimit = Number.parseInt(req.query.limit, 10);

        const page = Number.isFinite(parsedPage)
            ? Math.max(1, parsedPage)
            : 1;

        const limit = Number.isFinite(parsedLimit)
            ? Math.min(100, Math.max(1, parsedLimit))
            : 25;

        const filter = {};

        // Filter to a particular user's records when requested.
        if (req.query.userId) {
            if (
                typeof req.query.userId !== "string" ||
                !mongoose.Types.ObjectId.isValid(req.query.userId)
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid user ID"
                });
            }

            if (!Model.schema.path("user")) {
                return res.status(400).json({
                    success: false,
                    message: "This resource is not linked to an individual user"
                });
            }

            filter.user = req.query.userId;
        }

        const search = String(req.query.search || "").trim();

        if (search && config.searchFields.length > 0) {
            const escapedSearch = search.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );

            filter.$or = config.searchFields.map((field) => ({
                [field]: {
                    $regex: escapedSearch,
                    $options: "i"
                }
            }));
        }

        const [records, total] = await Promise.all([
            populateReferences(
                Model.find(filter),
                Model
            )
                .sort({ createdAt: -1, _id: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),

            Model.countDocuments(filter)
        ]);

        return res.status(200).json({
            success: true,
            message: "Admin records fetched successfully",
            data: records,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Get admin data records error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch records"
        });
    }
};

// ==========================================
// GET ONE RECORD
// GET /api/admin/data/:resource/:recordId
// ==========================================
const getAdminDataRecord = async (req, res) => {
    try {
        const { resource, recordId } = req.params;
        const config = DATA_RESOURCES[resource];

        if (!config) {
            return res.status(404).json({
                success: false,
                message: "Unknown data resource"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(recordId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid record ID"
            });
        }

        const record = await populateReferences(
            config.model.findById(recordId),
            config.model
        ).lean();

        if (!record) {
            return res.status(404).json({
                success: false,
                message: "Record not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Record fetched successfully",
            data: record
        });
    } catch (error) {
        console.error("Get admin record error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch record"
        });
    }
};

// ==========================================
// UPDATE A RECORD
// PATCH /api/admin/data/:resource/:recordId
// ==========================================
const updateAdminDataRecord = async (req, res) => {
    try {
        const { resource, recordId } = req.params;
        const config = DATA_RESOURCES[resource];

        if (!config) {
            return res.status(404).json({
                success: false,
                message: "Unknown data resource"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(recordId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid record ID"
            });
        }

        if (config.editableFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Use the dedicated review endpoint for this resource"
            });
        }

        if (
            !req.body ||
            typeof req.body !== "object" ||
            Array.isArray(req.body)
        ) {
            return res.status(400).json({
                success: false,
                message: "A JSON object is required"
            });
        }

        const safeUpdates = {};

        for (const field of config.editableFields) {
            if (
                Object.prototype.hasOwnProperty.call(req.body, field)
            ) {
                safeUpdates[field] = req.body[field];
            }
        }

        if (Object.keys(safeUpdates).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No editable fields were provided"
            });
        }

        const record = await config.model.findByIdAndUpdate(
            recordId,
            { $set: safeUpdates },
            {
                new: true,
                runValidators: true
            }
        );

        if (!record) {
            return res.status(404).json({
                success: false,
                message: "Record not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Record updated successfully",
            data: record
        });
    } catch (error) {
        console.error("Update admin data record error:", error);

        return res.status(400).json({
            success: false,
            message: "Failed to update record"
        });
    }
};

// ==========================================
// DELETE A RECORD
// DELETE /api/admin/data/:resource/:recordId
// ==========================================
const deleteAdminDataRecord = async (req, res) => {
    try {
        const { resource, recordId } = req.params;
        const config = DATA_RESOURCES[resource];

        if (!config) {
            return res.status(404).json({
                success: false,
                message: "Unknown data resource"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(recordId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid record ID"
            });
        }

        const deletedRecord = await config.model.findByIdAndDelete(
            recordId
        );

        if (!deletedRecord) {
            return res.status(404).json({
                success: false,
                message: "Record not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Record deleted successfully",
            data: {
                id: deletedRecord._id,
                resource
            }
        });
    } catch (error) {
        console.error("Delete admin data record error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete record"
        });
    }
};

// ==========================================
// EXPORT CONTROLLER FUNCTIONS
// ==========================================
module.exports = {
    getAdminDataSummary,
    getAdminDataRecords,
    getAdminDataRecord,
    updateAdminDataRecord,
    deleteAdminDataRecord
};
