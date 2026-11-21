/**
 * broadcastSprintRollout.js
 * Creates a Master Admin system-wide announcement/alert to all Admin users
 * broadcasting the new Configurable Billing Cycles & Sprint Billing Rollout.
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const { MasterAdminModel } = require("../src/MasterAdmin/masterAdmin.model");
const { AdvertisementModel } = require("../src/MasterAdmin/advertisement.model");
const { AdminModel } = require("../src/Admin/admin.model");

async function broadcastRollout() {
  const mongoUrl = process.env.mongo_url || process.env.MONGO_URL || process.env.MONGODB_URI;
  if (!mongoUrl) {
    console.error("MongoDB connection URL missing from .env");
    process.exit(1);
  }

  await mongoose.connect(mongoUrl.trim());
  console.log("Connected to MongoDB for Master Admin broadcast...");

  // Find or create Master Admin for attribution
  let master = await MasterAdminModel.findOne({ isActive: true });
  if (!master) {
    master = await MasterAdminModel.create({
      firstName: "Milkify",
      lastName: "MasterAdmin",
      mobile: "9999999999",
      email: "master@milkify.in",
      username: "masteradmin",
      password: "MasterPassword123!",
      role: "master_admin",
      isActive: true,
    });
    console.log("Created master admin:", master.email);
  }

  const title = "🎉 New Feature: Configurable Billing Sprints & Auto Statements";
  const message =
    "Admins can now customize billing cycles (10, 15, 20, or 30 days) starting from Day 1. When a sprint is completed, 80mm thermal PDF slips are automatically dispatched to active farmers, and polite zero-collection notices are emailed to inactive farmers for transparent reconciliation.";

  // Check if announcement already exists
  const existing = await AdvertisementModel.findOne({
    title,
    isActive: true,
    expiresAt: { $gte: new Date() },
  });

  if (existing) {
    console.log("Active broadcast advertisement already exists:", existing._id);
  } else {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14); // Visible for 14 days

    const ad = await AdvertisementModel.create({
      createdBy: master._id,
      title,
      message,
      type: "update",
      targetAdmins: [], // Broadcasts to ALL admins
      visibleFrom: new Date(),
      expiresAt,
      visibleDurationHours: 336, // 14 days
      priority: 5,
      ctaLabel: "Open Billing Hub",
      ctaUrl: "/dashboard/billing",
      isActive: true,
    });

    console.log("✓ Successfully created Master Admin rollout announcement:", ad._id);
  }

  const totalAdmins = await AdminModel.countDocuments();
  console.log(`✓ Broadcast announcement is live and accessible to all ${totalAdmins} dairy admins!`);

  await mongoose.connection.close();
  console.log("MongoDB connection closed.");
  process.exit(0);
}

broadcastRollout().catch((err) => {
  console.error("Broadcast failed:", err);
  process.exit(1);
});
