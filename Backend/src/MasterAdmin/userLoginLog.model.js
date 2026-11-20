const mongoose = require("mongoose");

const userLoginLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      refPath: "userModel",
      index: true,
    },
    userModel: {
      type: String,
      enum: ["Admin", "MasterAdmin", "Farmer", "Other"],
      default: "Admin",
    },
    role: {
      type: String,
      enum: ["admin", "master_admin", "farmer", "unknown"],
      default: "admin",
      index: true,
    },
    name: {
      type: String,
      default: "Unknown User",
      index: true,
    },
    email: {
      type: String,
      default: "",
      index: true,
    },
    mobile: {
      type: String,
      default: "",
      index: true,
    },
    memberId: {
      type: String,
      default: "",
      index: true,
    },
    shopName: {
      type: String,
      default: "",
    },
    ipAddress: {
      type: String,
      default: "",
      index: true,
    },
    countryCode: {
      type: String,
      default: "IN",
    },
    country: {
      type: String,
      default: "India",
      index: true,
    },
    regionCode: {
      type: String,
      default: "",
    },
    state: {
      type: String,
      default: "Maharashtra",
      index: true,
    },
    city: {
      type: String,
      default: "Pune",
      index: true,
    },
    timezone: {
      type: String,
      default: "Asia/Kolkata",
    },
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    deviceType: {
      type: String,
      enum: ["desktop", "mobile", "tablet", "unknown"],
      default: "desktop",
      index: true,
    },
    os: {
      type: String,
      default: "Unknown",
    },
    browser: {
      type: String,
      default: "Unknown",
    },
    userAgent: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["success", "failed"],
      default: "success",
      index: true,
    },
    failureReason: {
      type: String,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

// Indexes for high performance querying & analytics
userLoginLogSchema.index({ timestamp: -1 });
userLoginLogSchema.index({ role: 1, timestamp: -1 });
userLoginLogSchema.index({ memberId: 1, timestamp: -1 });
userLoginLogSchema.index({ userId: 1, timestamp: -1 });
userLoginLogSchema.index({ ipAddress: 1, timestamp: -1 });

const UserLoginLogModel = mongoose.model("UserLoginLog", userLoginLogSchema);

module.exports = { UserLoginLogModel };
