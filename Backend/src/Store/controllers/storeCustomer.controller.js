const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const StoreCustomerModel = require("../models/storeCustomer.model");
const StoreProfileModel = require("../models/storeProfile.model");
const StoreOrderModel = require("../models/storeOrder.model");

const JWT_SECRET = process.env.JWT_SECRET || "milkify_secret_key_2026";

/**
 * Register a new Store Customer
 */
exports.registerCustomer = async (req, res) => {
  try {
    const { slug, name, mobile, email, password, village, fullAddress, landmark } = req.body;

    if (!name || !mobile) {
      return res.status(400).json({ success: false, message: "Name and Mobile number are required" });
    }

    const cleanMobile = mobile.replace(/\D/g, "").slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      return res.status(400).json({ success: false, message: "Please provide a valid 10-digit Indian mobile number" });
    }

    let adminId = null;
    let storeVillage = village || "Main Village";
    if (slug) {
      const profile = await StoreProfileModel.findOne({ slug: slug.toLowerCase() });
      if (profile) {
        adminId = profile.adminId;
        if (!village) storeVillage = profile.village;
      }
    }

    if (!adminId) {
      const defaultProfile = await StoreProfileModel.findOne();
      if (defaultProfile) {
        adminId = defaultProfile.adminId;
        if (!village) storeVillage = defaultProfile.village;
      }
    }

    // Check existing customer
    let existing = await StoreCustomerModel.findOne({
      ...(adminId ? { adminId } : {}),
      mobile: cleanMobile,
    });

    if (existing && existing.password) {
      return res.status(400).json({
        success: false,
        message: "An account already exists with this mobile number. Please log in.",
      });
    }

    let hashedPassword = "";
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    let customer;
    if (existing) {
      existing.name = name.trim();
      if (email) existing.email = email.trim().toLowerCase();
      if (hashedPassword) existing.password = hashedPassword;
      if (village) existing.village = village.trim();
      if (fullAddress) {
        existing.savedAddresses = [
          {
            label: "Home",
            recipientName: name.trim(),
            recipientPhone: cleanMobile,
            village: village || storeVillage,
            landmark: landmark || "",
            fullAddress: fullAddress.trim(),
            isDefault: true,
          },
        ];
      }
      customer = await existing.save();
    } else {
      customer = await StoreCustomerModel.create({
        adminId,
        name: name.trim(),
        mobile: cleanMobile,
        email: email ? email.trim().toLowerCase() : "",
        password: hashedPassword,
        village: village ? village.trim() : storeVillage,
        savedAddresses: fullAddress
          ? [
              {
                label: "Home",
                recipientName: name.trim(),
                recipientPhone: cleanMobile,
                village: village || storeVillage,
                landmark: landmark || "",
                fullAddress: fullAddress.trim(),
                isDefault: true,
              },
            ]
          : [],
      });
    }

    const token = jwt.sign(
      { id: customer._id, role: "StoreCustomer", mobile: customer.mobile, adminId: customer.adminId },
      JWT_SECRET,
      { expiresIn: "90d" }
    );

    res.status(201).json({
      success: true,
      message: "Customer account created successfully!",
      token,
      customer: {
        _id: customer._id,
        name: customer.name,
        mobile: customer.mobile,
        email: customer.email,
        village: customer.village,
        savedAddresses: customer.savedAddresses,
      },
    });
  } catch (error) {
    console.error("registerCustomer error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Customer Login (by Mobile & Password or Quick Login)
 */
exports.loginCustomer = async (req, res) => {
  try {
    const { identifier, password, slug } = req.body;

    if (!identifier) {
      return res.status(400).json({ success: false, message: "Mobile number or email is required" });
    }

    const cleanInput = identifier.trim().toLowerCase();
    const cleanMobile = cleanInput.replace(/\D/g, "").slice(-10);

    const query = {
      $or: [{ mobile: cleanMobile }, { email: cleanInput }],
    };

    const customer = await StoreCustomerModel.findOne(query);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "No customer account found with this mobile or email. Please sign up.",
      });
    }

    if (customer.status === "blocked") {
      return res.status(403).json({ success: false, message: "Your account is temporarily suspended." });
    }

    // If customer has a password set, verify it
    if (customer.password && password) {
      const isMatch = await bcrypt.compare(password, customer.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: "Incorrect password. Please try again." });
      }
    } else if (customer.password && !password) {
      return res.status(400).json({ success: false, message: "Password is required to sign in." });
    }

    const token = jwt.sign(
      { id: customer._id, role: "StoreCustomer", mobile: customer.mobile, adminId: customer.adminId },
      JWT_SECRET,
      { expiresIn: "90d" }
    );

    res.status(200).json({
      success: true,
      message: "Signed in successfully!",
      token,
      customer: {
        _id: customer._id,
        name: customer.name,
        mobile: customer.mobile,
        email: customer.email,
        village: customer.village,
        savedAddresses: customer.savedAddresses,
        loyaltyPoints: customer.loyaltyPoints || 0,
      },
    });
  } catch (error) {
    console.error("loginCustomer error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get Customer Profile (Auto-loads saved addresses for checkout)
 */
exports.getCustomerProfile = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const customer = await StoreCustomerModel.findById(decoded.id).select("-password");
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    res.status(200).json({
      success: true,
      customer,
    });
  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid or expired session. Please sign in again." });
  }
};

/**
 * Get Customer Order History
 */
exports.getCustomerOrders = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let customerId = null;
    let customerMobile = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        customerId = decoded.id;
        customerMobile = decoded.mobile;
      } catch (e) {}
    }

    // Support query fallback e.g. ?mobile=1234567890 if guest wants to view history
    if (!customerMobile && req.query.mobile) {
      customerMobile = req.query.mobile.replace(/\D/g, "").slice(-10);
    }

    if (!customerId && !customerMobile) {
      return res.status(400).json({ success: false, message: "Customer identification required to view orders" });
    }

    const query = {
      $or: [
        ...(customerId ? [{ customerId }] : []),
        ...(customerMobile
          ? [
              { "deliveryAddress.recipientPhone": customerMobile },
              { "customerDetails.mobile": customerMobile },
            ]
          : []),
      ],
    };

    const orders = await StoreOrderModel.find(query).sort({ createdAt: -1 }).limit(50);

    res.status(200).json({
      success: true,
      orders,
      total: orders.length,
    });
  } catch (error) {
    console.error("getCustomerOrders error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update Customer Profile
 */
exports.updateCustomerProfile = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const { name, email, village, savedAddresses } = req.body;
    const updates = {};
    if (name) updates.name = name.trim();
    if (email) updates.email = email.trim().toLowerCase();
    if (village) updates.village = village.trim();
    if (Array.isArray(savedAddresses)) updates.savedAddresses = savedAddresses;

    const updated = await StoreCustomerModel.findByIdAndUpdate(decoded.id, { $set: updates }, { new: true }).select(
      "-password"
    );

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      customer: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
