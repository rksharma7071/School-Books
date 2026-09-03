import mongoose from "mongoose";
import { Category, Book } from "../models/book.model.js";
import { asyncHandler, ApiError } from "../middlewares/asyncHandler.js";

const bookCountLookup = {
    $lookup: {
        from: "books",
        let: { categoryId: "$_id" },
        pipeline: [
            { $match: { $expr: { $and: [{ $eq: ["$category", "$$categoryId"] }, { $eq: ["$isActive", true] }] } } },
            { $count: "count" },
        ],
        as: "bookCount",
    },
};

export const getAllCategoriesWithCount = asyncHandler(async (req, res) => {
    const { sortBy = "name", sortOrder = "asc", limit } = req.query;
    const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    const categories = await Category.aggregate([
        bookCountLookup,
        { $addFields: { bookCount: { $ifNull: [{ $arrayElemAt: ["$bookCount.count", 0] }, 0] } } },
        { $project: { bookCount: 0 } },
        { $sort: sort },
        ...(limit ? [{ $limit: parseInt(limit) }] : []),
    ]);

    const totalBooks = await Book.countDocuments({ isActive: true });
    res.status(200).json({
        success: true,
        data: categories,
        meta: { totalCategories: categories.length, totalBooks },
    });
});

export const getCategoryWithBooks = asyncHandler(async (req, res) => {
    const { identifier } = req.params;
    const { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc" } = req.query;

    if (identifier === "admin" || identifier === "admin/stats") throw new ApiError(404, "Category not found");

    const category = mongoose.Types.ObjectId.isValid(identifier)
        ? await Category.findById(identifier).lean()
        : await Category.findOne({ slug: identifier }).lean();

    if (!category) throw new ApiError(404, "Category not found");

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };
    const filter = { category: category._id, isActive: true };

    const [books, totalBooks] = await Promise.all([
        Book.find(filter).select("name slug price coverImage author").sort(sort).skip(skip).limit(limitNum).lean(),
        Book.countDocuments(filter),
    ]);

    res.status(200).json({
        success: true,
        data: {
            category: { id: category._id, name: category.name, slug: category.slug, description: category.description },
            books,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: totalBooks,
                totalPages: Math.ceil(totalBooks / limitNum),
                hasNextPage: pageNum * limitNum < totalBooks,
                hasPreviousPage: pageNum > 1,
            },
        },
    });
});

export const getCategoryStatistics = asyncHandler(async (req, res) => {
    const stats = await Category.aggregate([
        {
            $lookup: {
                from: "books",
                let: { categoryId: "$_id" },
                pipeline: [
                    { $match: { $expr: { $and: [{ $eq: ["$category", "$$categoryId"] }, { $eq: ["$isActive", true] }] } } },
                    { $group: { _id: null, count: { $sum: 1 }, avgPrice: { $avg: "$price" }, minPrice: { $min: "$price" }, maxPrice: { $max: "$price" } } },
                ],
                as: "bookStats",
            },
        },
        {
            $addFields: {
                bookCount: { $ifNull: [{ $arrayElemAt: ["$bookStats.count", 0] }, 0] },
                avgPrice: { $ifNull: [{ $arrayElemAt: ["$bookStats.avgPrice", 0] }, 0] },
                minPrice: { $ifNull: [{ $arrayElemAt: ["$bookStats.minPrice", 0] }, 0] },
                maxPrice: { $ifNull: [{ $arrayElemAt: ["$bookStats.maxPrice", 0] }, 0] },
            },
        },
        { $project: { name: 1, slug: 1, description: 1, bookCount: 1, avgPrice: 1, minPrice: 1, maxPrice: 1, createdAt: 1 } },
        { $sort: { bookCount: -1 } },
    ]);

    res.status(200).json({ success: true, data: stats });
});

export const getPopularCategories = asyncHandler(async (req, res) => {
    const { limit = 5 } = req.query;

    const categories = await Category.aggregate([
        bookCountLookup,
        { $addFields: { bookCount: { $ifNull: [{ $arrayElemAt: ["$bookCount.count", 0] }, 0] } } },
        { $sort: { bookCount: -1 } },
        { $limit: parseInt(limit) },
        { $project: { name: 1, slug: 1, description: 1, bookCount: 1 } },
    ]);

    res.status(200).json({ success: true, data: categories });
});

export const createCategory = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    if (!name) throw new ApiError(400, "Category name is required");

    const existingCategory = await Category.findOne({
        $or: [{ name: name.trim() }, { slug: name.toLowerCase().replace(/\s+/g, "-") }],
    });
    if (existingCategory) throw new ApiError(400, "Category with this name or slug already exists");

    const category = await Category.create({ name: name.trim(), description: description?.trim() });
    res.status(201).json({ success: true, message: "Category created successfully", data: category });
});

export const updateCategory = asyncHandler(async (req, res) => {
    const { identifier } = req.params;
    const { name, description } = req.body;

    const query = mongoose.Types.ObjectId.isValid(identifier) ? { _id: identifier } : { slug: identifier };
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim();

    const category = await Category.findOneAndUpdate(query, { $set: updateData }, { new: true, runValidators: true });
    if (!category) throw new ApiError(404, "Category not found");

    res.status(200).json({ success: true, message: "Category updated successfully", data: category });
});

export const deleteCategory = asyncHandler(async (req, res) => {
    const { identifier } = req.params;
    const query = mongoose.Types.ObjectId.isValid(identifier) ? { _id: identifier } : { slug: identifier };

    const category = await Category.findOne(query);
    if (!category) throw new ApiError(404, "Category not found");

    const bookCount = await Book.countDocuments({ category: category._id });
    if (bookCount > 0) throw new ApiError(400, `Cannot delete category with ${bookCount} books. Please reassign or delete the books first.`);

    await Category.findByIdAndDelete(category._id);
    res.status(200).json({ success: true, message: "Category deleted successfully" });
});