const mongoose=require("mongoose");


const milkSchema=new mongoose.Schema({
    userId :{
        type:Number,
        required:true,
        
    },
    category:{
        type:String,
        
        enum:["COW","BUFFALO"],
        default:"COW"

    },
    SNF:{
        type:Number,
        required:true,
        default:0.0
    },
    FAT:{
        type:Number,
        required:true,
        default:0.0
    },
    water:{
        type:Number,
        required:true,
        default:0.0
    },
    liter:{
        type:String,
        required:true,
        default:0.0
   },
   date: {
    
    type: Number,
    default:  new Date().getTimezoneOffset() // Automatically set to the current date and time
  }
    // milkOwner:{
    //     type:mongoose.Schema.Types.ObjectId,
    //     ref:"user"
    // },
    // adminOwner:{
    //     type:mongoose.Schema.Types.ObjectId,
    //     ref:"Admin",
    //     required:true
    // } 
    
},{timestamps:true})

const MilkModel=mongoose.model("milk",milkSchema);

module.exports={
    MilkModel
}