// ============================================
// FARMER SERVICE - Business Logic Layer
// ============================================
const { FarmerModel } = require("../farmer.model");

class FarmerService {
  /**
   * Register a new farmer
   * @param {Object} farmerData - Farmer registration data
   * @returns {Object} - Created farmer
   */
  async registerFarmer(farmerData) {
    const { firstName, lastName, email, mobileNumber, gender, villageName } = farmerData;

    // Check if farmer already exists
    const existingFarmer = await FarmerModel.findOne({ email });
    if (existingFarmer) {
      const error = new Error("Farmer with this email already exists");
      error.statusCode = 409;
      throw error;
    }

    // Create new farmer
    const newFarmer = new FarmerModel({
      firstName,
      lastName,
      email,
      mobileNumber,
      gender,
      villageName,
      status: "Active",
    });

    const savedFarmer = await newFarmer.save();

    return {
      success: true,
      message: "Farmer registered successfully",
      data: savedFarmer,
    };
  }

  /**
   * Get all farmers with pagination
   * @param {Object} filters - Filter criteria
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Object} - Farmers list with pagination
   */
  async getAllFarmers(filters = {}, page = 1, limit = 10) {
    const query = {};

    // Apply filters
    if (filters.status) query.status = filters.status;
    if (filters.villageName) query.villageName = { $regex: filters.villageName, $options: "i" };
    if (filters.search) {
      query.$or = [
        { firstName: { $regex: filters.search, $options: "i" } },
        { lastName: { $regex: filters.search, $options: "i" } },
        { email: { $regex: filters.search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const farmers = await FarmerModel.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await FarmerModel.countDocuments(query);

    return {
      success: true,
      data: farmers,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get farmer by ID
   * @param {string} farmerId - Farmer ID
   * @returns {Object} - Farmer info
   */
  async getFarmerById(farmerId) {
    const farmer = await FarmerModel.findById(farmerId);
    if (!farmer) {
      const error = new Error("Farmer not found");
      error.statusCode = 404;
      throw error;
    }
    return farmer;
  }

  /**
   * Update farmer details
   * @param {string} farmerId - Farmer ID
   * @param {Object} updateData - Data to update
   * @returns {Object} - Updated farmer
   */
  async updateFarmer(farmerId, updateData) {
    const allowedFields = ["firstName", "lastName", "email", "mobileNumber", "gender", "villageName", "status"];
    const filteredData = {};

    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    });

    const updatedFarmer = await FarmerModel.findByIdAndUpdate(farmerId, filteredData, {
      new: true,
      runValidators: true,
    });

    if (!updatedFarmer) {
      const error = new Error("Farmer not found");
      error.statusCode = 404;
      throw error;
    }

    return {
      success: true,
      message: "Farmer updated successfully",
      data: updatedFarmer,
    };
  }

  /**
   * Delete farmer
   * @param {string} farmerId - Farmer ID
   * @returns {Object} - Deletion result
   */
  async deleteFarmer(farmerId) {
    const deletedFarmer = await FarmerModel.findByIdAndDelete(farmerId);
    if (!deletedFarmer) {
      const error = new Error("Farmer not found");
      error.statusCode = 404;
      throw error;
    }

    return {
      success: true,
      message: "Farmer deleted successfully",
      data: deletedFarmer,
    };
  }

  /**
   * Get farmer statistics
   * @param {string} farmerId - Farmer ID
   * @returns {Object} - Farmer statistics
   */
  async getFarmerStats(farmerId) {
    const farmer = await FarmerModel.findById(farmerId).populate("milkSubmissions");

    if (!farmer) {
      const error = new Error("Farmer not found");
      error.statusCode = 404;
      throw error;
    }

    // Calculate statistics
    const totalMilk = farmer.milkSubmissions?.reduce((sum, milk) => sum + milk.liter, 0) || 0;
    const avgQuality = farmer.milkSubmissions?.length
      ? farmer.milkSubmissions.reduce((sum, milk) => sum + milk.fat, 0) / farmer.milkSubmissions.length
      : 0;

    return {
      success: true,
      data: {
        farmer,
        statistics: {
          totalSubmissions: farmer.milkSubmissions?.length || 0,
          totalMilk,
          averageQuality: avgQuality.toFixed(2),
        },
      },
    };
  }
}

module.exports = new FarmerService();
