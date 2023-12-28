const mongoose = require("mongoose");

// milk provider model
const userSchema = new mongoose.Schema(
  {
    //auto generated
    userId: {
      type: Number,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: [true, "Please add first and last name"],
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      default: "Male",
    },
    village: {
      type: String,
      required: [true, "Please add village name"],
    },
    mobile: {
      type: String,
      required: true,
      message: "mobile number should be required.",
      maxlength: "10",
      minlength: "10",
      index: true,
      unique: true,
    },
    Status: {
      type: String,
      enum: ["Active", "Pause"],
      default: "Active",
    },
    role: {
      type: String,
      enum: ["Farmer", "Admin"],
      default: "Farmer",
    },
    email: {
      type: String,
      required: [true, "Please add email ID"],
      default: "milkify@gmail.com",
    },
    milks: [],
  },
  {
    timestamps: true,
  }
);

const UserModel = mongoose.model("user", userSchema);

module.exports = {
  UserModel,
};
