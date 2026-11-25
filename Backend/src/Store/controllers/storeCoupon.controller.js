const { StoreCouponModel } = require("../models");

/**
 * Admin: Get all coupons for logged-in dairy admin
 */
exports.getAdminCoupons = async (req, res) => {
  try {
    const adminId = req.admin._id || req.admin.id;
    const coupons = await StoreCouponModel.find({ adminId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      coupons,
    });
  } catch (error) {
    console.error("getAdminCoupons error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin: Create a new promotional / coupon code
 */
exports.createAdminCoupon = async (req, res) => {
  try {
    const adminId = req.admin._id || req.admin.id;
    const {
      code,
      title,
      description = "",
      badgeText = "SPECIAL OFFER",
      discountType = "fixed",
      discountValue,
      minOrderValue = 0,
      maxDiscountAmount = 0,
      validTill = null,
      usageLimit = 100,
    } = req.body;

    if (!code || discountValue === undefined) {
      return res.status(400).json({ success: false, message: "Coupon code and discount value are required." });
    }

    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");

    const existing = await StoreCouponModel.findOne({ adminId, code: cleanCode });
    if (existing) {
      return res.status(400).json({ success: false, message: `Coupon '${cleanCode}' already exists.` });
    }

    const coupon = await StoreCouponModel.create({
      adminId,
      code: cleanCode,
      title: title || cleanCode,
      description: description || "",
      badgeText: badgeText || "SPECIAL OFFER",
      discountType,
      discountValue: Number(discountValue),
      minOrderValue: Number(minOrderValue) || 0,
      maxDiscountAmount: Number(maxDiscountAmount) || 0,
      validTill: validTill ? new Date(validTill) : null,
      usageLimit: Number(usageLimit) || 100,
      isActive: true,
    });

    // Real-time socket broadcast
    try {
      const { StoreProfileModel } = require("../models");
      const profile = await StoreProfileModel.findOne({ adminId });
      const { emitStoreCouponsUpdated } = require("../../services/socketService");
      emitStoreCouponsUpdated(adminId, profile?.slug, { action: "created", coupon });
    } catch (e) {}

    res.status(201).json({
      success: true,
      message: `Coupon '${coupon.code}' created successfully!`,
      coupon,
    });
  } catch (error) {
    console.error("createAdminCoupon error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin: Update or toggle active status of coupon
 */
exports.updateAdminCoupon = async (req, res) => {
  try {
    const adminId = req.admin._id || req.admin.id;
    const { id } = req.params;

    const coupon = await StoreCouponModel.findOneAndUpdate(
      { _id: id, adminId },
      { $set: req.body },
      { new: true }
    );

    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found." });
    }

    // Real-time socket broadcast
    try {
      const { StoreProfileModel } = require("../models");
      const profile = await StoreProfileModel.findOne({ adminId });
      const { emitStoreCouponsUpdated } = require("../../services/socketService");
      emitStoreCouponsUpdated(adminId, profile?.slug, { action: "updated", coupon });
    } catch (e) {}

    res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      coupon,
    });
  } catch (error) {
    console.error("updateAdminCoupon error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin: Delete coupon
 */
exports.deleteAdminCoupon = async (req, res) => {
  try {
    const adminId = req.admin._id || req.admin.id;
    const { id } = req.params;

    const coupon = await StoreCouponModel.findOneAndDelete({ _id: id, adminId });
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found." });
    }

    // Real-time socket broadcast
    try {
      const { StoreProfileModel } = require("../models");
      const profile = await StoreProfileModel.findOne({ adminId });
      const { emitStoreCouponsUpdated } = require("../../services/socketService");
      emitStoreCouponsUpdated(adminId, profile?.slug, { action: "deleted", couponId: id });
    } catch (e) {}

    res.status(200).json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    console.error("deleteAdminCoupon error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Public & POS: Validate coupon code for checkout
 */
exports.validateCouponCode = async (req, res) => {
  try {
    const { code, cartAmount, outletSlug, adminId: directAdminId } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: "Coupon code is required" });
    }

    let adminId = directAdminId;
    if (!adminId && outletSlug) {
      const { StoreProfileModel } = require("../models");
      const profile = await StoreProfileModel.findOne({ slug: outletSlug.toLowerCase() });
      if (profile) adminId = profile.adminId;
    }

    // Default system coupon check (e.g. WELCOME50)
    if (code.toUpperCase() === "WELCOME50") {
      const disc = Math.min(50, Number(cartAmount) || 50);
      return res.status(200).json({
        success: true,
        coupon: {
          code: "WELCOME50",
          title: "Welcome Discount",
          discountType: "fixed",
          discountAmount: disc,
        },
      });
    }

    if (!adminId) {
      return res.status(400).json({ success: false, message: "Unable to identify store outlet for coupon" });
    }

    const coupon = await StoreCouponModel.findOne({
      adminId,
      code: code.trim().toUpperCase(),
      isActive: true,
    });

    if (!coupon) {
      return res.status(400).json({ success: false, message: "Invalid or expired promo code" });
    }

    if (coupon.validTill && new Date(coupon.validTill) < new Date()) {
      return res.status(400).json({ success: false, message: "This promo code has expired" });
    }

    if (coupon.usageLimit && coupon.timesUsed >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: "This promo code usage limit has been reached" });
    }

    const subtotal = Number(cartAmount) || 0;
    if (subtotal < coupon.minOrderValue) {
      return res.status(400).json({
        success: false,
        message: `Minimum cart value of ₹${coupon.minOrderValue} required for this code`,
      });
    }

    let discountAmount = 0;
    if (coupon.discountType === "percentage") {
      discountAmount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount > 0) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
      }
    } else {
      discountAmount = Math.min(coupon.discountValue, subtotal);
    }

    discountAmount = Math.round(discountAmount);

    res.status(200).json({
      success: true,
      coupon: {
        code: coupon.code,
        title: coupon.title,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount,
      },
      message: `Coupon '${coupon.code}' applied! You saved ₹${discountAmount}.`,
    });
  } catch (error) {
    console.error("validateCouponCode error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Public: List active promotions and coupons for an outlet storefront
 */
exports.getPublicCoupons = async (req, res) => {
  try {
    const { slug } = req.params;
    const { StoreProfileModel } = require("../models");
    let adminId = null;

    if (slug) {
      const profile = await StoreProfileModel.findOne({ slug: slug.toLowerCase() });
      if (profile) adminId = profile.adminId;
    }

    if (!adminId) {
      const defaultProfile = await StoreProfileModel.findOne();
      if (defaultProfile) adminId = defaultProfile.adminId;
    }

    if (!adminId) {
      return res.status(200).json({
        success: true,
        coupons: [
          {
            code: "WELCOME50",
            title: "Welcome Special - Flat ₹50 OFF",
            discountType: "fixed",
            discountValue: 50,
            minOrderValue: 200,
          },
        ],
      });
    }

    const now = new Date();
    const outletCoupons = await StoreCouponModel.find({
      adminId,
      isActive: true,
      $or: [{ validTill: null }, { validTill: { $gte: now } }],
    })
      .sort({ discountValue: -1 })
      .limit(8)
      .lean();

    // Always ensure a starter welcome offer if none defined
    if (outletCoupons.length === 0) {
      outletCoupons.push({
        _id: "welcome-default",
        code: "WELCOME50",
        title: "Welcome Special Offer",
        discountType: "fixed",
        discountValue: 50,
        minOrderValue: 200,
      });
    }

    res.status(200).json({
      success: true,
      coupons: outletCoupons,
    });
  } catch (error) {
    console.error("getPublicCoupons error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
