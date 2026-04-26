"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { formatRupees } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { X, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function PaymentModal({ farmer, isOpen, onClose, onSuccess, startDate = "", endDate = "" }) {
  const [loading, setLoading] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentMode, setPaymentMode] = useState("cash");
  const [paymentChannel, setPaymentChannel] = useState("cash");
  const [manualIntent, setManualIntent] = useState(null);

  useEffect(() => {
    // Dynamically load Razorpay SDK
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    setManualIntent(null);
  }, [paymentMode, paymentChannel, farmer?.farmerId, startDate, endDate]);

  const handlePayment = async () => {
    if (paymentMode === "online" && paymentChannel === "razorpay" && !razorpayLoaded) {
      toast.error("Payment gateway is loading. Please try again in a moment.");
      return;
    }

    try {
      setLoading(true);

      if (paymentMode === "cash") {
        await api.post("/payment/settle", {
          farmerId: farmer.farmerId,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          paymentMode,
          paymentChannel,
          paymentDbId: manualIntent?.paymentDbId || null,
        });
        setPaymentSuccess(true);
        toast.success("Payment marked as paid");
        setTimeout(() => onSuccess(), 1500);
        return;
      }

      if (paymentMode === "online" && paymentChannel !== "razorpay") {
        if (!manualIntent) {
          const intentRes = await api.post("/payment/manual-intent", {
            farmerId: farmer.farmerId,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            paymentChannel,
          });
          setManualIntent(intentRes.data);
          toast.success("Payment QR generated");
          return;
        }
        await api.post("/payment/settle", {
          farmerId: farmer.farmerId,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          paymentMode,
          paymentChannel,
          paymentDbId: manualIntent?.paymentDbId || null,
        });
        setPaymentSuccess(true);
        toast.success("Online payment marked as settled");
        setTimeout(() => onSuccess(), 1500);
        return;
      }

      // 1. Create order on the backend
      const res = await api.post("/payment/create-billing-order", {
        farmerId: farmer.farmerId,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      const { order, paymentDbId } = res.data;

      // 2. Initialize Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Milkify Payments",
        description: `10-Day Billing: ${farmer.farmerName}`,
        order_id: order.id,
        handler: async function (response) {
          // 3. Verify payment signature on backend
          try {
            await api.post("/payment/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              paymentDbId,
            });
            setPaymentSuccess(true);
            toast.success("Payment verified successfully");
            setTimeout(() => {
              onSuccess();
            }, 2000);
          } catch (error) {
            console.error("Payment verification failed:", error);
            toast.error("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: farmer.farmerName,
          contact: farmer.farmerMobile,
        },
        theme: {
          color: "#2563eb", // blue-600 matching Tailwind primary
        },
      };

      const rzp = new window.Razorpay(options);
      
      rzp.on("payment.failed", function (response) {
        console.error("Payment failed:", response.error);
        toast.error(`Payment failed: ${response.error.description}`);
      });

      rzp.open();
    } catch (error) {
      console.error("Failed to initiate payment:", error);
      toast.error(error.response?.data?.message || "Failed to initiate payment.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b bg-gray-50/50">
          <h3 className="font-semibold text-lg text-gray-900">Checkout</h3>
          <button onClick={onClose} disabled={loading || paymentSuccess} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {paymentSuccess ? (
            <div className="flex flex-col items-center justify-center py-8 text-center animate-bounce-in">
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <h4 className="text-xl font-bold text-gray-900 mb-2">Payment Successful!</h4>
              <p className="text-gray-500">{formatRupees(farmer.totalAmount)} sent to {farmer.farmerName}</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm text-gray-500">Total Amount Payable</span>
                  <span className="text-3xl font-bold text-blue-700">{formatRupees(farmer.totalAmount)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Farmer</span>
                  <span className="font-medium text-gray-900">{farmer.farmerName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Mobile</span>
                  <span className="font-medium text-gray-900">{farmer.farmerMobile}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total Liters</span>
                  <span className="font-medium text-gray-900">{farmer.totalLiters.toFixed(2)} L</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-3 mt-3">
                  <span className="text-gray-500">Payment Method</span>
                  <span className="font-medium text-gray-900 flex items-center gap-2">
                    {paymentMode === "cash" ? "Cash" : paymentChannel}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-gray-500">Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => {
                      const mode = e.target.value;
                      setPaymentMode(mode);
                      setPaymentChannel(mode === "cash" ? "cash" : "upi");
                    }}
                    className="h-10 w-full rounded-md border px-3 text-sm"
                  >
                    <option value="cash">Cash</option>
                    <option value="online">Online</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-500">Channel</label>
                  <select
                    value={paymentChannel}
                    onChange={(e) => setPaymentChannel(e.target.value)}
                    disabled={paymentMode === "cash"}
                    className="h-10 w-full rounded-md border px-3 text-sm disabled:opacity-60"
                  >
                    {paymentMode === "cash" ? (
                      <option value="cash">Cash</option>
                    ) : (
                      <>
                        <option value="upi">UPI</option>
                        <option value="google_pay">Google Pay</option>
                        <option value="phonepe">PhonePe</option>
                        <option value="bhim">BHIM</option>
                        <option value="other">Other App</option>
                        <option value="razorpay">Razorpay</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {paymentMode === "online" && paymentChannel !== "razorpay" && manualIntent && (
                <div className="border rounded-lg p-3 space-y-2">
                  <p className="text-xs text-gray-500">Internal Order ID</p>
                  <p className="text-sm font-semibold break-all">{manualIntent.internalOrderId}</p>
                  <img src={manualIntent.qrCodeUrl} alt="Payment QR" className="h-40 w-40 mx-auto" />
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const url = manualIntent.upiIntent;
                        window.location.href = url;
                      }}
                    >
                      Open UPI
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const appUrl =
                          paymentChannel === "google_pay"
                            ? manualIntent.upiIntent.replace("upi://", "gpay://")
                            : paymentChannel === "phonepe"
                            ? manualIntent.upiIntent.replace("upi://", "phonepe://")
                            : paymentChannel === "bhim"
                            ? manualIntent.upiIntent.replace("upi://", "bhim://")
                            : manualIntent.upiIntent;
                        window.location.href = appUrl;
                      }}
                    >
                      Open App
                    </Button>
                  </div>
                  <p className="text-xs text-center text-gray-500">After receiving amount, click settle payment.</p>
                </div>
              )}

              <Button 
                className="w-full h-12 text-lg shadow-md" 
                onClick={handlePayment} 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...
                  </>
                ) : paymentMode === "online" && paymentChannel !== "razorpay" && !manualIntent ? (
                  "Generate QR"
                ) : paymentMode === "online" && paymentChannel !== "razorpay" && manualIntent ? (
                  "Mark as Settled"
                ) : (
                  `Pay ${formatRupees(farmer.totalAmount)} Now`
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
