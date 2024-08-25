const { rateSettingModel } = require("./rateSetting.model");


exports.createOrUpdateRateSetting = async (req, res) => {
    const { milkCategory, ratePerFat, additionalRateFactors,status } = req.body;
    //console.log(req.body)
    try {
        // if(!milkCategory || !ratePerFat || !status)
        // {
        //     res.json({message:"All fields are mandetory",rate:[]})
        // }
        let rateSetting = await rateSettingModel.findOneAndUpdate(
            { adminId: req.admin.id, milkCategory},
            { ratePerFat, additionalRateFactors,status},
            { new: true, upsert: true } // Create new if not exists
        );
        res.json({message:"rate updated", rate:rateSetting});
    } catch (error) {
        res.status(500).json({message:'Server Error',error:error.message});
    }
};

exports.getRateSettings = async (req, res) => {
    try {
        const rateSettings = await rateSettingModel.find({ adminId: req.admin.id });
        res.json({message:"success", rates:rateSettings});
    } catch (error) {
        res.status(500).json({message:'Server Error',error:error.message});
    }
};

// delete rate collection by id
exports.deleteRateCollection = async (req, res) => {
    try {
       const deletedRateData= await rateSettingModel.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Rate Collection deleted',rate:deletedRateData});
    } catch (error) {
        //console.error(err.message);
        res.status(500).json({message:'Server Error',error:error.message});
    }
  };
