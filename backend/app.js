import express from "express";
import "dotenv/config";

import { connectDB } from "./config/database.js";
import {
    corsMiddleware,
    helmetMiddleware,
    globalLimiter,
    apiLimiter,
    validateProductionConfig,
} from "./config/security.js";

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
import categoryRouter from "./routes/category.route.js";

import { errorHandler } from "./middlewares/errorHandler.js";
import { handleRazorpayWebhook } from "./controllers/razorpay.controller.js";

validateProductionConfig();

const app = express();
const PORT = process.env.PORT || 3000;

app.disable("x-powered-by");
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(globalLimiter);

app.post(
    "/api/razorpay/webhook",
    express.raw({ type: "application/json", limit: "1mb" }),
    handleRazorpayWebhook
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));


app.use("/api", apiLimiter);

// ============================================
// HEALTH CHECK
// ============================================

app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        status: "ok",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
        cors: {
            allowedOrigins: (process.env.FRONTEND_URL || "").split(",").filter(Boolean),
        },
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
app.use("/api/categories", categoryRouter);


app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "School Books API is running",
        version: "1.0.0",
        environment: process.env.NODE_ENV || "development",
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
            categories: "/api/categories",
        },
    });
});

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
        path: req.originalUrl,
    });
});

app.use(errorHandler);

const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`[Server] Running on port ${PORT}`);
            console.log(`[Server] Environment: ${process.env.NODE_ENV || "development"}`);
            console.log(`[Server] Health check: http://localhost:${PORT}/health`);
        });
    } catch (error) {
        console.error("[Server] Failed to start:", error.message);
        process.exit(1);
    }
};

startServer();

export default app;