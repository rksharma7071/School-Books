import mongoose from "mongoose";

const discountSchema = new mongoose.Schema(
    {
        discount_code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
            index: true,
        },

        discount_type: {
            type: String,
            required: true,
            enum: ["percentage", "fixed_amount"],
        },

        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        starts_at: { type: Date, default: Date.now },
        ends_at: { type: Date },
        usage_limit: { type: Number, default: null },
        used_count: { type: Number, default: 0 },
        active: { type: Boolean, default: true },
    },
    { timestamps: true }
);

const Discount = mongoose.model("Discount", discountSchema);

export { Discount };
