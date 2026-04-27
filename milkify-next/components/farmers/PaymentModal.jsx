"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { formatRupees } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { X, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function PaymentModal({ farmer, isOpen, onClose, onSuccess, startDate = "", endDate = "" }) {
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [referenceId, setReferenceId] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [settlementHistory, setSettlementHistory] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!isOpen || !farmer?.farmerId) return;
      try {
        setHistoryLoading(true);
        const res = await api.get(
          `/payment/history?status=captured&pageSize=50&farmerId=${encodeURIComponent(String(farmer.farmerId))}`
        );
        setSettlementHistory(res.data?.payments || []);
      } catch (e) {
        console.error("Failed to fetch settlement history:", e);
        setSettlementHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    };
    fetchHistory();
  }, [isOpen, farmer?.farmerId, paymentSuccess]);

  const handlePayment = async () => {
    try {
      setLoading(true);

      await api.post("/payment/settle", {
        farmerId: farmer.farmerId,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        paymentMode: "cash",
        paymentChannel: "cash",
        referenceId,
      });
      setPaymentSuccess(true);
      toast.success("Cash settlement completed");
      setTimeout(() => onSuccess(), 1500);
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
                    Cash
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-gray-500">Reference ID (optional)</label>
                  <input
                    value={referenceId}
                    onChange={(e) => setReferenceId(e.target.value)}
                    className="h-10 w-full rounded-md border px-3 text-sm"
                    placeholder="Cash receipt / UTR / txn id"
                  />
                </div>
              </div>

              <div className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-900">Settlement History</p>
                  {historyLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
                </div>
                {settlementHistory.length === 0 ? (
                  <p className="text-xs text-gray-500">No settlements found for this farmer yet.</p>
                ) : (
                  <div className="max-h-40 overflow-auto space-y-2">
                    {settlementHistory.map((p) => (
                      <div key={p._id} className="text-xs flex items-center justify-between border rounded p-2">
                        <div className="space-y-0.5">
                          <p className="font-medium">
                            {formatRupees((p.amount || 0) / 100)}{" "}
                            <span className="text-gray-500">
                              ({p.billingStartDate || p.notes?.cycleStart || "-"} → {p.billingEndDate || p.notes?.cycleEnd || "-"})
                            </span>
                          </p>
                          <p className="text-gray-500">
                            Ref: {p.notes?.referenceId || "-"} | Order: {p.internalOrderId || "-"}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700">Paid</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button 
                className="w-full h-12 text-lg shadow-md" 
                onClick={handlePayment} 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...
                  </>
                ) : (
                  `Settle ${formatRupees(farmer.totalAmount)} (Cash)`
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
