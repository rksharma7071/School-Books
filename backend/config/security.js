import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";


const normalizeOrigin = (origin) => {
    if (!origin) return "";
    return origin.trim().replace(/\/+$/, "");
};

const allowedOrigins = (process.env.FRONTEND_URL || "")
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean);

if (process.env.NODE_ENV === "production" && allowedOrigins.length === 0) {
    throw new Error(
        "FRONTEND_URL must be configured in production. " +
        "Example: FRONTEND_URL=https://myapp.com,https://admin.myapp.com"
    );
}

console.log(`[Security] CORS allowed origins: ${allowedOrigins.length > 0 ? allowedOrigins.join(", ") : "ALL (development mode)"}`);

export const corsMiddleware = cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, etc.)
        if (!origin) {
            return callback(null, true);
        }

        const normalizedOrigin = normalizeOrigin(origin);

        // ✅ Development mode: allow all origins
        if (process.env.NODE_ENV !== "production" && allowedOrigins.length === 0) {
            console.warn(`[CORS] Development mode: Allowing origin: ${normalizedOrigin}`);
            return callback(null, true);
        }

        // ✅ Production mode: strict origin checking
        if (allowedOrigins.includes(normalizedOrigin)) {
            return callback(null, true);
        }

        console.error(`[CORS] Blocked origin: ${normalizedOrigin}`);
        return callback(new Error("CORS origin not allowed"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
        "Origin",
        "X-Requested-With",
        "Content-Type",
        "Accept",
        "Authorization"
    ],
    exposedHeaders: ["Content-Length", "Content-Range"],
    maxAge: 86400, // 24 hours
    optionsSuccessStatus: 204,
    preflightContinue: false, // ✅ Important: Don't continue after preflight
});

// ✅ Preflight handler
export const handlePreflight = (req, res) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.sendStatus(204);
};

export const helmetMiddleware = helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", ...allowedOrigins],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
    },
    frameguard: {
        action: "deny"
    },
    hidePoweredBy: true,
    noSniff: true,
    xssFilter: true,
});


export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per window
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests. Please try again later."
    },
});

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 requests per window
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many authentication attempts. Please try again later."
    },
});

export const razorpayLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 requests per window
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many payment requests. Please try again later."
    },
});

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // 300 requests per window
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many API requests. Please try again later."
    },
});

export const validateProductionConfig = () => {
    if (process.env.NODE_ENV !== "production") {
        console.warn("[Security] Running in development mode with relaxed security");
        return;
    }

    const requiredEnvVars = [
        "JWT_SECRET",
        "MONGODB_URL",
        "FRONTEND_URL",
        "RAZORPAY_KEY_ID",
        "RAZORPAY_KEY_SECRET",
    ];

    const missingVars = requiredEnvVars.filter(
        (varName) => !process.env[varName]
    );

    if (missingVars.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missingVars.join(", ")}`
        );
    }

    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
        console.warn(
            "[Security] JWT_SECRET is too short. Recommended at least 32 characters."
        );
    }

    console.log("[Security] Production configuration validated successfully");
};