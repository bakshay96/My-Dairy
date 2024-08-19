const express=require("express");
const { adminLogin, adminRegistration, message, getCurrentUser, logoutUser, registerAdmin} = require("./admin.controller");
const {messageResponse} =require("../middleware/messageResponse.middleware.js");
const authMiddleware = require("../middleware/authMiddleware.js");


const AdminRouter=express.Router();

// AdminRouter.post("/register",adminRegistration);
AdminRouter.post("/register",registerAdmin);
AdminRouter.post("/register",adminRegistration);
AdminRouter.post("/login",adminLogin);
AdminRouter.post("/message",messageResponse,message);
AdminRouter.get("/me",authMiddleware,getCurrentUser)
AdminRouter.get("/logout",authMiddleware,logoutUser)

module.exports={
  AdminRouter
}