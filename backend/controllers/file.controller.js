import mongoose from "mongoose";
import { File } from "../models/file.model.js";
import cloudinary from "../config/cloudinary.js";
import { ApiError, handleError } from "../utils/apiError.js";
import axios from 'axios';

export const uploadFiles = async (req, res) => {
    try {
        const uploaded = Object.values(req.files || {}).flat();
        if (req.file) uploaded.push(req.file);

        if (!uploaded.length) throw new ApiError(400, "No files uploaded");

        const docs = uploaded
            .map((f) => ({ url: f.path || f.secure_url || f.url, publicId: f.filename || f.public_id }))
            .filter((d) => d.url && d.publicId);

        const saved = await File.insertMany(docs);
        res.status(201).json({ message: "Files uploaded", files: saved });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const getFiles = async (req, res) => {
    try {
        const files = await File.find({}).sort({ _id: -1 }).lean();
        const publicIds = files.map(file => ({ publicId: file.publicId, _id: file._id }));
        res.status(200).json(publicIds);
    } catch (error) {
        handleError(error, req, res);
    }
};

export const getFileByPublicId = async (req, res) => {
    try {
        const { publicId } = req.params;

        if (!publicId) {
            return res.status(400).json({ error: 'publicId is required' });
        }

        const cloudinaryUrl = cloudinary.url(`uploads/${publicId}`, { secure: true });
        const response = await axios({ method: 'get', url: cloudinaryUrl, responseType: 'stream' });
        res.setHeader('Content-Type', response.headers['content-type']);
        response.data.pipe(res);
    } catch (error) {
        if (error.response?.status === 404) {
            return res.status(404).json({ error: 'Image not found on Cloudinary' });
        }
        console.error('Error fetching image:', error.message);
        res.status(500).json({ error: 'Failed to retrieve image' });
    }
};

export const deleteFile = async (req, res) => {
    try {
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
    } catch (error) {
        handleError(error, req, res);
    }
};