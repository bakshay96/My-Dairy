const mongoose=require("mongoose");

const adminSchema=mongoose.Schema(
    {
        name:{type:String, required:[true,"Please add the full name"]},
        village:{type:String, required:[true, "Please add village name"]},
        shopName:{type:String, required:[true, "Please add your shop name"]},
        mobile:{type:Number, required:[true,"Please add mobile number"]},
        email:{type:String, required:[true,"Please add email ID"]},
        password:{type:String, required:[true, "Please add six digit password"]},
        key:{type:String},


    },
    {
        timestamp:true
    }
);

const adminModel=mongoose.model("Admin",adminSchema);

module.exports={
    adminModel,
}