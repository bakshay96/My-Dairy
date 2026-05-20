const mongoose = require("mongoose");

const advertisementSchema = new mongoose.Schema(
  {
    // Who created it
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "master",   // matches: mongoose.model("master", schema) in masterAdmin.model.js
      required: true,
    },

    // Content
    title:   { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    ctaLabel: { type: String, trim: true, default: "" }, // optional button label
    ctaUrl:   { type: String, trim: true, default: "" }, // optional button URL

    // Visual type: info | success | warning | promo | update
    type: {
      type: String,
      enum: ["info", "success", "warning", "promo", "update"],
      default: "info",
    },

    // Targeting: empty array = broadcast to ALL admins
    targetAdmins: [{ type: mongoose.Schema.Types.ObjectId, ref: "Admin" }],

    // Visibility window
    visibleFrom:     { type: Date, default: Date.now },
    expiresAt:       { type: Date, required: true }, // auto-computed from visibleDurationHours
    visibleDurationHours: { type: Number, default: 24 }, // how long to show (hours)

    // Priority: higher = shown first
    priority: { type: Number, default: 0, min: 0, max: 10 },

    // Status
    isActive: { type: Boolean, default: true },

    // Track which admins have dismissed this alert
    dismissedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "Admin" }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: is this still visible?
advertisementSchema.virtual("isExpired").get(function () {
  return this.expiresAt < new Date();
});

// Index for fast admin-specific queries
advertisementSchema.index({ isActive: 1, expiresAt: 1 });
advertisementSchema.index({ targetAdmins: 1 });

const AdvertisementModel = mongoose.model("Advertisement", advertisementSchema);
module.exports = { AdvertisementModel };
