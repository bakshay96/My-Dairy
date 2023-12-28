const express=require("express");
const { addMilkData, getSingleUserMilkData, getMilkData } = require("./milk.controller");
const MilkRouter=express.Router();

MilkRouter.post("/add/:userId",addMilkData);
MilkRouter.get("/get/:userId",getSingleUserMilkData);
MilkRouter.get("/get",getMilkData)

module.exports={
  MilkRouter
}