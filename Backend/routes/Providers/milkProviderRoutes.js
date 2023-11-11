const express=require("express");
const adminRouter=express.Router();
const bcrypt=require("bcrypt");
const  jwt = require('jsonwebtoken');
const userRouters=express.Router();

// POST request to create a new milk provider
userRouters.post("/users/register", async (req, res) => {
    try {
        const {
            userId,
            name,
            gender,
            village,
            mobile,
            email,
            milk // Assuming milk is an array of ObjectId references
          } = req.body;

          // Validate if required fields are present
            if (!name || !gender || !village || !mobile || !email || !milk || !userId) {
                return res.status(400).json({ error: "Please provide all required fields." });
            }
      // Check if the user already exists
      const existingUser = await milkProviderModel.findOne({ mobile: req.body.mobile });
  
      if (existingUser) {
        // User already exists, send a 409 Conflict response
        return res.status(409).json({ error: "User already exists with the given mobile number" });
      }
  
      // Create a new milk provider
      const newMilkProvider = await milkProviderModel.create(req.body);
  
      // Send a 201 Created response with the created milk provider
      res.status(201).json(newMilkProvider);
    } catch (error) {
      // Handle other errors and send a 500 Internal Server Error response
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });


  module.exports={
    userRouters
  }
  