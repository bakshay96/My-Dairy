/**
 * subscriptionGuard middleware
 * Blocks access to protected routes if admin's subscription has expired.
 * Must be used AFTER authMiddleware (req.admin must exist).
 */
const { SubscriptionModel } = require("../MasterAdmin/subscription.model");
const { _createTrialSubscription } = require("../MasterAdmin/masterAdmin.controller");

const subscriptionGuard = async (req, res, next) => {
  try {
    const adminId = req.admin._id;
    let sub = await SubscriptionModel.findOne({ adminId });

    // Auto-create trial if none exists (e.g. legacy accounts)
    if (!sub) {
      sub = await _createTrialSubscription(adminId);
    }

    const now = new Date();
    const isTrial  = sub.status === "trial"  && sub.trialEndDate && now <= sub.trialEndDate;
    const isActive = sub.status === "active" && sub.endDate      && now <= sub.endDate;

    if (!isTrial && !isActive) {
      return res.status(402).json({
        success: false,
        message: "Subscription expired. Please renew to continue.",
        code: "SUBSCRIPTION_EXPIRED",
        data: {
          status:       sub.status,
          plan:         sub.plan,
          endDate:      sub.endDate,
          trialEndDate: sub.trialEndDate,
        },
      });
    }

    // Attach subscription info to request for downstream use
    req.subscription = sub;
    next();
  } catch (err) {
    // Don't block on subscription errors — log and allow through
    console.error("[SubscriptionGuard] Error:", err.message);
    next();
  }
};

module.exports = subscriptionGuard;
