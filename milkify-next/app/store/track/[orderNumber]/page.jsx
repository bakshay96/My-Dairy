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
} from "lucide-react";
import { toast } from "@/lib/toast";
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

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

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/store/public/order/track/${orderNumber}`);
      if (res.data?.success) {
        setOrder(res.data.order);
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

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Tracking link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-6">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
        <p className="text-sm text-slate-400">Tracking live order status...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-6 text-center">
        <AlertCircle className="w-16 h-16 text-rose-500 mb-4" />
        <h1 className="text-2xl font-bold">Order Not Found</h1>
        <p className="text-slate-400 max-w-md mt-2">
          We could not find an order matching #{orderNumber}. Please verify your order number.
        </p>
        <Link
          href="/"
          className="mt-6 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition"
        >
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-300 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top bar & actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dairy Store
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 transition"
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
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {order.orderStatus.replace(/_/g, " ")}
                </span>
                <span className="text-xs text-slate-400">
                  {order.fulfillmentType === "village_delivery" ? "🛵 Village Delivery" : "🏪 Counter Pickup"}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white mt-2">Order #{order.orderNumber}</h1>
              <p className="text-xs text-slate-400 mt-1">
                Placed on {new Date(order.createdAt).toLocaleDateString()} at{" "}
                {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs text-slate-400 uppercase font-medium">Grand Total</span>
              <p className="text-3xl font-black text-emerald-400">₹{order.grandTotal}</p>
              <span
                className={`inline-block mt-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
                  order.paymentStatus === "paid"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-amber-500/20 text-amber-300"
                }`}
              >
                Payment: {order.paymentStatus.toUpperCase()} ({order.paymentMethod.toUpperCase()})
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
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center transition shadow-lg ${
                          isDone
                            ? "bg-emerald-600 text-white shadow-emerald-500/20 ring-4 ring-emerald-500/10"
                            : "bg-slate-800 text-slate-500"
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
                            isCurrent ? "text-emerald-400" : isDone ? "text-white" : "text-slate-500"
                          }`}
                        >
                          {step.label}
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 max-w-[120px]">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-rose-400">
              <AlertCircle className="w-10 h-10 mx-auto mb-2" />
              <h3 className="font-bold">This order has been cancelled</h3>
            </div>
          )}

          {/* Runner Info if assigned */}
          {order.assignedRunner?.name && (
            <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-2xl p-4 flex items-center justify-between gap-4 mt-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600/30 flex items-center justify-center text-emerald-400">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Delivery Runner Assigned</h4>
                  <p className="text-xs text-emerald-300 font-semibold">{order.assignedRunner.name}</p>
                </div>
              </div>
              {order.assignedRunner.phone && (
                <a
                  href={`tel:${order.assignedRunner.phone}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition"
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
          <div className="md:col-span-2 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-emerald-400" />
              Order Items ({order.items?.length || 0})
            </h3>
            <div className="divide-y divide-slate-800/80">
              {order.items?.map((item, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-sm text-slate-100">{item.name}</h4>
                    <p className="text-xs text-slate-400">
                      {item.packageSize || item.unit} • ₹{item.price} × {item.quantity}
                    </p>
                  </div>
                  <span className="font-bold text-sm text-white">₹{item.totalItemAmount}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Subtotal</span>
                <span>₹{order.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Delivery Fee</span>
                <span>{order.deliveryFee === 0 ? "FREE" : `₹${order.deliveryFee}`}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Voucher Discount</span>
                  <span>-₹{order.discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-white pt-2 border-t border-slate-800">
                <span>Total Amount</span>
                <span className="text-emerald-400">₹{order.grandTotal}</span>
              </div>
            </div>
          </div>

          {/* Recipient & Outlet Info (1 col) */}
          <div className="space-y-6">
            {/* Delivery address */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-3">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                {order.fulfillmentType === "village_delivery" ? "Delivery Address" : "Pickup Location"}
              </h3>
              <div className="text-xs text-slate-300 space-y-1">
                <p className="font-bold text-white text-sm">{order.deliveryAddress?.recipientName}</p>
                <p className="text-slate-400">{order.deliveryAddress?.recipientPhone}</p>
                <p className="text-emerald-400 font-medium">Village: {order.deliveryAddress?.village}</p>
                {order.deliveryAddress?.landmark && (
                  <p className="text-slate-400">Landmark: {order.deliveryAddress.landmark}</p>
                )}
                {order.deliveryAddress?.fullAddress && (
                  <p className="text-slate-400">{order.deliveryAddress.fullAddress}</p>
                )}
                {order.deliveryAddress?.distanceKm > 0 && (
                  <p className="text-[11px] text-slate-500 pt-1">
                    Distance from dairy: ~{order.deliveryAddress.distanceKm} km
                  </p>
                )}
              </div>
            </div>

            {/* Outlet Contact */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-3">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Store className="w-4 h-4 text-emerald-400" />
                Fulfilled By Outlet
              </h3>
              <div className="text-xs text-slate-300 space-y-1">
                <p className="font-bold text-white text-sm">
                  {order.adminId?.shopName || "Milkify Dairy Outlet"}
                </p>
                <p className="text-slate-400">Manager: {order.adminId?.name}</p>
                <p className="text-slate-400">Village: {order.adminId?.village}</p>
                {order.adminId?.mobile && (
                  <p className="text-emerald-400 font-semibold pt-1">Phone: {order.adminId.mobile}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
