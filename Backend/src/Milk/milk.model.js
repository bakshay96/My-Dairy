const mongoose = require("mongoose");

const milkSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Farmer",
      required: true,
    },
    mobile: {
      type: Number,
      default: 0,
    },
    shift: {
      type: String,
      required: [true, "Please Specify shift"],
      enum: ["morning", "evening"],
    },
    category: {
      type: String,
      enum: ["cow", "buffalo", "goat", "sheep"],
      default: "cow",
    },

    // ── Milk Quality Parameters ─────────────────────────────
    fat: {
      type: Number,
      required: [true, "FAT is required"],
      min: [1.0, "FAT must be at least 1.0"],
      max: [20.0, "FAT cannot exceed 20.0"],
    },
    snf: {
      type: Number,
      default: 0.0,
      min: [0.0, "SNF cannot be negative"],
      max: [15.0, "SNF cannot exceed 15.0"],
    },
    degree: {
      type: Number,
      default: 0.0,
      min: [0.0, "Degree cannot be negative"],
      max: [35.0, "Degree cannot exceed 35.0"],
    },
    water: {
      type: Number,
      default: 0.0,
    },
    litter: {
      type: Number,
      required: [true, "Quantity (litres) is required"],
      min: [0.1, "Minimum litter is 0.1"],
      max: [1000.0, "Maximum litter is 1000.0"],
    },

    // ── Rate & Amount ────────────────────────────────────────
    fatRate: {
      type: Number,
      required: true,
    },
    rate: {
      type: Number,
      required: true,
    },
    calculatedAmount: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid"],
      default: "unpaid",
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
    },

    // ── Date & Billing Cycle ─────────────────────────────────
    date: {
      type: String,
      required: [true, "Date is required"],
    },
    /**
     * billingCycleDate — normalized to the START of the 10-day period.
     * Periods: 1–10, 11–20, 21–end-of-month.
     * Stored as ISO date string (YYYY-MM-DD) for easy grouping.
     */
    billingCycleDate: {
      type: String, // e.g. "2024-04-01", "2024-04-11", "2024-04-21"
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────
milkSchema.index({ farmerId: 1, createdAt: -1 });
milkSchema.index({ adminId: 1, createdAt: -1 });
milkSchema.index({ adminId: 1, farmerId: 1 });
milkSchema.index({ adminId: 1, billingCycleDate: 1 });
milkSchema.index({ farmerId: 1, billingCycleDate: 1 });
milkSchema.index({ category: 1 });

const MilkModel = mongoose.model("Milk", milkSchema);

module.exports = { MilkModel };
