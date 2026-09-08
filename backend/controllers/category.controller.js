import mongoose from "mongoose";
import { Category } from "../models/category.model.js";
import { Product } from "../models/product.model.js";
import { ApiError, handleError } from "../utils/apiError.js";
import { generateHandle } from "../utils/generateHandle.js";


const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);
const getCategoryQuery = (identifier) =>  isValidId(identifier) ? { _id: identifier } : { handle: identifier };

const productCountLookup = {
    $lookup: {
        from: "products",
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
        as: "productCount"
    }
};

const addProductCount = [
    productCountLookup,
    { 
        $addFields: { 
            productCount: { $ifNull: [{ $arrayElemAt: ["$productCount.count", 0] }, 0] } 
        } 
    },
    { $project: { productCount: 0 } }
];

export const getAllCategoriesWithCount = async (req, res) => {
    try {
        const { sortBy = "name", sortOrder = "asc", limit } = req.query;
        const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };
        const limitStage = limit ? [{ $limit: parseInt(limit) }] : [];

        const categories = await Category.aggregate([
            ...addProductCount,
            { $sort: sort },
            ...limitStage
        ]);

        const totalProducts = await Product.countDocuments({ isActive: true });

        res.status(200).json({
            success: true,
            data: categories,
            meta: { totalCategories: categories.length, totalProducts }
        });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const getCategoryWithProducts = async (req, res) => {
    try {
        const { identifier } = req.params;
        const { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc" } = req.query;

        if (identifier === "admin" || identifier === "admin/stats") {
            throw new ApiError(404, "Category not found");
        }

        const category = isValidId(identifier)
            ? await Category.findById(identifier).lean()
            : await Category.findOne({ handle: identifier }).lean();

        if (!category) throw new ApiError(404, "Category not found");

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const filter = { category: category._id, isActive: true };
        const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

        const [products, totalProducts] = await Promise.all([
            Product.find(filter)
                .select("name slug price coverImage author")
                .sort(sort)
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum)
                .lean(),
            Product.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            data: {
                category: {
                    id: category._id,
                    name: category.name,
                    handle: category.handle,
                    description: category.description,
                    image: category.image,
                    type: category.type
                },
                products,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total: totalProducts,
                    totalPages: Math.ceil(totalProducts / limitNum),
                    hasNextPage: pageNum * limitNum < totalProducts,
                    hasPreviousPage: pageNum > 1
                }
            }
        });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const getCategoryStatistics = async (req, res) => {
    try {
        const stats = await Category.aggregate([
            {
                $lookup: {
                    from: "products",
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
                    as: "productStats"
                }
            },
            {
                $addFields: {
                    productCount: { $ifNull: [{ $arrayElemAt: ["$productStats.count", 0] }, 0] },
                    avgPrice: { $ifNull: [{ $arrayElemAt: ["$productStats.avgPrice", 0] }, 0] },
                    minPrice: { $ifNull: [{ $arrayElemAt: ["$productStats.minPrice", 0] }, 0] },
                    maxPrice: { $ifNull: [{ $arrayElemAt: ["$productStats.maxPrice", 0] }, 0] }
                }
            },
            { 
                $project: { 
                    name: 1, handle: 1, description: 1, 
                    productCount: 1, avgPrice: 1, minPrice: 1, maxPrice: 1, createdAt: 1 
                } 
            },
            { $sort: { productCount: -1 } }
        ]);

        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const getPopularCategories = async (req, res) => {
    try {
        const { limit = 5 } = req.query;

        const categories = await Category.aggregate([
            ...addProductCount,
            { $sort: { productCount: -1 } },
            { $limit: parseInt(limit) },
            { $project: { name: 1, handle: 1, description: 1, image: 1, productCount: 1 } }
        ]);

        res.status(200).json({ success: true, data: categories });
    } catch (error) {
        handleError(error, req, res);
    }
};

const validateCategoryType = (type, field = "type") => {
    if (type && !["manual", "automatic"].includes(type)) {
        throw new ApiError(400, `${field} must be 'manual' or 'automatic'`);
    }
};

const validateConditionMatch = (match) => {
    if (match && !["all", "any"].includes(match)) {
        throw new ApiError(400, "conditionMatch must be 'all' or 'any'");
    }
};

const generateUniqueHandle = async (baseHandle) => {
    let handle = baseHandle;
    let counter = 1;
    
    while (await Category.findOne({ handle }).lean()) {
        handle = `${baseHandle}-${counter}`;
        counter++;
    }
    
    return handle;
};

export const createCategory = async (req, res) => {
    try {
        const { name, description, image, isActive, sortOrder, type, conditionMatch, conditions } = req.body;
        
        if (!name) throw new ApiError(400, "Category name is required");

        let handle;
        if (req.body.handle) {
            handle = generateHandle(String(req.body.handle));
        } else {
            handle = generateHandle(name);
        }
        
        if (!handle) throw new ApiError(400, "Could not derive a valid handle from the category name");

        handle = await generateUniqueHandle(handle);

        validateCategoryType(type);
        validateConditionMatch(conditionMatch);

        const existingCategory = await Category.findOne({
            $or: [{ name: name.trim() }, { handle }]
        }).lean();

        if (existingCategory) {
            throw new ApiError(400, "Category with this name or handle already exists");
        }

        const category = await Category.create({
            name: name.trim(),
            handle,
            description: description?.trim(),
            image,
            isActive,
            sortOrder,
            type,
            conditionMatch,
            conditions
        });

        res.status(201).json({ 
            success: true, 
            message: "Category created successfully", 
            data: category 
        });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const updateCategory = async (req, res) => {
    try {
        const { identifier } = req.params;
        const { name, description, handle, image, isActive, sortOrder, type, conditionMatch, conditions } = req.body;

        const updateData = {};
        
        if (name) updateData.name = name.trim();
        if (description !== undefined) updateData.description = description?.trim();
        if (handle) {
            const newHandle = generateHandle(String(handle));

            const existingCategory = await Category.findOne({ 
                handle: newHandle,
                _id: { $ne: isValidId(identifier) ? identifier : (await Category.findOne(getCategoryQuery(identifier)))?._id }
            }).lean();
            
            if (existingCategory) {
                throw new ApiError(400, "Handle already in use by another category");
            }
            updateData.handle = newHandle;
        }
        if (image !== undefined) updateData.image = image;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
        
        if (type !== undefined) {
            validateCategoryType(type);
            updateData.type = type;
        }
        
        if (conditionMatch !== undefined) {
            validateConditionMatch(conditionMatch);
            updateData.conditionMatch = conditionMatch;
        }
        
        if (conditions !== undefined) updateData.conditions = conditions;

        const category = await Category.findOneAndUpdate(
            getCategoryQuery(identifier),
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!category) throw new ApiError(404, "Category not found");

        res.status(200).json({ 
            success: true, 
            message: "Category updated successfully", 
            data: category 
        });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const deleteCategory = async (req, res) => {
    try {
        const { identifier } = req.params;

        const category = await Category.findOne(getCategoryQuery(identifier));
        if (!category) throw new ApiError(404, "Category not found");

        const productCount = await Product.countDocuments({ category: category._id });
        if (productCount > 0) {
            throw new ApiError(400, `Cannot delete category with ${productCount} products. Please reassign or delete the products first.`);
        }

        await Category.findByIdAndDelete(category._id);
        
        res.status(200).json({ 
            success: true, 
            message: "Category deleted successfully" 
        });
    } catch (error) {
        handleError(error, req, res);
    }
};