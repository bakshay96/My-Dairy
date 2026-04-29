"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2, AlertCircle, CheckCircle2, Search, X, TrendingUp, Sun, Moon, Calculator
} from "lucide-react";
import { formatRupees } from "@/lib/utils";
import { toast } from "@/lib/toast";

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
  const watchShift = form.watch("shift");

  // Dynamic theme colors based on shift
  const theme = watchShift === "morning" 
    ? {
        primary: "amber-600",
        bg: "bg-amber-50/50",
        border: "border-amber-200",
        focusBorder: "focus:border-amber-600",
        focusRing: "focus-visible:ring-amber-600/20",
        activeRing: "ring-amber-600/30",
        btn: "bg-amber-600 hover:bg-amber-700",
        text: "text-amber-700",
        icon: <Sun className="h-4 w-4" />,
        shadow: "shadow-amber-100"
      }
    : {
        primary: "indigo-600",
        bg: "bg-indigo-50/50",
        border: "border-indigo-200",
        focusBorder: "focus:border-indigo-600",
        focusRing: "focus-visible:ring-indigo-600/20",
        activeRing: "ring-indigo-600/30",
        btn: "bg-indigo-600 hover:bg-indigo-700",
        text: "text-indigo-700",
        icon: <Moon className="h-4 w-4" />,
        shadow: "shadow-indigo-100"
      };

  return (
    <div className={`max-w-xl mx-auto px-1 sm:px-0 pb-4 transition-colors duration-500`}>
      <Card className={`shadow-2xl border-2 ${theme.border} bg-white/90 dark:bg-slate-900/90 backdrop-blur-md overflow-hidden transition-all duration-500 ${theme.shadow}`}>
        <CardHeader className={`py-2 px-4 border-b ${theme.border} ${theme.bg}`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${theme.bg} ${theme.text}`}>
                {theme.icon}
              </div>
              <span className={`font-black text-xs ${theme.text} uppercase tracking-tight`}>{watchShift} Entry</span>
            </div>

            {currentRate && (
              <div className="flex flex-col items-end animate-in fade-in slide-in-from-right-1">
                <div className={`flex items-center gap-1 ${theme.text}`}>
                  <TrendingUp className="h-3 w-3" />
                  <span className="text-[10px] font-black uppercase tracking-tighter">{watchCategory} Rate</span>
                </div>
                <p className="text-[10px] font-bold text-gray-600 dark:text-gray-300 leading-none mt-0.5">
                  {formatRupees(currentRate.ratePerFat)}/fat
                  {currentRate.useSnf && ` + ${formatRupees(currentRate.ratePerSnf)}/snf`}
                </p>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">

            {/* ── Farmer Search & Select ──────────────────────────────────── */}
            <div className="space-y-1">
              <label className={`text-[10px] font-black uppercase tracking-widest ${theme.text} opacity-70 ml-0.5`}>
                Farmer <span className="text-red-500">*</span>
              </label>

              {selectedFarmer ? (
                <div className={`flex items-center justify-between p-2 rounded-xl border-2 ${theme.border} ${theme.bg} group transition-all animate-in fade-in slide-in-from-top-1`}>
                  <div className="flex items-center gap-2">
                    <div className={`h-8 w-8 rounded-full ${theme.bg} flex items-center justify-center ${theme.text} font-bold text-xs border ${theme.border}`}>
                      {selectedFarmer.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className={`font-black text-sm ${theme.text} leading-none`}>{selectedFarmer.name}</p>
                      <p className={`text-[10px] font-medium opacity-70 ${theme.text} mt-0.5`}>{selectedFarmer.mobile}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearFarmer}
                    className={`p-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors ${theme.text} opacity-50 hover:opacity-100`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 transition-colors group-focus-within:text-primary" />
                  <input
                    type="text"
                    placeholder="Search name or mobile..."
                    value={farmerSearch}
                    onChange={(e) => {
                      setFarmerSearch(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setIsDropdownOpen(false), 250)}
                    className={`flex h-10 w-full rounded-xl border-2 ${theme.border} ${theme.bg} pl-10 pr-4 py-1 text-sm font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 ${theme.focusRing} ${theme.focusBorder}`}
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className={`text-[10px] font-black uppercase tracking-widest ${theme.text} opacity-70 ml-0.5`}>
                  Animal <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    {...form.register("category")}
                    className={`flex h-10 w-full rounded-xl border-2 ${theme.border} ${theme.bg} px-4 py-1 text-sm font-black appearance-none transition-all ${theme.focusBorder} focus:ring-0`}
                  >
                    {["cow", "buffalo", "goat", "sheep"].map((c) => (
                      <option key={c} value={c}>{CATEGORY_EMOJI[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <TrendingUp className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={`text-[10px] font-black uppercase tracking-widest ${theme.text} opacity-70 ml-0.5`}>
                  Shift <span className="text-red-500">*</span>
                </label>
                <div className={`flex p-1 rounded-xl border-2 ${theme.border} ${theme.bg} h-10`}>
                  {["morning", "evening"].map((s) => {
                    const active = watchShift === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => form.setValue("shift", s)}
                        className={`flex-1 flex items-center justify-center gap-1 rounded-lg text-[10px] font-black uppercase transition-all duration-300 ${
                          active 
                            ? `bg-white dark:bg-slate-700 ${theme.text} shadow-md ring-2 ${theme.activeRing} scale-105` 
                            : "text-gray-400 hover:text-gray-600"
                        }`}
                      >
                        {s === "morning" ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
                        <span>{s === "morning" ? "MOR" : "EVE"}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Milk Quality Inputs ─────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              {[
                { key: "fat", label: "FAT %", placeholder: "0.0", required: true },
                { key: "litter", label: "Liters", placeholder: "0.0", required: true },
                { key: "snf", label: "SNF", placeholder: "0.0", required: false },
                { key: "degree", label: "CLR", placeholder: "0", required: false },
              ].map(({ key, label, placeholder, required }) => (
                <div key={key} className="space-y-1.5">
                  <label className={`text-[10px] font-black uppercase tracking-widest ${theme.text} opacity-70 ml-0.5`}>
                    {label} {required && <span className="text-red-500">*</span>}
                  </label>
                  <div className="relative group">
                    <input
                      type="number"
                      step="0.01"
                      placeholder={placeholder}
                      {...form.register(key)}
                      className={`flex h-10 w-full rounded-xl border-2 ${theme.border} ${theme.bg} px-4 py-1 text-base font-black transition-all ${theme.focusBorder} focus:ring-0 placeholder:text-gray-300 dark:placeholder:text-gray-600`}
                    />
                    {form.formState.errors[key] && (
                      <p className="text-[9px] text-red-500 font-bold absolute -bottom-3.5 left-0.5">{form.formState.errors[key].message}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* ── Live Amount Preview ─────────────────────────────────────── */}
            {previewAmount !== null && (
              <div className={`relative overflow-hidden p-2 rounded-xl bg-gradient-to-br from-${theme.primary}/10 via-${theme.primary}/5 to-transparent border-2 ${theme.border} mt-0.5 animate-in zoom-in-95 duration-300`}>
                <div className="flex items-center justify-between">
                  <div className="space-y-0">
                    <div className={`flex items-center gap-1 ${theme.text}`}>
                      <Calculator className="h-3 w-3" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Est. Amount</span>
                    </div>
                    <p className={`text-[8px] font-bold opacity-60 ${theme.text}`}>
                      {parseFloat(watchFat)}% FAT @ {formatRupees(currentRate?.ratePerFat)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-black ${theme.text} tracking-tight`}>{formatRupees(previewAmount)}</p>
                    <p className={`text-[8px] font-black opacity-50 ${theme.text} leading-none`}>
                      Rate/Ltr: {formatRupees((parseFloat(watchFat || 0) * Number(currentRate?.ratePerFat || 0)).toFixed(2))}
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
              className={`w-full h-10 rounded-xl text-[11px] font-black tracking-widest uppercase shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 ${theme.btn}`}
              disabled={!canSubmit}
            >
              {loading ? (
                <><Loader2 className="mr-2 h-3 w-3 animate-spin" />Recording...</>
              ) : noRateError ? (
                "No Rate Set"
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
