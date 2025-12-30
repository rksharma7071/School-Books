import express from "express";
import {
    getAllCart,
    getCartByUserId,
    createOrUpdateCart,
    deleteCart,
    updateCart,
} from "../controllers/cart.controller.js";

const router = express.Router();

router.route("/").get(getAllCart).patch(updateCart).post(createOrUpdateCart);

router.route("/:id").get(getCartByUserId).delete(deleteCart);

export default router;
