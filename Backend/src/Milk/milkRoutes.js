const express=require("express");


const {sendMail}=require("../middleware/sendMail");
const authMiddleware = require("../middleware/authMiddleware");
const { getSingleFarmerMilkData, getfarmerMilkCollections, getfarmerMilkCollectionWithPagination, updateMilkCollection, addMilkData, deleteMilkCollection, deleteFarmerMilkCollections } = require("./milk.controller");
const MilkRouter=express.Router();


MilkRouter.get("/",           authMiddleware, getfarmerMilkCollections);
MilkRouter.get("/get",        authMiddleware, getfarmerMilkCollectionWithPagination);
MilkRouter.get("/farmer/:id", authMiddleware, getSingleFarmerMilkData);   // ← NEW: explicit path
MilkRouter.post("/:id",       authMiddleware, addMilkData);
MilkRouter.get("/:id",        authMiddleware, getSingleFarmerMilkData);   // legacy
MilkRouter.patch("/:id",      authMiddleware, updateMilkCollection);
MilkRouter.delete("/farmer/:farmerId", authMiddleware, deleteFarmerMilkCollections);
MilkRouter.delete("/:id",     authMiddleware, deleteMilkCollection);



module.exports={
  MilkRouter
}