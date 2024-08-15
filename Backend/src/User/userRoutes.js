const express=require("express");
const { userRegistration, getAllUsers, getSingleUser, deleteUser } = require("./user.controller");
const { auth } = require("../middleware/auth");
const UserRouter=express.Router();

UserRouter.post("/register",auth,userRegistration)
UserRouter.get("/",getAllUsers);
UserRouter.get('/:userId',auth,getSingleUser);
UserRouter.delete("/delete/:mobile",auth,deleteUser);


module.exports={
  UserRouter
}