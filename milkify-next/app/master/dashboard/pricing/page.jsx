"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "@/lib/toast";
import { 
  Loader2, Tag, Save, CheckCircle2, Sparkles, Plus, 
  Pencil, Trash2, Power, X, Eye, Layers
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PricingConfigPage() {
  const [loading, setLoading] = useState(true);
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [planSubmitting, setPlanSubmitting] = useState(false);

  // Global settings state
  const [formData, setFormData] = useState({
    trialDays: 10,
    currency: "INR",
  });

  // Dynamic Plans state
  const [plans, setPlans] = useState([]);

  // Modal State for Create / Edit Plan
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [planForm, setPlanForm] = useState({
    planId: "",
    name: "",
    price: 499,
    durationDays: 30,
    billingCycle: "monthly",
    description: "",
    badge: "",
    featuresInput: "Cancel anytime\nStandard Support\nFull client access",
    isActive: true,
  });

  const fetchConfig = async () => {
    try {
      const res = await api.get("/master/plan-config");
      const config = res.data.config || res.data.data?.config;
      if (config) {
        setFormData({
          trialDays: config.trialDays ?? 10,
          currency: config.currency || "INR",
        });
        if (config.plans && config.plans.length > 0) {
          setPlans(config.plans);
        } else if (res.data.plans && res.data.plans.length > 0) {
          setPlans(res.data.plans);
        }
      }
    } catch {
      toast.error("Failed to load pricing configuration");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleGlobalChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "currency" ? value : Number(value),
    }));
  };

  const handleSaveGlobal = async (e) => {
    e.preventDefault();
    setSavingGlobal(true);
    try {
      await api.put("/master/plan-config", {
        ...formData,
        plans,
      });
      toast.success("Global subscription configuration saved!");
    } catch {
      toast.error("Failed to update pricing");
    } finally {
      setSavingGlobal(false);
    }
  };

  // Open Create Modal
  const openCreateModal = () => {
    setEditingPlanId(null);
    setPlanForm({
      planId: "",
      name: "",
      price: 999,
      durationDays: 60,
      billingCycle: "custom",
      description: "Custom subscription tier with tailored access.",
      badge: "New Tier",
      featuresInput: "Full cloud calculation\nThermal receipts printing\nPriority assistance",
      isActive: true,
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (plan) => {
    setEditingPlanId(plan.planId);
    setPlanForm({
      planId: plan.planId,
      name: plan.name,
      price: plan.price,
      durationDays: plan.durationDays,
      billingCycle: plan.billingCycle || "monthly",
      description: plan.description || "",
      badge: plan.badge || "",
      featuresInput: Array.isArray(plan.features) ? plan.features.join("\n") : "",
      isActive: plan.isActive !== false,
    });
    setIsModalOpen(true);
  };

  // Save Plan (Create or Update)
  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (!planForm.name.trim()) return toast.error("Plan name is required");
    if (!planForm.durationDays || Number(planForm.durationDays) <= 0) {
      return toast.error("Duration in days must be greater than 0");
    }

    setPlanSubmitting(true);
    const features = planForm.featuresInput
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean);

    try {
      if (editingPlanId) {
        // Edit existing plan
        await api.put(`/master/plans/${editingPlanId}`, {
          ...planForm,
          features,
        });
        toast.success(`Plan '${planForm.name}' updated successfully!`);
      } else {
        // Create new plan
        await api.post("/master/plans", {
          ...planForm,
          features,
        });
        toast.success(`New plan '${planForm.name}' created successfully!`);
      }
      setIsModalOpen(false);
      await fetchConfig();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save plan");
    } finally {
      setPlanSubmitting(false);
    }
  };

  // Toggle Plan Active State
  const handleTogglePlan = async (planId) => {
    try {
      const res = await api.patch(`/master/plans/${planId}/toggle`);
      toast.success(res.data?.message || "Plan status updated");
      await fetchConfig();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to toggle plan status");
    }
  };

  // Delete Plan
  const handleDeletePlan = async (planId, planName) => {
    if (!window.confirm(`Are you sure you want to permanently delete plan '${planName}'?`)) {
      return;
    }
    try {
      await api.delete(`/master/plans/${planId}`);
      toast.success(`Plan '${planName}' removed successfully`);
      await fetchConfig();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete plan");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5 tracking-tight">
            <Tag className="h-8 w-8 text-indigo-500" /> SaaS Pricing & Multiple Plans Engine
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create and configure multiple subscription tiers, set custom durations, modify pricing, and lock tiers for tenant renewal.
          </p>
        </div>

        <Button
          onClick={openCreateModal}
          className="rounded-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white gap-2 shadow-md shadow-indigo-500/10 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Create New Plan
        </Button>
      </div>

      {/* Global Configuration Banner */}
      <Card className="shadow-sm border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-slate-800/80 rounded-2xl overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-amber-500" /> Global Subscription Defaults
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Trial period length and transaction currency settings
            </p>
          </div>
          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-lg">
            {plans.length} Tiers Configured
          </span>
        </div>

        <CardContent className="p-5 sm:p-6">
          <form onSubmit={handleSaveGlobal} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Free Trial Duration (Days)
              </label>
              <input
                type="number"
                name="trialDays"
                value={formData.trialDays}
                onChange={handleGlobalChange}
                min="0"
                className="w-full h-11 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Payment Currency
              </label>
              <input
                type="text"
                name="currency"
                value={formData.currency}
                onChange={handleGlobalChange}
                className="w-full h-11 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold transition-all uppercase"
              />
            </div>

            <div>
              <Button
                type="submit"
                disabled={savingGlobal}
                className="w-full h-11 font-bold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-xl gap-2 transition-all"
              >
                {savingGlobal ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Global Defaults
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Plans List & Management Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-500" /> Configured SaaS Plans
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            Active plans are rendered on dairy client subscription pages
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {plans.map((p) => (
            <Card
              key={p.planId}
              className={`rounded-2xl border shadow-sm transition-all duration-200 overflow-hidden flex flex-col justify-between ${
                p.isActive !== false
                  ? "bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700/70"
                  : "bg-slate-50/80 dark:bg-slate-900/40 border-dashed border-slate-300 dark:border-slate-800 opacity-70"
              }`}
            >
              <div className="p-5 space-y-4">
                {/* Card Top Pill Bar */}
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider ${
                    p.isActive !== false
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                      : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  }`}>
                    {p.isActive !== false ? "Active Tier" : "Inactive / Hidden"}
                  </span>

                  {p.badge && (
                    <span className="bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 text-[10px] font-black uppercase px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-900/30">
                      {p.badge}
                    </span>
                  )}
                </div>

                {/* Plan Title & Price */}
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                    {p.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-medium">
                    {p.description || `Valid for ${p.durationDays} days`}
                  </p>

                  <div className="flex items-baseline gap-1 mt-3">
                    <span className="text-2xl font-black text-slate-900 dark:text-white">₹{p.price}</span>
                    <span className="text-xs text-slate-400 font-bold">/ {p.durationDays} days</span>
                  </div>
                </div>

                {/* Features Checklist */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-700/50">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Features Included</p>
                  <ul className="space-y-1.5">
                    {(p.features && p.features.length > 0 ? p.features : ["Standard features"]).map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                        <span className="truncate">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Buttons Bar */}
              <div className="p-4 bg-slate-50/60 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEditModal(p)}
                  className="rounded-xl text-xs font-bold gap-1.5 border-slate-200 dark:border-slate-700 hover:bg-white"
                >
                  <Pencil className="h-3.5 w-3.5 text-indigo-500" />
                  Edit Tier
                </Button>

                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleTogglePlan(p.planId)}
                    title={p.isActive !== false ? "Deactivate plan" : "Activate plan"}
                    className={`rounded-xl text-xs font-bold gap-1 px-2.5 ${
                      p.isActive !== false ? "text-amber-600 hover:bg-amber-50" : "text-emerald-600 hover:bg-emerald-50"
                    }`}
                  >
                    <Power className="h-3.5 w-3.5" />
                    {p.isActive !== false ? "Disable" : "Enable"}
                  </Button>

                  {/* Allow deleting custom plans (keep default monthly/yearly protected or deletable with warning) */}
                  {!["monthly", "quarterly", "yearly"].includes(p.planId) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeletePlan(p.planId, p.name)}
                      className="rounded-xl text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-2"
                      title="Delete Plan"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Live Customer Preview Section */}
      <Card className="rounded-3xl border-slate-200/80 dark:border-slate-700/60 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-5">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/20 px-2.5 py-0.5 rounded-full">
              Live Preview Monitor
            </span>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Eye className="h-5 w-5 text-indigo-400" /> Client Subscription Store View
            </h3>
            <p className="text-xs text-slate-400">
              This preview reflects exactly how your active subscription tiers appear to dairy owners.
            </p>
          </div>
          <span className="text-xs font-bold bg-white/10 text-white px-3 py-1.5 rounded-xl border border-white/15 self-start sm:self-auto">
            {plans.filter((p) => p.isActive !== false).length} Active Tiers Visible
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.filter((p) => p.isActive !== false).slice(0, 3).map((p, idx) => (
            <div key={p.planId || idx} className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-3 relative overflow-hidden backdrop-blur-xs">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">{p.name}</span>
                {p.badge && (
                  <span className="bg-indigo-500 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase">
                    {p.badge}
                  </span>
                )}
              </div>
              <div className="text-2xl font-black text-white">
                ₹{p.price} <span className="text-xs text-slate-400 font-medium">/ {p.durationDays} days</span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium">{p.description}</p>
              <div className="pt-2 border-t border-white/10">
                <div className="w-full py-2 bg-indigo-600/80 text-white text-xs font-bold text-center rounded-xl">
                  Sample Client Button
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Plan Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/80">
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-indigo-600" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {editingPlanId ? `Edit Tier: ${planForm.name}` : "Create New Subscription Plan"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="p-6 overflow-y-auto space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Plan Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 6-Month Growth Plan"
                    value={planForm.name}
                    onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Plan Key / Identifier
                  </label>
                  <input
                    type="text"
                    disabled={Boolean(editingPlanId)}
                    placeholder="auto-generated slug"
                    value={planForm.planId}
                    onChange={(e) => setPlanForm({ ...planForm, planId: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Price in INR (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 2499"
                    value={planForm.price}
                    onChange={(e) => setPlanForm({ ...planForm, price: Number(e.target.value) })}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Duration (Days) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 180"
                    value={planForm.durationDays}
                    onChange={(e) => setPlanForm({ ...planForm, durationDays: Number(e.target.value) })}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Billing Cycle
                  </label>
                  <select
                    value={planForm.billingCycle}
                    onChange={(e) => setPlanForm({ ...planForm, billingCycle: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-semibold capitalize"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="half-yearly">Half-Yearly</option>
                    <option value="yearly">Yearly</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Promotional Badge Tag
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Save 25%, Best Value"
                    value={planForm.badge}
                    onChange={(e) => setPlanForm({ ...planForm, badge: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Tagline / Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Complete peace of mind for expanding commercial dairies"
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Feature Bullets (One per line)
                </label>
                <textarea
                  rows={4}
                  placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                  value={planForm.featuresInput}
                  onChange={(e) => setPlanForm({ ...planForm, featuresInput: e.target.value })}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={planForm.isActive}
                  onChange={(e) => setPlanForm({ ...planForm, isActive: e.target.checked })}
                  className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <label htmlFor="isActive" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Make plan active and visible to dairy clients immediately
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={planSubmitting}
                  className="rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                >
                  {planSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {editingPlanId ? "Update Plan" : "Create Plan"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
