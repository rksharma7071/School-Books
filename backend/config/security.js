import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

const allowlist = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export const corsMiddleware = cors({
    origin(origin, cb) {
        if (!origin || allowlist.length === 0 || allowlist.includes(origin)) {
            return cb(null, true);
        }
        return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
});

export const helmetMiddleware = helmet();

export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
});

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many attempts, please try again later." },
});
