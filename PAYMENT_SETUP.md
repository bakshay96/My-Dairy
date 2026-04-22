# Payment Gateway Integration Guide - Razorpay

## Overview
This guide explains how to set up Razorpay payment gateway for the Milkify application. The integration supports both test (development) and live (production) modes using environment variables.

---

## Table of Contents
1. [Razorpay Account Setup](#razorpay-account-setup)
2. [Getting Test Keys](#getting-test-keys)
3. [Environment Configuration](#environment-configuration)
4. [Backend Integration](#backend-integration)
5. [Frontend Integration](#frontend-integration)
6. [Testing Payment Flow](#testing-payment-flow)
7. [Switching to Live Keys](#switching-to-live-keys)
8. [Troubleshooting](#troubleshooting)

---

## Razorpay Account Setup

### Step 1: Create Razorpay Account
1. Visit [Razorpay Website](https://razorpay.com/)
2. Click **Sign Up** and choose **Business Account**
3. Enter your business details:
   - Business name
   - Email address
   - Mobile number
   - Business type
4. Complete email verification
5. Accept terms and conditions

### Step 2: Verify Phone Number
- Enter your registered mobile number
- Enter OTP received via SMS
- Click "Verify OTP"

### Step 3: Set up Business Details
- Provide GST details (if applicable)
- Add business address
- Upload any required documents (for verification)

---

## Getting Test Keys

### Access API Keys Dashboard

1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Navigate to **Settings** → **API Keys**
3. You'll see two sections:
   - **Test Keys** (for development)
   - **Live Keys** (for production)

### Test Keys
For development, you'll have:
- **Key ID**: Looks like `rzp_test_xxxxxxxxxxxxxxxx`
- **Key Secret**: A secret string (keep this confidential)

### Example Test Keys (for demo purposes)
```
Key ID:     rzp_test_1234567890abc
Key Secret: test_secret_key_1234567890
```

---

## Environment Configuration

### Backend Configuration (`.env`)

```env
# Razorpay Configuration
# Use TEST keys for development
RAZORPAY_KEY_ID=rzp_test_1234567890abc
RAZORPAY_KEY_SECRET=test_secret_key_1234567890

# For production, switch to live keys
# RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxx
# RAZORPAY_KEY_SECRET=live_secret_xxxxxxxx
```

### Frontend Configuration (`.env`)

```env
# Razorpay Public Key (Test)
VITE_RAZORPAY_KEY_ID=rzp_test_1234567890abc

# For production
# VITE_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxx
```

### Important Notes
- **Never commit keys to version control** - Always use `.env` files
- **Test keys are public** - Use different secret keys for test and live
- **Keep Key Secret confidential** - Only use on backend
- **Public Key can be in frontend** - Test Key ID is safe to expose to frontend

---

## Backend Integration

### Installation

Razorpay package is already included in `package.json`:
```bash
npm install razorpay
```

### Create Payment Service (`Backend/src/Services/paymentService.js`)

```javascript
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create order
const createOrder = async (amount, currency = 'INR', notes = {}) => {
  try {
    const order = await razorpay.orders.create({
      amount: amount * 100, // Amount in paise
      currency,
      notes,
      receipt: `receipt_${Date.now()}`,
      timeout: 600 // 10 minutes
    });
    return order;
  } catch (error) {
    throw new Error(`Order creation failed: ${error.message}`);
  }
};

// Verify payment signature
const verifyPaymentSignature = (orderId, paymentId, signature) => {
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return expectedSignature === signature;
};

module.exports = { createOrder, verifyPaymentSignature, razorpay };
```

### Create Payment Routes

```javascript
// POST /api/payment/create-order
// Creates a new payment order
router.post('/create-order', async (req, res) => {
  const { amount, currency, notes } = req.body;

  try {
    const order = await createOrder(amount, currency, notes);
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/payment/verify
// Verifies payment after frontend completes transaction
router.post('/verify', async (req, res) => {
  const { orderId, paymentId, signature } = req.body;

  try {
    const isValid = verifyPaymentSignature(orderId, paymentId, signature);
    
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Save transaction to database
    // Update user records, etc.

    res.json({
      success: true,
      message: 'Payment verified successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
```

---

## Frontend Integration

### Install Script

Add Razorpay script to `Frontend/index.html`:

```html
<!DOCTYPE html>
<html>
  <head>
    <!-- ... other head elements ... -->
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

### Create Payment Hook (`Frontend/src/hooks/useRazorpay.js`)

```javascript
import { useCallback } from 'react';
import axios from 'axios';

const useRazorpay = () => {
  const createOrder = useCallback(async (amount) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/payment/create-order`,
        {
          amount,
          currency: 'INR',
          notes: {
            description: 'Milk Collection Payment'
          }
        }
      );
      return response.data.data;
    } catch (error) {
      throw new Error(`Failed to create order: ${error.message}`);
    }
  }, []);

  const verifyPayment = useCallback(async (orderId, paymentId, signature) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/payment/verify`,
        {
          orderId,
          paymentId,
          signature
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Payment verification failed: ${error.message}`);
    }
  }, []);

  const openCheckout = useCallback(async (amount, notes = {}) => {
    const order = await createOrder(amount);
    
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: amount * 100,
      currency: 'INR',
      name: 'Milkify',
      description: 'Milk Collection Payment',
      order_id: order.id,
      notes,
      handler: async (response) => {
        try {
          await verifyPayment(order.id, response.razorpay_payment_id, response.razorpay_signature);
          return {
            success: true,
            paymentId: response.razorpay_payment_id
          };
        } catch (error) {
          return {
            success: false,
            error: error.message
          };
        }
      },
      prefill: {
        email: 'user@example.com',
        contact: '9999999999'
      },
      theme: {
        color: '#3399cc'
      },
      modal: {
        onclosed: () => {
          console.log('Checkout form closed');
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  }, [createOrder, verifyPayment]);

  return { openCheckout, createOrder, verifyPayment };
};

export default useRazorpay;
```

### Payment Component

```javascript
import React, { useState } from 'react';
import useRazorpay from '../hooks/useRazorpay';

const PaymentButton = ({ amount }) => {
  const [loading, setLoading] = useState(false);
  const { openCheckout } = useRazorpay();

  const handlePayment = async () => {
    try {
      setLoading(true);
      await openCheckout(amount, {
        farmerId: 'farmer_123',
        purpose: 'milk_payment'
      });
    } catch (error) {
      alert(`Payment failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handlePayment} disabled={loading}>
      {loading ? 'Processing...' : `Pay ₹${amount}`}
    </button>
  );
};

export default PaymentButton;
```

---

## Testing Payment Flow

### Test Card Numbers (Provided by Razorpay)

| Card Type | Number | CVV | Expiry |
|-----------|--------|-----|--------|
| Visa | 4111 1111 1111 1111 | Any 3 digits | Any future date |
| Mastercard | 5555 5555 5555 4444 | Any 3 digits | Any future date |
| Amex | 3782 822463 10005 | Any 4 digits | Any future date |

### Test Payment Scenarios

1. **Successful Payment**: Use test card details above
2. **Failed Payment**: Use invalid CVV (e.g., 123 for Amex)
3. **Declined Payment**: Your bank may decline test transactions

### Testing Flow

1. Start both backend and frontend servers
2. Click "Pay" button in your application
3. Use test card number: `4111 1111 1111 1111`
4. Enter any future expiry date (e.g., 12/25)
5. Enter any 3-digit CVV
6. Payment should complete successfully
7. Check database for transaction record

---

## Switching to Live Keys

### Step 1: Get Live Keys

1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Go to **Settings** → **API Keys**
3. Scroll down to **Live Keys** section
4. Copy:
   - Live Key ID (starts with `rzp_live_`)
   - Live Key Secret

### Step 2: Update Environment Variables

**Backend `.env`:**
```env
RAZORPAY_KEY_ID=rzp_live_your_live_key_id
RAZORPAY_KEY_SECRET=your_live_key_secret
```

**Frontend `.env`:**
```env
VITE_RAZORPAY_KEY_ID=rzp_live_your_live_key_id
```

### Step 3: Test Live Payments

1. Use real credit/debit cards for testing
2. Real transactions will be processed
3. Keep test transactions to minimum
4. Check Razorpay dashboard for transaction status

### Step 4: Production Checklist

- [ ] Updated all environment variables to live keys
- [ ] Tested with real cards (multiple times)
- [ ] Verified webhook handling for payment notifications
- [ ] Set up refund process if needed
- [ ] Configured email notifications for payments
- [ ] Documented payment procedures for team
- [ ] Set up monitoring and alerts for failed payments
- [ ] Configured automated backup and logging

---

## Troubleshooting

### Common Issues

#### 1. "Invalid Key ID"
**Cause**: Test Key ID not loaded correctly
**Solution**: 
- Verify `VITE_RAZORPAY_KEY_ID` in Frontend `.env`
- Restart frontend dev server after changing `.env`

#### 2. "Payment Failed - 400 Bad Request"
**Cause**: Backend order creation failed
**Solution**:
- Check backend `.env` has valid `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
- Verify amount is sent as number (not string)
- Check backend logs for detailed error

#### 3. "Invalid Signature"
**Cause**: Payment verification failed
**Solution**:
- Ensure `RAZORPAY_KEY_SECRET` is correct on backend
- Check that signature verification uses correct algorithm
- Verify order ID and payment ID are correct

#### 4. "CORS Error"
**Cause**: Frontend and backend CORS mismatch
**Solution**:
- Ensure backend CORS allows frontend origin
- Check `origin` in Backend `.env`
- Verify frontend API base URL is correct

#### 5. Test Keys Not Working
**Cause**: Using wrong key format or expired
**Solution**:
- Regenerate test keys from dashboard
- Use key format: `rzp_test_xxxxxxxxxxxxxxxx`
- Never use live keys in development

---

## Security Best Practices

1. **Never hardcode keys** - Always use environment variables
2. **Never expose Key Secret** - Only use on backend
3. **Always verify signatures** - Validate payments on backend
4. **Use HTTPS** - In production, use SSL/TLS
5. **Validate amounts** - Check amounts match before processing
6. **Log transactions** - Keep audit trail of all payments
7. **Handle webhook events** - For asynchronous payment updates
8. **Implement timeout** - Orders expire after configured time
9. **Encrypt sensitive data** - Store payment data securely
10. **Regular audits** - Review payment logs regularly

---

## Additional Resources

- [Razorpay Official Documentation](https://razorpay.com/docs/)
- [Razorpay Checkout Documentation](https://razorpay.com/docs/payment-gateway/web-integration/standard/)
- [Razorpay Orders API](https://razorpay.com/docs/api/orders/)
- [Razorpay Node.js SDK](https://github.com/razorpay/razorpay-node)
- [Razorpay Security](https://razorpay.com/docs/api/security/)

---

## Support

For Razorpay-specific issues:
- Email: support@razorpay.com
- Dashboard: [Razorpay Dashboard](https://dashboard.razorpay.com/)
- Chat: Available in dashboard

For application-specific integration issues:
- Check application logs
- Review payment service code
- Test with different amounts
- Verify environment variables
