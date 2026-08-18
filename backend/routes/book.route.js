// backend/routes/book.route.js
import express from "express";

import {
    getAllBooks,
    getBookById,
    getBookBySlug,
    getBooksByCategorySlug,
    getAdminBookById,
    createBook,
    updateBook,
    deleteBook,
} from "../controllers/book.controller.js";
import authentication from "../middlewares/authentication.js";
import { authorize } from "../middlewares/authorize.js";
import { validate } from "../middlewares/validate.js";
import { createBookSchema, updateBookSchema, listBookQuerySchema } from "../validators/book.validator.js";

const router = express.Router();

router.get("/", validate(listBookQuerySchema, "query"), getAllBooks);
router.get("/slug/:slug", getBookBySlug);
router.get("/category/:categorySlug", getBooksByCategorySlug);
router.get("/admin/:identifier", authentication, authorize("admin"), getAdminBookById);
router.get("/:identifier", getBookById);
router.post("/", authentication, authorize("admin"), validate(createBookSchema), createBook);
router.patch("/:identifier", authentication, authorize("admin"), validate(updateBookSchema), updateBook);
router.delete("/:identifier", authentication, authorize("admin"), deleteBook);

export default router;