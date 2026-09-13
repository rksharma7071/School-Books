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
   previewAutomaticMatches
} from "../controllers/category.controller.js";
import authentication from "../middlewares/authentication.js";
import { authorize } from "../middlewares/authorize.js";
import upload from "../config/multer.js";

const router = express.Router();

router.get("/", getAllCategoriesWithCount);
router.get("/popular", getPopularCategories);

router.get(
   "/admin",
   authentication,
   authorize("admin"),
   (req, res, next) => {
      req.query.includeInactive = "true";
      req.query.limit = req.query.limit || "100";
      next();
   },
   getAllCategoriesWithCount
);

router.get("/admin/:identifier", authentication, authorize("admin"), getCategoryDetail);
router.get("/admin/stats", authentication, authorize("admin"), getCategoryStatistics);
router.post("/preview-matches", authentication, authorize("admin"), previewAutomaticMatches);
router.post("/", authentication, authorize("admin"), upload.single("image"), createCategory);
router.patch("/:identifier", authentication, authorize("admin"), upload.single("image"), updateCategory);
router.delete("/:identifier", authentication, authorize("admin"), deleteCategory);
router.post("/:categoryId/products/:productId", authentication, authorize("admin"), addProductToCategory);
router.delete("/:categoryId/products/:productId", authentication, authorize("admin"), removeProductFromCategory);
router.get("/:identifier/products", getCategoryWithProducts);
router.get("/:identifier", getCategoryDetail);

export default router;