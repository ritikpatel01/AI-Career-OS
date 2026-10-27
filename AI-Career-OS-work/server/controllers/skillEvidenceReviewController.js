const mongoose = require("mongoose");
const SkillEvidence = require("../models/SkillEvidence");

const REVIEW_STATUSES = [
    "under-review",
    "verified",
    "rejected"
];

// GET /api/admin/skill-evidence
const getEvidenceReviewQueue = async (req, res) => {
    try {
        const allowedFilters = [
            "unverified",
            "under-review",
            "verified",
            "rejected",
            "all"
        ];

        const status = req.query.status;

        if (status && !allowedFilters.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid verification status filter."
            });
        }

        let filter;

        if (status === "all") {
            filter = {};
        } else if (status) {
            filter = {
                verificationStatus: status
            };
        } else {
            // Default queue shows evidence waiting for review
            // and evidence that is currently under review.
            filter = {
                verificationStatus: {
                    $in: ["unverified", "under-review"]
                }
            };
        }

        const evidence = await SkillEvidence.find(filter)
            .populate("user", "name email")
            .populate("skill", "name category")
            .populate("reviewedBy", "name email")
            .sort({ createdAt: 1 });

        return res.status(200).json({
            success: true,
            message: "Evidence review queue fetched successfully.",
            count: evidence.length,
            data: evidence
        });
    } catch (error) {
        console.error("Evidence review queue error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to load evidence review queue."
        });
    }
};

// PATCH /api/admin/skill-evidence/:evidenceId
const updateEvidenceReview = async (req, res) => {
    try {
        const { evidenceId } = req.params;
        const { verificationStatus, reviewNote } = req.body;

        if (!mongoose.Types.ObjectId.isValid(evidenceId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid evidence ID."
            });
        }

        if (!REVIEW_STATUSES.includes(verificationStatus)) {
            return res.status(400).json({
                success: false,
                message:
                    "Status must be under-review, verified, or rejected."
            });
        }

        if (
            reviewNote !== undefined &&
            typeof reviewNote !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Review note must be text."
            });
        }

        const note =
            typeof reviewNote === "string"
                ? reviewNote.trim()
                : "";

        if (note.length > 1000) {
            return res.status(400).json({
                success: false,
                message: "Review note cannot exceed 1000 characters."
            });
        }

        if (
            verificationStatus === "rejected" &&
            !note
        ) {
            return res.status(400).json({
                success: false,
                message: "Provide a reason when rejecting evidence."
            });
        }

        const evidence = await SkillEvidence.findById(evidenceId);

        if (!evidence) {
            return res.status(404).json({
                success: false,
                message: "Evidence not found."
            });
        }

        evidence.verificationStatus = verificationStatus;
        evidence.reviewNote = note;
        evidence.reviewedBy = req.adminUser._id;
        evidence.reviewedAt = new Date();

        await evidence.save();

        await evidence.populate([
            {
                path: "user",
                select: "name email"
            },
            {
                path: "skill",
                select: "name category"
            },
            {
                path: "reviewedBy",
                select: "name email"
            }
        ]);

        return res.status(200).json({
            success: true,
            message: "Evidence review saved successfully.",
            data: evidence
        });
    } catch (error) {
        console.error("Update evidence review error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update evidence review."
        });
    }
};

module.exports = {
    getEvidenceReviewQueue,
    updateEvidenceReview
};