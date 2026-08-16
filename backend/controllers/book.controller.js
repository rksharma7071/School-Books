import mongoose from "mongoose";
import { Book, Category } from "../models/book.model.js";

const LIST_PROJECTION = {
    name: 1,
    price: 1,
    isbn: 1,
    author: 1,
    publisher: 1,
    category: 1,
    classLevel: 1,
    subject: 1,
    language: 1,
    stockQty: 1,
    coverImage: 1,
    isActive: 1,
    createdAt: 1,
    updatedAt: 1,
};

const DETAIL_PROJECTION = {
    name: 1,
    description: 1,
    price: 1,
    isbn: 1,
    author: 1,
    publisher: 1,
    category: 1,
    classLevel: 1,
    subject: 1,
    language: 1,
    stockQty: 1,
    coverImage: 1,
    images: 1,
    isActive: 1,
    createdAt: 1,
    updatedAt: 1,
};

const buildObjectId = (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
    }

    return new mongoose.Types.ObjectId(id);
};

export const getAllBooks = async (req, res, next) => {
    try {
        const { page, limit, search, category, author, subject, language, classLevel, minPrice, maxPrice, isActive, sortBy, sortOrder,
        } = req.query;

        const filter = {};

        if (isActive !== undefined) {
            filter.isActive = isActive;
        } else {
            filter.isActive = true;
        }

        if (category) {
            const categoryId = buildObjectId(category);

            if (!categoryId) {
                return res.status(400).json({ success: false, message: "Invalid category ID" });
            }

            filter.category = categoryId;
        }

        if (author) {
            filter.author = author;
        }

        if (subject) {
            filter.subject = subject;
        }

        if (language) {
            filter.language = language;
        }

        if (classLevel) {
            filter.classLevel = classLevel;
        }

        if (
            minPrice !== undefined ||
            maxPrice !== undefined
        ) {
            filter.price = {};

            if (minPrice !== undefined) {
                filter.price.$gte = minPrice;
            }

            if (maxPrice !== undefined) {
                filter.price.$lte = maxPrice;
            }
        }

        if (search) {
            filter.$text = { $search: search };
        }

        const skip = (page - 1) * limit;
        const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

        const includeTotal = req.query.includeTotal === "true";

        const query = Book.find(filter)
            .select(LIST_PROJECTION)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean();

        const [books, total] = await Promise.all([ query, includeTotal ? Book.countDocuments(filter) : Promise.resolve(null) ]);

        const response = {
            success: true,
            data: books,
            pagination: {
                page,
                limit,
                hasNextPage: books.length === limit,
                hasPreviousPage: page > 1,
            },
        };

        if (includeTotal) {
            response.pagination.total = total;
            response.pagination.totalPages = Math.ceil(total / limit);
        }

        return res.status(200).json(response);
    } catch (error) {
        next(error);
    }
};


export const getBookById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const bookId = buildObjectId(id);

        if (!bookId) {
            return res.status(400).json({ success: false, message: "Invalid book ID" });
        }

        const book = await Book.findOne({ _id: bookId, isActive: true })
            .select(DETAIL_PROJECTION)
            .populate("category", "name description")
            .lean();

        if (!book) {
            return res.status(404).json({ success: false, message: "Book not found" });
        }

        return res.status(200).json({ success: true, data: book });
    } catch (error) {
        next(error);
    }
};

export const createBook = async (req, res, next) => {
    try {
        const data = req.body;

        let categoryId;

        if (data.category) {
            categoryId = buildObjectId(data.category);

            if (!categoryId) {
                return res.status(400).json({ success: false, message: "Invalid category ID" });
            }

            const categoryExists =
                await Category.exists({ _id: categoryId });

            if (!categoryExists) {
                return res.status(400).json({ success: false, message: "Category does not exist" });
            }
        }

        const book = await Book.create({ ...data, category: categoryId });

        const createdBook = await Book.findById(book._id)
            .select(DETAIL_PROJECTION)
            .lean();

        return res.status(201).json({ success: true, message: "Book created successfully", data: createdBook });
    } catch (error) {
        next(error);
    }
};

export const updateBook = async (req, res, next) => {
    try {
        const { id } = req.params;

        const bookId = buildObjectId(id);

        if (!bookId) {
            return res.status(400).json({ success: false, message: "Invalid book ID" });
        }

        const updateData = { ...req.body };

        delete updateData._id;
        delete updateData.createdAt;
        delete updateData.updatedAt;

        if (updateData.category) {
            const categoryId = buildObjectId(updateData.category);

            if (!categoryId) {
                return res.status(400).json({ success: false, message: "Invalid category ID" });
            }

            const categoryExists =
                await Category.exists({ _id: categoryId });

            if (!categoryExists) {
                return res.status(400).json({ success: false, message: "Category does not exist" });
            }

            updateData.category = categoryId;
        }

        const updatedBook =
            await Book.findByIdAndUpdate(
                bookId,
                {
                    $set: updateData,
                },
                {
                    new: true,
                    runValidators: true,
                }
            )
                .select(DETAIL_PROJECTION)
                .lean();

        if (!updatedBook) {
            return res.status(404).json({ success: false, message: "Book not found" });
        }

        return res.status(200).json({ success: true, message: "Book updated successfully", data: updatedBook });
    } catch (error) {
        next(error);
    }
};


export const deleteBook = async (req, res, next) => {
    try {
        const { id } = req.params;

        const bookId = buildObjectId(id);

        if (!bookId) {
            return res.status(400).json({ success: false, message: "Invalid book ID" });
        }

        const deletedBook =
            await Book.findByIdAndDelete(bookId)
                .select("_id")
                .lean();

        if (!deletedBook) {
            return res.status(404).json({ success: false, message: "Book not found" });
        }

        return res.status(200).json({ success: true, message: "Book deleted successfully" });
    } catch (error) {
        next(error);
    }
};


export const getAdminBookById = async (req, res, next) => {
    try {
        const bookId = buildObjectId(req.params.id);

        if (!bookId) {
            return res.status(400).json({ success: false, message: "Invalid book ID" });
        }

        const book = await Book.findById(bookId)
            .select(DETAIL_PROJECTION)
            .populate("category", "name description")
            .lean();

        if (!book) {
            return res.status(404).json({ success: false, message: "Book not found" });
        }

        return res.json({ success: true, data: book });
    } catch (error) {
        next(error);
    }
};