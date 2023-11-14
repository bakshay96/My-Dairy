const express = require("express");
const { MilkModel } = require("../model/milk/milk.model");

// POST request to create a new milk provider
//add user milk data
const addMilkData = async (req, res) => {
  try {
    const { category, SNF, FAT, water, liter } = MilkModel(req.body);

    // Validate if required fields are present
    if (!category || !SNF || !FAT || !water || !liter) {
      return res
        .status(400)
        .json({ error: "Please provide all required fields." });
    }

    // Create a new milk provider
    let UserMilkData = MilkModel(req.body);
    await UserMilkData.save();
    // Send a 201 Created response with the created milk provider
    res.status(201).send({ msg: "Milk data submitted successfully", UserMilkData });
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



module.exports = {
  addMilkData,
  getSingleUserMilkData
};
