import express from "express";
import {
    getAllCart,
    getCartByUserId,
    createOrUpdateCart,
    deleteCart,
    updateCart,
    clearCart,
    getMyCart,
} from "../controllers/cart.controller.js";
import authMiddleware from "../middlewares/authentication.js";
import { authorize } from "../middlewares/authorize.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/me", getMyCart);
router.delete("/clear", clearCart);
router.delete("/clear/:userId", authorize("admin"), clearCart);

router.route("/")
    .get(authorize("admin"), getAllCart)
    .patch(updateCart)
    .post(createOrUpdateCart);

router.route("/:id")
    .get(getCartByUserId)
    .delete(deleteCart);

export default router;