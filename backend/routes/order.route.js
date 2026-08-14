import express from "express";
import {
    createOrder,
    deleteOrder,
    getAllOrder,
    getOrderById,
    updateOrder,
} from "../controllers/order.controller.js";
import authMiddleware from "../middlewares/authentication.js";
import { authorize } from "../middlewares/authorize.js";

const router = express.Router();

router.use(authMiddleware);

router
    .route("/")
    .get(authorize("admin"), getAllOrder)
    .post(createOrder);

router
    .route("/:id")
    .get(getOrderById)
    .patch(authorize("admin"), updateOrder)
    .delete(authorize("admin"), deleteOrder);

export default router;
