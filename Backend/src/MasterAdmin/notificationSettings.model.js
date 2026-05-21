const mongoose = require("mongoose");

const notificationSettingsSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      unique: true,
      index: true,
    },
    emailNotifications: {
      enabled: {
        type: Boolean,
        default: true,
      },
      pausedUntil: {
        type: Date,
        default: null,
      },
    },
    notificationTypes: {
      paymentAlert: {
        type: Boolean,
        default: true,
      },
      farmerUpdate: {
        type: Boolean,
        default: true,
      },
      subscriptionAlert: {
        type: Boolean,
        default: true,
      },
      ticketReply: {
        type: Boolean,
        default: true,
      },
      systemAlert: {
        type: Boolean,
        default: true,
      },
    },
  },
  { timestamps: true }
);

notificationSettingsSchema.index({ adminId: 1 });
notificationSettingsSchema.index({ "emailNotifications.pausedUntil": 1 });

const NotificationSettingsModel = mongoose.model(
  "NotificationSettings",
  notificationSettingsSchema
);

module.exports = { NotificationSettingsModel };
