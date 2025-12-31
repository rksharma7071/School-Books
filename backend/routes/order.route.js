import express from "express";
import {
    createOrder,
    deleteOrder,
    getAllOrder,
    getOrderById,
    updateOrder,
} from "../controllers/order.contoller.js";

const router = express.Router();

router.route("/").get(getAllOrder).post(createOrder);

router.route("/:id").get(getOrderById).patch(updateOrder).delete(deleteOrder);

export default router;