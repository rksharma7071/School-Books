import { Book, Category } from "../models/book.model.js";
import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.js";

export const getAllBooks = async (req, res) => {
    try {
        const books = await Book.find({});
        return res.status(200).json({
            success: true,
            count: books.length,
            data: books,
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: "Server error while fetching books",
        });
    }
};

export const createBook = async (req, res) => {
    try {
        const {
            name,
            description,
            price,
            cost,
            isbn,
            author,
            publisher,
            category,
            classLevel,
            subject,
            language,
            stockQty,
            coverImage,
        } = req.body;

        if (!name || !author) {
            return res.status(400).json({
                success: false,
                message:
                    "Missing required fields: name and author are required.",
            });
        }

        const parsedPrice = Number(price ?? 0) || 0;
        const parsedCost = Number(cost ?? 0) || 0;
        const parsedStockQty = Number(stockQty ?? 0) || 0;

        let categoryId;

        if (category) {
            const isObjectId = mongoose.Types.ObjectId.isValid(category);

            if (isObjectId) {
                const found = await Category.findById(category).exec();
                if (!found) {
                    return res.status(400).json({
                        success: false,
                        message: "Category id provided does not exist.",
                    });
                }
                categoryId = found._id;
            } else {
                const nameTrim = String(category).trim();

                let existing = await Category.findOneAndUpdate(
                    { name: nameTrim },
                    { $setOnInsert: { name: nameTrim } },
                    { new: true, upsert: true }
                ).exec();

                categoryId = existing._id;
            }
        }

        const files = Object.values(req.files || {}).flat();

        const images = files
            .map((file, idx) => {
                const url =
                    file.path ||
                    file.secure_url ||
                    file.url ||
                    file.location ||
                    (file?.uploads && file.uploads?.[0]?.path) ||
                    null;
                const publicId =
                    file.filename ||
                    file.public_id ||
                    file.publicId ||
                    file.key ||
                    null;

                if (!url) return null;
                return { url, publicId, position: idx + 1 };
            })
            .filter(Boolean);

        const finalCoverImage =
            coverImage || (images.length ? images[0].url : undefined);

        const bookData = {
            name: String(name).trim(),
            description: description ? String(description).trim() : undefined,
            price: isNaN(parsedPrice) ? 0 : parsedPrice,
            cost: isNaN(parsedCost) ? 0 : parsedCost,
            isbn: isbn ? String(isbn).trim() : undefined,
            author: String(author).trim(),
            publisher: publisher ? String(publisher).trim() : undefined,
            category: categoryId,
            classLevel: classLevel ? String(classLevel).trim() : undefined,
            subject: subject ? String(subject).trim() : undefined,
            language: language ? String(language).trim() : undefined,
            stockQty: isNaN(parsedStockQty) ? 0 : parsedStockQty,
            coverImage: finalCoverImage,
            images,
            isActive: true,
        };

        const created = await Book.create(bookData);

        await created.populate("category", "name description");

        return res.status(201).json({
            success: true,
            message: "Book created successfully",
            book: created,
        });
    } catch (err) {
        console.error("createBook error:", err);

        if (err.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: err.message,
                errors: err.errors,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to create book",
            error: err.message,
        });
    }
};

export const updateBook = async (req, res) => {
    try {
        const bookId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(bookId)) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid book id." });
        }

        const book = await Book.findById(bookId).exec();
        if (!book)
            return res
                .status(404)
                .json({ success: false, message: "Book not found." });

        const safeTrim = (v) =>
            v === undefined || v === null ? undefined : String(v).trim();

        const {
            name,
            description,
            price,
            cost,
            isbn,
            author,
            publisher,
            category,
            classLevel,
            subject,
            language,
            stockQty,
            coverImage,
            removeImagePublicIds,
        } = req.body;

        let categoryId = undefined;
        if (
            category !== undefined &&
            category !== null &&
            String(category).trim() !== ""
        ) {
            if (mongoose.Types.ObjectId.isValid(category)) {
                const found = await Category.findById(category).exec();
                if (!found)
                    return res.status(400).json({
                        success: false,
                        message: "Category id provided does not exist.",
                    });
                categoryId = found._id;
            } else {
                const nameTrim = String(category).trim();
                let existing = await Category.findOne({
                    name: nameTrim,
                }).exec();
                if (!existing) {
                    try {
                        existing = await Category.create({ name: nameTrim });
                    } catch (err) {
                        if (err.code === 11000) {
                            existing = await Category.findOne({
                                name: nameTrim,
                            }).exec();
                        } else {
                            throw err;
                        }
                    }
                }
                categoryId = existing._id;
            }
        }

        // Normalize req.files
        const filesObjOrArray = req.files || [];
        let files = [];
        if (Array.isArray(filesObjOrArray)) {
            files = filesObjOrArray;
        } else if (
            typeof filesObjOrArray === "object" &&
            filesObjOrArray !== null
        ) {
            for (const key of Object.keys(filesObjOrArray)) {
                if (Array.isArray(filesObjOrArray[key]))
                    files = files.concat(filesObjOrArray[key]);
            }
        }

        // Map uploaded files to images
        const newImages = files
            .map((file, idx) => {
                const url =
                    file.path ||
                    file.secure_url ||
                    file.url ||
                    file.location ||
                    (file?.uploads && file.uploads?.[0]?.path) ||
                    null;
                const publicId =
                    file.filename ||
                    file.public_id ||
                    file.publicId ||
                    file.key ||
                    null;
                if (!url) return null;
                return {
                    url,
                    publicId,
                    position: book.images.length + idx + 1,
                };
            })
            .filter(Boolean);

        // Parse removeImagePublicIds
        let removeIds = [];
        if (removeImagePublicIds) {
            try {
                if (typeof removeImagePublicIds === "string") {
                    const trimmed = removeImagePublicIds.trim();
                    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
                        removeIds = JSON.parse(trimmed);
                    } else {
                        removeIds = trimmed
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean);
                    }
                } else if (Array.isArray(removeImagePublicIds)) {
                    removeIds = removeImagePublicIds;
                }
            } catch (err) {
                removeIds = String(removeImagePublicIds)
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean);
            }
        }

        // --- Delete from Cloudinary (if removeIds provided) ---
        let cloudinaryResults = [];
        if (removeIds.length > 0) {
            // Only attempt to delete publicIds that actually exist on the book record
            const toRemove = book.images
                .filter(
                    (img) =>
                        img.publicId && removeIds.includes(String(img.publicId))
                )
                .map((img) => String(img.publicId));

            if (toRemove.length > 0) {
                // run deletions in parallel but don't fail entire request if some fail
                const deletionPromises = toRemove.map((publicId) =>
                    cloudinary.uploader
                        .destroy(publicId, { invalidate: true })
                        .then((res) => ({
                            publicId,
                            status: "fulfilled",
                            result: res,
                        }))
                        .catch((err) => ({
                            publicId,
                            status: "rejected",
                            error: err?.message || err,
                        }))
                );

                cloudinaryResults = await Promise.all(deletionPromises);

                // Remove those images from the book.images array (DB-level)
                const removedSet = new Set(toRemove);
                book.images = book.images.filter(
                    (img) =>
                        !img.publicId || !removedSet.has(String(img.publicId))
                );
            }
        }

        // --- Update fields when provided ---
        if (name !== undefined) book.name = safeTrim(name) || book.name;
        if (description !== undefined) book.description = safeTrim(description);
        if (price !== undefined) book.price = Number(price ?? 0) || 0;
        if (cost !== undefined) book.cost = Number(cost ?? 0) || 0;
        if (isbn !== undefined) book.isbn = safeTrim(isbn);
        if (author !== undefined) book.author = safeTrim(author) || book.author;
        if (publisher !== undefined) book.publisher = safeTrim(publisher);
        if (categoryId !== undefined) book.category = categoryId;
        if (classLevel !== undefined) book.classLevel = safeTrim(classLevel);
        if (subject !== undefined) book.subject = safeTrim(subject);
        if (language !== undefined) book.language = safeTrim(language);
        if (stockQty !== undefined) book.stockQty = Number(stockQty ?? 0) || 0;

        if (newImages.length > 0) book.images = book.images.concat(newImages);

        if (
            coverImage !== undefined &&
            coverImage !== null &&
            String(coverImage).trim() !== ""
        ) {
            book.coverImage = String(coverImage).trim();
        } else {
            const uploadedCoverFile =
                (req.files &&
                    req.files.coverImage &&
                    req.files.coverImage[0]) ||
                null;
            if (uploadedCoverFile) {
                const coverUrl =
                    uploadedCoverFile.path ||
                    uploadedCoverFile.secure_url ||
                    uploadedCoverFile.url ||
                    uploadedCoverFile.location ||
                    null;
                if (coverUrl) book.coverImage = coverUrl;
            } else if (!book.coverImage && book.images.length > 0) {
                book.coverImage = book.images[0].url;
            }
        }

        const saved = await book.save();
        await saved.populate("category", "name description");

        return res.status(200).json({
            success: true,
            message: "Book updated",
            book: saved,
            cloudinaryResults,
        });
    } catch (err) {
        console.error("updateBook error:", err);
        if (err.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: err.message,
                errors: err.errors,
            });
        }
        return res.status(500).json({
            success: false,
            message: "Failed to update book",
            error: err.message,
        });
    }
};

export const getAllCategories = async (req, res) => {
    try {
        const category = await Category.find({});
        return res.status(200).json({
            success: true,
            count: category.length,
            data: category,
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: "Server error while fetching category",
        });
    }
};

export const deleteBook = async (req, res) => {
    try {
        const id = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid book id." });
        }

        const book = await Book.findById(id).exec();
        console.log("Book:", book);

        if (!book) {
            return res
                .status(404)
                .json({ success: false, message: "Book not found!" });
        }

        const publicIds = (book.images || [])
            .map((img) => img.publicId)
            .filter(Boolean);

        console.log("publicIds:", publicIds);

        let cloudinaryResults = [];

        if (publicIds.length > 0) {
            const deletionPromises = publicIds.map((publicId) =>
                cloudinary.uploader
                    .destroy(publicId, { invalidate: true })
                    .then((result) => ({
                        publicId,
                        status: "fulfilled",
                        result,
                    }))
                    .catch((error) => ({
                        publicId,
                        status: "rejected",
                        error: error?.message || String(error),
                    }))
            );

            cloudinaryResults = await Promise.all(deletionPromises);
        }
        console.log("cloudinaryResults:", cloudinaryResults);

        await Book.deleteOne({ _id: id });

        return res.status(200).json({
            success: true,
            message: "Book deleted successfully",
            cloudinaryResults,
        });
    } catch (error) {
        console.error("Delete Book error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete book",
            error: error.message,
        });
    }
};
