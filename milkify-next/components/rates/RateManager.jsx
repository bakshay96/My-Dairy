"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/lib/api";
import { formatRupees, formatIndianDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle, TrendingUp, RefreshCw } from "lucide-react";

// ─── Validation Schema ────────────────────────────────────────────────────────
const rateSchema = z.object({
  milkCategory: z.enum(["cow", "buffalo", "sheep", "goat"]),
  ratePerFat: z
    .coerce.number({ invalid_type_error: "Must be a number" })
    .positive("Rate must be positive")
    .max(10000, "Rate seems too high"),
  useSnf: z.boolean().default(false),
  ratePerSnf: z.coerce.number().min(0).max(10000).default(0),
  useDegree: z.boolean().default(false),
  ratePerDegree: z.coerce.number().min(0).max(10000).default(0),
});

// ─── Category Display Config ──────────────────────────────────────────────────
const CATEGORY_CONFIG = {
  cow:     { label: "Cow Milk",     emoji: "🐄", color: "bg-amber-50 border-amber-200 text-amber-700" },
  buffalo: { label: "Buffalo Milk", emoji: "🐃", color: "bg-blue-50 border-blue-200 text-blue-700" },
  sheep:   { label: "Sheep Milk",   emoji: "🐑", color: "bg-green-50 border-green-200 text-green-700" },
  goat:    { label: "Goat Milk",    emoji: "🐐", color: "bg-purple-50 border-purple-200 text-purple-700" },
};

// ─── Active Rate Card ─────────────────────────────────────────────────────────
function ActiveRateCard({ rate }) {
  const config = CATEGORY_CONFIG[rate.milkCategory] || CATEGORY_CONFIG.cow;
  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${config.color}`}>
      <span className="text-2xl">{config.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{config.label}</p>
        <p className="text-lg font-bold mt-0.5">
          {formatRupees(rate.ratePerFat)}<span className="text-xs font-normal ml-1">/ FAT unit</span>
        </p>
        {rate.useSnf && (
          <p className="text-xs mt-1 opacity-80">+ {formatRupees(rate.ratePerSnf)} / SNF unit</p>
        )}
        {rate.useDegree && (
          <p className="text-xs mt-0.5 opacity-80">+ {formatRupees(rate.ratePerDegree)} / Degree</p>
        )}
        <p className="text-xs opacity-60 mt-1">
          Updated {formatIndianDate(rate.updatedAt || rate.createdAt)}
        </p>
      </div>
      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200 shrink-0">
        Active
      </span>
    </div>
  );
}

// ─── Main RateManager Component ───────────────────────────────────────────────
export default function RateManager() {

  // Active rates from GET /api/rate/active
  const [activeRates, setActiveRates] = useState([]);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [ratesError, setRatesError] = useState("");

  // Form submission states
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [submitError, setSubmitError] = useState("");

  const form = useForm({
    resolver: zodResolver(rateSchema),
    defaultValues: {
      milkCategory: "cow",
      ratePerFat: "",
      useSnf: false,
      ratePerSnf: 0,
      useDegree: false,
      ratePerDegree: 0,
    },
  });

  const watchUseSnf    = form.watch("useSnf");
  const watchUseDegree = form.watch("useDegree");

  // ─── Fetch active rates on mount ───────────────────────────────────────────
  const fetchActiveRates = useCallback(async () => {
    setRatesLoading(true);
    setRatesError("");
    try {
      // GET /api/rate/active — token is attached automatically by api.js interceptor
      const res = await api.get("/rate/active");
      // The global api.js interceptor unwraps res.data.data → res.data
      // So res.data is the { rates: [...] } object
      const rates = res.data?.rates || [];
      setActiveRates(rates);
    } catch (err) {
      console.error("[RateManager] fetchActiveRates error:", err);
      const msg =
        err.response?.data?.message || "Failed to load active rates. Please refresh.";
      setRatesError(msg);
    } finally {
      setRatesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveRates();
  }, [fetchActiveRates]);

  // ─── Form submit handler ───────────────────────────────────────────────────
  const onSubmit = async (values) => {
    setSubmitting(true);
    setSuccessMsg("");
    setSubmitError("");
    try {
      // POST /api/rate — backend deactivates old, creates new Active record
      await api.post("/rate", values);

      const catLabel = CATEGORY_CONFIG[values.milkCategory]?.label || values.milkCategory;
      setSuccessMsg(`✓ ${catLabel} rate set to ${formatRupees(values.ratePerFat)}/FAT unit successfully!`);
      form.reset({
        milkCategory: values.milkCategory, // keep category selected
        ratePerFat: "",
        useSnf: false,
        ratePerSnf: 0,
        useDegree: false,
        ratePerDegree: 0,
      });

      // Re-fetch active rates to display the newly created one
      await fetchActiveRates();
    } catch (err) {
      console.error("[RateManager] submit error:", err);
      const msg =
        err.response?.data?.message || "Failed to save rate. Please try again.";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Active Rates Panel ─────────────────────────────────────────────── */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              Currently Active Rates
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              These rates are applied to all new milk entries.
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchActiveRates}
            disabled={ratesLoading}
            className="h-8 gap-1 text-xs"
          >
            <RefreshCw className={`h-3 w-3 ${ratesLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {ratesLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 w-full animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>
          ) : ratesError ? (
            <div className="flex items-center gap-2 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {ratesError}
            </div>
          ) : activeRates.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <TrendingUp className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No active rates configured yet.</p>
              <p className="text-xs mt-1">Use the form below to set your first rate.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {activeRates.map((rate) => (
                <ActiveRateCard key={rate._id} rate={rate} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Set New Rate Form ──────────────────────────────────────────────── */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Set New Rate</CardTitle>
          <CardDescription className="text-xs">
            Setting a new rate will automatically mark the previous rate for that
            category as Inactive.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Category + Rate Per Fat */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Milk Category */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Milk Category <span className="text-red-500">*</span>
                </label>
                <select
                  {...form.register("milkCategory")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {Object.entries(CATEGORY_CONFIG).map(([val, cfg]) => (
                    <option key={val} value={val}>
                      {cfg.emoji} {cfg.label}
                    </option>
                  ))}
                </select>
                {form.formState.errors.milkCategory && (
                  <p className="text-xs text-red-500">{form.formState.errors.milkCategory.message}</p>
                )}
              </div>

              {/* Rate Per FAT */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Rate per FAT <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g., 4.50"
                  {...form.register("ratePerFat")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                {form.formState.errors.ratePerFat && (
                  <p className="text-xs text-red-500">{form.formState.errors.ratePerFat.message}</p>
                )}
              </div>
            </div>

            {/* Optional SNF */}
            <div className="space-y-3 p-4 rounded-lg bg-gray-50 border">
              <div className="flex items-center gap-2">
                <input
                  id="useSnf"
                  type="checkbox"
                  {...form.register("useSnf")}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="useSnf" className="text-sm font-medium cursor-pointer">
                  Enable SNF-based Rate
                </label>
              </div>
              {watchUseSnf && (
                <div className="space-y-1.5 ml-6">
                  <label className="text-sm font-medium">Rate per SNF unit</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g., 0.60"
                    {...form.register("ratePerSnf")}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  {form.formState.errors.ratePerSnf && (
                    <p className="text-xs text-red-500">{form.formState.errors.ratePerSnf.message}</p>
                  )}
                </div>
              )}
            </div>

            {/* Optional Degree */}
            <div className="space-y-3 p-4 rounded-lg bg-gray-50 border">
              <div className="flex items-center gap-2">
                <input
                  id="useDegree"
                  type="checkbox"
                  {...form.register("useDegree")}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="useDegree" className="text-sm font-medium cursor-pointer">
                  Enable Degree/CLR-based Rate
                </label>
              </div>
              {watchUseDegree && (
                <div className="space-y-1.5 ml-6">
                  <label className="text-sm font-medium">Rate per Degree</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g., 0.25"
                    {...form.register("ratePerDegree")}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  {form.formState.errors.ratePerDegree && (
                    <p className="text-xs text-red-500">{form.formState.errors.ratePerDegree.message}</p>
                  )}
                </div>
              )}
            </div>

            {/* Success / Error feedback */}
            {successMsg && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {successMsg}
              </div>
            )}
            {submitError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {submitError}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving Rate...
                </>
              ) : (
                "Set Active Rate"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
