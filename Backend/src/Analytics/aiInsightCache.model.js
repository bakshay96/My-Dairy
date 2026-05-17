const mongoose = require("mongoose");

const aiInsightCacheSchema = new mongoose.Schema(
  {
    // Compound key: adminId + farmerId + weekKey
    cacheKey: { type: String, required: true, unique: true, index: true },
    adminId:  { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
    farmerId: { type: mongoose.Schema.Types.ObjectId, ref: "Farmer", default: null },
    weekKey:  { type: String, required: true }, // e.g. "2026-W20"
    dataHash: { type: String, required: true }, // MD5 of historical data — used to detect new entries
    insight:               { type: String, required: true },
    predictedYieldNext7Days: { type: Number, required: true },
    predictedAvgFat:       { type: Number, required: true },
  },
  { timestamps: true }
);

// Auto-delete after 7 days (MongoDB TTL index)
aiInsightCacheSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 });

module.exports = { AiInsightCacheModel: mongoose.model("AiInsightCache", aiInsightCacheSchema) };
