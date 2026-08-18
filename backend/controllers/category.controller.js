import mongoose from "mongoose";
import { Category, Book } from "../models/book.model.js";

export const getAllCategoriesWithCount = async (req, res, next) => {
    try {
        const { isActive, sortBy, sortOrder, limit } = req.query;
        const filter = {};
        
        const sort = {};
        const sortField = sortBy || 'name';
        const sortDirection = sortOrder === 'desc' ? -1 : 1;
        sort[sortField] = sortDirection;

        const categories = await Category.aggregate([
            {
                $lookup: {
                    from: "books",
                    let: { categoryId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$category", "$$categoryId"] },
                                        { $eq: ["$isActive", true] }
                                    ]
                                }
                            }
                        },
                        { $count: "count" }
                    ],
                    as: "bookCount"
                }
            },
            {
                $addFields: {
                    bookCount: {
                        $ifNull: [
                            { $arrayElemAt: ["$bookCount.count", 0] },
                            0
                        ]
                    }
                }
            },
            {
                $project: {
                    bookCount: 0
                }
            },
            { $sort: sort },
            ...(limit ? [{ $limit: parseInt(limit) }] : [])
        ]);

        const totalBooks = await Book.countDocuments({ isActive: true });

        return res.status(200).json({
            success: true,
            data: categories,
            meta: {
                totalCategories: categories.length,
                totalBooks: totalBooks
            }
        });
    } catch (error) {
        next(error);
    }
};

export const getCategoryWithBooks = async (req, res, next) => {
    try {
        const { identifier } = req.params;
        const { page, limit, sortBy, sortOrder } = req.query;

        // ✅ Handle admin route - should have been caught earlier, but just in case
        if (identifier === "admin" || identifier === "admin/stats") {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        let category;
        if (mongoose.Types.ObjectId.isValid(identifier)) {
            category = await Category.findById(identifier).lean();
        } else {
            category = await Category.findOne({ slug: identifier }).lean();
        }

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;
        const skip = (pageNum - 1) * limitNum;
        
        const sort = {};
        const sortField = sortBy || 'createdAt';
        const sortDirection = sortOrder === 'asc' ? 1 : -1;
        sort[sortField] = sortDirection;

        const filter = {
            category: category._id,
            isActive: true
        };

        const [books, totalBooks] = await Promise.all([
            Book.find(filter)
                .select("name slug price coverImage author")
                .sort(sort)
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Book.countDocuments(filter)
        ]);

        return res.status(200).json({
            success: true,
            data: {
                category: {
                    id: category._id,
                    name: category.name,
                    slug: category.slug,
                    description: category.description
                },
                books: books,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total: totalBooks,
                    totalPages: Math.ceil(totalBooks / limitNum),
                    hasNextPage: pageNum * limitNum < totalBooks,
                    hasPreviousPage: pageNum > 1
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

export const getCategoryStatistics = async (req, res, next) => {
    try {
        const stats = await Category.aggregate([
            {
                $lookup: {
                    from: "books",
                    let: { categoryId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$category", "$$categoryId"] },
                                        { $eq: ["$isActive", true] }
                                    ]
                                }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                count: { $sum: 1 },
                                avgPrice: { $avg: "$price" },
                                minPrice: { $min: "$price" },
                                maxPrice: { $max: "$price" }
                            }
                        }
                    ],
                    as: "bookStats"
                }
            },
            {
                $addFields: {
                    bookCount: {
                        $ifNull: [{ $arrayElemAt: ["$bookStats.count", 0] }, 0]
                    },
                    avgPrice: {
                        $ifNull: [{ $arrayElemAt: ["$bookStats.avgPrice", 0] }, 0]
                    },
                    minPrice: {
                        $ifNull: [{ $arrayElemAt: ["$bookStats.minPrice", 0] }, 0]
                    },
                    maxPrice: {
                        $ifNull: [{ $arrayElemAt: ["$bookStats.maxPrice", 0] }, 0]
                    }
                }
            },
            {
                $project: {
                    name: 1,
                    slug: 1,
                    description: 1,
                    bookCount: 1,
                    avgPrice: 1,
                    minPrice: 1,
                    maxPrice: 1,
                    createdAt: 1
                }
            },
            { $sort: { bookCount: -1 } }
        ]);

        return res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        next(error);
    }
};

export const getPopularCategories = async (req, res, next) => {
    try {
        const { limit = 5 } = req.query;

        const categories = await Category.aggregate([
            {
                $lookup: {
                    from: "books",
                    let: { categoryId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$category", "$$categoryId"] },
                                        { $eq: ["$isActive", true] }
                                    ]
                                }
                            }
                        },
                        { $count: "count" }
                    ],
                    as: "bookCount"
                }
            },
            {
                $addFields: {
                    bookCount: {
                        $ifNull: [{ $arrayElemAt: ["$bookCount.count", 0] }, 0]
                    }
                }
            },
            { $sort: { bookCount: -1 } },
            { $limit: parseInt(limit) },
            {
                $project: {
                    name: 1,
                    slug: 1,
                    description: 1,
                    bookCount: 1
                }
            }
        ]);

        return res.status(200).json({
            success: true,
            data: categories
        });
    } catch (error) {
        next(error);
    }
};

export const createCategory = async (req, res, next) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Category name is required"
            });
        }

        const existingCategory = await Category.findOne({
            $or: [
                { name: name.trim() },
                { slug: name.toLowerCase().replace(/\s+/g, '-') }
            ]
        });

        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: "Category with this name or slug already exists"
            });
        }

        const category = await Category.create({
            name: name.trim(),
            description: description?.trim()
        });

        return res.status(201).json({
            success: true,
            message: "Category created successfully",
            data: category
        });
    } catch (error) {
        next(error);
    }
};

export const updateCategory = async (req, res, next) => {
    try {
        const { identifier } = req.params;
        const { name, description } = req.body;

        let query = {};
        if (mongoose.Types.ObjectId.isValid(identifier)) {
            query = { _id: identifier };
        } else {
            query = { slug: identifier };
        }

        const updateData = {};
        if (name) {
            updateData.name = name.trim();
        }
        if (description !== undefined) {
            updateData.description = description?.trim();
        }

        const category = await Category.findOneAndUpdate(
            query,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Category updated successfully",
            data: category
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Category with this slug already exists"
            });
        }
        next(error);
    }
};

export const deleteCategory = async (req, res, next) => {
    try {
        const { identifier } = req.params;

        let query = {};
        if (mongoose.Types.ObjectId.isValid(identifier)) {
            query = { _id: identifier };
        } else {
            query = { slug: identifier };
        }

        const category = await Category.findOne(query);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        const bookCount = await Book.countDocuments({ category: category._id });
        if (bookCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete category with ${bookCount} books. Please reassign or delete the books first.`
            });
        }

        await Category.findByIdAndDelete(category._id);

        return res.status(200).json({
            success: true,
            message: "Category deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};