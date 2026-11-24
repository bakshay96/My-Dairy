const mongoose = require("mongoose");

const storeProductSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    category: {
      type: String,
      enum: ["farming", "dairy", "kirana"],
      required: true,
      index: true,
    },
    subCategory: {
      type: String,
      default: "General",
      trim: true,
    },
    brand: {
      type: String,
      default: "",
      trim: true,
    },
    sku: {
      type: String,
      trim: true,
      default: "",
    },
    barcode: {
      type: String,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    highlights: [{ type: String }],
    images: [{ type: String }],
    unit: {
      type: String,
      enum: ["kg", "liter", "bag", "packet", "bottle", "piece", "gm", "box"],
      default: "piece",
    },
    packageSize: {
      type: String,
      default: "1 unit",
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    mrp: {
      type: Number,
      default: 0,
    },
    costPrice: {
      type: Number,
      default: 0,
    },
    stockQuantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    minStockAlert: {
      type: Number,
      default: 5,
    },
    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    rating: {
      type: Number,
      default: 4.8,
    },
    ratingCount: {
      type: Number,
      default: 12,
    },
  },
  { timestamps: true }
);

storeProductSchema.index({ adminId: 1, category: 1, isAvailable: 1 });
storeProductSchema.index({ adminId: 1, name: "text", brand: "text", description: "text" });

const StoreProductModel = mongoose.models.StoreProduct || mongoose.model("StoreProduct", storeProductSchema);

module.exports = StoreProductModel;
