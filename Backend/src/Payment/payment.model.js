const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    // ── References ─────────────────────────────────────────
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      index: true,
    },
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Farmer",
      default: null,
    },
    internalOrderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // ── Razorpay Identifiers ────────────────────────────────
    razorpayOrderId: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
    },
    razorpaySignature: {
      type: String,
      default: null,
    },

    // ── Payment Details ─────────────────────────────────────
    amount: {
      type: Number,
      required: true,
      min: 1, // in paise (INR × 100)
    },
    currency: {
      type: String,
      default: "INR",
      enum: ["INR"],
    },
    status: {
      type: String,
      enum: ["created", "authorized", "captured", "failed", "refunded"],
      default: "created",
      index: true,
    },
    paymentMode: {
      type: String,
      enum: ["cash", "online"],
      default: "online",
    },
    paymentChannel: {
      type: String,
      enum: ["razorpay", "upi", "google_pay", "phonepe", "bhim", "other", "cash"],
      default: "razorpay",
    },

    // ── Optional metadata ────────────────────────────────────
    description: {
      type: String,
      default: "",
      maxlength: 255,
    },
    billingStartDate: {
      type: String,
      default: "",
    },
    billingEndDate: {
      type: String,
      default: "",
    },
    notes: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // ── Verification ─────────────────────────────────────────
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual: amount in rupees
paymentSchema.virtual("amountInRupees").get(function () {
  return this.amount / 100;
});

const PaymentModel = mongoose.model("Payment", paymentSchema);

module.exports = { PaymentModel };
