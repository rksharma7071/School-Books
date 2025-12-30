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

export const getBookById = async (req, res) => {
    try {
        const books = await Book.findById(req.params.id);
        return res.status(200).json({
            success: true,
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
            isActive,
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
            isActive: isActive,
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
                .json({ success: false, message: "Invalid book id" });
        }

        const book = await Book.findById(bookId);
        if (!book) {
            return res
                .status(404)
                .json({ success: false, message: "Book not found" });
        }

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
            isActive,
            removeImagePublicIds,
            imagesOrder,
        } = req.body;

        /* ---------------- CATEGORY ---------------- */
        if (category) {
            if (mongoose.Types.ObjectId.isValid(category)) {
                book.category = category;
            } else {
                let cat = await Category.findOne({ name: category.trim() });
                if (!cat)
                    cat = await Category.create({ name: category.trim() });
                book.category = cat._id;
            }
        }

        /* ---------------- DELETE IMAGES ---------------- */
        let removeIds = [];
        if (removeImagePublicIds) {
            removeIds = Array.isArray(removeImagePublicIds)
                ? removeImagePublicIds
                : [removeImagePublicIds];
        }

        if (removeIds.length) {
            await Promise.all(
                removeIds.map((id) =>
                    cloudinary.uploader.destroy(id, { invalidate: true })
                )
            );

            book.images = book.images.filter(
                (img) => !removeIds.includes(String(img.publicId))
            );
        }

        /* ---------------- NEW UPLOADS (NO POSITION) ---------------- */
        if (req.files?.images) {
            for (const file of req.files.images) {
                book.images.push({
                    url: file.path,
                    publicId: file.filename,
                });
            }
        }

        /* ---------------- FINAL IMAGE ORDER (KEY FIX) ---------------- */
        if (imagesOrder) {
            const order = JSON.parse(imagesOrder);

            const positionMap = new Map(
                order.map((o) => [String(o.publicId), o.position])
            );

            book.images = book.images
                .map((img) => ({
                    ...img.toObject(),
                    position: positionMap.get(String(img.publicId)) ?? 9999,
                }))
                .sort((a, b) => a.position - b.position)
                .map((img, index) => ({
                    ...img,
                    position: index + 1,
                }));
        }

        /* ---------------- FIELDS ---------------- */
        if (name) book.name = name.trim();
        if (description) book.description = description.trim();
        if (price !== undefined) book.price = Number(price);
        if (cost !== undefined) book.cost = Number(cost);
        if (isbn) book.isbn = isbn.trim();
        if (author) book.author = author.trim();
        if (publisher) book.publisher = publisher.trim();
        if (classLevel) book.classLevel = classLevel;
        if (subject) book.subject = subject;
        if (language) book.language = language;
        if (stockQty !== undefined) book.stockQty = Number(stockQty);
        if (isActive !== undefined) book.isActive = isActive;

        /* ---------------- COVER IMAGE ---------------- */
        if (book.images.length) {
            book.coverImage = book.images[0].url;
        }

        await book.save();

        return res.status(200).json({
            success: true,
            message: "Book updated successfully",
            book,
        });
    } catch (err) {
        console.error(err);
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
        // console.log("Book:", book);

        if (!book) {
            return res
                .status(404)
                .json({ success: false, message: "Book not found!" });
        }

        const publicIds = (book.images || [])
            .map((img) => img.publicId)
            .filter(Boolean);

        // console.log("publicIds:", publicIds);

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
        // console.log("cloudinaryResults:", cloudinaryResults);

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
