"use client";

import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "@/lib/store";
import api from "@/lib/api";
import { toast } from "@/lib/toast";
import {
  Loader2, ShieldCheck, Crown, CreditCard, CheckCircle2, Clock,
  AlertTriangle, Zap, Gift, Info, AlertCircle, Receipt,
  Lock, Printer, X, Tag, Check
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAdvertisementHistory } from "@/components/ui/AlertBanner";

const loadRazorpay = () => {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function SubscriptionPage() {
  const user = useAuthStore((state) => state.user);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState("monthly");
  const [adHistory, setAdHistory] = useState([]);
  const [activeReceipt, setActiveReceipt] = useState(null);
  const printRef = useRef(null);

  const fetchData = async () => {
    try {
      const res = await api.get("/master/subscription/my");
      setData(res.data);
      if (res.data?.subscription?.plan && res.data.subscription.plan !== "trial") {
        setSelectedPlan(res.data.subscription.plan);
      }
    } catch {
      toast.error("Failed to load subscription details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setAdHistory(getAdvertisementHistory());
  }, []);

  const sub = data?.subscription;
  const config = data?.config || {};
  const activePromos = data?.activePromos || [];

  // Dynamic Plans from Master Admin or Fallback
  const plans = (data?.plans && data.plans.length > 0)
    ? data.plans
    : [
      {
        planId: "monthly",
        name: "Monthly Plan",
        price: config.monthlyPrice || 499,
        durationDays: 30,
        billingCycle: "monthly",
        description: "Pay as you go. Standard features.",
        badge: "",
        features: ["Cancel anytime", "Standard Support", "Full client & farmer access", "Thermal printing & daily records"],
        isActive: true,
      },
      {
        planId: "quarterly",
        name: "Quarterly Plan",
        price: config.quarterlyPrice || 1299,
        durationDays: 90,
        billingCycle: "quarterly",
        description: "Popular & cost-effective billing buffer.",
        badge: "Save 13%",
        features: ["90 days uninterrupted access", "Full milk ledger & thermal printing", "Priority phone & email support", "Automated backup sync"],
        isActive: true,
      },
      {
        planId: "yearly",
        name: "Annual Plan",
        price: config.yearlyPrice || 4499,
        durationDays: 365,
        billingCycle: "yearly",
        description: "Ultimate peace of mind with maximum value.",
        badge: "Best Value",
        features: ["365 days full enterprise access", "Zero price hike guarantee", "VIP cloud bandwidth & storage", "Dedicated account assistance"],
        isActive: true,
      },
    ];

  const currentSelectedPlanObj = plans.find((p) => p.planId === selectedPlan) || plans[0];
  const basePrice = currentSelectedPlanObj?.price || 0;
  const finalPrice = appliedPromo ? appliedPromo.finalPrice : basePrice;

  // Check if the selected plan is currently active
  const isCurrentPlanActive = Boolean(
    sub &&
    sub.status === "active" &&
    sub.plan === selectedPlan &&
    sub.daysRemaining > 0
  );

  const handleApplyPromo = async (codeToApply) => {
    const code = (typeof codeToApply === "string" ? codeToApply : promoCode).trim();
    if (!code) return toast.error("Enter a promo code");
    setProcessing(true);
    try {
      const res = await api.post("/master/subscription/validate-promo", { code, plan: selectedPlan });
      setAppliedPromo(res.data);
      setPromoCode(code.toUpperCase());
      toast.success(`Promo code ${code.toUpperCase()} applied! You save ₹${res.data.discountAmount}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid or inapplicable promo code");
      setAppliedPromo(null);
    } finally {
      setProcessing(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCode("");
    toast.info("Promo code removed.");
  };

  const handlePayment = async () => {
    if (isCurrentPlanActive) {
      return toast.warning("You are already actively subscribed to this plan! Choose a different tier to upgrade.");
    }

    const res = await loadRazorpay();
    if (!res) return toast.error("Razorpay SDK failed to load");

    setProcessing(true);
    try {
      const orderRes = await api.post("/master/subscription/create-order", {
        plan: selectedPlan,
        promoCode: appliedPromo ? appliedPromo.promo.code : null,
      });

      const { order, keyId, customer } = orderRes.data;

      const formatContact = (mobile) => {
        let digits = String(mobile || "").replace(/\D/g, "");
        if (digits.length >= 10) {
          digits = digits.slice(-10);
        }
        if (/^[6-9]\d{9}$/.test(digits)) return digits;
        return "9876543210";
      };

      const formatEmail = (email) => {
        const clean = String(email || "").trim();
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean) ? clean : "billing@milkify.app";
      };

      const options = {
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Milkify SaaS",
        description: `Subscription Renewal - ${currentSelectedPlanObj?.name || selectedPlan.toUpperCase()}`,
        order_id: order.id,
        handler: async function (response) {
          try {
            setProcessing(true);
            const verifyRes = await api.post("/master/subscription/verify-payment", {
              ...response,
              plan: selectedPlan,
            });
            toast.success(verifyRes.data?.message || "Subscription activated successfully!");
            await fetchData();

            // Open Receipt Modal immediately for download/print
            if (verifyRes.data?.data?.receipt) {
              setActiveReceipt(verifyRes.data.data.receipt);
            }
          } catch (verifyErr) {
            toast.error(verifyErr.response?.data?.message || "Payment verification failed");
          } finally {
            setProcessing(false);
          }
        },
        prefill: {
          name: customer?.name || user?.name || "Admin",
          email: formatEmail(customer?.email || user?.email),
          contact: formatContact(customer?.contact || user?.mobile),
        },
        readonly: {
          contact: true,
          email: true,
          name: true,
        },
        modal: {
          confirm_close: true,
          ondismiss: function () {
            setProcessing(false);
            toast.info("Payment window closed.");
          },
        },
        theme: {
          color: "#4f46e5",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (resp) {
        toast.error(resp?.error?.description || "Payment failed. Please try again.");
        setProcessing(false);
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to initiate payment");
      setProcessing(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const getAdTypeIcon = (type) => {
    const icons = { info: Info, success: CheckCircle2, warning: AlertTriangle, promo: Gift, update: Zap };
    return icons[type] || Info;
  };

  const getAdTypeBadgeColor = (type) => {
    const colors = {
      info: "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30",
      success: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30",
      warning: "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30",
      promo: "bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30",
      update: "bg-cyan-50 text-cyan-600 border-cyan-100 dark:bg-cyan-950/20 dark:text-cyan-400 dark:border-cyan-900/30",
    };
    return colors[type] || "bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700/60";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[350px] space-y-3">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
        <p className="text-slate-400 text-xs font-semibold tracking-wide animate-pulse">Loading Subscription Desk...</p>
      </div>
    );
  }

  // Render Premium Status Banner
  const renderStatus = () => {
    if (!sub) return null;
    const isTrial = sub.status === "trial";
    const isActive = sub.status === "active";
    const isExpired = sub.status === "expired" || sub.daysRemaining <= 0;
    const endDate = isTrial ? sub.trialEndDate : sub.endDate;
    const daysLeft = sub.daysRemaining;

    let bannerStyle = "border-rose-200 dark:border-rose-900/40 bg-gradient-to-r from-rose-50/70 via-red-50/50 to-pink-50/40 dark:from-rose-950/20 dark:to-red-950/10 text-rose-800 dark:text-rose-300";
    let iconBg = "bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400";
    let statusLabel = "Subscription Expired";

    if (isActive) {
      bannerStyle = "border-emerald-200 dark:border-emerald-900/40 bg-gradient-to-r from-emerald-50/80 via-teal-50/60 to-cyan-50/40 dark:from-emerald-950/20 dark:to-teal-950/10 text-emerald-800 dark:text-emerald-300";
      iconBg = "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400";
      statusLabel = "Active Premium SaaS Membership";
    } else if (isTrial) {
      bannerStyle = "border-amber-200 dark:border-amber-900/40 bg-gradient-to-r from-amber-50/80 via-yellow-50/60 to-orange-50/40 dark:from-amber-950/20 dark:to-yellow-950/10 text-amber-800 dark:text-amber-300";
      iconBg = "bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400";
      statusLabel = "Complimentary Free Trial";
    }

    return (
      <Card className={`border shadow-sm overflow-hidden bg-white dark:bg-slate-800/60 ${bannerStyle}`}>
        <div className="p-5 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full">
            <div className={`p-3.5 rounded-2xl shrink-0 ${iconBg} shadow-sm`}>
              {isActive ? <ShieldCheck className="h-7 w-7" /> : isTrial ? <Clock className="h-7 w-7" /> : <AlertCircle className="h-7 w-7" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-wide uppercase leading-tight">{statusLabel}</h2>
                <span className="bg-slate-900/10 dark:bg-white/10 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold capitalize tracking-wider">
                  Plan: {sub.plan}
                </span>
                {isActive && (
                  <span className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1">
                    <Check className="h-3 w-3" /> Locked & Active
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold opacity-90 mt-1">
                {daysLeft > 0 ? (
                  <>
                    Your subscription has <strong className="font-extrabold underline">{daysLeft} days remaining</strong> (valid until{" "}
                    {new Date(endDate).toLocaleDateString(undefined, { dateStyle: "long" })}).
                  </>
                ) : (
                  <span className="font-bold text-rose-600 dark:text-rose-400">
                    Your subscription license has expired. Choose an upgrade plan below to restore full dairy operations.
                  </span>
                )}
              </p>
            </div>
          </div>
          {isExpired && (
            <div className="shrink-0 bg-red-600 text-white text-xs font-black px-4 py-2.5 rounded-xl tracking-wider animate-pulse shadow-md shadow-red-500/20">
              RENEWAL REQUIRED
            </div>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Printable Receipt CSS */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-subscription-receipt,
          #printable-subscription-receipt * {
            visibility: visible;
          }
          #printable-subscription-receipt {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            padding: 24px;
            background: white !important;
            color: black !important;
            z-index: 999999;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5 tracking-tight">
            <Crown className="h-8 w-8 text-amber-500" /> Milkify Premium Desk
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your SaaS membership tier, redeem promo discount vouchers, and download verified tax payment receipts.
          </p>
        </div>
        {sub?.paymentHistory && sub.paymentHistory.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveReceipt(sub.paymentHistory[sub.paymentHistory.length - 1])}
            className="rounded-xl border-slate-200 dark:border-slate-700 font-bold gap-2 self-start sm:self-auto text-xs"
          >
            <Receipt className="h-4 w-4 text-indigo-500" />
            View Latest Payment Receipt
          </Button>
        )}
      </div>

      {renderStatus()}

      {/* Interactive Offer Scroller (Promo Vouchers) */}
      {activePromos.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Gift className="h-4 w-4 text-indigo-500 animate-bounce" /> Exclusive Offer Coupons
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Click any voucher to apply</span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
            {activePromos.map((promo) => {
              const isApplied = appliedPromo && appliedPromo.promo.code === promo.code;
              return (
                <div
                  key={promo._id}
                  onClick={() => isApplied ? handleRemovePromo() : handleApplyPromo(promo.code)}
                  className={`shrink-0 cursor-pointer p-3.5 rounded-2xl border transition-all duration-200 min-w-[240px] max-w-[280px] select-none flex items-center justify-between gap-3 ${isApplied
                      ? "bg-emerald-500 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/30 scale-[1.02]"
                      : "bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700/70 hover:border-indigo-500 hover:shadow-sm"
                    }`}
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider ${isApplied ? "bg-white/20 text-white" : "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400"
                        }`}>
                        {promo.discountType === "percentage" ? `${promo.discountValue}% OFF` : `₹${promo.discountValue} OFF`}
                      </span>
                      {isApplied && (
                        <span className="text-[9px] font-extrabold uppercase bg-white text-emerald-700 px-1.5 py-0.2 rounded">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="font-black text-sm tracking-wide uppercase truncate pt-1">{promo.code}</p>
                    <p className={`text-[11px] truncate font-medium ${isApplied ? "text-white/80" : "text-slate-400"}`}>
                      {promo.description || "Limited time subscription voucher"}
                    </p>
                  </div>
                  <div className={`p-2 rounded-xl shrink-0 ${isApplied ? "bg-white text-emerald-700" : "bg-slate-100 dark:bg-slate-700 text-slate-500"}`}>
                    {isApplied ? <Check className="h-4 w-4" /> : <Tag className="h-4 w-4" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pricing and Checkout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Plans deck */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Available SaaS Subscription Tiers
            </h3>
            <span className="text-xs text-slate-400 font-semibold">
              Select tier to review renewal
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((p) => {
              const isSelected = selectedPlan === p.planId;
              const isPlanActive = Boolean(
                sub &&
                sub.status === "active" &&
                sub.plan === p.planId &&
                sub.daysRemaining > 0
              );

              return (
                <div
                  key={p.planId}
                  onClick={() => {
                    setSelectedPlan(p.planId);
                    setAppliedPromo(null);
                  }}
                  className={`group relative overflow-hidden rounded-2xl cursor-pointer p-5 border transition-all duration-300 flex flex-col justify-between ${isPlanActive
                      ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-400 ring-2 ring-emerald-500/20 shadow-md"
                      : isSelected
                        ? "bg-white dark:bg-slate-800 border-indigo-500 ring-2 ring-indigo-500/20 shadow-md"
                        : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60 hover:border-indigo-500/50 hover:shadow-sm"
                    }`}
                >
                  {/* Decorative top accent line */}
                  <div className={`absolute top-0 left-0 right-0 h-1.5 ${isPlanActive
                      ? "bg-gradient-to-r from-emerald-400 to-teal-500"
                      : p.badge
                        ? "bg-gradient-to-r from-violet-500 via-indigo-500 to-purple-600"
                        : "bg-gradient-to-r from-blue-500 to-indigo-500"
                    }`} />

                  <div>
                    <div className="flex items-center justify-between mb-3.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isPlanActive
                          ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600"
                          : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500"
                        }`}>
                        {isPlanActive ? <Lock className="w-4 h-4 text-emerald-600" /> : <Zap className="w-4 h-4" />}
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {isPlanActive && (
                          <span className="bg-emerald-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider flex items-center gap-1 shadow-xs">
                            <Lock className="h-2.5 w-2.5" /> Subscribed
                          </span>
                        )}
                        {p.badge && !isPlanActive && (
                          <span className="bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider border border-indigo-200 dark:border-indigo-900/30">
                            {p.badge}
                          </span>
                        )}
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      {p.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                      {p.description || `Valid for ${p.durationDays} days`}
                    </p>

                    <div className="flex items-baseline gap-1 mt-4 mb-4">
                      <span className="text-2xl font-black text-slate-900 dark:text-white">₹{p.price}</span>
                      <span className="text-[10px] text-slate-400 font-bold">/ {p.durationDays} days</span>
                    </div>

                    {isPlanActive && (
                      <div className="mb-3 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1.5">
                        <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />
                        Active until {new Date(sub.endDate).toLocaleDateString()}
                      </div>
                    )}

                    <ul className="space-y-2 border-t border-slate-100 dark:border-slate-700/40 pt-4">
                      {(p.features && p.features.length > 0 ? p.features : [
                        "Cancel anytime",
                        "Standard support",
                        "Full tenant features"
                      ]).map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-[11px] font-semibold text-slate-600 dark:text-slate-350">
                          <CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isPlanActive ? "text-emerald-500" : "text-blue-500"}`} />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 mt-2">
                    {isPlanActive ? (
                      <div className="w-full py-1.5 text-center text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-lg">
                        Currently In Use
                      </div>
                    ) : (
                      <div className={`w-full py-1.5 text-center text-[11px] font-bold rounded-lg transition-colors ${isSelected
                          ? "bg-indigo-600 text-white"
                          : "text-slate-500 bg-slate-100 dark:bg-slate-700/50 group-hover:bg-indigo-50 group-hover:text-indigo-600"
                        }`}>
                        {isSelected ? "Selected" : "Select Tier"}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Checkout column */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Checkout Summary
          </h3>

          <Card className="shadow-lg border-none bg-slate-900 text-white relative overflow-hidden rounded-2xl">
            <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none select-none">
              <CreditCard className="w-44 h-44" />
            </div>

            <CardContent className="p-5 sm:p-6 space-y-6 relative z-10">
              {/* Promo Code Input or Active Chip */}
              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-2">
                  Discount Voucher
                </label>

                {appliedPromo ? (
                  <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1.5 rounded-lg bg-emerald-500 text-white shrink-0">
                        <Tag className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-emerald-400 uppercase tracking-wider truncate">
                          {appliedPromo.promo.code}
                        </p>
                        <p className="text-[10px] text-emerald-300 font-semibold">
                          Discount Applied: -₹{appliedPromo.discountAmount}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleRemovePromo}
                      type="button"
                      title="Remove voucher"
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="ENTER VOUCHER"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      className="flex-1 h-10 px-3.5 bg-white/10 border border-white/15 rounded-xl text-xs font-bold placeholder-slate-400 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase tracking-wider transition-all"
                    />
                    <Button
                      onClick={() => handleApplyPromo()}
                      disabled={processing || !promoCode}
                      variant="secondary"
                      className="h-10 rounded-xl px-4 text-xs font-bold bg-white text-slate-900 hover:bg-slate-200 shrink-0"
                    >
                      {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                    </Button>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 pt-4 border-t border-white/10">
                <div className="flex justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <span>Selected Tier</span>
                  <span className="text-white font-bold">{currentSelectedPlanObj?.name || selectedPlan}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <span>Duration</span>
                  <span className="text-white font-bold">{currentSelectedPlanObj?.durationDays || 30} Days</span>
                </div>
                <div className="flex justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <span>Base Price</span>
                  <span>₹{basePrice}</span>
                </div>
                {appliedPromo && (
                  <div className="flex justify-between text-emerald-400 text-xs font-bold uppercase tracking-wider">
                    <span>Voucher Savings</span>
                    <span>-₹{appliedPromo.discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-2xl pt-3 border-t border-white/10 leading-none">
                  <span className="text-sm text-slate-300 font-bold self-center">Grand Total</span>
                  <span className="text-emerald-400">₹{finalPrice}</span>
                </div>
              </div>

              {/* Checkout / Lock Action Button */}
              <div className="pt-2">
                {isCurrentPlanActive ? (
                  <div className="space-y-2">
                    <Button
                      disabled
                      className="w-full h-11.5 text-xs font-black bg-slate-800 text-slate-400 border border-slate-700/60 rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Lock className="h-4 w-4 text-amber-500" />
                      Plan Already Active & Locked
                    </Button>
                    <p className="text-[11px] text-amber-400/90 text-center font-medium leading-normal">
                      You are already actively subscribed to this plan. To change or extend, please select another tier above.
                    </p>
                  </div>
                ) : (
                  <Button
                    onClick={handlePayment}
                    disabled={processing}
                    className="w-full h-11.5 text-sm font-black bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl shadow-md transition-all active:scale-98 border-none flex items-center justify-center gap-2"
                  >
                    {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4.5 w-4.5" />}
                    Subscribe via Secure Gateway
                  </Button>
                )}
              </div>

              <p className="text-[10px] text-center text-slate-400 font-bold leading-normal">
                Secured & encrypted via Razorpay. <br />UPI, QR Code, Credit/Debit Cards & NetBanking supported.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment Invoices & Verified History Hub */}
      <Card className="shadow-sm border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-slate-800/80 rounded-2xl overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Receipt className="h-5 w-5 text-indigo-500" /> Subscription Payment Slips & Invoices
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review and print official server-verified payment receipts for your audit and accounting records.
            </p>
          </div>
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg self-start sm:self-auto">
            {sub?.paymentHistory?.length || 0} Total Records
          </span>
        </div>
        <CardContent className="p-0">
          {sub?.paymentHistory && sub.paymentHistory.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {sub.paymentHistory.slice().reverse().map((item, idx) => {
                const paidDate = item.paidAt ? new Date(item.paidAt) : new Date();
                return (
                  <div key={item.paymentId || idx} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-900/30 transition-colors">
                    <div className="flex items-start gap-3.5">
                      <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-extrabold text-slate-900 dark:text-white capitalize">
                            {item.planName || item.plan || "Monthly"} Plan
                          </span>
                          <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider border border-emerald-200 dark:border-emerald-900/30">
                            Verified Paid
                          </span>
                          {item.durationDays && (
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                              {item.durationDays} Days
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Paid on {paidDate.toLocaleDateString(undefined, { dateStyle: "long" })} at {paidDate.toLocaleTimeString(undefined, { timeStyle: "short" })}
                        </p>
                        <p className="text-[11px] font-mono text-slate-400">
                          Payment ID: <span className="font-semibold text-slate-600 dark:text-slate-300">{item.paymentId}</span>
                          {item.instrument && <span className="ml-2 font-sans font-medium text-slate-500">• {item.instrument}</span>}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">
                      <div className="text-left md:text-right">
                        <div className="text-lg font-black text-slate-900 dark:text-white">
                          ₹{item.amount}
                        </div>
                        {item.discountAmt > 0 && (
                          <p className="text-[10px] text-emerald-600 font-bold">Voucher Saved ₹{item.discountAmt}</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActiveReceipt(item)}
                        className="rounded-xl font-bold text-xs gap-1.5 border-slate-200 dark:border-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300"
                      >
                        <Printer className="h-3.5 w-3.5 text-indigo-500" />
                        Download Slip
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center space-y-2">
              <Receipt className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">No payment records yet</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                When you activate a SaaS subscription plan via Razorpay, official tax slips and transaction receipts will appear here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dismissed Ad list (Alert history drawer) */}
      {adHistory && adHistory.length > 0 && (
        <Card className="shadow-sm border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-slate-800/80 rounded-2xl overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" /> Dismissed Notifications Hub
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Archived view of all alert banners and promo notifications you have dismissed.
              </p>
            </div>
          </div>
          <CardContent className="p-5 sm:p-6">
            <div className="space-y-3">
              {adHistory.map((ad) => {
                const TypeIcon = getAdTypeIcon(ad.type);
                const dismissedDate = new Date(ad.dismissedAt);
                return (
                  <div
                    key={ad._id}
                    className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-700/60 bg-slate-50/40 dark:bg-slate-900/20 hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
                  >
                    <div className={`p-2 rounded-xl shrink-0 border ${getAdTypeBadgeColor(ad.type)}`}>
                      <TypeIcon className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{ad.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{ad.message}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-semibold">
                        Dismissed on {dismissedDate.toLocaleDateString()} at {dismissedDate.toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${getAdTypeBadgeColor(ad.type)}`}>
                        {ad.type}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscription Payment Slip Modal */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col">
            {/* Modal Header Bar */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between no-print bg-slate-50/80 dark:bg-slate-900/80">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                  Payment Slip Preview
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handlePrintReceipt}
                  size="sm"
                  className="rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print / Save PDF
                </Button>
                <button
                  onClick={() => setActiveReceipt(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Printable Receipt Body */}
            <div id="printable-subscription-receipt" ref={printRef} className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-900 dark:text-slate-100 font-sans">
              {/* Receipt Header */}
              <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-700 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <Crown className="h-6 w-6 text-amber-500" />
                    <span className="font-black text-xl tracking-tight text-slate-900 dark:text-white">MILKIFY SAAS</span>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
                    Dairy Management Enterprise Platform
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">Tax Invoice & Proof of Payment</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 font-black text-xs rounded-full uppercase tracking-wider border border-emerald-300 dark:border-emerald-800">
                    PAID / VERIFIED
                  </span>
                  <p className="text-[10px] font-mono text-slate-400 mt-1.5">
                    Receipt #: RCPT-{String(activeReceipt.paymentId || Date.now()).slice(-8).toUpperCase()}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Date: {new Date(activeReceipt.paidAt || Date.now()).toLocaleDateString(undefined, { dateStyle: "medium" })}
                  </p>
                </div>
              </div>

              {/* Bill To & Gateway Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Billed To (Tenant)</p>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{user?.shopName || "Milkify Dairy Agency"}</p>
                  <p className="text-slate-500 font-medium">Attn: {user?.name || "Admin"}</p>
                  <p className="text-slate-500 font-medium">{user?.email || "billing@milkify.app"}</p>
                  {user?.mobile && <p className="text-slate-500 font-medium">+91 {user.mobile}</p>}
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Gateway Details</p>
                  <p className="font-mono text-slate-700 dark:text-slate-300 text-[11px]">
                    Pay ID: <span className="font-bold">{activeReceipt.paymentId}</span>
                  </p>
                  <p className="font-mono text-slate-500 text-[10px] mt-0.5">
                    Order ID: {activeReceipt.orderId || "Direct Order"}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 font-medium mt-1">
                    Channel: {activeReceipt.instrument || activeReceipt.method?.toUpperCase() || "Online Payment"}
                  </p>
                </div>
              </div>

              {/* Subscription Breakdown Table */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2.5 px-4 text-left">Description</th>
                      <th className="py-2.5 px-4 text-center">Cycle / Duration</th>
                      <th className="py-2.5 px-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    <tr>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900 dark:text-white capitalize">
                          {activeReceipt.planName || activeReceipt.plan || "Monthly"} Subscription Plan
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Full cloud dairy calculation, farmer accounts, and thermal printing license
                        </p>
                      </td>
                      <td className="py-3 px-4 text-center font-medium text-slate-600 dark:text-slate-300">
                        {activeReceipt.durationDays ? `${activeReceipt.durationDays} Days` : "1 Cycle"}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                        ₹{activeReceipt.amount + (activeReceipt.discountAmt || 0)}
                      </td>
                    </tr>
                    {activeReceipt.discountAmt > 0 && (
                      <tr className="bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400">
                        <td className="py-2 px-4 font-bold">
                          Promo Voucher Discount ({activeReceipt.promoCode || "COUPON"})
                        </td>
                        <td className="py-2 px-4 text-center font-semibold text-[11px]">Applied</td>
                        <td className="py-2 px-4 text-right font-black">-₹{activeReceipt.discountAmt}</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
                    <tr>
                      <td colSpan={2} className="py-3 px-4 font-extrabold text-sm text-slate-900 dark:text-white text-right">
                        Total Amount Paid:
                      </td>
                      <td className="py-3 px-4 font-black text-base text-emerald-600 dark:text-emerald-400 text-right">
                        ₹{activeReceipt.amount}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Footer info & Digital Stamp */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400">
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-600 dark:text-slate-300">Milkify SaaS Cloud Infrastructure</p>
                  <p>Computer-generated official receipt. No physical signature required.</p>
                  <p>Support: support@milkify.app | https://milkify.app</p>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Cryptographically Authenticated</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
