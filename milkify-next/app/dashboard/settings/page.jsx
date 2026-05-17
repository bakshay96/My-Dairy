"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Settings, Loader2, CheckCircle2, AlertCircle,
  TrendingUp, RefreshCw, Plus, X
} from "lucide-react";
import { formatRupees, formatIndianDate } from "@/lib/utils";

const CATEGORY_CONFIG = {
  cow:     { label: "Cow Milk",     emoji: "🐄", color: "bg-amber-50 border-amber-200 text-amber-800" },
  buffalo: { label: "Buffalo Milk", emoji: "🐃", color: "bg-blue-50 border-blue-200 text-blue-800" },
  sheep:   { label: "Sheep Milk",   emoji: "🐑", color: "bg-green-50 border-green-200 text-green-800" },
  goat:    { label: "Goat Milk",    emoji: "🐐", color: "bg-purple-50 border-purple-200 text-purple-800" },
};

const rateSchema = z.object({
  milkCategory: z.enum(["cow", "buffalo", "sheep", "goat"]),
  ratePerFat: z.coerce.number({ invalid_type_error: "Required" }).positive("Must be positive").max(10000),
  useSnf: z.boolean().default(false),
  ratePerSnf: z.coerce.number().min(0).max(10000).default(0),
  useDegree: z.boolean().default(false),
  ratePerDegree: z.coerce.number().min(0).max(10000).default(0),
});

// ─── Active Rate Card ─────────────────────────────────────────────────────────
function ActiveRateCard({ rate, onEdit }) {
  const cfg = CATEGORY_CONFIG[rate.milkCategory] || CATEGORY_CONFIG.cow;
  return (
    <div className={`relative flex items-start gap-3 p-4 rounded-xl border ${cfg.color}`}>
      <span className="text-2xl">{cfg.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{cfg.label}</p>
        <p className="text-xl font-bold mt-0.5">
          {formatRupees(rate.ratePerFat)}<span className="text-xs font-normal ml-1">/ FAT unit</span>
        </p>
        {rate.useSnf && <p className="text-xs mt-1 opacity-75">+ {formatRupees(rate.ratePerSnf)}/SNF</p>}
        {rate.useDegree && <p className="text-xs mt-0.5 opacity-75">+ {formatRupees(rate.ratePerDegree)}/Degree</p>}
        <p className="text-xs opacity-50 mt-2">
          Updated {formatIndianDate(rate.updatedAt || rate.createdAt)}
        </p>
      </div>
      <button
        onClick={() => onEdit(rate)}
        className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/70 hover:bg-white transition-colors text-xs font-medium opacity-70 hover:opacity-100"
      >
        Update
      </button>
      <span className="absolute bottom-3 right-3 px-1.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
        Active
      </span>
    </div>
  );
}

// ─── Rate Slide-In Sidebar Form ───────────────────────────────────────────────
function RateSidebarForm({ initialCategory, onClose, onSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const form = useForm({
    resolver: zodResolver(rateSchema),
    defaultValues: {
      milkCategory: initialCategory || "cow",
      ratePerFat: "",
      useSnf: false, ratePerSnf: 0,
      useDegree: false, ratePerDegree: 0,
    },
  });

  const watchUseSnf    = form.watch("useSnf");
  const watchUseDegree = form.watch("useDegree");

  const onSubmit = async (values) => {
    setSubmitting(true);
    setError("");
    try {
      await api.post("/rate", values);
      onSuccess(values.milkCategory);
      onClose(); // ← Auto-close on success
    } catch (e) {
      setError(e.response?.data?.message || "Failed to save rate.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-sm bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b bg-gray-50">
          <div>
            <h2 className="font-bold text-lg">Set Milk Rate</h2>
            <p className="text-xs text-gray-500 mt-0.5">Previous rate will be automatically deactivated</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-5">
          <form id="rate-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Milk Category <span className="text-red-500">*</span></label>
              <select
                {...form.register("milkCategory")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {Object.entries(CATEGORY_CONFIG).map(([val, cfg]) => (
                  <option key={val} value={val}>{cfg.emoji} {cfg.label}</option>
                ))}
              </select>
            </div>

            {/* Rate Per FAT */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Rate per FAT <span className="text-red-500">*</span></label>
              <input
                type="number" step="0.01" placeholder="e.g. 4.50"
                {...form.register("ratePerFat")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {form.formState.errors.ratePerFat && (
                <p className="text-xs text-red-500">{form.formState.errors.ratePerFat.message}</p>
              )}
            </div>

            {/* SNF toggle */}
            <div className="p-4 rounded-lg bg-gray-50 border space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...form.register("useSnf")} className="h-4 w-4 rounded" />
                <span className="text-sm font-medium">Enable SNF Rate</span>
              </label>
              {watchUseSnf && (
                <div className="ml-6 space-y-1.5">
                  <label className="text-sm">Rate per SNF</label>
                  <input type="number" step="0.01" placeholder="e.g. 0.60" {...form.register("ratePerSnf")}
                    className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                </div>
              )}
            </div>

            {/* Degree toggle */}
            <div className="p-4 rounded-lg bg-gray-50 border space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...form.register("useDegree")} className="h-4 w-4 rounded" />
                <span className="text-sm font-medium">Enable Degree/CLR Rate</span>
              </label>
              {watchUseDegree && (
                <div className="ml-6 space-y-1.5">
                  <label className="text-sm">Rate per Degree</label>
                  <input type="number" step="0.01" placeholder="e.g. 0.25" {...form.register("ratePerDegree")}
                    className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                <AlertCircle className="h-4 w-4" /> {error}
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button form="rate-form" type="submit" className="flex-1" disabled={submitting}>
            {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Set Active Rate"}
          </Button>
        </div>
      </div>
    </>
  );
}

// ─── Main Settings Page ───────────────────────────────────────────────────────
export default function SettingsPage() {


  const [activeRates, setActiveRates] = useState([]);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [ratesError, setRatesError] = useState("");

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCategory, setSidebarCategory] = useState("cow");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchRates = useCallback(async () => {
    setRatesLoading(true);
    setRatesError("");
    try {
      const res = await api.get("/rate/active");
      setActiveRates(res.data?.rates || []);
    } catch {
      setRatesError("Failed to load rates.");
    } finally {
      setRatesLoading(false);
    }
  }, []);

  useEffect(() => { fetchRates(); }, [fetchRates]);

  const openSidebar = (category = "cow") => {
    setSidebarCategory(category);
    setSidebarOpen(true);
  };

  const handleRateSaved = (category) => {
    const cfg = CATEGORY_CONFIG[category];
    setSuccessMsg(`✓ ${cfg?.label || category} rate updated successfully!`);
    setTimeout(() => setSuccessMsg(""), 4000);
    fetchRates();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage rates and account configuration.</p>
      </div>

      {/* ── Milk Rates Section ─────────────────────────────────────────────── */}


      {/* ── Milk Rates Section ─────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" /> Milk Rate Configuration
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Setting a new rate automatically deactivates the previous one for that category.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchRates} disabled={ratesLoading} className="gap-1">
              <RefreshCw className={`h-3.5 w-3.5 ${ratesLoading ? "animate-spin" : ""}`} />
            </Button>
            <Button size="sm" onClick={() => openSidebar("cow")} className="gap-1">
              <Plus className="h-4 w-4" /> Set Rate
            </Button>
          </div>
        </div>

        {successMsg && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
            <CheckCircle2 className="h-4 w-4" /> {successMsg}
          </div>
        )}

        {ratesLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[1, 2].map((i) => <div key={i} className="h-28 animate-pulse bg-gray-100 rounded-xl" />)}
          </div>
        ) : ratesError ? (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertCircle className="h-4 w-4" /> {ratesError}
          </div>
        ) : activeRates.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-xl">
            <TrendingUp className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 text-sm">No rates configured yet.</p>
            <Button className="mt-4 gap-1" onClick={() => openSidebar("cow")}>
              <Plus className="h-4 w-4" /> Configure First Rate
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {activeRates.map((rate) => (
              <ActiveRateCard
                key={rate._id}
                rate={rate}
                onEdit={(r) => openSidebar(r.milkCategory)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Rate Slide-In Sidebar ─────────────────────────────────────────── */}
      {sidebarOpen && (
        <RateSidebarForm
          initialCategory={sidebarCategory}
          onClose={() => setSidebarOpen(false)}
          onSuccess={handleRateSaved}
        />
      )}
    </div>
  );
}
