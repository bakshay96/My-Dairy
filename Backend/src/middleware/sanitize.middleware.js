// ============================================
// INPUT SANITIZATION MIDDLEWARE
// ============================================
const sanitizeInput = (req, res, next) => {
  // Helper function to sanitize strings
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    
    return str
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .trim();
  };

  // Sanitize req.body
  if (req.body) {
    const sanitizedBody = {};
    for (const [key, value] of Object.entries(req.body)) {
      if (typeof value === 'string') {
        sanitizedBody[key] = sanitizeString(value);
      } else if (Array.isArray(value)) {
        sanitizedBody[key] = value;
      } else if (typeof value === 'object' && value !== null) {
        // Deep sanitize for nested objects
        sanitizedBody[key] = sanitizeObject(value);
      } else {
        sanitizedBody[key] = value;
      }
    }
    req.body = sanitizedBody;
  }

  // Sanitize req.query
  if (req.query) {
    const sanitizedQuery = {};
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === 'string') {
        sanitizedQuery[key] = sanitizeString(value);
      } else {
        sanitizedQuery[key] = value;
      }
    }
    req.query = sanitizedQuery;
  }

  // Sanitize req.params
  if (req.params) {
    const sanitizedParams = {};
    for (const [key, value] of Object.entries(req.params)) {
      if (typeof value === 'string') {
        sanitizedParams[key] = sanitizeString(value);
      } else {
        sanitizedParams[key] = value;
      }
    }
    req.params = sanitizedParams;
  }

  next();
};

function sanitizeObject(obj) {
  if (Array.isArray(obj)) return obj;
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = value
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        .trim();
    } else if (Array.isArray(value)) {
      sanitized[key] = value;
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

module.exports = sanitizeInput;
