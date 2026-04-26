const crypto       = require("crypto");
const { getRazorpay }        = require("../services/razorpay.service");
const { PaymentModel }       = require("./payment.model");
const { MilkModel }          = require("../Milk/milk.model");
const { emitPaymentCaptured } = require("../services/socketService");
const { getBillingCycleDate, getBillingCycleEnd } = require("../utils/milkCalculator");
const mongoose = require("mongoose");

function getDateRange(startDate, endDate) {
  const now = new Date();
  const start = startDate ? new Date(startDate) : new Date(now);
  const end = endDate ? new Date(endDate) : new Date(now);
  if (!startDate) start.setDate(start.getDate() - 9);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return {
    start,
    end,
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
}

function generateInternalOrderId({ startDate, endDate, adminId, farmerId }) {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  const range = `${startDate?.replaceAll("-", "").slice(2) || "NA"}_${endDate?.replaceAll("-", "").slice(2) || "NA"}`;
  const adminPart = String(adminId).slice(-4).toUpperCase();
  const farmerPart = String(farmerId || "GEN").slice(-4).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `MILKI-${y}${m}${d}-${range}-${adminPart}-${farmerPart}-${hh}${mm}${ss}-${rand}`;
}

async function markMilkEntriesPaid({ adminId, farmerId, start, end, paymentId, paymentMode, paymentChannel }) {
  return MilkModel.updateMany(
    {
      adminId: new mongoose.Types.ObjectId(adminId),
      farmerId: new mongoose.Types.ObjectId(farmerId),
      createdAt: { $gte: start, $lte: end },
      paymentStatus: { $ne: "paid" },
      isActive: { $ne: false },
    },
    {
      $set: {
        paymentStatus: "paid",
        isActive: false,
        paymentId,
        paidAt: new Date(),
        paymentMode,
        paymentChannel,
      },
    }
  );
}

// ─── Create Razorpay Order (manual amount) ────────────────────────────────────
exports.createOrder = async (req, res) => {
  try {
    const {
      amount,
      currency    = "INR",
      description = "",
      farmerId    = null,
      notes       = {},
    } = req.body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount." });
    }

    const razorpay      = getRazorpay();
    const amountInPaise = Math.round(parseFloat(amount) * 100);
    const internalOrderId = generateInternalOrderId({
      startDate: "",
      endDate: "",
      adminId: req.admin.id,
      farmerId: farmerId || "GEN",
    });

    const razorpayOrder = await razorpay.orders.create({
      amount:   amountInPaise,
      currency,
      receipt:  `rcpt_${Date.now()}`,
      notes:    { adminId: req.admin.id.toString(), description, ...notes },
    });

    const payment = await new PaymentModel({
      adminId:         req.admin.id,
      farmerId:        farmerId || null,
      internalOrderId,
      razorpayOrderId: razorpayOrder.id,
      amount:          amountInPaise,
      currency,
      description,
      notes,
      status: "created",
      paymentMode: "online",
      paymentChannel: "razorpay",
    }).save();

    res.status(201).json({
      success: true,
      order:   { id: razorpayOrder.id, amount: amountInPaise, currency, keyId: process.env.RAZORPAY_KEY_ID },
      paymentDbId: payment._id,
      internalOrderId,
    });
  } catch (error) {
    console.error("createOrder error:", error);
    res.status(500).json({ message: "Failed to create payment order", error: error.message });
  }
};

// ─── Create Order From 10-Day Billing Total ────────────────────────────────────
/**
 * POST /api/payment/create-billing-order
 * Body: { farmerId, startDate?, endDate? }
 * Runs the billing aggregation internally and creates a Razorpay order
 * for the total amount owed to that farmer.
 */
exports.createOrderFromBilling = async (req, res) => {
  try {
    const { farmerId, startDate, endDate } = req.body;

    if (!farmerId || !mongoose.Types.ObjectId.isValid(farmerId)) {
      return res.status(400).json({ message: "Valid farmerId is required" });
    }

    const { start, end, startDate: cycleStart, endDate: cycleEnd } = getDateRange(startDate, endDate);
    const internalOrderId = generateInternalOrderId({
      startDate: cycleStart,
      endDate: cycleEnd,
      adminId: req.admin.id,
      farmerId,
    });

    // ── Aggregate total for this farmer ───────────────────────────────────
    const [agg] = await MilkModel.aggregate([
      {
        $match: {
          adminId:  new mongoose.Types.ObjectId(req.admin.id),
          farmerId: new mongoose.Types.ObjectId(farmerId),
          paymentStatus: { $ne: "paid" },
          isActive: { $ne: false },
          createdAt: {
            $gte: start,
            $lte: end,
          },
        },
      },
      {
        $group: {
          _id:         "$farmerId",
          totalAmount: { $sum: "$calculatedAmount" },
          totalLiters: { $sum: "$litter" },
          avgFat:      { $avg: "$fat" },
          entries:     { $sum: 1 },
        },
      },
    ]);

    if (!agg || agg.totalAmount <= 0) {
      return res.status(400).json({
        message: `No milk entries found for this farmer in cycle ${cycleStart} → ${cycleEnd}`,
      });
    }

    const totalAmountRupees = parseFloat(agg.totalAmount.toFixed(2));
    const amountInPaise     = Math.round(totalAmountRupees * 100);

    const razorpay      = getRazorpay();
    const razorpayOrder = await razorpay.orders.create({
      amount:  amountInPaise,
      currency: "INR",
      receipt:  `bill_${farmerId}_${cycleStart}`,
      notes: {
        adminId:    req.admin.id.toString(),
        farmerId:   farmerId.toString(),
        cycleStart,
        cycleEnd,
        totalLiters: agg.totalLiters.toFixed(3),
      },
    });

    const payment = await new PaymentModel({
      adminId:         req.admin.id,
      farmerId,
      internalOrderId,
      razorpayOrderId: razorpayOrder.id,
      amount:          amountInPaise,
      currency:        "INR",
      description:     `10-day billing: ${cycleStart} to ${cycleEnd}`,
      notes: {
        cycleStart,
        cycleEnd,
        totalLiters:  parseFloat(agg.totalLiters.toFixed(3)),
        totalEntries: agg.entries,
        avgFat:       parseFloat((agg.avgFat || 0).toFixed(2)),
      },
      status: "created",
      paymentMode: "online",
      paymentChannel: "razorpay",
      billingStartDate: cycleStart,
      billingEndDate: cycleEnd,
    }).save();

    res.status(201).json({
      success: true,
      message: `Billing order created for ₹${totalAmountRupees}`,
      order: {
        id:       razorpayOrder.id,
        amount:   amountInPaise,
        currency: "INR",
        keyId:    process.env.RAZORPAY_KEY_ID,
      },
      billing: {
        cycleStart,
        cycleEnd,
        totalAmount:  totalAmountRupees,
        totalLiters:  parseFloat(agg.totalLiters.toFixed(3)),
        totalEntries: agg.entries,
        avgFat:       parseFloat((agg.avgFat || 0).toFixed(2)),
      },
      paymentDbId: payment._id,
      internalOrderId,
    });
  } catch (error) {
    console.error("createOrderFromBilling error:", error);
    res.status(500).json({ message: "Failed to create billing order", error: error.message });
  }
};

// ─── Create Manual Payment Intent (UPI/Cash Apps) ─────────────────────────────
exports.createManualPaymentIntent = async (req, res) => {
  try {
    const { farmerId, startDate, endDate, paymentChannel = "upi" } = req.body;
    if (!farmerId || !mongoose.Types.ObjectId.isValid(farmerId)) {
      return res.status(400).json({ message: "Valid farmerId is required" });
    }

    const { start, end, startDate: cycleStart, endDate: cycleEnd } = getDateRange(startDate, endDate);
    const internalOrderId = generateInternalOrderId({
      startDate: cycleStart,
      endDate: cycleEnd,
      adminId: req.admin.id,
      farmerId,
    });

    const [agg] = await MilkModel.aggregate([
      {
        $match: {
          adminId: new mongoose.Types.ObjectId(req.admin.id),
          farmerId: new mongoose.Types.ObjectId(farmerId),
          paymentStatus: { $ne: "paid" },
          isActive: { $ne: false },
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: "$farmerId",
          totalAmount: { $sum: "$calculatedAmount" },
          totalLiters: { $sum: "$litter" },
          avgFat: { $avg: "$fat" },
          totalEntries: { $sum: 1 },
          categories: { $push: "$category" },
        },
      },
    ]);

    if (!agg || agg.totalAmount <= 0) {
      return res.status(400).json({ message: "No unpaid entries found in selected range" });
    }

    const amount = Number(agg.totalAmount.toFixed(2));
    const amountInPaise = Math.round(amount * 100);
    const upiId = process.env.UPI_ID || "milkify@upi";
    const merchantName = process.env.UPI_MERCHANT_NAME || "Milkify";
    const upiIntent = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(merchantName)}&am=${amount.toFixed(
      2
    )}&cu=INR&tn=${encodeURIComponent(`Billing ${cycleStart} to ${cycleEnd} | ${internalOrderId}`)}`;

    const payment = await new PaymentModel({
      adminId: req.admin.id,
      farmerId,
      internalOrderId,
      amount: amountInPaise,
      currency: "INR",
      status: "created",
      paymentMode: "online",
      paymentChannel,
      billingStartDate: cycleStart,
      billingEndDate: cycleEnd,
      notes: {
        cycleStart,
        cycleEnd,
        totalLiters: Number(agg.totalLiters.toFixed(3)),
        avgFat: Number((agg.avgFat || 0).toFixed(2)),
        totalEntries: agg.totalEntries,
        categories: agg.categories || [],
        upiIntent,
      },
      description: `Manual payment intent: ${cycleStart} to ${cycleEnd}`,
    }).save();

    return res.status(201).json({
      success: true,
      paymentDbId: payment._id,
      internalOrderId,
      amount,
      upiIntent,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(upiIntent)}`,
    });
  } catch (error) {
    console.error("createManualPaymentIntent error:", error);
    return res.status(500).json({ message: "Failed to create manual payment intent", error: error.message });
  }
};

// ─── Settle Payment (Cash/UPI/apps) ───────────────────────────────────────────
exports.settleBillingPayment = async (req, res) => {
  try {
    const { farmerId, startDate, endDate, paymentMode = "cash", paymentChannel = "cash", referenceId = "", paymentDbId = null } = req.body;

    if (!farmerId || !mongoose.Types.ObjectId.isValid(farmerId)) {
      return res.status(400).json({ message: "Valid farmerId is required" });
    }
    if (!["cash", "online"].includes(paymentMode)) {
      return res.status(400).json({ message: "paymentMode must be cash or online" });
    }

    const { start, end, startDate: cycleStart, endDate: cycleEnd } = getDateRange(startDate, endDate);

    const [agg] = await MilkModel.aggregate([
      {
        $match: {
          adminId: new mongoose.Types.ObjectId(req.admin.id),
          farmerId: new mongoose.Types.ObjectId(farmerId),
          paymentStatus: { $ne: "paid" },
          isActive: { $ne: false },
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: "$farmerId",
          totalAmount: { $sum: "$calculatedAmount" },
          totalLiters: { $sum: "$litter" },
          avgFat: { $avg: "$fat" },
          totalEntries: { $sum: 1 },
          categories: { $push: "$category" },
        },
      },
    ]);

    if (!agg || agg.totalAmount <= 0) {
      return res.status(400).json({ message: "No unpaid entries found in selected date range" });
    }

    const amountInPaise = Math.round(Number(agg.totalAmount.toFixed(2)) * 100);
    let payment;
    if (paymentDbId) {
      payment = await PaymentModel.findOneAndUpdate(
        { _id: paymentDbId, adminId: req.admin.id },
        {
          $set: {
            status: "captured",
            isVerified: true,
            verifiedAt: new Date(),
            paymentMode,
            paymentChannel,
            billingStartDate: cycleStart,
            billingEndDate: cycleEnd,
            notes: {
              cycleStart,
              cycleEnd,
              totalLiters: Number(agg.totalLiters.toFixed(3)),
              avgFat: Number((agg.avgFat || 0).toFixed(2)),
              totalEntries: agg.totalEntries,
              categories: agg.categories || [],
              referenceId,
            },
          },
        },
        { new: true }
      );
    }

    if (!payment) {
      payment = await new PaymentModel({
        adminId: req.admin.id,
        farmerId,
        internalOrderId: generateInternalOrderId({
          startDate: cycleStart,
          endDate: cycleEnd,
          adminId: req.admin.id,
          farmerId,
        }),
        amount: amountInPaise,
        currency: "INR",
        status: "captured",
        isVerified: true,
        verifiedAt: new Date(),
        paymentMode,
        paymentChannel,
        billingStartDate: cycleStart,
        billingEndDate: cycleEnd,
        description: `Billing settled: ${cycleStart} to ${cycleEnd}`,
        notes: {
          cycleStart,
          cycleEnd,
          totalLiters: Number(agg.totalLiters.toFixed(3)),
          avgFat: Number((agg.avgFat || 0).toFixed(2)),
          totalEntries: agg.totalEntries,
          categories: agg.categories || [],
          referenceId,
        },
      }).save();
    }

    await markMilkEntriesPaid({
      adminId: req.admin.id,
      farmerId,
      start,
      end,
      paymentId: payment._id,
      paymentMode,
      paymentChannel,
    });

    return res.status(200).json({
      success: true,
      message: "Billing marked as paid successfully",
      payment: {
        id: payment._id,
        mode: paymentMode,
        channel: paymentChannel,
        amount: payment.amountInRupees,
      },
    });
  } catch (error) {
    console.error("settleBillingPayment error:", error);
    return res.status(500).json({ message: "Failed to settle billing payment", error: error.message });
  }
};

// ─── Verify Payment (client-side callback) ────────────────────────────────────
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentDbId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing payment verification fields" });
    }

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature) {
      if (paymentDbId) await PaymentModel.findByIdAndUpdate(paymentDbId, { status: "failed" });
      return res.status(400).json({ success: false, message: "Payment verification failed — invalid signature" });
    }

    const query   = paymentDbId ? { _id: paymentDbId } : { razorpayOrderId: razorpay_order_id };
    const updated = await PaymentModel.findOneAndUpdate(
      query,
      {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status:     "captured",
        isVerified: true,
        verifiedAt: new Date(),
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Payment record not found" });

    const cycleStart = updated.notes?.cycleStart;
    const cycleEnd = updated.notes?.cycleEnd;
    if (updated.farmerId && cycleStart && cycleEnd) {
      const start = new Date(cycleStart);
      const end = new Date(cycleEnd);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      await markMilkEntriesPaid({
        adminId: updated.adminId,
        farmerId: updated.farmerId,
        start,
        end,
        paymentId: updated._id,
        paymentMode: "online",
        paymentChannel: "razorpay",
      });
    }

    // Emit real-time update
    emitPaymentCaptured(updated.adminId.toString(), updated.toObject());

    res.status(200).json({
      success: true,
      message: "Payment verified and captured",
      payment: {
        id:         updated._id,
        orderId:    updated.razorpayOrderId,
        paymentId:  updated.razorpayPaymentId,
        amount:     updated.amountInRupees,
        status:     updated.status,
        verifiedAt: updated.verifiedAt,
      },
    });
  } catch (error) {
    console.error("verifyPayment error:", error);
    res.status(500).json({ message: "Payment verification failed", error: error.message });
  }
};

// ─── Razorpay Webhook (server-to-server, uses raw body) ──────────────────────
/**
 * POST /api/payment/webhook
 * Razorpay sends this after payment events. We verify the
 * x-razorpay-signature header using RAZORPAY_WEBHOOK_SECRET.
 * The route must receive raw body — configured in app.js.
 */
exports.handleWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.warn("[Webhook] RAZORPAY_WEBHOOK_SECRET not set — skipping verification");
      return res.status(200).json({ status: "ok" });
    }

    const receivedSig = req.headers["x-razorpay-signature"];
    const body        = req.body; // raw Buffer (configured in app.js)

    const expected = crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");

    if (expected !== receivedSig) {
      console.warn("[Webhook] Invalid signature received");
      return res.status(400).json({ message: "Invalid webhook signature" });
    }

    const event   = JSON.parse(body.toString());
    const payload = event.payload?.payment?.entity;

    if (event.event === "payment.captured" && payload) {
      const updated = await PaymentModel.findOneAndUpdate(
        { razorpayOrderId: payload.order_id },
        {
          razorpayPaymentId: payload.id,
          status:     "captured",
          isVerified: true,
          verifiedAt: new Date(),
        },
        { new: true }
      );

      if (updated) {
        emitPaymentCaptured(updated.adminId.toString(), updated.toObject());
        console.log(`[Webhook] Payment captured: ${payload.id}`);
      }
    }

    res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("[Webhook] Error:", error);
    res.status(500).json({ message: "Webhook processing error" });
  }
};

// ─── Payment History ──────────────────────────────────────────────────────────
exports.getPaymentHistory = async (req, res) => {
  try {
    const page     = parseInt(req.query.page)     || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const status   = req.query.status || null;
    const farmerId = req.query.farmerId || null;
    const startDate = req.query.startDate || null;
    const endDate = req.query.endDate || null;
    const skip     = (page - 1) * pageSize;

    const filter = { adminId: req.admin.id };
    if (status) filter.status = status;
    if (farmerId && mongoose.Types.ObjectId.isValid(farmerId)) {
      filter.farmerId = farmerId;
    }
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        filter.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const [payments, total] = await Promise.all([
      PaymentModel.find(filter)
        .populate("farmerId", "name mobile email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      PaymentModel.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      payments,
      totalPages:  Math.ceil(total / pageSize),
      currentPage: page,
      total,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch payment history", error: error.message });
  }
};

// ─── Get Single Payment ───────────────────────────────────────────────────────
exports.getSinglePayment = async (req, res) => {
  try {
    const payment = await PaymentModel.findOne({ _id: req.params.id, adminId: req.admin.id })
      .populate("farmerId", "name mobile email");

    if (!payment) return res.status(404).json({ message: "Payment not found" });
    res.status(200).json({ success: true, payment });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── Payment Stats ────────────────────────────────────────────────────────────
exports.getPaymentStats = async (req, res) => {
  try {
    const stats = await PaymentModel.aggregate([
      { $match: { adminId: new mongoose.Types.ObjectId(req.admin.id) } },
      { $group: { _id: "$status", count: { $sum: 1 }, totalAmount: { $sum: "$amount" } } },
    ]);

    const result = { total: 0, totalAmount: 0, captured: 0, capturedAmount: 0, failed: 0, created: 0 };
    stats.forEach((s) => {
      result.total       += s.count;
      result.totalAmount += s.totalAmount;
      result[s._id]       = s.count;
      if (s._id === "captured") result.capturedAmount = s.totalAmount;
    });
    result.totalAmount    = +(result.totalAmount    / 100).toFixed(2);
    result.capturedAmount = +(result.capturedAmount / 100).toFixed(2);

    res.status(200).json({ success: true, stats: result });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch stats", error: error.message });
  }
};
