"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "@/lib/toast";
import { Loader2, Tag, Save } from "lucide-react";
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
    return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-purple-500" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Tag className="h-8 w-8 text-purple-500" /> Pricing Configuration
        </h1>
        <p className="text-slate-500 mt-1">Set the global subscription pricing for the Milkify platform.</p>
      </div>

      <Card className="shadow-xl border-none bg-white dark:bg-slate-950">
        <CardContent className="p-8">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase text-slate-500 tracking-wider">Trial Period (Days)</label>
                <input
                  type="number"
                  name="trialDays"
                  value={formData.trialDays}
                  onChange={handleChange}
                  min="0"
                  className="w-full h-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold uppercase text-slate-500 tracking-wider">Monthly Price (₹)</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    name="monthlyPrice"
                    value={formData.monthlyPrice}
                    onChange={handleChange}
                    min="0"
                    className="w-full h-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-4 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold uppercase text-slate-500 tracking-wider">Quarterly Price (₹)</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    name="quarterlyPrice"
                    value={formData.quarterlyPrice}
                    onChange={handleChange}
                    min="0"
                    className="w-full h-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-4 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold uppercase text-slate-500 tracking-wider">Yearly Price (₹)</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    name="yearlyPrice"
                    value={formData.yearlyPrice}
                    onChange={handleChange}
                    min="0"
                    className="w-full h-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-4 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button type="submit" disabled={saving} className="h-12 px-8 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-200">
                {saving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                Save Pricing
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
