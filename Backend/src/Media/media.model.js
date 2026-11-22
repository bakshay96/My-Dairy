const mongoose = require("mongoose");

const mediaSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    ownerModel: {
      type: String,
      required: true,
      enum: ["Admin", "MasterAdmin"],
      default: "Admin",
      index: true,
    },
    url: {
      type: String,
      required: true,
    },
    key: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      default: "",
    },
    fileSize: {
      type: Number,
      default: 0, // in bytes
    },
    mimeType: {
      type: String,
      default: "image/jpeg",
    },
    category: {
      type: String,
      enum: ["general", "receipts", "banners", "farmers", "documents"],
      default: "general",
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

mediaSchema.index({ ownerId: 1, createdAt: -1 });
mediaSchema.index({ ownerModel: 1, createdAt: -1 });
mediaSchema.index({ category: 1, createdAt: -1 });

const MediaModel = mongoose.model("Media", mediaSchema);

module.exports = { MediaModel };
