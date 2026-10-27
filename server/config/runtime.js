const localOrigins = [
    "http://localhost:5173", "http://127.0.0.1:5173", "http://10.22.17.193:5173",
    "http://localhost:5174", "http://127.0.0.1:5174", "http://10.22.17.193:5174",
];

function allowedOrigins(env = process.env) {
    const production = env.NODE_ENV === "production";
    const configured = String(env.CORS_ORIGINS || "").split(",").map(value => value.trim()).filter(Boolean);
    if (production && !configured.length) throw new Error("CORS_ORIGINS is required in production");
    const origins = configured.map(value => {
        let url;
        try { url = new URL(value); } catch { throw new Error("CORS_ORIGINS must contain explicit origins"); }
        if (url.username || url.password || url.search || url.hash || url.pathname !== "/" || !["http:", "https:"].includes(url.protocol) || (production && url.protocol !== "https:") || url.hostname.includes("*")) {
            throw new Error("CORS_ORIGINS must contain explicit HTTPS origins in production");
        }
        return url.origin;
    });
    return new Set(production ? origins : [...localOrigins, ...origins]);
}

function corsOptions(env = process.env) {
    const origins = allowedOrigins(env);
    return {
        origin(origin, callback) {
            if (!origin || origins.has(origin)) return callback(null, true);
            const error = new Error("Origin not allowed by CORS");
            error.statusCode = 403;
            return callback(error);
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    };
}

function validateEnvironment(env = process.env) {
    for (const key of ["MONGO_URI", "JWT_SECRET"]) {
        if (!env[key]?.trim()) throw new Error(`Missing required configuration: ${key}`);
    }
    allowedOrigins(env);
    if (env.NODE_ENV === "production") {
        if (Buffer.byteLength(env.JWT_SECRET) < 32) throw new Error("JWT_SECRET must be at least 32 bytes in production");
        for (const key of ["MAIL_HOST", "MAIL_PORT", "MAIL_SECURE", "MAIL_USER", "MAIL_PASS", "MAIL_FROM"]) {
            if (!env[key]?.trim()) throw new Error(`Missing required configuration: ${key}`);
        }
        if (!["true", "false"].includes(env.MAIL_SECURE) || !Number.isInteger(Number(env.MAIL_PORT)) || Number(env.MAIL_PORT) < 1 || Number(env.MAIL_PORT) > 65535) throw new Error("Invalid mail transport configuration");
    }
}

module.exports = { allowedOrigins, corsOptions, validateEnvironment };
