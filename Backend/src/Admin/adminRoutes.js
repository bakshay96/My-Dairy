const express=require("express");
const { adminLogin, adminRegistration, message, getCurrentUser, logoutUser} = require("./admin.controller");
const {messageResponse} =require("../middleware/messageResponse.middleware.js");
const { auth } = require("../middleware/auth");


const AdminRouter=express.Router();

AdminRouter.post("/register",adminRegistration);
AdminRouter.post("/login",adminLogin);
AdminRouter.post("/message",messageResponse,message);
AdminRouter.get("/me",auth,getCurrentUser)
AdminRouter.get("/logout",auth,logoutUser)

module.exports={
  AdminRouter
}