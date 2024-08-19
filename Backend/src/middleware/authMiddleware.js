
 require("dotenv").config();
const jwt = require('jsonwebtoken');
const { AdminModel } = require('../Admin/admin.model');


const authMiddleware = async (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    console.log("token",token)
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.admin = await AdminModel.findById(decoded.id).select('-password');
        console.log("admin",req.admin,"id",req.admin.id)
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

module.exports = authMiddleware;


// const auth=async(req,res,next)=>{
// const token=req.header('Authorization')?.split(' ')[1];
// //console.log("token",token,req.headers)
// if (!token) {
//     return res.status(401).json({ message: 'No token, authorization denied' });
// }

//     try{
//        // console.log("if token",token)
//         const decoded= jwt.verify(token,process.env.TOKEN_API_SECRET_KEY);
//         console.log("auth decoded",decoded)
//         if(decoded){
//             req.user=await AdminModel.findById(decoded.userId || decoded.id).select('-password')

//             console.log("auth user",req.user)
//             next();
//         }else{
//             res.send({"msg":"please Login"})  
//         }
//     }catch(err){
//         res.send({"err":err.message})
//     }
     
// }


// module.exports={
//     auth
// }

