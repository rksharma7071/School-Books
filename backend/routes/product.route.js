import express from "express";
import {
   getAllProducts,
   getProductBySlug,
   createProduct,
   updateProduct,
   deleteProduct,
   updateVariant,
   deleteVariant,
   updateVariantInventory,
} from "../controllers/product.controller.js";
import authentication from "../middlewares/authentication.js";
import { authorize } from "../middlewares/authorize.js";
import { validate } from "../middlewares/validate.js";
import { createProductSchema, updateProductSchema, listProductQuerySchema } from "../validators/product.validator.js";

const router = express.Router();

router.get("/", validate(listProductQuerySchema, "query"), getAllProducts);
router.get("/:handle", getProductBySlug);
router.post("/", authentication, authorize("admin"), validate(createProductSchema), createProduct);
router.patch("/:identifier", authentication, authorize("admin"), validate(updateProductSchema), updateProduct);
router.delete("/:identifier", authentication, authorize("admin"), deleteProduct);

router.patch("/:productIdentifier/variants/:variantId", authentication, authorize("admin"), updateVariant);
router.delete("/:productIdentifier/variants/:variantId", authentication, authorize("admin"), deleteVariant);
router.patch("/:productIdentifier/variants/:variantId/inventory", authentication, authorize("admin"), updateVariantInventory);

export default router;