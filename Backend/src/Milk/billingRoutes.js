const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  getFarmerBillingSummary,
  getAllFarmersBillingSummary,
  getCurrentCycle,
  getTenDayBilling,
  getFarmerBillingBreakdown,
  getBillingSlipData,
} = require("./billing.controller");

const billingRouter = express.Router();
billingRouter.use(authMiddleware);

billingRouter.get("/current-cycle",    getCurrentCycle);
billingRouter.get("/10-day",           getTenDayBilling);
billingRouter.get("/slip/:farmerId",   getBillingSlipData);
billingRouter.get("/all",              getAllFarmersBillingSummary);
billingRouter.get("/farmer/:farmerId", getFarmerBillingSummary);
billingRouter.get("/breakdown/:farmerId", getFarmerBillingBreakdown);

module.exports = { billingRouter };
// No extra code here.
