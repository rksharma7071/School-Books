import express from "express";
import "dotenv/config";
import { connectDB } from "./config/database.js";
import bookRouter from "./routes/book.route.js";
import userRouter from "./routes/user.route.js";
import authRouter from "./routes/auth.route.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/api/book", bookRouter);
app.use("/api/user", userRouter);
app.use("/api/auth", authRouter);

app.get("/", (req, res) => {
    res.status(200).json({
        "/api/book": "All Book",
        "/api/book/category": "All Category",
        "/api/user": "All User",
        "/api/user/id": "Specific User",
        "/api/auth": "Auth",
    });
});

connectDB();

app.listen(PORT, () => {
    console.log(`Server is running https://localhost:${PORT}`);
});
