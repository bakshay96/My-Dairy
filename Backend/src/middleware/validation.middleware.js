// ============================================
// INPUT VALIDATION MIDDLEWARE
// ============================================
// Using Joi for schema validation
const Joi = require("joi");

/**
 * Validates request body against a Joi schema
 * Usage: app.post("/route", validateRequest(schema), controller)
 */
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessages = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errorMessages
      });
    }

    // Replace req.body with validated data
    req.body = value;
    next();
  };
};

/**
 * Validates query parameters against a Joi schema
 * Usage: app.get("/route", validateQuery(schema), controller)
 */
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessages = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: "Query validation error",
        errors: errorMessages
      });
    }

    req.query = value;
    next();
  };
};

/**
 * Validates URL parameters against a Joi schema
 * Usage: app.get("/route/:id", validateParams(schema), controller)
 */
const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessages = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: "Parameter validation error",
        errors: errorMessages
      });
    }

    req.params = value;
    next();
  };
};

// ============================================
// COMMON VALIDATION SCHEMAS
// ============================================

const schemas = {
  // Email validation
  email: Joi.string()
    .email()
    .lowercase()
    .trim()
    .required()
    .messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required"
    }),

  // Password validation (minimum 6 characters, at least one number and one special char recommended)
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      "string.min": "Password must be at least 6 characters long",
      "any.required": "Password is required"
    }),

  // Strong password validation (recommended for new accounts)
  strongPassword: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      "string.min": "Password must be at least 8 characters long",
      "string.pattern.base":
        "Password must contain lowercase, uppercase, and numbers",
      "any.required": "Password is required"
    }),

  // Mobile number validation (Indian format)
  mobileNumber: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({
      "string.pattern.base":
        "Please provide a valid 10-digit mobile number",
      "any.required": "Mobile number is required"
    }),

  // Name validation
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      "string.min": "Name must be at least 2 characters long",
      "string.max": "Name cannot exceed 100 characters",
      "any.required": "Name is required"
    }),

  // Generic string (for titles, descriptions, etc)
  string: (minLength = 1, maxLength = 500) =>
    Joi.string()
      .trim()
      .min(minLength)
      .max(maxLength)
      .required(),

  // Generic number
  number: Joi.number().required(),

  // MongoDB ObjectId
  mongoId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid ID format"
    }),

  // Date validation
  date: Joi.date().iso().required(),

  // Gender validation
  gender: Joi.string()
    .valid("Male", "Female", "Other")
    .required()
    .messages({
      "any.only": "Gender must be Male, Female, or Other"
    })
};

module.exports = {
  validateRequest,
  validateQuery,
  validateParams,
  schemas
};
