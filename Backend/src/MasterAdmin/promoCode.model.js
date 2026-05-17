const mongoose = require("mongoose");

const promoPlanSchema = new mongoose.Schema(
  {
    // Global pricing set by master admin
    monthlyPrice:    { type: Number, default: 499 },
    quarterlyPrice:  { type: Number, default: 1299 },
    yearlyPrice:     { type: Number, default: 4499 },
    trialDays:       { type: Number, default: 10 },
    currency:        { type: String, default: "INR" },
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
