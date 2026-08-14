import mongoose from "mongoose";
import { File } from "../models/file.model.js";
import cloudinary from "../config/cloudinary.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

export const uploadFiles = asyncHandler(async (req, res) => {
    const uploaded = Object.values(req.files || {}).flat();
    if (req.file) uploaded.push(req.file);

    if (!uploaded.length) {
        return res.status(400).json({ message: "No files uploaded" });
    }

    const docs = uploaded
        .map((f) => ({
            url: f.path || f.secure_url || f.url,
            publicId: f.filename || f.public_id,
        }))
        .filter((d) => d.url && d.publicId);

    const saved = await File.insertMany(docs);
    return res.status(201).json({ message: "Files uploaded", files: saved });
});

export const getFiles = asyncHandler(async (req, res) => {
    const files = await File.find({}).sort({ _id: -1 }).lean();
    return res.status(200).json(files);
});

export const deleteFile = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid file id" });
    }

    const file = await File.findById(id);
    if (!file) return res.status(404).json({ message: "File not found" });

    try {
        await cloudinary.uploader.destroy(file.publicId, { invalidate: true });
    } catch (e) {
        console.error("Cloudinary delete failed:", e.message);
    }

    await File.deleteOne({ _id: id });
    return res.status(200).json({ message: "File deleted successfully" });
});
