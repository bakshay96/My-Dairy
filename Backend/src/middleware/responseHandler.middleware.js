// ============================================
// CENTRALIZED ERROR & RESPONSE HANDLER
// ============================================

/**
 * Success Response
 * Standardized success response structure
 */
class SuccessResponse {
  constructor(data = null, message = "Success", statusCode = 200) {
    this.success = true;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }

  send(res) {
    return res.status(this.statusCode).json({
      success: this.success,
      message: this.message,
      data: this.data
    });
  }
}

/**
 * Error Response
 * Standardized error response structure
 */
class ErrorResponse {
  constructor(message = "Something went wrong", statusCode = 500, errors = null) {
    this.success = false;
    this.statusCode = statusCode;
    this.message = message;
    this.errors = errors;
  }

  send(res) {
    const response = {
      success: this.success,
      message: this.message,
      ...(this.errors && { errors: this.errors })
    };
    return res.status(this.statusCode).json(response);
  }
}

/**
 * Predefined Error Responses
 */
const errorResponses = {
  // 400 Bad Request
  badRequest: (message = "Bad Request", errors = null) =>
    new ErrorResponse(message, 400, errors),

  // 401 Unauthorized
  unauthorized: (message = "Unauthorized - Token is invalid or missing") =>
    new ErrorResponse(message, 401),

  // 403 Forbidden
  forbidden: (message = "Forbidden - You don't have permission to access this") =>
    new ErrorResponse(message, 403),

  // 404 Not Found
  notFound: (resource = "Resource") =>
    new ErrorResponse(`${resource} not found`, 404),

  // 409 Conflict
  conflict: (message = "Conflict - Resource already exists") =>
    new ErrorResponse(message, 409),

  // 422 Unprocessable Entity
  validationError: (message = "Validation failed", errors = null) =>
    new ErrorResponse(message, 422, errors),

  // 429 Too Many Requests
  tooManyRequests: (message = "Too many requests, please try again later") =>
    new ErrorResponse(message, 429),

  // 500 Internal Server Error
  internalError: (message = "Internal Server Error") =>
    new ErrorResponse(message, 500),

  // 503 Service Unavailable
  serviceUnavailable: (message = "Service is temporarily unavailable") =>
    new ErrorResponse(message, 503)
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 * Usage: router.post("/route", asyncHandler(async (req, res) => {...}))
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Response interceptor for consistent API responses
 */
const responseInterceptor = (req, res, next) => {
  // Attach helper methods to response
  res.sendSuccess = (data, message = "Success", statusCode = 200) => {
    const response = new SuccessResponse(data, message, statusCode);
    return response.send(res);
  };

  res.sendError = (message = "Something went wrong", statusCode = 500, errors = null) => {
    const response = new ErrorResponse(message, statusCode, errors);
    return response.send(res);
  };

  next();
};

module.exports = {
  SuccessResponse,
  ErrorResponse,
  errorResponses,
  asyncHandler,
  responseInterceptor
};
