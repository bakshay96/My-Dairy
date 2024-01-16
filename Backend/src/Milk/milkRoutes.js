const express=require("express");
const { addMilkData, getSingleUserMilkData, getMilkData, getAllDairyEntries } = require("./milk.controller");
const { auth } = require("../middleware/auth");
const {sendMail}=require("../middleware/sendMail")
const MilkRouter=express.Router();


MilkRouter.post("/add/:mobile",auth,addMilkData,sendMail);
MilkRouter.get("/get/:mobile",auth,getSingleUserMilkData);
MilkRouter.get("/get",auth,getAllDairyEntries)


module.exports={
  MilkRouter
}