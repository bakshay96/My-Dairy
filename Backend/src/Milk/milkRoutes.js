const express=require("express");
const { addMilkData, getSingleUserMilkData, getMilkData, getAllDairyEntries } = require("./milk.controller");
const MilkRouter=express.Router();

MilkRouter.post("/add/:userId",addMilkData);
MilkRouter.get("/get/:userId",getSingleUserMilkData);
MilkRouter.get("/get",getAllDairyEntries)

module.exports={
  MilkRouter
}