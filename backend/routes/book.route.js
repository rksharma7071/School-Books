import express from "express";
import {
    createBook,
    deleteBook,
    getAllBooks,
    getAllCategories,
    getBookById,
    getCategoriesById,
    updateBook,
} from "../controllers/book.controller.js";
import upload from "../config/multer.js";

const router = express.Router();

router.get("/", getAllBooks);
router.get("/category", getAllCategories);
router.get("/category/:id", getCategoriesById);
router.post("/", upload.fields([{ name: "images", maxCount: 10 }]), createBook);
router.patch("/:id",upload.fields([{ name: "images", maxCount: 10 }]),updateBook);
router.get("/:id", getBookById);
router.delete("/:id", deleteBook);

export default router;
