import express from "express";
import {
    createOrder,
    deleteOrder,
    getAllOrder,
    getOrderById,
    getMyOrders,
    updateOrder,
    cancelOrder,
} from "../controllers/order.controller.js";
import authMiddleware from "../middlewares/authentication.js";
import { authorize } from "../middlewares/authorize.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/my-orders", getMyOrders);

router
    .route("/")
    .get(authorize("admin"), getAllOrder)
    .post(createOrder);

router.post("/:id/cancel", cancelOrder);

router
    .route("/:id")
    .get(getOrderById)
    .patch(updateOrder)
    .delete(authorize("admin"), deleteOrder);

export default router;