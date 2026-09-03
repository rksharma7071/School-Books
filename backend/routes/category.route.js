import express from "express";
import {
    getAllCategoriesWithCount,
    getCategoryWithBooks,
    getCategoryStatistics,
    getPopularCategories,
    createCategory,
    updateCategory,
    deleteCategory,
} from "../controllers/category.controller.js";
import authentication from "../middlewares/authentication.js";
import { authorize } from "../middlewares/authorize.js";

const router = express.Router();

router.get("/all", getAllCategoriesWithCount);
router.get("/popular", getPopularCategories);
router.get("/admin/stats", authentication, authorize("admin"), getCategoryStatistics);
router.post("/", authentication, authorize("admin"), createCategory);
router.patch("/:identifier", authentication, authorize("admin"), updateCategory);
router.delete("/:identifier", authentication, authorize("admin"), deleteCategory);

export default router;