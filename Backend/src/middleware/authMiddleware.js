require("dotenv").config();
const jwt = require('jsonwebtoken');
const { AdminModel } = require('../Admin/admin.model');

const authMiddleware = async (req, res, next) => {
    const authHeader = req.header('Authorization');
    
    // Check if authorization header exists
    if (!authHeader) {
        return res.status(401).json({ 
            success: false,
            msg: 'No authorization header provided' 
        });
    }

    // Validate token format
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    
    if (!token) {
        return res.status(401).json({ 
            success: false,
            msg: 'Invalid token format. Use: Bearer <token>' 
        });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if decoded token has required fields
        if (!decoded || !decoded.id) {
            return res.status(401).json({ 
                success: false,
                msg: 'Invalid token payload' 
            });
        }

        // Find admin and attach to request
        const admin = await AdminModel.findById(decoded.id).select('-password');
        
        if (!admin) {
            return res.status(401).json({ 
                success: false,
                msg: 'User not found' 
            });
        }

        // Check if admin is active
        if (admin.status === 'inactive') {
            return res.status(403).json({ 
                success: false,
                msg: 'Account is deactivated' 
            });
        }

        req.admin = admin;
        req.adminId = admin._id;
        next();
    } catch (err) {
        // Handle specific JWT errors
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false,
                msg: 'Token has expired' 
            });
        }
        
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false,
                msg: 'Invalid token' 
            });
        }

        res.status(401).json({ 
            success: false,
            msg: 'Token is not valid' 
        });
    }
};

module.exports = authMiddleware;


