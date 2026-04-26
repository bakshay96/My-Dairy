const { rateSettingModel } = require("./rateSetting.model");

// ─── POST /api/rate  ──────────────────────────────────────────────────────────
// Creates a new Active rate for the given milkCategory, deactivating all previous ones.
exports.createRateSetting = async (req, res) => {
  try {
    const {
      milkCategory,
      ratePerFat,
      useSnf = false,
      ratePerSnf = 0,
      useDegree = false,
      ratePerDegree = 0,
    } = req.body;

    // Validate required fields
    if (!milkCategory || ratePerFat === undefined || ratePerFat === null) {
      return res.status(400).json({
        success: false,
        message: "milkCategory and ratePerFat are required.",
      });
    }

    if (!["cow", "buffalo", "sheep", "goat"].includes(milkCategory)) {
      return res.status(400).json({
        success: false,
        message: "milkCategory must be one of: cow, buffalo, sheep, goat.",
      });
    }

    if (ratePerFat < 0) {
      return res.status(400).json({
        success: false,
        message: "ratePerFat must be a positive number.",
      });
    }

    const adminId = req.admin._id;

    // Step 1: Deactivate ALL existing Active rates for this admin + category
    await rateSettingModel.updateMany(
      { adminId, milkCategory, status: "Active" },
      { $set: { status: "Inactive" } }
    );

    // Step 2: Create the new Active rate
    const newRate = await rateSettingModel.create({
      adminId,
      milkCategory,
      ratePerFat,
      useSnf,
      ratePerSnf: useSnf ? ratePerSnf : 0,
      useDegree,
      ratePerDegree: useDegree ? ratePerDegree : 0,
      status: "Active",
    });

    return res.status(201).json({
      success: true,
      message: `Rate for ${milkCategory} updated successfully.`,
      data: { rate: newRate },
    });
  } catch (error) {
    console.error("[RateSetting] createRateSetting error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// ─── GET /api/rate/active  ────────────────────────────────────────────────────
// Fetches only Active rates for the authenticated admin (token-based).
exports.getActiveRates = async (req, res) => {
  try {
    const adminId = req.admin._id;

    const activeRates = await rateSettingModel
      .find({ adminId, status: "Active" })
      .sort({ milkCategory: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: "Active rates fetched successfully.",
      data: { rates: activeRates },
    });
  } catch (error) {
    console.error("[RateSetting] getActiveRates error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// ─── GET /api/rate (legacy) ────────────────────────────────────────────────
// Returns ALL rates (active + inactive) for admin. Kept for backward compat.
exports.getAllRateSettings = async (req, res) => {
  try {
    const rateSettings = await rateSettingModel
      .find({ adminId: req.admin._id })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: "Rate settings fetched successfully.",
      data: { rates: rateSettings },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// ─── DELETE /api/rate/:id ──────────────────────────────────────────────────
exports.deleteRateCollection = async (req, res) => {
  try {
    const deleted = await rateSettingModel.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Rate not found." });
    }
    return res.status(200).json({
      success: true,
      message: "Rate deleted.",
      data: { rate: deleted },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};
