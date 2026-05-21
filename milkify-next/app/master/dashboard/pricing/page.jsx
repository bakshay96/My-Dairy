"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "@/lib/toast";
import { Loader2, Tag, Save, CheckCircle2, Zap, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PricingConfigPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    monthlyPrice: 0,
    quarterlyPrice: 0,
    yearlyPrice: 0,
    trialDays: 10,
    currency: "INR",
  });

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await api.get("/master/plan-config");
        const data = res.data.config;
        if (data) {
          setFormData({
            monthlyPrice: data.monthlyPrice,
            quarterlyPrice: data.quarterlyPrice,
            yearlyPrice: data.yearlyPrice,
            trialDays: data.trialDays,
            currency: data.currency || "INR",
          });
        }
      } catch {
        toast.error("Failed to load pricing configuration");
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "currency" ? value : Number(value),
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/master/plan-config", formData);
      toast.success("Pricing configuration updated successfully!");
    } catch {
      toast.error("Failed to update pricing");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  // Calculate savings percentage
  const quarterlyEquivalent = formData.monthlyPrice * 3;
  const quarterlySavings = quarterlyEquivalent > 0 
    ? Math.round(((quarterlyEquivalent - formData.quarterlyPrice) / quarterlyEquivalent) * 100)
    : 0;

  const yearlyEquivalent = formData.monthlyPrice * 12;
  const yearlySavings = yearlyEquivalent > 0 
    ? Math.round(((yearlyEquivalent - formData.yearlyPrice) / yearlyEquivalent) * 100)
    : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5 tracking-tight">
          <Tag className="h-8 w-8 text-indigo-500" /> Pricing Configuration
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Configure global dairy tenant subscription costs, trial details, and view a live preview of how they render.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Form Column */}
        <Card className="lg:col-span-1 shadow-lg border-none bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/60 overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/50">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Settings</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Modify subscription billing rates</p>
          </div>
          <CardContent className="p-5 sm:p-6">
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Trial Period (Days)</label>
                <input
                  type="number"
                  name="trialDays"
                  value={formData.trialDays}
                  onChange={handleChange}
                  min="0"
                  className="w-full h-11 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Monthly Price (INR)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-slate-400 font-extrabold text-sm">₹</span>
                  <input
                    type="number"
                    name="monthlyPrice"
                    value={formData.monthlyPrice}
                    onChange={handleChange}
                    min="0"
                    className="w-full h-11 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Quarterly Price (INR)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-slate-400 font-extrabold text-sm">₹</span>
                  <input
                    type="number"
                    name="quarterlyPrice"
                    value={formData.quarterlyPrice}
                    onChange={handleChange}
                    min="0"
                    className="w-full h-11 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Yearly Price (INR)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-slate-400 font-extrabold text-sm">₹</span>
                  <input
                    type="number"
                    name="yearlyPrice"
                    value={formData.yearlyPrice}
                    onChange={handleChange}
                    min="0"
                    className="w-full h-11 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700/60">
                <Button 
                  type="submit" 
                  disabled={saving} 
                  className="w-full h-11 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Pricing
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Live Preview Columns */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider">Live Customer Preview</h3>
            <span className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider animate-pulse-soft">
              Active Mode
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Free Trial Card */}
            <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 p-5 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-400 to-slate-500" />
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Introduction</span>
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Free Trial</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-4">Risk-free assessment</p>
              <div className="flex items-baseline gap-1.5 mb-4">
                <span className="text-3xl font-black text-slate-900 dark:text-white">₹0</span>
                <span className="text-xs text-slate-400">/ {formData.trialDays} days</span>
              </div>
              <ul className="space-y-2.5">
                <li className="flex items-start gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  No credit card required
                </li>
                <li className="flex items-start gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  Full dashboard & features
                </li>
                <li className="flex items-start gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  Instant tenant signup
                </li>
              </ul>
            </div>

            {/* Monthly Card */}
            <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 p-5 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
                  <Tag className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                </div>
                <span className="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-widest">Monthly</span>
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Monthly Plan</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-4">Pay as you go</p>
              <div className="flex items-baseline gap-1.5 mb-4">
                <span className="text-3xl font-black text-slate-900 dark:text-white">₹{formData.monthlyPrice}</span>
                <span className="text-xs text-slate-400">/ month</span>
              </div>
              <ul className="space-y-2.5">
                <li className="flex items-start gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                  Cancel anytime
                </li>
                <li className="flex items-start gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                  Automatic receipt sync
                </li>
                <li className="flex items-start gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                  24/7 dedicated support
                </li>
              </ul>
            </div>

            {/* Quarterly Card */}
            <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 p-5 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center">
                  <Tag className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                </div>
                {quarterlySavings > 0 && (
                  <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider">
                    Save {quarterlySavings}%
                  </span>
                )}
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Quarterly Plan</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-4">Quarterly billing cycle</p>
              <div className="flex items-baseline gap-1.5 mb-4">
                <span className="text-3xl font-black text-slate-900 dark:text-white">₹{formData.quarterlyPrice}</span>
                <span className="text-xs text-slate-400">/ 3 months</span>
              </div>
              <ul className="space-y-2.5">
                <li className="flex items-start gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                  Popular & cost-effective
                </li>
                <li className="flex items-start gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                  Extended billing buffer
                </li>
                <li className="flex items-start gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                  Full farmer management
                </li>
              </ul>
            </div>

            {/* Yearly Card (Recommended) */}
            <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800/80 border-2 border-indigo-500 p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                </div>
                <div className="flex items-center gap-1.5">
                  {yearlySavings > 0 && (
                    <span className="bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider">
                      Save {yearlySavings}%
                    </span>
                  )}
                  <span className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider shadow-sm">
                    Best Value
                  </span>
                </div>
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Annual Plan</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-4">Ultimate peace of mind</p>
              <div className="flex items-baseline gap-1.5 mb-4">
                <span className="text-3xl font-black text-slate-900 dark:text-white">₹{formData.yearlyPrice}</span>
                <span className="text-xs text-slate-400">/ year</span>
              </div>
              <ul className="space-y-2.5">
                <li className="flex items-start gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
                  Maximum savings
                </li>
                <li className="flex items-start gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
                  Zero price hike guarantees
                </li>
                <li className="flex items-start gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
                  VIP server speeds & bandwidth
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
