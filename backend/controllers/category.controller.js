import mongoose from "mongoose";
import { Category } from "../models/category.model.js";
import { Product } from "../models/product.model.js";
import { File } from "../models/file.model.js";
import { ApiError, handleError } from "../utils/apiError.js";
import { generateHandle } from "../utils/generateHandle.js";
import cloudinary from "../config/cloudinary.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);
const getCategoryQuery = (identifier) => (isValidId(identifier) ? { _id: identifier } : { handle: identifier });

const SORT_WHITELIST = ["name", "sortOrder", "createdAt", "updatedAt", "productCount"];

const buildStringCondition = (field, operator, value) => {
    const stringValue = String(value).trim();
    switch (operator) {
        case "equals":
            return { [field]: stringValue };
        case "not_equals":
            return { [field]: { $ne: stringValue } };
        case "contains":
            return { [field]: { $regex: stringValue, $options: "i" } };
        case "not_contains":
            return { [field]: { $not: { $regex: stringValue, $options: "i" } } };
        case "starts_with":
            return { [field]: { $regex: `^${stringValue}`, $options: "i" } };
        case "ends_with":
            return { [field]: { $regex: `${stringValue}$`, $options: "i" } };
        case "in":
            return { [field]: { $in: Array.isArray(value) ? value : [stringValue] } };
        case "not_in":
            return { [field]: { $nin: Array.isArray(value) ? value : [stringValue] } };
        default:
            throw new ApiError(400, `Invalid operator "${operator}" for string field "${field}"`);
    }
};

const buildNumericCondition = (field, operator, value) => {
    const numericValue = Number(value);
    if (isNaN(numericValue)) {
        throw new ApiError(400, `Invalid numeric value for field "${field}"`);
    }

    switch (operator) {
        case "equals":
            return { [field]: numericValue };
        case "not_equals":
            return { [field]: { $ne: numericValue } };
        case "greater_than":
            return { [field]: { $gt: numericValue } };
        case "greater_than_or_equal":
            return { [field]: { $gte: numericValue } };
        case "less_than":
            return { [field]: { $lt: numericValue } };
        case "less_than_or_equal":
            return { [field]: { $lte: numericValue } };
        default:
            throw new ApiError(400, `Invalid operator "${operator}" for numeric field "${field}"`);
    }
};

const buildStatusCondition = (operator, value) => {
    const statusValue = value === "active" ? true : value === "inactive" ? false : value;
    switch (operator) {
        case "equals":
            return { isActive: statusValue };
        case "not_equals":
            return { isActive: { $ne: statusValue } };
        default:
            throw new ApiError(400, `Invalid operator "${operator}" for status field`);
    }
};

const buildCategoriesCondition = (operator, value) => {
    const categoryIds = Array.isArray(value) ? value : [value];
    switch (operator) {
        case "equals":
        case "in":
            return { categories: { $in: categoryIds } };
        case "not_equals":
        case "not_in":
            return { categories: { $nin: categoryIds } };
        default:
            throw new ApiError(400, `Invalid operator "${operator}" for categories field`);
    }
};

const buildConditionQuery = (conditions, conditionMatch = "all") => {
    if (!conditions || conditions.length === 0) {
        return null;
    }

    const queries = conditions
        .map((condition) => {
            const { field, operator, value } = condition;

            switch (field) {
                case "title":
                case "description":
                case "isbn":
                case "publisher":
                case "author":
                    return buildStringCondition(field, operator, value);
                case "price":
                    return buildNumericCondition("variants.price", operator, value);
                case "compareAtPrice":
                    return buildNumericCondition("variants.compareAtPrice", operator, value);
                case "inventory":
                    return buildNumericCondition("inventory_quantity", operator, value);
                case "status":
                    return buildStatusCondition(operator, value);
                case "categories":
                    return buildCategoriesCondition(operator, value);
                case "brand":
                case "tags":
                    return null;
                default:
                    return null;
            }
        })
        .filter(Boolean);

    if (queries.length === 0) {
        return null;
    }

    return conditionMatch === "any" ? { $or: queries } : { $and: queries };
};

const validateConditions = (conditions, type) => {
    if (type === "automatic" && (!conditions || conditions.length === 0)) {
        throw new ApiError(400, "Automatic categories require at least one condition");
    }

    if (!conditions || conditions.length === 0) {
        return [];
    }

    const validStringFields = ["title", "description", "isbn", "publisher", "author"];
    const validNumericFields = ["price", "compareAtPrice", "inventory"];
    const validStatusFields = ["status"];
    const validCategoriesFields = ["categories"];

    const stringOperators = ["equals", "not_equals", "contains", "not_contains", "starts_with", "ends_with", "in", "not_in"];
    const numericOperators = ["equals", "not_equals", "greater_than", "greater_than_or_equal", "less_than", "less_than_or_equal"];
    const statusOperators = ["equals", "not_equals"];
    const categoriesOperators = ["equals", "not_equals", "in", "not_in"];

    conditions.forEach((condition, index) => {
        const { field, operator, value } = condition;

        if (!field || !operator || value === undefined) {
            throw new ApiError(400, `Condition ${index + 1}: field, operator, and value are required`);
        }

        if (validStringFields.includes(field)) {
            if (!stringOperators.includes(operator)) {
                throw new ApiError(400, `Invalid operator "${operator}" for field "${field}"`);
            }
            if (typeof value !== "string" && !Array.isArray(value)) {
                throw new ApiError(400, `Field "${field}" requires a string value`);
            }
        } else if (validNumericFields.includes(field)) {
            if (!numericOperators.includes(operator)) {
                throw new ApiError(400, `Invalid operator "${operator}" for field "${field}"`);
            }
            if (isNaN(Number(value))) {
                throw new ApiError(400, `Field "${field}" requires a numeric value`);
            }
        } else if (validStatusFields.includes(field)) {
            if (!statusOperators.includes(operator)) {
                throw new ApiError(400, `Invalid operator "${operator}" for field "${field}"`);
            }
            if (!["active", "inactive", true, false].includes(value)) {
                throw new ApiError(400, `Field "${field}" requires "active" or "inactive"`);
            }
        } else if (validCategoriesFields.includes(field)) {
            if (!categoriesOperators.includes(operator)) {
                throw new ApiError(400, `Invalid operator "${operator}" for field "${field}"`);
            }
        } else {
            throw new ApiError(400, `Unsupported condition field: "${field}"`);
        }
    });

    return conditions;
};

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

    const conditionQuery = buildConditionQuery(category.conditions, category.conditionMatch);
    if (!conditionQuery) return 0;

    const query = { ...conditionQuery };
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
                { name: { $regex: search, $options: "i" } },
                { handle: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
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
            const conditionQuery = buildConditionQuery(category.conditions, category.conditionMatch);
            if (conditionQuery) {
                query = { ...conditionQuery };
            }
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

        const validatedConditions = validateConditions(conditions, type);

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
            conditions: validatedConditions,
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

        if (newType === "automatic" && newConditions.length === 0) {
            throw new ApiError(400, "Automatic categories require at least one condition");
        }

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
            updateData.conditions = validateConditions(conditions, newType);
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

        if (!isValidId(categoryId)) {
            throw new ApiError(400, "Invalid category ID");
        }
        if (!isValidId(productId)) {
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

        if (!isValidId(categoryId)) {
            throw new ApiError(400, "Invalid category ID");
        }
        if (!isValidId(productId)) {
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