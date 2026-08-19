import mongoose from "mongoose";
import { Book, Category } from "../models/book.model.js";

const LIST_PROJECTION = {
    name: 1,
    slug: 1,
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
    slug: 1,
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

const findBookByIdentifier = async (identifier, options = {}) => {
    const { select, populate, lean = true } = options;

    let query = {};

    if (mongoose.Types.ObjectId.isValid(identifier)) {
        query = { _id: identifier };
    } else {
        query = { slug: identifier };
    }

    let bookQuery = Book.findOne(query);

    if (select) {
        bookQuery = bookQuery.select(select);
    }

    if (populate) {
        bookQuery = bookQuery.populate(populate);
    }

    if (lean) {
        bookQuery = bookQuery.lean();
    }

    return bookQuery;
};

const findCategoryByIdentifier = async (identifier) => {
    let query = {};

    if (mongoose.Types.ObjectId.isValid(identifier)) {
        query = { _id: identifier };
    } else {
        query = { slug: identifier };
    }

    return await Category.findOne(query).lean();
};

function calculateDistribution(ratings) {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    if (Array.isArray(ratings)) {
        ratings.forEach(rating => {
            if (distribution.hasOwnProperty(rating)) {
                distribution[rating]++;
            }
        });
    }

    return distribution;
}

function formatReview(review) {
    return {
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
            fullName: [review.userId.first_name, review.userId.last_name]
                .filter(Boolean)
                .join(" ") || review.userId.username
        } : null
    };
}

const getAllBooks = async (req, res, next) => {
    try {
        const {
            page, limit, search, category, author, subject, language,
            classLevel, minPrice, maxPrice, isActive, sortBy, sortOrder,
            includeReviews = false, reviewLimit = 3
        } = req.query;

        const filter = {};

        if (isActive !== undefined) {
            filter.isActive = isActive;
        } else {
            filter.isActive = true;
        }

        if (category) {
            // Check if category is a slug or ID
            const categoryDoc = await findCategoryByIdentifier(category);

            if (!categoryDoc) {
                return res.status(400).json({
                    success: false,
                    message: "Category not found"
                });
            }

            filter.category = categoryDoc._id;
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

        if (minPrice !== undefined || maxPrice !== undefined) {
            filter.price = {};

            if (minPrice !== undefined) {
                filter.price.$gte = Number(minPrice);
            }

            if (maxPrice !== undefined) {
                filter.price.$lte = Number(maxPrice);
            }
        }

        if (search) {
            filter.$text = { $search: search };
        }

        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;
        const skip = (pageNum - 1) * limitNum;
        const sort = { [sortBy || 'createdAt']: sortOrder === "asc" ? 1 : -1 };

        const includeTotal = req.query.includeTotal === "true";
        const shouldIncludeReviews = includeReviews === true || includeReviews === "true";
        const reviewLimitNum = Math.min(10, parseInt(reviewLimit) || 3);

        // Get books
        const books = await Book.find(filter)
            .select(LIST_PROJECTION)
            .populate("category", "name slug description")
            .sort(sort)
            .skip(skip)
            .limit(limitNum)
            .lean();

        // Get total count if requested
        const total = includeTotal ? await Book.countDocuments(filter) : null;

        // If reviews are requested, fetch them for all books
        let booksWithReviews = books;

        if (shouldIncludeReviews && books.length > 0) {
            const bookIds = books.map(book => book._id);

            // Fetch reviews for all books in parallel
            const [reviewsData, ratingStats] = await Promise.all([
                Review.find({
                    bookId: { $in: bookIds },
                    approved: true
                })
                    .populate("userId", "first_name last_name username")
                    .sort({ createdAt: -1 })
                    .lean(),
                Review.aggregate([
                    {
                        $match: {
                            bookId: { $in: bookIds },
                            approved: true
                        }
                    },
                    {
                        $group: {
                            _id: "$bookId",
                            averageRating: { $avg: "$rating" },
                            totalReviews: { $sum: 1 },
                            ratings: { $push: "$rating" }
                        }
                    }
                ])
            ]);

            // Create maps for quick lookup
            const reviewsByBook = new Map();
            const statsByBook = new Map();

            // Group reviews by book
            reviewsData.forEach(review => {
                const bookIdStr = review.bookId.toString();
                if (!reviewsByBook.has(bookIdStr)) {
                    reviewsByBook.set(bookIdStr, []);
                }
                reviewsByBook.get(bookIdStr).push(review);
            });

            // Group stats by book
            ratingStats.forEach(stat => {
                statsByBook.set(stat._id.toString(), {
                    averageRating: parseFloat(stat.averageRating.toFixed(1)),
                    totalReviews: stat.totalReviews,
                    distribution: calculateDistribution(stat.ratings)
                });
            });

            // Attach reviews and stats to each book
            booksWithReviews = books.map(book => {
                const bookIdStr = book._id.toString();
                const bookReviews = reviewsByBook.get(bookIdStr) || [];
                const stats = statsByBook.get(bookIdStr) || {
                    averageRating: 0,
                    totalReviews: 0,
                    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
                };

                return {
                    ...book,
                    rating: stats.averageRating,
                    reviewCount: stats.totalReviews,
                    reviews: shouldIncludeReviews ? {
                        summary: stats,
                        recent: bookReviews.slice(0, reviewLimitNum).map(formatReview)
                    } : undefined
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
            },
        };

        if (includeTotal) {
            response.pagination.total = total;
            response.pagination.totalPages = Math.ceil(total / limitNum);
        }

        return res.status(200).json(response);
    } catch (error) {
        next(error);
    }
};

const getBooksByCategorySlug = async (req, res, next) => {
    try {
        const { categorySlug } = req.params;
        const {
            page, limit, search, author, subject, language,
            classLevel, minPrice, maxPrice, isActive, sortBy, sortOrder
        } = req.query;

        const category = await Category.findOne({ slug: categorySlug, isActive: true })
            .select("_id name slug description")
            .lean();

        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        const filter = {
            category: category._id,
        };

        if (isActive !== undefined) {
            filter.isActive = isActive;
        } else {
            filter.isActive = true;
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

        if (minPrice !== undefined || maxPrice !== undefined) {
            filter.price = {};

            if (minPrice !== undefined) {
                filter.price.$gte = Number(minPrice);
            }

            if (maxPrice !== undefined) {
                filter.price.$lte = Number(maxPrice);
            }
        }

        if (search) {
            filter.$text = { $search: search };
        }

        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;
        const skip = (pageNum - 1) * limitNum;
        const sort = { [sortBy || 'createdAt']: sortOrder === "asc" ? 1 : -1 };

        const includeTotal = req.query.includeTotal === "true";

        const query = Book.find(filter)
            .select(LIST_PROJECTION)
            .populate("category", "name slug description")
            .sort(sort)
            .skip(skip)
            .limit(limitNum)
            .lean();

        const [books, total] = await Promise.all([
            query,
            includeTotal ? Book.countDocuments(filter) : Promise.resolve(null)
        ]);

        const response = {
            success: true,
            data: {
                category: {
                    id: category._id,
                    name: category.name,
                    slug: category.slug,
                    description: category.description,
                },
                books: books,
            },
            pagination: {
                page: pageNum,
                limit: limitNum,
                hasNextPage: books.length === limitNum,
                hasPreviousPage: pageNum > 1,
            },
        };

        if (includeTotal) {
            response.pagination.total = total;
            response.pagination.totalPages = Math.ceil(total / limitNum);
        }

        return res.status(200).json(response);
    } catch (error) {
        next(error);
    }
};

const getBookBySlug = async (req, res, next) => {
    try {
        const { slug } = req.params;

        if (!slug) {
            return res.status(400).json({
                success: false,
                message: "Slug is required"
            });
        }

        const book = await Book.findOne({ slug, isActive: true })
            .select(DETAIL_PROJECTION)
            .populate("category", "name slug description")
            .lean();

        if (!book) {
            return res.status(404).json({
                success: false,
                message: "Book not found"
            });
        }

        const reviews = await Review.find({
            bookId: book._id,
            approved: true
        })
            .populate("userId", "first_name last_name username")
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        const ratingStats = await Review.aggregate([
            {
                $match: {
                    bookId: book._id,
                    approved: true
                }
            },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: "$rating" },
                    totalReviews: { $sum: 1 },
                    ratingDistribution: {
                        $push: "$rating"
                    }
                }
            }
        ]);

        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let averageRating = 0;
        let totalReviews = 0;

        if (ratingStats.length > 0) {
            averageRating = parseFloat(ratingStats[0].averageRating.toFixed(1));
            totalReviews = ratingStats[0].totalReviews;

            ratingStats[0].ratingDistribution.forEach(rating => {
                if (distribution.hasOwnProperty(rating)) {
                    distribution[rating]++;
                }
            });
        }

        const formattedReviews = reviews.map((review) => ({
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
                fullName: [review.userId.first_name, review.userId.last_name]
                    .filter(Boolean)
                    .join(" ") || review.userId.username
            } : null
        }));

        return res.status(200).json({
            success: true,
            data: {
                ...book,
                reviews: {
                    summary: {
                        averageRating,
                        totalReviews,
                        distribution
                    },
                    recent: formattedReviews
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

const getBookById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const book = await findBookByIdentifier(id, {
            select: DETAIL_PROJECTION,
            populate: { path: "category", select: "name slug description" }
        });

        if (!book) {
            return res.status(404).json({ success: false, message: "Book not found" });
        }

        return res.status(200).json({ success: true, data: book });
    } catch (error) {
        next(error);
    }
};

const createBook = async (req, res, next) => {
    try {
        const data = req.body;

        let categoryId;

        if (data.category) {
            // Check if category is slug or ID
            const categoryDoc = await findCategoryByIdentifier(data.category);

            if (!categoryDoc) {
                return res.status(400).json({
                    success: false,
                    message: "Category not found"
                });
            }

            categoryId = categoryDoc._id;
        }

        if (!data.slug && data.name) {
            data.slug = data.name
                .toLowerCase()
                .replace(/[^a-zA-Z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim();
        }

        const book = await Book.create({ ...data, category: categoryId });

        const createdBook = await Book.findById(book._id)
            .select(DETAIL_PROJECTION)
            .populate("category", "name slug description")
            .lean();

        return res.status(201).json({ success: true, message: "Book created successfully", data: createdBook });
    } catch (error) {
        if (error.code === 11000 && error.keyPattern && error.keyPattern.slug) {
            return res.status(400).json({
                success: false,
                message: "A book with this slug already exists. Please provide a unique slug."
            });
        }
        next(error);
    }
};

const updateBook = async (req, res, next) => {
    try {
        const { id } = req.params;

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

        // Generate slug if name is updated but slug is not provided
        if (updateData.name && !updateData.slug) {
            updateData.slug = updateData.name
                .toLowerCase()
                .replace(/[^a-zA-Z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim();
        }

        let query = {};
        if (mongoose.Types.ObjectId.isValid(id)) {
            query = { _id: id };
        } else {
            query = { slug: id };
        }

        const updatedBook =
            await Book.findOneAndUpdate(
                query,
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
        // Handle duplicate slug error
        if (error.code === 11000 && error.keyPattern && error.keyPattern.slug) {
            return res.status(400).json({
                success: false,
                message: "A book with this slug already exists. Please provide a unique slug."
            });
        }
        next(error);
    }
};

const deleteBook = async (req, res, next) => {
    try {
        const { id } = req.params;

        let query = {};
        if (mongoose.Types.ObjectId.isValid(id)) {
            query = { _id: id };
        } else {
            query = { slug: id };
        }

        const deletedBook =
            await Book.findOneAndDelete(query)
                .select("_id slug")
                .lean();

        if (!deletedBook) {
            return res.status(404).json({ success: false, message: "Book not found" });
        }

        return res.status(200).json({ success: true, message: "Book deleted successfully" });
    } catch (error) {
        next(error);
    }
};

const getAdminBookById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const book = await findBookByIdentifier(id, {
            select: DETAIL_PROJECTION,
            populate: { path: "category", select: "name description" }
        });

        if (!book) {
            return res.status(404).json({ success: false, message: "Book not found" });
        }

        return res.json({ success: true, data: book });
    } catch (error) {
        next(error);
    }
};

export {
    getAllBooks,
    getBooksByCategorySlug,
    getBookBySlug,
    getBookById,
    createBook,
    updateBook,
    deleteBook,
    getAdminBookById
}