const express=require("express");
const { userRegistration, getAllUsers, getSingleUser, deleteUser } = require("../controllers/user.controller");
const { auth } = require("../middleware/auth");
const UserRouter=express.Router();

UserRouter.post("/register",userRegistration)
UserRouter.get("/",getAllUsers);
UserRouter.get('/:userId',getSingleUser);
UserRouter.delete("/:mobile",deleteUser);

module.exports={
  UserRouter
}