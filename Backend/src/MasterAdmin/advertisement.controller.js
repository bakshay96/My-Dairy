const { AdvertisementModel } = require("./advertisement.model");
const { AdminModel }         = require("../Admin/admin.model");
// IMPORTANT: import MasterAdminModel so Mongoose registers the "master" schema
// BEFORE .populate("createdBy") runs — without this import the populate
// throws "Schema hasn't been registered for model 'master'" → 500.
const { MasterAdminModel }   = require("./masterAdmin.model");
const { emitNewAdvertisement, emitAdDismissed } = require("../services/socketService");
const mongoose = require("mongoose");

// ── Helper: compute expiry from visibleFrom + hours ──────────────────────────
const computeExpiry = (visibleFrom, hours) => {
  const d = new Date(visibleFrom || Date.now());
  d.setTime(d.getTime() + (Number(hours) || 24) * 60 * 60 * 1000);
  return d;
};

// ── Helper: sanitize a URL (strip any HTML entity encoding) ──────────────────
const sanitizeUrl = (url = "") => {
  if (!url) return "";
  // Decode HTML entities that might arrive from body-parsers / copy-paste
  return url
    .replace(/&amp;/gi, "&")
    .replace(/&#x2F;/gi, "/")
    .replace(/&#47;/gi, "/")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#x27;/gi, "'")
    .trim();
};

// ── MASTER: Create advertisement ─────────────────────────────────────────────
exports.createAdvertisement = async (req, res) => {
  try {
    const {
      title, message, type = "info",
      targetAdmins = [],
      visibleDurationHours = 24,
      visibleFrom,
      priority = 0,
      ctaLabel = "", ctaUrl = "",
    } = req.body;

    if (!title || !message)
      return res.status(400).json({ success: false, message: "Title and message are required" });

    const from      = visibleFrom ? new Date(visibleFrom) : new Date();
    const expiresAt = computeExpiry(from, visibleDurationHours);
    const validTargets = targetAdmins.filter((id) => mongoose.Types.ObjectId.isValid(id));

    const ad = await AdvertisementModel.create({
      createdBy:    req.masterId,
      title:        title.trim(),
      message:      message.trim(),
      type,
      targetAdmins: validTargets,
      visibleFrom:  from,
      expiresAt,
      visibleDurationHours: Number(visibleDurationHours),
      priority:     Number(priority),
      ctaLabel:     ctaLabel.trim(),
      ctaUrl:       sanitizeUrl(ctaUrl),
      isActive:     true,
    });

    // Populate for the socket payload so frontend gets full data
    const populated = await AdvertisementModel.findById(ad._id)
      .populate("createdBy", "username email")
      .populate("targetAdmins", "name email shopName")
      .lean();

    // Push to admin clients in real-time — no page refresh needed
    emitNewAdvertisement(populated, "new");

    return res.status(201).json({
      success: true,
      message: `Advertisement sent. Target: ${validTargets.length > 0 ? validTargets.length + " admin(s)" : "All admins"}`,
      data: { advertisement: populated },
    });
  } catch (err) {
    console.error("[Ads] createAdvertisement:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── MASTER: Get all advertisements ───────────────────────────────────────────
exports.getAllAdvertisements = async (req, res) => {
  try {
    const ads = await AdvertisementModel.find()
      .populate("createdBy", "username email")
      .populate("targetAdmins", "name email shopName")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, data: { advertisements: ads } });
  } catch (err) {
    console.error("[Ads] getAllAdvertisements:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── MASTER: Update advertisement ──────────────────────────────────────────────
exports.updateAdvertisement = async (req, res) => {
  try {
    const { id } = req.params;
    const fields = ["title", "message", "type", "priority", "isActive", "ctaLabel", "targetAdmins"];
    const update = {};
    fields.forEach((f) => { if (req.body[f] !== undefined) update[f] = req.body[f]; });

    // Always sanitize ctaUrl if provided
    if (req.body.ctaUrl !== undefined) update.ctaUrl = sanitizeUrl(req.body.ctaUrl);

    // Recompute expiry if duration changed
    if (req.body.visibleDurationHours !== undefined) {
      update.visibleDurationHours = Number(req.body.visibleDurationHours);
      const existing = await AdvertisementModel.findById(id).lean();
      if (existing) update.expiresAt = computeExpiry(existing.visibleFrom, update.visibleDurationHours);
    }

    const ad = await AdvertisementModel.findByIdAndUpdate(id, { $set: update }, { new: true })
      .populate("createdBy", "username email")
      .populate("targetAdmins", "name email shopName")
      .lean();

    if (!ad) return res.status(404).json({ success: false, message: "Advertisement not found" });

    emitNewAdvertisement(ad, "updated");

    return res.status(200).json({ success: true, message: "Updated", data: { advertisement: ad } });
  } catch (err) {
    console.error("[Ads] updateAdvertisement:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── MASTER: Delete advertisement ──────────────────────────────────────────────
exports.deleteAdvertisement = async (req, res) => {
  try {
    const ad = await AdvertisementModel.findByIdAndDelete(req.params.id).lean();
    if (ad) emitNewAdvertisement(ad, "removed");
    return res.status(200).json({ success: true, message: "Advertisement deleted" });
  } catch (err) {
    console.error("[Ads] deleteAdvertisement:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── ADMIN: Get active ads for this admin ──────────────────────────────────────
exports.getMyAdvertisements = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const now     = new Date();

    const ads = await AdvertisementModel.find({
      isActive:    true,
      visibleFrom: { $lte: now },
      expiresAt:   { $gte: now },
      dismissedBy: { $ne: adminId },
      $or: [
        { targetAdmins: { $size: 0 } },
        { targetAdmins: adminId },
      ],
    })
      .sort({ priority: -1, createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, data: { advertisements: ads } });
  } catch (err) {
    console.error("[Ads] getMyAdvertisements:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── ADMIN: Dismiss an advertisement ──────────────────────────────────────────
exports.dismissAdvertisement = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const { id }  = req.params;

    await AdvertisementModel.findByIdAndUpdate(id, {
      $addToSet: { dismissedBy: adminId },
    });

    emitAdDismissed(adminId.toString(), id);

    return res.status(200).json({ success: true, message: "Alert dismissed" });
  } catch (err) {
    console.error("[Ads] dismissAdvertisement:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};


