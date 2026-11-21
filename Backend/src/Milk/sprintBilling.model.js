const mongoose = require("mongoose");

const farmerSummarySchema = new mongoose.Schema(
  {
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Farmer",
      required: true,
    },
    farmerName: { type: String, default: "" },
    farmerMobile: { type: String, default: "" },
    farmerEmail: { type: String, default: "" },
    memberId: { type: String, default: "" },
    totalEntries: { type: Number, default: 0 },
    totalLiters: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    unpaidAmount: { type: Number, default: 0 },
    avgFat: { type: Number, default: 0 },
    avgSnf: { type: Number, default: 0 },
    hasCollection: { type: Boolean, default: false },
    emailStatus: {
      type: String,
      enum: ["pending", "sent", "failed", "no_email", "skipped"],
      default: "pending",
    },
    emailError: { type: String, default: "" },
  },
  { _id: false }
);

const sprintBillingSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      index: true,
    },
    sprintName: {
      type: String,
      required: true,
      trim: true,
    },
    cycleDays: {
      type: Number,
      required: true,
      default: 10,
    },
    startDate: {
      type: String, // "YYYY-MM-DD"
      required: true,
      index: true,
    },
    endDate: {
      type: String, // "YYYY-MM-DD"
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["processing", "completed", "failed"],
      default: "processing",
      index: true,
    },
    totalFarmers: {
      type: Number,
      default: 0,
    },
    activeFarmers: {
      type: Number,
      default: 0,
    },
    zeroCollectionFarmers: {
      type: Number,
      default: 0,
    },
    totalLiters: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    avgFat: {
      type: Number,
      default: 0,
    },
    avgSnf: {
      type: Number,
      default: 0,
    },
    emailsSent: {
      type: Number,
      default: 0,
    },
    emailsFailed: {
      type: Number,
      default: 0,
    },
    farmerSummaries: [farmerSummarySchema],
    processedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

sprintBillingSchema.index({ adminId: 1, startDate: 1, endDate: 1 });
sprintBillingSchema.index({ adminId: 1, createdAt: -1 });

const SprintBillingModel = mongoose.model("SprintBilling", sprintBillingSchema);

module.exports = {
  SprintBillingModel,
};
