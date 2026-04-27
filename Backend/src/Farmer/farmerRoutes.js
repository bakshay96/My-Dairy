const express=require("express");

const authMiddleware = require("../middleware/authMiddleware");
const { createFarmer, getAllFarmer, getSingleFarmer, updateFarmer, deleteFarmer } = require("./farmer.controller");

const farmerRouter=express.Router();

farmerRouter.post("/register", authMiddleware, createFarmer);  // legacy
farmerRouter.post("/",        authMiddleware, createFarmer);   // new
farmerRouter.get("/",         authMiddleware, getAllFarmer);
farmerRouter.get("/:id",      authMiddleware, getSingleFarmer);
farmerRouter.put("/:id",      authMiddleware, updateFarmer);   // new
farmerRouter.patch("/:id",    authMiddleware, updateFarmer);   // legacy
farmerRouter.delete("/:id",   authMiddleware, deleteFarmer);


module.exports={
  farmerRouter
}