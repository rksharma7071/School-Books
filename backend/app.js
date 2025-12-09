import express from "express";
import "dotenv/config";
import { connectDB } from "./config/database.js";
import bookRouter from "./routes/book.route.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/book", bookRouter);

app.get("/", (req, res) => {
    res.status(200).send("Hello");
});

connectDB();

app.listen(PORT, () => {
    console.log(`Server is running https://localhost:${PORT}`);
});
