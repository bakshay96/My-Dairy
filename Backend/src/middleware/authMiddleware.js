require("dotenv").config();
const jwt = require('jsonwebtoken');
const { AdminModel } = require('../Admin/admin.model');

const getTokenFromCookies = (req) => {
    const cookieHeader = req.headers.cookie || "";
    if (!cookieHeader) return null;
    const tokenCookie = cookieHeader
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith("token="));
    if (!tokenCookie) return null;
    return decodeURIComponent(tokenCookie.split("=")[1] || "");
};

const authMiddleware = async (req, res, next) => {
    const authHeader = req.header('Authorization');
    const cookieToken = getTokenFromCookies(req);
    
    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    } else if (cookieToken) {
        token = cookieToken;
    }

    // Check if token exists in any supported source
    if (!token) {
        return res.status(401).json({ 
            success: false,
            msg: 'Authentication token missing' 
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
        req.tokenExp = decoded.exp ? decoded.exp * 1000 : null;
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


