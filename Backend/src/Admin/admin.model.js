const { getMaxListeners } = require("events");
const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      message: "User name should be required.",
    },
    gender: {
      type: String,
      default: "Male",
      enum: ["Male", "Female", "Other"],
      message: "Gender should be required.",
    },
    village: {
      type: String,
      required: true,
      message: "Village name should be required..!",
    },
    shopName: {
      type: String,
      required: true,
      message: "Shop  name should be required.",
      maxlength: "20",
    },
    mobile: {
      type: String,
      required: true,
      message: "mobile number should be required.",
      maxlength: "10",
      minlength: "10",
      index: true,
      unique:true
    },
    email: {
      type: String,
      default:"milkify@gmail.com",
      message: "email id should be required.",
    },
    password: {
      type: String,
      required: true,
      message: "Password should be required.",
      minlength: "4",
    },
    Status: {
      type: String,
      enum: ["Active", "Pause"],
      default: "Active",
    },
    role: {
      type: String,
      enum: ["Farmer", "Admin"],
      default: "Admin",
    },
    key: { type: String },
    
  },
  {
    timestamps: true,
  }
);

const AdminModel = mongoose.model("Admin", adminSchema);

module.exports = {
  AdminModel,
};
