const express = require("express");
const storeRouter = express.Router();

const {
  // Outlet Profile
  getMyStoreProfile,
  updateMyStoreProfile,
  getPublicStoreBySlug,
  validateDeliveryEligibility,

  // Products
  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  getPublicProducts,

  // Orders & POS Counter
  placeCustomerOnlineOrder,
  verifyOnlineOrderPayment,
  createPosCounterSale,
  getAdminOrders,
  updateOrderStatus,
  trackPublicOrder,

  // Master Admin
  getMasterStoreNetworkStats,
  toggleMasterOutletStatus,
} = require("../controllers");

const authMiddleware = require("../../middleware/authMiddleware");
const subscriptionGuard = require("../../middleware/subscriptionGuard");
const masterAuthMiddleware = require("../../middleware/masterAuthMiddleware");

// ─── PUBLIC STOREFRONT ENDPOINTS (For End Customers) ─────────────────────────
storeRouter.get("/public/outlet/:slug", getPublicStoreBySlug);
storeRouter.get("/public/outlet/:slug/products", getPublicProducts);
storeRouter.post("/public/outlet/:slug/validate-delivery", validateDeliveryEligibility);
storeRouter.post("/public/outlet/:slug/order", placeCustomerOnlineOrder);
storeRouter.post("/public/order/verify-payment", verifyOnlineOrderPayment);
storeRouter.get("/public/order/track/:orderNumber", trackPublicOrder);

// ─── PROTECTED DAIRY ADMIN STORE ENDPOINTS (Requires Active SaaS Plan) ────────
storeRouter.get("/admin/profile", authMiddleware, subscriptionGuard, getMyStoreProfile);
storeRouter.put("/admin/profile", authMiddleware, subscriptionGuard, updateMyStoreProfile);

storeRouter.get("/admin/products", authMiddleware, subscriptionGuard, getAdminProducts);
storeRouter.post("/admin/products", authMiddleware, subscriptionGuard, createAdminProduct);
storeRouter.put("/admin/products/:id", authMiddleware, subscriptionGuard, updateAdminProduct);
storeRouter.delete("/admin/products/:id", authMiddleware, subscriptionGuard, deleteAdminProduct);

storeRouter.post("/admin/pos-sale", authMiddleware, subscriptionGuard, createPosCounterSale);
storeRouter.get("/admin/orders", authMiddleware, subscriptionGuard, getAdminOrders);
storeRouter.patch("/admin/orders/:id/status", authMiddleware, subscriptionGuard, updateOrderStatus);

// ─── PROTECTED MASTER ADMIN ENDPOINTS (Central Franchise Control) ─────────────
storeRouter.get("/master/network-stats", masterAuthMiddleware, getMasterStoreNetworkStats);
storeRouter.patch("/master/outlets/:outletId/toggle", masterAuthMiddleware, toggleMasterOutletStatus);

module.exports = { storeRouter };
