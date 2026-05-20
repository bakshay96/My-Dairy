const Razorpay = require("razorpay");

let razorpayInstance = null;

/**
 * Get (or lazily create) the Razorpay SDK instance.
 * Credentials are read from .env — swap test ↔ live just by changing
 * RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.
 *
 * Throws a clear error only when actually called (during a payment flow),
 * never at module load — so placeholder values in .env don't pollute logs.
 */
const getRazorpay = () => {
  if (razorpayInstance) return razorpayInstance;

  const keyId     = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  const isValid = (k) => typeof k === "string" && k.startsWith("rzp_") && !k.includes("REPLACE");

  if (!isValid(keyId) || !isValid(keySecret)) {
    throw new Error(
      "Razorpay keys not configured. Add real RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env " +
      "(get them from https://dashboard.razorpay.com/app/keys)"
    );
  }

  razorpayInstance = new Razorpay({ key_id: keyId, key_secret: keySecret });
  return razorpayInstance;
};

module.exports = { getRazorpay };

