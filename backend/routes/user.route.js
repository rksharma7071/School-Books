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
    .route("/permission")
    .get(handleAllPermission)
    .post(handleUpdatePermission);

router
    .route("/permission/:id")
    .get(handleGetPermissionUsingId)
    .patch(handleUpdatePermission);

router
    .route("/:id")
    .get(handleGetUserUinsgId)
    .patch(handleUpdateUserUsingId)
    .delete(handleDeleteUserUsingId);

export default router;
