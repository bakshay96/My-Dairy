import { useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';

const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

/**
 * Dynamically loads the Razorpay checkout.js script once.
 * Returns a promise that resolves when the script is ready.
 */
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    // Script already loaded
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.getElementById('razorpay-checkout-js');
    if (existingScript) {
      existingScript.onload = () => resolve(true);
      existingScript.onerror = () => resolve(false);
      return;
    }

    const script = document.createElement('script');
    script.id = 'razorpay-checkout-js';
    script.src = RAZORPAY_SCRIPT_URL;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * useRazorpay — hook for initiating a Razorpay payment.
 *
 * Usage:
 *   const { initiatePayment, isLoading } = useRazorpay();
 *   await initiatePayment({ amount: 500, description: 'Milk payment' });
 */
const useRazorpay = () => {
  const initiatePayment = useCallback(
    async ({
      amount,           // in rupees
      description = '',
      farmerId = null,
      prefill = {},     // { name, email, contact }
      onSuccess,        // callback(paymentData)
      onFailure,        // callback(error)
    }) => {
      // 1. Load Razorpay script
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error('Payment gateway failed to load. Check your internet connection.');
        onFailure?.({ message: 'Razorpay script load failed' });
        return;
      }

      try {
        // 2. Create order on backend
        const { data } = await api.post('/payment/create-order', {
          amount,
          description,
          farmerId,
        });

        const { order, paymentDbId } = data;

        // 3. Open Razorpay checkout
        const options = {
          key: order.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: order.amount,          // in paise
          currency: order.currency || 'INR',
          name: 'Milkify',
          description,
          order_id: order.id,
          prefill: {
            name: prefill.name || '',
            email: prefill.email || '',
            contact: prefill.contact || '',
          },
          theme: {
            color: '#2563eb',
          },
          modal: {
            ondismiss: () => {
              toast.info('Payment cancelled');
              onFailure?.({ message: 'Payment dismissed by user' });
            },
          },
          handler: async (response) => {
            // 4. Verify on backend (signature check)
            try {
              const { data: verifyData } = await api.post('/payment/verify', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                paymentDbId,
              });

              if (verifyData.success) {
                toast.success('Payment successful!');
                onSuccess?.(verifyData.payment);
              } else {
                toast.error('Payment verification failed');
                onFailure?.(verifyData);
              }
            } catch (verifyError) {
              toast.error('Payment verification error');
              onFailure?.(verifyError);
            }
          },
        };

        const rzp = new window.Razorpay(options);

        rzp.on('payment.failed', (response) => {
          toast.error(`Payment failed: ${response.error.description}`);
          onFailure?.(response.error);
        });

        rzp.open();
      } catch (error) {
        const msg = error?.response?.data?.message || 'Failed to initiate payment';
        toast.error(msg);
        onFailure?.(error);
      }
    },
    []
  );

  return { initiatePayment };
};

export default useRazorpay;
