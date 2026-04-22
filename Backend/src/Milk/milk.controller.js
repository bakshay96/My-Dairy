const { MilkModel } = require("./milk.model");
const { farmerModel } = require("../Farmer/farmer.model");
const mongoose = require("mongoose");
const { sendMail } = require("../middleware/sendMail");
const { rateSettingModel } = require("./RateSetting/rateSetting.model");
const { sendMilkEntryNotification } = require("../services/smsService");

// ─── Add Milk Data ────────────────────────────────────────────────────────────
exports.addMilkData = async (req, res) => {
  const { category, fat, litter } = req.body;
  const { id } = req.params;

  // Validate farmer ID
  if (!id || id === "undefined" || id === "null") {
    return res.status(400).json({ 
      message: "Invalid farmer ID. Please select a valid farmer."
    });
  }

  try {
    const farmer = await farmerModel.findOne({ _id: id, adminId: req.admin.id });

    if (!farmer) {
      return res.status(404).json({ message: "Farmer not found" });
    }

    const { name, email, mobile } = farmer;

    // Auto shift based on time
    const currentHour = new Date().getHours();
    const shift = currentHour < 12 ? "morning" : "evening";

    // Formatted date (IST)
    const date = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "Asia/Kolkata",
      hour12: true,
    });

    // Fetch rate settings
    const rateSetting = await rateSettingModel.findOne({
      adminId: req.admin.id,
      milkCategory: category,
    });

    if (!rateSetting) {
      return res.status(400).json({ message: `Rate settings for "${category}" not found` });
    }

    const fatRate = rateSetting.ratePerFat;
    const rate = fat * rateSetting.ratePerFat;
    const calculatedAmount = rate * parseFloat(litter);

    // ✅ Fixed: added `new` keyword
    const farmerMilkCollection = new MilkModel({
      adminId: req.admin.id,
      farmerId: id,
      ...req.body,
      shift,
      date,
      fatRate,
      rate,
      calculatedAmount,
      mobile,
    });

    const farmerdata = await farmerMilkCollection.save();
    const milkdata = { ...farmerMilkCollection.toObject(), name, email };
    req.milkdata = milkdata;

    // Send SMS notification (non-blocking)
    if (farmer.mobile) {
      sendMilkEntryNotification({
        name,
        mobile: farmer.mobile,
        litter: req.body.litter,
        fat: req.body.fat,
        calculatedAmount,
        date,
      }).catch(err => console.error('SMS notification error:', err));
    }

    sendMail(req, res, () => {
      res.status(201).json({ message: "Milk data submitted successfully", milk: farmerdata });
    });
  } catch (error) {
    console.error("Error adding milk data:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── Get Single Farmer Milk Data ──────────────────────────────────────────────
exports.getSingleFarmerMilkData = async (req, res) => {
  const { id } = req.params;

  try {
    // ✅ Fixed: declared with const
    const userMilkData = await MilkModel.find({ farmerId: id, adminId: req.admin.id })
      .populate("farmerId", "name email mobile")
      .populate("adminId", "name email mobile shopName")
      .exec();

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
    const milkcollections = await MilkModel.find({ adminId: req.admin.id });
    res.status(200).json({ count: milkcollections.length, milkcollections });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── Get All Milk Collections (with pagination) ───────────────────────────────
exports.getfarmerMilkCollectionWithPagination = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const sort = req.query.sort || "desc";
    const skip = (page - 1) * pageSize;

    // Optimized query with field selection
    const milkcollections = await MilkModel.find({ adminId: req.admin.id })
      .select('farmerId category fat snf water litter degree rate calculatedAmount date shift createdAt')
      .populate('farmerId', 'name mobile')
      .skip(skip)
      .limit(pageSize)
      .sort({ createdAt: sort })
      .lean();

    const totalEntries = await MilkModel.countDocuments({ adminId: req.admin.id });
    const totalPages = Math.ceil(totalEntries / pageSize);

    res.status(200).json({
      milkcollections,
      totalPages,
      currentPage: page,
      totalEntries,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// ─── Update Milk Collection ───────────────────────────────────────────────────
exports.updateMilkCollection = async (req, res) => {
  try {
    const { category, fat, litter } = req.body;

    const rateSetting = await rateSettingModel.findOne({
      adminId: req.admin.id,
      milkCategory: category,
    });

    if (!rateSetting) {
      return res.status(400).json({ message: `Rate settings for "${category}" not found` });
    }

    const fatRate = rateSetting.ratePerFat;
    const rate = fat * rateSetting.ratePerFat;
    const calculatedAmount = rate * parseFloat(litter);

    const updatedData = { ...req.body, fatRate, rate, calculatedAmount };
    const milkCollection = await MilkModel.findByIdAndUpdate(req.params.id, updatedData, {
      new: true,
    });

    if (!milkCollection) {
      return res.status(404).json({ message: "Milk record not found" });
    }

    res.status(200).json({ message: "Data updated successfully", data: milkCollection });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ─── Delete Milk Collection ───────────────────────────────────────────────────
exports.deleteMilkCollection = async (req, res) => {
  try {
    const deletedmilkData = await MilkModel.findByIdAndDelete(req.params.id);

    if (!deletedmilkData) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.status(200).json({ message: "Milk collection deleted", data: deletedmilkData });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
