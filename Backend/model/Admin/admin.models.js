const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required:true, message: 'User name should be required.' },
    gender: { type: String, required:true, enum:["M","F","O"], message: 'Gender should be required.' },
    village: { type: String, required: true,  message: 'User name should be required.' },
    shopName: { type: String, required: true,  message: 'Shop  name should be required.' },
    mobile: {type: Number,required: true, message: 'mobile number should be required.' },
    email: { type: String, required: true, message: 'email id should be required.' },
    password: {type: String,required: true, message: 'Password should be required.' },
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
