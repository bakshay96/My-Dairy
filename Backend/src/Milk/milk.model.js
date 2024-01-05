const mongoose = require("mongoose");

const milkSchema = new mongoose.Schema(
  {
    mobile: {
      type: Number,
      required: true,
    },
    shift:{    
        type:String,   // auto update based on time
        require:[true, "Please Specify shift"],
        enum:["morning","evening"]
    },
    category: {
      type: String,
      enum: ["cow", "buffalo", "goat"],
      default: "cow",
    },
    snf: {
      type: Number,
      required: [true, "SNF Required"],
    },
    fat: {
      type: Number,
      required: [true, "FAT Required"],
    },
    water: {
      type: Number,
      default: 0.0,
    },
    degree:{
      type:Number,
      default:0.0,
    },
    litter: {
      type: Number,
      required: [true, "FAT Required"],
      default: 0.0,
    },
    date: {
                    // auto set
      type: String,
      required:[true,"date Required"] // Automatically set to the current date and time
    },
    // milkOwner:{
    //     type:mongoose.Schema.Types.ObjectId,
    //     ref:"user"
    // },
    // adminOwner:{
    //     type:mongoose.Schema.Types.ObjectId,
    //     ref:"Admin",
    //     required:true
    // }
  },
  { timestamps: true }
);

const MilkModel = mongoose.model("milk", milkSchema);

module.exports = {
  MilkModel,
};

