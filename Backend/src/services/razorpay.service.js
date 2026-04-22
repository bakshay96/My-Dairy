const Razorpay = require("razorpay");

let razorpayInstance = null;

/**
 * Get (or lazily create) the Razorpay SDK instance.
 * Credentials are read from environment variables — swap test ↔ live
 * just by changing RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.
 */
const getRazorpay = () => {
  if (razorpayInstance) return razorpayInstance;

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay credentials not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env"
    );
  }

  razorpayInstance = new Razorpay({ key_id: keyId, key_secret: keySecret });
  return razorpayInstance;
};

module.exports = { getRazorpay };
