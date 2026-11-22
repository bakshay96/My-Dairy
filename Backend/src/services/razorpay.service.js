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

  const isKeyIdValid = (k) => typeof k === "string" && k.startsWith("rzp_") && !k.includes("REPLACE");
  const isSecretValid = (k) => typeof k === "string" && k.trim().length >= 10 && !k.includes("REPLACE");

  if (!isKeyIdValid(keyId) || !isSecretValid(keySecret)) {
    throw new Error(
      "Razorpay keys not configured. Add real RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env " +
      "(get them from https://dashboard.razorpay.com/app/keys)"
    );
  }

  razorpayInstance = new Razorpay({ key_id: keyId.trim(), key_secret: keySecret.trim() });
  return razorpayInstance;
};

module.exports = { getRazorpay };

