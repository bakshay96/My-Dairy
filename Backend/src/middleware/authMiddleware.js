
 require("dotenv").config();
const jwt = require('jsonwebtoken');
const { AdminModel } = require('../Admin/admin.model');


const authMiddleware = async (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    //console.log("token",token)
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.admin = await AdminModel.findById(decoded.id).select('-password');
        //console.log("admin",req.admin,"id",req.admin.id)
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

module.exports = authMiddleware;


