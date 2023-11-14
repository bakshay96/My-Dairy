const express=require("express");
const { adminRegistration, adminLogin } = require("../../controllers/admin.controller");

const AdminRouter=express.Router();

AdminRouter.post("/admin/register",adminRegistration);
AdminRouter.post("/admin/login",adminLogin);

module.exports={
  AdminRouter
}