// Only fixed, reviewed messages may cross the error boundary. Database and
// parser exception text can contain request values, credentials or file paths.
const getSafeErrorMessage = (error, fallback, expectedMessages = []) => {
    if (expectedMessages.includes(error?.message)) return error.message;
    if (error?.name === "ValidationError") return "Invalid input. Please check your values.";
    if (error?.name === "CastError") return "Invalid record value or identifier.";
    if (error?.code === 11000) return "A record with these details already exists.";
    return fallback;
};

const logError = (operation, error) => {
    // Never log the error object, message, stack, request body or identity.
    const category = error?.name === "ValidationError" ? "validation"
        : error?.name === "CastError" ? "invalid-value"
        : error?.code === 11000 ? "duplicate-record" : "internal";
    console.error(operation, { category });
};

const errorMiddleware = (err, req, res, next) => {
    const status = Number.isInteger(err?.statusCode) && err.statusCode >= 400 && err.statusCode <= 599
        ? err.statusCode : 500;
    let message = status >= 500 ? "Internal Server Error" : "Request could not be processed";
    if (status < 500) {
        if (err?.type === "entity.parse.failed") message = "Invalid JSON request body";
        else if (err?.type === "entity.too.large") message = "Request body is too large";
        else message = getSafeErrorMessage(err, message, ["Origin not allowed by CORS"]);
    }
    logError("Request failed", err);
    res.status(status).json({
        success: false,
        message,
        errorCode: null,
        field: null
    });
};

module.exports = errorMiddleware;
module.exports.getSafeErrorMessage = getSafeErrorMessage;
module.exports.logError = logError;
