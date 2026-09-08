import mongoose from "mongoose";

const CODE_RE = /^[A-Z0-9_-]{3,50}$/;

const discountSchema = new mongoose.Schema(
    {
        discount_code: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true,
            validate: {
                validator: (v) => CODE_RE.test(v),
                message: "discount_code must be 3-50 characters: uppercase letters, numbers, underscores, and hyphens only",
            },
        },
        discount_type: { type: String, required: true, enum: ["percentage", "fixed_amount"] },
        amount: {
            type: Number,
            required: true,
            min: [0.01, "amount must be greater than 0"],
            validate: {
                validator: function (v) {
                    if (this.discount_type === "percentage") return v <= 100;
                    return true;
                },
                message: "percentage amount cannot exceed 100",
            },
        },
        starts_at: { type: Date, default: Date.now },
        ends_at: { type: Date, default: null },
        minimum_order_amount: { type: Number, default: 0, min: 0 },
        maximum_discount_amount: { type: Number, default: null, min: 0 },
        usage_limit: {
            type: Number,
            default: null,
            min: 1,
            validate: { validator: (v) => v === null || Number.isInteger(v), message: "usage_limit must be an integer" },
        },
        usage_limit_per_user: {
            type: Number,
            default: null,
            min: 1,
            validate: { validator: (v) => v === null || Number.isInteger(v), message: "usage_limit_per_user must be an integer" },
        },
        used_count: { type: Number, default: 0, min: 0 },
        active: { type: Boolean, default: true },
    },
    { timestamps: true }
);

discountSchema.index({ active: 1, starts_at: 1, ends_at: 1 });
discountSchema.index({ active: 1, discount_type: 1 });
discountSchema.index({ createdAt: -1 });


const getDiscountStatus = (discount) => {
    if (!discount) return null;
    if (!discount.active) return "inactive";

    const now = new Date();
    if (discount.starts_at && now < new Date(discount.starts_at)) return "scheduled";
    if (discount.ends_at && now > new Date(discount.ends_at)) return "expired";
    if (discount.usage_limit != null && discount.used_count >= discount.usage_limit) return "exhausted";

    return "active";
};

const calculateDiscountAmount = (discount, subtotal) => {
    const safeSubtotal = Number(subtotal) || 0;
    if (safeSubtotal <= 0) return 0;

    let discountAmount =
        discount.discount_type === "fixed_amount" ? discount.amount : (safeSubtotal * discount.amount) / 100;

    if (discount.maximum_discount_amount != null) {
        discountAmount = Math.min(discountAmount, discount.maximum_discount_amount);
    }

    discountAmount = Math.min(discountAmount, safeSubtotal);
    return Math.round(discountAmount * 100) / 100;
};

const Discount = mongoose.model("Discount", discountSchema);

export { Discount, getDiscountStatus, calculateDiscountAmount };