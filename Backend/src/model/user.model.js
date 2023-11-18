const mongoose=require("mongoose");

// milk provider model
const userSchema=new mongoose.Schema(
    {
        userId:{type:Number,required:true,unique:true},  //auto generated
        name:{type:String, required:[true,"Please add the full name"]},
        gender: { type: String, required:true, enum:["Male","Female","Other"], message: 'Gender should be required.' },
        village:{type:String, required:[true, "Please add village name"]},
        mobile:{type:Number, required:[true,"Please add mobile number"],unique:true,index:true},
        email:{type:String, required:[true,"Please add email ID"]},
        milks:[
        ]
        

    },
    {
        timestamps:true
    }
);

const UserModel=mongoose.model("user",userSchema);

module.exports={
    UserModel,
}