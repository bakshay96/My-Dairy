require("dotenv").config();
const bcrypt  = require("bcrypt");
const jwt     = require("jsonwebtoken");
const Razorpay = require("razorpay");
const crypto  = require("crypto");

const { MasterAdminModel }  = require("./masterAdmin.model");
const { AdminModel }        = require("../Admin/admin.model");
const { SubscriptionModel } = require("./subscription.model");
const { PromoCodeModel, PlanConfigModel } = require("./promoCode.model");
const { transporter }       = require("../connection/mailConnection");

// ────────────────────────────────────────────────────────────
// Razorpay instance
// ────────────────────────────────────────────────────────────
let razorpay;
try {
  razorpay = new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
} catch (e) {
  console.warn("[MasterAdmin] Razorpay init failed:", e.message);
}

// ────────────────────────────────────────────────────────────
// Helper: sign master JWT
// ────────────────────────────────────────────────────────────
const signMasterToken = (id) =>
  jwt.sign({ id, role: "master_admin" }, process.env.JWT_SECRET, {
    expiresIn: "8h",
  });

const setMasterCookie = (res, token) => {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("master_token", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 8 * 60 * 60 * 1000,
  });
};

// ────────────────────────────────────────────────────────────
// 1. MASTER ADMIN – LOGIN
// ────────────────────────────────────────────────────────────
const masterLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ success: false, message: "Username & password required" });

    const master = await MasterAdminModel.findOne({ username });
    if (!master)
      return res.status(401).json({ success: false, message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, master.password);
    if (!ok)
      return res.status(401).json({ success: false, message: "Invalid credentials" });

    const token = signMasterToken(master._id);
    setMasterCookie(res, token);

    return res.status(200).json({
      success: true,
      message: "Master login successful",
      data: {
        master: {
          id:        master._id,
          firstName: master.firstName,
          lastName:  master.lastName,
          email:     master.email,
          username:  master.username,
          role:      master.role,
        },
        token,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────────────────────
// 2. MASTER ADMIN – CURRENT USER
// ────────────────────────────────────────────────────────────
const masterMe = async (req, res) => {
  try {
    const master = await MasterAdminModel.findById(req.masterId).select("-password -key");
    if (!master) return res.status(404).json({ success: false, message: "Not found" });
    return res.status(200).json({ success: true, data: { master } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────────────────────
// 2A. MASTER ADMIN PROFILE & CREDENTIALS
// ────────────────────────────────────────────────────────────

const updateMasterProfile = async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const master = await MasterAdminModel.findById(req.masterId);
    if (!master) return res.status(404).json({ success: false, message: "Master not found" });

    if (email) master.email = email;
    if (username) master.username = username;
    if (password) {
      master.password = password;
      master.key = password;
    }
    await master.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: { master }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const createMasterAdmin = async (req, res) => {
  try {
    const { firstName, lastName, mobile, email, username, password } = req.body;
    
    const existing = await MasterAdminModel.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      return res.status(400).json({ success: false, message: "Username or Email already exists" });
    }

    const newMaster = new MasterAdminModel({
      firstName,
      lastName,
      mobile,
      email,
      username,
      password,
      key: password,
      role: "master_admin"
    });
    await newMaster.save();

    // Send professional Welcome & Guidelines email
    const senderEmail = process.env.SMTP_EMAIL || process.env.EMAIL_USER || "care.abtech@gmail.com";
    if (email) {
      const mailOptions = {
        from: senderEmail,
        to: email,
        subject: "Welcome to the Milkify Master Admin Network!",
        html: `
          <html>
            <body style="font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; color: #334155; background-color: #f8fafc; margin: 0;">
              <div style="max-width: 600px; margin: 20px auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05); background-color: #ffffff;">
                <div style="background: linear-gradient(135deg, #7c3aed, #2563eb); color: white; padding: 32px 24px; text-align: center;">
                  <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Welcome to Milkify!</h1>
                  <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">You are now an official Master Administrator</p>
                </div>
                
                <div style="padding: 32px 24px; line-height: 1.7;">
                  <p style="font-size: 15px; margin-top: 0;">Hello <strong>${firstName} ${lastName}</strong>,</p>
                  <p>Congratulations! You have been successfully registered as a <strong>Master Administrator</strong> within the <strong>Milkify Dairy Management Ecosystem</strong>. Your account has been provisioned with elevated superadmin privileges.</p>
                  
                  <div style="background-color: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 12px; padding: 20px; margin: 24px 0;">
                    <h3 style="margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; tracking-wider; color: #7c3aed;">Your Account Credentials</h3>
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                      <tr>
                        <td style="padding: 6px 0; color: #64748b; width: 100px;">Username:</td>
                        <td style="padding: 6px 0; font-weight: bold; color: #1e1b4b;">${username}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #64748b;">Password:</td>
                        <td style="padding: 6px 0; font-weight: bold; color: #1e1b4b;">${password}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #64748b;">Access Level:</td>
                        <td style="padding: 6px 0;"><span style="background-color: #ede9fe; color: #7c3aed; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">Super Master Admin</span></td>
                      </tr>
                    </table>
                  </div>

                  <h3 style="margin: 24px 0 12px 0; font-size: 15px; font-weight: bold; color: #1e293b;">Key Responsibilities & Guidelines:</h3>
                  <ul style="padding-left: 20px; margin: 0; font-size: 14px; line-height: 1.8;">
                    <li style="margin-bottom: 8px;"><strong>SaaS Oversight:</strong> Monitor subscription cycles, manage pricing parameters, and administer promotional campaigns.</li>
                    <li style="margin-bottom: 8px;"><strong>Platform Integrity:</strong> You have authorization to extend tenant cycles, delete users securely, and audit system status.</li>
                    <li style="margin-bottom: 8px;"><strong>Security Best Practice:</strong> We highly encourage changing your temporary credentials immediately from the settings dashboard.</li>
                  </ul>

                  <h3 style="margin: 24px 0 12px 0; font-size: 15px; font-weight: bold; color: #1e293b;">Terms and Conditions:</h3>
                  <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin: 0;">
                    As a Master Administrator, you agree to treat tenant/farmer data with absolute confidentiality. Deletions and status modifications perform irreversible system mutations. Ensure all administrative purges strictly comply with Milkify system regulations and legal compliance audits.
                  </p>

                  <div style="text-align: center; margin-top: 32px;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/master/login" style="background: linear-gradient(135deg, #7c3aed, #2563eb); color: white; padding: 12px 30px; border-radius: 10px; font-weight: bold; text-decoration: none; display: inline-block; box-shadow: 0 4px 6px -1px rgba(124, 58, 237, 0.25);">
                      Go to Master Panel
                    </a>
                  </div>
                </div>

                <div style="background-color: #f8fafc; text-align: center; padding: 16px; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
                  This is a secure system notification from Milkify Dairy Systems.
                </div>
              </div>
            </body>
          </html>
        `
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`[MasterAdmin] Welcome email sent successfully to ${email}`);
      } catch (emailErr) {
        console.error("[MasterAdmin] Failed to send welcome email:", emailErr.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: "New Master Admin created successfully",
      data: { master: newMaster }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getAllMasterAdmins = async (req, res) => {
  try {
    const masters = await MasterAdminModel.find().select("-password");
    return res.status(200).json({
      success: true,
      data: { masters }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const forgotPasswordMaster = async (req, res) => {
  try {
    const { email } = req.body;
    const master = await MasterAdminModel.findOne({ email });
    if (!master) return res.status(404).json({ success: false, message: "Email not found" });

    const plainPassword = master.key || "Contact superadmin (No key found)";

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Master Admin Password Recovery - Milkify",
      text: `Hello ${master.username},\n\nYour Master Admin password is: ${plainPassword}\n\nPlease keep it secure.`
    };

    await transporter.sendMail(mailOptions);
    return res.status(200).json({ success: true, message: "Recovery email sent successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────────────────────
// 3. GET ALL ADMINS WITH SUBSCRIPTION STATUS
// ────────────────────────────────────────────────────────────
const getAllAdmins = async (req, res) => {
  try {
    const admins = await AdminModel.find().select("-password").lean();
    const subs   = await SubscriptionModel.find().lean();

    const subMap = {};
    subs.forEach((s) => { subMap[String(s.adminId)] = s; });

    const result = admins.map((a) => {
      const sub = subMap[String(a._id)] || null;
      return { ...a, subscription: sub };
    });

    return res.status(200).json({ success: true, data: { admins: result } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────────────────────
// 4. GET SINGLE ADMIN DETAIL
// ────────────────────────────────────────────────────────────
const getAdminDetail = async (req, res) => {
  try {
    const admin = await AdminModel.findById(req.params.adminId).select("-password").lean();
    if (!admin) return res.status(404).json({ success: false, message: "Admin not found" });
    const sub = await SubscriptionModel.findOne({ adminId: req.params.adminId }).lean();
    return res.status(200).json({ success: true, data: { admin, subscription: sub } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────────────────────
// 5. MANAGE ADMIN STATUS (activate/pause)
// ────────────────────────────────────────────────────────────
const updateAdminStatus = async (req, res) => {
  try {
    const { status } = req.body; // "Active" | "Pause"
    const admin = await AdminModel.findByIdAndUpdate(
      req.params.adminId,
      { Status: status },
      { new: true }
    ).select("-password");
    if (!admin) return res.status(404).json({ success: false, message: "Admin not found" });
    return res.status(200).json({ success: true, message: "Status updated", data: { admin } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const deleteAdmin = async (req, res) => {
  try {
    const adminId = req.params.adminId;
    const admin = await AdminModel.findById(adminId);
    if (!admin) return res.status(404).json({ success: false, message: "Admin not found" });

    // Delete associated data
    const { farmerModel }         = require("../Farmer/farmer.model");
    const { MilkModel }           = require("../Milk/milk.model");
    const { rateSettingModel }    = require("../Milk/RateSetting/rateSetting.model");
    const { PaymentModel }        = require("../Payment/payment.model");
    const { AiInsightCacheModel } = require("../Analytics/aiInsightCache.model");

    await farmerModel.deleteMany({ adminId });
    await SubscriptionModel.deleteMany({ adminId });
    await MilkModel.deleteMany({ adminId });
    await rateSettingModel.deleteMany({ adminId });
    await PaymentModel.deleteMany({ adminId });
    await AiInsightCacheModel.deleteMany({ adminId });

    // Finally delete the admin document
    await AdminModel.findByIdAndDelete(adminId);

    return res.status(200).json({ success: true, message: "Admin deleted completely from database" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const bulkDeleteAdmins = async (req, res) => {
  try {
    const { adminIds } = req.body;
    if (!Array.isArray(adminIds) || adminIds.length === 0) {
      return res.status(400).json({ success: false, message: "No admins selected for deletion" });
    }

    const { farmerModel }         = require("../Farmer/farmer.model");
    const { MilkModel }           = require("../Milk/milk.model");
    const { rateSettingModel }    = require("../Milk/RateSetting/rateSetting.model");
    const { PaymentModel }        = require("../Payment/payment.model");
    const { AiInsightCacheModel } = require("../Analytics/aiInsightCache.model");

    const query = { adminId: { $in: adminIds } };

    await farmerModel.deleteMany(query);
    await SubscriptionModel.deleteMany(query);
    await MilkModel.deleteMany(query);
    await rateSettingModel.deleteMany(query);
    await PaymentModel.deleteMany(query);
    await AiInsightCacheModel.deleteMany(query);

    await AdminModel.deleteMany({ _id: { $in: adminIds } });

    return res.status(200).json({ success: true, message: `${adminIds.length} Admins deleted completely from database` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────────────────────
// 6. EXTEND / MODIFY SUBSCRIPTION
// ────────────────────────────────────────────────────────────
const extendSubscription = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { days, plan, notes } = req.body;

    let sub = await SubscriptionModel.findOne({ adminId });
    if (!sub) {
      // Create fresh trial
      sub = await _createTrialSubscription(adminId);
    }

    const base = sub.endDate && sub.endDate > new Date() ? sub.endDate : new Date();
    const newEnd = new Date(base);
    newEnd.setDate(newEnd.getDate() + (Number(days) || 30));

    sub.endDate      = newEnd;
    sub.status       = "active";
    sub.plan         = plan || sub.plan || "monthly";
    sub.paymentStatus = "paid";
    if (notes) sub.notes = notes;
    await sub.save();

    return res.status(200).json({
      success: true,
      message: `Subscription extended by ${days} days`,
      data: { subscription: sub },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────────────────────
// 7. PLAN PRICING CONFIG (GET / SET)
// ────────────────────────────────────────────────────────────
const getPlanConfig = async (req, res) => {
  try {
    let config = await PlanConfigModel.findOne();
    if (!config) config = await PlanConfigModel.create({});
    return res.status(200).json({ success: true, data: { config } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const updatePlanConfig = async (req, res) => {
  try {
    const fields = ["monthlyPrice", "quarterlyPrice", "yearlyPrice", "trialDays", "currency"];
    const update = {};
    fields.forEach((f) => { if (req.body[f] !== undefined) update[f] = req.body[f]; });
    update.updatedBy = req.masterId;

    let config = await PlanConfigModel.findOneAndUpdate({}, { $set: update }, { new: true, upsert: true });
    return res.status(200).json({ success: true, message: "Plan config updated", data: { config } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────────────────────
// 8. PROMO CODE CRUD
// ────────────────────────────────────────────────────────────
const createPromoCode = async (req, res) => {
  try {
    const { code, discountType, discountValue, maxUses, validFrom, validUntil, applicablePlans, description } = req.body;
    const promo = await PromoCodeModel.create({
      code, discountType, discountValue, maxUses,
      validFrom, validUntil, applicablePlans, description,
      createdBy: req.masterId,
    });
    return res.status(201).json({ success: true, message: "Promo code created", data: { promo } });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ success: false, message: "Promo code already exists" });
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getAllPromoCodes = async (req, res) => {
  try {
    const promos = await PromoCodeModel.find().sort("-createdAt");
    return res.status(200).json({ success: true, data: { promos } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const updatePromoCode = async (req, res) => {
  try {
    const promo = await PromoCodeModel.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!promo) return res.status(404).json({ success: false, message: "Promo code not found" });
    return res.status(200).json({ success: true, message: "Promo code updated", data: { promo } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const deletePromoCode = async (req, res) => {
  try {
    await PromoCodeModel.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: "Promo code deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────────────────────
// 9. VALIDATE PROMO CODE (called from admin frontend)
// ────────────────────────────────────────────────────────────
const validatePromoCode = async (req, res) => {
  try {
    const { code, plan } = req.body;
    const promo = await PromoCodeModel.findOne({ code: code.toUpperCase(), isActive: true });

    if (!promo) return res.status(404).json({ success: false, message: "Invalid promo code" });

    const now = new Date();
    if (promo.validUntil && promo.validUntil < now)
      return res.status(400).json({ success: false, message: "Promo code has expired" });
    if (promo.validFrom && promo.validFrom > now)
      return res.status(400).json({ success: false, message: "Promo code not yet active" });
    if (promo.maxUses && promo.usedCount >= promo.maxUses)
      return res.status(400).json({ success: false, message: "Promo code usage limit reached" });
    if (plan && !promo.applicablePlans.includes(plan))
      return res.status(400).json({ success: false, message: `Promo code not valid for ${plan} plan` });

    // Fetch plan config to compute discount
    const config = await PlanConfigModel.findOne() || {};
    const planPrices = {
      monthly:   config.monthlyPrice   || 499,
      quarterly: config.quarterlyPrice || 1299,
      yearly:    config.yearlyPrice    || 4499,
    };
    const basePrice = planPrices[plan] || 499;
    let discountAmount = 0;
    if (promo.discountType === "percentage") {
      discountAmount = parseFloat(((basePrice * promo.discountValue) / 100).toFixed(2));
    } else {
      discountAmount = Math.min(promo.discountValue, basePrice);
    }
    const finalPrice = parseFloat((basePrice - discountAmount).toFixed(2));

    return res.status(200).json({
      success: true,
      message: "Promo code valid!",
      data: { promo, basePrice, discountAmount, finalPrice },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────────────────────
// 10. CREATE RAZORPAY ORDER (called by admin user)
// ────────────────────────────────────────────────────────────
const createSubscriptionOrder = async (req, res) => {
  try {
    const { plan, promoCode } = req.body;
    const adminId = req.admin._id;

    const config = await PlanConfigModel.findOne() || {};
    const planPrices = {
      monthly:   config.monthlyPrice   || 499,
      quarterly: config.quarterlyPrice || 1299,
      yearly:    config.yearlyPrice    || 4499,
    };

    if (!planPrices[plan])
      return res.status(400).json({ success: false, message: "Invalid plan" });

    let basePrice      = planPrices[plan];
    let discountAmount = 0;
    let appliedPromo   = null;

    if (promoCode) {
      const promo = await PromoCodeModel.findOne({ code: promoCode.toUpperCase(), isActive: true });
      if (promo) {
        if (promo.discountType === "percentage") {
          discountAmount = parseFloat(((basePrice * promo.discountValue) / 100).toFixed(2));
        } else {
          discountAmount = Math.min(promo.discountValue, basePrice);
        }
        appliedPromo = promo;
      }
    }

    const finalPrice = parseFloat((basePrice - discountAmount).toFixed(2));
    const amountPaise = Math.round(finalPrice * 100); // Razorpay uses smallest currency unit

    const order = await razorpay.orders.create({
      amount:   amountPaise,
      currency: config.currency || "INR",
      notes: {
        adminId: String(adminId),
        plan,
        promoCode: promoCode || "",
      },
    });

    // Update subscription record
    let sub = await SubscriptionModel.findOne({ adminId });
    if (!sub) sub = await _createTrialSubscription(adminId);
    sub.razorpayOrderId = order.id;
    sub.basePrice       = basePrice;
    sub.discountAmount  = discountAmount;
    sub.finalPrice      = finalPrice;
    sub.promoCode       = promoCode || null;
    sub.plan            = plan;
    sub.paymentStatus   = "pending";
    await sub.save();

    return res.status(200).json({
      success: true,
      data: {
        order,
        keyId: process.env.RAZORPAY_KEY_ID,
        basePrice,
        discountAmount,
        finalPrice,
        plan,
        promoApplied: appliedPromo ? { code: appliedPromo.code, discountType: appliedPromo.discountType, discountValue: appliedPromo.discountValue } : null,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────────────────────
// 11. VERIFY PAYMENT & ACTIVATE SUBSCRIPTION
// ────────────────────────────────────────────────────────────
const verifySubscriptionPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;
    const adminId = req.admin._id;

    // Signature verification
    const body      = razorpay_order_id + "|" + razorpay_payment_id;
    const expected  = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expected !== razorpay_signature)
      return res.status(400).json({ success: false, message: "Payment verification failed" });

    let sub = await SubscriptionModel.findOne({ adminId });
    if (!sub) sub = await _createTrialSubscription(adminId);

    // Calculate subscription end date based on plan
    const planDays = { monthly: 30, quarterly: 90, yearly: 365 };
    const days = planDays[plan] || 30;
    const now  = new Date();
    const end  = new Date(now);
    end.setDate(end.getDate() + days);

    sub.razorpayPaymentId = razorpay_payment_id;
    sub.razorpaySignature = razorpay_signature;
    sub.paymentStatus     = "paid";
    sub.status            = "active";
    sub.startDate         = now;
    sub.endDate           = end;
    sub.plan              = plan;

    // Increment promo usage
    if (sub.promoCode) {
      await PromoCodeModel.findOneAndUpdate(
        { code: sub.promoCode.toUpperCase() },
        { $inc: { usedCount: 1 } }
      );
    }

    sub.paymentHistory.push({
      paymentId:   razorpay_payment_id,
      orderId:     razorpay_order_id,
      amount:      sub.finalPrice,
      plan,
      paidAt:      now,
      promoCode:   sub.promoCode,
      discountAmt: sub.discountAmount,
    });

    await sub.save();

    return res.status(200).json({
      success: true,
      message: "Payment verified. Subscription activated!",
      data: { subscription: sub },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────────────────────
// 12. GET SUBSCRIPTION (for admin profile page)
// ────────────────────────────────────────────────────────────
const getMySubscription = async (req, res) => {
  try {
    const adminId = req.admin._id;
    let sub = await SubscriptionModel.findOne({ adminId });
    if (!sub) sub = await _createTrialSubscription(adminId);
    const config = await PlanConfigModel.findOne() || {};
    const promos = await PromoCodeModel.find({ isActive: true }).select("code discountType discountValue description validUntil applicablePlans").lean();
    return res.status(200).json({ success: true, data: { subscription: sub, config, activePromos: promos } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────────────────────
// 13. DASHBOARD STATS FOR MASTER
// ────────────────────────────────────────────────────────────
const getMasterDashboardStats = async (req, res) => {
  try {
    const totalAdmins    = await AdminModel.countDocuments();
    const activeAdmins   = await AdminModel.countDocuments({ Status: "Active" });
    const now            = new Date();
    const activeSubCount = await SubscriptionModel.countDocuments({ status: "active", endDate: { $gte: now } });
    const trialCount     = await SubscriptionModel.countDocuments({ status: "trial", trialEndDate: { $gte: now } });
    const expiredCount   = await SubscriptionModel.countDocuments({
      $or: [
        { status: "active",  endDate:      { $lt: now } },
        { status: "trial",   trialEndDate: { $lt: now } },
        { status: "expired" },
      ],
    });

    // Revenue this month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const revenuePipeline = await SubscriptionModel.aggregate([
      { $unwind: "$paymentHistory" },
      { $match: { "paymentHistory.paidAt": { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: "$paymentHistory.amount" } } },
    ]);
    const monthlyRevenue = revenuePipeline[0]?.total || 0;

    const promoCount = await PromoCodeModel.countDocuments({ isActive: true });

    return res.status(200).json({
      success: true,
      data: {
        stats: { totalAdmins, activeAdmins, activeSubCount, trialCount, expiredCount, monthlyRevenue, promoCount },
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────────────────────
// INTERNAL: Create trial subscription for new admin
// ────────────────────────────────────────────────────────────
const _createTrialSubscription = async (adminId) => {
  const config     = await PlanConfigModel.findOne() || {};
  const trialDays  = config.trialDays || 10;
  const trialEnd   = new Date();
  trialEnd.setDate(trialEnd.getDate() + trialDays);

  return await SubscriptionModel.create({
    adminId,
    status:         "trial",
    plan:           "trial",
    trialStartDate: new Date(),
    trialEndDate:   trialEnd,
    paymentStatus:  "pending",
  });
};

// Export the internal helper too (used in admin registration flow)
module.exports = {
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
  _createTrialSubscription,
  updateMasterProfile,
  createMasterAdmin,
  getAllMasterAdmins,
  forgotPasswordMaster,
  deleteAdmin,
  bulkDeleteAdmins,
};
