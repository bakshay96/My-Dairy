// ============================================
// SECURITY UTILITIES
// ============================================
const crypto = require('crypto');

/**
 * Generate a secure random token
 * @param {number} bytes - Number of bytes (default: 32)
 * @returns {string} - Hex-encoded token
 */
const generateSecureToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

/**
 * Hash sensitive data
 * @param {string} data - Data to hash
 * @returns {string} - SHA-256 hash
 */
const hashData = (data) => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} - Validation result
 */
const validatePasswordStrength = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Sanitize user input to prevent NoSQL injection
 * @param {Object} obj - Object to sanitize
 * @returns {Object} - Sanitized object
 */
const sanitizeNoSQL = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  const sanitized = {};
  
  for (const [key, value] of Object.entries(obj)) {
    // Prevent NoSQL injection operators
    if (typeof value === 'object' && value !== null) {
      // Check for MongoDB operators
      const hasOperators = Object.keys(value).some(k => k.startsWith('$'));
      if (hasOperators && key !== '$where') {
        sanitized[key] = {};
      } else {
        sanitized[key] = sanitizeNoSQL(value);
      }
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

/**
 * Rate limit configuration helper
 * @param {number} windowMs - Time window in milliseconds
 * @param {number} maxRequests - Maximum requests per window
 * @returns {Object} - Rate limit config
 */
const createRateLimitConfig = (windowMs = 15 * 60 * 1000, maxRequests = 200) => {
  return {
    windowMs,
    max: maxRequests,
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  };
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - Is valid email
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate mobile number (Indian format)
 * @param {string} mobile - Mobile number to validate
 * @returns {boolean} - Is valid mobile
 */
const isValidMobile = (mobile) => {
  const mobileRegex = /^[6-9]\d{9}$/;
  return mobileRegex.test(mobile);
};

/**
 * Mask sensitive data for logging
 * @param {string} data - Data to mask
 * @param {number} visibleChars - Number of characters to show at end
 * @returns {string} - Masked data
 */
const maskSensitiveData = (data, visibleChars = 4) => {
  if (!data || typeof data !== 'string') return '';
  if (data.length <= visibleChars) return '***';
  
  const visiblePart = data.slice(-visibleChars);
  const maskedPart = '*'.repeat(data.length - visibleChars);
  return maskedPart + visiblePart;
};

module.exports = {
  generateSecureToken,
  hashData,
  validatePasswordStrength,
  sanitizeNoSQL,
  createRateLimitConfig,
  isValidEmail,
  isValidMobile,
  maskSensitiveData
};
