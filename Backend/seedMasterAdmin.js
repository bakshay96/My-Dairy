/**
 * seedMasterAdmin.js
 * Run once to create the master admin account:
 *   node seedMasterAdmin.js
 *
 */
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt   = require("bcrypt");
const { MasterAdminModel } = require("./src/MasterAdmin/masterAdmin.model");

const USERNAME  = process.env.MASTER_USERNAME || "masteradmin";
const PASSWORD  = process.env.MASTER_PASSWORD || "Milkify@Master2024";
const EMAIL     = process.env.MASTER_EMAIL    || "master@milkify.app";

async function seed() {
  await mongoose.connect(process.env.mongo_url);
  console.log("✓ Connected to MongoDB");

  const exists = await MasterAdminModel.findOne({ username: USERNAME });
  if (exists) {
    console.log("⚠  Master admin already exists. Aborting.");
    process.exit(0);
  }

  const hashed = await bcrypt.hash(PASSWORD, 10);
  await MasterAdminModel.create({
    firstName: "Master",
    lastName:  "Admin",
    mobile:    "9999999999",
    email:     EMAIL,
    username:  USERNAME,
    password:  hashed,
    key:       PASSWORD,
    role:      "master_admin",
    isActive:  true,
  });

  console.log("✅ Master admin created successfully!");
  console.log("   Credentials were configured from environment/default values (not displayed).");
  console.log("   Password : [REDACTED]");
  process.exit(0);
}

seed().catch((err) => {
  console.error("✗ Seed failed:", err.message);
  process.exit(1);
});
