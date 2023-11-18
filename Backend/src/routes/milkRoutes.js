const express=require("express");
const { addMilkData, getSingleUserMilkData, getMilkData } = require("../controllers/milk.controller");
const { auth } = require("../middleware/auth");
const MilkRouter=express.Router();

MilkRouter.post("/add",addMilkData);
MilkRouter.get("/get/:id",getSingleUserMilkData);
MilkRouter.get("/milk/get",getMilkData)

module.exports={
  MilkRouter
}