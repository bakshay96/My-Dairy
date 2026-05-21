const { rateChartConfigModel } = require("./rateChartConfig.model");

// ─── POST /api/rates ──────────────────────────────────────────────────────────
exports.saveRateChartConfig = async (req, res) => {
  try {
    const {
      animalType,
      baseRate,
      baseFat,
      baseSnf,
      fatPointValue,
      snfPointValue,
      ratePerKgFat = 0,
      ratePerKgSnf = 0,
      minFat = 2.0,
      maxFat = 10.0,
      minSnf = 6.0,
      maxSnf = 12.0,
      minDegree = 20,
      maxDegree = 40,
    } = req.body;

    if (!animalType) {
      return res.status(400).json({ success: false, message: "animalType is required." });
    }

    if (!["cow", "buffalo", "sheep", "goat"].includes(animalType)) {
      return res.status(400).json({
        success: false,
        message: "animalType must be one of: cow, buffalo, sheep, goat.",
      });
    }

    const adminId = req.admin._id;

    // Step 1: Deactivate existing active rate settings for this animalType
    await rateChartConfigModel.updateMany(
      { adminId, animalType, status: "Active" },
      { $set: { status: "Inactive" } }
    );

    // Step 2: Create new active rate setting
    const newConfig = await rateChartConfigModel.create({
      adminId,
      animalType,
      baseRate: parseFloat(baseRate) || 40,
      baseFat: parseFloat(baseFat) || 3.5,
      baseSnf: parseFloat(baseSnf) || 8.5,
      fatPointValue: parseFloat(fatPointValue) || 0.2,
      snfPointValue: parseFloat(snfPointValue) || 0.1,
      ratePerKgFat: parseFloat(ratePerKgFat) || 0,
      ratePerKgSnf: parseFloat(ratePerKgSnf) || 0,
      minFat: parseFloat(minFat) || 2.0,
      maxFat: parseFloat(maxFat) || 10.0,
      minSnf: parseFloat(minSnf) || 6.0,
      maxSnf: parseFloat(maxSnf) || 12.0,
      minDegree: parseFloat(minDegree) || 20,
      maxDegree: parseFloat(maxDegree) || 40,
      status: "Active",
    });

    return res.status(201).json({
      success: true,
      message: `Rate configurator for ${animalType} saved successfully.`,
      data: newConfig,
    });
  } catch (error) {
    console.error("[RateChartConfig] saveRateChartConfig error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// ─── GET /api/rates ───────────────────────────────────────────────────────────
exports.getActiveRateChartConfigs = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const configs = await rateChartConfigModel
      .find({ adminId, status: "Active" })
      .sort({ animalType: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: "Active rate chart configs fetched successfully.",
      data: configs,
    });
  } catch (error) {
    console.error("[RateChartConfig] getActiveRateChartConfigs error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};
