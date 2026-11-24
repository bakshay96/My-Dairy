const crypto = require("crypto");
const {
  StoreProfileModel,
  StoreProductModel,
  StoreCustomerModel,
  StoreOrderModel,
} = require("../models");
const { getRazorpay } = require("../../services/razorpay.service");
const { calculateHaversineDistanceKm, generateOrderNumber } = require("../services/geofence.service");

/**
 * Public: Place Customer Online Order (COD or Initiating Razorpay)
 */
exports.placeCustomerOnlineOrder = async (req, res) => {
  try {
    const { slug } = req.params;
    const {
      customerDetails,
      deliveryAddress,
      fulfillmentType = "village_delivery",
      items,
      paymentMethod = "cod",
      voucherCode,
      customerNotes,
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty." });
    }

    const profile = await StoreProfileModel.findOne({ slug: slug.toLowerCase() });
    if (!profile) {
      return res.status(404).json({ success: false, message: "Store outlet not found" });
    }

    const adminId = profile.adminId;

    // 1. Verify Geofence if delivery requested
    let computedDistanceKm = 0;
    if (fulfillmentType === "village_delivery") {
      const outletLng = profile.location?.coordinates?.[0] || 77.2090;
      const outletLat = profile.location?.coordinates?.[1] || 28.6139;

      if (deliveryAddress?.latitude && deliveryAddress?.longitude) {
        computedDistanceKm = calculateHaversineDistanceKm(
          outletLat,
          outletLng,
          Number(deliveryAddress.latitude),
          Number(deliveryAddress.longitude)
        );
      }

      const inputVillage = (deliveryAddress?.village || "").trim().toLowerCase();
      const primaryVillage = (profile.village || "").toLowerCase();
      const serviceList = (profile.serviceVillages || []).map((v) => v.toLowerCase());

      const isVillageAllowed = inputVillage === primaryVillage || serviceList.includes(inputVillage);
      const isDistanceAllowed = computedDistanceKm > 0 ? computedDistanceKm <= profile.deliveryRadiusKm : true;

      if (!isVillageAllowed && !isDistanceAllowed) {
        return res.status(400).json({
          success: false,
          message: `Delivery is not available in ${deliveryAddress?.village || "your location"}. You can choose In-Store Counter Pickup instead.`,
        });
      }
    }

    // 2. Validate Inventory and compute totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await StoreProductModel.findOne({ _id: item.productId, adminId });
      if (!product) {
        return res.status(400).json({ success: false, message: `Product '${item.name}' no longer available.` });
      }

      if (product.stockQuantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for '${product.name}'. Only ${product.stockQuantity} ${product.unit} left.`,
        });
      }

      const totalItemAmount = product.price * item.quantity;
      subtotal += totalItemAmount;

      orderItems.push({
        productId: product._id,
        name: product.name,
        category: product.category,
        unit: product.unit,
        packageSize: product.packageSize,
        image: product.images?.[0] || "",
        price: product.price,
        mrp: product.mrp,
        quantity: item.quantity,
        totalItemAmount,
      });
    }

    // 3. Compute delivery fee
    let deliveryFee = 0;
    if (fulfillmentType === "village_delivery") {
      deliveryFee = subtotal >= (profile.freeDeliveryThreshold || 500) ? 0 : profile.deliveryFee || 20;
    }

    let discountAmount = 0;
    if (voucherCode && voucherCode.toUpperCase() === "WELCOME50") {
      discountAmount = Math.min(50, subtotal);
    }

    const grandTotal = Math.max(0, subtotal + deliveryFee - discountAmount);

    // 4. Create or lookup customer record
    let customer = null;
    if (customerDetails?.mobile) {
      customer = await StoreCustomerModel.findOne({ adminId, mobile: customerDetails.mobile });
      if (!customer) {
        customer = await StoreCustomerModel.create({
          adminId,
          name: customerDetails.name || "Customer",
          mobile: customerDetails.mobile,
          email: customerDetails.email || "",
          village: deliveryAddress?.village || profile.village,
        });
      }
    }

    const orderNumber = generateOrderNumber("MK-ORD");

    // 5. Razorpay Online Order integration if selected
    let razorpayOrderData = null;
    if (paymentMethod === "razorpay") {
      const razorpay = getRazorpay();
      const amountPaise = Math.round(grandTotal * 100);

      const rzpOrder = await razorpay.orders.create({
        amount: amountPaise,
        currency: "INR",
        receipt: `rcpt_${orderNumber}`,
        notes: {
          adminId: String(adminId),
          orderNumber,
          customerName: customerDetails?.name || "Shopper",
          village: deliveryAddress?.village || profile.village,
        },
      });

      razorpayOrderData = {
        orderId: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      };
    }

    // 6. Save Order
    const newOrder = await StoreOrderModel.create({
      adminId,
      customerId: customer?._id || null,
      orderNumber,
      orderChannel: "online",
      items: orderItems,
      itemCount: orderItems.length,
      subtotal,
      deliveryFee,
      discountAmount,
      voucherCode: voucherCode || "",
      grandTotal,
      fulfillmentType,
      deliveryAddress: {
        recipientName: deliveryAddress?.recipientName || customerDetails?.name || "Customer",
        recipientPhone: deliveryAddress?.recipientPhone || customerDetails?.mobile || "",
        village: deliveryAddress?.village || profile.village,
        landmark: deliveryAddress?.landmark || "",
        fullAddress: deliveryAddress?.fullAddress || "",
        pincode: deliveryAddress?.pincode || "",
        latitude: deliveryAddress?.latitude || null,
        longitude: deliveryAddress?.longitude || null,
        distanceKm: computedDistanceKm,
      },
      paymentMethod,
      paymentStatus: "pending",
      razorpayOrderId: razorpayOrderData?.orderId || null,
      orderStatus: "placed",
      statusHistory: [{ status: "placed", note: "Order placed online by customer." }],
      customerNotes: customerNotes || "",
    });

    // 7. Decrement stock immediately for reserve
    for (const item of orderItems) {
      await StoreProductModel.findByIdAndUpdate(item.productId, {
        $inc: { stockQuantity: -item.quantity },
      });
    }

    res.status(201).json({
      success: true,
      message: "Order placed successfully!",
      order: newOrder,
      razorpay: razorpayOrderData,
    });
  } catch (error) {
    console.error("placeCustomerOnlineOrder error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Public: Verify Razorpay Payment for Online Order
 */
exports.verifyOnlineOrderPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderNumber } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Missing Razorpay verification parameters" });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Payment verification failed: invalid signature" });
    }

    const razorpay = getRazorpay();
    const rzpPayment = await razorpay.payments.fetch(razorpay_payment_id);

    if (rzpPayment.status === "authorized") {
      await razorpay.payments.capture(razorpay_payment_id, rzpPayment.amount, rzpPayment.currency || "INR");
    }

    const updatedOrder = await StoreOrderModel.findOneAndUpdate(
      { orderNumber },
      {
        $set: {
          paymentStatus: "paid",
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          orderStatus: "confirmed",
        },
        $push: {
          statusHistory: { status: "confirmed", note: "Online payment confirmed via Razorpay.", updatedAt: new Date() },
        },
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Payment verified successfully!",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("verifyOnlineOrderPayment error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin: Create POS Counter Walk-in Sale with Instant Thermal Receipt
 */
exports.createPosCounterSale = async (req, res) => {
  try {
    const adminId = req.admin._id || req.admin.id;
    const {
      customerName = "Walk-in Customer",
      customerPhone = "",
      farmerId = null,
      items,
      paymentMethod = "cash_counter",
      discountAmount = 0,
      notes = "",
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "No items in counter sale cart." });
    }

    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await StoreProductModel.findOne({ _id: item.productId, adminId });
      if (!product) {
        return res.status(400).json({ success: false, message: `Product not found: ${item.name}` });
      }

      if (product.stockQuantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for '${product.name}'. In stock: ${product.stockQuantity}.`,
        });
      }

      const totalItemAmount = product.price * item.quantity;
      subtotal += totalItemAmount;

      orderItems.push({
        productId: product._id,
        name: product.name,
        category: product.category,
        unit: product.unit,
        packageSize: product.packageSize,
        price: product.price,
        mrp: product.mrp,
        quantity: item.quantity,
        totalItemAmount,
      });

      product.stockQuantity -= item.quantity;
      await product.save();
    }

    const grandTotal = Math.max(0, subtotal - (Number(discountAmount) || 0));
    const orderNumber = generateOrderNumber("POS-BILL");

    const posOrder = await StoreOrderModel.create({
      adminId,
      customerId: null,
      orderNumber,
      orderChannel: "pos_counter",
      items: orderItems,
      itemCount: orderItems.length,
      subtotal,
      deliveryFee: 0,
      discountAmount: Number(discountAmount) || 0,
      grandTotal,
      fulfillmentType: "counter_pickup",
      deliveryAddress: {
        recipientName: customerName,
        recipientPhone: customerPhone,
        village: req.admin.village || "Local Counter",
      },
      paymentMethod,
      paymentStatus: "paid",
      orderStatus: "delivered",
      deliveredAt: new Date(),
      statusHistory: [{ status: "delivered", note: "Walk-in counter sale settled and delivered." }],
      adminNotes: notes || "",
    });

    res.status(201).json({
      success: true,
      message: "POS Bill generated successfully!",
      order: posOrder,
    });
  } catch (error) {
    console.error("createPosCounterSale error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin: Get Orders List
 */
exports.getAdminOrders = async (req, res) => {
  try {
    const adminId = req.admin._id || req.admin.id;
    const { status, channel, page = 1, limit = 50 } = req.query;

    const query = { adminId };
    if (status) query.orderStatus = status;
    if (channel) query.orderChannel = channel;

    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      StoreOrderModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      StoreOrderModel.countDocuments(query),
    ]);

    const [pendingCount, confirmedCount, outForDeliveryCount, deliveredCount] = await Promise.all([
      StoreOrderModel.countDocuments({ adminId, orderStatus: "placed" }),
      StoreOrderModel.countDocuments({ adminId, orderStatus: "confirmed" }),
      StoreOrderModel.countDocuments({ adminId, orderStatus: "out_for_delivery" }),
      StoreOrderModel.countDocuments({ adminId, orderStatus: "delivered" }),
    ]);

    res.status(200).json({
      success: true,
      orders,
      total,
      stats: {
        pendingOrders: pendingCount,
        confirmedOrders: confirmedCount,
        outForDelivery: outForDeliveryCount,
        delivered: deliveredCount,
      },
    });
  } catch (error) {
    console.error("getAdminOrders error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin: Update Order Status
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const adminId = req.admin._id || req.admin.id;
    const { id } = req.params;
    const { orderStatus, runnerName, runnerPhone, note } = req.body;

    const order = await StoreOrderModel.findOne({ _id: id, adminId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    order.orderStatus = orderStatus;
    if (orderStatus === "delivered") {
      order.deliveredAt = new Date();
      if (order.paymentMethod === "cod") {
        order.paymentStatus = "paid";
      }
    }

    if (runnerName || runnerPhone) {
      order.assignedRunner = {
        name: runnerName || order.assignedRunner?.name,
        phone: runnerPhone || order.assignedRunner?.phone,
      };
    }

    order.statusHistory.push({
      status: orderStatus,
      updatedAt: new Date(),
      note: note || `Order updated to ${orderStatus}`,
    });

    await order.save();

    res.status(200).json({ success: true, message: `Order status updated to ${orderStatus}`, order });
  } catch (error) {
    console.error("updateOrderStatus error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Public: Track Order by Order Number
 */
exports.trackPublicOrder = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const order = await StoreOrderModel.findOne({ orderNumber }).populate(
      "adminId",
      "shopName name mobile village email"
    );

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("trackPublicOrder error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
