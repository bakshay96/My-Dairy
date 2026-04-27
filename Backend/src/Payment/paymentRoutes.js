const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  createOrder,
  createOrderFromBilling,
  createManualPaymentIntent,
  verifyPayment,
  settleBillingPayment,
  handleWebhook,
  getPaymentHistory,
  getSinglePayment,
  getPaymentStats,
} = require("./payment.controller");

const paymentRouter = express.Router();

// ─── Webhook (NO auth, uses raw body — must be declared BEFORE authMiddleware) ─
// Raw body is configured in app.js for this route only.
paymentRouter.post("/webhook", handleWebhook);

// All other payment routes require authentication
paymentRouter.use(authMiddleware);

// ─── Order Creation ────────────────────────────────────────────────────────────
paymentRouter.post("/create-order",          createOrder);           // manual amount
paymentRouter.post("/create-billing-order",  createOrderFromBilling); // from 10-day total
paymentRouter.post("/manual-intent",         createManualPaymentIntent);
paymentRouter.post("/settle",                settleBillingPayment);   // cash/upi/manual settlement

// ─── Verification ─────────────────────────────────────────────────────────────
paymentRouter.post("/verify", verifyPayment);

// ─── History & Stats ──────────────────────────────────────────────────────────
paymentRouter.get("/history", getPaymentHistory);
paymentRouter.get("/stats",   getPaymentStats);
paymentRouter.get("/:id",     getSinglePayment);

module.exports = { paymentRouter };
