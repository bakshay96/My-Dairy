const mongoose = require("mongoose");

const storeProfileSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      unique: true,
      index: true,
    },
    storeName: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    tagline: {
      type: String,
      default: "Pure Farm Fresh Dairy, Cattle Feed & Daily Essentials",
    },
    description: {
      type: String,
      default: "",
    },
    bannerImage: {
      type: String,
      default: "",
    },
    logoImage: {
      type: String,
      default: "",
    },
    // Primary village where the dairy is physically established
    village: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    // Array of serviced neighbouring villages eligible for delivery
    serviceVillages: [
      {
        type: String,
        trim: true,
      },
    ],
    // GPS Geolocation of the dairy outlet
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      // [longitude, latitude]
      coordinates: {
        type: [Number],
        default: [77.2090, 28.6139],
      },
    },
    // Max delivery radius in kilometers from outlet coordinates
    deliveryRadiusKm: {
      type: Number,
      default: 8,
      min: 1,
      max: 50,
    },
    deliveryFee: {
      type: Number,
      default: 20,
      min: 0,
    },
    freeDeliveryThreshold: {
      type: Number,
      default: 500,
    },
    allowSelfPickup: {
      type: Boolean,
      default: true,
    },
    phone: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      default: "",
    },
    addressDetails: {
      landmark: String,
      pincode: String,
      district: String,
      state: String,
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
    operatingHours: {
      openTime: { type: String, default: "06:00 AM" },
      closeTime: { type: String, default: "09:00 PM" },
    },
    upiId: {
      type: String,
      default: "",
    },
    // SaaS feature toggle status controlled by Master Admin
    isStoreEnabled: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

storeProfileSchema.index({ location: "2dsphere" });

const StoreProfileModel = mongoose.models.StoreProfile || mongoose.model("StoreProfile", storeProfileSchema);

module.exports = StoreProfileModel;
