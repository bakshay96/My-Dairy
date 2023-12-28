const express=require("express");
const { adminLogin, adminRegistration } = require("./admin.controller");


const AdminRouter=express.Router();

AdminRouter.post("/register",adminRegistration);
AdminRouter.post("/login",adminLogin);

module.exports={
  AdminRouter
}