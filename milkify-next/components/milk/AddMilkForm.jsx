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
import { toast } from "@/lib/toast";
import Link from "next/link";

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
    <div className="max-w-2xl mx-auto space-y-6 px-1 sm:px-0 pb-10">
      {/* ── Rate Status Banner ─────────────────────────────────────────────── */}
      {ratesLoading ? (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-sm backdrop-blur-sm animate-pulse">
          <Loader2 className="h-4 w-4 animate-spin" />
          Fetching live dairy rates...
        </div>
      ) : noRateError ? (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-800 text-red-700 dark:text-red-300 text-sm backdrop-blur-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="flex-1">{noRateError}</p>
          <Link href="/dashboard/settings" className="underline font-bold whitespace-nowrap hover:text-red-800">
            Fix Now →
          </Link>
        </div>
      ) : currentRate ? (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm backdrop-blur-sm">
          <TrendingUp className="h-5 w-5 shrink-0 text-emerald-600" />
          <div className="flex-1">
            <p className="font-semibold text-[13px]">Active {watchCategory} rate detected</p>
            <p className="text-[12px] opacity-80">
              {formatRupees(currentRate.ratePerFat)} per FAT unit
              {currentRate.useSnf && ` + ${formatRupees(currentRate.ratePerSnf)}/SNF`}
              {currentRate.useDegree && ` + ${formatRupees(currentRate.ratePerDegree)}/Degree`}
            </p>
          </div>
        </div>
      ) : null}

      <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg overflow-visible">
        <CardHeader className="pb-6 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Droplet className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black tracking-tight">Record Collection</CardTitle>
              <CardDescription className="text-gray-500 font-medium">New milk entry for current cycle</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-8 pb-10">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            {/* ── Farmer Search & Select ──────────────────────────────────── */}
            <div className="space-y-2.5">
              <label className="text-[13px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 ml-1">
                Farmer Selection <span className="text-primary">*</span>
              </label>

              {selectedFarmer ? (
                <div className="flex items-center justify-between p-4 rounded-2xl border-2 border-primary/20 bg-primary/5 group transition-all animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {selectedFarmer.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white leading-none">{selectedFarmer.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{selectedFarmer.mobile}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearFarmer}
                    className="p-2 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 transition-colors group-focus-within:text-primary" />
                  <input
                    type="text"
                    placeholder="Search by name or mobile..."
                    value={farmerSearch}
                    onChange={(e) => {
                      setFarmerSearch(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setIsDropdownOpen(false), 250)}
                    className="flex h-14 w-full rounded-2xl border-2 border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 pl-12 pr-4 py-2 text-base font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary"
                  />
                  {isDropdownOpen && (
                    <div className="absolute z-[60] w-full mt-2 bg-white dark:bg-slate-900 border-2 border-gray-100 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                      {farmersLoading ? (
                        <div className="p-8 text-center text-gray-400 flex flex-col items-center gap-2">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          <span className="text-sm font-medium">Searching records...</span>
                        </div>
                      ) : filteredFarmers.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 flex flex-col items-center gap-2">
                          <AlertCircle className="h-6 w-6" />
                          <span className="text-sm font-medium">No farmer found</span>
                        </div>
                      ) : (
                        <div className="max-h-72 overflow-y-auto">
                          {filteredFarmers.map((f) => (
                            <button
                              key={f._id}
                              type="button"
                              onClick={() => handleSelectFarmer(f)}
                              className="w-full text-left px-5 py-4 hover:bg-primary/5 transition-colors border-b border-gray-50 dark:border-slate-800 last:border-0 group"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-500 group-hover:bg-primary group-hover:text-white transition-colors">
                                  {f.name?.[0]?.toUpperCase()}
                                </div>
                                <div>
                                  <span className="font-bold block text-gray-900 dark:text-white">{f.name}</span>
                                  <span className="text-xs text-gray-400 dark:text-gray-500">{f.mobile}</span>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {/* Hidden input for validation */}
              <input type="hidden" {...form.register("farmerId")} />
              {form.formState.errors.farmerId && (
                <p className="text-[12px] text-red-500 font-bold ml-1 mt-1">{form.formState.errors.farmerId.message}</p>
              )}
            </div>

            {/* ── Category + Shift ────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2.5">
                <label className="text-[13px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 ml-1">
                  Milk Type <span className="text-primary">*</span>
                </label>
                <div className="relative">
                  <select
                    {...form.register("category")}
                    className="flex h-14 w-full rounded-2xl border-2 border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 px-5 py-2 text-base font-bold appearance-none transition-all focus:border-primary focus:ring-0"
                  >
                    {["cow", "buffalo", "goat", "sheep"].map((c) => (
                      <option key={c} value={c}>{CATEGORY_EMOJI[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                    <TrendingUp className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="text-[13px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 ml-1">
                  Collection Shift <span className="text-primary">*</span>
                </label>
                <div className="flex p-1 rounded-2xl border-2 border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 h-14">
                  {["morning", "evening"].map((s) => {
                    const active = form.watch("shift") === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => form.setValue("shift", s)}
                        className={`flex-1 flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all ${
                          active 
                            ? "bg-white dark:bg-slate-700 text-primary shadow-sm ring-1 ring-black/5" 
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        {s === "morning" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Milk Quality Inputs ─────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-5 pt-2">
              {[
                { key: "fat", label: "FAT %", placeholder: "0.0", required: true },
                { key: "litter", label: "Liters", placeholder: "0.0", required: true },
                { key: "snf", label: "SNF", placeholder: "0.0", required: false },
                { key: "degree", label: "Degree", placeholder: "0.0", required: false },
              ].map(({ key, label, placeholder, required }) => (
                <div key={key} className="space-y-2.5">
                  <label className="text-[13px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 ml-1">
                    {label} {required && <span className="text-primary">*</span>}
                  </label>
                  <div className="relative group">
                    <input
                      type="number"
                      step="0.01"
                      placeholder={placeholder}
                      {...form.register(key)}
                      className="flex h-14 w-full rounded-2xl border-2 border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 px-5 py-2 text-xl font-black transition-all focus:border-primary focus:ring-0 placeholder:text-gray-200 dark:placeholder:text-gray-700"
                    />
                    {form.formState.errors[key] && (
                      <p className="text-[11px] text-red-500 font-bold absolute -bottom-5 left-1">{form.formState.errors[key].message}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* ── Live Amount Preview ─────────────────────────────────────── */}
            {previewAmount !== null && (
              <div className="relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-2 border-primary/20 mt-4 animate-in zoom-in-95 duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary">
                      <Calculator className="h-5 w-5" />
                      <span className="text-sm font-bold uppercase tracking-widest">Est. Amount</span>
                    </div>
                    <p className="text-[12px] text-gray-500 dark:text-gray-400 font-medium">
                      Based on {parseFloat(watchFat)}% FAT @ {formatRupees(currentRate?.ratePerFat)}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-4xl font-black text-primary tracking-tight">{formatRupees(previewAmount)}</p>
                    <p className="text-xs text-primary/60 font-bold mt-1">
                      Rate per Ltr: {formatRupees((parseFloat(watchFat || 0) * Number(currentRate?.ratePerFat || 0)).toFixed(2))}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Feedback Messages ───────────────────────────────────────── */}
            {successMsg && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-100 text-emerald-700 font-bold text-sm animate-in slide-in-from-bottom-2">
                <CheckCircle2 className="h-6 w-6 shrink-0" />
                {successMsg}
              </div>
            )}
            {submitError && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 border-2 border-red-100 text-red-700 font-bold text-sm animate-in slide-in-from-bottom-2">
                <AlertCircle className="h-6 w-6 shrink-0" />
                {submitError}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-16 rounded-2xl text-lg font-black tracking-widest uppercase shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
              disabled={!canSubmit}
            >
              {loading ? (
                <><Loader2 className="mr-3 h-6 w-6 animate-spin" />Recording...</>
              ) : noRateError ? (
                "Configure Rate First"
              ) : (
                "Submit Entry"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
