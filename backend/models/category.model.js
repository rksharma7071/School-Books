import mongoose from "mongoose";


const conditionSchema = new mongoose.Schema(
  {
    field: {
      type: String,
      required: true,
      enum: [
        "title", "description", "price", "compareAtPrice", "tags",
        "categories", "brand", "inventory", "status", "author", "publisher", "isbn",
      ],
    },
    operator: {
      type: String,
      required: true,
      enum: [
        "equals", "not_equals", "contains", "not_contains", "starts_with", "ends_with",
        "greater_than", "greater_than_or_equal", "less_than", "less_than_or_equal", "in", "not_in",
      ],
    },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { _id: false }
);


const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      unique: true,
      set: (value) => value?.trim()
    },
    handle: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, default: "", maxlength: 500 },
    image: { type: String, default: "" },
    imagePublicId: { type: String, default: null },
    type: { type: String, enum: ["manual", "automatic"], default: "manual" },
    conditionMatch: { type: String, enum: ["all", "any"], default: "all" },
    conditions: { type: [conditionSchema], default: [] },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    isActive: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0, validate: { validator: Number.isInteger, message: "sortOrder must be an integer" } },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

categorySchema.index({ isActive: 1, sortOrder: 1, name: 1 });
categorySchema.index({ name: "text", handle: "text", description: "text" });

const Category = mongoose.model("Category", categorySchema);
export { Category };

