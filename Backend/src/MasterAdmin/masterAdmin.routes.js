const express = require("express");
const {
  masterLogin,
  masterMe,
  getAllAdmins,
  getAdminDetail,
  updateAdminStatus,
  extendSubscription,
  getPlanConfig,
  updatePlanConfig,
  createPromoCode,
  getAllPromoCodes,
  updatePromoCode,
  deletePromoCode,
  validatePromoCode,
  createSubscriptionOrder,
  verifySubscriptionPayment,
  getMySubscription,

  getMasterDashboardStats,
  updateMasterProfile,
  createMasterAdmin,
  getAllMasterAdmins,
  forgotPasswordMaster,
  deleteAdmin,
  bulkDeleteAdmins,
} = require("./masterAdmin.controller");

const {
  createAdvertisement,
  getAllAdvertisements,
  updateAdvertisement,
  deleteAdvertisement,
  getMyAdvertisements,
  dismissAdvertisement,
} = require("./advertisement.controller");

const masterAuthMiddleware = require("../middleware/masterAuthMiddleware");
const authMiddleware       = require("../middleware/authMiddleware");

const masterRouter = express.Router();

// ─── Public ───────────────────────────────────────────────
masterRouter.post("/login", masterLogin);
masterRouter.post("/forgot-password", forgotPasswordMaster);

// ─── Promo code validation (authenticated admin, not master) ──
masterRouter.post("/subscription/validate-promo", authMiddleware, validatePromoCode);

// ─── Subscription: create Razorpay order (admin user) ────────
masterRouter.post("/subscription/create-order",  authMiddleware, createSubscriptionOrder);
masterRouter.post("/subscription/verify-payment", authMiddleware, verifySubscriptionPayment);
masterRouter.get("/subscription/my",              authMiddleware, getMySubscription);

// ─── Profile & Credentials (Master Auth) ────────────────
masterRouter.get("/me",                    masterAuthMiddleware, masterMe);
masterRouter.put("/profile",               masterAuthMiddleware, updateMasterProfile);
masterRouter.post("/credentials",          masterAuthMiddleware, createMasterAdmin);
  masterRouter.get("/credentials/list",      masterAuthMiddleware, getAllMasterAdmins);
  masterRouter.get("/dashboard/stats",       masterAuthMiddleware, getMasterDashboardStats);

// ─── Admins Management (Master Auth) ────────────────────
masterRouter.get("/admins",                masterAuthMiddleware, getAllAdmins);
masterRouter.post("/admins/bulk-delete",   masterAuthMiddleware, bulkDeleteAdmins);
masterRouter.get("/admins/:adminId",       masterAuthMiddleware, getAdminDetail);
masterRouter.patch("/admins/:adminId/status", masterAuthMiddleware, updateAdminStatus);
masterRouter.delete("/admins/:adminId",    masterAuthMiddleware, deleteAdmin);
masterRouter.patch("/admins/:adminId/subscription/extend", masterAuthMiddleware, extendSubscription);

// Plan config
masterRouter.get("/plan-config",           masterAuthMiddleware, getPlanConfig);
masterRouter.put("/plan-config",           masterAuthMiddleware, updatePlanConfig);

// Promo codes
masterRouter.get("/promo-codes",           masterAuthMiddleware, getAllPromoCodes);
masterRouter.post("/promo-codes",          masterAuthMiddleware, createPromoCode);
masterRouter.patch("/promo-codes/:id",     masterAuthMiddleware, updatePromoCode);
masterRouter.delete("/promo-codes/:id",    masterAuthMiddleware, deletePromoCode);

// ── Advertisements (Master admin manages, admin users view) ──────────────────
// Master: full CRUD
masterRouter.get("/advertisements",           masterAuthMiddleware, getAllAdvertisements);
masterRouter.post("/advertisements",          masterAuthMiddleware, createAdvertisement);
masterRouter.patch("/advertisements/:id",     masterAuthMiddleware, updateAdvertisement);
masterRouter.delete("/advertisements/:id",    masterAuthMiddleware, deleteAdvertisement);

// Admin: fetch their active ads + dismiss
masterRouter.get("/advertisements/my",        authMiddleware, getMyAdvertisements);
masterRouter.patch("/advertisements/:id/dismiss", authMiddleware, dismissAdvertisement);

module.exports = { masterRouter };
