const express=require("express");

const { UserModel } = require("./user.model");


// POST request to create a new milk provider
// add user
const userRegistration= async (req, res) => {
    try {
        const {
           
            name,
            village,
            mobile,
           
          } = req.body;

          // Validate if required fields are present
            if (!name || !village || !mobile ) {
                return res.status(400).json({ error: "Please add all required fields." });
            }
      // Check if the user already exists
      const existingUser = await UserModel.findOne({ mobile: req.body.mobile });
  
      if (existingUser) {

        // User already exists, send a 409 Conflict response
        return res.status(409).json({ error: "User already exists with the given mobile number" });
      }

      // create new index
      const totalUsers = await UserModel.countDocuments({});
     
      
  
      // Create a new milk provider Farmer
      const newMilkProvider = await UserModel.create({...req.body,"userId":totalUsers+1});
  
      // Send a 201 Created response with the created milk provider
      res.status(201).send({"msg":"New user created successfully",newMilkProvider});
    } catch (error) {
      // Handle other errors and send a 500 Internal Server Error response
     
      res.status(500).json({ error: "Internal Server Error" });
    }
  };


// get all users without pagination

// const getAllUsers=async(req,res)=>{
//   try {
//     totalUsers= await UserModel.find({});
//     if(totalUsers.length==0)
//     {
//       res.status(201).send({"msg":"No user present in the db"});

//     }
//     else
//     {
//       res.status(202).send({"Total users":totalUsers.length,"Users":totalUsers})
//     }
//   } catch (error) {
    
//   }
// }

//get all user / pagination
// ---->  api/dairy-entries?page=1&pageSize=10 will return the first 10 entries.
  // ------>  api/dairy-entries?page=2&pageSize=10 will return the next 10 entries.
  
const getAllUsers= async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const _sort=req.query._sort || "desc"

    // Calculate the skip value based on the page and pageSize
    const skip = (page - 1) * pageSize;

    // Query the database with pagination
    const usersEntries = await UserModel.find()
      .skip(skip)
      .limit(pageSize)
      .sort({ date: _sort }); // Optionally, you can sort the entries by date

    // Count total number of entries for pagination
    const totalEntries = await UserModel.countDocuments();

    // Calculate total pages
    const totalPages = Math.ceil(totalEntries / pageSize);

    // Create the response object with entries, total pages, and current page
    const response = {
      totalPages,
      currentPage: page,
      totalCount:usersEntries.length,
      users: usersEntries,
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// find user by thire userId and mobile number
const getSingleUser= async (req, res) => {
  try {
    const {userId,mobile} = req.params;
    

   // Find a user by name or mobile number
    const user = await UserModel.find({
      $or: [
        { mobile: mobile },
        {userId:userId},
      ],
    });

    if (user.length) {
      res.json(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// delete user by mobile number
const deleteUser=async(req,res)=>{

  const {mobile}=req.params
  user=await UserModel.find({mobile});
  try {
     
      if( user.length==0)
      {
        res.status(404).send({"msg":"User not found..!"})
      }
      else
      {
       let data= await UserModel.deleteOne({mobile:mobile});
        res.status(200).send({"msg":`User associated with ${mobile} number has been deleted..!`, data})
      }
  } catch (error) {
    res.status(400).send({"msg":error.message})
  }
}




  module.exports={
    userRegistration,
    getAllUsers,
    getSingleUser,
    deleteUser
  }
  