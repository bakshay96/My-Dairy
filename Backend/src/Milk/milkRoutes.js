const express=require("express");
const { addMilkData, getSingleUserMilkData, getMilkData, getAllDairyEntries } = require("./milk.controller");
const MilkRouter=express.Router();

MilkRouter.post("/add/:mobile",addMilkData);
MilkRouter.get("/get/:mobile",getSingleUserMilkData);
MilkRouter.get("/get",getAllDairyEntries)

module.exports={
  MilkRouter
}