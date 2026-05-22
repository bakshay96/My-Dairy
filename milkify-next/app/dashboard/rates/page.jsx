"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import api from "@/lib/api";
import { toast } from "@/lib/toast";
import {
  RefreshCw,
  Sliders,
  Grid,
  CheckCircle,
  HelpCircle,
  Loader2,
  Save
} from "lucide-react";

const CATEGORY_CONFIG = {
  cow:     { label: "Cow Milk",     emoji: "🐄", color: "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400" },
  buffalo: { label: "Buffalo Milk", emoji: "🐃", color: "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400" },
  sheep:   { label: "Sheep Milk",   emoji: "🐑", color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" },
  goat:    { label: "Goat Milk",    emoji: "🐐", color: "bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400" },
};

const COOPERATIVE_DEFAULTS = {
  cow: {
    baseRate: 40.0,
    baseFat: 3.5,
    baseSnf: 8.5,
    fatPointValue: 0.20,
    snfPointValue: 0.10,
    minFat: 3.0,
    maxFat: 5.0,
    minSnf: 7.5,
    maxSnf: 9.5,
    minDegree: 24,
    maxDegree: 32,
    ratePerKgFat: 0,
    ratePerKgSnf: 0,
  },
  buffalo: {
    baseRate: 55.0,
    baseFat: 6.0,
    baseSnf: 9.0,
    fatPointValue: 0.30,
    snfPointValue: 0.15,
    minFat: 5.0,
    maxFat: 9.0,
    minSnf: 8.0,
    maxSnf: 10.5,
    minDegree: 26,
    maxDegree: 34,
    ratePerKgFat: 0,
    ratePerKgSnf: 0,
  },
  sheep: {
    baseRate: 50.0,
    baseFat: 5.0,
    baseSnf: 9.0,
    fatPointValue: 0.25,
    snfPointValue: 0.12,
    minFat: 4.0,
    maxFat: 8.0,
    minSnf: 8.0,
    maxSnf: 10.0,
    minDegree: 26,
    maxDegree: 34,
    ratePerKgFat: 0,
    ratePerKgSnf: 0,
  },
  goat: {
    baseRate: 45.0,
    baseFat: 4.0,
    baseSnf: 8.5,
    fatPointValue: 0.20,
    snfPointValue: 0.10,
    minFat: 3.0,
    maxFat: 7.0,
    minSnf: 7.5,
    maxSnf: 9.5,
    minDegree: 24,
    maxDegree: 32,
    ratePerKgFat: 0,
    ratePerKgSnf: 0,
  }
};

export default function RatesGeneratorPage() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("cow");
  const [previewMode, setPreviewMode] = useState("snf"); // "snf" or "degree"
  
  // Custom step size for UI compactness & performance
  const [fatStep, setFatStep] = useState(0.2);
  const [columnStep, setColumnStep] = useState(0.2); // snf/degree step

  // Form values
  const [formValues, setFormValues] = useState(COOPERATIVE_DEFAULTS.cow);

  // Fetch all active configurations
  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/rates");
      const activeConfigs = res.data || [];
      setConfigs(activeConfigs);
      
      // Populate form if active config exists for current category
      const currentConfig = activeConfigs.find(c => c.animalType === selectedCategory);
      if (currentConfig) {
        setFormValues(currentConfig);
      } else {
        setFormValues(COOPERATIVE_DEFAULTS[selectedCategory]);
      }
    } catch (err) {
      console.error("Failed to fetch rate configs:", err);
      toast.error("Could not load pricing configs.");
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  // Handle animal selection change
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    const existing = configs.find(c => c.animalType === category);
    if (existing) {
      setFormValues(existing);
    } else {
      setFormValues(COOPERATIVE_DEFAULTS[category]);
    }
  };

  // Form input changes
  const handleInputChange = (field, val) => {
    setFormValues(prev => ({
      ...prev,
      [field]: val
    }));
  };

  // Save rates
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Clean Mongoose metadata fields out of formValues before saving
      const cleanValues = { ...formValues };
      delete cleanValues._id;
      delete cleanValues.adminId;
      delete cleanValues.status;
      delete cleanValues.createdAt;
      delete cleanValues.updatedAt;
      delete cleanValues.__v;

      const payload = {
        ...cleanValues,
        animalType: selectedCategory,
      };

      // Client validation using explicit parsing to prevent lexicographical string comparisons
      const minFat = parseFloat(payload.minFat) || 0;
      const maxFat = parseFloat(payload.maxFat) || 0;
      const minSnf = parseFloat(payload.minSnf) || 0;
      const maxSnf = parseFloat(payload.maxSnf) || 0;
      const minDegree = parseFloat(payload.minDegree) || 0;
      const maxDegree = parseFloat(payload.maxDegree) || 0;

      if (minFat >= maxFat) {
        throw new Error("Min FAT must be strictly less than Max FAT.");
      }
      if (previewMode === "snf" && minSnf >= maxSnf) {
        throw new Error("Min SNF must be strictly less than Max SNF.");
      }
      if (previewMode === "degree" && minDegree >= maxDegree) {
        throw new Error("Min Degree must be strictly less than Max Degree.");
      }

      await api.post("/rates", payload);
      toast.success(`Pricing chart config for ${selectedCategory.toUpperCase()} saved successfully!`);
      fetchConfigs();
    } catch (err) {
      console.error(err);
      toast.error(err.message || err.response?.data?.message || "Failed to save pricing configuration.");
    } finally {
      setSaving(false);
    }
  };

  // Standard cooperative dairy formulas
  const calculateSnfFromDegree = (fat, degree) => {
    const f = parseFloat(fat) || 0;
    const d = parseFloat(degree) || 0;
    if (d <= 0) return 0;
    return parseFloat(((d / 4) + (0.21 * f) + 0.36).toFixed(2));
  };

  const calculateMilkRate = (fat, snf) => {
    const f = parseFloat(fat) || 0;
    const s = parseFloat(snf) || 0;
    const baseRate = parseFloat(formValues.baseRate) || 0;
    const baseFat = parseFloat(formValues.baseFat) || 0;
    const baseSnf = parseFloat(formValues.baseSnf) || 0;
    const fatPointValue = parseFloat(formValues.fatPointValue) || 0;
    const snfPointValue = parseFloat(formValues.snfPointValue) || 0;

    const fatDiff = Math.round((f - baseFat) * 10);
    const snfDiff = Math.round((s - baseSnf) * 10);

    const rate = baseRate + (fatDiff * fatPointValue) + (snfDiff * snfPointValue);
    return Math.max(0, parseFloat(rate.toFixed(2)));
  };

  // Generate matrix row and column headers safely using scaled integer loops (to prevent floating drift)
  const matrixHeaders = useMemo(() => {
    const minF = Math.round((parseFloat(formValues.minFat) || 0) * 10);
    const maxF = Math.round((parseFloat(formValues.maxFat) || 0) * 10);
    const stepF = Math.round(fatStep * 10);

    const fatList = [];
    for (let f = minF; f <= maxF; f += stepF) {
      fatList.push(f / 10);
    }

    const colList = [];
    if (previewMode === "snf") {
      const minS = Math.round((parseFloat(formValues.minSnf) || 0) * 10);
      const maxS = Math.round((parseFloat(formValues.maxSnf) || 0) * 10);
      const stepS = Math.round(columnStep * 10);
      for (let s = minS; s <= maxS; s += stepS) {
        colList.push(s / 10);
      }
    } else {
      // Degree columns (usually integer CLR increments, but scaled loop is safer)
      const minD = Math.round((parseFloat(formValues.minDegree) || 0) * 10);
      const maxD = Math.round((parseFloat(formValues.maxDegree) || 0) * 10);
      const stepD = Math.round(columnStep * 10);
      for (let d = minD; d <= maxD; d += stepD) {
        colList.push(d / 10);
      }
    }

    return { fatList, colList };
  }, [formValues.minFat, formValues.maxFat, formValues.minSnf, formValues.maxSnf, formValues.minDegree, formValues.maxDegree, fatStep, columnStep, previewMode]);

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="h-8 w-8 text-primary animate-pulse" />
            Milk Rates Generator &amp; Pricing Engine
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Build precise, cooperative-grade point-increment rate charts with live interactive 2D preview matrices.
          </p>
        </div>
        <button
          onClick={fetchConfigs}
          disabled={loading}
          className="self-start md:self-auto flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white/70 dark:bg-slate-950/70 backdrop-blur-md text-sm font-semibold hover:bg-slate-50 transition-all shadow-sm"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Overview of Active Configs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => {
          const activeCfg = configs.find(c => c.animalType === key);
          const isSelected = selectedCategory === key;
          
          return (
            <button
              key={key}
              onClick={() => handleCategoryChange(key)}
              className={`flex items-start gap-2 sm:gap-4 p-3 sm:p-5 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group ${
                isSelected
                  ? "bg-primary border-primary text-white shadow-xl shadow-primary/20 scale-102"
                  : "bg-white/80 dark:bg-slate-900/80 border-slate-200/60 dark:border-slate-800/80 hover:bg-slate-50/50 hover:shadow-md"
              }`}
            >
              {/* Card Glow Effect */}
              <div className={`absolute -right-8 -top-8 w-20 h-20 sm:w-24 sm:h-24 rounded-full filter blur-xl opacity-20 transition-all group-hover:scale-110 ${
                isSelected ? "bg-white" : "bg-primary"
              }`} />
              
              <span className="text-2xl sm:text-3xl filter drop-shadow-sm group-hover:animate-bounce mt-1">{cfg.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-[10px] sm:text-xs font-black uppercase tracking-wider ${
                  isSelected ? "text-white/80" : "text-slate-400 dark:text-slate-500"
                }`}>
                  {cfg.label}
                </p>
                {activeCfg ? (
                  <div className="mt-1">
                    <p className={`text-base sm:text-lg font-black tracking-tight ${
                      isSelected ? "text-white" : "text-slate-950 dark:text-white"
                    }`}>
                      ₹{activeCfg.baseRate.toFixed(2)}/L
                    </p>
                    <p className={`text-[9px] sm:text-[11px] font-semibold mt-0.5 truncate ${
                      isSelected ? "text-white/85" : "text-slate-500 dark:text-slate-400"
                    }`}>
                      FAT {activeCfg.baseFat}% • SNF {activeCfg.baseSnf}%
                    </p>
                    <span className={`inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0.5 rounded-full mt-2 ${
                      isSelected 
                        ? "bg-white/20 text-white" 
                        : "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/55"
                    }`}>
                      <CheckCircle className="w-2.5 h-2.5 shrink-0" />
                      Active
                    </span>
                  </div>
                ) : (
                  <div className="mt-1">
                    <p className={`text-xs sm:text-sm font-extrabold italic ${
                      isSelected ? "text-white/70" : "text-slate-400"
                    }`}>
                      Not Configured
                    </p>
                    <p className={`text-[9px] sm:text-[10px] mt-1 truncate ${
                      isSelected ? "text-white/60" : "text-slate-400"
                    }`}>
                      Using legacy rates
                    </p>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Configurator Parameters Form */}
        <form onSubmit={handleSave} className="lg:col-span-5 bg-white/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800/80 backdrop-blur-md rounded-2xl shadow-xl p-6 space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-950 dark:text-white uppercase tracking-wider">
                {selectedCategory} parameters
              </h2>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                Define base rates, modifiers, and preview ranges.
              </p>
            </div>
          </div>

          {/* Pricing Engine Fields */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Pricing Increments (Base &amp; Steps)
            </h3>
            
            <div className="grid grid-cols-3 gap-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                  Base Rate (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formValues.baseRate}
                  onChange={(e) => handleInputChange("baseRate", e.target.value)}
                  className="w-full h-10 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 px-3 text-sm font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-950 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                  Base FAT (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={formValues.baseFat}
                  onChange={(e) => handleInputChange("baseFat", e.target.value)}
                  className="w-full h-10 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 px-3 text-sm font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-950 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                  Base SNF (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={formValues.baseSnf}
                  onChange={(e) => handleInputChange("baseSnf", e.target.value)}
                  className="w-full h-10 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 px-3 text-sm font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-950 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800/80">
                <label className="text-[10px] font-black uppercase tracking-wide text-slate-500 block">
                  FAT Point Value (₹/0.1%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formValues.fatPointValue}
                  onChange={(e) => handleInputChange("fatPointValue", e.target.value)}
                  className="w-full h-9 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 px-2.5 text-sm font-extrabold rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-950 dark:text-white"
                />
                <span className="text-[9px] text-slate-400 font-medium block">
                  Adds/deducts per 0.1% fat offset.
                </span>
              </div>

              <div className="space-y-1.5 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800/80">
                <label className="text-[10px] font-black uppercase tracking-wide text-slate-500 block">
                  SNF Point Value (₹/0.1%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formValues.snfPointValue}
                  onChange={(e) => handleInputChange("snfPointValue", e.target.value)}
                  className="w-full h-9 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 px-2.5 text-sm font-extrabold rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-950 dark:text-white"
                />
                <span className="text-[9px] text-slate-400 font-medium block">
                  Adds/deducts per 0.1% snf offset.
                </span>
              </div>
            </div>
          </div>

          {/* Matrix Boundaries */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Chart/Matrix Bounds &amp; Limits
            </h3>

            <div className="space-y-3">
              {/* FAT Bounds */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                    Min FAT Bound (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formValues.minFat}
                    onChange={(e) => handleInputChange("minFat", e.target.value)}
                    className="w-full h-9 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 px-3 text-sm font-extrabold rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-950 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                    Max FAT Bound (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formValues.maxFat}
                    onChange={(e) => handleInputChange("maxFat", e.target.value)}
                    className="w-full h-9 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 px-3 text-sm font-extrabold rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-950 dark:text-white"
                  />
                </div>
              </div>

              {/* Toggle-dependent bounds */}
              {previewMode === "snf" ? (
                <div className="grid grid-cols-2 gap-3 animate-fade-in">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                      Min SNF Bound (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={formValues.minSnf}
                      onChange={(e) => handleInputChange("minSnf", e.target.value)}
                      className="w-full h-9 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 px-3 text-sm font-extrabold rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-950 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                      Max SNF Bound (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={formValues.maxSnf}
                      onChange={(e) => handleInputChange("maxSnf", e.target.value)}
                      className="w-full h-9 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 px-3 text-sm font-extrabold rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-950 dark:text-white"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 animate-fade-in">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                      Min Degree Bound (CLR)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      required
                      value={formValues.minDegree}
                      onChange={(e) => handleInputChange("minDegree", e.target.value)}
                      className="w-full h-9 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 px-3 text-sm font-extrabold rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-950 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                      Max Degree Bound (CLR)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      required
                      value={formValues.maxDegree}
                      onChange={(e) => handleInputChange("maxDegree", e.target.value)}
                      className="w-full h-9 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 px-3 text-sm font-extrabold rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-950 dark:text-white"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-11 bg-primary hover:bg-primary/95 text-white font-black text-sm uppercase tracking-wider rounded-xl transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Config...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Pricing Config
                </>
              )}
            </button>
          </div>
        </form>

        {/* Right Side: Interactive 2D Matrix Preview */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800/80 backdrop-blur-md rounded-2xl shadow-xl p-6 flex flex-col h-full min-h-[500px]">
            {/* Matrix Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600">
                  <Grid className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-950 dark:text-white uppercase tracking-wider">
                    2D Rate Chart Preview
                  </h2>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    Calculated milk purchase rates (INR / Liter) based on inputs.
                  </p>
                </div>
              </div>

              {/* Mode Toggles */}
              <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-950 p-1 self-start sm:self-auto border dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setPreviewMode("snf")}
                  className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                    previewMode === "snf"
                      ? "bg-white dark:bg-slate-900 text-primary shadow-sm"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  FAT vs SNF
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("degree")}
                  className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                    previewMode === "degree"
                      ? "bg-white dark:bg-slate-900 text-primary shadow-sm"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  FAT vs DEGREE
                </button>
              </div>
            </div>

            {/* Matrix Step Sizes Controller */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-3 bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800/80 px-3.5 rounded-lg mt-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 shrink-0">FAT Row Step:</span>
                <select
                  value={fatStep}
                  onChange={(e) => setFatStep(parseFloat(e.target.value))}
                  className="h-8 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-xs font-black rounded px-2 text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value="0.1">0.1 % (Dense)</option>
                  <option value="0.2">0.2 % (Normal)</option>
                  <option value="0.5">0.5 % (Sparse)</option>
                  <option value="1.0">1.0 % (Summary)</option>
                </select>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 shrink-0">
                  {previewMode === "snf" ? "SNF" : "Degree"} Col Step:
                </span>
                <select
                  value={columnStep}
                  onChange={(e) => setColumnStep(parseFloat(e.target.value))}
                  className="h-8 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-xs font-black rounded px-2 text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  {previewMode === "snf" ? (
                    <>
                      <option value="0.1">0.1 % (Dense)</option>
                      <option value="0.2">0.2 % (Normal)</option>
                      <option value="0.5">0.5 % (Sparse)</option>
                      <option value="1.0">1.0 % (Summary)</option>
                    </>
                  ) : (
                    <>
                      <option value="0.5">0.5 CLR</option>
                      <option value="1.0">1.0 CLR</option>
                      <option value="2.0">2.0 CLR</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* Matrix Viewport */}
            <div className="flex-1 mt-4 overflow-auto border border-slate-100 dark:border-slate-800 rounded-xl relative max-h-[500px]">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-950 sticky top-0 z-10">
                  <tr>
                    {/* Header Top-Left Pivot */}
                    <th className="px-3 py-2.5 text-xs font-black text-slate-400 uppercase border border-slate-100 dark:border-slate-800 text-center sticky left-0 bg-slate-50 dark:bg-slate-950 z-20">
                      FAT \ {previewMode === "snf" ? "SNF" : "CLR"}
                    </th>
                    {/* Column Headers */}
                    {matrixHeaders.colList.map((colVal) => (
                      <th
                        key={colVal}
                        className="px-3 py-2.5 text-xs font-black text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800 text-center"
                      >
                        {colVal.toFixed(1)}
                        {previewMode === "snf" ? "%" : ""}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {matrixHeaders.fatList.map((fatVal) => (
                    <tr key={fatVal} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      {/* Row Header */}
                      <td className="px-3 py-2 text-xs font-black text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800 text-center sticky left-0 bg-white dark:bg-slate-900 z-10 font-mono">
                        {fatVal.toFixed(1)}%
                      </td>
                      {/* Grid Cells */}
                      {matrixHeaders.colList.map((colVal) => {
                        let finalSnf = 0;
                        if (previewMode === "snf") {
                          finalSnf = colVal;
                        } else {
                          // Richmond's degree to SNF conversion
                          finalSnf = calculateSnfFromDegree(fatVal, colVal);
                        }
                        const cellPrice = calculateMilkRate(fatVal, finalSnf);

                        // Highlight cells at the base rate
                        const isBaseCell = Math.abs(fatVal - parseFloat(formValues.baseFat || 0)) < 0.05 && 
                                           (previewMode === "snf" 
                                             ? Math.abs(colVal - parseFloat(formValues.baseSnf || 0)) < 0.05
                                             : Math.abs(finalSnf - parseFloat(formValues.baseSnf || 0)) < 0.2); // larger tolerance for degree rounding
                        
                        return (
                          <td
                            key={colVal}
                            className={`px-2 py-1.5 text-2xs font-extrabold border border-slate-100 dark:border-slate-800 text-center font-mono transition-all ${
                              isBaseCell 
                                ? "bg-primary/10 text-primary border-primary/30 font-black shadow-inner" 
                                : cellPrice === 0 
                                  ? "text-slate-300 dark:text-slate-600 bg-slate-50/30" 
                                  : "text-slate-700 dark:text-slate-300"
                            }`}
                            title={`FAT: ${fatVal.toFixed(1)}%, ${previewMode === "snf" ? "SNF" : "CLR"}: ${colVal.toFixed(1)}% => SNF: ${finalSnf}%`}
                          >
                            ₹{cellPrice.toFixed(2)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Matrix Legend / Help Info */}
            <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 space-y-2">
              <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-700 dark:text-slate-300">
                <HelpCircle className="h-4 w-4 text-primary" /> Formula Details
              </div>
              <ul className="text-3xs sm:text-2xs font-semibold list-disc list-inside space-y-1 leading-relaxed">
                <li>
                  <strong className="text-slate-700 dark:text-slate-300">Point Increment Formula:</strong> Rate = BaseRate + (ActualFat - BaseFat) × 10 × FatPointValue + (ActualSnf - BaseSnf) × 10 × SnfPointValue
                </li>
                {previewMode === "degree" && (
                  <li>
                    <strong className="text-slate-700 dark:text-slate-300">Richmond&apos;s Formula:</strong> SNF% = (CLR / 4) + (0.21 × FAT) + 0.36
                  </li>
                )}
                <li>
                  <span className="inline-block w-2.5 h-2.5 rounded bg-primary/20 mr-1.5 align-middle border border-primary/20" />
                  Highlights represent cells close to your configured Base FAT &amp; Base SNF coordinates (Base Rate: ₹{parseFloat(formValues.baseRate || 0).toFixed(2)}).
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
