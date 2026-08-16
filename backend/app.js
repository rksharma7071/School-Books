import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import "dotenv/config";

import { connectDB } from "./config/database.js";

import bookRouter from "./routes/book.route.js";
import userRouter from "./routes/user.route.js";
import authRouter from "./routes/auth.route.js";
import reviewRouter from "./routes/review.route.js";
import cartRouter from "./routes/cart.route.js";
import paymentRouter from "./routes/payment.route.js";
import discountRouter from "./routes/discount.route.js";
import orderRouter from "./routes/order.route.js";
import razorpayRoutes from "./routes/razorpay.routes.js";
import addressRoutes from "./routes/address.route.js";

import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

const PORT = process.env.PORT || 3000;

const normalizeOrigin = (origin) => {
    if (!origin) {
        return "";
    }

    return origin.trim().replace(/\/+$/, "");
};

const allowedOrigins = (process.env.FRONTEND_URL || "")
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean);

console.log("Allowed CORS origins:", allowedOrigins);

app.disable("x-powered-by");

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin) {
                return callback(null, true);
            }

            const normalizedOrigin = normalizeOrigin(origin);

            if (allowedOrigins.length === 0) {
                console.warn("FRONTEND_URL is not configured. Allowing origin:", normalizedOrigin);

                return callback(null, true);
            }

            if (
                allowedOrigins.includes(normalizedOrigin)
            ) {
                return callback(null, true);
            }

            console.error(`CORS blocked origin: ${normalizedOrigin}`);

            return callback(
                new Error("CORS origin not allowed")
            );
        },

        credentials: true,

        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"],
        exposedHeaders: ["Content-Length", "Content-Range"],

        maxAge: 86400,
        optionsSuccessStatus: 204,
    })
);

app.options(
    "*",
    cors({
        origin: (origin, callback) => {
            if (!origin) {
                return callback(null, true);
            }

            const normalizedOrigin = normalizeOrigin(origin);

            if (
                allowedOrigins.length === 0 ||
                allowedOrigins.includes(normalizedOrigin)
            ) {
                return callback(null, true);
            }

            return callback(new Error("CORS origin not allowed"));
        },

        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"],
    })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { success: false, message: "Too many requests. Please try again later." },
});

app.use("/api", apiLimiter);

app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        status: "ok",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
    });
});

app.use("/api/book", bookRouter);
app.use("/api/user", userRouter);
app.use("/api/auth", authRouter);
app.use("/api/review", reviewRouter);
app.use("/api/cart", cartRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/discount", discountRouter);
app.use("/api/order", orderRouter);
app.use("/api/razorpay", razorpayRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/file", fileRouter);

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "School Books API is running",

        endpoints: {
            health: "/health",
            books: "/api/book",
            users: "/api/user",
            auth: "/api/auth",
            reviews: "/api/review",
            cart: "/api/cart",
            payments: "/api/payment",
            discounts: "/api/discount",
            orders: "/api/order",
            razorpay: "/api/razorpay",
            addresses: "/api/address",
        },
    });
});

app.use((req, res) => {
    res.status(404).json({ success: false, message: "Route not found", path: req.originalUrl });
});

app.use(errorHandler);

const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};

startServer();

export default app;
