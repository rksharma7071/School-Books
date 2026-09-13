import express from "express";
import {
   getAllProducts,
   getProductBySlug,
   getProductForAdmin,
   createProduct,
   updateProduct,
   deleteProduct,
   updateVariant,
   deleteVariant,
   updateVariantInventory,
} from "../controllers/product.controller.js";
import authentication from "../middlewares/authentication.js";
import { authorize } from "../middlewares/authorize.js";
import upload from "../config/multer.js";

const router = express.Router();

router.get("/", getAllProducts);

router.get("/admin/:identifier", authentication, authorize("admin"), getProductForAdmin);

router.post("/", authentication, authorize("admin"), upload.array("images"), createProduct);
router.put("/:identifier", authentication, authorize("admin"), upload.array("images"), updateProduct);
router.delete("/:identifier", authentication, authorize("admin"), deleteProduct);

router.patch("/:productIdentifier/variants/:variantId", authentication, authorize("admin"), updateVariant);
router.delete("/:productIdentifier/variants/:variantId", authentication, authorize("admin"), deleteVariant);
router.patch("/:productIdentifier/variants/:variantId/inventory", authentication, authorize("admin"), updateVariantInventory);
router.get("/:identifier", getProductBySlug);

export default router;