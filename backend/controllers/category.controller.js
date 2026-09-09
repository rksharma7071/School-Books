import mongoose from "mongoose";
import { Category } from "../models/category.model.js";
import { Product } from "../models/product.model.js";
import { File } from "../models/file.model.js";
import { ApiError, handleError } from "../utils/apiError.js";
import { generateHandle } from "../utils/generateHandle.js";
import cloudinary from "../config/cloudinary.js";

const getCategoryQuery = (identifier) => (mongoose.Types.ObjectId.isValid(identifier) ? { _id: identifier } : { handle: identifier });

const SORT_WHITELIST = ["name", "sortOrder", "createdAt", "updatedAt", "productCount"];

const validateCategoryName = async (name, excludeId = null) => {
    const query = { name: { $regex: new RegExp(`^${name}$`, "i") } };
    if (excludeId) {
        query._id = { $ne: excludeId };
    }

    const existing = await Category.findOne(query).lean();
    if (existing) {
        throw new ApiError(409, "Category with this name already exists");
    }
};

const generateUniqueHandle = async (baseHandle, excludeId = null) => {
    let handle = baseHandle;
    let counter = 1;

    const query = { handle };
    if (excludeId) {
        query._id = { $ne: excludeId };
    }

    while (await Category.findOne(query).lean()) {
        handle = `${baseHandle}-${counter}`;
        counter++;
        query.handle = handle;
    }

    return handle;
};

const getProductCount = async (category, includeInactive = false) => {
    if (category.type === "manual") {
        const query = { categories: category._id };
        if (!includeInactive) {
            query.isActive = true;
        }
        return Product.countDocuments(query);
    }

    const query = {};
    if (!includeInactive) {
        query.isActive = true;
    }
    return Product.countDocuments(query);
};

const cleanupCategoryImage = async (publicId, excludeId = null) => {
    if (!publicId) return;

    try {
        const query = { imagePublicId: publicId };
        if (excludeId) {
            query._id = { $ne: excludeId };
        }

        const otherCategories = await Category.countDocuments(query);
        if (otherCategories === 0) {
            await cloudinary.uploader.destroy(publicId, { invalidate: true });
            await File.deleteOne({ publicId });
        }
    } catch (error) {
        console.error(`Failed to cleanup image ${publicId}:`, error.message);
    }
};

export const getAllCategoriesWithCount = async (req, res) => {
    try {
        const { search, sortBy = "sortOrder", sortOrder = "asc", page = 1, limit = 20, includeInactive = false } = req.query;

        const pageNum = Math.max(1, Number(page) || 1);
        const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));

        if (!SORT_WHITELIST.includes(sortBy)) {
            throw new ApiError(400, `Invalid sortBy field. Allowed: ${SORT_WHITELIST.join(", ")}`);
        }

        const sortOrderValue = sortOrder === "desc" ? -1 : 1;
        const sort = { [sortBy]: sortOrderValue, name: 1 };

        const filter = {};
        if (!includeInactive) {
            filter.isActive = true;
        }

        if (search) {
            filter.$or = [
                { name: search },
                { handle: search },
                { description: search },
            ];
        }

        const [categories, total] = await Promise.all([
            Category.find(filter)
                .sort(sort)
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum)
                .lean(),
            Category.countDocuments(filter),
        ]);

        const categoriesWithCount = await Promise.all(
            categories.map(async (category) => {
                const productCount = await getProductCount(category, includeInactive);
                return {
                    id: category._id,
                    name: category.name,
                    handle: category.handle,
                    description: category.description,
                    image: category.image,
                    type: category.type,
                    isActive: category.isActive,
                    sortOrder: category.sortOrder,
                    productCount,
                };
            })
        );

        res.status(200).json({
            success: true,
            data: categoriesWithCount,
            meta: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
                hasNextPage: pageNum * limitNum < total,
                hasPreviousPage: pageNum > 1,
            },
        });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const getCategoryDetail = async (req, res) => {
    try {
        const { identifier } = req.params;

        if (identifier === "admin" || identifier === "all" || identifier === "popular") {
            throw new ApiError(404, "Category not found");
        }

        const category = await Category.findOne(getCategoryQuery(identifier)).lean();
        if (!category) {
            throw new ApiError(404, "Category not found");
        }

        if (!category.isActive && req.user?.role !== "admin") {
            throw new ApiError(404, "Category not found");
        }

        const productCount = await getProductCount(category, req.user?.role === "admin");

        res.status(200).json({
            success: true,
            data: {
                id: category._id,
                name: category.name,
                handle: category.handle,
                description: category.description,
                image: category.image,
                type: category.type,
                conditionMatch: category.conditionMatch,
                isActive: category.isActive,
                sortOrder: category.sortOrder,
                productCount,
                conditions: req.user?.role === "admin" ? category.conditions : undefined,
                createdAt: category.createdAt,
                updatedAt: category.updatedAt,
            },
        });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const getCategoryWithProducts = async (req, res) => {
    try {
        const { identifier } = req.params;
        const { page = 1, limit = 20, sortBy = "createdAt", sortOrder = "desc" } = req.query;

        if (identifier === "admin" || identifier === "all" || identifier === "popular") {
            throw new ApiError(404, "Category not found");
        }

        const category = await Category.findOne(getCategoryQuery(identifier)).lean();
        if (!category) {
            throw new ApiError(404, "Category not found");
        }

        if (!category.isActive && req.user?.role !== "admin") {
            throw new ApiError(404, "Category not found");
        }

        const pageNum = Math.max(1, Number(page) || 1);
        const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));

        const allowedSortFields = ["createdAt", "updatedAt", "title", "price", "inventory"];
        if (!allowedSortFields.includes(sortBy)) {
            throw new ApiError(400, `Invalid sortBy field. Allowed: ${allowedSortFields.join(", ")}`);
        }

        const sortOrderValue = sortOrder === "asc" ? 1 : -1;

        let query = {};
        if (category.type === "manual") {
            query.categories = category._id;
        } else {
            // Simplified: just get all products for automatic categories
            query = {};
        }

        if (req.user?.role !== "admin") {
            query.isActive = true;
        }

        const sortFieldMap = { price: "variants.price", inventory: "inventory_quantity" };
        const actualSortField = sortFieldMap[sortBy] || sortBy;
        const actualSort = { [actualSortField]: sortOrderValue };

        const [products, total] = await Promise.all([
            Product.find(query)
                .select("title handle variants image images isActive inventory_quantity")
                .sort(actualSort)
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum)
                .lean(),
            Product.countDocuments(query),
        ]);

        const enrichedProducts = products.map((product) => {
            const activeVariants = product.variants?.filter((v) => v.isActive !== false) || [];
            const prices = activeVariants.map((v) => v.price).filter((p) => p !== undefined);

            return {
                ...product,
                minPrice: prices.length > 0 ? Math.min(...prices) : 0,
                maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
                totalInventory: activeVariants.reduce((sum, v) => sum + (v.inventory_quantity || 0), 0),
            };
        });

        res.status(200).json({
            success: true,
            data: {
                category: {
                    id: category._id,
                    name: category.name,
                    handle: category.handle,
                    description: category.description,
                    image: category.image,
                    type: category.type,
                },
                products: enrichedProducts,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum),
                    hasNextPage: pageNum * limitNum < total,
                    hasPreviousPage: pageNum > 1,
                },
            },
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
                                    $and: [{ $in: ["$$categoryId", "$categories"] }, { $eq: ["$isActive", true] }],
                                },
                            },
                        },
                        { $project: { variants: 1, inventory_quantity: 1 } },
                    ],
                    as: "products",
                },
            },
            {
                $addFields: {
                    productCount: { $size: "$products" },
                    totalInventory: {
                        $sum: {
                            $map: { input: "$products", as: "product", in: "$$product.inventory_quantity" },
                        },
                    },
                    minPrice: {
                        $min: {
                            $map: { input: "$products", as: "product", in: { $min: "$$product.variants.price" } },
                        },
                    },
                    maxPrice: {
                        $max: {
                            $map: { input: "$products", as: "product", in: { $max: "$$product.variants.price" } },
                        },
                    },
                    averagePrice: {
                        $avg: {
                            $map: { input: "$products", as: "product", in: { $min: "$$product.variants.price" } },
                        },
                    },
                },
            },
            {
                $project: {
                    name: 1,
                    handle: 1,
                    description: 1,
                    type: 1,
                    isActive: 1,
                    productCount: 1,
                    totalInventory: 1,
                    minPrice: { $ifNull: ["$minPrice", 0] },
                    maxPrice: { $ifNull: ["$maxPrice", 0] },
                    averagePrice: { $ifNull: ["$averagePrice", 0] },
                    createdAt: 1,
                    updatedAt: 1,
                },
            },
            { $sort: { productCount: -1 } },
        ]);

        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const getPopularCategories = async (req, res) => {
    try {
        const { limit = 5 } = req.query;
        const limitNum = Math.min(20, Math.max(1, Number(limit) || 5));

        const categories = await Category.find({ isActive: true }).lean();

        const categoriesWithCount = await Promise.all(
            categories.map(async (category) => {
                const productCount = await getProductCount(category);
                return {
                    id: category._id,
                    name: category.name,
                    handle: category.handle,
                    description: category.description,
                    image: category.image,
                    productCount,
                };
            })
        );

        categoriesWithCount.sort((a, b) => b.productCount - a.productCount);

        res.status(200).json({ success: true, data: categoriesWithCount.slice(0, limitNum) });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const createCategory = async (req, res) => {
    try {
        const {
            name,
            description,
            image,
            imagePublicId,
            type = "manual",
            conditionMatch = "all",
            conditions = [],
            isActive = true,
            sortOrder = 0,
        } = req.body;

        if (!name || !name.trim()) {
            throw new ApiError(400, "Category name is required");
        }

        await validateCategoryName(name.trim());

        let handle = req.body.handle ? generateHandle(String(req.body.handle)) : generateHandle(name);
        if (!handle) {
            throw new ApiError(400, "Could not derive a valid handle from the category name");
        }
        handle = await generateUniqueHandle(handle);

        const category = await Category.create({
            name: name.trim(),
            handle,
            description: description?.trim() || "",
            image: image || "",
            imagePublicId: imagePublicId || null,
            type,
            conditionMatch,
            conditions: conditions || [],
            isActive,
            sortOrder: Number(sortOrder) || 0,
        });

        res.status(201).json({ success: true, message: "Category created successfully", data: category });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const updateCategory = async (req, res) => {
    try {
        const { identifier } = req.params;
        const category = await Category.findOne(getCategoryQuery(identifier));
        if (!category) {
            throw new ApiError(404, "Category not found");
        }

        const { name, description, handle, image, imagePublicId, type, conditionMatch, conditions, isActive, sortOrder } =
            req.body;

        const updateData = {};

        if (name !== undefined) {
            if (!name.trim()) {
                throw new ApiError(400, "Category name cannot be empty");
            }
            await validateCategoryName(name.trim(), category._id);
            updateData.name = name.trim();
        }

        if (description !== undefined) {
            updateData.description = description?.trim() || "";
        }

        if (handle !== undefined) {
            const newHandle = generateHandle(String(handle));
            if (!newHandle) {
                throw new ApiError(400, "Invalid handle");
            }
            updateData.handle = await generateUniqueHandle(newHandle, category._id);
        }

        if (image !== undefined) {
            updateData.image = image;
            updateData.imagePublicId = imagePublicId || null;

            if (category.imagePublicId && category.imagePublicId !== imagePublicId) {
                await cleanupCategoryImage(category.imagePublicId, category._id);
            }
        }

        const newType = type || category.type;
        const newConditions = conditions !== undefined ? conditions : category.conditions;

        if (type !== undefined) {
            updateData.type = type;
        }

        if (conditionMatch !== undefined) {
            if (!["all", "any"].includes(conditionMatch)) {
                throw new ApiError(400, "conditionMatch must be 'all' or 'any'");
            }
            updateData.conditionMatch = conditionMatch;
        }

        if (conditions !== undefined) {
            updateData.conditions = conditions || [];
        }

        if (isActive !== undefined) {
            updateData.isActive = isActive;
        }

        if (sortOrder !== undefined) {
            if (!Number.isInteger(sortOrder)) {
                throw new ApiError(400, "sortOrder must be an integer");
            }
            updateData.sortOrder = sortOrder;
        }

        const updatedCategory = await Category.findByIdAndUpdate(
            category._id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        res.status(200).json({ success: true, message: "Category updated successfully", data: updatedCategory });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const deleteCategory = async (req, res) => {
    try {
        const { identifier } = req.params;
        const category = await Category.findOne(getCategoryQuery(identifier));
        if (!category) {
            throw new ApiError(404, "Category not found");
        }

        if (category.type === "manual") {
            const productCount = await Product.countDocuments({ categories: category._id });
            if (productCount > 0) {
                throw new ApiError(
                    400,
                    `Cannot delete category with ${productCount} products. Please reassign or delete the products first.`
                );
            }
        }

        if (category.imagePublicId) {
            await cleanupCategoryImage(category.imagePublicId, category._id);
        }

        await Category.findByIdAndDelete(category._id);

        res.status(200).json({ success: true, message: "Category deleted successfully" });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const addProductToCategory = async (req, res) => {
    try {
        const { categoryId, productId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            throw new ApiError(400, "Invalid category ID");
        }
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            throw new ApiError(400, "Invalid product ID");
        }

        const [category, product] = await Promise.all([Category.findById(categoryId), Product.findById(productId)]);

        if (!category) {
            throw new ApiError(404, "Category not found");
        }
        if (!product) {
            throw new ApiError(404, "Product not found");
        }

        if (category.type !== "manual") {
            throw new ApiError(400, "Cannot manually assign products to automatic categories");
        }

        if (product.categories?.includes(category._id)) {
            return res.status(200).json({
                success: true,
                message: "Product is already in this category",
                data: { categoryId: category._id, productId: product._id },
            });
        }

        product.categories = product.categories || [];
        product.categories.push(category._id);
        await product.save();

        res.status(200).json({
            success: true,
            message: "Product added to category successfully",
            data: { categoryId: category._id, productId: product._id },
        });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const removeProductFromCategory = async (req, res) => {
    try {
        const { categoryId, productId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            throw new ApiError(400, "Invalid category ID");
        }
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            throw new ApiError(400, "Invalid product ID");
        }

        const [category, product] = await Promise.all([Category.findById(categoryId), Product.findById(productId)]);

        if (!category) {
            throw new ApiError(404, "Category not found");
        }
        if (!product) {
            throw new ApiError(404, "Product not found");
        }

        if (!product.categories?.includes(category._id)) {
            return res.status(200).json({
                success: true,
                message: "Product is not in this category",
                data: { categoryId: category._id, productId: product._id },
            });
        }

        product.categories = product.categories.filter((id) => !id.equals(category._id));
        await product.save();

        res.status(200).json({
            success: true,
            message: "Product removed from category successfully",
            data: { categoryId: category._id, productId: product._id },
        });
    } catch (error) {
        handleError(error, req, res);
    }
};