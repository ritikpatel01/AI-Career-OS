const errorMiddleware = (err, req, res, next) => {

    console.log("=================================");
    console.log("ERROR MESSAGE:", err.message);
    console.log("ERROR NAME:", err.name);
    console.log("ERROR CODE:", err.code);
    console.log("ERROR FIELD:", err.field);
    console.log("=================================");

    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
        errorCode: err.code || null,
        field: err.field || null
    });
};

module.exports = errorMiddleware;