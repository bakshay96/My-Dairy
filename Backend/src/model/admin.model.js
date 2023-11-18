const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required:true, message: 'User name should be required.' },
    gender: { type: String, required:true, enum:["Male","Female","Other"], message: 'Gender should be required.' },
    village: { type: String, required: true,  message: 'User name should be required.' },
    shopName: { type: String, required: true,  message: 'Shop  name should be required.' },
    mobile: {type: String,required: true, message: 'mobile number should be required.' , maxlength:"10",minlength:"10",index:true},
    email: { type: String, required: true, message: 'email id should be required.' },
    password: {type: String,required: true, message: 'Password should be required.', minlength:"4" },
    key: { type: String },
    
  },
  {
    timestamps: true,
  }
);

const AdminModel = mongoose.model("admin", adminSchema);

module.exports = {
  AdminModel,
};
