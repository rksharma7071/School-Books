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
import authMiddleware from "../middlewares/authentication.js";
import { authorize } from "../middlewares/authorize.js";

const router = express.Router();

router.get("/", getAllBooks);
router.get("/category", getAllCategories);
router.get("/category/:id", getCategoriesById);
router.get("/:id", getBookById);

router.post(
    "/",
    authMiddleware,
    authorize("admin", "author"),
    upload.fields([{ name: "images", maxCount: 10 }]),
    createBook
);
router.patch(
    "/:id",
    authMiddleware,
    authorize("admin", "author"),
    upload.fields([{ name: "images", maxCount: 10 }]),
    updateBook
);
router.delete("/:id", authMiddleware, authorize("admin"), deleteBook);

export default router;
