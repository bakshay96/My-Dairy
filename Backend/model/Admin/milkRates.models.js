const mongoose=require("mongoose");

const milkRateSchema= new mongoose.Schema({
    milkRate:{
        type:Number,
        default:32
    }

},{timestamps:true})

const milkRateModels=mongoose.model("MilkRate",milkRateSchema)

module.exports={
    milkRateModels
}