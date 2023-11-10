const express=require("express");
const adminRouter=express.Router();
const { adminModel } = require("../model/Admin/admin.models");


const bcrypt=require("bcrypt");
const  jwt = require('jsonwebtoken');


//admin register route
adminRouter.post("/register",async(req,res)=>{
    console.log("regist router")
    const {name,village,shopName,mobile,key, email,password} =req.body;
    try {
        const user=await adminModel.findOne({mobile})
        if(user)
        {
            res.send({"msg":"User already exists"})
        }
        else
        {
            bcrypt.hash(password,5,async(err,hash)=>{
                if(err)
                {
                    res.send({"msg":err.message})
                }
                else
                {
                    const newUser= new adminModel({name,village,shopName,mobile,key:password,email,password:hash})
                    await newUser.save();
                    res.send({"msg":"Registration successfull ...!"})
                }
            })
        }
        
    } catch (error) {
        res.send({"msg":error.messages})
    }
})

//admin login routes
adminRouter.post("/login",async(req,res)=>{
    const {mobile,password} =req.body;
   // console.log(mobile,password);
    try {
        const user=await adminModel.findOne({mobile})
        if(user)
        {
            //res.send({"msg":"Login successfull ...!","token":jwt.sign({"userId":user._id},"masai")})
            bcrypt.compare(password,user.password,(err,result)=>{
               if(result)
                {
                    res.send({"msg":"Login successfull ...!","token":jwt.sign({"userId":user._id},"masai")})
                }
                else
                {
                    
                    res.send({"msg":"Wrong Credentials"})
                }
            })
        }
        else{
            res.send({"msg":"User Not Found, Please enter valid credentails"})
        }
        
    } catch (error) {
        res.send({"msg":error.messages})
    }
})




module.exports={
    adminRouter
}