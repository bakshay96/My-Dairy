const mongoose = require('mongoose');

const RateSettingSchema = new mongoose.Schema({
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },
    milkCategory: {
        type: String,
        enum: ['cow', 'buffalo', 'sheep', 'goat'] ,// Add more categories as needed
        default:"cow",
        required: true
    },
    ratePerFat: {
        type: Number,
        required: true
    },
    additionalRateFactors: {
        type: Map,
        of: String,
        default: {}
    },
    time: {
        type: Date,
        default: Date.now
    },
    status:{
        type:String,
        enum:['Active','Inactive'],
        default:'Active',
        required:true,
    }
},{
    timestamps:true,
});

const rateSettingModel = mongoose.model('RateSetting', RateSettingSchema);
module.exports={
    rateSettingModel
}
