import express from "express";
import {
   getAllCategoriesWithCount,
   getCategoryDetail,
   getCategoryWithProducts,
   getCategoryStatistics,
   getPopularCategories,
   createCategory,
   updateCategory,
   deleteCategory,
   addProductToCategory,
   removeProductFromCategory,
} from "../controllers/category.controller.js";
import authentication from "../middlewares/authentication.js";
import { authorize } from "../middlewares/authorize.js";

const router = express.Router();

router.get("/", getAllCategoriesWithCount);
router.get("/popular", getPopularCategories);

router.get("/admin/stats", authentication, authorize("admin"), getCategoryStatistics);
router.post("/", authentication, authorize("admin"), createCategory);
router.patch("/:identifier", authentication, authorize("admin"), updateCategory);
router.delete("/:identifier", authentication, authorize("admin"), deleteCategory);

router.post("/:categoryId/products/:productId", authentication, authorize("admin"), addProductToCategory);
router.delete("/:categoryId/products/:productId", authentication, authorize("admin"), removeProductFromCategory);

router.get("/:identifier/products", getCategoryWithProducts);
router.get("/:identifier", getCategoryDetail);

export default router;