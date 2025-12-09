import express from "express";
import { createBook, getAllBooks } from "../controllers/book.controller.js";
import upload from "../config/multer.js";

const router = express.Router();

router.get("/", getAllBooks);
router.post("/", upload.fields([{ name: "images", maxCount: 10 }]), createBook);

export default router;
