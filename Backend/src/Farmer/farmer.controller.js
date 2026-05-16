const { farmerModel } = require("./farmer.model");
const { MilkModel } = require("../Milk/milk.model");

// ─── Create Farmer ────────────────────────────────────────────────────────────
exports.createFarmer = async (req, res) => {
  try {
    const { mobile } = req.body;

    const isFarmer = await farmerModel.findOne({
      mobile,
      adminId: req.admin.id,
    });

    if (isFarmer) {
      return res.status(409).json({ message: "Farmer already exists with this mobile number." });
    }

    // Merge address into village field (frontend may send either)
    const farmerData = { ...req.body, adminId: req.admin.id };
    if (farmerData.address && !farmerData.village) {
      farmerData.village = farmerData.address;
    }

    // Generate unique memberId based on count (e.g. MI-001, MI-002)
    const totalFarmers = await farmerModel.countDocuments({ adminId: req.admin.id });
    farmerData.memberId = `MI-${(totalFarmers + 1).toString().padStart(3, '0')}`;

    const farmer = new farmerModel(farmerData);
    const newFarmer = await farmer.save();

    res.status(201).json({ msg: "New farmer added successfully", farmer: newFarmer });
  } catch (error) {
    console.error("[Farmer] createFarmer error:", error);
    
    // Handle Mongoose duplicate key (mobile already exists)
    if (error.code === 11000) {
      return res.status(409).json({ message: "A farmer with this mobile number already exists." });
    }
    
    // Mongoose validation errors - extract user-friendly messages
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message).join(", ");
      return res.status(400).json({ message: messages });
    }
    
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// ─── Get All Farmers (no pagination) ─────────────────────────────────────────
exports.getAllFarmer = async (req, res) => {
  try {
    const farmers = await farmerModel.find({ adminId: req.admin.id }).lean();

    // Determine current shift based on IST
    const istHour = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })).getHours();
    const currentShift = istHour < 12 ? "morning" : "evening";

    // Get start of today in IST (stored as UTC)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const nowIST = new Date(now.getTime() + istOffset);
    nowIST.setUTCHours(0, 0, 0, 0);
    const startOfTodayUTC = new Date(nowIST.getTime() - istOffset);

    // Find all milk submissions for today
    const todaySubmissions = await MilkModel.find({
      adminId: req.admin.id,
      createdAt: { $gte: startOfTodayUTC }
    }).select('farmerId shift').lean();

    const morningFarmerIds = new Set();
    const eveningFarmerIds = new Set();

    todaySubmissions.forEach(m => {
      if (m.shift === 'morning') morningFarmerIds.add(m.farmerId.toString());
      if (m.shift === 'evening') eveningFarmerIds.add(m.farmerId.toString());
    });

    const farmersWithStatus = farmers.map(f => {
      const fId = f._id.toString();
      return {
        ...f,
        submittedMorning: morningFarmerIds.has(fId),
        submittedEvening: eveningFarmerIds.has(fId),
      };
    });

    res.status(200).json({ count: farmersWithStatus.length, farmers: farmersWithStatus });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
};

// ─── Get All Farmers (with pagination) ───────────────────────────────────────
exports.getAllFarmerWithPagination = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const _sort = req.query._sort || "desc";
    const skip = (page - 1) * pageSize;

    const farmers = await farmerModel
      .find({ adminId: req.admin.id })
      .skip(skip)
      .limit(pageSize)
      .sort({ createdAt: _sort });

    const totalEntries = await farmerModel.countDocuments({ adminId: req.admin.id });
    const totalPages = Math.ceil(totalEntries / pageSize);

    return res.status(200).json({
      totalPages,
      currentPage: page,
      totalCount: farmers.length,
      totalEntries,
      farmers,
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
};

// ─── Get Single Farmer ────────────────────────────────────────────────────────
exports.getSingleFarmer = async (req, res) => {
  try {
    const { id } = req.params;

    const farmer = await farmerModel.findOne({
      adminId: req.admin.id,
      _id: id,
    });

    if (!farmer) {
      return res.status(404).json({ message: "Farmer not found" });
    }

    res.status(200).json({ message: "Success", farmer });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── Update Farmer ────────────────────────────────────────────────────────────
exports.updateFarmer = async (req, res) => {
  try {
    // Whitelist only safe, editable fields — never allow adminId override
    const allowedFields = ["name", "mobile", "email", "village", "address", "gender", "status"];
    const updateData = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // Merge address into village field (frontend may send either)
    if (updateData.address && !updateData.village) {
      updateData.village = updateData.address;
      delete updateData.address;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No valid fields to update." });
    }

    const farmer = await farmerModel.findOneAndUpdate(
      { _id: req.params.id, adminId: req.admin._id },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!farmer) {
      return res.status(404).json({ message: "Farmer not found or unauthorized." });
    }

    res.status(200).json({ message: "Farmer updated successfully", farmer });
  } catch (error) {
    console.error("[Farmer] updateFarmer error:", error);
    // Handle Mongoose duplicate key (mobile already exists)
    if (error.code === 11000) {
      return res.status(409).json({ message: "A farmer with this mobile number already exists." });
    }
    // Mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message).join(", ");
      return res.status(400).json({ message: messages });
    }
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ─── Delete Farmer ────────────────────────────────────────────────────────────
exports.deleteFarmer = async (req, res) => {
  try {
    const deleteFarmer = await farmerModel.deleteOne({
      _id: req.params.id,
      adminId: req.admin.id,
    });

    if (deleteFarmer.deletedCount === 0) {
      return res.status(404).json({ message: "Farmer not found or unauthorized" });
    }

    res.status(200).json({
      message: "Farmer deleted successfully",
      id: req.params.id,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
