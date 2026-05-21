const { NotificationSettingsModel } = require("./notificationSettings.model");
const { AdminModel } = require("../Admin/admin.model");

// ────────────────────────────────────────────────────────────
// Get notification settings for all admins
// ────────────────────────────────────────────────────────────
const getAllNotificationSettings = async (req, res) => {
  try {
    const admins = await AdminModel.find({ role: "Admin" });
    const settings = await NotificationSettingsModel.find();
    
    const settingsMap = new Map();
    settings.forEach((s) => {
      if (s.adminId) {
        settingsMap.set(s.adminId.toString(), s);
      }
    });

    const enriched = [];

    for (const admin of admins) {
      let s = settingsMap.get(admin._id.toString());
      if (!s) {
        s = new NotificationSettingsModel({
          adminId: admin._id,
        });
        await s.save();
      }

      enriched.push({
        _id: s._id,
        adminId: admin._id,
        adminName: admin.name,
        adminEmail: admin.email || "milkify@gmail.com",
        shopName: admin.shopName,
        isEnabled: s.emailNotifications?.enabled ?? true,
        isPaused: !!(s.emailNotifications?.pausedUntil && s.emailNotifications.pausedUntil > new Date()),
        pausedUntil: s.emailNotifications?.pausedUntil || null,
        notificationTypes: s.notificationTypes || {
          paymentAlert: true,
          farmerUpdate: true,
          subscriptionAlert: true,
          ticketReply: true,
          systemAlert: true,
        },
      });
    }

    enriched.sort((a, b) => a.adminName.localeCompare(b.adminName));

    return res.status(200).json({ success: true, data: { settings: enriched } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────────────────────
// Update notification pause/resume for an admin
// ────────────────────────────────────────────────────────────
const updateNotificationStatus = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { enabled, pausedUntil } = req.body;

    let settings = await NotificationSettingsModel.findOne({ adminId });
    if (!settings) {
      settings = new NotificationSettingsModel({ adminId });
    }

    if (enabled !== undefined) {
      settings.emailNotifications.enabled = enabled;
    }

    if (pausedUntil) {
      settings.emailNotifications.pausedUntil = new Date(pausedUntil);
    } else if (enabled === true) {
      settings.emailNotifications.pausedUntil = null;
    }

    await settings.save();

    return res.status(200).json({
      success: true,
      message: "Notification settings updated",
      data: {
        adminId: settings.adminId,
        enabled: settings.emailNotifications.enabled,
        pausedUntil: settings.emailNotifications.pausedUntil,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────────────────────
// Update notification types for an admin
// ────────────────────────────────────────────────────────────
const updateNotificationTypes = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { notificationTypes } = req.body;

    if (!notificationTypes || typeof notificationTypes !== "object") {
      return res.status(400).json({
        success: false,
        message: "notificationTypes object required",
      });
    }

    let settings = await NotificationSettingsModel.findOne({ adminId });
    if (!settings) {
      settings = new NotificationSettingsModel({ adminId });
    }

    settings.notificationTypes = {
      paymentAlert: notificationTypes.paymentAlert ?? settings.notificationTypes.paymentAlert,
      farmerUpdate: notificationTypes.farmerUpdate ?? settings.notificationTypes.farmerUpdate,
      subscriptionAlert: notificationTypes.subscriptionAlert ?? settings.notificationTypes.subscriptionAlert,
      ticketReply: notificationTypes.ticketReply ?? settings.notificationTypes.ticketReply,
      systemAlert: notificationTypes.systemAlert ?? settings.notificationTypes.systemAlert,
    };

    await settings.save();

    return res.status(200).json({
      success: true,
      message: "Notification types updated",
      data: { notificationTypes: settings.notificationTypes },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────────────────────
// Resume notifications (clear pausedUntil)
// ────────────────────────────────────────────────────────────
const resumeNotifications = async (req, res) => {
  try {
    const { adminId } = req.params;

    const settings = await NotificationSettingsModel.findOne({ adminId });
    if (!settings) {
      return res.status(404).json({ success: false, message: "Settings not found" });
    }

    settings.emailNotifications.pausedUntil = null;
    settings.emailNotifications.enabled = true;
    await settings.save();

    return res.status(200).json({
      success: true,
      message: "Notifications resumed",
      data: { adminId, enabled: true, pausedUntil: null },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAllNotificationSettings,
  updateNotificationStatus,
  updateNotificationTypes,
  resumeNotifications,
};
