// ============================================
// ADMIN SERVICE - Business Logic Layer
// ============================================
const { AdminModel } = require("../admin.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

class AdminService {
  /**
   * Register a new admin
   * @param {Object} adminData - Admin registration data
   * @returns {Object} - Token and admin info
   */
  async registerAdmin(adminData) {
    const { firstName, lastName, email, password, mobileNumber } = adminData;

    // Check if admin already exists
    const existingAdmin = await AdminModel.findOne({ email });
    if (existingAdmin) {
      const error = new Error("Admin with this email already exists");
      error.statusCode = 409;
      throw error;
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new admin
    const newAdmin = new AdminModel({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      key: password, // Store plain password (consider removing in production)
      mobileNumber,
    });

    const savedAdmin = await newAdmin.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: savedAdmin._id },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    return {
      success: true,
      message: "Admin registered successfully",
      data: {
        id: savedAdmin._id,
        firstName: savedAdmin.firstName,
        lastName: savedAdmin.lastName,
        email: savedAdmin.email,
        mobileNumber: savedAdmin.mobileNumber,
        token,
      },
    };
  }

  /**
   * Login admin
   * @param {string} email - Admin email
   * @param {string} password - Admin password
   * @returns {Object} - Token and admin info
   */
  async loginAdmin(email, password) {
    // Find admin by email
    const admin = await AdminModel.findOne({ email });
    if (!admin) {
      const error = new Error("Invalid email or password");
      error.statusCode = 401;
      throw error;
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      const error = new Error("Invalid email or password");
      error.statusCode = 401;
      throw error;
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: admin._id },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    return {
      success: true,
      message: "Login successful",
      data: {
        id: admin._id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        mobileNumber: admin.mobileNumber,
        token,
      },
    };
  }

  /**
   * Get admin by ID
   * @param {string} adminId - Admin ID
   * @returns {Object} - Admin info
   */
  async getAdminById(adminId) {
    const admin = await AdminModel.findById(adminId).select("-password -key");
    if (!admin) {
      const error = new Error("Admin not found");
      error.statusCode = 404;
      throw error;
    }
    return admin;
  }

  /**
   * Update admin profile
   * @param {string} adminId - Admin ID
   * @param {Object} updateData - Data to update
   * @returns {Object} - Updated admin info
   */
  async updateAdminProfile(adminId, updateData) {
    const allowedFields = ["firstName", "lastName", "mobileNumber"];
    const filteredData = {};

    // Only allow specific fields to be updated
    allowedFields.forEach((field) => {
      if (updateData[field]) {
        filteredData[field] = updateData[field];
      }
    });

    const updatedAdmin = await AdminModel.findByIdAndUpdate(
      adminId,
      filteredData,
      { new: true }
    ).select("-password -key");

    if (!updatedAdmin) {
      const error = new Error("Admin not found");
      error.statusCode = 404;
      throw error;
    }

    return {
      success: true,
      message: "Profile updated successfully",
      data: updatedAdmin,
    };
  }
}

module.exports = new AdminService();
