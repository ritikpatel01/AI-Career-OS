const express = require("express");

const {
    forgotPassword,
    verifyResetCode,
    resetPassword
} = require(
    "../controllers/passwordResetController"
);

const router = express.Router();


router.post(
    "/forgot-password",
    forgotPassword
);


router.post(
    "/verify-reset-code",
    verifyResetCode
);


router.post(
    "/reset-password",
    resetPassword
);


module.exports = router;