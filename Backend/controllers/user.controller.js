const express=require("express");
const bcrypt=require("bcrypt");
const  jwt = require('jsonwebtoken');
const { UserModel } = require("../model/users/user.model");


// POST request to create a new milk provider
// add user
const userRegistration= async (req, res) => {
    try {
        const {
           
            name,
            gender,
            village,
            mobile,
            email,
           
          } = req.body;

          // Validate if required fields are present
            if (!name || !gender || !village || !mobile || !email) {
                return res.status(400).json({ error: "Please provide all required fields." });
            }
      // Check if the user already exists
      const existingUser = await UserModel.findOne({ mobile: req.body.mobile });
  
      if (existingUser) {

        // User already exists, send a 409 Conflict response
        return res.status(409).json({ error: "User already exists with the given mobile number" });
      }

      // create new index
      const totalUsers = await UserModel.countDocuments({});
      console.log(totalUsers)
      
  
      // Create a new milk provider
      const newMilkProvider = await UserModel.create({...req.body,"userId":totalUsers+1});
  
      // Send a 201 Created response with the created milk provider
      res.status(201).send({"msg":"New user created successfully",newMilkProvider});
    } catch (error) {
      // Handle other errors and send a 500 Internal Server Error response
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };


// get all users

const getAllUsers=async(req,res)=>{
  try {
    totalUsers= await UserModel.find({});
    if(totalUsers.length==0)
    {
      res.status(201).send({"msg":"No user present in the db"});

    }
    else
    {
      res.status(202).send({"Total users":totalUsers.length,"Users":totalUsers})
    }
  } catch (error) {
    
  }
}


// find user by thire userId and mobile number
const getSingleUser= async (req, res) => {
  try {
    const {userId,mobile} = req.params;
    console.log(userId,mobile)

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
  try {
      user=await UserModel.find({mobile});
      console.log(user)
      if(!user)
      {
        res.status(404).send({"msg":"User not found..!"})
      }
     await UserModel.deleteOne({mobile:mobile});
      res.status(200).send({"msg":`User associated with ${mobile} no has been deleted..!`})
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
  