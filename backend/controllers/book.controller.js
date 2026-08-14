import { Book, Category } from "../models/book.model.js";
import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.js";

export const getAllBooks = async (req, res) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);

        const isAdminView = req.query.all === "true";
        const maxLimit = isAdminView ? 500 : 50;
        const limit = Math.min(maxLimit, Number(req.query.limit) || 20);

        const filter = {};
        if (!isAdminView) filter.isActive = true;
        if (req.query.category) filter.category = req.query.category;
        if (req.query.q) filter.$text = { $search: req.query.q };

        const [data, total] = await Promise.all([
            Book.find(filter)
                .select(
                    "name author price coverImage stockQty subject classLevel category isActive"
                )
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            Book.countDocuments(filter),
        ]);

        if (!isAdminView) {
            res.set(
                "Cache-Control",
                "public, max-age=60, stale-while-revalidate=300"
            );
        } else {
            res.set("Cache-Control", "no-store");
        }

        return res.status(200).json({
            success: true,
            data,
            total,
            page,
            pages: Math.ceil(total / limit),
            count: data.length,
        });
    } catch (error) {
        console.error("getAllBooks error:", error);
        res.status(500).json({ success: false, message: "Server error" });
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
                message: "Missing required fields: name and author are required.",
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
    } catch (error) {
        console.error("createBook error:", error);

        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: error.message,
                errors: error.errors,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to create book",
            error: error.message,
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
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to update book",
            error: error.message,
        });
    }
};

export const getAllCategories = async (req, res) => {
    try {
        const [categories, counts] = await Promise.all([
            Category.find({}).sort({ name: 1 }).lean(),
            Book.aggregate([
                { $match: { category: { $ne: null } } },
                { $group: { _id: "$category", total: { $sum: 1 } } },
            ]),
        ]);

        const map = new Map(counts.map((c) => [String(c._id), c.total]));

        res.set("Cache-Control", "public, max-age=120, stale-while-revalidate=600");

        return res.status(200).json({
            success: true,
            count: categories.length,
            data: categories.map((c) => ({
                id: c._id,
                _id: c._id,
                name: c.name,
                description: c.description || "",
                totalBooks: map.get(String(c._id)) || 0,
            })),
        });
    } catch (error) {
        console.error("getAllCategories error:", error);
        return res
            .status(500)
            .json({ success: false, message: "Server error while fetching categories" });
    }
};

export const getCategoriesById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid category id" });
        }

        const category = await Category.findById(id).lean();

        if (!category) {
            return res
                .status(404)
                .json({ success: false, message: "Category not found" });
        }

        return res.status(200).json({ success: true, data: category });
    } catch (error) {
        console.error("getCategoriesById error:", error);
        return res
            .status(500)
            .json({ success: false, message: "Server error while fetching category" });
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

        if (!book) {
            return res
                .status(404)
                .json({ success: false, message: "Book not found!" });
        }

        const publicIds = (book.images || [])
            .map((img) => img.publicId)
            .filter(Boolean);

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
