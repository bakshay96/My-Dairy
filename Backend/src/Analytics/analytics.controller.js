const mongoose = require("mongoose");
const { MilkModel } = require("../Milk/milk.model");
const { farmerModel } = require("../Farmer/farmer.model");
const { getBillingCycleDate, getBillingCycleEnd } = require("../utils/milkCalculator");

exports.getDashboardStats = async (req, res) => {
  try {
    const adminId = new mongoose.Types.ObjectId(req.admin._id || req.params.adminId);

    // 1. Total Active Farmers
    const totalFarmers = await farmerModel.countDocuments({ adminId });

    // 2. Today's totals (Start of day to End of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayPipeline = [
      {
        $match: {
          adminId,
          createdAt: { $gte: today, $lt: tomorrow }
        }
      },
      {
        $group: {
          _id: null,
          totalLitersToday: { $sum: "$litter" },
          avgFatToday: { $avg: "$fat" }
        }
      }
    ];

    const todayStats = await MilkModel.aggregate(todayPipeline);
    const totalLitersToday = todayStats[0]?.totalLitersToday || 0;
    const avgFatToday = todayStats[0]?.avgFatToday || 0;

    // 3. Current Billing Cycle Total Amount Owed
    const cycleStart = getBillingCycleDate();
    const cycleEnd = getBillingCycleEnd(cycleStart);
    
    // For string comparisons or date comparisons based on how dates are stored
    const cycleStartObj = new Date(cycleStart);
    const cycleEndObj = new Date(cycleEnd + "T23:59:59.999Z");

    const cyclePipeline = [
      {
        $match: {
          adminId,
          createdAt: { $gte: cycleStartObj, $lte: cycleEndObj }
        }
      },
      {
        $group: {
          _id: null,
          totalAmountOwed: { $sum: "$calculatedAmount" }
        }
      }
    ];

    const cycleStats = await MilkModel.aggregate(cyclePipeline);
    const totalAmountOwed = cycleStats[0]?.totalAmountOwed || 0;

    res.status(200).json({
      success: true,
      data: {
        totalFarmers,
        totalLitersToday: parseFloat(totalLitersToday.toFixed(2)),
        avgFatToday: parseFloat(avgFatToday.toFixed(2)),
        totalAmountOwed: parseFloat(totalAmountOwed.toFixed(2)),
        cycleStart,
        cycleEnd
      }
    });

  } catch (error) {
    console.error("getDashboardStats error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
