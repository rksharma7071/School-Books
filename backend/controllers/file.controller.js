import mongoose from "mongoose";
import { File } from "../models/file.model.js";
import cloudinary from "../config/cloudinary.js";
import { asyncHandler, ApiError } from "../middlewares/asyncHandler.js";

export const uploadFiles = asyncHandler(async (req, res) => {
    const uploaded = Object.values(req.files || {}).flat();
    if (req.file) uploaded.push(req.file);

    if (!uploaded.length) throw new ApiError(400, "No files uploaded");

    const docs = uploaded
        .map((f) => ({ url: f.path || f.secure_url || f.url, publicId: f.filename || f.public_id }))
        .filter((d) => d.url && d.publicId);

    const saved = await File.insertMany(docs);
    res.status(201).json({ message: "Files uploaded", files: saved });
});

export const getFiles = asyncHandler(async (req, res) => {
    const files = await File.find({}).sort({ _id: -1 }).lean();
    res.status(200).json(files);
});

export const deleteFile = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid file id");

    const file = await File.findById(id);
    if (!file) throw new ApiError(404, "File not found");

    try {
        await cloudinary.uploader.destroy(file.publicId, { invalidate: true });
    } catch (e) {
        console.error("Cloudinary delete failed:", e.message);
    }

    await File.deleteOne({ _id: id });
    res.status(200).json({ message: "File deleted successfully" });
});