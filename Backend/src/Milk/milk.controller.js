
const { MilkModel} = require("./milk.model");
const { farmerModel } = require("../Farmer/farmer.model");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const { sendMail } = require("../middleware/sendMail");
const { rateSettingModel } = require("./RateSetting/rateSetting.model");


//add farmer milk data 
exports.addMilkData = async (req, res) => {
	const {category,fat,litter} =req.body;
	const { id } = req.params;
	try {
		

		const Farmer = await farmerModel.find({ _id: id, adminId: req.admin.id });

		if (!Farmer) {
			return res.status(200).json({ message: "User not found..!" });
		}
		const [{ name, email, mobile }] = Farmer;
   
		//auto shift desider
		const currentHour = new Date().getHours();
		const shift = currentHour < 12 ? "morning" : "evening";

		// Date in local string

		const formattedDateTime = new Date().toLocaleDateString("en-IN", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			timeZone: "Asia/Kolkata", // Indian Standard Time (IST)
			hour12: true, // Use true for 12-hour format with AM/PM
		});

		const date = formattedDateTime;


		// Fetch rate settings for the given milk category
        const rateSetting = await rateSettingModel.findOne({ adminId: req.admin.id, milkCategory:category });
        if (!rateSetting) {
            return res.status(400).json({ msg: `Rate settings for ${category} not found` });
        }

		const fatRate =rateSetting.ratePerFat;
        const rate = fat * rateSetting.ratePerFat; // Basic rate calculation per litter;
        const calculatedAmount = rate * parseFloat(litter).toFixed(3); // Calculate final totalAmount

		const farmerMilkCollection =  MilkModel({
			adminId: req.admin.id,
			farmerId: id,
			...req.body,
			shift,
			date,
			fatRate,
			rate,
			calculatedAmount,
            mobile,
		});
		const farmerdata=await farmerMilkCollection.save();
    //console.log("milk collection",farmerMilkCollection)

		const milkdata = { ...farmerMilkCollection, name, email };
    
		req.milkdata = milkdata;

		// call mail middleware
		sendMail(req, res, () => {
			//sres.send("data send successfully")
			// Send a 201 Created response with the created milk provider
			res.status(200).json({ message: "Milk data submitted", milk: farmerdata});
		});

	} catch (error) {

		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// get Single farmer milk data using farmer id

exports.getSingleFarmerMilkData = async (req, res) => {
	const { id } = req.params;

	try {
		UserMilkData = await MilkModel.find({ farmerId:id, adminId: req.admin.id })
		.populate('farmerId', 'name email mobile') // Populating farmer information
        .populate('adminId', 'name email mobile shopName') // Populating admin information
        .exec();
		
		const Admin=

		res.status(200).send({
			total_entries: UserMilkData.length,
			data: UserMilkData,
		});
	} catch (error) {
		res.status(500).send({ msg: error.message });
	}
};


// get all milk collection data without pagination
exports.getfarmerMilkCollections = async (req, res) => {
	try {
		const milkcollections= await MilkModel.find({ adminId: req.admin.id });
		
			res.status(200).json({ count: milkcollections.length, milkcollections });
		
	} catch (error) {
		res.status(500).json({ message:"Server error",error: error.message });
	}
};



// get all milk collection entries with pagination
exports.getfarmerMilkCollectionWithPagination = async (req, res) => {
	try {
		const page = parseInt(req.query.page) || 1;
		const pageSize = parseInt(req.query.pageSize) || 3
    const sort=req.query.sort || "asc";
  

		// Calculate the skip value based on the page and pageSize
		const skip = (page - 1) * pageSize;

		// Query the database with pagination
		const milkcollections = await MilkModel.find({ adminId: req.admin.id })
			.skip(skip)
			.limit(pageSize)
			.sort({ date: sort }); // Optionally, you can sort the entries by date

		// Count total number of entries for pagination
		const totalEntries = await MilkModel.countDocuments({
			adminId: req.admin.id,
		});

		// Calculate total pages
		const totalPages = Math.ceil(totalEntries / pageSize);

		// Create the response object with entries, total pages, and current page
		const response = {
			milkcollections,
			totalPages,
			currentPage: page,
		};

		return res.status(200).json(response);
	} catch (error) {
		//console.error(error);
		return res.status(500).json({ message: "Internal Server Error",error:error.message });
	}
};


//update farmer milk data
exports.updateMilkCollection = async (req, res) => {
  try {
	const {category,fat,litter}=req.body;
	
	// Fetch rate settings for the given milk category
	const rateSetting = await rateSettingModel.findOne({ adminId: req.admin.id, milkCategory:category });
	if (!rateSetting) {
		return res.status(400).json({ msg: `Rate settings for ${category} not found` });
	}

	const fatRate =rateSetting.ratePerFat;
	const rate = fat * rateSetting.ratePerFat; // Basic rate calculation per litter;
	const calculatedAmount = rate * parseFloat(litter).toFixed(3); // Calculate final totalAmount

	const newMilkCollection =req.body;
	const newUpdatedMilkCollection={...newMilkCollection,fatRate,rate,calculatedAmount};

      const milkCollection = await MilkModel.findByIdAndUpdate(req.params.id, newUpdatedMilkCollection, { new: true });

      res.status(200).json({message:"data updated",data:milkCollection});
	  
  } catch (error) {
     
      res.status(500).json({message:'Server Error',error:error.message});
  }
};

// delete milk collection by id
exports.deleteMilkCollection = async (req, res) => {
  try {
     const deletedmilkData= await MilkModel.findByIdAndDelete(req.params.id);
      res.status(200).json({ message: 'Milk Collection deleted',data:deletedmilkData});
  } catch (error) {
      //console.error(err.message);
      res.status(500).json({message:'Server Error',error:error.message});
  }
};


