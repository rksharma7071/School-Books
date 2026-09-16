import express from "express";
import {
    getAllCart,
    getCartByUserId,
    deleteCart,
    clearCart,
    getMyCart,
    addItemToCart,
    setItemQuantity,
    removeCartItem,
    validateCart,
    getCartById,
} from "../controllers/cart.controller.js";
import authMiddleware from "../middlewares/authentication.js";
import { authorize } from "../middlewares/authorize.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/me", getMyCart);
router.get("/validate", validateCart);

router.post("/items", addItemToCart);
router.patch("/items/:itemId", setItemQuantity);
router.delete("/items/:itemId", removeCartItem);

router.delete("/clear", clearCart);
router.delete("/clear/:userId", authorize("admin"), clearCart);

router.get("/", authorize("admin"), getAllCart);

router.route("/:id")
    // .get(getCartByUserId)
    .get(getCartById)
    .delete(deleteCart);

export default router;