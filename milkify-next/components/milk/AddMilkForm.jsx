"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Loader2, Search, X, TrendingUp, Sun, Moon, 
  Droplet, Layers, Beaker, Gauge, Calculator
} from "lucide-react";
import { formatRupees } from "@/lib/utils";
import { toast } from "@/lib/toast";

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

export default function AddMilkForm() {
  const [loading, setLoading] = useState(false);
  const [allFarmers, setAllFarmers] = useState([]);
  const [farmersLoading, setFarmersLoading] = useState(true);
  const [activeRates, setActiveRates] = useState({});
  const [ratesLoading, setRatesLoading] = useState(true);
  const [noRateError, setNoRateError] = useState("");
  
  const [farmerSearch, setFarmerSearch] = useState("");
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [submitError, setSubmitError] = useState("");

  const containerRef = useRef(null);

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
  const watchShift = form.watch("shift");

  const previewAmount = useMemo(() => {
    const rate = activeRates[watchCategory];
    if (!rate || !watchFat || !watchLitter) return null;
    return parseFloat((parseFloat(watchFat) * rate.ratePerFat * parseFloat(watchLitter)).toFixed(2));
  }, [watchCategory, watchFat, watchLitter, activeRates]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [fRes, rRes] = await Promise.all([api.get("/farmer"), api.get("/rate/active")]);
        setAllFarmers(fRes.data?.farmers || fRes.data || []);
        const rates = rRes.data?.rates || [];
        const map = {};
        rates.forEach((r) => { map[r.milkCategory] = r; });
        setActiveRates(map);
      } catch (e) {
        console.error("Data load error:", e);
      } finally {
        setFarmersLoading(false);
        setRatesLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!ratesLoading) {
      setNoRateError(activeRates[watchCategory] ? "" : `No rate for "${watchCategory}".`);
    }
  }, [watchCategory, activeRates, ratesLoading]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredFarmers = useMemo(() => {
    const q = farmerSearch.toLowerCase().trim();
    if (!q) return allFarmers;
    return allFarmers.filter((f) => f.name?.toLowerCase().includes(q) || String(f.mobile || "").includes(q));
  }, [allFarmers, farmerSearch]);

  const handleSelectFarmer = (farmer) => {
    setSelectedFarmer(farmer);
    form.setValue("farmerId", farmer._id);
    setFarmerSearch("");
    setShowSuggestions(false);
  };

  const onSubmit = async (values) => {
    setLoading(true);
    setSuccessMsg("");
    setSubmitError("");
    try {
      const res = await api.post(`/milk/${values.farmerId}`, values);
      const amount = res.data?.milk?.calculatedAmount || previewAmount || 0;
      
      const successText = `✓ ${values.litter}L added to ${selectedFarmer.name}'s account. Total: ${formatRupees(amount)}`;
      setSuccessMsg(successText);
      toast.success("Milk entry added");
      
      setAllFarmers(prev => prev.map(f => 
        f._id === values.farmerId 
          ? { 
              ...f, 
              submittedMorning: values.shift === "morning" ? true : f.submittedMorning,
              submittedEvening: values.shift === "evening" ? true : f.submittedEvening
            } 
          : f
      ));
      
      form.reset({ category: values.category, fat: "", snf: "", degree: "", litter: "", farmerId: "", shift: values.shift });
      setSelectedFarmer(null);
      setTimeout(() => setSuccessMsg(""), 6000);
    } catch (error) {
      setSubmitError(error.response?.data?.message || "Error");
      toast.error("Failed");
    } finally {
      setLoading(false);
    }
  };

  const currentRate = activeRates[watchCategory];
  const canSubmit = !loading && !!selectedFarmer && !!watchFat && !!watchLitter;

  return (
    <div className="max-w-2xl mx-auto p-1 sm:p-4">
      <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg bg-white dark:bg-slate-900 transition-colors duration-300">
        
        {/* Header Section */}
        <CardHeader className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 text-primary">
                {watchShift === "morning" ? <Sun className="h-4 w-4 sm:h-5 sm:w-5" /> : <Moon className="h-4 w-4 sm:h-5 sm:w-5" />}
              </div>
              <h2 className="text-[11px] sm:text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
                {watchShift} Collection
              </h2>
            </div>
            {currentRate && (
              <div className="flex flex-col items-end animate-in fade-in slide-in-from-right-1">
                <div className="flex items-center gap-1 text-primary">
                  <TrendingUp className="h-3 w-3" />
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-tighter">{watchCategory} Rate</span>
                </div>
                <p className="text-[10px] sm:text-xs font-bold text-slate-600 dark:text-slate-300 leading-none mt-0.5">
                  {formatRupees(currentRate.ratePerFat)}<span className="text-[8px] opacity-70">/fat</span>
                </p>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            {/* 1. Farmer Selection */}
            <div className="space-y-1.5" ref={containerRef}>
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">Farmer Info</label>
              <div className="relative">
                {!selectedFarmer ? (
                  <>
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Name or mobile..."
                      value={farmerSearch}
                      onFocus={() => setShowSuggestions(true)}
                      onChange={(e) => {
                        setFarmerSearch(e.target.value);
                        setShowSuggestions(true);
                      }}
                      className="w-full h-11 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                    {showSuggestions && (
                      <div className="absolute z-[100] w-full mt-1 bg-white dark:bg-slate-800 border-2 border-primary/20 rounded-xl shadow-2xl max-h-60 overflow-y-scroll overscroll-contain">
                        {farmersLoading ? (
                          <div className="p-8 flex items-center justify-center gap-2 text-slate-400">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-xs font-bold italic">Loading farmers...</span>
                          </div>
                        ) : filteredFarmers.length > 0 ? (
                          filteredFarmers.map((f) => (
                            <div
                              key={f._id}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleSelectFarmer(f);
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-primary/5 dark:hover:bg-primary/10 border-b last:border-0 border-slate-100 dark:border-slate-700 transition-colors group/row cursor-pointer"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-bold text-sm text-slate-900 dark:text-white">{f.name}</p>
                                    {(watchShift === "morning" ? f.submittedMorning : f.submittedEvening) && (
                                      <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[9px] px-1.5 py-0.5 rounded font-black tracking-widest uppercase">Submitted</span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-slate-500">{f.mobile}</p>
                                </div>
                                <div className="text-[10px] font-bold text-primary bg-primary/5 group-hover/row:bg-primary group-hover/row:text-white px-2 py-0.5 rounded transition-colors uppercase tracking-widest">Select</div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-slate-400 text-xs italic">No results found...</div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-between h-11 px-3 sm:px-4 bg-primary/5 border border-primary/20 rounded-xl">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-primary text-white flex items-center justify-center font-black text-[10px] sm:text-xs">
                        {selectedFarmer.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{selectedFarmer.name}</span>
                      {(watchShift === "morning" ? selectedFarmer.submittedMorning : selectedFarmer.submittedEvening) && (
                        <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[9px] px-1.5 py-0.5 rounded font-black tracking-widest uppercase shrink-0">Submitted</span>
                      )}
                    </div>
                    <button type="button" onClick={() => { setSelectedFarmer(null); form.setValue("farmerId", ""); }} className="text-slate-400 hover:text-red-500 transition-colors shrink-0">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <Separator className="opacity-50" />

            {/* 2. Animal & Shift */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">Animal</label>
                <div className="relative">
                  <select
                    {...form.register("category")}
                    className="w-full h-11 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl px-3 sm:px-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                  >
                    {Object.keys(CATEGORY_EMOJI).map(cat => (
                      <option key={cat} value={cat}>{CATEGORY_EMOJI[cat]} {cat.toUpperCase()}</option>
                    ))}
                  </select>
                  <TrendingUp className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
                </div>
                {currentRate && (
                  <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 leading-none mt-1 ml-1">
                    {formatRupees(currentRate.ratePerFat)}/fat {currentRate.useSnf && `+ ${formatRupees(currentRate.ratePerSnf)}/snf`}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">Shift</label>
                <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl h-11">
                  <button
                    type="button"
                    onClick={() => form.setValue("shift", "morning")}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                      watchShift === "morning" ? "bg-white dark:bg-slate-700 text-primary shadow-sm" : "text-slate-400"
                    }`}
                  >
                    <Sun className="h-3 w-3" /> MOR
                  </button>
                  <button
                    type="button"
                    onClick={() => form.setValue("shift", "evening")}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                      watchShift === "evening" ? "bg-white dark:bg-slate-700 text-primary shadow-sm" : "text-slate-400"
                    }`}
                  >
                    <Moon className="h-3 w-3" /> EVE
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Fat & Liters */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">Fat %</label>
                <div className="relative">
                  <Layers className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="number" step="0.1" placeholder="0.0"
                    {...form.register("fat")}
                    className="w-full h-11 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">Liters</label>
                <div className="relative">
                  <Droplet className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="number" step="0.01" placeholder="0.0"
                    {...form.register("litter")}
                    className="w-full h-11 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>

            {/* 4. SNF & CLR */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">SNF</label>
                <div className="relative">
                  <Beaker className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="number" step="0.01" placeholder="0.0"
                    {...form.register("snf")}
                    className="w-full h-11 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 opacity-70"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">CLR</label>
                <div className="relative">
                  <Gauge className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="number" step="1" placeholder="0"
                    {...form.register("degree")}
                    className="w-full h-11 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 opacity-70"
                  />
                </div>
              </div>
            </div>

            {/* Status Messages */}
            {selectedFarmer && (watchShift === "morning" ? selectedFarmer.submittedMorning : selectedFarmer.submittedEvening) && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 rounded-xl text-[10px] sm:text-xs font-bold border border-amber-200 dark:border-amber-900/30 animate-in fade-in zoom-in-95">
                <div className="flex items-center gap-2">
                  <span className="text-sm">⚠️</span>
                  Note: {selectedFarmer.name} has already submitted milk for the {watchShift} shift today.
                </div>
              </div>
            )}

            {noRateError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-xl text-[10px] sm:text-xs font-bold border border-red-100 dark:border-red-900/30 animate-in fade-in zoom-in-95">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3 w-3 shrink-0" />
                  {noRateError}
                </div>
              </div>
            )}

            {submitError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-xl text-[10px] sm:text-xs font-bold border border-red-100 dark:border-red-900/30 animate-in shake-in">
                {submitError}
              </div>
            )}

            {successMsg && <div className="p-2 sm:p-3 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-[10px] sm:text-xs font-bold border border-emerald-100 dark:border-emerald-900/30 animate-in slide-in-from-bottom-2">{successMsg}</div>}

            {/* Summary Preview */}
            {previewAmount !== null && currentRate && (
              <div className="p-3 sm:p-4 bg-primary/5 dark:bg-primary/10 border-2 border-primary/20 rounded-2xl">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-start gap-2 sm:gap-2.5">
                    <div className="mt-0.5 p-1 sm:p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
                      <Calculator className="h-3 w-3 sm:h-4 sm:w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest">Amount</div>
                      <div className="text-[9px] sm:text-[10px] font-bold text-primary mt-0.5 truncate">
                        {watchFat}% FAT @ {formatRupees(currentRate.ratePerFat)}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-lg sm:text-2xl font-black text-primary leading-none">
                      {formatRupees(previewAmount)}
                    </div>
                    <div className="text-[8px] sm:text-[10px] font-bold text-slate-500 mt-1 sm:mt-1.5">
                      Rate/Ltr: {formatRupees(parseFloat(watchFat) * currentRate.ratePerFat)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={!canSubmit}
              className="w-full h-11 sm:h-12 rounded-xl text-[11px] sm:text-xs font-black tracking-widest uppercase text-white shadow-md active:scale-[0.98] transition-all bg-primary hover:bg-primary/90"
            >
              {loading ? (
                <><Loader2 className="mr-2 h-3 w-3 animate-spin" />Recording...</>
              ) : noRateError ? (
                "No Rate S  et"
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