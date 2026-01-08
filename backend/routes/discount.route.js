import express from "express";
import {
    applyDiscount,
    createDiscount,
    deleteDiscount,
    getAllDiscount,
    getDiscountById,
    updateDiscount,
} from "../controllers/discount.controller.js";

const router = express.Router();

router.route("/").get(getAllDiscount).post(createDiscount);

router
    .route("/:id")
    .get(getDiscountById)
    .patch(updateDiscount)
    .delete(deleteDiscount);

router.post("/apply", applyDiscount);

export default router;
