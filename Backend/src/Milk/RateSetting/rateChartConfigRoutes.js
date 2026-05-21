const express = require("express");
const { saveRateChartConfig, getActiveRateChartConfigs } = require("./rateChartConfig.controller");

const ratesRouter = express.Router();

// POST /api/rates - Create or update rate chart configuration
ratesRouter.post("/", saveRateChartConfig);

// GET /api/rates - Get active rate configurations for the admin
ratesRouter.get("/", getActiveRateChartConfigs);

module.exports = ratesRouter;
