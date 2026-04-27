const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { getDashboardStats } = require("./analytics.controller");

const analyticsRouter = express.Router();

analyticsRouter.use(authMiddleware);

analyticsRouter.get("/dashboard-stats/:adminId?", getDashboardStats);

module.exports = { analyticsRouter };
