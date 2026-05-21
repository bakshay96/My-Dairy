"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store";
import api from "@/lib/api";
import { toast } from "@/lib/toast";
import { 
  Loader2, ShieldCheck, Crown, CreditCard, CheckCircle2, Clock, 
  AlertTriangle, Zap, Gift, Info, Sparkles, AlertCircle 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAdvertisementHistory } from "@/components/ui/AlertBanner";

const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
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

  const handleApplyPromo = async () => {
    if (!promoCode) return toast.error("Enter a promo code");
    setProcessing(true);
    try {
      const res = await api.post("/master/subscription/validate-promo", { code: promoCode, plan: selectedPlan });
      setAppliedPromo(res.data);
      toast.success("Promo code applied successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid promo code");
      setAppliedPromo(null);
    } finally {
      setProcessing(false);
    }
  };

  const handlePayment = async () => {
    const res = await loadRazorpay();
    if (!res) return toast.error("Razorpay SDK failed to load");

    setProcessing(true);
    try {
      const orderRes = await api.post("/master/subscription/create-order", {
        plan: selectedPlan,
        promoCode: appliedPromo ? appliedPromo.promo.code : null,
      });

      const { order, keyId } = orderRes.data;

      const options = {
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Milkify SaaS",
        description: `Subscription - ${selectedPlan.toUpperCase()}`,
        order_id: order.id,
        handler: async function (response) {
          try {
            await api.post("/master/subscription/verify-payment", {
              ...response,
              plan: selectedPlan,
            });
            toast.success("Subscription activated successfully!");
            fetchData();
          } catch {
            toast.error("Payment verification failed");
          }
        },
        prefill: {
          name: user?.name || "Admin",
          email: user?.email || "admin@milkify.app",
          contact: user?.mobile || "9999999999",
        },
        theme: {
          color: "#6366f1",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function () {
        toast.error("Payment failed. Please try again.");
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to initiate payment");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[350px] space-y-3">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
        <p className="text-slate-400 text-xs font-semibold tracking-wide animate-pulse">Loading Subscription Desk...</p>
      </div>
    );
  }

  const getAdTypeIcon = (type) => {
    const icons = {
      info: Info,
      success: CheckCircle2,
      warning: AlertTriangle,
      promo: Gift,
      update: Zap,
    };
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

  const sub = data?.subscription;
  const config = data?.config || {};
  const activePromos = data?.activePromos || [];

  const basePrice = config[`${selectedPlan}Price`] || 0;
  const finalPrice = appliedPromo ? appliedPromo.finalPrice : basePrice;

  // Calculate pricing equivalent details
  const monthlyPrice = config.monthlyPrice || 0;
  const quarterlyPrice = config.quarterlyPrice || 0;
  const yearlyPrice = config.yearlyPrice || 0;

  const quarterlyEquivalent = monthlyPrice * 3;
  const quarterlySavings = quarterlyEquivalent > 0
    ? Math.round(((quarterlyEquivalent - quarterlyPrice) / quarterlyEquivalent) * 100)
    : 0;

  const yearlyEquivalent = monthlyPrice * 12;
  const yearlySavings = yearlyEquivalent > 0
    ? Math.round(((yearlyEquivalent - yearlyPrice) / yearlyEquivalent) * 100)
    : 0;

  // Render Premium Status Banner
  const renderStatus = () => {
    if (!sub) return null;
    const isTrial = sub.status === "trial";
    const isActive = sub.status === "active";
    const isExpired = sub.status === "expired" || sub.daysRemaining <= 0;
    const endDate = isTrial ? sub.trialEndDate : sub.endDate;
    const daysLeft = sub.daysRemaining;

    let bannerStyle = "border-rose-200 dark:border-rose-900/40 bg-gradient-to-r from-rose-50/60 to-red-50/40 dark:from-rose-950/10 dark:to-red-950/5 text-rose-800 dark:text-rose-300";
    let iconBg = "bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400";
    let statusLabel = "Expired";

    if (isActive) {
      bannerStyle = "border-emerald-200 dark:border-emerald-900/40 bg-gradient-to-r from-emerald-50/60 to-teal-50/40 dark:from-emerald-950/10 dark:to-teal-950/5 text-emerald-800 dark:text-emerald-300";
      iconBg = "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400";
      statusLabel = "Active Premium";
    } else if (isTrial) {
      bannerStyle = "border-amber-200 dark:border-amber-900/40 bg-gradient-to-r from-amber-50/60 to-yellow-50/40 dark:from-amber-950/10 dark:to-yellow-950/5 text-amber-800 dark:text-amber-300";
      iconBg = "bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400";
      statusLabel = `Free Trial (Active)`;
    }

    return (
      <Card className={`border shadow-sm overflow-hidden bg-white dark:bg-slate-800/40 ${bannerStyle}`}>
        <div className="p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full">
            <div className={`p-3 rounded-2xl shrink-0 ${iconBg}`}>
              {isActive ? <ShieldCheck className="h-7 w-7" /> : isTrial ? <Clock className="h-7 w-7" /> : <AlertCircle className="h-7 w-7" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-wide uppercase leading-tight">{statusLabel}</h2>
                <span className="bg-slate-900/10 dark:bg-white/10 px-2 py-0.5 rounded text-[10px] font-bold capitalize">
                  Plan: {sub.plan}
                </span>
              </div>
              <p className="text-xs font-semibold opacity-90 mt-1">
                {daysLeft > 0 ? (
                  <>
                    Your subscription has <strong className="font-extrabold">{daysLeft} days remaining</strong> (valid until{" "}
                    {new Date(endDate).toLocaleDateString(undefined, { dateStyle: "long" })}).
                  </>
                ) : (
                  <span className="font-bold">Your subscription has expired. Please choose a plan below to renew.</span>
                )}
              </p>
            </div>
          </div>
          {isExpired && (
            <div className="shrink-0 bg-red-500 text-white text-xs font-black px-4 py-2.5 rounded-xl tracking-wider animate-pulse shadow-sm shadow-red-500/20">
              RENEWAL REQUIRED
            </div>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5 tracking-tight">
          <Crown className="h-8 w-8 text-amber-500" /> Milkify Premium Desk
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Monitor your active membership, enter promo vouchers, and upgrade to unlock advanced dairy calculations.
        </p>
      </div>

      {renderStatus()}

      {/* Promos Alert Board */}
      {activePromos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {activePromos.map((p) => (
            <div 
              key={p._id} 
              className="group relative overflow-hidden bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl p-4.5 flex items-center justify-between shadow-md hover:shadow-lg transition-all duration-300"
            >
              <div className="relative z-10 space-y-1">
                <span className="bg-white/20 text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-widest leading-none">
                  Voucher Offer
                </span>
                <h3 className="font-black text-lg tracking-tight pt-1">{p.code}</h3>
                <p className="text-xs text-white/80 font-medium">
                  {p.description || `Save ${p.discountType === "percentage" ? p.discountValue + "%" : "₹" + p.discountValue} instantly!`}
                </p>
              </div>
              <Button 
                size="sm" 
                variant="secondary" 
                className="relative z-10 font-bold bg-white text-indigo-700 hover:bg-slate-100 rounded-xl px-4 py-2 shrink-0 transition-transform active:scale-95 shadow-sm" 
                onClick={() => { setPromoCode(p.code); setAppliedPromo(null); }}
              >
                Apply Voucher
              </Button>
              {/* Backlight circle */}
              <div className="absolute -right-8 -bottom-8 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none group-hover:scale-125 transition-transform" />
            </div>
          ))}
        </div>
      )}

      {/* Pricing and checkout area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Plans deck */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Available Pricing Plans
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Monthly Plan Card */}
            <div 
              onClick={() => { setSelectedPlan("monthly"); setAppliedPromo(null); }}
              className={`group relative overflow-hidden rounded-2xl cursor-pointer p-5 border bg-white dark:bg-slate-800/80 transition-all duration-300 ${
                selectedPlan === "monthly"
                  ? "border-indigo-500 ring-2 ring-indigo-500/20 shadow-md dark:border-indigo-500"
                  : "border-slate-200 dark:border-slate-700/60 hover:border-indigo-500/50 hover:shadow-sm"
              }`}
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
              <div className="flex items-center justify-between mb-3.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                </div>
                {sub?.plan === "monthly" && sub?.status === "active" && (
                  <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider shrink-0 border border-emerald-200 dark:border-emerald-900/30">
                    Active
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Monthly Plan</h4>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Billed monthly</p>
              
              <div className="flex items-baseline gap-1 mt-4 mb-4">
                <span className="text-2xl font-black text-slate-900 dark:text-white">₹{monthlyPrice}</span>
                <span className="text-[10px] text-slate-400 font-bold">/ month</span>
              </div>

              <ul className="space-y-2 border-t border-slate-50 dark:border-slate-700/40 pt-4.5">
                <li className="flex items-center gap-2 text-[11px] font-semibold text-slate-600 dark:text-slate-350">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  Cancel anytime
                </li>
                <li className="flex items-center gap-2 text-[11px] font-semibold text-slate-600 dark:text-slate-350">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  Standard Support
                </li>
                <li className="flex items-center gap-2 text-[11px] font-semibold text-slate-600 dark:text-slate-350">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  Full client access
                </li>
              </ul>
            </div>

            {/* Quarterly Plan Card */}
            <div 
              onClick={() => { setSelectedPlan("quarterly"); setAppliedPromo(null); }}
              className={`group relative overflow-hidden rounded-2xl cursor-pointer p-5 border bg-white dark:bg-slate-800/80 transition-all duration-300 ${
                selectedPlan === "quarterly"
                  ? "border-amber-500 ring-2 ring-amber-500/20 shadow-md dark:border-amber-500"
                  : "border-slate-200 dark:border-slate-700/60 hover:border-amber-500/50 hover:shadow-sm"
              }`}
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
              <div className="flex items-center justify-between mb-3.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {sub?.plan === "quarterly" && sub?.status === "active" && (
                    <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider border border-emerald-200 dark:border-emerald-900/30">
                      Active
                    </span>
                  )}
                  {quarterlySavings > 0 && (
                    <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider border border-amber-200 dark:border-amber-900/30">
                      Save {quarterlySavings}%
                    </span>
                  )}
                </div>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Quarterly Plan</h4>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Billed every 3 months</p>
              
              <div className="flex items-baseline gap-1 mt-4 mb-4">
                <span className="text-2xl font-black text-slate-900 dark:text-white">₹{quarterlyPrice}</span>
                <span className="text-[10px] text-slate-400 font-bold">/ 3 mo</span>
              </div>

              <ul className="space-y-2 border-t border-slate-50 dark:border-slate-700/40 pt-4.5">
                <li className="flex items-center gap-2 text-[11px] font-semibold text-slate-600 dark:text-slate-350">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  Extended billing cycle
                </li>
                <li className="flex items-center gap-2 text-[11px] font-semibold text-slate-600 dark:text-slate-350">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  Premium support desk
                </li>
                <li className="flex items-center gap-2 text-[11px] font-semibold text-slate-600 dark:text-slate-350">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  Advanced analytics
                </li>
              </ul>
            </div>

            {/* Yearly Plan Card */}
            <div 
              onClick={() => { setSelectedPlan("yearly"); setAppliedPromo(null); }}
              className={`group relative overflow-hidden rounded-2xl cursor-pointer p-5 border bg-white dark:bg-slate-800/80 transition-all duration-300 ${
                selectedPlan === "yearly"
                  ? "border-violet-500 ring-2 ring-violet-500/20 shadow-md dark:border-violet-500"
                  : "border-slate-200 dark:border-slate-700/60 hover:border-violet-500/50 hover:shadow-sm"
              }`}
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-indigo-500 to-purple-600" />
              <div className="flex items-center justify-between mb-3.5">
                <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center shrink-0">
                  <Crown className="w-4 h-4 text-violet-500 dark:text-violet-400" />
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {sub?.plan === "yearly" && sub?.status === "active" && (
                    <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider border border-emerald-200 dark:border-emerald-900/30">
                      Active
                    </span>
                  )}
                  {yearlySavings > 0 && (
                    <span className="bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider border border-violet-200 dark:border-violet-900/30 animate-pulse-soft">
                      Save {yearlySavings}%
                    </span>
                  )}
                </div>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Annual Plan</h4>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Billed annually</p>
              
              <div className="flex items-baseline gap-1 mt-4 mb-4">
                <span className="text-2xl font-black text-slate-900 dark:text-white">₹{yearlyPrice}</span>
                <span className="text-[10px] text-slate-400 font-bold">/ year</span>
              </div>

              <ul className="space-y-2 border-t border-slate-50 dark:border-slate-700/40 pt-4.5">
                <li className="flex items-center gap-2 text-[11px] font-semibold text-slate-600 dark:text-slate-350">
                  <CheckCircle2 className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                  Maximum cost savings
                </li>
                <li className="flex items-center gap-2 text-[11px] font-semibold text-slate-600 dark:text-slate-350">
                  <CheckCircle2 className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                  VIP 24/7 dedicated support
                </li>
                <li className="flex items-center gap-2 text-[11px] font-semibold text-slate-600 dark:text-slate-350">
                  <CheckCircle2 className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                  All future modules free
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Checkout column */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Checkout Summary
          </h3>

          <Card className="shadow-lg border-none bg-slate-900 text-white relative overflow-hidden rounded-2xl">
            {/* Ambient background credit card */}
            <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none select-none">
              <CreditCard className="w-44 h-44" />
            </div>

            <CardContent className="p-5 sm:p-6 space-y-6 relative z-10">
              <div className="flex items-center gap-2.5">
                <input
                  type="text"
                  placeholder="PROMO CODE"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  className="flex-1 h-10 px-3.5 bg-white/10 border border-white/15 rounded-xl text-sm font-bold placeholder-slate-400 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase tracking-wide transition-all"
                />
                <Button 
                  onClick={handleApplyPromo} 
                  disabled={processing || !promoCode} 
                  variant="secondary"
                  className="h-10 rounded-xl px-4 font-bold bg-white text-slate-900 hover:bg-slate-200 shrink-0"
                >
                  {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                </Button>
              </div>

              {appliedPromo && (
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  Applied successfully: -₹{appliedPromo.discountAmount}
                </div>
              )}

              <div className="space-y-3 pt-4 border-t border-white/10">
                <div className="flex justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <span>Selected Package ({selectedPlan})</span>
                  <span>₹{basePrice}</span>
                </div>
                {appliedPromo && (
                  <div className="flex justify-between text-emerald-400 text-xs font-bold uppercase tracking-wider">
                    <span>Coupon Savings</span>
                    <span>-₹{appliedPromo.discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-2xl pt-3 border-t border-white/10 leading-none">
                  <span className="text-lg text-slate-300 font-bold self-center">Grand Total</span>
                  <span>₹{finalPrice}</span>
                </div>
              </div>

              <div className="pt-2">
                <Button 
                  onClick={handlePayment} 
                  disabled={processing} 
                  className="w-full h-11.5 text-sm font-black bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl shadow-md transition-all active:scale-98 border-none flex items-center justify-center gap-2"
                >
                  {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4.5 w-4.5" />}
                  Secure Payment Gateway
                </Button>
              </div>

              <p className="text-[10px] text-center text-slate-500 font-bold leading-normal">
                Secured & encrypted via Razorpay. <br />UPI, Credit/Debit Cards, NetBanking fully supported.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

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
    </div>
  );
}
