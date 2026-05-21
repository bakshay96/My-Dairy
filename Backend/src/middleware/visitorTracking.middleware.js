const geoip = require("geoip-lite");
const { VisitorStatsModel } = require("../MasterAdmin/visitorStats.model");

const getClientIp = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.headers["x-real-ip"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.ip ||
    ""
  );
};

const getDeviceType = (userAgent = "") => {
  if (/mobile|android|phone/i.test(userAgent)) return "mobile";
  if (/tablet|ipad/i.test(userAgent)) return "tablet";
  return "desktop";
};

const visitorTrackingMiddleware = async (req, res, next) => {
  try {
    const ipAddress = getClientIp(req);
    const userAgent = req.headers["user-agent"] || "";
    const referrer = req.headers["referer"] || "";
    const path = req.path;
    const method = req.method;

    const geo = geoip.lookup(ipAddress);
    let country = geo?.country;
    if (!country) {
      if (
        ipAddress === "::1" ||
        ipAddress === "127.0.0.1" ||
        ipAddress === "::ffff:127.0.0.1" ||
        ipAddress.startsWith("192.168.") ||
        ipAddress.startsWith("10.") ||
        ipAddress.startsWith("172.16.") ||
        ipAddress.startsWith("::ffff:192.168.") ||
        ipAddress.startsWith("::ffff:10.") ||
        !ipAddress
      ) {
        country = "IN";
      } else {
        country = "Unknown";
      }
    }
    const deviceType = getDeviceType(userAgent);

    const visitorData = {
      ipAddress,
      userAgent,
      country,
      deviceType,
      referrer,
      path,
      method,
      userId: req.user?._id || null,
      timestamp: new Date(),
    };

    res.on("finish", async () => {
      try {
        visitorData.statusCode = res.statusCode;
        await VisitorStatsModel.create(visitorData);
      } catch (error) {
        console.error("[VisitorTracking] Failed to record visit:", error.message);
      }
    });

    next();
  } catch (error) {
    console.error("[VisitorTracking] Middleware error:", error.message);
    next();
  }
};

module.exports = visitorTrackingMiddleware;
