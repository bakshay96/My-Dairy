const mongoose = require("mongoose");

const storeCustomerSchema = new mongoose.Schema(
  {
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
    name: {
      type: String,
      required: true,
      trim: true,
    },
    mobile: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    password: {
      type: String,
      default: "",
    },
    village: {
      type: String,
      required: true,
      trim: true,
    },
    savedAddresses: [
      {
        label: { type: String, default: "Home" },
        recipientName: String,
        recipientPhone: String,
        village: String,
        landmark: String,
        fullAddress: String,
        pincode: String,
        coordinates: {
          latitude: Number,
          longitude: Number,
        },
        isDefault: { type: Boolean, default: false },
      },
    ],
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "StoreProduct",
      },
    ],
    loyaltyPoints: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "blocked"],
      default: "active",
    },
  },
  { timestamps: true }
);

storeCustomerSchema.index({ adminId: 1, mobile: 1 }, { unique: true });

const StoreCustomerModel = mongoose.models.StoreCustomer || mongoose.model("StoreCustomer", storeCustomerSchema);

module.exports = StoreCustomerModel;
