const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      unique: true,
      index: true,
    },
    plan: {
      type: String,
      enum: ["trial", "monthly", "quarterly", "yearly"],
      default: "trial",
    },
    status: {
      type: String,
      enum: ["trial", "active", "expired", "cancelled", "pending"],
      default: "trial",
    },
    trialStartDate:  { type: Date, default: Date.now },
    trialEndDate:    { type: Date },
    startDate:       { type: Date },
    endDate:         { type: Date },

    // Pricing
    basePrice:       { type: Number, default: 0 },   // set by master admin
    discountAmount:  { type: Number, default: 0 },
    finalPrice:      { type: Number, default: 0 },
    promoCode:       { type: String, default: null },

    // Razorpay
    razorpayOrderId:   { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
    razorpaySignature: { type: String, default: null },
    paymentStatus:     {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },

    // History
    paymentHistory: [
      {
        paymentId:    String,
        orderId:      String,
        amount:       Number,
        plan:         String,
        paidAt:       { type: Date, default: Date.now },
        promoCode:    String,
        discountAmt:  Number,
      },
    ],

    // Master admin notes
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

// Virtual: days remaining
subscriptionSchema.virtual("daysRemaining").get(function () {
  const now = new Date();
  const end =
    this.status === "trial" ? this.trialEndDate : this.endDate;
  if (!end) return 0;
  const diff = end - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

// Virtual: isAccessible (trial or active and not expired)
subscriptionSchema.virtual("isAccessible").get(function () {
  const now = new Date();
  if (this.status === "trial" && this.trialEndDate && now <= this.trialEndDate) return true;
  if (this.status === "active" && this.endDate && now <= this.endDate) return true;
  return false;
});

subscriptionSchema.set("toJSON", { virtuals: true });
subscriptionSchema.set("toObject", { virtuals: true });

const SubscriptionModel = mongoose.model("Subscription", subscriptionSchema);
module.exports = { SubscriptionModel };
