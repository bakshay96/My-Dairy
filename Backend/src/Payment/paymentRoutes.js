const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  createOrder,
  verifyPayment,
  getPaymentHistory,
  getSinglePayment,
  getPaymentStats,
} = require("./payment.controller");

const paymentRouter = express.Router();

// All payment routes require authentication
paymentRouter.use(authMiddleware);

// ─── Order & Verification ────────────────────────────────────────────────────
paymentRouter.post("/create-order", createOrder);     // Create Razorpay order
paymentRouter.post("/verify", verifyPayment);          // Verify payment signature

// ─── History & Stats ─────────────────────────────────────────────────────────
paymentRouter.get("/history", getPaymentHistory);      // List payments (paginated)
paymentRouter.get("/stats", getPaymentStats);          // Dashboard stats
paymentRouter.get("/:id", getSinglePayment);           // Single transaction

module.exports = { paymentRouter };
