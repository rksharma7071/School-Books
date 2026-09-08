import express from "express";
import upload from "../config/multer.js";
import authMiddleware from "../middlewares/authentication.js";
import { authorize } from "../middlewares/authorize.js";
import { uploadFiles, getFiles, deleteFile, getFileByPublicId } from "../controllers/file.controller.js";

const router = express.Router();

router.get("/", authMiddleware, authorize("admin", "author"), getFiles);
router.post("/", authMiddleware, authorize("admin", "author"), upload.array("files", 10), uploadFiles);
router.get("/:publicId", getFileByPublicId);
router.delete("/:id", authMiddleware, authorize("admin"), deleteFile);

export default router;