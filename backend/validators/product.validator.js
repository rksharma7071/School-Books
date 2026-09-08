import { z } from "zod";

const booleanFromQuery = z.preprocess((value) => {
    if (value === undefined) return undefined;
    if (value === "true" || value === true) return true;
    if (value === "false" || value === false) return false;
    return value;
}, z.boolean().optional());

const createProductSchema = z.object({
    title: z.string(),
    description: z.string().optional(),

    options: z.array(
        z.object({
            name: z.string(),
            values: z.array(z.string())
        })
    ),

    variants: z.array(
        z.object({
            title: z.string().optional(),
            sku: z.string().optional(),
            price: z.number().nonnegative(),
            inventory_quantity: z.number().int().nonnegative(),

            options: z.record(z.string(), z.string())
        })
    ),

    isActive: z.boolean().optional()
});

const updateProductSchema = createProductSchema.partial().extend({
    removeImagePublicIds: z.array(z.string()).optional(),
    imagesOrder: z.string().optional(),
});

const listProductQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    search: z.string().trim().max(100).optional(),
    category: z.string().optional(),
    author: z.string().trim().max(100).optional(),
    subject: z.string().trim().max(100).optional(),
    language: z.string().trim().max(100).optional(),
    classLevel: z.string().trim().max(100).optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    isActive: booleanFromQuery,
    sortBy: z.enum(["createdAt", "updatedAt", "price", "name", "stockQty"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export { createProductSchema, updateProductSchema, listProductQuerySchema };



