const express=require("express");


const {sendMail}=require("../middleware/sendMail");
const authMiddleware = require("../middleware/authMiddleware");
const { getSingleFarmerMilkData, getfarmerMilkCollections, getfarmerMilkCollectionWithPagination, updateMilkCollection, addMilkData, deleteMilkCollection } = require("./milk.controller");
const MilkRouter=express.Router();


MilkRouter.post("/:id",authMiddleware,addMilkData,sendMail);
MilkRouter.get("/:id",authMiddleware,getSingleFarmerMilkData);
MilkRouter.get("/",authMiddleware,getfarmerMilkCollections)
MilkRouter.get("/get",authMiddleware,getfarmerMilkCollectionWithPagination);
MilkRouter.patch("/:id",authMiddleware,updateMilkCollection)
MilkRouter.delete("/:id",authMiddleware,deleteMilkCollection);



module.exports={
  MilkRouter
}