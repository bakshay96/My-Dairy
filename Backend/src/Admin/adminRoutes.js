const express=require("express");
const { adminLogin, adminRegistration } = require("./admin.controller");
const { auth } = require("../middleware/auth");


const AdminRouter=express.Router();

AdminRouter.post("/register",adminRegistration);
AdminRouter.post("/login",adminLogin);

module.exports={
  AdminRouter
}