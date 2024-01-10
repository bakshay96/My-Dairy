const express=require("express");
const { userRegistration, getAllUsers, getSingleUser, deleteUser } = require("./user.controller");
const { auth } = require("../middleware/auth");
const UserRouter=express.Router();

UserRouter.post("/register",auth,userRegistration)
UserRouter.get("/",auth,getAllUsers);
UserRouter.get('/:userId',auth,getSingleUser);
UserRouter.delete("/:mobile",auth,deleteUser);

module.exports={
  UserRouter
}