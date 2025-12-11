import express from "express";
import {
    createBook,
    deleteBook,
    getAllBooks,
    getAllCategories,
    updateBook,
} from "../controllers/book.controller.js";
import upload from "../config/multer.js";

const router = express.Router();

router.get("/", getAllBooks);
router.get("/category", getAllCategories);
router.post("/", upload.fields([{ name: "images", maxCount: 10 }]), createBook);
router.put("/:id",upload.fields([{ name: "images", maxCount: 10 }]),updateBook);
router.delete("/:id", deleteBook);

export default router;
