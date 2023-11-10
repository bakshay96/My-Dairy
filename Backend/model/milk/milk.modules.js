const mongoose=require("mongoose");

const milkSchema=new mongoose.Schema({
    category:{
        type:String,
        required:true,
        enum:["COW","BUFFALO"],
        default:"COW"

    },
    SNF:{
        type:Number,
        required:true,
        default:0
    },
    FAT:{
        type:Number,
        required:true,
        default:0
    },
    water:{
        type:Number,
        required:true,
        default:0
    },
    liter:{
        type:Number,
        required:true,
        default:0
    },
    milkOwner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"MilkProvider",
        required:true
    },
    adminOwner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Admin",
        required:true
    } 
    
},{timestamps:true})

const milkModel=mongoose.model("Milk",milkSchema);

module.exports={
    milkModel
}