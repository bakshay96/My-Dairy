const { StoreProfileModel, StoreProductModel, StoreOrderModel } = require("../models");

/**
 * Master Admin: Get platform-wide e-commerce stats across all registered dairy stores
 */
exports.getMasterStoreNetworkStats = async (req, res) => {
  try {
    const [totalOutlets, totalProducts, totalOrders] = await Promise.all([
      StoreProfileModel.countDocuments(),
      StoreProductModel.countDocuments(),
      StoreOrderModel.countDocuments(),
    ]);

    // GMV calculation
    const revenueAgg = await StoreOrderModel.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, totalGMV: { $sum: "$grandTotal" }, orderCount: { $sum: 1 } } },
    ]);
    const totalGMV = revenueAgg[0]?.totalGMV || 0;

    // Outlets list with active subscriber validation
    const outlets = await StoreProfileModel.find()
      .populate("adminId", "shopName name mobile village email Status createdAt")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      stats: {
        totalOutlets,
        totalProducts,
        totalOrders,
        totalGMV,
      },
      outlets,
    });
  } catch (error) {
    console.error("getMasterStoreNetworkStats error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Master Admin: Toggle store access for an outlet
 */
exports.toggleMasterOutletStatus = async (req, res) => {
  try {
    const { outletId } = req.params;
    const profile = await StoreProfileModel.findById(outletId);
    if (!profile) {
      return res.status(404).json({ success: false, message: "Store outlet not found" });
    }

    profile.isStoreEnabled = !profile.isStoreEnabled;
    await profile.save();

    res.status(200).json({
      success: true,
      message: `Store outlet is now ${profile.isStoreEnabled ? "enabled" : "disabled"}`,
      profile,
    });
  } catch (error) {
    console.error("toggleMasterOutletStatus error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
