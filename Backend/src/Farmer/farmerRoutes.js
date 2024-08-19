const express=require("express");

const authMiddleware = require("../middleware/authMiddleware");
const { createFarmer, getAllFarmer, getSingleFarmer, updateFarmer, deleteFarmer } = require("./farmer.controller");

const farmerRouter=express.Router();

farmerRouter.post("/register",authMiddleware,createFarmer)
farmerRouter.get("/",authMiddleware,getAllFarmer);
farmerRouter.get('/:id',authMiddleware,getSingleFarmer);
farmerRouter.patch("/:id",authMiddleware,updateFarmer)
farmerRouter.delete("/:id",authMiddleware,deleteFarmer);


module.exports={
  farmerRouter
}