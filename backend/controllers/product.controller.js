import mongoose from "mongoose";
import slugify from "slugify";

import { Product } from "../models/product.model.js";
import { Review } from "../models/review.model.js";
import { File } from "../models/file.model.js";
import { ApiError, handleError } from "../utils/apiError.js";


const buildHandle = (value) => slugify(String(value), { lower: true, strict: true, trim: true });

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const productQuery = (id) => isObjectId(id) ? { _id: id } : { handle: id };

const plainObject = (value) => value instanceof Map ? Object.fromEntries(value) : value || {};

const getInventory = (variants = []) => variants.reduce((total, variant) => total + (Number(variant.inventory_quantity) || 0), 0);

const validateVariants = (options = [], variants = []) => {
    if (!variants.length) {
        throw new ApiError(400, "At least one variant is required");
    }

    const optionValues = new Map(
        options.map((option) => [
            option.name.toLowerCase(),
            option.values.map(String),
        ])
    );

    const skus = new Set();

    variants.forEach((variant, index) => {
        const variantNumber = index + 1;

        /* Price */
        if (Number(variant.price) < 0 || Number.isNaN(Number(variant.price))) {
            throw new ApiError(400, `Variant ${variantNumber} requires a valid, non-negative price`);
        }

        /* SKU */
        if (variant.sku) {
            const sku = variant.sku.trim().toLowerCase();

            if (skus.has(sku)) {
                throw new ApiError(400, "Variant SKUs must be unique within a product");
            }

            skus.add(sku);
        }

        /* Options */
        const variantOptions = plainObject(variant.options);

        for (const [optionName, values] of optionValues) {
            const key = Object.keys(variantOptions).find((key) => key.toLowerCase() === optionName);

            if (!key || !values.includes(String(variantOptions[key]))) {
                throw new ApiError(400, `Variant ${variantNumber} needs a valid value for option "${optionName}"`);
            }
        }
    });
};

const syncFiles = async (product) => {
    const files = [
        product.image,
        ...(product.images || []),
        ...(product.variants || []).flatMap((variant) => variant.images || []),
    ].filter((file) => file?.url && file?.publicId);

    await Promise.all(
        files.map((file) =>
            File.updateOne(
                { publicId: file.publicId },
                { $set: file },
                { upsert: true }
            )
        )
    );
};

const formatReview = (review) => {
    const user = review.userId;

    return {
        id: review._id,
        rating: review.rating,
        title: review.title,
        body: review.body,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,

        user: user
            ? {
                id: user._id,
                username: user.username,
                firstName: user.first_name,
                lastName: user.last_name,
                fullName: [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username,
            }
            : null,
    };
};

export const getAllProducts = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            minPrice,
            maxPrice,
            isActive = true,
            sortBy = "createdAt",
            sortOrder = "desc",
            includeTotal,
        } = req.query;

        const pageNum = Number(page);
        const limitNum = Number(limit);

        const match = {
            isActive: isActive !== "false",
        };

        if (search) {
            match.$text = { $search: search };
        }

        const pipeline = [
            { $match: match },

            {
                $addFields: {
                    minPrice: { $min: "$variants.price" },

                    totalInventory: {
                        $cond: [
                            {
                                $gt: [
                                    { $size: { $ifNull: ["$variants", []], }, }, 0,
                                ],
                            },
                            {
                                $sum: "$variants.inventory_quantity",
                            },
                            "$inventory_quantity",
                        ],
                    },
                },
            },
        ];

        /* Price filter */
        if (minPrice !== undefined || maxPrice !== undefined) {
            const priceFilter = {};

            if (minPrice !== undefined) {
                priceFilter.$gte = Number(minPrice);
            }

            if (maxPrice !== undefined) {
                priceFilter.$lte = Number(maxPrice);
            }

            pipeline.push({
                $match: {
                    minPrice: priceFilter,
                },
            });
        }

        /* Sorting */
        const sortFields = {
            price: "minPrice",
            inventory: "totalInventory",
        };

        const field = sortFields[sortBy] || sortBy;
        const order = sortOrder === "asc" ? 1 : -1;

        pipeline.push({
            $sort: {
                [field]: order,
            },
        });

        /* Total */
        let total = null;

        if (includeTotal === "true") {
            const result = await Product.aggregate([
                ...pipeline,
                { $count: "total" },
            ]);

            total = result[0]?.total || 0;
        }

        /* Pagination */
        pipeline.push(
            { $skip: (pageNum - 1) * limitNum },
            { $limit: limitNum }
        );

        const products = await Product.aggregate(pipeline);

        return res.status(200).json({
            success: true,
            data: products,

            pagination: {
                page: pageNum,
                limit: limitNum,
                hasNextPage: products.length === limitNum,
                hasPreviousPage: pageNum > 1,

                ...(total !== null && {
                    total,
                    totalPages: Math.ceil(total / limitNum),
                }),
            },
        });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const getProductByHandle = async (req, res) => {
    try {
        const { handle } = req.params;

        if (!handle) {
            throw new ApiError(400, "Handle is required");
        }

        const product = await Product.findOne({ handle, isActive: true }).lean();

        if (!product) {
            throw new ApiError(404, "Product not found");
        }

        const [reviews, stats] = await Promise.all([
            Review.find({
                productId: product._id,
                approved: true,
            })
                .populate("userId", "first_name last_name username")
                .sort({ createdAt: -1 })
                .limit(10)
                .lean(),

            Review.aggregate([
                {
                    $match: {
                        productId: product._id,
                        approved: true,
                    },
                },
                {
                    $group: {
                        _id: null,
                        averageRating: { $avg: "$rating" },
                        totalReviews: { $sum: 1 },
                        ratings: { $push: "$rating" },
                    },
                },
            ]),
        ]);

        const statsData = stats[0];

        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

        statsData?.ratings.forEach((rating) => { distribution[rating]++; });

        return res.status(200).json({
            success: true,

            data: {
                ...product,

                reviews: {
                    summary: {
                        averageRating: statsData ? Number(statsData.averageRating.toFixed(1)) : 0,
                        totalReviews: statsData?.totalReviews || 0,
                        distribution,
                    },

                    recent: reviews.map(formatReview),
                },
            },
        });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const getProductById = async (req, res) => {
    try {
        const product = await Product.findOne(productQuery(req.params.id)).lean();

        if (!product) {
            throw new ApiError(404, "Product not found");
        }

        return res.status(200).json({ success: true, data: product });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const getAdminProductById = getProductById;

export const getProductBySlug = async (req, res) => {
    try {
        const { handle } = req.params;

        if (!handle) {
            throw new ApiError(400, "Handle is required");
        }

        const product = await Product.findOne({
            handle: handle,
            isActive: true,
        }).lean();

        if (!product) {
            throw new ApiError(404, "Product not found");
        }

        const [reviews, stats] = await Promise.all([
            Review.find({
                productId: product._id,
                approved: true,
            })
                .populate("userId", "first_name last_name username")
                .sort({ createdAt: -1 })
                .limit(10)
                .lean(),

            Review.aggregate([
                {
                    $match: {
                        productId: product._id,
                        approved: true,
                    },
                },
                {
                    $group: {
                        _id: null,
                        averageRating: { $avg: "$rating" },
                        totalReviews: { $sum: 1 },
                        ratings: { $push: "$rating" },
                    },
                },
            ]),
        ]);

        const reviewStats = stats[0];

        const distribution = {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0,
        };

        reviewStats?.ratings.forEach((rating) => {
            distribution[rating]++;
        });

        return res.status(200).json({
            success: true,
            data: {
                ...product,

                reviews: {
                    summary: {
                        averageRating: reviewStats
                            ? Number(reviewStats.averageRating.toFixed(1))
                            : 0,

                        totalReviews: reviewStats?.totalReviews || 0,

                        distribution,
                    },

                    recent: reviews.map(formatReview),
                },
            },
        });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const createProduct = async (req, res) => {
    try {
        const data = { ...req.body };

        if (!data.title) {
            throw new ApiError(400, "Title is required");
        }

        validateVariants(data.options, data.variants);

        data.inventory_quantity = getInventory(data.variants);

        data.handle = buildHandle(data.handle || data.title);

        const exists = await Product.exists({ handle: data.handle });

        if (exists) {
            throw new ApiError(400, "A product with this handle already exists");
        }

        const product = await Product.create(data);
        await syncFiles(product);

        return res.status(201).json({ success: true, message: "Product created successfully", data: product });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const query = productQuery(id);

        const existingProduct = await Product.findOne(query).lean();

        if (!existingProduct) {
            throw new ApiError(404, "Product not found");
        }

        const updateData = { ...req.body };

        delete updateData._id;
        delete updateData.createdAt;
        delete updateData.updatedAt;

        /* Variants */
        if (
            updateData.variants !== undefined ||
            updateData.options !== undefined
        ) {
            const options = updateData.options ?? existingProduct.options;
            const variants = updateData.variants ?? existingProduct.variants;
            validateVariants(options, variants);
            updateData.inventory_quantity = getInventory(variants);
        }

        /* Handle */
        if (updateData.handle !== undefined) {
            updateData.handle = buildHandle(updateData.handle);
        }

        if (
            updateData.handle &&
            updateData.handle !== existingProduct.handle
        ) {
            const exists = await Product.exists({ handle: updateData.handle, _id: { $ne: existingProduct._id } });

            if (exists) {
                throw new ApiError(400, "A product with this handle already exists");
            }
        }

        const product = await Product.findOneAndUpdate(
            query,
            { $set: updateData },
            { new: true, runValidators: true }
        ).lean();

        await syncFiles(product);

        return res.status(200).json({ success: true, message: "Product updated successfully", data: product });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const deletedProduct = await Product.findOneAndDelete(productQuery(req.params.id))
            .select("_id")
            .lean();

        if (!deletedProduct) {
            throw new ApiError(404, "Product not found");
        }

        return res.status(200).json({ success: true, message: "Product deleted successfully" });
    } catch (error) {
        handleError(error, req, res);
    }
};