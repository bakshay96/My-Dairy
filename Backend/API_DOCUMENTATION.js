// ============================================
// API ENDPOINTS DOCUMENTATION
// ============================================

/**
 * ADMIN ENDPOINTS
 */

/**
 * POST /api/admin/register
 * Register a new admin
 * @requires None
 * @body {
 *   firstName: string,
 *   lastName: string,
 *   email: string,
 *   password: string (min 8 chars, uppercase, lowercase, number),
 *   mobileNumber: string (10 digits)
 * }
 * @returns {
 *   success: boolean,
 *   message: string,
 *   data: { id, firstName, lastName, email, mobileNumber, token }
 * }
 */

/**
 * POST /api/admin/login
 * Login admin
 * @requires None
 * @body {
 *   email: string,
 *   password: string
 * }
 * @returns {
 *   success: boolean,
 *   message: string,
 *   data: { id, firstName, lastName, email, mobileNumber, token }
 * }
 */

/**
 * GET /api/admin/profile
 * Get admin profile
 * @requires Authorization header with Bearer token
 * @returns {
 *   success: boolean,
 *   data: admin object
 * }
 */

/**
 * PUT /api/admin/profile
 * Update admin profile
 * @requires Authorization header
 * @body {
 *   firstName?: string,
 *   lastName?: string,
 *   mobileNumber?: string
 * }
 * @returns {
 *   success: boolean,
 *   message: string,
 *   data: updated admin object
 * }
 */

/**
 * FARMER ENDPOINTS
 */

/**
 * POST /api/farmer/register
 * Register a new farmer
 * @requires Authorization header (Admin only)
 * @body {
 *   firstName: string,
 *   lastName: string,
 *   email: string,
 *   mobileNumber: string,
 *   gender: string ('Male', 'Female', 'Other'),
 *   villageName: string
 * }
 * @returns {
 *   success: boolean,
 *   message: string,
 *   data: farmer object
 * }
 */

/**
 * GET /api/farmer
 * Get all farmers with pagination
 * @requires Authorization header (Admin only)
 * @query {
 *   page?: number (default: 1),
 *   limit?: number (default: 10),
 *   status?: string ('Active', 'Inactive'),
 *   search?: string
 * }
 * @returns {
 *   success: boolean,
 *   data: farmers array,
 *   pagination: { total, page, limit, pages }
 * }
 */

/**
 * GET /api/farmer/:id
 * Get farmer by ID
 * @requires Authorization header
 * @returns {
 *   success: boolean,
 *   data: farmer object
 * }
 */

/**
 * PUT /api/farmer/:id
 * Update farmer
 * @requires Authorization header (Admin only)
 * @body { firstName?, lastName?, email?, mobileNumber?, gender?, villageName?, status? }
 * @returns {
 *   success: boolean,
 *   message: string,
 *   data: updated farmer object
 * }
 */

/**
 * DELETE /api/farmer/:id
 * Delete farmer
 * @requires Authorization header (Admin only)
 * @returns {
 *   success: boolean,
 *   message: string
 * }
 */

/**
 * GET /api/farmer/:id/stats
 * Get farmer statistics
 * @requires Authorization header
 * @returns {
 *   success: boolean,
 *   data: {
 *     farmer: farmer object,
 *     statistics: { totalSubmissions, totalMilk, averageQuality }
 *   }
 * }
 */

/**
 * MILK ENDPOINTS
 */

/**
 * POST /api/milk/submit
 * Submit milk collection
 * @requires Authorization header
 * @body {
 *   farmerId: string (MongoDB ObjectId),
 *   category: string ('Cow', 'Buffalo', 'Goat'),
 *   liter: number,
 *   fat: number (0-10),
 *   snf: number (0-10),
 *   water: number (0-100),
 *   degree?: number,
 *   shift?: string ('morning', 'evening')
 * }
 * @returns {
 *   success: boolean,
 *   message: string,
 *   data: milk record with farmerName
 * }
 */

/**
 * GET /api/milk
 * Get milk records with filters
 * @requires Authorization header
 * @query {
 *   farmerId?: string,
 *   category?: string,
 *   shift?: string,
 *   startDate?: ISO date string,
 *   endDate?: ISO date string,
 *   page?: number,
 *   limit?: number
 * }
 * @returns {
 *   success: boolean,
 *   data: milk records array,
 *   pagination: { total, page, limit, pages }
 * }
 */

/**
 * GET /api/milk/stats/dashboard
 * Get all milk statistics
 * @requires Authorization header (Admin only)
 * @query {
 *   startDate?: ISO date string,
 *   endDate?: ISO date string
 * }
 * @returns {
 *   success: boolean,
 *   data: {
 *     totalSubmissions, totalLiter, totalAmount, totalFarmers,
 *     averageFat, averageSNF, byCategory, byShift
 *   }
 * }
 */

/**
 * GET /api/milk/stats/farmer/:farmerId
 * Get farmer milk statistics
 * @requires Authorization header
 * @query {
 *   startDate?: ISO date string,
 *   endDate?: ISO date string
 * }
 * @returns {
 *   success: boolean,
 *   data: farmer statistics
 * }
 */

/**
 * PUT /api/milk/:id
 * Update milk record
 * @requires Authorization header (Admin only)
 * @body { liter?, fat?, snf?, water?, degree?, shift? }
 * @returns {
 *   success: boolean,
 *   message: string,
 *   data: updated milk record
 * }
 */

/**
 * DELETE /api/milk/:id
 * Delete milk record
 * @requires Authorization header (Admin only)
 * @returns {
 *   success: boolean,
 *   message: string
 * }
 */

/**
 * RATE ENDPOINTS
 */

/**
 * POST /api/rate/set
 * Set milk rates
 * @requires Authorization header (Admin only)
 * @body {
 *   category: string ('Cow', 'Buffalo', 'Goat'),
 *   baseRate: number,
 *   fatSurcharge?: number,
 *   snfSurcharge?: number
 * }
 * @returns {
 *   success: boolean,
 *   message: string,
 *   data: rate setting object
 * }
 */

/**
 * GET /api/rate
 * Get all rates
 * @requires Authorization header
 * @returns {
 *   success: boolean,
 *   data: rates array
 * }
 */

/**
 * PAYMENT ENDPOINTS
 */

/**
 * POST /api/payment/create-order
 * Create Razorpay order
 * @requires Authorization header
 * @body {
 *   amount: number (in rupees),
 *   currency?: string (default: 'INR'),
 *   farmerId: string (MongoDB ObjectId),
 *   description?: string
 * }
 * @returns {
 *   success: boolean,
 *   data: razorpay order object
 * }
 */

/**
 * POST /api/payment/verify
 * Verify payment signature
 * @requires Authorization header
 * @body {
 *   orderId: string,
 *   paymentId: string,
 *   signature: string
 * }
 * @returns {
 *   success: boolean,
 *   data: { verified: true }
 * }
 */

/**
 * GET /api/payment/order/:orderId
 * Get order details
 * @requires Authorization header
 * @returns {
 *   success: boolean,
 *   data: razorpay order object
 * }
 */

/**
 * GET /api/payment/history
 * Get payment history
 * @requires Authorization header
 * @query {
 *   page?: number,
 *   limit?: number
 * }
 * @returns {
 *   success: boolean,
 *   data: payments array,
 *   pagination: { total, page, limit, pages }
 * }
 */

/**
 * ERROR RESPONSES
 * All endpoints return errors in this format:
 * {
 *   success: false,
 *   message: string,
 *   errors?: array of error objects (for validation errors)
 * }
 *
 * Common HTTP Status Codes:
 * 200 - OK
 * 201 - Created
 * 400 - Bad Request
 * 401 - Unauthorized
 * 403 - Forbidden
 * 404 - Not Found
 * 409 - Conflict
 * 422 - Validation Error
 * 429 - Too Many Requests
 * 500 - Internal Server Error
 */

module.exports = {
  version: '1.0.0',
  baseUrl: 'http://localhost:3030/api',
  authentication: 'JWT Bearer Token',
  rateLimit: '100 requests per 15 minutes',
  authRateLimit: '5 attempts per 15 minutes',
};
