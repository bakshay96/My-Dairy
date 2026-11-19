const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
require("dotenv").config({ path: "../../.env" });

const mongoose = require("mongoose");
const { AdminModel } = require("../Admin/admin.model");
const { MasterAdminModel } = require("../MasterAdmin/masterAdmin.model");
const { farmerModel } = require("../Farmer/farmer.model");

const runMigration = async () => {
  const mongoUrl = process.env.mongo_url || process.env.MONGO_URL || process.env.MONGODB_URI;
  if (!mongoUrl) {
    console.error("No Mongo URL found in env");
    process.exit(1);
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(mongoUrl, { family: 4, serverSelectionTimeoutMS: 15000 });
  console.log("✓ Connected to MongoDB for Member ID Migration");

  // 1. MIGRATE MASTER ADMINS: MI-MST-001, MI-MST-002...
  console.log("\n--- Migrating Master Admins ---");
  const masters = await MasterAdminModel.find().sort({ createdAt: 1 });
  let masterIndex = 1;
  for (const master of masters) {
    const expectedId = `MI-MST-${String(masterIndex).padStart(3, "0")}`;
    if (!master.memberId || !master.memberId.startsWith("MI-MST-")) {
      master.memberId = expectedId;
      await master.save();
      console.log(`[MasterAdmin] Assigned ${expectedId} to ${master.username} (${master.email})`);
    } else {
      console.log(`[MasterAdmin] Already has ${master.memberId} for ${master.username}`);
    }
    masterIndex++;
  }

  // 2. MIGRATE DAIRY ADMINS: MI-DA-001, MI-DA-002...
  console.log("\n--- Migrating Dairy Admins ---");
  const admins = await AdminModel.find().sort({ createdAt: 1 });
  let adminIndex = 1;
  const adminIdToMemberIdMap = {};

  for (const admin of admins) {
    const expectedId = `MI-DA-${String(adminIndex).padStart(3, "0")}`;
    if (!admin.memberId || !admin.memberId.startsWith("MI-DA-")) {
      admin.memberId = expectedId;
      await admin.save();
      console.log(`[DairyAdmin] Assigned ${expectedId} to ${admin.name} (${admin.shopName})`);
    } else {
      console.log(`[DairyAdmin] Already has ${admin.memberId} for ${admin.name}`);
    }
    adminIdToMemberIdMap[String(admin._id)] = admin.memberId;
    adminIndex++;
  }

  // 3. MIGRATE FARMERS:
  // - Self-farmer of Admin: MI-DAS-001, MI-DAS-002...
  // - Regular Farmers: MI-FAR-0001, MI-FAR-0002...
  console.log("\n--- Migrating Farmers ---");
  const farmers = await farmerModel.find().sort({ createdAt: 1 });
  let regularFarmerIndex = 1;

  for (const farmer of farmers) {
    const adminMemberId = adminIdToMemberIdMap[String(farmer.adminId)] || "MI-DA-001";
    const adminSeq = adminMemberId.replace(/^MI-DA-/i, "");

    // Check if this is the dairy admin's self profile
    const isSelfFarmer = farmer.memberId === "MI-000" || farmer.village === "Self";

    if (isSelfFarmer) {
      const selfId = `MI-DAS-${adminSeq}`;
      farmer.memberId = selfId;
      await farmer.save();
      console.log(`[SelfFarmer] Assigned ${selfId} to Dairy Owner self profile: ${farmer.name}`);
    } else {
      const farId = `MI-FAR-${String(regularFarmerIndex).padStart(4, "0")}`;
      farmer.memberId = farId;
      await farmer.save();
      console.log(`[Farmer] Assigned ${farId} to Farmer: ${farmer.name} (${farmer.mobile})`);
      regularFarmerIndex++;
    }
  }

  console.log("\n✓ All existing users successfully migrated to unique standardized Member IDs!");
  await mongoose.disconnect();
  process.exit(0);
};

runMigration().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
