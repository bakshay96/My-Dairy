// ============================================
// MILK SERVICE - Business Logic Layer
// ============================================
const { MilkModel } = require("../milk.model");
const { FarmerModel } = require("../../Farmer/farmer.model");
const { RateSettingModel } = require("../RateSetting/rateSetting.model");

class MilkService {
  /**
   * Submit milk collection
   * @param {Object} milkData - Milk submission data
   * @returns {Object} - Created milk record
   */
  async submitMilk(milkData) {
    const { farmerId, category, liter, fat, snf, water, degree, shift } = milkData;

    // Verify farmer exists
    const farmer = await FarmerModel.findById(farmerId);
    if (!farmer) {
      const error = new Error("Farmer not found");
      error.statusCode = 404;
      throw error;
    }

    // Get current rates for this category
    const rateSettings = await RateSettingModel.findOne({ category });
    if (!rateSettings) {
      const error = new Error(`Rate not configured for category: ${category}`);
      error.statusCode = 400;
      throw error;
    }

    // Calculate rate based on quality
    const fatSurcharge = (fat - 3.5) * rateSettings.fatSurcharge; // Assume base fat is 3.5%
    const snfSurcharge = (snf - 8) * rateSettings.snfSurcharge; // Assume base SNF is 8%
    const totalRate = rateSettings.baseRate + fatSurcharge + snfSurcharge;
    const totalAmount = liter * totalRate;

    // Determine shift (morning or evening)
    const currentHour = new Date().getHours();
    const determinedShift = shift || (currentHour < 12 ? "morning" : "evening");

    // Create milk record
    const newMilk = new MilkModel({
      farmerId,
      category,
      liter,
      fat,
      snf,
      water,
      degree,
      shift: determinedShift,
      rate: totalRate,
      amount: totalAmount,
      submittedAt: new Date(),
    });

    const savedMilk = await newMilk.save();

    return {
      success: true,
      message: "Milk submitted successfully",
      data: {
        ...savedMilk.toObject(),
        farmerName: `${farmer.firstName} ${farmer.lastName}`,
      },
    };
  }

  /**
   * Get milk records with filters
   * @param {Object} filters - Filter criteria
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Object} - Milk records with pagination
   */
  async getMilkRecords(filters = {}, page = 1, limit = 10) {
    const query = {};

    // Apply filters
    if (filters.farmerId) query.farmerId = filters.farmerId;
    if (filters.category) query.category = filters.category;
    if (filters.shift) query.shift = filters.shift;

    // Date range filter
    if (filters.startDate || filters.endDate) {
      query.submittedAt = {};
      if (filters.startDate) query.submittedAt.$gte = new Date(filters.startDate);
      if (filters.endDate) query.submittedAt.$lte = new Date(filters.endDate);
    }

    const skip = (page - 1) * limit;
    const records = await MilkModel.find(query)
      .populate("farmerId", "firstName lastName email")
      .skip(skip)
      .limit(limit)
      .sort({ submittedAt: -1 });

    const total = await MilkModel.countDocuments(query);

    return {
      success: true,
      data: records,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get milk stats by farmer
   * @param {string} farmerId - Farmer ID
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @returns {Object} - Milk statistics
   */
  async getMilkStatsByFarmer(farmerId, startDate, endDate) {
    const query = { farmerId };

    if (startDate || endDate) {
      query.submittedAt = {};
      if (startDate) query.submittedAt.$gte = new Date(startDate);
      if (endDate) query.submittedAt.$lte = new Date(endDate);
    }

    const records = await MilkModel.find(query);

    const stats = {
      totalSubmissions: records.length,
      totalLiter: records.reduce((sum, r) => sum + r.liter, 0),
      totalAmount: records.reduce((sum, r) => sum + r.amount, 0),
      averageFat: (records.reduce((sum, r) => sum + r.fat, 0) / records.length).toFixed(2) || 0,
      averageSNF: (records.reduce((sum, r) => sum + r.snf, 0) / records.length).toFixed(2) || 0,
      averageRate: (records.reduce((sum, r) => sum + r.rate, 0) / records.length).toFixed(2) || 0,
      byCategory: this._calculateByCategory(records),
      byShift: this._calculateByShift(records),
    };

    return {
      success: true,
      data: stats,
    };
  }

  /**
   * Get all milk stats (dashboard)
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @returns {Object} - Overall statistics
   */
  async getAllMilkStats(startDate, endDate) {
    const query = {};

    if (startDate || endDate) {
      query.submittedAt = {};
      if (startDate) query.submittedAt.$gte = new Date(startDate);
      if (endDate) query.submittedAt.$lte = new Date(endDate);
    }

    const records = await MilkModel.find(query).populate("farmerId", "firstName lastName");

    const stats = {
      totalSubmissions: records.length,
      totalLiter: records.reduce((sum, r) => sum + r.liter, 0),
      totalAmount: records.reduce((sum, r) => sum + r.amount, 0),
      totalFarmers: new Set(records.map((r) => r.farmerId?._id)).size,
      averageFat: (records.reduce((sum, r) => sum + r.fat, 0) / records.length).toFixed(2) || 0,
      averageSNF: (records.reduce((sum, r) => sum + r.snf, 0) / records.length).toFixed(2) || 0,
      byCategory: this._calculateByCategory(records),
      byShift: this._calculateByShift(records),
    };

    return {
      success: true,
      data: stats,
    };
  }

  /**
   * Helper: Calculate stats by category
   */
  _calculateByCategory(records) {
    const categories = {};
    records.forEach((r) => {
      if (!categories[r.category]) {
        categories[r.category] = { count: 0, liter: 0, amount: 0 };
      }
      categories[r.category].count++;
      categories[r.category].liter += r.liter;
      categories[r.category].amount += r.amount;
    });
    return categories;
  }

  /**
   * Helper: Calculate stats by shift
   */
  _calculateByShift(records) {
    const shifts = {};
    records.forEach((r) => {
      if (!shifts[r.shift]) {
        shifts[r.shift] = { count: 0, liter: 0, amount: 0 };
      }
      shifts[r.shift].count++;
      shifts[r.shift].liter += r.liter;
      shifts[r.shift].amount += r.amount;
    });
    return shifts;
  }

  /**
   * Update milk record
   * @param {string} milkId - Milk ID
   * @param {Object} updateData - Data to update
   * @returns {Object} - Updated milk record
   */
  async updateMilkRecord(milkId, updateData) {
    const allowedFields = ["liter", "fat", "snf", "water", "degree", "shift"];
    const filteredData = {};

    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    });

    const updatedRecord = await MilkModel.findByIdAndUpdate(milkId, filteredData, {
      new: true,
      runValidators: true,
    }).populate("farmerId", "firstName lastName");

    if (!updatedRecord) {
      const error = new Error("Milk record not found");
      error.statusCode = 404;
      throw error;
    }

    return {
      success: true,
      message: "Milk record updated successfully",
      data: updatedRecord,
    };
  }

  /**
   * Delete milk record
   * @param {string} milkId - Milk ID
   * @returns {Object} - Deletion result
   */
  async deleteMilkRecord(milkId) {
    const deletedRecord = await MilkModel.findByIdAndDelete(milkId);
    if (!deletedRecord) {
      const error = new Error("Milk record not found");
      error.statusCode = 404;
      throw error;
    }

    return {
      success: true,
      message: "Milk record deleted successfully",
      data: deletedRecord,
    };
  }
}

module.exports = new MilkService();
