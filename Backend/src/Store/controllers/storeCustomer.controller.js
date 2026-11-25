const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const StoreCustomerModel = require("../models/storeCustomer.model");
const StoreProfileModel = require("../models/storeProfile.model");
const StoreOrderModel = require("../models/storeOrder.model");
const { AdminModel } = require("../../Admin/admin.model");
const { farmerModel } = require("../../Farmer/farmer.model");
const { MilkModel } = require("../../Milk/milk.model");

const JWT_SECRET = process.env.JWT_SECRET || "milkify_secret_key_2026";

/**
 * Helper: Calculate real-time unsettled dairy milk credit balance for a farmer
 */
async function getFarmerMilkCredit(adminId, mobile) {
  try {
    if (!mobile) return { isFarmer: false, creditBalance: 0 };
    const cleanMobile = mobile.replace(/\D/g, "").slice(-10);
    const farmer = await farmerModel.findOne({
      ...(adminId ? { adminId } : {}),
      mobile: cleanMobile,
    });
    if (!farmer) return { isFarmer: false, creditBalance: 0 };

    const unpaidEntries = await MilkModel.aggregate([
      {
        $match: {
          adminId: farmer.adminId,
          farmerId: farmer._id,
          paymentStatus: { $ne: "paid" },
          isActive: true,
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$calculatedAmount" },
          totalLiters: { $sum: "$litter" },
          entriesCount: { $sum: 1 },
        },
      },
    ]);

    const creditBalance = unpaidEntries[0]?.totalAmount ? Math.round(unpaidEntries[0].totalAmount) : 0;
    const totalLiters = unpaidEntries[0]?.totalLiters ? Number(unpaidEntries[0].totalLiters.toFixed(1)) : 0;

    return {
      isFarmer: true,
      farmerId: farmer._id,
      memberId: farmer.memberId || "",
      name: farmer.name,
      creditBalance,
      totalLiters,
    };
  } catch (err) {
    console.error("getFarmerMilkCredit error:", err);
    return { isFarmer: false, creditBalance: 0 };
  }
}
exports.getFarmerMilkCredit = getFarmerMilkCredit;

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

    // If matching Admin exists, sync initial profile photo and details
    if (!customer.profilePhoto) {
      try {
        const matchingAdmin = await AdminModel.findOne({ mobile: cleanMobile });
        if (matchingAdmin?.profilePhoto) {
          customer.profilePhoto = matchingAdmin.profilePhoto;
          await StoreCustomerModel.findByIdAndUpdate(customer._id, { profilePhoto: matchingAdmin.profilePhoto });
        }
      } catch (e) {}
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
        profilePhoto: customer.profilePhoto || "",
        savedAddresses: customer.savedAddresses,
      },
    });
  } catch (error) {
    console.error("registerCustomer error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Customer Login (Supports both regular store customers & existing Dairy Farmers)
 */
exports.loginCustomer = async (req, res) => {
  try {
    const { identifier, password, slug } = req.body;

    if (!identifier) {
      return res.status(400).json({ success: false, message: "Mobile number or email is required" });
    }

    const cleanInput = identifier.trim().toLowerCase();
    const cleanMobile = cleanInput.replace(/\D/g, "").slice(-10);

    let storeAdminId = null;
    let storeProfile = null;
    if (slug) {
      storeProfile = await StoreProfileModel.findOne({ slug: slug.toLowerCase() });
      if (storeProfile) storeAdminId = storeProfile.adminId;
    }
    if (!storeAdminId) {
      storeProfile = await StoreProfileModel.findOne();
      if (storeProfile) storeAdminId = storeProfile.adminId;
    }

    const query = {
      $or: [
        ...(cleanMobile.length === 10 ? [{ mobile: cleanMobile }] : []),
        { email: cleanInput },
      ],
    };

    let customer = await StoreCustomerModel.findOne(query);

    // If not found in StoreCustomer, check if this is an existing Dairy Farmer!
    if (!customer && cleanMobile.length === 10) {
      const farmer = await farmerModel.findOne({
        ...(storeAdminId ? { adminId: storeAdminId } : {}),
        $or: [
          { mobile: cleanMobile },
          { memberId: cleanInput.toUpperCase() },
        ],
      });

      if (farmer) {
        // Validate password against farmer record if password provided
        if (password) {
          let isMatch = false;
          if (farmer.password && (await bcrypt.compare(password, farmer.password))) {
            isMatch = true;
          } else if (farmer.key && farmer.key === password) {
            isMatch = true;
          } else if (farmer.mobile && farmer.mobile.slice(-4) === password) {
            isMatch = true;
          }

          if (!isMatch) {
            return res.status(400).json({
              success: false,
              message: "Incorrect password for registered Dairy Farmer account.",
            });
          }
        }

        // Auto-provision StoreCustomer account linked to Dairy Farmer
        customer = await StoreCustomerModel.create({
          adminId: farmer.adminId,
          name: farmer.name,
          mobile: farmer.mobile,
          email: farmer.email || `${farmer.mobile}@milkify.in`,
          village: farmer.village || storeProfile?.village || "Main Village",
          savedAddresses: [
            {
              label: "Farm / Dairy Address",
              recipientName: farmer.name,
              recipientPhone: farmer.mobile,
              village: farmer.village || storeProfile?.village || "Main Village",
              fullAddress: `${farmer.village || "Dairy Outlet Area"}, Member ID: ${farmer.memberId || "FAR"}`,
              isDefault: true,
            },
          ],
        });
      }
    }

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "No customer or dairy farmer account found. Please sign up or check your mobile number.",
      });
    }

    if (customer.status === "blocked") {
      return res.status(403).json({ success: false, message: "Your account is temporarily suspended." });
    }

    // If customer has a password set and password is provided, verify it
    if (customer.password && password) {
      const isMatch = await bcrypt.compare(password, customer.password);
      if (!isMatch) {
        // Also check farmer fallback
        const farmer = await farmerModel.findOne({ mobile: customer.mobile });
        let farmerMatch = false;
        if (farmer) {
          if (farmer.password && (await bcrypt.compare(password, farmer.password))) farmerMatch = true;
          else if (farmer.key && farmer.key === password) farmerMatch = true;
          else if (farmer.mobile && farmer.mobile.slice(-4) === password) farmerMatch = true;
        }
        if (!farmerMatch) {
          return res.status(400).json({ success: false, message: "Incorrect password. Please try again." });
        }
      }
    } else if (customer.password && !password) {
      return res.status(400).json({ success: false, message: "Password is required to sign in." });
    }

    // Bi-directional check: If customer profile photo missing, sync from Admin record if user is an Admin
    if (!customer.profilePhoto) {
      try {
        const matchingAdmin = await AdminModel.findOne({ mobile: customer.mobile });
        if (matchingAdmin?.profilePhoto) {
          customer.profilePhoto = matchingAdmin.profilePhoto;
          await StoreCustomerModel.findByIdAndUpdate(customer._id, { profilePhoto: matchingAdmin.profilePhoto });
        }
      } catch (e) {}
    }

    // Fetch real-time dairy milk credit balance
    const farmerCredit = await getFarmerMilkCredit(customer.adminId || storeAdminId, customer.mobile);

    const token = jwt.sign(
      { id: customer._id, role: "StoreCustomer", mobile: customer.mobile, adminId: customer.adminId || storeAdminId },
      JWT_SECRET,
      { expiresIn: "90d" }
    );

    res.status(200).json({
      success: true,
      message: farmerCredit.isFarmer
        ? `Welcome Dairy Farmer ${farmerCredit.name}! Milk Credit of ₹${farmerCredit.creditBalance} linked.`
        : "Signed in successfully!",
      token,
      customer: {
        _id: customer._id,
        name: customer.name,
        mobile: customer.mobile,
        email: customer.email,
        village: customer.village,
        profilePhoto: customer.profilePhoto || "",
        savedAddresses: customer.savedAddresses,
        loyaltyPoints: customer.loyaltyPoints || 0,
        farmerCredit,
      },
    });
  } catch (error) {
    console.error("loginCustomer error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get Customer Profile (Auto-loads saved addresses & fresh Dairy Milk Credit)
 */
exports.getCustomerProfile = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const customer = await StoreCustomerModel.findById(decoded.id).select("-password").lean();
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    // Bi-directional check: If customer profile photo missing, sync from Admin record if user is an Admin
    if (!customer.profilePhoto && customer.mobile) {
      try {
        const matchingAdmin = await AdminModel.findOne({ mobile: customer.mobile });
        if (matchingAdmin?.profilePhoto) {
          customer.profilePhoto = matchingAdmin.profilePhoto;
          await StoreCustomerModel.findByIdAndUpdate(customer._id, { profilePhoto: matchingAdmin.profilePhoto });
        }
      } catch (e) {}
    }

    // Realtime Farmer Milk Credit check
    const farmerCredit = await getFarmerMilkCredit(customer.adminId || decoded.adminId, customer.mobile);
    customer.farmerCredit = farmerCredit;

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
      } catch (e) { }
    }

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
 * Update Customer Profile (Allows updating Name, Mobile, Email, Village & Addresses)
 */
exports.updateCustomerProfile = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const { name, mobile, email, village, fullAddress, landmark, savedAddresses, profilePhoto } = req.body;
    const updates = {};
    if (name) updates.name = name.trim();
    if (email !== undefined) updates.email = email.trim().toLowerCase();
    if (village) updates.village = village.trim();
    if (profilePhoto !== undefined) updates.profilePhoto = profilePhoto;
    if (mobile) {
      const cleanMobile = mobile.replace(/\D/g, "").slice(-10);
      if (/^[6-9]\d{9}$/.test(cleanMobile)) {
        updates.mobile = cleanMobile;
      }
    }

    if (Array.isArray(savedAddresses) && savedAddresses.length > 0) {
      updates.savedAddresses = savedAddresses;
    } else if (fullAddress) {
      updates.savedAddresses = [
        {
          label: "Primary Delivery Address",
          recipientName: name || "Customer",
          recipientPhone: mobile || decoded.mobile,
          village: village || "",
          landmark: landmark || "",
          fullAddress: fullAddress.trim(),
          isDefault: true,
        },
      ];
    }

    const updated = await StoreCustomerModel.findByIdAndUpdate(
      decoded.id,
      { $set: updates },
      { new: true }
    ).select("-password").lean();

    if (!updated) {
      return res.status(404).json({ success: false, message: "Customer not found." });
    }

    // Bi-directional synchronization: if customer is also a dairy admin, sync updates to AdminModel & StoreProfileModel
    const syncMobile = updates.mobile || updated.mobile || decoded.mobile;
    if (syncMobile) {
      const cleanMobile = syncMobile.replace(/\D/g, "").slice(-10);
      if (cleanMobile.length === 10) {
        try {
          const matchingAdmin = await AdminModel.findOne({ mobile: cleanMobile });
          if (matchingAdmin) {
            const adminUpdates = {};
            if (updates.name) adminUpdates.name = updates.name;
            if (updates.email) adminUpdates.email = updates.email;
            if (updates.village) adminUpdates.village = updates.village;
            if (updates.profilePhoto !== undefined) adminUpdates.profilePhoto = updates.profilePhoto;

            if (Object.keys(adminUpdates).length > 0) {
              await AdminModel.findByIdAndUpdate(matchingAdmin._id, { $set: adminUpdates });
              if (adminUpdates.profilePhoto !== undefined) {
                await StoreProfileModel.findOneAndUpdate(
                  { adminId: matchingAdmin._id },
                  { ownerPhoto: adminUpdates.profilePhoto }
                );
              }
            }
          }
          if (updates.profilePhoto !== undefined) {
            await StoreCustomerModel.updateMany(
              { mobile: cleanMobile, _id: { $ne: decoded.id } },
              { $set: { profilePhoto: updates.profilePhoto } }
            );
          }
        } catch (syncErr) {
          console.error("[Sync] Customer to Admin sync error:", syncErr.message);
        }
      }
    }

    const farmerCredit = await getFarmerMilkCredit(updated.adminId || decoded.adminId, updated.mobile);
    updated.farmerCredit = farmerCredit;

    res.status(200).json({
      success: true,
      message: "Profile updated successfully!",
      customer: updated,
    });
  } catch (error) {
    console.error("updateCustomerProfile error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Upload / Update Customer Profile Photo (Accepts file upload or Base64 in JSON)
 * Bi-directionally syncs with AdminModel and StoreProfileModel if mobile matches an Admin.
 */
exports.uploadCustomerPhoto = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    let photoUrl = "";
    if (req.file) {
      try {
        const { uploadToS3 } = require("../../services/s3.service");
        photoUrl = await uploadToS3(req.file.buffer, req.file.originalname, "customers/profiles");
      } catch (s3Err) {
        const mime = req.file.mimetype || "image/jpeg";
        photoUrl = `data:${mime};base64,${req.file.buffer.toString("base64")}`;
      }
    } else if (req.body.photo || req.body.profilePhoto) {
      photoUrl = req.body.photo || req.body.profilePhoto;
    }

    if (!photoUrl) {
      return res.status(400).json({ success: false, message: "No photo file or image data provided" });
    }

    const updated = await StoreCustomerModel.findByIdAndUpdate(
      decoded.id,
      { profilePhoto: photoUrl },
      { new: true }
    ).select("-password").lean();

    if (!updated) {
      return res.status(404).json({ success: false, message: "Customer account not found" });
    }

    // Bi-directional sync with AdminModel & StoreProfileModel
    const cleanMobile = (updated.mobile || decoded.mobile || "").replace(/\D/g, "").slice(-10);
    if (cleanMobile.length === 10) {
      try {
        const matchingAdmin = await AdminModel.findOne({ mobile: cleanMobile });
        if (matchingAdmin) {
          await AdminModel.findByIdAndUpdate(matchingAdmin._id, { profilePhoto: photoUrl });
          await StoreProfileModel.findOneAndUpdate(
            { adminId: matchingAdmin._id },
            { ownerPhoto: photoUrl }
          );
        }
        await StoreCustomerModel.updateMany(
          { mobile: cleanMobile, _id: { $ne: decoded.id } },
          { profilePhoto: photoUrl }
        );
      } catch (syncErr) {
        console.error("[Sync] uploadCustomerPhoto sync error:", syncErr.message);
      }
    }

    const farmerCredit = await getFarmerMilkCredit(updated.adminId || decoded.adminId, updated.mobile);
    updated.farmerCredit = farmerCredit;

    return res.status(200).json({
      success: true,
      message: "Profile photo updated successfully!",
      profilePhoto: photoUrl,
      customer: updated,
    });
  } catch (error) {
    console.error("uploadCustomerPhoto error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete Customer Profile Photo
 */
exports.deleteCustomerPhoto = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const updated = await StoreCustomerModel.findByIdAndUpdate(
      decoded.id,
      { profilePhoto: "" },
      { new: true }
    ).select("-password").lean();

    if (!updated) {
      return res.status(404).json({ success: false, message: "Customer account not found" });
    }

    const cleanMobile = (updated.mobile || decoded.mobile || "").replace(/\D/g, "").slice(-10);
    if (cleanMobile.length === 10) {
      try {
        const matchingAdmin = await AdminModel.findOne({ mobile: cleanMobile });
        if (matchingAdmin) {
          await AdminModel.findByIdAndUpdate(matchingAdmin._id, { profilePhoto: "" });
          await StoreProfileModel.findOneAndUpdate(
            { adminId: matchingAdmin._id },
            { ownerPhoto: "" }
          );
        }
        await StoreCustomerModel.updateMany(
          { mobile: cleanMobile, _id: { $ne: decoded.id } },
          { profilePhoto: "" }
        );
      } catch (syncErr) {
        console.error("[Sync] deleteCustomerPhoto sync error:", syncErr.message);
      }
    }

    const farmerCredit = await getFarmerMilkCredit(updated.adminId || decoded.adminId, updated.mobile);
    updated.farmerCredit = farmerCredit;

    return res.status(200).json({
      success: true,
      message: "Profile photo removed",
      profilePhoto: "",
      customer: updated,
    });
  } catch (error) {
    console.error("deleteCustomerPhoto error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Authenticated: Change / Set Password for Store Customer & Linked Dairy Farmer
 */
exports.changeCustomerPassword = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ success: false, message: "New password must be at least 4 characters long" });
    }

    const customer = await StoreCustomerModel.findById(decoded.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer account not found" });
    }

    // If customer already has a password, verify current password
    if (customer.password && currentPassword) {
      const isMatch = await bcrypt.compare(currentPassword, customer.password);
      if (!isMatch) {
        // Also check if current matches farmer key or mobile slice
        const farmer = await farmerModel.findOne({ mobile: customer.mobile });
        let farmerMatch = false;
        if (farmer) {
          if (farmer.password && (await bcrypt.compare(currentPassword, farmer.password))) farmerMatch = true;
          else if (farmer.key && farmer.key === currentPassword) farmerMatch = true;
          else if (farmer.mobile && farmer.mobile.slice(-4) === currentPassword) farmerMatch = true;
        }
        if (!farmerMatch) {
          return res.status(400).json({ success: false, message: "Current password does not match" });
        }
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    customer.password = hashedPassword;
    await customer.save();

    // Also sync password to linked Dairy Farmer in farmerModel so both credentials stay unified!
    try {
      const farmer = await farmerModel.findOne({ mobile: customer.mobile });
      if (farmer) {
        farmer.password = hashedPassword;
        await farmer.save();
      }
    } catch (e) {
      console.warn("Farmer password sync note:", e.message);
    }

    res.status(200).json({
      success: true,
      message: "Password updated successfully! You can now log in with your new credentials.",
    });
  } catch (error) {
    console.error("changeCustomerPassword error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Public: Reset / Set Password for Dairy Farmer or Customer via Registered Mobile Number
 */
exports.resetCustomerPassword = async (req, res) => {
  try {
    const { mobile, newPassword, slug } = req.body;

    if (!mobile || !newPassword) {
      return res.status(400).json({ success: false, message: "Mobile number and new password are required" });
    }

    const cleanMobile = mobile.replace(/\D/g, "").slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      return res.status(400).json({ success: false, message: "Please provide a valid 10-digit Indian mobile number" });
    }

    if (newPassword.length < 4) {
      return res.status(400).json({ success: false, message: "Password must be at least 4 characters long" });
    }

    let storeAdminId = null;
    let storeProfile = null;
    if (slug) {
      storeProfile = await StoreProfileModel.findOne({ slug: slug.toLowerCase() });
      if (storeProfile) storeAdminId = storeProfile.adminId;
    }

    let customer = await StoreCustomerModel.findOne({ mobile: cleanMobile });
    const farmer = await farmerModel.findOne({ mobile: cleanMobile });

    if (!customer && !farmer) {
      return res.status(404).json({
        success: false,
        message: "No registered Dairy Farmer or Store Customer found with this mobile number.",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // If farmer exists, update farmer password
    if (farmer) {
      farmer.password = hashedPassword;
      await farmer.save();
    }

    // If customer doesn't exist yet but farmer does, auto-provision StoreCustomer account
    if (!customer && farmer) {
      customer = await StoreCustomerModel.create({
        adminId: farmer.adminId || storeAdminId,
        name: farmer.name,
        mobile: farmer.mobile,
        email: farmer.email || `${farmer.mobile}@milkify.in`,
        password: hashedPassword,
        village: farmer.village || storeProfile?.village || "Main Village",
        savedAddresses: [
          {
            label: "Farm / Dairy Address",
            recipientName: farmer.name,
            recipientPhone: farmer.mobile,
            village: farmer.village || storeProfile?.village || "Main Village",
            fullAddress: `${farmer.village || "Dairy Outlet Area"}, Member ID: ${farmer.memberId || "FAR"}`,
            isDefault: true,
          },
        ],
      });
    } else if (customer) {
      customer.password = hashedPassword;
      await customer.save();
    }

    const token = jwt.sign(
      { id: customer._id, role: "StoreCustomer", mobile: customer.mobile, adminId: customer.adminId },
      JWT_SECRET,
      { expiresIn: "90d" }
    );

    const farmerCredit = await getFarmerMilkCredit(customer.adminId || storeAdminId, customer.mobile);

    res.status(200).json({
      success: true,
      message: "Password updated successfully! Logged in with your dairy account.",
      token,
      customer: {
        _id: customer._id,
        name: customer.name,
        mobile: customer.mobile,
        email: customer.email,
        village: customer.village,
        savedAddresses: customer.savedAddresses,
        farmerCredit,
      },
    });
  } catch (error) {
    console.error("resetCustomerPassword error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

