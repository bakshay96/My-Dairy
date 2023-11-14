const jwt = require("jsonwebtoken")

const auth=(req,res,next)=>{
const token=req.headers.authorization
if(token){
    try{
        const decoded= jwt.verify(token.split(" ")[1],"masai");
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