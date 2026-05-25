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
      fatSlabs = [],
      snfSlabs = [],
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

    // ── Validate FAT slabs ─────────────────────────────────────────────
    const validatedFatSlabs = _validateAndSortSlabs(fatSlabs, "FAT", "fromFat", "toFat");
    if (validatedFatSlabs.error) {
      return res.status(400).json({ success: false, message: validatedFatSlabs.error });
    }

    // ── Validate SNF slabs ─────────────────────────────────────────────
    const validatedSnfSlabs = _validateAndSortSlabs(snfSlabs, "SNF", "fromSnf", "toSnf");
    if (validatedSnfSlabs.error) {
      return res.status(400).json({ success: false, message: validatedSnfSlabs.error });
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
      fatSlabs: validatedFatSlabs.data,
      snfSlabs: validatedSnfSlabs.data,
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

/**
 * Validate and sort slab array.
 * - Each slab must have from < to, incrementPerPoint >= 0.
 * - Slabs must be sorted ascending by from value.
 * - Slabs must not overlap (each slab's from must be >= previous slab's to).
 * @returns {{ data: Array } | { error: string }}
 */
function _validateAndSortSlabs(slabs, label, fromKey, toKey) {
  if (!Array.isArray(slabs) || slabs.length === 0) {
    return { data: [] };
  }

  // Parse and sanitize
  const parsed = slabs.map((s, i) => {
    const from = parseFloat(s[fromKey]);
    const to   = parseFloat(s[toKey]);
    const inc  = parseFloat(s.incrementPerPoint);
    if (isNaN(from) || isNaN(to) || isNaN(inc)) {
      return { error: `${label} Slab #${i + 1}: All fields must be valid numbers.` };
    }
    if (from >= to) {
      return { error: `${label} Slab #${i + 1}: 'From' (${from}) must be less than 'To' (${to}).` };
    }
    if (inc < 0) {
      return { error: `${label} Slab #${i + 1}: Increment per point must be ≥ 0.` };
    }
    return { [fromKey]: from, [toKey]: to, incrementPerPoint: inc };
  });

  // Check for validation errors in individual slabs
  const errSlab = parsed.find(s => s.error);
  if (errSlab) return { error: errSlab.error };

  // Sort ascending by from value
  parsed.sort((a, b) => a[fromKey] - b[fromKey]);

  // Check non-overlapping: each slab's from must be >= previous slab's to
  for (let i = 1; i < parsed.length; i++) {
    if (parsed[i][fromKey] < parsed[i - 1][toKey]) {
      return {
        error: `${label} Slabs overlap: Slab #${i} ends at ${parsed[i - 1][toKey]} but Slab #${i + 1} starts at ${parsed[i][fromKey]}.`,
      };
    }
  }

  return { data: parsed };
}

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
