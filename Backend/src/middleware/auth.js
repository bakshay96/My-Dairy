const jwt = require("jsonwebtoken");
const { AdminModel } = require("../Admin/admin.model");
require("dotenv").config();


const auth=async(req,res,next)=>{
const token=req.header('Authorization')?.split(' ')[1];
//console.log("token",token,req.headers)
if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
}

    try{
        console.log("if token",token)
        const decoded= jwt.verify(token,process.env.TOKEN_API_SECRET_KEY);
       // console.log("auth decoded",decoded)
        if(decoded){
            req.user=await AdminModel.findById(decoded.id).select('-password')
           // console.log("auth user",req.user)
            next();
        }else{
            res.send({"msg":"please Login"})  
        }
    }catch(err){
        res.send({"err":err.message})
    }
     
}


module.exports={
    auth
}