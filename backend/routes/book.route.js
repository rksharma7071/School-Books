import express from "express";

import {
    getAllBooks,
    getBookById,
    getAdminBookById,
    createBook,
    updateBook,
    deleteBook,
} from "../controllers/book.controller.js";

import authentication from "../middlewares/authentication.js";
import authorize from "../middlewares/authorize.js";
import { validate } from "../middlewares/validate.js";

import { createBookSchema, updateBookSchema, listBookQuerySchema } from "../validators/book.validator.js";

const router = express.Router();

router.get("/", validate(listBookQuerySchema, "query"), getAllBooks);
router.get("/:id", getBookById);

router.get("/admin/:id", authentication, authorize("admin"), getAdminBookById);
router.post("/", authentication, authorize("admin"), validate(createBookSchema), createBook);
router.patch("/:id", authentication, authorize("admin"), validate(updateBookSchema), updateBook);
router.delete("/:id", authentication, authorize("admin"), deleteBook);

export default router;