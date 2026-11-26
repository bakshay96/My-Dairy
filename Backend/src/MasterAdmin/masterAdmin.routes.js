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
  createCustomPlan,
  updateCustomPlan,
  deleteCustomPlan,
  toggleCustomPlan,
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
  getVisitorStats,
  getVisitorSummary,
  updateAdminCredentials,
  updateMasterAdminCredentials,
  getAllFarmersForMaster,
  getFarmerDetailForMaster,
  getFarmersByAdminForMaster,
  updateFarmerCredentialsForMaster,
  updateFarmerStatusForMaster,
  deleteFarmerForMaster,
  uploadFarmerPhotoForMaster,
  deleteFarmerPhotoForMaster,
  getDatabaseSchemaStats,
  getUserLoginHistory,
  getCountryUserLogins,
  getPublicPlatformStats,
  getPublicPricingPlans,
} = require("./masterAdmin.controller");

const {
  createAdvertisement,
  getAllAdvertisements,
  updateAdvertisement,
  deleteAdvertisement,
  getMyAdvertisements,
  dismissAdvertisement,
} = require("./advertisement.controller");

const {
  getAllNotificationSettings,
  updateNotificationStatus,
  updateNotificationTypes,
  resumeNotifications,
} = require("./notificationSettings.controller");

const masterAuthMiddleware = require("../middleware/masterAuthMiddleware");
const { upload } = require("../middleware/upload.middleware");
const authMiddleware = require("../middleware/authMiddleware");

const masterRouter = express.Router();

// ─── Public (no auth) ──────────────────────────────────────────────────────
masterRouter.get("/public/platform-stats", getPublicPlatformStats);
masterRouter.get("/public/pricing-plans", getPublicPricingPlans);
masterRouter.post("/login", masterLogin);
masterRouter.post("/forgot-password", forgotPasswordMaster);

// ─── Promo code validation (authenticated admin, not master) ──
masterRouter.post("/subscription/validate-promo", authMiddleware, validatePromoCode);

// ─── Subscription: create Razorpay order (admin user) ────────
masterRouter.post("/subscription/create-order", authMiddleware, createSubscriptionOrder);
masterRouter.post("/subscription/verify-payment", authMiddleware, verifySubscriptionPayment);
masterRouter.get("/subscription/my", authMiddleware, getMySubscription);

// ─── Profile & Credentials (Master Auth) ────────────────
masterRouter.get("/me", masterAuthMiddleware, masterMe);
masterRouter.put("/profile", masterAuthMiddleware, updateMasterProfile);
masterRouter.post("/credentials", masterAuthMiddleware, createMasterAdmin);
masterRouter.get("/credentials/list", masterAuthMiddleware, getAllMasterAdmins);
masterRouter.patch("/credentials/:id", masterAuthMiddleware, updateMasterAdminCredentials);
masterRouter.get("/dashboard/stats", masterAuthMiddleware, getMasterDashboardStats);
masterRouter.get("/database/schema-stats", masterAuthMiddleware, getDatabaseSchemaStats);

// ─── Admins Management (Master Auth) ────────────────────
masterRouter.get("/admins", masterAuthMiddleware, getAllAdmins);
masterRouter.post("/admins/bulk-delete", masterAuthMiddleware, bulkDeleteAdmins);
masterRouter.get("/admins/:adminId", masterAuthMiddleware, getAdminDetail);
masterRouter.get("/admins/:adminId/farmers", masterAuthMiddleware, getFarmersByAdminForMaster);
masterRouter.patch("/admins/:adminId/status", masterAuthMiddleware, updateAdminStatus);
masterRouter.patch("/admins/:adminId/credentials", masterAuthMiddleware, updateAdminCredentials);
masterRouter.put("/admins/:adminId/credentials", masterAuthMiddleware, updateAdminCredentials);
masterRouter.delete("/admins/:adminId", masterAuthMiddleware, deleteAdmin);
masterRouter.patch("/admins/:adminId/subscription/extend", masterAuthMiddleware, extendSubscription);

// ─── Farmers Management (Master Auth) ───────────────────
masterRouter.get("/farmers", masterAuthMiddleware, getAllFarmersForMaster);
masterRouter.get("/farmers/:farmerId", masterAuthMiddleware, getFarmerDetailForMaster);
masterRouter.patch("/farmers/:farmerId/credentials", masterAuthMiddleware, updateFarmerCredentialsForMaster);
masterRouter.patch("/farmers/:farmerId/status", masterAuthMiddleware, updateFarmerStatusForMaster);
masterRouter.put("/farmers/:farmerId/credentials", masterAuthMiddleware, updateFarmerCredentialsForMaster);
masterRouter.delete("/farmers/:farmerId", masterAuthMiddleware, deleteFarmerForMaster);
masterRouter.post("/farmers/:farmerId/photo", masterAuthMiddleware, upload.single("photo"), uploadFarmerPhotoForMaster);
masterRouter.delete("/farmers/:farmerId/photo", masterAuthMiddleware, deleteFarmerPhotoForMaster);

// Plan config & dynamic multi-plans
masterRouter.get("/plan-config", masterAuthMiddleware, getPlanConfig);
masterRouter.put("/plan-config", masterAuthMiddleware, updatePlanConfig);
masterRouter.post("/plans", masterAuthMiddleware, createCustomPlan);
masterRouter.put("/plans/:planId", masterAuthMiddleware, updateCustomPlan);
masterRouter.delete("/plans/:planId", masterAuthMiddleware, deleteCustomPlan);
masterRouter.patch("/plans/:planId/toggle", masterAuthMiddleware, toggleCustomPlan);

// Promo codes
masterRouter.get("/promo-codes", masterAuthMiddleware, getAllPromoCodes);
masterRouter.post("/promo-codes", masterAuthMiddleware, createPromoCode);
masterRouter.patch("/promo-codes/:id", masterAuthMiddleware, updatePromoCode);
masterRouter.delete("/promo-codes/:id", masterAuthMiddleware, deletePromoCode);

// ── Advertisements (Master admin manages, admin users view) ──────────────────
// Master: full CRUD
masterRouter.get("/advertisements", masterAuthMiddleware, getAllAdvertisements);
masterRouter.post("/advertisements", masterAuthMiddleware, createAdvertisement);
masterRouter.patch("/advertisements/:id", masterAuthMiddleware, updateAdvertisement);
masterRouter.delete("/advertisements/:id", masterAuthMiddleware, deleteAdvertisement);

// Admin: fetch their active ads + dismiss
masterRouter.get("/advertisements/my", authMiddleware, getMyAdvertisements);
masterRouter.patch("/advertisements/:id/dismiss", authMiddleware, dismissAdvertisement);

// ── Visitor Stats (Master admin only) ──────────────────
masterRouter.get("/visitor-stats", masterAuthMiddleware, getVisitorStats);
masterRouter.get("/visitor-stats/summary", masterAuthMiddleware, getVisitorSummary);
masterRouter.get("/visitor-stats/user-logins", masterAuthMiddleware, getUserLoginHistory);
masterRouter.get("/visitor-stats/country-logins", masterAuthMiddleware, getCountryUserLogins);

// ── Notification Settings (Master admin only) ──────────────────
masterRouter.get("/notification-settings", masterAuthMiddleware, getAllNotificationSettings);
masterRouter.patch("/notification-settings/:adminId", masterAuthMiddleware, updateNotificationStatus);
masterRouter.patch("/notification-settings/:adminId/types", masterAuthMiddleware, updateNotificationTypes);
masterRouter.patch("/notification-settings/:adminId/resume", masterAuthMiddleware, resumeNotifications);

module.exports = { masterRouter };
