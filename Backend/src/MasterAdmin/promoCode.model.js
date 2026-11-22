const mongoose = require("mongoose");

const planItemSchema = new mongoose.Schema(
  {
    planId:       { type: String, required: true }, // unique plan key e.g. "monthly", "quarterly", "yearly", "half-yearly"
    name:         { type: String, required: true }, // e.g. "Monthly Plan", "6-Month Growth Plan"
    price:        { type: Number, required: true, min: 0 },
    durationDays: { type: Number, required: true, min: 1 }, // e.g. 30, 90, 180, 365
    billingCycle: { type: String, default: "monthly" }, // e.g. "monthly", "quarterly", "yearly", "custom"
    description:  { type: String, default: "" },
    badge:        { type: String, default: "" }, // e.g. "Most Popular", "Save 20%", "Best Value"
    features:     [{ type: String }],
    isActive:     { type: Boolean, default: true },
    sortOrder:    { type: Number, default: 0 },
  },
  { _id: true, timestamps: true }
);

const promoPlanSchema = new mongoose.Schema(
  {
    // Global pricing legacy fields (for backwards compatibility)
    monthlyPrice:    { type: Number, default: 499 },
    quarterlyPrice:  { type: Number, default: 1299 },
    yearlyPrice:     { type: Number, default: 4499 },
    trialDays:       { type: Number, default: 10 },
    currency:        { type: String, default: "INR" },
    plans:           [planItemSchema], // Multiple dynamic plans managed by Master Admin
    updatedBy:       { type: mongoose.Schema.Types.ObjectId, ref: "master" },
  },
  { timestamps: true }
);

const PlanConfigModel = mongoose.model("PlanConfig", promoPlanSchema);

// ──────────────────────────────────────────────────────
const promoCodeSchema = new mongoose.Schema(
  {
    code:           { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountType:   { type: String, enum: ["percentage", "flat"], default: "percentage" },
    discountValue:  { type: Number, required: true },           // e.g. 20 = 20% or ₹20
    maxUses:        { type: Number, default: null },            // null = unlimited
    usedCount:      { type: Number, default: 0 },
    validFrom:      { type: Date, default: Date.now },
    validUntil:     { type: Date, default: null },              // null = no expiry
    isActive:       { type: Boolean, default: true },
    applicablePlans:{ type: [String], default: ["monthly", "quarterly", "yearly"] },
    createdBy:      { type: mongoose.Schema.Types.ObjectId, ref: "master" },
    description:    { type: String, default: "" },
  },
  { timestamps: true }
);

const PromoCodeModel = mongoose.model("PromoCode", promoCodeSchema);

module.exports = { PlanConfigModel, PromoCodeModel };
