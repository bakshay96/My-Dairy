require("dotenv").config();
const jwt = require("jsonwebtoken");
const { MasterAdminModel } = require("../MasterAdmin/masterAdmin.model");

const getTokenFromCookies = (req) => {
  const cookieHeader = req.headers.cookie || "";
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("master_token="));
  if (!match) return null;
  return decodeURIComponent(match.split("=")[1] || "");
};

const masterAuthMiddleware = async (req, res, next) => {
  const authHeader  = req.header("Authorization");
  const cookieToken = getTokenFromCookies(req);

  let token = null;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (cookieToken) {
    token = cookieToken;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: "Master auth token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded || !decoded.id || decoded.role !== "master_admin") {
      return res.status(403).json({ success: false, message: "Access denied: not a master admin" });
    }

    const master = await MasterAdminModel.findById(decoded.id).select("-password");
    if (!master) {
      return res.status(401).json({ success: false, message: "Master admin not found" });
    }
    if (!master.isActive) {
      return res.status(403).json({ success: false, message: "Master admin account inactive" });
    }

    req.master   = master;
    req.masterId = master._id;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Master token expired" });
    }
    return res.status(401).json({ success: false, message: "Invalid master token" });
  }
};

module.exports = masterAuthMiddleware;
