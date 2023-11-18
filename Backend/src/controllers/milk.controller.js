const express = require("express");
const { MilkModel } = require("../model/milk.model");
const { UserModel } = require("../model/user.model");
const mongoose=require("mongoose")

// POST request to create a new milk provider
//add user milk data
const addMilkData = async (req, res) => {
  try {
    const { category, SNF, FAT, water, liter,userId } = req.body;

    // Validate if required fields are present
    // if (!category || !SNF || !FAT || !water || !liter || !userId) {
    //   return res
    //     .status(400)
    //     .send({ error: "Please provide all required fields." , "body":req.body});
    // }

    // Create a new milk provider
    let isUserValid=await UserModel.find({userId})
    //console.log(isUserValid)
    if(isUserValid.length)
    {
        let UserMilk = MilkModel({category, SNF, FAT, water, liter,userId});
        await UserMilk.save();

        let userObjId=new mongoose.Types.ObjectId(UserMilk.id)
        console.log("user id :",userObjId)
        await UserModel.updateOne(
          {
            userId:userId,
          }, 
          {
            $push:{
              milks:UserMilk
            },
          }
        )
        // Send a 201 Created response with the created milk provider
        res.status(201).send({ msg: "Milk data submitted successfully", UserMilk });
    }
    else
    {
      res.send("User not Validate")
    }
  } catch (error) {
    // Handle other errors and send a 500 Internal Server Error response
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// get Single users milk data

const getSingleUserMilkData = async (req, res) => {
  try {
    UserMilkData = await MilkModel.find(req.params.id);
    if (UserMilkData.length == 0) {
      res.status(201).send({ msg: "user Milk data not present in the db" });
    } else {
      res.status(202).send({ "Total Milk Data": UserMilkData.length, MilkData: UserMilkData });
    }
  } catch (error) {
    res.status(500).send({msg:error.message});
  }
};


const getMilkData = async (req, res) => {
  try {
    let MilkData = await MilkModel.find();
    if (MilkData.length == 0) {
      res.status(201).send({ msg: "No Milk data currently avaliable..!" });
    } else {
      res.status(202).send({ "Total Milk Data": MilkData.length, "MilkData":MilkData });
    }
  } catch (error) {
    res.status(500).send({msg:error.message});
  }
};



module.exports = {
  addMilkData,
  getSingleUserMilkData,
  getMilkData
};
