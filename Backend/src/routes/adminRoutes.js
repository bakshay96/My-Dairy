const express=require("express");
const { adminLogin, adminRegistration } = require("../controllers/admin.controller");


const AdminRouter=express.Router();

AdminRouter.post("/admin/register",adminRegistration);
AdminRouter.post("/admin/login",adminLogin);

module.exports={
  AdminRouter
}