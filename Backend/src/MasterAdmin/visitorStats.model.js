const mongoose = require("mongoose");

const visitorStatsSchema = new mongoose.Schema(
  {
    ipAddress: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    userAgent: String,
    country: String,
    deviceType: {
      type: String,
      enum: ["mobile", "tablet", "desktop"],
      default: "desktop",
    },
    referrer: String,
    path: String,
    method: {
      type: String,
      enum: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      default: "GET",
    },
    statusCode: Number,
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

visitorStatsSchema.index({ ipAddress: 1, timestamp: -1 });
visitorStatsSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });
visitorStatsSchema.index({ createdAt: 1 });
visitorStatsSchema.index({ userId: 1, timestamp: -1 }, { sparse: true });

const VisitorStatsModel = mongoose.model("VisitorStats", visitorStatsSchema);

module.exports = { VisitorStatsModel };
