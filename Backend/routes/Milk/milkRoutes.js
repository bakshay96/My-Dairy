const express=require("express");
const { addMilkData, getSingleUserMilkData } = require("../../controllers/milk.controller");
const { auth } = require("../../middleware/auth");
const MilkRouter=express.Router();

MilkRouter.post("/add/:id",auth,addMilkData);
MilkRouter.get("/get/:id",auth,getSingleUserMilkData);

module.exports={
  MilkRouter
}