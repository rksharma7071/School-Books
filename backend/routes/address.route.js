import express from "express";
import {
    createAddress,
    deleteAddress,
    getAddressByUserId,
    getAddresses,
    updateAddress,
} from "../controllers/address.controller.js";

const router = express.Router();

router.route("/")
    .get(getAddresses)
    .post(createAddress);

router
    .route("/:id")
    .get(getAddressByUserId)
    .patch(updateAddress)
    .delete(deleteAddress);

export default router;