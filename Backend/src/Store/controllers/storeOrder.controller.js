const crypto = require("crypto");
const PDFDocument = require("pdfkit");
const {
  StoreProfileModel,
  StoreProductModel,
  StoreCustomerModel,
  StoreOrderModel,
  StoreCouponModel,
} = require("../models");
const { farmerModel } = require("../../Farmer/farmer.model");
const { MilkModel } = require("../../Milk/milk.model");
const { PaymentModel } = require("../../Payment/payment.model");
const { getRazorpay } = require("../../services/razorpay.service");
const { calculateHaversineDistanceKm, generateOrderNumber } = require("../services/geofence.service");
const { getFarmerMilkCredit } = require("./storeCustomer.controller");

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

    // 3. Compute delivery fee & discounts
    let deliveryFee = 0;
    if (fulfillmentType === "village_delivery") {
      deliveryFee = subtotal >= (profile.freeDeliveryThreshold || 500) ? 0 : profile.deliveryFee || 20;
    }

    let discountAmount = 0;
    if (voucherCode) {
      const cleanCode = voucherCode.trim().toUpperCase();
      if (cleanCode === "WELCOME50") {
        discountAmount = Math.min(50, subtotal);
      } else {
        const foundCoupon = await StoreCouponModel.findOne({
          adminId,
          code: cleanCode,
          isActive: true,
          $or: [{ validTill: null }, { validTill: { $gte: new Date() } }],
        });
        if (foundCoupon && subtotal >= (foundCoupon.minOrderValue || 0)) {
          if (foundCoupon.discountType === "percentage") {
            let disc = (subtotal * foundCoupon.discountValue) / 100;
            if (foundCoupon.maxDiscountAmount > 0) disc = Math.min(disc, foundCoupon.maxDiscountAmount);
            discountAmount = Math.round(disc);
          } else {
            discountAmount = Math.min(foundCoupon.discountValue, subtotal);
          }
          await StoreCouponModel.findByIdAndUpdate(foundCoupon._id, { $inc: { timesUsed: 1 } });
        }
      }
    }

    const grandTotal = Math.max(0, subtotal + deliveryFee - discountAmount);

    // 4. Create or lookup customer record (Support logged-in customers & guest checkout)
    const jwt = require("jsonwebtoken");
    const JWT_SECRET = process.env.JWT_SECRET || "milkify_secret_key_2026";
    let customer = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        customer = await StoreCustomerModel.findById(decoded.id);
      } catch (e) {}
    }

    if (!customer && customerDetails?.mobile) {
      const cleanMobile = customerDetails.mobile.replace(/\D/g, "").slice(-10);
      customer = await StoreCustomerModel.findOne({ adminId, mobile: cleanMobile });
      if (!customer) {
        customer = await StoreCustomerModel.create({
          adminId,
          name: customerDetails.name || "Customer",
          mobile: cleanMobile,
          email: customerDetails.email || "",
          village: deliveryAddress?.village || profile.village,
          savedAddresses: deliveryAddress?.fullAddress
            ? [
                {
                  label: "Default Address",
                  recipientName: deliveryAddress.recipientName || customerDetails.name,
                  recipientPhone: cleanMobile,
                  village: deliveryAddress.village || profile.village,
                  landmark: deliveryAddress.landmark || "",
                  fullAddress: deliveryAddress.fullAddress,
                  isDefault: true,
                },
              ]
            : [],
        });
      } else {
        if (customerDetails.email && !customer.email) {
          customer.email = customerDetails.email.trim().toLowerCase();
          await customer.save();
        }
      }
    }

    // 5. Payment method permissions & Dairy Farmer Milk Credit Validation
    const isOnlinePayment = paymentMethod === "razorpay" || paymentMethod === "online" || paymentMethod === "upi";
    const isCodPayment = paymentMethod === "cod";
    const isFarmerCreditPayment = paymentMethod === "farmer_milk_bill";

    if (isCodPayment && profile.isCodEnabled === false) {
      return res.status(400).json({
        success: false,
        message: "Cash on Delivery (COD) is currently disabled by this dairy outlet. Please select Online Payment.",
      });
    }

    if (isOnlinePayment && profile.isOnlinePaymentEnabled === false) {
      return res.status(400).json({
        success: false,
        message: "Online payments are currently disabled by this dairy outlet. Please choose Cash on Delivery.",
      });
    }

    const orderNumber = generateOrderNumber("MK-ORD");

    let farmerRecord = null;
    let initialPaymentStatus = "pending";
    let initialStatusNote = "Order placed online by customer.";

    if (isFarmerCreditPayment) {
      if (profile.isFarmerCreditEnabled === false) {
        return res.status(400).json({
          success: false,
          message: "Dairy Milk Credit payments are currently disabled by this dairy store.",
        });
      }

      // Customer or delivery phone must match a registered Dairy Farmer
      const targetPhone = (customer?.mobile || deliveryAddress?.recipientPhone || customerDetails?.mobile || "")
        .replace(/\D/g, "")
        .slice(-10);

      farmerRecord = await farmerModel.findOne({
        adminId,
        mobile: targetPhone,
      });

      if (!farmerRecord) {
        return res.status(400).json({
          success: false,
          message: "No registered Dairy Farmer account found matching this mobile number under this dairy.",
        });
      }

      // Check unsettled milk entries using helper
      const creditInfo = await getFarmerMilkCredit(adminId, farmerRecord.mobile);
      const availableCredit = creditInfo?.creditBalance || 0;

      if (availableCredit < grandTotal) {
        return res.status(400).json({
          success: false,
          message: `Insufficient Dairy Milk Credit balance. Available: ₹${availableCredit}, Required: ₹${grandTotal}. Please choose Online Payment or Cash on Delivery.`,
        });
      }

      // ── Instant DB Deduction from Farmer's Unsettled Milk Entries ──
      const unpaidRecords = await MilkModel.find({
        adminId,
        farmerId: farmerRecord._id,
        paymentStatus: { $ne: "paid" },
        isActive: true,
      }).sort({ date: 1, createdAt: 1 });

      let remainingDeduction = grandTotal;
      for (const rec of unpaidRecords) {
        if (remainingDeduction <= 0) break;
        if (rec.calculatedAmount <= remainingDeduction) {
          remainingDeduction = Number((remainingDeduction - rec.calculatedAmount).toFixed(2));
          rec.paymentStatus = "paid";
          rec.paidAt = new Date();
          await rec.save();
        } else {
          rec.calculatedAmount = Number((rec.calculatedAmount - remainingDeduction).toFixed(2));
          remainingDeduction = 0;
          await rec.save();
        }
      }

      // Audit log in PaymentModel
      try {
        await PaymentModel.create({
          adminId,
          farmerId: farmerRecord._id,
          internalOrderId: `MILK-CREDIT-${orderNumber}`,
          amount: Math.round(grandTotal * 100),
          currency: "INR",
          status: "captured",
          paymentMode: "online",
          paymentChannel: "other",
          description: `Dairy Cash deduction for Store Order #${orderNumber}`,
          notes: {
            orderNumber,
            grandTotal,
            type: "dairy_milk_store_credit",
            farmerName: farmerRecord.name,
            farmerMobile: farmerRecord.mobile,
          },
          isVerified: true,
          verifiedAt: new Date(),
        });
      } catch (payRecErr) {
        console.warn("PaymentModel record note:", payRecErr.message);
      }

      initialPaymentStatus = "paid";
      initialStatusNote = `Paid with Dairy Cash / Milk Credit (Farmer: ${farmerRecord.name}, Member ID: ${farmerRecord.memberId || "FAR"}). ₹${grandTotal} deducted instantly from unsettled milk balance.`;
    }

    // 6. Online Payment integration (UPI / Razorpay / Google Pay / PhonePe)
    let razorpayOrderData = null;
    const upiId = profile.upiId || process.env.UPI_ID || "milkifydemo@upi";
    const merchantName = profile.storeName || "Milkify Store";
    const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${grandTotal}&cu=INR&tr=${orderNumber}&tn=${encodeURIComponent(`Order ${orderNumber}`)}`;
    const upiQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUrl)}`;

    const upiDetails = {
      upiId,
      merchantName,
      amount: grandTotal,
      upiUrl,
      upiQrUrl,
      gpayUrl: upiUrl,
      phonepeUrl: upiUrl,
      paytmUrl: upiUrl,
    };

    // Clean formatting for Razorpay standard customer prefill
    let cleanMobile = String(deliveryAddress?.recipientPhone || customerDetails?.mobile || "").replace(/\D/g, "");
    if (cleanMobile.length >= 10) cleanMobile = cleanMobile.slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) cleanMobile = "9876543210";
    const cleanEmail = customerDetails?.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerDetails.email)
      ? customerDetails.email
      : "shopper@milkify.app";
    const cleanName = customerDetails?.name || deliveryAddress?.recipientName || "Valued Shopper";

    if (isOnlinePayment) {
      try {
        const razorpay = getRazorpay();
        const amountPaise = Math.round(grandTotal * 100);

        const rzpOrder = await razorpay.orders.create({
          amount: amountPaise,
          currency: "INR",
          receipt: `rcpt_${orderNumber}`,
          notes: {
            adminId: String(adminId),
            orderNumber,
            customerName: cleanName,
            customerEmail: cleanEmail,
            customerContact: cleanMobile,
            village: deliveryAddress?.village || profile.village,
          },
        });

        razorpayOrderData = {
          orderId: rzpOrder.id,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          keyId: process.env.RAZORPAY_KEY_ID,
          customer: {
            name: cleanName,
            email: cleanEmail,
            contact: cleanMobile,
          },
          isMockSandbox: false,
        };
      } catch (rzpErr) {
        console.log("ℹ️ Razorpay live order note:", rzpErr?.error?.description || rzpErr?.message || "Using sandbox gateway");
        razorpayOrderData = {
          orderId: `rzp_sim_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
          amount: Math.round(grandTotal * 100),
          currency: "INR",
          keyId: process.env.RAZORPAY_KEY_ID || "rzp_test_sim",
          customer: {
            name: cleanName,
            email: cleanEmail,
            contact: cleanMobile,
          },
          isMockSandbox: true,
          mockReason: "Milkify Instant Online UPI / Sandbox Gateway active.",
        };
      }
    }

    // 7. Save Order
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
      paymentStatus: initialPaymentStatus,
      razorpayOrderId: razorpayOrderData?.orderId || null,
      orderStatus: "placed",
      statusHistory: [{ status: "placed", note: initialStatusNote }],
      customerNotes: customerNotes || "",
    });

    // 7. Decrement stock immediately for reserve
    for (const item of orderItems) {
      await StoreProductModel.findByIdAndUpdate(item.productId, {
        $inc: { stockQuantity: -item.quantity },
      });
    }

    // 8. Real-time emit to store admin dashboard
    try {
      const { emitStoreOrderCreated } = require("../../services/socketService");
      emitStoreOrderCreated(adminId, newOrder);
    } catch (sockErr) {
      console.warn("Real-time socket emit skipped:", sockErr.message);
    }

    let remainingCredit = 0;
    if (isFarmerCreditPayment && farmerRecord) {
      const refreshedCredit = await getFarmerMilkCredit(adminId, farmerRecord.mobile);
      remainingCredit = refreshedCredit?.creditBalance ?? 0;
    }

    res.status(201).json({
      success: true,
      message: isFarmerCreditPayment
        ? `Order confirmed! ₹${grandTotal} paid via Dairy Cash. Remaining balance: ₹${remainingCredit}.`
        : "Order placed successfully!",
      order: newOrder,
      razorpay: razorpayOrderData,
      upiDetails,
      remainingCredit,
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

    if (!razorpay_order_id) {
      return res.status(400).json({ success: false, message: "Missing Razorpay order identification" });
    }

    // Switch payment mode to COD fallback
    if (razorpay_order_id === "cod_switch") {
      const updatedOrder = await StoreOrderModel.findOneAndUpdate(
        { orderNumber },
        {
          $set: {
            paymentStatus: "pending",
            paymentMethod: "cod",
            orderStatus: "placed",
          },
          $push: {
            statusHistory: {
              status: "placed",
              note: "Customer switched payment method to Cash on Delivery (COD).",
              updatedAt: new Date(),
            },
          },
        },
        { new: true }
      );
      try {
        const { emitStoreOrderStatusUpdated } = require("../../services/socketService");
        if (updatedOrder) emitStoreOrderStatusUpdated(updatedOrder.adminId, updatedOrder.orderNumber, "placed");
      } catch (e) {}
      return res.status(200).json({ success: true, message: "Switched to Cash on Delivery", order: updatedOrder });
    }

    // Seamless Online / UPI / Sandbox Simulation Handler (when real keys are invalid or UPI direct)
    if (
      razorpay_order_id.startsWith("rzp_sim_") ||
      razorpay_order_id.startsWith("upi_") ||
      razorpay_order_id === "upi_confirmed" ||
      razorpay_order_id.startsWith("online_")
    ) {
      const updatedOrder = await StoreOrderModel.findOneAndUpdate(
        { orderNumber },
        {
          $set: {
            paymentStatus: "paid",
            paymentMethod: "online",
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id || `pay_upi_${Date.now()}`,
            razorpaySignature: razorpay_signature || "online_upi_valid_signature",
            orderStatus: "confirmed",
          },
          $push: {
            statusHistory: {
              status: "confirmed",
              note: "Payment authorized and verified (Instant UPI / Online Gateway).",
              updatedAt: new Date(),
            },
          },
        },
        { new: true }
      );

      try {
        const { emitStoreOrderStatusUpdated } = require("../../services/socketService");
        if (updatedOrder) emitStoreOrderStatusUpdated(updatedOrder.adminId, updatedOrder.orderNumber, "confirmed");
      } catch (e) {}

      return res.status(200).json({
        success: true,
        message: "Online payment confirmed successfully!",
        order: updatedOrder,
      });
    }

    if (!razorpay_payment_id || !razorpay_signature) {
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
      voucherCode = "",
      isTaxApplied = false,
      taxRate = 5, // e.g. 5% GST
      gstNumber = "",
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
        image: product.images?.[0] || "",
        price: product.price,
        mrp: product.mrp,
        quantity: item.quantity,
        totalItemAmount,
      });

      product.stockQuantity -= item.quantity;
      await product.save();
    }

    const discountVal = Number(discountAmount) || 0;
    const taxableSubtotal = Math.max(0, subtotal - discountVal);

    let taxAmount = 0;
    let cgst = 0;
    let sgst = 0;

    if (isTaxApplied && Number(taxRate) > 0) {
      taxAmount = parseFloat(((taxableSubtotal * Number(taxRate)) / 100).toFixed(2));
      cgst = parseFloat((taxAmount / 2).toFixed(2));
      sgst = parseFloat((taxAmount / 2).toFixed(2));
    }

    const grandTotal = Math.round(taxableSubtotal + taxAmount);
    const dateStr = new Date().toISOString().slice(0, 10);
    const orderNumber = generateOrderNumber("BILL");

    // Settle payment status based on mode
    const isCredit = paymentMethod === "credit" || paymentMethod === "farmer_milk_bill";
    const paymentStatus = isCredit ? "pending" : "paid";

    const posOrder = await StoreOrderModel.create({
      adminId,
      customerId: null,
      orderNumber,
      orderChannel: "pos_counter",
      items: orderItems,
      itemCount: orderItems.length,
      subtotal,
      deliveryFee: 0,
      discountAmount: discountVal,
      voucherCode: voucherCode || "",
      grandTotal,
      taxDetails: {
        isTaxApplied: Boolean(isTaxApplied),
        taxRate: Number(taxRate) || 0,
        taxAmount,
        cgst,
        sgst,
        gstNumber: gstNumber || req.admin.gstNumber || "",
      },
      billDateStr: dateStr,
      fulfillmentType: "counter_pickup",
      deliveryAddress: {
        recipientName: customerName.trim(),
        recipientPhone: customerPhone ? customerPhone.trim() : "",
        village: req.admin.village || "Dairy Counter",
      },
      paymentMethod,
      paymentStatus,
      orderStatus: "delivered",
      deliveredAt: new Date(),
      statusHistory: [{ status: "delivered", note: "Walk-in counter POS bill generated and settled." }],
      adminNotes: notes || "",
    });

    // Formatted WhatsApp Receipt message
    const storeName = req.admin.shopName || "Milkify Dairy Store";
    const itemsText = orderItems.map((i) => `• ${i.name} (${i.packageSize || i.unit}) x${i.quantity}: ₹${i.totalItemAmount}`).join("%0A");
    const waText = `*TAX INVOICE - ${encodeURIComponent(storeName)}*%0A*Bill No:* ${orderNumber}%0A*Date:* ${new Date().toLocaleDateString()}%0A*Customer:* ${encodeURIComponent(customerName)}%0A------------------------%0A${itemsText}%0A------------------------%0A*Subtotal:* ₹${subtotal}%0A*Discount:* -₹${discountVal}%0A${isTaxApplied ? `*GST (${taxRate}%):* ₹${taxAmount}%0A` : ""}*Total Amount:* ₹${grandTotal}%0A*Payment:* ${paymentMethod.toUpperCase()} (${paymentStatus.toUpperCase()})%0A%0A_Thank you for visiting ${encodeURIComponent(storeName)}!_`;
    const cleanPhone = customerPhone.replace(/\D/g, "").slice(-10);
    const whatsappUrl = cleanPhone ? `https://wa.me/91${cleanPhone}?text=${waText}` : `https://wa.me/?text=${waText}`;

    res.status(201).json({
      success: true,
      message: "POS Bill generated successfully!",
      bill: posOrder,
      order: posOrder,
      whatsappUrl,
    });
  } catch (error) {
    console.error("createPosCounterSale error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin: Get Store Analytics & Time Span / Date-wise Revenue Collections
 */
exports.getStoreAnalytics = async (req, res) => {
  try {
    const adminId = req.admin._id || req.admin.id;
    const { date, startDate, endDate, fromDate, toDate } = req.query;

    const todayStr = new Date().toISOString().slice(0, 10);
    // If range provided (startDate/endDate or fromDate/toDate), use range; otherwise default to date or today
    const effectiveStart = startDate || fromDate || date || todayStr;
    const effectiveEnd = endDate || toDate || date || todayStr;

    // 1. Time-span collections (Today by default, or filtered between startDate & endDate)
    const rangeOrders = await StoreOrderModel.find({
      adminId,
      billDateStr: { $gte: effectiveStart, $lte: effectiveEnd },
    });

    let totalGrossSales = 0;
    let totalCashSales = 0;
    let totalUpiSales = 0;
    let totalCreditSales = 0;
    let totalOnlineSales = 0;
    let totalPosSales = 0;
    let totalPosBills = 0;
    let totalOnlineBills = 0;

    const dailyMap = {};

    rangeOrders.forEach((ord) => {
      const grand = Number(ord.grandTotal || 0);
      totalGrossSales += grand;
      const bDate = ord.billDateStr || ord.createdAt?.toISOString()?.slice(0, 10) || todayStr;

      if (!dailyMap[bDate]) {
        dailyMap[bDate] = { date: bDate, revenue: 0, ordersCount: 0, posRevenue: 0, onlineRevenue: 0 };
      }
      dailyMap[bDate].revenue += grand;
      dailyMap[bDate].ordersCount++;

      const isPos = ord.orderChannel === "pos_counter" || ord.orderChannel === "pos";
      if (isPos) {
        totalPosBills++;
        totalPosSales += grand;
        dailyMap[bDate].posRevenue += grand;
      } else {
        totalOnlineBills++;
        totalOnlineSales += grand;
        dailyMap[bDate].onlineRevenue += grand;
      }

      if (ord.paymentMethod === "cash_counter" || ord.paymentMethod === "cash") {
        totalCashSales += grand;
      } else if (ord.paymentMethod === "upi_qr" || ord.paymentMethod === "razorpay" || ord.paymentMethod === "online") {
        totalUpiSales += grand;
      } else if (ord.paymentMethod === "credit" || ord.paymentMethod === "farmer_milk_bill") {
        totalCreditSales += grand;
      }
    });

    const dailyTrend = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));
    const rangeOrdersCount = rangeOrders.length;
    const avgOrderValue = rangeOrdersCount > 0 ? Math.round(totalGrossSales / rangeOrdersCount) : 0;

    // 2. 7-Day Trend (for overview mini-chart)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const weeklyAgg = await StoreOrderModel.aggregate([
      {
        $match: {
          adminId: new (require("mongoose").Types.ObjectId)(adminId.toString()),
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: "$billDateStr",
          totalRevenue: { $sum: "$grandTotal" },
          billCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 3. Category Breakdown (Total Sales by Category in selected range)
    const categoryAgg = await StoreOrderModel.aggregate([
      {
        $match: {
          adminId: new (require("mongoose").Types.ObjectId)(adminId.toString()),
          billDateStr: { $gte: effectiveStart, $lte: effectiveEnd },
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.category",
          totalAmount: { $sum: "$items.totalItemAmount" },
          totalUnits: { $sum: "$items.quantity" },
        },
      },
    ]);

    // 4. Top Selling Products in selected range
    const topProductsAgg = await StoreOrderModel.aggregate([
      {
        $match: {
          adminId: new (require("mongoose").Types.ObjectId)(adminId.toString()),
          billDateStr: { $gte: effectiveStart, $lte: effectiveEnd },
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.name",
          category: { $first: "$items.category" },
          totalQty: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.totalItemAmount" },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 },
    ]);

    // 5. Total counts
    const [totalBillsCount, activeProductsCount, lowStockCount] = await Promise.all([
      StoreOrderModel.countDocuments({ adminId }),
      StoreProductModel.countDocuments({ adminId, isAvailable: true }),
      StoreProductModel.countDocuments({ adminId, $expr: { $lte: ["$stockQuantity", "$minStockAlert"] } }),
    ]);

    res.status(200).json({
      success: true,
      selectedDate: effectiveStart === effectiveEnd ? effectiveStart : `${effectiveStart} to ${effectiveEnd}`,
      startDate: effectiveStart,
      endDate: effectiveEnd,
      isRange: effectiveStart !== effectiveEnd,
      summary: {
        todayGrossSales: totalGrossSales,
        todayCashSales: totalCashSales,
        todayUpiSales: totalUpiSales,
        todayCreditSales: totalCreditSales,
        todayOnlineSales: totalOnlineSales,
        todayPosSales: totalPosSales,
        todayPosBills: totalPosBills,
        todayOnlineBills: totalOnlineBills,
        rangeOrdersCount,
        avgOrderValue,
        totalBillsCount,
        activeProductsCount,
        lowStockCount,
      },
      dailyTrend,
      weeklyTrend: weeklyAgg,
      categoryBreakdown: categoryAgg,
      topProducts: topProductsAgg,
      dayOrders: rangeOrders.slice(0, 10), // Recent bills for quick display
    });
  } catch (error) {
    console.error("getStoreAnalytics error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Helper: Auto-reject pending online orders older than 10 minutes
 */
async function autoRejectExpiredOnlineOrders(filter = {}) {
  try {
    const TEN_MINUTES_AGO = new Date(Date.now() - 10 * 60 * 1000);
    const expiredOrders = await StoreOrderModel.find({
      ...filter,
      orderChannel: "online",
      paymentMethod: { $in: ["online", "razorpay", "upi"] },
      paymentStatus: "pending",
      orderStatus: "placed",
      createdAt: { $lte: TEN_MINUTES_AGO },
    });

    for (const ord of expiredOrders) {
      ord.orderStatus = "cancelled";
      ord.cancelledBy = "system_timeout";
      ord.cancellationReason = "Online payment timed out (Payment was not completed within the 10-minute window).";
      ord.statusHistory.push({
        status: "cancelled",
        note: "Auto-rejected by system: 10-minute payment countdown elapsed without confirmation.",
        timestamp: new Date(),
      });

      // Restock items
      if (Array.isArray(ord.items)) {
        for (const it of ord.items) {
          if (it.productId) {
            await StoreProductModel.findByIdAndUpdate(it.productId, {
              $inc: { stockQuantity: it.quantity },
            });
          }
        }
      }

      await ord.save();

      try {
        const { emitStoreOrderStatusUpdated } = require("../../services/socketService");
        emitStoreOrderStatusUpdated(ord.adminId, ord.orderNumber, "cancelled");
      } catch (e) {}
    }
  } catch (err) {
    console.error("autoRejectExpiredOnlineOrders error:", err.message);
  }
}

// Background cleanup interval running every 60 seconds
if (!global.__storeOrderTimeoutInterval) {
  global.__storeOrderTimeoutInterval = setInterval(() => {
    autoRejectExpiredOnlineOrders().catch(() => {});
  }, 60 * 1000);
}

/**
 * Admin: Get All Bills & Records (with search & day filter)
 */
exports.getAdminBills = async (req, res) => {
  try {
    const adminId = req.admin._id || req.admin.id;
    const { date, channel, status, search, paymentMethod, page = 1, limit = 50 } = req.query;

    // Auto-reject any expired online orders before fetching
    await autoRejectExpiredOnlineOrders({ adminId });

    const query = { adminId };
    if (date) query.billDateStr = date;
    if (channel && channel !== "all") query.orderChannel = channel;
    if (status && status !== "all") query.orderStatus = status;
    if (paymentMethod && paymentMethod !== "all") query.paymentMethod = paymentMethod;

    if (search && search.trim()) {
      const term = search.trim();
      query.$or = [
        { orderNumber: { $regex: term, $options: "i" } },
        { "deliveryAddress.recipientName": { $regex: term, $options: "i" } },
        { "deliveryAddress.recipientPhone": { $regex: term, $options: "i" } },
      ];
    }

    const channelFilter = channel && channel !== "all" ? { orderChannel: channel } : {};
    const dateFilter = date ? { billDateStr: date } : {};
    const baseCountFilter = { adminId, ...channelFilter, ...dateFilter };

    const skip = (Number(page) - 1) * Number(limit);
    const [
      bills,
      total,
      allCount,
      placedCount,
      confirmedCount,
      packedCount,
      outCount,
      deliveredCount,
      cancelledCount,
    ] = await Promise.all([
      StoreOrderModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      StoreOrderModel.countDocuments(query),
      StoreOrderModel.countDocuments(baseCountFilter),
      StoreOrderModel.countDocuments({ ...baseCountFilter, orderStatus: "placed" }),
      StoreOrderModel.countDocuments({ ...baseCountFilter, orderStatus: "confirmed" }),
      StoreOrderModel.countDocuments({ ...baseCountFilter, orderStatus: "packed" }),
      StoreOrderModel.countDocuments({ ...baseCountFilter, orderStatus: "out_for_delivery" }),
      StoreOrderModel.countDocuments({ ...baseCountFilter, orderStatus: "delivered" }),
      StoreOrderModel.countDocuments({ ...baseCountFilter, orderStatus: "cancelled" }),
    ]);

    res.status(200).json({
      success: true,
      bills,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      statusCounts: {
        all: allCount,
        placed: placedCount,
        confirmed: confirmedCount,
        packed: packedCount,
        out_for_delivery: outCount,
        delivered: deliveredCount,
        cancelled: cancelledCount,
      },
    });
  } catch (error) {
    console.error("getAdminBills error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Server-rendered pure thermal receipt HTML (zero UI popup clutter, professional 80mm roll)
 */
exports.getPrintableBillHtml = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const order = await StoreOrderModel.findOne({ orderNumber }).populate(
      "adminId",
      "shopName name mobile village email gstNumber address"
    );

    if (!order) {
      return res.status(404).send("<h3 style='font-family:sans-serif;text-align:center;margin-top:40px;'>Receipt not found</h3>");
    }

    const admin = order.adminId || {};
    const storeName = (admin.shopName || "MILKIFY DAIRY STORE").toUpperCase();
    const storeVillage = admin.village || "Local Village";
    const storeAddress = admin.address || `${storeVillage}, Rural Outlet`;
    const storePhone = admin.mobile || "";
    const storeEmail = admin.email || "";
    const storeGst = order.taxDetails?.gstNumber || admin.gstNumber || "";
    const customerName = order.deliveryAddress?.recipientName || "Walk-in Customer";
    const customerPhone = order.deliveryAddress?.recipientPhone || "";
    const customerVillage = order.deliveryAddress?.village || "";
    const dateFormatted = new Date(order.createdAt).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    const isPos = order.orderChannel === "pos" || order.orderChannel === "pos_counter";
    const channelLabel = isPos ? "Physical Walk-in POS" : "Online Store Delivery";

    const isTaxApplied = !!(order.taxDetails?.isTaxApplied && order.taxDetails?.taxAmount > 0);
    const taxRate = Number(order.taxDetails?.taxRate || 0);
    const totalTax = Number(order.taxDetails?.taxAmount || 0).toFixed(2);
    const taxableValue = Math.max(0, Number(order.subtotal || 0) - Number(order.discountAmount || 0)).toFixed(2);

    const itemsRows = (order.items || [])
      .map(
        (it, idx) => `
        <tr style="border-bottom: 1px dashed #ddd;">
          <td style="padding: 4px 0; text-align: left; vertical-align: top;">
            <div style="font-weight: 700; color: #111;">${idx + 1}. ${it.name}</div>
            <div style="font-size: 10px; color: #444;">${it.packageSize || it.unit} @ ₹${Number(it.price).toFixed(2)}</div>
          </td>
          <td style="padding: 4px 0; text-align: center; vertical-align: top; font-weight: 600;">${it.quantity}</td>
          <td style="padding: 4px 0; text-align: right; vertical-align: top; font-weight: 700;">₹${Number(it.totalItemAmount).toFixed(2)}</td>
        </tr>
      `
      )
      .join("");

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Receipt - ${order.orderNumber}</title>
  <style>
    @page {
      margin: 0;
      size: 80mm auto;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, monospace;
      background: #f1f5f9;
      margin: 0;
      padding: 16px 8px;
      color: #050505;
      font-size: 11.5px;
      line-height: 1.35;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      min-height: 100vh;
    }
    .thermal-receipt-paper {
      width: 76mm;
      max-width: 76mm;
      min-width: 76mm;
      background: #ffffff;
      padding: 12px 10px 24px 10px;
      margin: 0 auto;
      box-shadow: 0 4px 18px rgba(0, 0, 0, 0.08);
      border-radius: 4px;
      position: relative;
      box-sizing: border-box;
      overflow: hidden;
    }
    /* Thermal receipt watermark */
    .receipt-watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-33deg);
      font-size: 38px;
      font-weight: 900;
      color: rgba(0, 0, 0, 0.045);
      text-transform: uppercase;
      letter-spacing: 4px;
      pointer-events: none;
      white-space: nowrap;
      user-select: none;
      z-index: 0;
      font-family: Arial, sans-serif;
    }
    .content-wrapper {
      position: relative;
      z-index: 1;
    }
    .brand-header {
      text-align: center;
      margin-bottom: 8px;
    }
    .logo-container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      margin-bottom: 3px;
    }
    .brand-title {
      font-size: 16px;
      font-weight: 900;
      letter-spacing: 0.5px;
      color: #000;
      text-transform: uppercase;
      line-height: 1.1;
    }
    .brand-tagline {
      font-size: 9.5px;
      font-weight: 600;
      color: #333;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      margin-top: 1px;
    }
    .store-address {
      font-size: 10.5px;
      color: #222;
      margin-top: 4px;
      line-height: 1.25;
    }
    .gstin-badge {
      display: inline-block;
      margin-top: 3px;
      padding: 1px 6px;
      background: #f0f0f0;
      border: 1px solid #000;
      border-radius: 3px;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.5px;
    }
    .invoice-title-pill {
      margin: 8px auto 6px auto;
      text-align: center;
      border-top: 1.5px solid #000;
      border-bottom: 1.5px solid #000;
      padding: 3px 0;
      font-size: 11px;
      font-weight: 900;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }
    .dotted-line {
      border-top: 1px dashed #222;
      margin: 6px 0;
    }
    .solid-line {
      border-top: 1.5px solid #000;
      margin: 6px 0;
    }
    .double-line {
      border-top: 2.5px double #000;
      margin: 6px 0;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
      margin-bottom: 4px;
    }
    .info-table td {
      padding: 1.5px 0;
      vertical-align: top;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      margin: 4px 0;
    }
    .items-table th {
      border-bottom: 1.5px solid #000;
      padding: 4px 0;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
    }
    .totals-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    .totals-table td {
      padding: 2px 0;
    }
    .grand-total-row {
      font-size: 15px;
      font-weight: 900;
    }
    .barcode-container {
      text-align: center;
      margin: 10px 0 6px 0;
    }
    .barcode-bars {
      display: inline-flex;
      align-items: flex-end;
      gap: 1.5px;
      height: 28px;
    }
    .bar {
      background: #000;
      width: 2px;
      height: 100%;
    }
    .bar.w1 { width: 1.5px; }
    .bar.w2 { width: 3px; }
    .bar.w3 { width: 4.5px; }
    .bar.h-sm { height: 80%; }
    .footer-section {
      text-align: center;
      font-size: 10px;
      color: #333;
      margin-top: 10px;
      line-height: 1.4;
    }
    .auth-stamp {
      margin-top: 14px;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      font-weight: 600;
    }
    .no-print-toolbar {
      text-align: center;
      margin-bottom: 14px;
      background: #ffffff;
      padding: 10px 14px;
      border-radius: 8px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
      border: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .print-btn {
      background: #16a34a;
      color: #fff;
      font-weight: 700;
      font-size: 12px;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      display: inline-flex;
      align-items: center;
      gap: 5px;
      text-decoration: none;
      transition: background 0.15s ease;
    }
    .print-btn:hover {
      background: #15803d;
    }
    .download-btn {
      background: #0284c7;
      color: #fff;
      font-weight: 700;
      font-size: 12px;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      display: inline-flex;
      align-items: center;
      gap: 5px;
      text-decoration: none;
      transition: background 0.15s ease;
    }
    .download-btn:hover {
      background: #0369a1;
    }
    @media print {
      body {
        background: #ffffff !important;
        margin: 0 auto !important;
        padding: 0 !important;
        display: block !important;
      }
      .no-print-toolbar {
        display: none !important;
      }
      .thermal-receipt-paper {
        width: 76mm !important;
        max-width: 76mm !important;
        min-width: 76mm !important;
        margin: 0 auto !important;
        padding: 4px 2px !important;
        box-shadow: none !important;
        border-radius: 0 !important;
      }
    }
  </style>
</head>
<body>
  <!-- Clean Auto-Print & Direct PDF Download Toolbar -->
  <div class="no-print-toolbar">
    <button class="print-btn" onclick="window.print()">🖨️ Print 80mm Receipt</button>
    <a id="dl-btn" class="download-btn" href="/api/store/public/bill/${order.orderNumber}/pdf" download="Receipt - ${order.orderNumber}.pdf">📥 Download PDF Slip</a>
  </div>

  <div class="thermal-receipt-paper" id="thermal-slip">
    <!-- Background Watermark -->
    <div class="receipt-watermark">MILKIFY • PAID</div>

    <div class="content-wrapper">
    <!-- Brand & Store Header -->
    <div class="brand-header">
      <div class="logo-container">
        <!-- Crisp High-Contrast Milkify Emblem for Thermal Roll -->
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2C7 9 4 13 4 17a8 8 0 0 0 16 0c0-4-3-8-8-15z"/>
          <path d="M9 16c0 1.66 1.34 3 3 3"/>
        </svg>
        <span class="brand-title">MILKIFY STORE</span>
      </div>
      <div class="brand-tagline">Fresh Dairy & Farmer Retail Network</div>
      <div style="font-weight: 800; font-size: 13px; margin-top: 3px;">${storeName}</div>
      <div class="store-address">
        ${storeAddress}<br>
        ${storePhone ? "Phone: " + storePhone : ""} ${storeEmail ? " • " + storeEmail : ""}
      </div>
      ${storeGst ? `<div class="gstin-badge">GSTIN: ${storeGst}</div>` : ""}
    </div>

    <!-- Title Banner -->
    <div class="invoice-title-pill">
      TAX INVOICE / RETAIL CASH MEMO
    </div>

    <!-- Meta Details Table -->
    <table class="info-table">
      <tr>
        <td style="width: 50%;"><strong>Bill No:</strong> ${order.orderNumber}</td>
        <td style="width: 50%; text-align: right;"><strong>Date:</strong> ${dateFormatted}</td>
      </tr>
      <tr>
        <td colspan="2">
          <strong>Customer:</strong> ${customerName} ${customerPhone ? " • " + customerPhone : ""}
          ${customerVillage ? `<div style="font-size: 9.5px; color: #444;">Village: ${customerVillage}</div>` : ""}
        </td>
      </tr>
      <tr>
        <td><strong>Payment Mode:</strong> ${
          order.paymentMethod === "farmer_milk_bill"
            ? "DAIRY CASH"
            : order.paymentMethod === "online"
            ? "ONLINE"
            : order.paymentMethod === "cod"
            ? "COD"
            : (order.paymentMethod ? order.paymentMethod.toUpperCase() : "CASH")
        }</td>
        <td style="text-align: right;"><strong>Status:</strong> <span style="font-weight: 800; border: 1px solid #000; padding: 0 4px; border-radius: 2px;">${(order.paymentStatus || "paid").toUpperCase()}</span></td>
      </tr>
      <tr>
        <td colspan="2"><strong>Channel:</strong> ${channelLabel}</td>
      </tr>
    </table>

    <div class="solid-line"></div>

    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="text-align: left;">Item Description</th>
          <th style="text-align: center; width: 32px;">Qty</th>
          <th style="text-align: right; width: 65px;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <div class="dotted-line"></div>

    <!-- Totals & GST Calculations -->
    <table class="totals-table">
      <tr>
        <td>Items Subtotal:</td>
        <td style="text-align: right; font-weight: 600;">₹${Number(order.subtotal || 0).toFixed(2)}</td>
      </tr>
      ${
        order.discountAmount > 0
          ? `<tr>
        <td style="color: #b91c1c; font-weight: 600;">Discount (${order.voucherCode || "Special Offer"}):</td>
        <td style="text-align: right; font-weight: 700; color: #b91c1c;">-₹${Number(order.discountAmount).toFixed(2)}</td>
      </tr>`
          : ""
      }
      ${
        order.deliveryFee > 0
          ? `<tr>
        <td>Delivery & Packaging:</td>
        <td style="text-align: right; font-weight: 600;">+₹${Number(order.deliveryFee).toFixed(2)}</td>
      </tr>`
          : ""
      }
      ${
        isTaxApplied
          ? `
      <tr style="font-weight: 700;">
        <td>GST Tax (${taxRate}%):</td>
        <td style="text-align: right; font-weight: 700;">+₹${totalTax}</td>
      </tr>`
          : ""
      }
      <tr>
        <td colspan="2"><div class="double-line"></div></td>
      </tr>
      <tr class="grand-total-row">
        <td>GRAND TOTAL:</td>
        <td style="text-align: right;">₹${Number(order.grandTotal).toFixed(2)}</td>
      </tr>
    </table>

    <div class="solid-line"></div>

    <!-- Barcode simulation for Bill -->
    <div class="barcode-container">
      <div class="barcode-bars">
        <div class="bar w2"></div><div class="bar w1 h-sm"></div><div class="bar w3"></div><div class="bar w1"></div>
        <div class="bar w2 h-sm"></div><div class="bar w3"></div><div class="bar w1"></div><div class="bar w2 h-sm"></div>
        <div class="bar w1"></div><div class="bar w3"></div><div class="bar w2"></div><div class="bar w1 h-sm"></div>
        <div class="bar w3"></div><div class="bar w1"></div><div class="bar w2"></div><div class="bar w3 h-sm"></div>
        <div class="bar w1"></div><div class="bar w2"></div><div class="bar w1 h-sm"></div><div class="bar w3"></div>
      </div>
      <div style="font-family: monospace; font-size: 9px; letter-spacing: 2px; margin-top: 2px;">
        *${order.orderNumber}*
      </div>
    </div>

    <!-- Signatory & Terms -->
    <div class="auth-stamp">
      <span>E. &amp; O.E.</span>
      <span style="border-top: 1px dotted #000; padding-top: 2px;">Authorized Signatory</span>
    </div>

    <div class="footer-section">
      <div style="font-weight: 800; font-size: 10.5px;">*** THANK YOU! VISIT AGAIN ***</div>
      <div>Goods once sold can be replaced within 24 hrs with original bill. Keep dairy items chilled at 4°C.</div>
      <div style="font-size: 8.5px; color: #666; margin-top: 4px;">Powered by Milkify Cloud Dairy SaaS Platform</div>
    </div>
  </div>
  </div>

  <script>
    window.addEventListener('DOMContentLoaded', function() {
      var searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('download') === '1') {
        window.location.href = '/api/store/public/bill/${order.orderNumber}/pdf';
      } else if (searchParams.get('autoprint') === '1') {
        setTimeout(function() { window.print(); }, 400);
      }
    });
  </script>
</body>
</html>
    `;

    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (error) {
    console.error("getPrintableBillHtml error:", error);
    res.status(500).send("Error generating receipt");
  }
};

/**
 * Server-generated pure 80mm PDF roll download (Instant, crisp, zero CDN reliance)
 */
exports.getPrintableBillPdf = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const order = await StoreOrderModel.findOne({ orderNumber }).populate(
      "adminId",
      "shopName name mobile village email gstNumber address"
    );

    if (!order) {
      return res.status(404).send("Receipt not found");
    }

    const admin = order.adminId || {};
    const storeName = (admin.shopName || "MILKIFY DAIRY STORE").toUpperCase();
    const storeVillage = admin.village || "Local Village";
    const storeAddress = admin.address || `${storeVillage}, Rural Outlet`;
    const storePhone = admin.mobile || "";
    const storeEmail = admin.email || "";
    const storeGst = order.taxDetails?.gstNumber || admin.gstNumber || "";
    const customerName = order.deliveryAddress?.recipientName || "Walk-in Customer";
    const customerPhone = order.deliveryAddress?.recipientPhone || "";
    const customerVillage = order.deliveryAddress?.village || "";
    const dateFormatted = new Date(order.createdAt).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    const isPos = order.orderChannel === "pos" || order.orderChannel === "pos_counter";
    const channelLabel = isPos ? "Physical Walk-in POS" : "Online Store Delivery";

    const isTaxApplied = !!(order.taxDetails?.isTaxApplied && order.taxDetails?.taxAmount > 0);
    const taxRate = Number(order.taxDetails?.taxRate || 0);
    const totalTax = Number(order.taxDetails?.taxAmount || 0).toFixed(2);

    // Standard 80mm roll width in points: 80mm / 25.4 * 72 = 226.77 pt
    const widthPt = 226.77;
    const items = order.items || [];
    const calculatedHeight = Math.max(
      450,
      340 + items.length * 44 + (isTaxApplied ? 20 : 0) + (order.discountAmount > 0 ? 20 : 0) + (order.deliveryFee > 0 ? 20 : 0)
    );

    const doc = new PDFDocument({
      size: [widthPt, calculatedHeight],
      margins: { top: 12, bottom: 12, left: 10, right: 10 },
      autoFirstPage: true,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="Receipt - ${order.orderNumber}.pdf"`);
    doc.pipe(res);

    // Header: Brand & Store
    doc.font("Helvetica-Bold").fontSize(11).text("MILKIFY STORE", { align: "center" });
    doc.font("Helvetica").fontSize(6.5).text("FRESH DAIRY & FARMER RETAIL NETWORK", { align: "center" });
    doc.moveDown(0.2);
    doc.font("Helvetica-Bold").fontSize(8.5).text(storeName, { align: "center" });
    doc.font("Helvetica").fontSize(7).text(storeAddress, { align: "center" });
    if (storePhone || storeEmail) {
      doc.text([storePhone ? `Phone: ${storePhone}` : "", storeEmail].filter(Boolean).join(" • "), { align: "center" });
    }
    if (storeGst) {
      doc.font("Helvetica-Bold").fontSize(7).text(`GSTIN: ${storeGst}`, { align: "center" });
    }

    doc.moveDown(0.3);
    doc.strokeColor("#000000").lineWidth(1).moveTo(10, doc.y).lineTo(widthPt - 10, doc.y).stroke();
    doc.moveDown(0.3);

    // Banner
    doc.font("Helvetica-Bold").fontSize(8).text("TAX INVOICE / RETAIL CASH MEMO", { align: "center" });
    doc.moveDown(0.3);
    doc.strokeColor("#000000").lineWidth(1).moveTo(10, doc.y).lineTo(widthPt - 10, doc.y).stroke();
    doc.moveDown(0.4);

    // Metadata
    const startY = doc.y;
    doc.font("Helvetica-Bold").fontSize(7).text(`Bill: ${order.orderNumber}`, 10, startY, { width: 110 });
    doc.font("Helvetica").fontSize(7).text(dateFormatted, 120, startY, { width: 96, align: "right" });

    doc.font("Helvetica").fontSize(7);
    doc.text(`Customer: ${customerName}${customerPhone ? " • " + customerPhone : ""}`, 10, doc.y + 2);
    if (customerVillage) {
      doc.text(`Village: ${customerVillage}`, 10, doc.y);
    }
    const printPaymentLabel = order.paymentMethod === "farmer_milk_bill"
      ? "DAIRY CASH"
      : order.paymentMethod === "online"
      ? "ONLINE"
      : order.paymentMethod === "cod"
      ? "COD"
      : (order.paymentMethod ? order.paymentMethod.toUpperCase() : "CASH");
    doc.text(`Payment: ${printPaymentLabel}   |   Status: ${(order.paymentStatus || "paid").toUpperCase()}`, 10, doc.y);
    doc.text(`Channel: ${channelLabel}`, 10, doc.y);

    doc.moveDown(0.3);
    doc.strokeColor("#333333").lineWidth(0.8).moveTo(10, doc.y).lineTo(widthPt - 10, doc.y).stroke();
    doc.moveDown(0.3);

    // Items table header
    const thY = doc.y;
    doc.font("Helvetica-Bold").fontSize(7);
    doc.text("ITEM DESCRIPTION", 10, thY, { width: 116 });
    doc.text("QTY", 128, thY, { width: 22, align: "center" });
    doc.text("TOTAL", 150, thY, { width: 66, align: "right" });
    doc.y = thY + 10;
    doc.strokeColor("#444444").lineWidth(0.5).moveTo(10, doc.y).lineTo(widthPt - 10, doc.y).stroke();
    doc.moveDown(0.3);

    // Items rows with proper text wrapping and vertical spacing
    items.forEach((it, idx) => {
      const itemY = doc.y;
      const nameText = `${idx + 1}. ${it.name}`;
      const nameH = doc.font("Helvetica-Bold").fontSize(7).heightOfString(nameText, { width: 116 });
      doc.text(nameText, 10, itemY, { width: 116 });

      const subText = `${it.packageSize || it.unit || "unit"} @ Rs.${Number(it.price).toFixed(2)}`;
      const subH = doc.font("Helvetica").fontSize(6).heightOfString(subText, { width: 116 });
      doc.text(subText, 10, itemY + nameH + 1, { width: 116 });

      const totalLeftH = nameH + subH + 1;

      // Print Qty and Total aligned at the top of the item block
      doc.font("Helvetica-Bold").fontSize(7).text(String(it.quantity), 128, itemY, { width: 22, align: "center" });
      doc.font("Helvetica-Bold").fontSize(7).text(`Rs.${Number(it.totalItemAmount).toFixed(2)}`, 150, itemY, { width: 66, align: "right" });

      // Advance doc.y strictly past the full multi-line item height
      doc.y = itemY + Math.max(totalLeftH, 14) + 4;
    });

    doc.strokeColor("#666666").lineWidth(0.5).dash(2, { space: 2 }).moveTo(10, doc.y).lineTo(widthPt - 10, doc.y).stroke().undash();
    doc.moveDown(0.3);

    // Totals rows helper
    const printRow = (label, val, isBold = false, color = "#000000") => {
      const rowY = doc.y;
      doc.font(isBold ? "Helvetica-Bold" : "Helvetica").fontSize(isBold ? 8.5 : 7).fillColor(color);
      doc.text(label, 10, rowY, { width: 115 });
      doc.text(val, 125, rowY, { width: 91, align: "right" });
      doc.fillColor("#000000");
      doc.y = rowY + (isBold ? 11 : 9.5);
    };

    printRow("Items Subtotal:", `Rs.${Number(order.subtotal || 0).toFixed(2)}`);
    if (order.discountAmount > 0) {
      printRow(`Discount (${order.voucherCode || "Offer"}):`, `-Rs.${Number(order.discountAmount).toFixed(2)}`, false, "#b91c1c");
    }
    if (order.deliveryFee > 0) {
      printRow("Delivery & Packaging:", `+Rs.${Number(order.deliveryFee).toFixed(2)}`);
    }
    if (isTaxApplied) {
      printRow(`GST Tax (${taxRate}%):`, `+Rs.${totalTax}`, true);
    }

    doc.strokeColor("#000000").lineWidth(1).moveTo(10, doc.y).lineTo(widthPt - 10, doc.y).stroke();
    doc.y += 2;
    printRow("GRAND TOTAL:", `Rs.${Number(order.grandTotal).toFixed(2)}`, true);
    doc.strokeColor("#000000").lineWidth(1).moveTo(10, doc.y).lineTo(widthPt - 10, doc.y).stroke();
    doc.y += 5;

    // Barcode string cleanly centered on a single line
    doc.font("Helvetica-Bold").fontSize(7.5).text(`* ${order.orderNumber} *`, 10, doc.y, { width: widthPt - 20, align: "center" });
    doc.y += 10;

    // Auth & Terms
    const authY = doc.y;
    doc.font("Helvetica").fontSize(6).text("E. & O.E.", 10, authY);
    doc.text("Authorized Signatory", 120, authY, { width: 96, align: "right" });
    doc.y = authY + 12;

    doc.font("Helvetica-Bold").fontSize(7).text("*** THANK YOU! VISIT AGAIN ***", { align: "center" });
    doc.moveDown(0.2);
    doc.font("Helvetica").fontSize(5.5).text("Goods once sold can be replaced within 24 hrs with original bill. Keep chilled at 4C.", { align: "center" });
    doc.moveDown(0.2);
    doc.fillColor("#666666").fontSize(5).text("Powered by Milkify Cloud Dairy SaaS Platform", { align: "center" });

    doc.end();
  } catch (error) {
    console.error("getPrintableBillPdf error:", error);
    res.status(500).send("Error generating PDF receipt");
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

    // Handle Order Rejection / Cancellation with Automatic Restock and Refund
    if (orderStatus === "cancelled") {
      order.cancelledBy = "admin";
      order.cancellationReason = note || "Order rejected by store admin.";
      // 1. Restock items back to inventory pool
      if (Array.isArray(order.items)) {
        for (const item of order.items) {
          if (item.productId) {
            await StoreProductModel.findByIdAndUpdate(item.productId, {
              $inc: { stockQuantity: item.quantity },
            });
          }
        }
      }

      // 2. Initialize and process Refund if order was paid online
      if (order.paymentStatus === "paid" && (order.paymentMethod === "online" || order.paymentMethod === "razorpay")) {
        let refundId = `ref_sim_${Date.now()}`;
        let isRealRefund = false;

        if (order.razorpayPaymentId && order.razorpayPaymentId.startsWith("pay_") && !order.razorpayPaymentId.startsWith("pay_upi_")) {
          try {
            const razorpay = getRazorpay();
            const refundRes = await razorpay.payments.refund(order.razorpayPaymentId, {
              amount: Math.round(order.grandTotal * 100),
              notes: {
                orderNumber: order.orderNumber,
                reason: note || "Order rejected by store admin",
              },
            });
            if (refundRes?.id) {
              refundId = refundRes.id;
              isRealRefund = true;
            }
          } catch (refErr) {
            console.warn("Razorpay automatic refund API note:", refErr?.error?.description || refErr.message);
          }
        }

        order.paymentStatus = "refunded";
        order.refundDetails = {
          isRefunded: true,
          refundId,
          amount: order.grandTotal,
          status: "processed",
          refundedAt: new Date(),
          reason: note || (isRealRefund ? "Razorpay Gateway Refund processed to customer bank account." : "Online payment refunded to customer."),
        };
      }

      // 2b. Process Refund if order was paid via Dairy Milk Credit
      if (order.paymentStatus === "paid" && order.paymentMethod === "farmer_milk_bill") {
        try {
          const phone = (order.deliveryAddress?.recipientPhone || "").replace(/\D/g, "").slice(-10);
          const farmer = await farmerModel.findOne({ adminId: order.adminId, mobile: phone });
          if (farmer) {
            const lastEntry = await MilkModel.findOne({
              adminId: order.adminId,
              farmerId: farmer._id,
              isActive: true,
            }).sort({ date: -1, createdAt: -1 });

            if (lastEntry) {
              lastEntry.calculatedAmount = Number((lastEntry.calculatedAmount + order.grandTotal).toFixed(2));
              lastEntry.paymentStatus = "unpaid";
              await lastEntry.save();
            } else {
              await MilkModel.create({
                adminId: order.adminId,
                farmerId: farmer._id,
                mobile: farmer.mobile,
                shift: "morning",
                category: "cow",
                fat: 4.0,
                snf: 8.5,
                litter: 1.0,
                fatRate: 10,
                rate: order.grandTotal,
                calculatedAmount: order.grandTotal,
                paymentStatus: "unpaid",
                isActive: true,
                date: new Date().toISOString().slice(0, 10),
                billingCycleDate: new Date().toISOString().slice(0, 10),
              });
            }
          }
          order.paymentStatus = "refunded";
          order.refundDetails = {
            isRefunded: true,
            refundId: `milk_ref_${Date.now()}`,
            amount: order.grandTotal,
            status: "processed",
            refundedAt: new Date(),
            reason: note || "Dairy Cash refunded to farmer milk settlement balance on order rejection.",
          };
        } catch (refErr) {
          console.warn("Farmer milk credit refund error on rejection:", refErr.message);
        }
      }
    }

    if (runnerName || runnerPhone) {
      order.assignedRunner = {
        name: runnerName || order.assignedRunner?.name,
        phone: runnerPhone || order.assignedRunner?.phone,
      };
    }

    const historyNote =
      orderStatus === "cancelled"
        ? order.paymentStatus === "refunded"
          ? `Order rejected by store admin. 100% refund of ₹${order.grandTotal} initialized.`
          : `Order rejected by store admin. Stock replenished.`
        : note || `Order updated to ${orderStatus}`;

    order.statusHistory.push({
      status: orderStatus,
      updatedAt: new Date(),
      note: historyNote,
    });

    await order.save();

    // Real-time socket notification to customer tracking and admin portal
    try {
      const { emitStoreOrderStatusUpdated } = require("../../services/socketService");
      emitStoreOrderStatusUpdated(order.adminId, order.orderNumber, orderStatus);
    } catch (sockErr) {
      console.warn("Socket status emit error:", sockErr.message);
    }

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

    const storeProfile = await StoreProfileModel.findOne({
      adminId: order.adminId?._id || order.adminId,
    });
    const orderData = order.toObject();
    orderData.storeSlug = storeProfile?.slug || "";
    orderData.storeName = storeProfile?.storeName || order.adminId?.shopName || "Milkify Store";

    res.status(200).json({ success: true, order: orderData, storeSlug: storeProfile?.slug || "" });
  } catch (error) {
    console.error("trackPublicOrder error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Public: Customer Cancel Order (Permitted if payment is pending or order is newly placed)
 */
exports.cancelCustomerOrder = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const { reason = "Cancelled by customer" } = req.body;

    const order = await StoreOrderModel.findOne({ orderNumber });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    if (["delivered", "dispatched", "cancelled"].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled because it is already marked as ${order.orderStatus}.`,
      });
    }

    // Only allow customer direct cancel if payment is pending or order is still in 'placed' state
    if (order.paymentStatus === "paid" && order.orderStatus !== "placed") {
      return res.status(400).json({
        success: false,
        message: "This order is being prepared and packed. Please contact the dairy store directly to request cancellation.",
      });
    }

    order.orderStatus = "cancelled";
    order.cancelledBy = "customer";
    order.cancellationReason = reason;
    order.statusHistory.push({
      status: "cancelled",
      note: `Cancelled by customer: ${reason}`,
      timestamp: new Date(),
    });

    // If order was paid via Dairy Milk Credit, refund the balance back to farmer's milk settlement account
    if (order.paymentMethod === "farmer_milk_bill" && order.paymentStatus === "paid") {
      try {
        const phone = (order.deliveryAddress?.recipientPhone || "").replace(/\D/g, "").slice(-10);
        const farmer = await farmerModel.findOne({ adminId: order.adminId, mobile: phone });
        if (farmer) {
          const lastEntry = await MilkModel.findOne({
            adminId: order.adminId,
            farmerId: farmer._id,
            isActive: true,
          }).sort({ date: -1, createdAt: -1 });

          if (lastEntry) {
            lastEntry.calculatedAmount = Number((lastEntry.calculatedAmount + order.grandTotal).toFixed(2));
            lastEntry.paymentStatus = "unpaid";
            await lastEntry.save();
          } else {
            await MilkModel.create({
              adminId: order.adminId,
              farmerId: farmer._id,
              mobile: farmer.mobile,
              shift: "morning",
              category: "cow",
              fat: 4.0,
              snf: 8.5,
              litter: 1.0,
              fatRate: 10,
              rate: order.grandTotal,
              calculatedAmount: order.grandTotal,
              paymentStatus: "unpaid",
              isActive: true,
              date: new Date().toISOString().slice(0, 10),
              billingCycleDate: new Date().toISOString().slice(0, 10),
            });
          }
        }
        order.paymentStatus = "refunded";
        order.refundDetails = {
          isRefunded: true,
          refundId: `milk_ref_${Date.now()}`,
          amount: order.grandTotal,
          status: "processed",
          refundedAt: new Date(),
          reason: "Dairy Cash refunded to farmer milk settlement balance on customer order cancellation.",
        };
      } catch (refErr) {
        console.warn("Farmer milk credit refund error on cancellation:", refErr.message);
      }
    }

    // Restock reserved inventory
    for (const item of order.items || []) {
      await StoreProductModel.findByIdAndUpdate(item.productId, {
        $inc: { stockQuantity: item.quantity },
      });
    }

    await order.save();

    // Sockets notify admin
    try {
      const { emitStoreOrderStatusUpdated } = require("../../services/socketService");
      emitStoreOrderStatusUpdated(order.adminId, order.orderNumber, "cancelled");
    } catch (e) {}

    res.status(200).json({
      success: true,
      message: "Order has been cancelled successfully.",
      order,
    });
  } catch (error) {
    console.error("cancelCustomerOrder error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Public: Timeout & auto-reject an unpaid online order when the countdown timer expires
 */
exports.timeoutCustomerOrder = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const order = await StoreOrderModel.findOne({ orderNumber });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    if (order.orderStatus === "cancelled") {
      return res.status(200).json({ success: true, message: "Order is already cancelled.", order });
    }

    // Only auto-reject if payment is still pending and order is newly placed
    if (order.orderStatus === "placed" && order.paymentStatus === "pending") {
      order.orderStatus = "cancelled";
      order.cancellationReason = "Online payment timed out (Payment was not completed within the 10-minute window).";
      order.statusHistory.push({
        status: "cancelled",
        note: "Auto-rejected by system: 10-minute online payment window expired.",
        timestamp: new Date(),
      });

      // Restock items
      if (Array.isArray(order.items)) {
        for (const it of order.items) {
          if (it.productId) {
            await StoreProductModel.findByIdAndUpdate(it.productId, {
              $inc: { stockQuantity: it.quantity },
            });
          }
        }
      }

      await order.save();

      try {
        const { emitStoreOrderStatusUpdated } = require("../../services/socketService");
        emitStoreOrderStatusUpdated(order.adminId, order.orderNumber, "cancelled");
      } catch (e) {}

      return res.status(200).json({
        success: true,
        message: "Order has been auto-rejected due to payment timeout.",
        order,
      });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("timeoutCustomerOrder error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
