"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  PackageCheck,
  CheckCircle2,
  Truck,
  Store,
  MapPin,
  Phone,
  Printer,
  ArrowLeft,
  AlertCircle,
  Share2,
  Clock,
  XCircle,
  Loader2,
  FileText,
} from "lucide-react";
import { toast } from "@/lib/toast";
import axios from "axios";
import ThemeToggle from "@/components/ui/ThemeToggle";

const API_BASE = typeof window !== "undefined" ? "/api" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3030/api");

const STATUS_STEPS = [
  { key: "placed", label: "Order Placed", desc: "Received at outlet" },
  { key: "confirmed", label: "Confirmed", desc: "Stock verified & assigned" },
  { key: "packed", label: "Packed", desc: "Ready for dispatch" },
  { key: "out_for_delivery", label: "Out for Delivery", desc: "On the way to village" },
  { key: "delivered", label: "Delivered", desc: "Delivered & verified" },
];

export default function OrderTrackingPage({ params }) {
  const orderNumber = params?.orderNumber;

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [storeSlug, setStoreSlug] = useState("");
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("Changed mind / Ordered by mistake");
  const [cancelling, setCancelling] = useState(false);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/store/public/order/track/${orderNumber}`);
      if (res.data?.success && res.data.order) {
        setOrder(res.data.order);
        const resolvedSlug = res.data.order.storeSlug || res.data.storeSlug;
        if (resolvedSlug) {
          setStoreSlug(resolvedSlug);
          try {
            localStorage.setItem("milkify_last_store_slug", resolvedSlug);
          } catch {}
        }
      } else {
        toast.error("Order not found");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load order tracking details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("milkify_last_store_slug");
      if (saved) setStoreSlug(saved);
    }
    if (orderNumber) fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderNumber]);

  const getStepIndex = (status) => {
    const map = {
      placed: 0,
      confirmed: 1,
      packed: 2,
      out_for_delivery: 3,
      delivered: 4,
      cancelled: -1,
    };
    return map[status] ?? 0;
  };

  const currentStep = getStepIndex(order?.orderStatus);

  // Clean 80mm server thermal receipt print
  const handlePrint = () => {
    if (!orderNumber) return;
    const printUrl = `${API_BASE}/store/public/bill/${orderNumber}/print?autoprint=1`;
    window.open(printUrl, "_blank", "width=450,height=650,menubar=no,toolbar=no,location=no,status=no");
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Tracking link copied to clipboard!");
    }
  };

  const canCancel =
    order &&
    order.orderStatus !== "cancelled" &&
    (order.orderStatus === "placed" || order.paymentStatus === "pending");

  const handleCancelOrder = async () => {
    if (!orderNumber) return;
    setCancelling(true);
    try {
      const res = await axios.put(`${API_BASE}/store/public/order/${orderNumber}/cancel`, {
        reason: cancelReason,
      });
      if (res.data?.success) {
        toast.success(res.data.message || "Order cancelled successfully");
        setOrder(res.data.order);
        setIsCancelModalOpen(false);
        try {
          const savedCurrent = localStorage.getItem("milkify_current_order");
          if (savedCurrent) {
            const parsed = JSON.parse(savedCurrent);
            if (parsed.orderNumber === orderNumber) {
              localStorage.removeItem("milkify_current_order");
            }
          }
          const existing = JSON.parse(localStorage.getItem("milkify_guest_order_history") || "[]");
          const updated = existing.map((o) => (o.orderNumber === orderNumber ? res.data.order : o));
          localStorage.setItem("milkify_guest_order_history", JSON.stringify(updated));
        } catch {}
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel order");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-800 dark:text-slate-100 p-6">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Tracking live order status...</p>
      </div>
    );
  }

  const backToStoreUrl = order?.storeSlug
    ? `/store/${order.storeSlug}`
    : storeSlug
    ? `/store/${storeSlug}`
    : "/";

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-800 dark:text-slate-100 p-6 text-center">
        <AlertCircle className="w-16 h-16 text-rose-500 mb-4" />
        <h1 className="text-2xl font-bold">Order Not Found</h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mt-2">
          We could not find an order matching #{orderNumber}. Please verify your order number.
        </p>
        <Link
          href={backToStoreUrl}
          className="mt-6 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition shadow-sm"
        >
          Return to Dairy Store
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-700 dark:selection:text-emerald-300 py-8 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top bar & actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
          <Link
            href={backToStoreUrl}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dairy Store
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {canCancel && (
              <button
                onClick={() => setIsCancelModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold transition shadow-xs"
              >
                <XCircle className="w-3.5 h-3.5" />
                Cancel Order
              </button>
            )}
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 transition shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share Link
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-600/20"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Receipt
            </button>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {order.orderStatus.replace(/_/g, " ")}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {order.fulfillmentType === "village_delivery" ? "🛵 Village Delivery" : "🏪 Counter Pickup"}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">Order #{order.orderNumber}</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Placed on {new Date(order.createdAt).toLocaleDateString()} at{" "}
                {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>

              {order.orderStatus !== "cancelled" && (
                <div className="mt-3 flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-3 py-1.5 rounded-xl w-fit">
                  <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    {order.fulfillmentType === "village_delivery"
                      ? "Estimated Delivery: Today within 45-60 mins"
                      : "Ready for Pickup: Within 15 mins at dairy counter"}
                  </span>
                </div>
              )}
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs text-slate-400 dark:text-slate-500 uppercase font-medium">Grand Total</span>
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">₹{order.grandTotal}</p>
              <span
                className={`inline-block mt-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
                  order.paymentStatus === "paid"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/20"
                }`}
              >
                {order.paymentMethod === "farmer_milk_bill"
                  ? `🥛 Dairy Cash: ${(order.paymentStatus || "paid").toUpperCase()}`
                  : order.paymentMethod === "online"
                  ? `⚡ Online: ${(order.paymentStatus || "paid").toUpperCase()}`
                  : `💵 COD: ${(order.paymentStatus || "pending").toUpperCase()}`}
              </span>
            </div>
          </div>

          {/* 5-Step Visual Timeline */}
          {order.orderStatus !== "cancelled" ? (
            <div className="py-8">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 relative">
                {STATUS_STEPS.map((step, idx) => {
                  const isDone = currentStep >= idx;
                  const isCurrent = currentStep === idx;

                  return (
                    <div key={step.key} className="flex flex-col items-center text-center space-y-2">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center transition shadow-sm ${
                          isDone
                            ? "bg-emerald-600 text-white shadow-emerald-500/20 ring-4 ring-emerald-500/10"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <span className="text-xs font-bold">{idx + 1}</span>
                        )}
                      </div>
                      <div>
                        <h4
                          className={`text-xs font-bold ${
                            isCurrent ? "text-emerald-600 dark:text-emerald-400" : isDone ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500"
                          }`}
                        >
                          {step.label}
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 max-w-[120px]">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="py-6 px-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-2xl text-center space-y-2 mt-4">
              <AlertCircle className="w-10 h-10 mx-auto text-rose-500" />
              <h3 className="font-extrabold text-base text-rose-600 dark:text-rose-400">This Order Has Been Rejected / Cancelled</h3>
              <div className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300">
                {order.cancelledBy === "customer"
                  ? "👤 Cancelled by You (Customer)"
                  : order.cancelledBy === "system_timeout"
                  ? "⏱️ Auto-Cancelled (Online Payment Window Elapsed)"
                  : "🛡️ Rejected by Dairy Store Admin"}
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 max-w-md mx-auto">
                <strong>Reason:</strong> {order.cancellationReason || order.statusHistory?.slice(-1)[0]?.note || "Order was cancelled."}
              </p>
              {order.refundDetails?.isRefunded || order.paymentStatus === "refunded" ? (
                <div className="max-w-md mx-auto p-3 bg-white dark:bg-slate-900 rounded-xl border border-rose-200 dark:border-rose-900/40 text-xs space-y-1">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 block">
                    ✓ 100% Refund Initiated (₹{order.refundDetails?.amount || order.grandTotal})
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Refund ID: <strong className="font-mono text-slate-700 dark:text-slate-300">{order.refundDetails?.refundId || "Processed"}</strong>
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {order.refundDetails?.reason || (order.paymentMethod === "farmer_milk_bill" ? "Restored to your unsettled milk settlement credit." : "Amount will reflect in your UPI/Bank account.")}
                  </p>
                </div>
              ) : null}
            </div>
          )}

          {/* Runner Info if assigned */}
          {order.assignedRunner?.name && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl p-4 flex items-center justify-between gap-4 mt-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-600/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Delivery Runner Assigned</h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">{order.assignedRunner.name}</p>
                </div>
              </div>
              {order.assignedRunner.phone && (
                <a
                  href={`tel:${order.assignedRunner.phone}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  <Phone className="w-3.5 h-3.5" />
                  Call Runner
                </a>
              )}
            </div>
          )}
        </div>

        {/* Order Details & Summary Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Order Items (2 cols) */}
          <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Order Items ({order.items?.length || 0})
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {(order.items || []).map((it, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{it.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {it.packageSize || it.unit} • Qty: {it.quantity} @ ₹{it.price}
                    </p>
                  </div>
                  <span className="text-sm font-black text-slate-900 dark:text-white shrink-0">
                    ₹{it.totalItemAmount}
                  </span>
                </div>
              ))}
            </div>

            {/* Price breakdown */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Items Subtotal:</span>
                <span className="font-semibold text-slate-900 dark:text-white">₹{order.subtotal}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Coupon Discount:</span>
                  <span className="font-semibold">-₹{order.discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery &amp; Logistics:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {order.deliveryFee === 0 ? "FREE" : `₹${order.deliveryFee}`}
                </span>
              </div>
              <div className="flex justify-between text-base font-black text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-800">
                <span>Grand Total:</span>
                <span className="text-emerald-600 dark:text-emerald-400">₹{order.grandTotal}</span>
              </div>
            </div>

            {order.paymentMethod === "farmer_milk_bill" && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <div>
                  <p className="font-bold">Paid with Dairy Milk Credit (Dairy Cash)</p>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300">
                    ₹{order.grandTotal} was deducted instantly from your unsettled milk settlement balance.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Customer & Delivery Info (1 col) */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Delivery Address
              </h3>
              <div className="text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                <p className="font-bold text-slate-900 dark:text-white text-sm">
                  {order.deliveryAddress?.recipientName}
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  📱 {order.deliveryAddress?.recipientPhone}
                </p>
                <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                  🏡 Village: {order.deliveryAddress?.village}
                </p>
                {order.deliveryAddress?.fullAddress && (
                  <p className="text-slate-500 dark:text-slate-400">{order.deliveryAddress.fullAddress}</p>
                )}
                {order.deliveryAddress?.landmark && (
                  <p className="text-slate-400 dark:text-slate-500 text-[11px]">
                    Landmark: {order.deliveryAddress.landmark}
                  </p>
                )}
              </div>
            </div>

            {order.customerNotes && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-3xl p-5 space-y-1.5 shadow-sm">
                <h3 className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  Your Delivery Instructions / Note
                </h3>
                <p className="text-xs text-amber-950 dark:text-amber-200 italic">
                  &ldquo;{order.customerNotes}&rdquo;
                </p>
              </div>
            )}

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-3 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Store className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Dairy Outlet Hub
              </h3>
              <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                <p className="font-bold text-slate-900 dark:text-white text-sm">
                  {order.adminId?.shopName || "Milkify Dairy Center"}
                </p>
                <p>Village: {order.adminId?.village || "Regional Hub"}</p>
                {order.adminId?.mobile && <p>Support: {order.adminId.mobile}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Order Confirmation Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <XCircle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Cancel Order #{order.orderNumber}?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Are you sure you want to cancel this order? The reserved inventory will be restored to the dairy outlet.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Reason for Cancellation</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="Changed mind / Ordered by mistake">Changed mind / Ordered by mistake</option>
                <option value="Need to change delivery location">Need to change delivery location</option>
                <option value="Want to change items in order">Want to change items in order</option>
                <option value="Delivery time does not suit me">Delivery time does not suit me</option>
                <option value="Other reason">Other reason</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                disabled={cancelling}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/20"
              >
                {cancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
