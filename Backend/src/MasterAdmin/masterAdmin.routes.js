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
} = require("./masterAdmin.controller");

const masterAuthMiddleware = require("../middleware/masterAuthMiddleware");
const authMiddleware       = require("../middleware/authMiddleware");

const masterRouter = express.Router();

// ─── Public ───────────────────────────────────────────────
masterRouter.post("/login", masterLogin);

// ─── Promo code validation (authenticated admin, not master) ──
masterRouter.post("/subscription/validate-promo", authMiddleware, validatePromoCode);

// ─── Subscription: create Razorpay order (admin user) ────────
masterRouter.post("/subscription/create-order",  authMiddleware, createSubscriptionOrder);
masterRouter.post("/subscription/verify-payment", authMiddleware, verifySubscriptionPayment);
masterRouter.get("/subscription/my",              authMiddleware, getMySubscription);

// ─── Protected – Master only ──────────────────────────────────
masterRouter.get("/me",                    masterAuthMiddleware, masterMe);
masterRouter.get("/dashboard/stats",       masterAuthMiddleware, getMasterDashboardStats);

// Admins
masterRouter.get("/admins",                masterAuthMiddleware, getAllAdmins);
masterRouter.get("/admins/:adminId",       masterAuthMiddleware, getAdminDetail);
masterRouter.patch("/admins/:adminId/status", masterAuthMiddleware, updateAdminStatus);
masterRouter.patch("/admins/:adminId/subscription/extend", masterAuthMiddleware, extendSubscription);

// Plan config
masterRouter.get("/plan-config",           masterAuthMiddleware, getPlanConfig);
masterRouter.put("/plan-config",           masterAuthMiddleware, updatePlanConfig);

// Promo codes
masterRouter.get("/promo-codes",           masterAuthMiddleware, getAllPromoCodes);
masterRouter.post("/promo-codes",          masterAuthMiddleware, createPromoCode);
masterRouter.patch("/promo-codes/:id",     masterAuthMiddleware, updatePromoCode);
masterRouter.delete("/promo-codes/:id",    masterAuthMiddleware, deletePromoCode);

module.exports = { masterRouter };
