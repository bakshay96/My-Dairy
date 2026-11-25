const express = require("express");
const {
  adminLogin,
  message,
  getCurrentUser,
  updateAdminProfile,
  uploadAdminPhoto,
  deleteAdminPhoto,
  logoutUser,
  registerAdmin,
  adminForgotPassword,
  changeAdminPassword,
  sendEmailOtp,
  verifyEmailOtp,
  getMyNotificationSettings,
  updateMyNotificationSettings,
} = require("./admin.controller");
const { messageResponse } = require("../middleware/messageResponse.middleware.js");
const authMiddleware = require("../middleware/authMiddleware.js");
const { upload } = require("../middleware/upload.middleware.js");

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
AdminRouter.post("/photo", authMiddleware, upload.single("photo"), uploadAdminPhoto);
AdminRouter.delete("/photo", authMiddleware, deleteAdminPhoto);
AdminRouter.put("/change-password", authMiddleware, changeAdminPassword);
AdminRouter.get("/notification-settings", authMiddleware, getMyNotificationSettings);
AdminRouter.put("/notification-settings", authMiddleware, updateMyNotificationSettings);
AdminRouter.get("/logout", authMiddleware, logoutUser);

module.exports = { AdminRouter };