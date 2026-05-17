const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { getDashboardStats, getAiInsights } = require("./analytics.controller");

const analyticsRouter = express.Router();

analyticsRouter.use(authMiddleware);

analyticsRouter.get("/dashboard-stats/:adminId?", getDashboardStats);
analyticsRouter.get("/ai-insights/:adminId?", getAiInsights);

module.exports = { analyticsRouter };
