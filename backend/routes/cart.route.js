import express from "express";
import {
    getAllCart,
    getCartByUserId,
    createOrUpdateCart,
} from "../controllers/cart.controller.js";

const router = express.Router();

router.route("/").get(getAllCart).post(createOrUpdateCart);

router.route("/:id").get(getCartByUserId);

export default router;
