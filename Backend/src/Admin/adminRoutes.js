const express = require("express");
const {
  adminLogin,
  message,
  getCurrentUser,
  updateAdminProfile,
  logoutUser,
  registerAdmin,
  adminForgotPassword,
  changeAdminPassword,
  sendEmailOtp,
  verifyEmailOtp,
} = require("./admin.controller");
const { messageResponse } = require("../middleware/messageResponse.middleware.js");
const authMiddleware = require("../middleware/authMiddleware.js");

const AdminRouter = express.Router();

// Public routes
AdminRouter.post("/register", registerAdmin);        // Single register route (removed duplicate)
AdminRouter.post("/login", adminLogin);
AdminRouter.post("/forgot-password", adminForgotPassword);
AdminRouter.post("/send-email-otp", sendEmailOtp);
AdminRouter.post("/verify-email-otp", verifyEmailOtp);
AdminRouter.post("/message", messageResponse, message);

// Protected routes
AdminRouter.get("/me", authMiddleware, getCurrentUser);
AdminRouter.put("/profile", authMiddleware, updateAdminProfile);
AdminRouter.put("/change-password", authMiddleware, changeAdminPassword);
AdminRouter.get("/logout", authMiddleware, logoutUser);

module.exports = { AdminRouter };