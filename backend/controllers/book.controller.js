import mongoose from "mongoose";
import { Book, Category } from "../models/book.model.js";
import { Review } from "../models/review.model.js";
import { asyncHandler, ApiError } from "../middlewares/asyncHandler.js";

const LIST_PROJECTION = {
    name: 1, slug: 1, price: 1, isbn: 1, author: 1, publisher: 1,
    category: 1, classLevel: 1, subject: 1, language: 1, stockQty: 1,
    coverImage: 1, isActive: 1, createdAt: 1, updatedAt: 1,
};

const DETAIL_PROJECTION = {
    ...LIST_PROJECTION, description: 1, images: 1,
};

const buildObjectId = (id) => mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;

const findBookByIdentifier = async (identifier, options = {}) => {
    const { select, populate, lean = true } = options;
    const query = mongoose.Types.ObjectId.isValid(identifier) ? { _id: identifier } : { slug: identifier };
    let bookQuery = Book.findOne(query);
    if (select) bookQuery = bookQuery.select(select);
    if (populate) bookQuery = bookQuery.populate(populate);
    if (lean) bookQuery = bookQuery.lean();
    return bookQuery;
};

const findCategoryByIdentifier = async (identifier) => {
    const query = mongoose.Types.ObjectId.isValid(identifier) ? { _id: identifier } : { slug: identifier };
    return Category.findOne(query).lean();
};

const calculateDistribution = (ratings) => {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (Array.isArray(ratings)) {
        ratings.forEach((rating) => {
            if (distribution.hasOwnProperty(rating)) distribution[rating]++;
        });
    }
    return distribution;
};

const formatReview = (review) => ({
    id: review._id,
    rating: review.rating,
    title: review.title,
    body: review.body,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    user: review.userId ? {
        id: review.userId._id,
        username: review.userId.username,
        firstName: review.userId.first_name,
        lastName: review.userId.last_name,
        fullName: [review.userId.first_name, review.userId.last_name].filter(Boolean).join(" ") || review.userId.username,
    } : null,
});

export const getAllBooks = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search, category, author, subject, language,
        classLevel, minPrice, maxPrice, isActive = true, sortBy = "createdAt", sortOrder = "desc",
        includeReviews = false, reviewLimit = 3, includeTotal = false } = req.query;

    const filter = { isActive: isActive === "false" ? false : true };
    if (category) {
        const categoryDoc = await findCategoryByIdentifier(category);
        if (!categoryDoc) throw new ApiError(400, "Category not found");
        filter.category = categoryDoc._id;
    }
    if (author) filter.author = author;
    if (subject) filter.subject = subject;
    if (language) filter.language = language;
    if (classLevel) filter.classLevel = classLevel;
    if (minPrice !== undefined || maxPrice !== undefined) {
        filter.price = {};
        if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
        if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
    }
    if (search) filter.$text = { $search: search };

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const books = await Book.find(filter)
        .select(LIST_PROJECTION)
        .populate("category", "name slug description")
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean();

    const total = includeTotal ? await Book.countDocuments(filter) : null;
    let booksWithReviews = books;

    if (includeReviews && books.length > 0) {
        const bookIds = books.map((book) => book._id);
        const [reviewsData, ratingStats] = await Promise.all([
            Review.find({ bookId: { $in: bookIds }, approved: true })
                .populate("userId", "first_name last_name username")
                .sort({ createdAt: -1 })
                .lean(),
            Review.aggregate([
                { $match: { bookId: { $in: bookIds }, approved: true } },
                { $group: { _id: "$bookId", averageRating: { $avg: "$rating" }, totalReviews: { $sum: 1 }, ratings: { $push: "$rating" } } },
            ]),
        ]);

        const reviewsByBook = new Map();
        const statsByBook = new Map();

        reviewsData.forEach((review) => {
            const bookIdStr = review.bookId.toString();
            if (!reviewsByBook.has(bookIdStr)) reviewsByBook.set(bookIdStr, []);
            reviewsByBook.get(bookIdStr).push(review);
        });

        ratingStats.forEach((stat) => {
            statsByBook.set(stat._id.toString(), {
                averageRating: parseFloat(stat.averageRating.toFixed(1)),
                totalReviews: stat.totalReviews,
                distribution: calculateDistribution(stat.ratings),
            });
        });

        booksWithReviews = books.map((book) => {
            const bookIdStr = book._id.toString();
            const bookReviews = reviewsByBook.get(bookIdStr) || [];
            const stats = statsByBook.get(bookIdStr) || { averageRating: 0, totalReviews: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
            return {
                ...book,
                rating: stats.averageRating,
                reviewCount: stats.totalReviews,
                reviews: { summary: stats, recent: bookReviews.slice(0, parseInt(reviewLimit)).map(formatReview) },
            };
        });
    }

    const response = {
        success: true,
        data: booksWithReviews,
        pagination: {
            page: pageNum,
            limit: limitNum,
            hasNextPage: books.length === limitNum,
            hasPreviousPage: pageNum > 1,
            ...(total !== null && { total, totalPages: Math.ceil(total / limitNum) }),
        },
    };
    res.status(200).json(response);
});

export const getBooksByCategorySlug = asyncHandler(async (req, res) => {
    const { categorySlug } = req.params;
    const { page = 1, limit = 10, search, author, subject, language, classLevel, minPrice, maxPrice, isActive = true, sortBy = "createdAt", sortOrder = "desc", includeTotal = false } = req.query;

    const category = await Category.findOne({ slug: categorySlug, isActive: true }).select("_id name slug description").lean();
    if (!category) throw new ApiError(404, "Category not found");

    const filter = { category: category._id, isActive: isActive === "false" ? false : true };
    if (author) filter.author = author;
    if (subject) filter.subject = subject;
    if (language) filter.language = language;
    if (classLevel) filter.classLevel = classLevel;
    if (minPrice !== undefined || maxPrice !== undefined) {
        filter.price = {};
        if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
        if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
    }
    if (search) filter.$text = { $search: search };

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const query = Book.find(filter)
        .select(LIST_PROJECTION)
        .populate("category", "name slug description")
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean();

    const [books, total] = await Promise.all([
        query,
        includeTotal ? Book.countDocuments(filter) : Promise.resolve(null),
    ]);

    const response = {
        success: true,
        data: {
            category: { id: category._id, name: category.name, slug: category.slug, description: category.description },
            books,
        },
        pagination: {
            page: pageNum,
            limit: limitNum,
            hasNextPage: books.length === limitNum,
            hasPreviousPage: pageNum > 1,
            ...(total !== null && { total, totalPages: Math.ceil(total / limitNum) }),
        },
    };
    res.status(200).json(response);
});

export const getBookBySlug = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    if (!slug) throw new ApiError(400, "Slug is required");

    const book = await Book.findOne({ slug, isActive: true })
        .select(DETAIL_PROJECTION)
        .populate("category", "name slug description")
        .lean();
    if (!book) throw new ApiError(404, "Book not found");

    const reviews = await Review.find({ bookId: book._id, approved: true })
        .populate("userId", "first_name last_name username")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

    const ratingStats = await Review.aggregate([
        { $match: { bookId: book._id, approved: true } },
        { $group: { _id: null, averageRating: { $avg: "$rating" }, totalReviews: { $sum: 1 }, ratingDistribution: { $push: "$rating" } } },
    ]);

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let averageRating = 0;
    let totalReviews = 0;
    if (ratingStats.length > 0) {
        averageRating = parseFloat(ratingStats[0].averageRating.toFixed(1));
        totalReviews = ratingStats[0].totalReviews;
        ratingStats[0].ratingDistribution.forEach((rating) => {
            if (distribution.hasOwnProperty(rating)) distribution[rating]++;
        });
    }

    res.status(200).json({
        success: true,
        data: {
            ...book,
            reviews: {
                summary: { averageRating, totalReviews, distribution },
                recent: reviews.map(formatReview),
            },
        },
    });
});

export const getBookById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const book = await findBookByIdentifier(id, {
        select: DETAIL_PROJECTION,
        populate: { path: "category", select: "name slug description" },
    });
    if (!book) throw new ApiError(404, "Book not found");
    res.status(200).json({ success: true, data: book });
});

export const createBook = asyncHandler(async (req, res) => {
    const data = req.body;
    let categoryId;

    if (data.category) {
        const categoryDoc = await findCategoryByIdentifier(data.category);
        if (!categoryDoc) throw new ApiError(400, "Category not found");
        categoryId = categoryDoc._id;
    }

    if (!data.slug && data.name) {
        data.slug = data.name.toLowerCase().replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
    }

    const book = await Book.create({ ...data, category: categoryId });
    const createdBook = await Book.findById(book._id).select(DETAIL_PROJECTION).populate("category", "name slug description").lean();
    res.status(201).json({ success: true, message: "Book created successfully", data: createdBook });
});

export const updateBook = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = { ...req.body };
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    if (updateData.category) {
        const categoryId = buildObjectId(updateData.category);
        if (!categoryId) throw new ApiError(400, "Invalid category ID");
        const categoryExists = await Category.exists({ _id: categoryId });
        if (!categoryExists) throw new ApiError(400, "Category does not exist");
        updateData.category = categoryId;
    }

    if (updateData.name && !updateData.slug) {
        updateData.slug = updateData.name.toLowerCase().replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
    }

    const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { slug: id };
    const updatedBook = await Book.findOneAndUpdate(query, { $set: updateData }, { new: true, runValidators: true })
        .select(DETAIL_PROJECTION)
        .lean();
    if (!updatedBook) throw new ApiError(404, "Book not found");
    res.status(200).json({ success: true, message: "Book updated successfully", data: updatedBook });
});

export const deleteBook = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { slug: id };
    const deletedBook = await Book.findOneAndDelete(query).select("_id slug").lean();
    if (!deletedBook) throw new ApiError(404, "Book not found");
    res.status(200).json({ success: true, message: "Book deleted successfully" });
});

export const getAdminBookById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const book = await findBookByIdentifier(id, {
        select: DETAIL_PROJECTION,
        populate: { path: "category", select: "name description" },
    });
    if (!book) throw new ApiError(404, "Book not found");
    res.json({ success: true, data: book });
});