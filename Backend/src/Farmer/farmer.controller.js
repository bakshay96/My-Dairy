const express = require("express");

const { farmerModel } = require("./farmer.model");

// POST request to create a new milk provider

exports.createFarmer = async (req, res) => {
	try {
		const {  mobile } = req.body;
		
		// Check if the user already exists
		const isFarmer = await farmerModel.findOne({
			mobile,
			adminId: req.admin.id,
		});

		if (isFarmer) {
			// User already exists, send a 409 Conflict response
			return res.status(400).json({ message: "farmer already exists with same mobile number. " });
		}

		
    // Create a new milk provider Farmer
    const farmer= new farmerModel({...req.body,adminId: req.admin.id});
    const newfarmer=await farmer.save();
		

		console.log("farmer", newfarmer);

		res
			.status(200)
			.send({ msg: "New farmer added successfully", newfarmer });
	} catch (error) {
		// Handle other errors and send a 500 Internal Server Error response

		res.status(500).json({ message: "Internal Server Error", error: error.message });
	}
};

//get all users without pagination

exports.getAllFarmer=async(req,res)=>{
  console.log("admin id",req.admin)
  try {
    const farmers= await farmerModel.find({adminId:req.admin.id});
   
      res.status(200).json({"count":farmers.length,farmers})
    
  } catch (error) {
    res.status(500).json({"message":"Something wen't wrong",error:error.message})
  }
}

//get all user / pagination


exports.getAllFarmerWithPagination = async (req, res) => {
	try {
		const page = parseInt(req.query.page) || 1;
		const pageSize = parseInt(req.query.pageSize) || 10;
		const _sort = req.query._sort || "desc";

		// Calculate the skip value based on the page and pageSize
		const skip = (page - 1) * pageSize;
		console.log(req.user);
		// Query the database with pagination
		const usersEntries = await farmerModel
			.find({})
			.skip(skip)
			.limit(pageSize)
			.sort({ date: _sort }); // Optionally, you can sort the entries by date

		// Count total number of entries for pagination
		const totalEntries = await farmerModel.countDocuments({});

		// Calculate total pages
		const totalPages = Math.ceil(totalEntries / pageSize);

		// Create the response object with entries, total pages, and current page
		const response = {
			totalPages,
			currentPage: page,
			totalCount: usersEntries.length,
			users: usersEntries,
		};

		return res.status(200).json(response);
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: "Internal Server Error" });
	}
};

// find user by thire userId and mobile number
exports.getSingleFarmer = async (req, res) => {
	try {
		const { id } = req.params;

		// Find a user by name or mobile number
		const farmer = await farmerModel.find({
			adminId: req.admin.id,
		    _id: id 
		});

		res.status(200).json({message:"success",farmer});

	} catch (error) {
		res.status(500).json({"message":"server error", error: error.message });
	}
};

exports.updateFarmer = async (req, res) => {
    try {
        const farmer = await farmerModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({message:"success",farmer});
    } catch (error) {
        console.error(err.message);
        res.status(500).send({"message":'Server Error',error:error.message});
    }
};

// delete user by mobile number
exports.deleteFarmer = async (req, res) => {
    try {
        const deleteFarmer=await farmerModel.deleteOne({
				_id: req.params.id,
				adminId: req.admin.id,
			});

        res.json({ message: 'Farmer deleted',farmer:deleteFarmer });
    } catch (error) {
        
        res.status(500).send({"message":'Server Error',error:error.message});
    }
};
// exports.deleteFarmer = async (req, res) => {
// 	const { id } = req.params;
// 	user = await farmerModel.find({_id:id, adminId: req.admin.id });
// 	try {
// 		if (user.length == 0) {
// 			res.status(404).send({ msg: "User not found..!" });
// 		} else {
// 			let data = await farmerModel.deleteOne({
// 				mobile: mobile,
// 				adminId: req.user.id,
// 			});
// 			res
// 				.status(200)
// 				.send({
// 					msg: `User associated with ${mobile} number has been deleted..!`,
// 					data,
// 				});
// 		}
// 	} catch (error) {
// 		res.status(400).send({ msg: error.message });
// 	}
// };

