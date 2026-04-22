const crypto = require("crypto");
const { getRazorpay } = require("../services/razorpay.service");
const { PaymentModel } = require("./payment.model");

// ─── Create Razorpay Order ────────────────────────────────────────────────────
/**
 * POST /api/payment/create-order
 * Body: { amount (in rupees), currency?, description?, farmerId?, notes? }
 */
exports.createOrder = async (req, res) => {
  try {
    const {
      amount,
      currency = "INR",
      description = "",
      farmerId = null,
      notes = {},
    } = req.body;

    // Validate amount
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount. Must be a positive number." });
    }

    const razorpay = getRazorpay();
    const amountInPaise = Math.round(parseFloat(amount) * 100); // Razorpay expects paise

    const razorpayOptions = {
      amount: amountInPaise,
      currency,
      receipt: `rcpt_${Date.now()}`,
      notes: {
        adminId: req.admin.id.toString(),
        description,
        ...notes,
      },
    };

    // Create order in Razorpay
    const razorpayOrder = await razorpay.orders.create(razorpayOptions);

    // Save pending record to DB
    const payment = new PaymentModel({
      adminId: req.admin.id,
      farmerId: farmerId || null,
      razorpayOrderId: razorpayOrder.id,
      amount: amountInPaise,
      currency,
      description,
      notes,
      status: "created",
    });
    await payment.save();

    // Return only what frontend needs
    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: {
        id: razorpayOrder.id,
        amount: amountInPaise,
        currency,
        keyId: process.env.RAZORPAY_KEY_ID, // Frontend needs this to open checkout
      },
      paymentDbId: payment._id,
    });
  } catch (error) {
    console.error("Payment create-order error:", error);
    res.status(500).json({ message: "Failed to create payment order", error: error.message });
  }
};

// ─── Verify Payment ───────────────────────────────────────────────────────────
/**
 * POST /api/payment/verify
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentDbId? }
 * Verifies HMAC SHA256 signature — this is the security-critical step.
 */
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentDbId,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing payment verification fields" });
    }

    // ── Signature Verification ──────────────────────────────────────────────
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      // Mark as failed if we have the DB record
      if (paymentDbId) {
        await PaymentModel.findByIdAndUpdate(paymentDbId, { status: "failed" });
      }
      return res.status(400).json({ success: false, message: "Payment verification failed — invalid signature" });
    }

    // ── Update DB Record ────────────────────────────────────────────────────
    const query = paymentDbId
      ? { _id: paymentDbId }
      : { razorpayOrderId: razorpay_order_id };

    const updatedPayment = await PaymentModel.findOneAndUpdate(
      query,
      {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: "captured",
        isVerified: true,
        verifiedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedPayment) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    res.status(200).json({
      success: true,
      message: "Payment verified and captured successfully",
      payment: {
        id: updatedPayment._id,
        orderId: updatedPayment.razorpayOrderId,
        paymentId: updatedPayment.razorpayPaymentId,
        amount: updatedPayment.amountInRupees,
        status: updatedPayment.status,
        verifiedAt: updatedPayment.verifiedAt,
      },
    });
  } catch (error) {
    console.error("Payment verify error:", error);
    res.status(500).json({ message: "Payment verification failed", error: error.message });
  }
};

// ─── Payment History ──────────────────────────────────────────────────────────
/**
 * GET /api/payment/history?page=1&pageSize=10&status=captured
 */
exports.getPaymentHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const status = req.query.status || null;
    const skip = (page - 1) * pageSize;

    const filter = { adminId: req.admin.id };
    if (status) filter.status = status;

    const payments = await PaymentModel.find(filter)
      .populate("farmerId", "name mobile email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    const total = await PaymentModel.countDocuments(filter);

    res.status(200).json({
      success: true,
      payments,
      totalPages: Math.ceil(total / pageSize),
      currentPage: page,
      total,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch payment history", error: error.message });
  }
};

// ─── Get Single Payment ───────────────────────────────────────────────────────
/**
 * GET /api/payment/:id
 */
exports.getSinglePayment = async (req, res) => {
  try {
    const payment = await PaymentModel.findOne({
      _id: req.params.id,
      adminId: req.admin.id,
    }).populate("farmerId", "name mobile email");

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.status(200).json({ success: true, payment });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── Payment Stats (dashboard widget) ────────────────────────────────────────
/**
 * GET /api/payment/stats
 */
exports.getPaymentStats = async (req, res) => {
  try {
    const stats = await PaymentModel.aggregate([
      { $match: { adminId: req.admin._id } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    const result = {
      total: 0,
      totalAmount: 0,
      captured: 0,
      capturedAmount: 0,
      failed: 0,
      created: 0,
    };

    stats.forEach((s) => {
      result.total += s.count;
      result.totalAmount += s.totalAmount;
      result[s._id] = s.count;
      if (s._id === "captured") result.capturedAmount = s.totalAmount;
    });

    // Convert paise to rupees
    result.totalAmount = result.totalAmount / 100;
    result.capturedAmount = result.capturedAmount / 100;

    res.status(200).json({ success: true, stats: result });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch stats", error: error.message });
  }
};
