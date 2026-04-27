const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { AdminModel } = require("./src/Admin/admin.model");
require("dotenv").config();

async function seedTestAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to MongoDB...");
    
    const existingAdmin = await AdminModel.findOne({ mobile: "1234567890" });
    if (existingAdmin) {
      console.log("Test admin already exists! Updating password just in case...");
      const hashedPassword = await bcrypt.hash("test", 10);
      existingAdmin.password = hashedPassword;
      await existingAdmin.save();
      console.log("Updated password to 'test'");
    } else {
      console.log("Creating new test admin...");
      const hashedPassword = await bcrypt.hash("test", 10);
      await AdminModel.create({
        name: "Test Admin",
        mobile: "1234567890",
        password: hashedPassword,
      });
      console.log("Test admin created with 1234567890 / test");
    }
    
    process.exit(0);
  } catch (error) {
    console.error("Error seeding test admin:", error);
    process.exit(1);
  }
}

seedTestAdmin();
