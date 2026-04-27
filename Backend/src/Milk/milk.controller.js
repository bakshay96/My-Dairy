const { MilkModel }        = require("./milk.model");
const { farmerModel }      = require("../Farmer/farmer.model");
const { rateSettingModel } = require("./RateSetting/rateSetting.model");
const { sendMail }         = require("../middleware/sendMail");
const { sendMilkEntryNotification } = require("../services/smsService");
const { calculateMilkAmount, getBillingCycleDate } = require("../utils/milkCalculator");
const { emitMilkAdded }   = require("../services/socketService");
const mongoose = require("mongoose");

// ─── Add Milk Data ────────────────────────────────────────────────────────────
exports.addMilkData = async (req, res) => {
  const { category, fat, snf = 0, degree = 0, litter } = req.body;
  const { id: farmerId } = req.params;

  if (!farmerId || farmerId === "undefined" || farmerId === "null") {
    return res.status(400).json({ message: "Invalid farmer ID. Please select a valid farmer." });
  }

  try {
    const farmer = await farmerModel.findOne({ _id: farmerId, adminId: req.admin.id });
    if (!farmer) return res.status(404).json({ message: "Farmer not found" });

    const { name, email, mobile } = farmer;

    // ── Auto shift based on IST hour ───────────────────────────────────────
    const istHour = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })).getHours();
    const shift   = istHour < 12 ? "morning" : "evening";

    // ── Formatted date string (IST) ────────────────────────────────────────
    const date = new Date().toLocaleDateString("en-IN", {
      day:      "2-digit",
      month:    "2-digit",
      year:     "numeric",
      hour:     "2-digit",
      minute:   "2-digit",
      second:   "2-digit",
      timeZone: "Asia/Kolkata",
      hour12:   true,
    });

    // ── 10-day billing cycle key ───────────────────────────────────────────
    const billingCycleDate = getBillingCycleDate();

    // ── Fetch rate settings ────────────────────────────────────────────────
    const rateSetting = await rateSettingModel.findOne({
      adminId:      req.admin.id,
      milkCategory: category,
      status:       "Active",
    });

    if (!rateSetting) {
      return res.status(400).json({
        message: `Rate settings for "${category}" not found. Please configure rates in Settings first.`,
      });
    }

    // ── Calculate amount using utility (precision-safe) ────────────────────
    const { rate, calculatedAmount, fatRate } = calculateMilkAmount({
      fat,
      snf,
      degree,
      litter,
      rateSetting,
    });

    // ── Create & save milk entry ───────────────────────────────────────────
    const milkEntry = new MilkModel({
      adminId: req.admin.id,
      farmerId,
      ...req.body,
      snf:     parseFloat(snf)    || 0,
      degree:  parseFloat(degree) || 0,
      shift,
      date,
      billingCycleDate,
      fatRate,
      rate,
      calculatedAmount,
      mobile,
    });

    const savedEntry = await milkEntry.save();
    const milkdata   = { ...savedEntry.toObject(), name, email };
    req.milkdata     = milkdata;  // for sendMail middleware

    // ── Emit real-time socket event (non-blocking) ─────────────────────────
    emitMilkAdded(farmerId, milkdata);

    // ── SMS notification (non-blocking) ───────────────────────────────────
    if (farmer.mobile) {
      sendMilkEntryNotification({
        name,
        mobile: farmer.mobile,
        litter,
        fat,
        calculatedAmount,
        date,
      }).catch((err) => console.error("SMS notification error:", err));
    }

    // ── Email + response ───────────────────────────────────────────────────
    sendMail(req, res, () => {
      res.status(201).json({
        message: "Milk data submitted successfully",
        milk:    savedEntry,
      });
    });
  } catch (error) {
    console.error("Error adding milk data:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── Get Single Farmer Milk Data ──────────────────────────────────────────────
exports.getSingleFarmerMilkData = async (req, res) => {
  const { id } = req.params;

  try {
    const userMilkData = await MilkModel.find({ farmerId: id, adminId: req.admin.id })
      .populate("farmerId", "name email mobile")
      .populate("adminId", "name email mobile shopName")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      total_entries: userMilkData.length,
      data: userMilkData,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── Get All Milk Collections (no pagination) ─────────────────────────────────
exports.getfarmerMilkCollections = async (req, res) => {
  try {
    const milkcollections = await MilkModel.find({ adminId: req.admin.id })
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json({ count: milkcollections.length, milkcollections });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── Get All Milk Collections (paginated) ────────────────────────────────────
exports.getfarmerMilkCollectionWithPagination = async (req, res) => {
  try {
    const page     = parseInt(req.query.page)     || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const sort     = req.query.sort === "asc" ? 1 : -1;
    const skip     = (page - 1) * pageSize;

    const milkcollections = await MilkModel.find({ adminId: req.admin.id })
      .select("farmerId category fat snf water litter degree rate calculatedAmount date shift billingCycleDate createdAt")
      .populate("farmerId", "name mobile")
      .skip(skip)
      .limit(pageSize)
      .sort({ createdAt: sort })
      .lean();

    const totalEntries = await MilkModel.countDocuments({ adminId: req.admin.id });
    const totalPages   = Math.ceil(totalEntries / pageSize);

    res.status(200).json({ milkcollections, totalPages, currentPage: page, totalEntries });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// ─── Update Milk Collection ───────────────────────────────────────────────────
exports.updateMilkCollection = async (req, res) => {
  try {
    const { category, fat, snf = 0, degree = 0, litter } = req.body;

    const rateSetting = await rateSettingModel.findOne({
      adminId:      req.admin.id,
      milkCategory: category,
      status:       "Active",
    });

    if (!rateSetting) {
      return res.status(400).json({ message: `Rate settings for "${category}" not found` });
    }

    const { rate, calculatedAmount, fatRate } = calculateMilkAmount({
      fat, snf, degree, litter, rateSetting,
    });

    const updatedData   = { ...req.body, fatRate, rate, calculatedAmount };
    const milkCollection = await MilkModel.findByIdAndUpdate(req.params.id, updatedData, { new: true });

    if (!milkCollection) return res.status(404).json({ message: "Milk record not found" });

    res.status(200).json({ message: "Data updated successfully", data: milkCollection });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ─── Delete Milk Collection ───────────────────────────────────────────────────
exports.deleteMilkCollection = async (req, res) => {
  try {
    const { hard } = req.query;
    const query = { _id: req.params.id, adminId: req.admin.id };

    if (hard === "true") {
      const deleted = await MilkModel.findOneAndDelete(query);
      if (!deleted) return res.status(404).json({ message: "Record not found" });
      return res.status(200).json({ message: "Milk collection permanently deleted", mode: "hard", data: deleted });
    }

    const softDeleted = await MilkModel.findOneAndUpdate(
      query,
      {
        $set: {
          isActive: false,
          paymentStatus: "paid",
          deletedAt: new Date(),
        },
      },
      { new: true }
    );
    if (!softDeleted) return res.status(404).json({ message: "Record not found" });

    res.status(200).json({ message: "Milk collection soft deleted", mode: "soft", data: softDeleted });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ─── Delete Milk Collections by Farmer + Range ────────────────────────────────
exports.deleteFarmerMilkCollections = async (req, res) => {
  try {
    const { farmerId } = req.params;
    const { startDate, endDate, hard = "false" } = req.query;
    if (!mongoose.Types.ObjectId.isValid(farmerId)) {
      return res.status(400).json({ message: "Invalid farmerId" });
    }
    const filter = {
      adminId: req.admin.id,
      farmerId: new mongoose.Types.ObjectId(farmerId),
    };
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        const s = new Date(startDate);
        s.setHours(0, 0, 0, 0);
        filter.createdAt.$gte = s;
      }
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = e;
      }
    }
    if (hard === "true") {
      const result = await MilkModel.deleteMany(filter);
      return res.status(200).json({ message: "Farmer entries permanently deleted", mode: "hard", deletedCount: result.deletedCount });
    }
    const result = await MilkModel.updateMany(
      filter,
      { $set: { isActive: false, paymentStatus: "paid", deletedAt: new Date() } }
    );
    return res.status(200).json({ message: "Farmer entries soft deleted", mode: "soft", modifiedCount: result.modifiedCount });
  } catch (error) {
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};
