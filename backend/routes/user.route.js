import express from "express";
import {
    handleGetAllUsers,
    handleCreateNewUser,
    handleGetUserUinsgId,
    handleUpdateUserUsingId,
    handleDeleteUserUsingId,
    handleUpdatePermission,
    handleGetPermissionUsingId,
    handleAllPermission,
} from "../controllers/user.controller.js";

const router = express.Router();

router.route("/").get(handleGetAllUsers).post(handleCreateNewUser);

router
    .route("/:id")
    .get(handleGetUserUinsgId)
    .patch(handleUpdateUserUsingId)
    .delete(handleDeleteUserUsingId);

router.route("/permission/:id").get(handleGetPermissionUsingId);

router.route("/permission")
    .get(handleAllPermission)
    .post(handleUpdatePermission)

export default router;
