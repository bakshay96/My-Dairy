const mongoose = require("mongoose");

const storeCouponSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    title: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    badgeText: {
      type: String,
      default: "SPECIAL OFFER",
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      default: "fixed",
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    minOrderValue: {
      type: Number,
      default: 0,
    },
    maxDiscountAmount: {
      type: Number,
      default: 0,
    },
    validTill: {
      type: Date,
      default: null,
    },
    usageLimit: {
      type: Number,
      default: 100,
    },
    timesUsed: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

storeCouponSchema.index({ adminId: 1, code: 1 }, { unique: true });

const StoreCouponModel = mongoose.models.StoreCoupon || mongoose.model("StoreCoupon", storeCouponSchema);

module.exports = StoreCouponModel;
