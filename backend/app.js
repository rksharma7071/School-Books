import express from "express";
import "dotenv/config";
import compression from "compression";

import { connectDB } from "./config/database.js";
import {
    corsMiddleware,
    helmetMiddleware,
    globalLimiter,
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
import fileRouter from "./routes/file.route.js";

import { Book } from "./models/book.model.js";
import { User } from "./models/user.model.js";
import { Cart } from "./models/cart.model.js";
import { Order } from "./models/order.model.js";
import { Payment } from "./models/payment.model.js";
import { Review } from "./models/review.model.js";
import { Discount } from "./models/discount.model.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.set("trust proxy", 1);

app.use(helmetMiddleware);
app.use(compression());
app.use(corsMiddleware);
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(express.json({ limit: "1mb" }));
app.use(globalLimiter);

app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));

app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (e) {
        console.error("DB connection failed:", e.message);
        res.status(503).json({ message: "Database unavailable" });
    }
});

app.get("/api/stats", async (req, res, next) => {
    try {
        const [books, users, orders, carts, discounts, payments, reviews] =
            await Promise.all([
                Book.estimatedDocumentCount(),
                User.estimatedDocumentCount(),
                Order.estimatedDocumentCount(),
                Cart.estimatedDocumentCount(),
                Discount.estimatedDocumentCount(),
                Payment.estimatedDocumentCount(),
                Review.estimatedDocumentCount(),
            ]);
        res.json({ books, users, orders, carts, discounts, payments, reviews });
    } catch (e) {
        next(e);
    }
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
        "/health": "Liveness probe",
        "/api/stats": "Dashboard counts",
        "/api/book": "Books",
        "/api/user": "Users",
        "/api/auth": "Auth",
        "/api/review": "Reviews",
        "/api/cart": "Cart",
        "/api/discount": "Discounts",
        "/api/payment": "Payments",
        "/api/order": "Orders",
        "/api/address": "Addresses",
        "/api/file": "File uploads",
        "/api/razorpay": "Razorpay",
    });
});

app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
    const status = err.status || 500;
    if (status >= 500) console.error("Unhandled error:", err);
    res.status(status).json({
        message: status >= 500 ? "Internal Server Error" : err.message,
    });
});

if (!process.env.VERCEL) {
    app.listen(PORT, () =>
        console.log(`Server running on http://localhost:${PORT}`)
    );
}

export default app;
