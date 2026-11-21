const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  getFarmerBillingSummary,
  getAllFarmersBillingSummary,
  getCurrentCycle,
  getTenDayBilling,
  getFarmerBillingBreakdown,
  getBillingSlipData,
  generateBillingSlipPdf,
  sendBillingEmail,
  getSprintConfig,
  updateSprintConfig,
  getSprintHistory,
  getSprintDetails,
  processSprintBilling,
} = require("./billing.controller");

const billingRouter = express.Router();
billingRouter.use(authMiddleware);

// Sprint & Billing Cycle routes (placed before param routes to avoid collision)
billingRouter.get("/sprint/config",           getSprintConfig);
billingRouter.put("/sprint/config",           updateSprintConfig);
billingRouter.get("/sprint/history",          getSprintHistory);
billingRouter.get("/sprint/details/:sprintId", getSprintDetails);
billingRouter.post("/sprint/close-and-dispatch", processSprintBilling);

billingRouter.get("/current-cycle",    getCurrentCycle);
billingRouter.get("/10-day",           getTenDayBilling);
billingRouter.get("/slip/:farmerId",   getBillingSlipData);
billingRouter.get("/all",              getAllFarmersBillingSummary);
billingRouter.get("/farmer/:farmerId", getFarmerBillingSummary);
billingRouter.get("/breakdown/:farmerId", getFarmerBillingBreakdown);
billingRouter.get("/pdf/:farmerId",   generateBillingSlipPdf);
billingRouter.post("/email/:farmerId", sendBillingEmail);

module.exports = { billingRouter };
// No extra code here.
