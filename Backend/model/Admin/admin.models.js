const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Please add the full name"] },
    village: { type: String, required: [true, "Please add village name"] },
    shopName: { type: String, required: [true, "Please add your shop name"] },
    mobile: {type: Number,required: [true, "Please add mobile number"], unique: true,},
    email: { type: String, required: [true, "Please add email ID"] },
    password: {type: String,required: [true, "password is required"],},
    key: { type: String },
    totalMilkProviders:[{
      type:mongoose.Schema.Types.ObjectId,
      ref:"MilkProvider"
    }]
  },
  {
    timestamps: true,
  }
);

const adminModel = mongoose.model("Admin", adminSchema);

module.exports = {
  adminModel,
};
