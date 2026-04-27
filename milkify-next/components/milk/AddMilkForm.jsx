"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2, AlertCircle, CheckCircle2, Search, X,
  Droplet, TrendingUp, Sun, Moon, Calculator
} from "lucide-react";
import { formatRupees } from "@/lib/utils";
import { toast } from "sonner";

// ─── Validation Schema ────────────────────────────────────────────────────────
const formSchema = z.object({
  farmerId: z.string().min(1, "Please select a farmer"),
  category: z.enum(["cow", "buffalo", "goat", "sheep"]),
  fat: z.coerce.number({ invalid_type_error: "FAT is required" }).min(1.0, "Min 1.0").max(20.0, "Max 20.0"),
  snf: z.coerce.number().min(0).max(15.0).default(0),
  degree: z.coerce.number().min(0).max(35.0).default(0),
  litter: z.coerce.number({ invalid_type_error: "Quantity is required" }).min(0.1, "Min 0.1L").max(1000, "Max 1000L"),
  shift: z.enum(["morning", "evening"]),
});

const CATEGORY_EMOJI = { cow: "🐄", buffalo: "🐃", goat: "🐐", sheep: "🐑" };

// ─── Main AddMilkForm ─────────────────────────────────────────────────────────
export default function AddMilkForm() {

  // ── Farmers state ──────────────────────────────────────────────────────────
  const [allFarmers, setAllFarmers] = useState([]);
  const [farmerSearch, setFarmerSearch] = useState("");
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [farmersLoading, setFarmersLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // ── Active rates state ─────────────────────────────────────────────────────
  const [activeRates, setActiveRates] = useState({});  // { cow: {...}, buffalo: {...} }
  const [ratesLoading, setRatesLoading] = useState(true);
  const [noRateError, setNoRateError] = useState("");

  // ── Form & submission ──────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [submitError, setSubmitError] = useState("");

  // Auto-detect shift based on current hour
  const defaultShift = new Date().getHours() < 12 ? "morning" : "evening";

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: "cow",
      fat: "",
      snf: "",
      degree: "",
      litter: "",
      farmerId: "",
      shift: defaultShift,
    },
  });

  const watchCategory = form.watch("category");
  const watchFat = form.watch("fat");
  const watchLitter = form.watch("litter");
  const watchSnf = form.watch("snf");
  const watchDegree = form.watch("degree");

  // ── Derived: live amount preview ───────────────────────────────────────────
  const previewAmount = useMemo(() => {
    const rate = activeRates[watchCategory];
    if (!rate) return null;
    const fat = parseFloat(watchFat) || 0;
    const litter = parseFloat(watchLitter) || 0;
    const snf = parseFloat(watchSnf) || 0;
    const degree = parseFloat(watchDegree) || 0;
    if (!fat || !litter) return null;
    const base = fat * rate.ratePerFat * litter;
    const snfPart = rate.useSnf && snf > 0 ? snf * rate.ratePerSnf * litter : 0;
    const degreePart = rate.useDegree && degree > 0 ? degree * rate.ratePerDegree * litter : 0;
    return parseFloat((base + snfPart + degreePart).toFixed(2));
  }, [watchCategory, watchFat, watchLitter, watchSnf, watchDegree, activeRates]);

  // ── Fetch farmers ──────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/farmer");
        const list = Array.isArray(res.data?.farmers)
          ? res.data.farmers
          : Array.isArray(res.data)
          ? res.data
          : [];
        setAllFarmers(list);
      } catch (e) {
        console.error("Farmers load error:", e);
      } finally {
        setFarmersLoading(false);
      }
    };
    load();
  }, []);

  // ── Fetch active rates ─────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setRatesLoading(true);
      setNoRateError("");
      try {
        const res = await api.get("/rate/active");
        const rates = res.data?.rates || [];
        const map = {};
        rates.forEach((r) => { map[r.milkCategory] = r; });
        setActiveRates(map);
      } catch (e) {
        console.error("Rates load error:", e);
        setNoRateError("Could not load rate settings. Please try again.");
      } finally {
        setRatesLoading(false);
      }
    };
    load();
  }, []);

  // ── Update noRateError when category changes ───────────────────────────────
  useEffect(() => {
    if (!ratesLoading) {
      setNoRateError(
        activeRates[watchCategory]
          ? ""
          : `No active rate for "${watchCategory}" milk. Please set it in Settings first.`
      );
    }
  }, [watchCategory, activeRates, ratesLoading]);

  // ── Filtered farmer list ───────────────────────────────────────────────────
  const filteredFarmers = useMemo(() => {
    const q = farmerSearch.toLowerCase().trim();
    if (!q) return allFarmers;
    return allFarmers.filter(
      (f) =>
        f.name?.toLowerCase().includes(q) ||
        String(f.mobile || "").includes(q) ||
        String(f._id || "").toLowerCase().includes(q)
    );
  }, [allFarmers, farmerSearch]);

  const handleSelectFarmer = (farmer) => {
    setSelectedFarmer(farmer);
    setFarmerSearch("");
    form.setValue("farmerId", farmer._id, { shouldValidate: true });
  };

  const handleClearFarmer = () => {
    setSelectedFarmer(null);
    form.setValue("farmerId", "");
  };

  // ── Form submit ────────────────────────────────────────────────────────────
  const onSubmit = async (values) => {
    if (!activeRates[values.category]) {
      setNoRateError(`No active rate for "${values.category}". Go to Settings → Milk Rate Configuration.`);
      return;
    }
    setLoading(true);
    setSuccessMsg("");
    setSubmitError("");
    try {
      const res = await api.post(`/milk/${values.farmerId}`, values);
      // Backend now independently calculates the amount
      const saved = res.data?.milk || res.data || {};
      const amount = saved.calculatedAmount ?? previewAmount ?? 0;
      setSuccessMsg(
        `✓ ${values.litter}L recorded for ${selectedFarmer?.name}. Amount: ${formatRupees(amount)}`
      );
      toast.success("Milk entry saved");
      form.reset({
        category: values.category,
        fat: "", snf: "", degree: "", litter: "",
        farmerId: "",
        shift: new Date().getHours() < 12 ? "morning" : "evening",
      });
      setSelectedFarmer(null);
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to save milk entry. Please try again.";
      setSubmitError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = !loading && !ratesLoading && !noRateError && !!selectedFarmer;
  const currentRate = activeRates[watchCategory];

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* ── Rate Status Banner ─────────────────────────────────────────────── */}
      {ratesLoading ? (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading active rates...
        </div>
      ) : noRateError ? (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {noRateError}
          <a href="/dashboard/settings" className="ml-auto underline font-medium whitespace-nowrap">
            Set Rate →
          </a>
        </div>
      ) : currentRate ? (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
          <TrendingUp className="h-4 w-4 shrink-0" />
          <span>
            Active rate for <strong>{watchCategory}</strong>:{" "}
            <strong>{formatRupees(currentRate.ratePerFat)}/FAT unit</strong>
            {currentRate.useSnf && ` + ${formatRupees(currentRate.ratePerSnf)}/SNF`}
            {currentRate.useDegree && ` + ${formatRupees(currentRate.ratePerDegree)}/Degree`}
          </span>
        </div>
      ) : null}

      <Card className="shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Droplet className="h-5 w-5 text-blue-500" />
            Record Milk Collection
          </CardTitle>
          <CardDescription>
            Rates are fetched live from Settings. The backend independently calculates
            the final amount — no frontend trust required.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-foreground">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

            {/* ── Farmer Search & Select ──────────────────────────────────── */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Farmer <span className="text-red-500">*</span>
              </label>

              {selectedFarmer ? (
                <div className="flex items-center justify-between p-3 rounded-md border bg-blue-50 border-blue-200">
                  <div>
                    <p className="font-medium text-sm text-blue-900">{selectedFarmer.name}</p>
                    <p className="text-xs text-blue-600">{selectedFarmer.mobile}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearFarmer}
                    className="p-1 rounded-full hover:bg-blue-100 text-blue-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, mobile, or ID..."
                    value={farmerSearch}
                    onChange={(e) => setFarmerSearch(e.target.value)}
                    onFocus={() => setIsDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                    className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  {isDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {farmersLoading ? (
                        <div className="p-3 text-center text-sm text-gray-500">Loading...</div>
                      ) : filteredFarmers.length === 0 ? (
                        <div className="p-3 text-center text-sm text-gray-500">No farmers found</div>
                      ) : (
                        filteredFarmers.map((f) => (
                          <button
                            key={f._id}
                            type="button"
                            onClick={() => handleSelectFarmer(f)}
                            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm border-b last:border-0"
                          >
                            <span className="font-medium">{f.name}</span>
                            <span className="ml-2 text-gray-400 text-xs">{f.mobile}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
              {/* Hidden input for validation */}
              <input type="hidden" {...form.register("farmerId")} />
              {form.formState.errors.farmerId && (
                <p className="text-xs text-red-500">{form.formState.errors.farmerId.message}</p>
              )}
            </div>

            {/* ── Category + Shift ────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center justify-between">
                  <span>Category <span className="text-red-500">*</span></span>
                  {currentRate && (
                    <span className="text-xs text-primary font-semibold">
                      Rate: {formatRupees(currentRate.ratePerFat)}/Ltr per FAT
                    </span>
                  )}
                </label>
                <select
                  {...form.register("category")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {["cow", "buffalo", "goat", "sheep"].map((c) => (
                    <option key={c} value={c}>{CATEGORY_EMOJI[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Shift <span className="text-red-500">*</span></label>
                <div className="flex rounded-md border overflow-hidden h-10">
                  {["morning", "evening"].map((s) => {
                    const active = form.watch("shift") === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => form.setValue("shift", s)}
                    className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-medium transition-colors ${
                          active ? "bg-primary text-white" : "bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        {s === "morning" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Milk Quality Inputs ─────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: "fat", label: "FAT %", placeholder: "e.g. 3.5", required: true },
                { key: "litter", label: "Quantity (L)", placeholder: "e.g. 5.5", required: true },
                { key: "snf", label: "SNF %", placeholder: "e.g. 8.5", required: false },
                { key: "degree", label: "Degree/CLR", placeholder: "e.g. 28.0", required: false },
              ].map(({ key, label, placeholder, required }) => (
                <div key={key} className="space-y-1.5">
                  <label className="text-sm font-medium">
                    {label} {required && <span className="text-red-500">*</span>}
                    {!required && <span className="text-xs text-gray-400 dark:text-gray-500 font-normal ml-1">(optional)</span>}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder={placeholder}
                    {...form.register(key)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  {form.formState.errors[key] && (
                    <p className="text-xs text-red-500">{form.formState.errors[key].message}</p>
                  )}
                </div>
              ))}
            </div>

            {/* ── Live Amount Preview ─────────────────────────────────────── */}
            {previewAmount !== null && (
              <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-slate-900 dark:to-slate-800 border border-green-200 dark:border-slate-700">
                <div className="flex items-center gap-2 text-green-700">
                  <Calculator className="h-4 w-4" />
                  <span className="text-sm font-medium">Estimated Amount</span>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-700">{formatRupees(previewAmount)}</p>
                  <p className="text-xs text-green-600 mt-0.5">
                    {parseFloat(watchFat)} FAT × {formatRupees(currentRate?.ratePerFat)} × {parseFloat(watchLitter)}L
                    {`  |  Per Litter: ${formatRupees((parseFloat(watchFat || 0) * Number(currentRate?.ratePerFat || 0)).toFixed(2))}`}
                  </p>
                </div>
              </div>
            )}

            {/* ── Feedback Messages ───────────────────────────────────────── */}
            {successMsg && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                {successMsg}
              </div>
            )}
            {submitError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                {submitError}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={!canSubmit}
            >
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
              ) : noRateError ? (
                "Set Rate First"
              ) : (
                "Save Entry"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
