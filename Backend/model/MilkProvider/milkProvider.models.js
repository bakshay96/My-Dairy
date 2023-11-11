const mongoose=require("mongoose");

// milk provider model
const milkProviderSchema=new mongoose.Schema(
    {
        userId:{type:Number,required:true,unique:true},  //auto generated
        name:{type:String, required:[true,"Please add the full name"]},
        gender: { type: String, required:true, enum:["M","F","O"], message: 'Gender should be required.' },
        village:{type:String, required:[true, "Please add village name"]},
        mobile:{type:Number, required:[true,"Please add mobile number"],unique:true},
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