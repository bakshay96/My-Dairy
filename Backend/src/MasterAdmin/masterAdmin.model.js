const mongoose = require("mongoose");

const master_adminSchema = new mongoose.Schema(
  {
    firstName: { type: String, required:true, message: 'User firstname should be required.' },
    lastName: { type: String, required:true, message: 'User lastname should be required.' },
    mobile: {type: String,required: true, message: 'mobile number should be required.' , maxlength:"10",minlength:"10",index:true},
    email: { type: String, required: true, message: 'email id should be required.' },
    password: {type: String,required: true, message: 'Password should be required.', minlength:"4" },
    key: { type: String },
    
  },
  {
    timestamps: true,
  }
);

const MasterAdminModel = mongoose.model("master", master_adminSchema);

module.exports = {
  MasterAdminModel,
};
