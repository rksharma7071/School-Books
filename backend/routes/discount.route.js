import express from "express";
import {
    applyDiscount,
    createDiscount,
    deleteDiscount,
    getAllDiscount,
    getDiscountById,
    updateDiscount,
} from "../controllers/discount.controller.js";
import authMiddleware from "../middlewares/authentication.js";
import { authorize } from "../middlewares/authorize.js";

const router = express.Router();

router.post("/apply", authMiddleware, applyDiscount);

router
    .route("/")
    .get(authMiddleware, authorize("admin"), getAllDiscount)
    .post(authMiddleware, authorize("admin"), createDiscount);

router
    .route("/:id")
    .get(authMiddleware, authorize("admin"), getDiscountById)
    .patch(authMiddleware, authorize("admin"), updateDiscount)
    .delete(authMiddleware, authorize("admin"), deleteDiscount);

export default router;
