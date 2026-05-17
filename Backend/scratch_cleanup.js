const mongoose = require("mongoose");
require("dotenv").config();

const { AdminModel } = require("./src/Admin/admin.model");
const { farmerModel } = require("./src/Farmer/farmer.model");
const { MilkModel } = require("./src/Milk/milk.model");
const { rateSettingModel } = require("./src/Milk/RateSetting/rateSetting.model");
const { PaymentModel } = require("./src/Payment/payment.model");
const { AiInsightCacheModel } = require("./src/Analytics/aiInsightCache.model");
const { SubscriptionModel } = require("./src/MasterAdmin/subscription.model");

async function runCleanup() {
  try {
    await mongoose.connect(process.env.mongo_url);
    console.log("Connected to MongoDB...");

    // 1. Identify all admins we want to KEEP
    // Sushant (9863644354), Abhishek (9589343808), Akshay (1234567890)
    const keepMobiles = ["9863644354", "9589343808", "1234567890"];
    const keepAdmins = await AdminModel.find({ mobile: { $in: keepMobiles } });
    const keepAdminIds = keepAdmins.map(admin => admin._id);

    console.log("Keeping Admins:", keepAdmins.map(a => `${a.name} (${a.mobile})`));
    console.log("Keep Admin ObjectIDs:", keepAdminIds);

    // 2. Identify orphaned/other dependent records
    // Any record where adminId is NOT in keepAdminIds must be deleted.
    const query = { adminId: { $nin: keepAdminIds } };

    const farmersDel = await farmerModel.deleteMany(query);
    console.log(`Deleted ${farmersDel.deletedCount} orphaned/other farmers`);

    const subsDel = await SubscriptionModel.deleteMany(query);
    console.log(`Deleted ${subsDel.deletedCount} orphaned/other subscriptions`);

    const milkDel = await MilkModel.deleteMany(query);
    console.log(`Deleted ${milkDel.deletedCount} orphaned/other milk entries`);

    const ratesDel = await rateSettingModel.deleteMany(query);
    console.log(`Deleted ${ratesDel.deletedCount} orphaned/other rate settings`);

    const paymentsDel = await PaymentModel.deleteMany(query);
    console.log(`Deleted ${paymentsDel.deletedCount} orphaned/other payments`);

    const cacheDel = await AiInsightCacheModel.deleteMany(query);
    console.log(`Deleted ${cacheDel.deletedCount} orphaned/other AI insights cache`);

    // 3. Delete any other Admin documents themselves (that are not in keepAdminIds)
    const adminsDel = await AdminModel.deleteMany({ _id: { $nin: keepAdminIds } });
    console.log(`Deleted ${adminsDel.deletedCount} other admins`);

    console.log("Database deep cleanup completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Cleanup error:", error);
    process.exit(1);
  }
}

runCleanup();
