
const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const {
    getAdminDataSummary,
    getAdminDataRecords,
    getAdminDataRecord,
    updateAdminDataRecord,
    deleteAdminDataRecord
} = require("../controllers/adminDataController");

const router = express.Router();

// Every endpoint requires a valid token and an admin role
// verified against the database.
router.use(authMiddleware);
router.use(adminMiddleware);

// Keep the summary route before the dynamic resource route.
router.get("/summary", getAdminDataSummary);

router.get("/:resource", getAdminDataRecords);
router.get("/:resource/:recordId", getAdminDataRecord);
router.patch("/:resource/:recordId", updateAdminDataRecord);
router.delete("/:resource/:recordId", deleteAdminDataRecord);

module.exports = router;
