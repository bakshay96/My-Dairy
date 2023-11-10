const mongoose=require("mongoose");

// milk provider model
const milkProviderSchema=new mongoose.Schema(
    {
        userId:{type:Number,required:true},
        name:{type:String, required:[true,"Please add the full name"]},
        village:{type:String, required:[true, "Please add village name"]},
        mobile:{type:Number, required:[true,"Please add mobile number"]},
        email:{type:String, required:[true,"Please add email ID"]},
        milk:[
            {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Milk"
        }]

    },
    {
        timestamps:true
    }
);

const milkProviderModel=mongoose.model("MilkProvider",milkProviderSchema);

module.exports={
    milkProviderModel,
}