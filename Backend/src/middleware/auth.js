const jwt = require("jsonwebtoken")
require("dotenv").config();

const auth=(req,res,next)=>{
const token=req.headers.authorization;
//console.log("token",token,req.headers)
if(token !==""){
    try{
        console.log("if token",token)
        const decoded= jwt.verify(token.split(" ")[1],process.env.TOKEN_API_SECRET_KEY);
        if(decoded){
            next();
        }else{
            res.send({"msg":"please Login"})  
        }
    }catch(err){
        res.send({"err":err.message})
    }
}else{
    res.send({"msg":"User don't have authorization"})   
}
}

module.exports={
    auth
}