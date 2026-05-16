"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store";
import api from "@/lib/api";
import { toast } from "@/lib/toast";
import { Loader2, ShieldCheck, Crown, Tag, CreditCard, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

  const fetchData = async () => {
    try {
      const res = await api.get("/master/subscription/my");
      setData(res.data);
      if (res.data?.subscription?.plan && res.data.subscription.plan !== "trial") {
        setSelectedPlan(res.data.subscription.plan);
      }
    } catch (err) {
      toast.error("Failed to load subscription details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApplyPromo = async () => {
    if (!promoCode) return toast.error("Enter a promo code");
    setProcessing(true);
    try {
      const res = await api.post("/master/subscription/validate-promo", { code: promoCode, plan: selectedPlan });
      setAppliedPromo(res.data);
      toast.success("Promo code applied!");
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

      const { order, keyId, finalPrice } = orderRes.data;

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
          } catch (err) {
            toast.error("Payment verification failed");
          }
        },
        prefill: {
          name: user?.name || "Admin",
          email: user?.email || "admin@milkify.app",
          contact: user?.mobile || "9999999999",
        },
        theme: {
          color: "#2563eb",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const sub = data?.subscription;
  const config = data?.config || {};
  const activePromos = data?.activePromos || [];

  const basePrice = config[`${selectedPlan}Price`] || 0;
  const finalPrice = appliedPromo ? appliedPromo.finalPrice : basePrice;

  // Render Status
  const renderStatus = () => {
    if (!sub) return null;
    const isTrial = sub.status === "trial";
    const isActive = sub.status === "active";
    const endDate = isTrial ? sub.trialEndDate : sub.endDate;
    const daysLeft = sub.daysRemaining;

    return (
      <Card className={`border-2 ${isActive ? "border-green-500 bg-green-50/50" : isTrial ? "border-amber-500 bg-amber-50/50" : "border-red-500 bg-red-50/50"}`}>
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${isActive ? "bg-green-100 text-green-600" : isTrial ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-600"}`}>
              {isActive ? <ShieldCheck className="h-8 w-8" /> : isTrial ? <Clock className="h-8 w-8" /> : <ShieldCheck className="h-8 w-8 opacity-50" />}
            </div>
            <div>
              <h2 className="text-xl font-bold uppercase tracking-wide">
                {sub.status === "trial" ? "Trial Period" : sub.status}
              </h2>
              <p className="text-sm text-slate-600">
                {daysLeft > 0 ? (
                  <>Your plan ends in <strong className={daysLeft <= 3 ? "text-red-500" : ""}>{daysLeft} days</strong> (on {new Date(endDate).toLocaleDateString()})</>
                ) : (
                  <span className="text-red-500 font-semibold">Your subscription has expired.</span>
                )}
              </p>
            </div>
          </div>
          {daysLeft <= 0 && (
            <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-bold animate-pulse">
              RENEWAL REQUIRED
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Milkify Subscription</h1>
        <p className="text-slate-500 mt-1">Manage your plan, apply promos, and securely upgrade your account.</p>
      </div>

      {renderStatus()}

      {/* Promos */}
      {activePromos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activePromos.map((p) => (
            <div key={p._id} className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl p-4 flex items-center justify-between shadow-lg">
              <div>
                <span className="bg-white/20 px-2 py-1 rounded text-xs font-bold tracking-wider mb-2 inline-block">SPECIAL OFFER</span>
                <h3 className="font-bold text-lg">{p.code}</h3>
                <p className="text-sm text-white/80">{p.description || `Get ${p.discountType === "percentage" ? p.discountValue + "%" : "₹" + p.discountValue} off!`}</p>
              </div>
              <Button size="sm" variant="secondary" className="font-bold" onClick={() => { setPromoCode(p.code); setAppliedPromo(null); }}>
                Use Code
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Pricing Plans */}
      <div className="grid md:grid-cols-2 gap-8">
        <Card className="shadow-lg border-primary/20">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="flex items-center gap-2"><Crown className="h-5 w-5 text-amber-500" /> Choose Plan</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {["monthly", "quarterly", "yearly"].map((plan) => (
              <label
                key={plan}
                className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedPlan === plan ? "border-primary bg-primary/5" : "border-slate-200 hover:border-primary/50"
                }`}
                onClick={() => { setSelectedPlan(plan); setAppliedPromo(null); }}
              >
                <div className="flex items-center gap-3">
                  <input type="radio" checked={selectedPlan === plan} readOnly className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-bold capitalize">{plan} Plan</p>
                    <p className="text-sm text-slate-500">Billed {plan}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-lg">₹{config[`${plan}Price`] || 0}</p>
                </div>
              </label>
            ))}
          </CardContent>
        </Card>

        {/* Checkout Summary */}
        <Card className="shadow-lg bg-slate-900 text-white border-none relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <CreditCard className="w-48 h-48" />
          </div>
          <CardHeader>
            <CardTitle>Checkout Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6 relative z-10">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Promo Code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                className="flex-1 bg-white/10 border border-white/20 rounded-lg h-10 px-3 text-white placeholder-white/50 focus:outline-none focus:border-primary uppercase"
              />
              <Button onClick={handleApplyPromo} disabled={processing || !promoCode} variant="secondary">
                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
              </Button>
            </div>

            {appliedPromo && (
              <div className="flex items-center gap-2 text-green-400 text-sm font-medium bg-green-400/10 p-2 rounded-lg">
                <CheckCircle2 className="h-4 w-4" /> Promo applied: -₹{appliedPromo.discountAmount}
              </div>
            )}

            <div className="space-y-3 pt-4 border-t border-white/10">
              <div className="flex justify-between text-slate-300">
                <span>Base Plan ({selectedPlan})</span>
                <span>₹{basePrice}</span>
              </div>
              {appliedPromo && (
                <div className="flex justify-between text-green-400">
                  <span>Discount</span>
                  <span>-₹{appliedPromo.discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-2xl pt-2 border-t border-white/10">
                <span>Total</span>
                <span>₹{finalPrice}</span>
              </div>
            </div>

            <Button onClick={handlePayment} disabled={processing} className="w-full h-12 text-lg font-bold bg-white text-slate-900 hover:bg-slate-200">
              {processing ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <CreditCard className="h-5 w-5 mr-2" />}
              Pay Securely
            </Button>
            <p className="text-xs text-center text-slate-400">Secured by Razorpay. UPI, Cards, NetBanking accepted.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
