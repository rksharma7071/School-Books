import express from "express";
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
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/api/book", bookRouter);
app.use("/api/user", userRouter);
app.use("/api/auth", authRouter);
app.use("/api/review", reviewRouter);
app.use("/api/cart", cartRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/discount", discountRouter);
app.use("/api/order", orderRouter);
app.use("/api/razorpay", razorpayRoutes);

app.get("/", (req, res) => {
    res.status(200).json({
        "/api/book": "All Book",
        "/api/book/category": "All Category",
        "/api/user": "All User",
        "/api/user/id": "Specific User",
        "/api/auth": "Auth",
        "/api/review": "Review",
        "/api/cart": "Cart",
        "/api/discount": "Discount",
        "/api/payment": "Payment",
        "/api/order": "Order",
        "/api/razorpay": "razorpay",
    });
});

connectDB();

app.listen(PORT, () => {
    console.log(`Server is running https://localhost:${PORT}`);
});
