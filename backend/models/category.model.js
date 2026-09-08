import mongoose from "mongoose";

const conditionSchema = new mongoose.Schema(
  {
    field: {
      type: String,
      required: true,
      enum: [
        "title", "description", "price", "comparePrice", "tags",
        "category", "brand", "inventory", "status", "author", "publisher", "isbn",
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
    name: { type: String, required: true, trim: true },
    handle: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    type: { type: String, enum: ["manual", "automatic"], default: "manual" },
    conditionMatch: { type: String, enum: ["all", "any"], default: "all" },
    conditions: { type: [conditionSchema], default: [] },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Category = mongoose.model("Category", categorySchema);

export { Category };