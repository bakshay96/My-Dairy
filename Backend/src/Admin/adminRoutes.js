const express = require("express");
const {
  adminLogin,
  message,
  getCurrentUser,
  logoutUser,
  registerAdmin,
} = require("./admin.controller");
const { messageResponse } = require("../middleware/messageResponse.middleware.js");
const authMiddleware = require("../middleware/authMiddleware.js");

const AdminRouter = express.Router();

// Public routes
AdminRouter.post("/register", registerAdmin);        // Single register route (removed duplicate)
AdminRouter.post("/login", adminLogin);
AdminRouter.post("/message", messageResponse, message);

// Protected routes
AdminRouter.get("/me", authMiddleware, getCurrentUser);
AdminRouter.get("/logout", authMiddleware, logoutUser);

module.exports = { AdminRouter };