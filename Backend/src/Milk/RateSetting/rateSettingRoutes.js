const express = require("express");
const authMiddleware = require("../../middleware/authMiddleware");
const {
  createRateSetting,
  getActiveRates,
  getAllRateSettings,
  deleteRateCollection,
} = require("./rateSetting.controller");

const rateRouter = express.Router();

// POST /api/rate  — Create new rate (deactivates previous for same category)
rateRouter.post("/", authMiddleware, createRateSetting);

// GET /api/rate/active — Fetch only Active rates for the authenticated admin
rateRouter.get("/active", authMiddleware, getActiveRates);

// GET /api/rate — Fetch ALL rates (active + inactive) — legacy support
rateRouter.get("/", authMiddleware, getAllRateSettings);

// DELETE /api/rate/:id — Delete a specific rate record
rateRouter.delete("/:id", authMiddleware, deleteRateCollection);

module.exports = rateRouter;
