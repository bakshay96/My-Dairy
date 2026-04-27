// ============================================
// PAYMENT SERVICE - Razorpay Integration
// ============================================
const Razorpay = require("razorpay");
const crypto = require("crypto");

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

class PaymentService {
  /**
   * Create a payment order
   * @param {Object} orderData - Order details
   * @returns {Object} - Created order
   */
  async createOrder(orderData) {
    const { amount, currency = "INR", farmerId, description = "Milk Payment" } = orderData;

    try {
      const order = await razorpay.orders.create({
        amount: amount * 100, // Convert to paise
        currency,
        receipt: `receipt_${farmerId}_${Date.now()}`,
        description,
        notes: {
          farmerId,
          purpose: "milk_payment",
          timestamp: new Date().toISOString(),
        },
        timeout: 600, // 10 minutes
      });

      return {
        success: true,
        message: "Order created successfully",
        data: order,
      };
    } catch (error) {
      const err = new Error(`Order creation failed: ${error.message}`);
      err.statusCode = 400;
      throw err;
    }
  }

  /**
   * Verify payment signature
   * @param {Object} paymentData - Payment details
   * @returns {boolean} - Is signature valid
   */
  verifyPaymentSignature(paymentData) {
    const { orderId, paymentId, signature } = paymentData;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    return expectedSignature === signature;
  }

  /**
   * Get payment details
   * @param {string} paymentId - Payment ID
   * @returns {Object} - Payment details
   */
  async getPaymentDetails(paymentId) {
    try {
      const payment = await razorpay.payments.fetch(paymentId);
      return {
        success: true,
        data: payment,
      };
    } catch (error) {
      const err = new Error(`Failed to fetch payment: ${error.message}`);
      err.statusCode = 400;
      throw err;
    }
  }

  /**
   * Refund payment
   * @param {string} paymentId - Payment ID
   * @param {number} amount - Refund amount (in rupees, optional)
   * @returns {Object} - Refund details
   */
  async refundPayment(paymentId, amount = null) {
    try {
      const refundData = { payment_id: paymentId };
      if (amount) {
        refundData.amount = amount * 100; // Convert to paise
      }

      const refund = await razorpay.refunds.create(refundData);

      return {
        success: true,
        message: "Refund processed successfully",
        data: refund,
      };
    } catch (error) {
      const err = new Error(`Refund failed: ${error.message}`);
      err.statusCode = 400;
      throw err;
    }
  }

  /**
   * Get order details
   * @param {string} orderId - Order ID
   * @returns {Object} - Order details
   */
  async getOrderDetails(orderId) {
    try {
      const order = await razorpay.orders.fetch(orderId);
      return {
        success: true,
        data: order,
      };
    } catch (error) {
      const err = new Error(`Failed to fetch order: ${error.message}`);
      err.statusCode = 400;
      throw err;
    }
  }

  /**
   * Create recurring payment (subscription)
   * @param {Object} subscriptionData - Subscription details
   * @returns {Object} - Created subscription
   */
  async createSubscription(subscriptionData) {
    const { planId, customerId, quantity = 1, totalCount } = subscriptionData;

    try {
      const subscription = await razorpay.subscriptions.create({
        plan_id: planId,
        customer_notify: 1,
        quantity,
        total_count: totalCount,
      });

      return {
        success: true,
        message: "Subscription created successfully",
        data: subscription,
      };
    } catch (error) {
      const err = new Error(`Subscription creation failed: ${error.message}`);
      err.statusCode = 400;
      throw err;
    }
  }

  /**
   * Process bulk payments
   * @param {Array} payments - Array of payment objects
   * @returns {Object} - Bulk payment result
   */
  async processBulkPayments(payments) {
    try {
      const results = [];

      for (const payment of payments) {
        const result = await this.createOrder(payment);
        results.push(result.data);
      }

      return {
        success: true,
        message: "Bulk payments processed",
        data: results,
      };
    } catch (error) {
      const err = new Error(`Bulk payment processing failed: ${error.message}`);
      err.statusCode = 400;
      throw err;
    }
  }
}

module.exports = new PaymentService();
