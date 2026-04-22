// ============================================
// VALIDATION SCHEMAS
// ============================================
const Joi = require("joi");
const { schemas } = require("../../middleware/validation.middleware");

// Admin Schemas
const adminRegisterSchema = Joi.object({
  firstName: schemas.name.required(),
  lastName: schemas.name.required(),
  email: schemas.email.required(),
  password: schemas.strongPassword.required(),
  mobileNumber: schemas.mobileNumber.required(),
});

const adminLoginSchema = Joi.object({
  email: schemas.email.required(),
  password: schemas.password.required(),
});

const adminUpdateSchema = Joi.object({
  firstName: schemas.name.optional(),
  lastName: schemas.name.optional(),
  mobileNumber: schemas.mobileNumber.optional(),
});

// Farmer Schemas
const farmerRegisterSchema = Joi.object({
  firstName: schemas.name.required(),
  lastName: schemas.name.required(),
  email: schemas.email.required(),
  mobileNumber: schemas.mobileNumber.required(),
  gender: schemas.gender.required(),
  villageName: Joi.string().trim().min(2).max(100).required(),
});

const farmerUpdateSchema = Joi.object({
  firstName: schemas.name.optional(),
  lastName: schemas.name.optional(),
  email: schemas.email.optional(),
  mobileNumber: schemas.mobileNumber.optional(),
  gender: schemas.gender.optional(),
  villageName: Joi.string().trim().min(2).max(100).optional(),
  status: Joi.string().valid("Active", "Inactive").optional(),
});

// Milk Schemas
const milkSubmissionSchema = Joi.object({
  farmerId: schemas.mongoId.required(),
  category: Joi.string().valid("Cow", "Buffalo", "Goat").required(),
  liter: Joi.number().positive().required(),
  fat: Joi.number().min(0).max(10).required(),
  snf: Joi.number().min(0).max(10).required(),
  water: Joi.number().min(0).max(100).required(),
  degree: Joi.number().min(-10).max(50).optional(),
  shift: Joi.string().valid("morning", "evening").optional(),
});

const milkFilterSchema = Joi.object({
  farmerId: schemas.mongoId.optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  category: Joi.string().valid("Cow", "Buffalo", "Goat").optional(),
  page: Joi.number().positive().default(1),
  limit: Joi.number().positive().default(10),
});

// Rate Schemas
const rateSettingSchema = Joi.object({
  category: Joi.string().valid("Cow", "Buffalo", "Goat").required(),
  baseRate: Joi.number().positive().required(),
  fatSurcharge: Joi.number().default(2),
  snfSurcharge: Joi.number().default(1),
});

// Payment Schemas
const paymentOrderSchema = Joi.object({
  amount: Joi.number().positive().required(),
  currency: Joi.string().default("INR"),
  farmerId: schemas.mongoId.required(),
  description: Joi.string().optional(),
});

const paymentVerifySchema = Joi.object({
  orderId: Joi.string().required(),
  paymentId: Joi.string().required(),
  signature: Joi.string().required(),
});

module.exports = {
  adminRegisterSchema,
  adminLoginSchema,
  adminUpdateSchema,
  farmerRegisterSchema,
  farmerUpdateSchema,
  milkSubmissionSchema,
  milkFilterSchema,
  rateSettingSchema,
  paymentOrderSchema,
  paymentVerifySchema,
};
