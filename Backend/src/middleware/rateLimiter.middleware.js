// ============================================
// RATE LIMITING MIDDLEWARE
// ============================================
const rateLimit = require("express-rate-limit");

/**
 * General API rate limiter
 * 100 requests per 15 minutes
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests, please try again later"
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => process.env.NODE_ENV === "test" // Skip in test environment
});

/**
 * Authentication rate limiter
 * Stricter limits for login/registration
 * 5 attempts per 15 minutes
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: {
    success: false,
    message:
      "Too many login/registration attempts, please try again after 15 minutes"
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === "test",
  keyGenerator: (req) => {
    // Rate limit by email if provided, otherwise by IP
    return (req.body && req.body.email) || req.ip;
  }
});

/**
 * Password reset rate limiter
 * 3 attempts per hour
 */
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message: {
    success: false,
    message:
      "Too many password reset attempts, please try again after 1 hour"
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === "test"
});

/**
 * File upload rate limiter
 * 20 uploads per hour
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour
  message: {
    success: false,
    message: "Too many uploads, please try again later"
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === "test"
});

/**
 * Create custom rate limiter
 * Usage: createCustomLimiter(requests, minutes)
 */
const createCustomLimiter = (requests, minutes) => {
  return rateLimit({
    windowMs: minutes * 60 * 1000,
    max: requests,
    message: {
      success: false,
      message: "Too many requests, please try again later"
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV === "test"
  });
};

module.exports = {
  generalLimiter,
  authLimiter,
  passwordResetLimiter,
  uploadLimiter,
  createCustomLimiter
};
