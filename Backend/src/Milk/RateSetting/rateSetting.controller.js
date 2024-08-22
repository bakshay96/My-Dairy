const { rateSettingModel } = require("./rateSetting.model");


exports.createOrUpdateRateSetting = async (req, res) => {
    const { milkCategory, ratePerFat, additionalRateFactors } = req.body;

    try {
        let rateSetting = await rateSettingModel.findOneAndUpdate(
            { adminId: req.admin.id, milkCategory },
            { ratePerFat, additionalRateFactors },
            { new: true, upsert: true } // Create new if not exists
        );
        res.json({message:"success",rateSetting});
    } catch (error) {
        res.status(500).json({message:'Server Error',error:error,message});
    }
};

exports.getRateSettings = async (req, res) => {
    try {
        const rateSettings = await rateSettingModel.find({ adminId: req.admin.id });
        res.json({message:"success", rate:rateSettings});
    } catch (error) {
        res.status(500).json({message:'Server Error',error:error.message});
    }
};
