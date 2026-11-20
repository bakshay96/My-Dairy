const geoip = require("geoip-lite");
const { UserLoginLogModel } = require("../MasterAdmin/userLoginLog.model");

// Country names mapping
const COUNTRY_NAMES = {
  IN: "India",
  US: "United States",
  GB: "United Kingdom",
  CA: "Canada",
  AU: "Australia",
  DE: "Germany",
  FR: "France",
  JP: "Japan",
  SG: "Singapore",
  AE: "United Arab Emirates",
  BR: "Brazil",
  NL: "Netherlands",
  KR: "South Korea",
  IT: "Italy",
  RU: "Russia",
  CN: "China",
  ZA: "South Africa",
  NZ: "New Zealand",
};

// Indian state codes mapping
const INDIAN_STATES = {
  AP: "Andhra Pradesh",
  AR: "Arunachal Pradesh",
  AS: "Assam",
  BR: "Bihar",
  CT: "Chhattisgarh",
  GA: "Goa",
  GJ: "Gujarat",
  HR: "Haryana",
  HP: "Himachal Pradesh",
  JH: "Jharkhand",
  KA: "Karnataka",
  KL: "Kerala",
  MP: "Madhya Pradesh",
  MH: "Maharashtra",
  MN: "Manipur",
  ML: "Meghalaya",
  MZ: "Mizoram",
  NL: "Nagaland",
  OR: "Odisha",
  PB: "Punjab",
  RJ: "Rajasthan",
  SK: "Sikkim",
  TN: "Tamil Nadu",
  TG: "Telangana",
  TR: "Tripura",
  UT: "Uttarakhand",
  UP: "Uttar Pradesh",
  WB: "West Bengal",
  AN: "Andaman & Nicobar Islands",
  CH: "Chandigarh",
  DH: "Dadra & Nagar Haveli",
  DL: "Delhi",
  JK: "Jammu & Kashmir",
  LA: "Ladakh",
  LD: "Lakshadweep",
  PY: "Puducherry",
};

/**
 * Extract client IP from HTTP Request headers or connection
 */
function getClientIp(req) {
  if (!req) return "127.0.0.1";
  const forwarded = req.headers?.["x-forwarded-for"];
  if (forwarded) {
    const firstIp = forwarded.split(",")[0].trim();
    if (firstIp) return firstIp;
  }
  return (
    req.headers?.["x-real-ip"] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    "127.0.0.1"
  );
}

/**
 * Check if IP is private or local loopback
 */
function isPrivateIp(ip = "") {
  return (
    ip === "::1" ||
    ip === "127.0.0.1" ||
    ip === "::ffff:127.0.0.1" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.16.") ||
    ip.startsWith("172.17.") ||
    ip.startsWith("172.18.") ||
    ip.startsWith("172.19.") ||
    ip.startsWith("172.20.") ||
    ip.startsWith("172.21.") ||
    ip.startsWith("172.22.") ||
    ip.startsWith("172.23.") ||
    ip.startsWith("172.24.") ||
    ip.startsWith("172.25.") ||
    ip.startsWith("172.26.") ||
    ip.startsWith("172.27.") ||
    ip.startsWith("172.28.") ||
    ip.startsWith("172.29.") ||
    ip.startsWith("172.30.") ||
    ip.startsWith("172.31.") ||
    ip.startsWith("::ffff:192.168.") ||
    ip.startsWith("::ffff:10.") ||
    !ip
  );
}

/**
 * Parse User-Agent string to extract device type, OS, and browser
 */
function parseUserAgent(ua = "") {
  let deviceType = "desktop";
  let os = "Unknown OS";
  let browser = "Unknown Browser";

  if (!ua) {
    return { deviceType, os, browser };
  }

  // Device Type
  if (/mobile|android|iphone|ipod/i.test(ua)) {
    deviceType = "mobile";
  } else if (/tablet|ipad/i.test(ua)) {
    deviceType = "tablet";
  } else {
    deviceType = "desktop";
  }

  // Operating System
  if (/windows nt 10.0/i.test(ua)) os = "Windows 10/11";
  else if (/windows nt 6.3/i.test(ua)) os = "Windows 8.1";
  else if (/windows nt 6.2/i.test(ua)) os = "Windows 8";
  else if (/windows nt 6.1/i.test(ua)) os = "Windows 7";
  else if (/windows/i.test(ua)) os = "Windows";
  else if (/android/i.test(ua)) os = "Android";
  else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
  else if (/macintosh|mac os x/i.test(ua)) os = "macOS";
  else if (/linux/i.test(ua)) os = "Linux";
  else if (/cros/i.test(ua)) os = "Chrome OS";

  // Browser
  if (/edg([ea]|ios)?\/([0-9.]+)/i.test(ua)) browser = "Microsoft Edge";
  else if (/opr\/|opera/i.test(ua)) browser = "Opera";
  else if (/chrome|crios/i.test(ua)) browser = "Chrome";
  else if (/firefox|fxios/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = "Safari";
  else if (/msie|trident/i.test(ua)) browser = "Internet Explorer";

  return { deviceType, os, browser };
}

/**
 * Resolve geographic location from client IP
 */
function resolveGeoLocation(ipAddress) {
  if (isPrivateIp(ipAddress)) {
    return {
      countryCode: "IN",
      country: "India",
      regionCode: "MH",
      state: "Maharashtra",
      city: "Localhost / Dev",
      timezone: "Asia/Kolkata",
      latitude: 19.076,
      longitude: 72.8777,
    };
  }

  const geo = geoip.lookup(ipAddress);
  if (!geo) {
    return {
      countryCode: "IN",
      country: "India",
      regionCode: "MH",
      state: "Maharashtra",
      city: "Unknown City",
      timezone: "Asia/Kolkata",
      latitude: null,
      longitude: null,
    };
  }

  const countryCode = geo.country || "IN";
  const country = COUNTRY_NAMES[countryCode] || countryCode;
  const regionCode = geo.region || "";
  let state = regionCode;

  if (countryCode === "IN" && INDIAN_STATES[regionCode]) {
    state = INDIAN_STATES[regionCode];
  } else if (!state) {
    state = "Unknown State";
  }

  return {
    countryCode,
    country,
    regionCode,
    state,
    city: geo.city || "Unknown City",
    timezone: geo.timezone || "Asia/Kolkata",
    latitude: geo.ll?.[0] || null,
    longitude: geo.ll?.[1] || null,
  };
}

/**
 * Record a user login event in the database
 */
async function recordUserLogin({
  req,
  user,
  role = "admin",
  userModel = "Admin",
  status = "success",
  failureReason = null,
}) {
  try {
    const rawIp = getClientIp(req);
    const userAgent = req?.headers?.["user-agent"] || "";

    const { deviceType, os, browser } = parseUserAgent(userAgent);
    const geo = resolveGeoLocation(rawIp);

    let name = "Unknown";
    let email = "";
    let mobile = "";
    let memberId = "";
    let shopName = "";
    let userId = null;

    if (user) {
      userId = user._id || user.id || null;
      if (user.firstName || user.lastName) {
        name = `${user.firstName || ""} ${user.lastName || ""}`.trim();
      } else if (user.name) {
        name = user.name;
      } else if (user.username) {
        name = user.username;
      }

      email = user.email || "";
      mobile = user.mobile || "";
      memberId = user.memberId || "";
      shopName = user.shopName || "";
    }

    const logEntry = {
      userId,
      userModel,
      role,
      name: name || (role === "master_admin" ? "Master Admin" : "Dairy Admin"),
      email,
      mobile,
      memberId,
      shopName,
      ipAddress: rawIp,
      countryCode: geo.countryCode,
      country: geo.country,
      regionCode: geo.regionCode,
      state: geo.state,
      city: geo.city,
      timezone: geo.timezone,
      latitude: geo.latitude,
      longitude: geo.longitude,
      deviceType,
      os,
      browser,
      userAgent,
      status,
      failureReason,
      timestamp: new Date(),
    };

    // Save asynchronously without throwing
    await UserLoginLogModel.create(logEntry);
  } catch (error) {
    console.error("[UserLoginTracker] Error recording login:", error.message);
  }
}

module.exports = {
  recordUserLogin,
  getClientIp,
  parseUserAgent,
  resolveGeoLocation,
  COUNTRY_NAMES,
  INDIAN_STATES,
};
