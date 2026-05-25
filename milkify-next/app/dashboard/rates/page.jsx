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
  Save,
  Plus,
  Trash2,
  Layers,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronUp,
  IndianRupee,
} from "lucide-react";

const CATEGORY_CONFIG = {
  cow:     { label: "Cow Milk",     emoji: "🐄", color: "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400" },
  buffalo: { label: "Buffalo Milk", emoji: "🐃", color: "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400" },
  sheep:   { label: "Sheep Milk",   emoji: "🐑", color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" },
  goat:    { label: "Goat Milk",    emoji: "🐐", color: "bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400" },
};

const COOPERATIVE_DEFAULTS = {
  cow: {
    baseRate: 40.0, baseFat: 3.5, baseSnf: 8.5,
    fatPointValue: 0.20, snfPointValue: 0.10,
    minFat: 3.0, maxFat: 5.0, minSnf: 7.5, maxSnf: 9.5,
    minDegree: 24, maxDegree: 32,
    ratePerKgFat: 0, ratePerKgSnf: 0,
    fatSlabs: [], snfSlabs: [],
  },
  buffalo: {
    baseRate: 55.0, baseFat: 6.0, baseSnf: 9.0,
    fatPointValue: 0.30, snfPointValue: 0.15,
    minFat: 5.0, maxFat: 9.0, minSnf: 8.0, maxSnf: 10.5,
    minDegree: 26, maxDegree: 34,
    ratePerKgFat: 0, ratePerKgSnf: 0,
    fatSlabs: [], snfSlabs: [],
  },
  sheep: {
    baseRate: 50.0, baseFat: 5.0, baseSnf: 9.0,
    fatPointValue: 0.25, snfPointValue: 0.12,
    minFat: 4.0, maxFat: 8.0, minSnf: 8.0, maxSnf: 10.0,
    minDegree: 26, maxDegree: 34,
    ratePerKgFat: 0, ratePerKgSnf: 0,
    fatSlabs: [], snfSlabs: [],
  },
  goat: {
    baseRate: 45.0, baseFat: 4.0, baseSnf: 8.5,
    fatPointValue: 0.20, snfPointValue: 0.10,
    minFat: 3.0, maxFat: 7.0, minSnf: 7.5, maxSnf: 9.5,
    minDegree: 24, maxDegree: 32,
    ratePerKgFat: 0, ratePerKgSnf: 0,
    fatSlabs: [], snfSlabs: [],
  }
};

export default function RatesGeneratorPage() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("cow");
  const [previewMode, setPreviewMode] = useState("snf");

  const [fatStep, setFatStep] = useState(0.2);
  const [columnStep, setColumnStep] = useState(0.2);

  const [formValues, setFormValues] = useState(COOPERATIVE_DEFAULTS.cow);

  // Slab state
  const [slabsEnabled, setSlabsEnabled] = useState(false);
  const [fatSlabs, setFatSlabs] = useState([]);
  const [snfSlabs, setSnfSlabs] = useState([]);
  const [slabSectionOpen, setSlabSectionOpen] = useState(true);

  // Fetch all active configurations
  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/rates");
      const activeConfigs = res.data?.data || res.data || [];
      setConfigs(activeConfigs);

      const currentConfig = activeConfigs.find(c => c.animalType === selectedCategory);
      if (currentConfig) {
        setFormValues(currentConfig);
        const hasFatSlabs = Array.isArray(currentConfig.fatSlabs) && currentConfig.fatSlabs.length > 0;
        const hasSnfSlabs = Array.isArray(currentConfig.snfSlabs) && currentConfig.snfSlabs.length > 0;
        setFatSlabs(hasFatSlabs ? currentConfig.fatSlabs : []);
        setSnfSlabs(hasSnfSlabs ? currentConfig.snfSlabs : []);
        setSlabsEnabled(hasFatSlabs || hasSnfSlabs);
      } else {
        setFormValues(COOPERATIVE_DEFAULTS[selectedCategory]);
        setFatSlabs([]);
        setSnfSlabs([]);
        setSlabsEnabled(false);
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

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    const existing = configs.find(c => c.animalType === category);
    if (existing) {
      setFormValues(existing);
      const hasFatSlabs = Array.isArray(existing.fatSlabs) && existing.fatSlabs.length > 0;
      const hasSnfSlabs = Array.isArray(existing.snfSlabs) && existing.snfSlabs.length > 0;
      setFatSlabs(hasFatSlabs ? existing.fatSlabs : []);
      setSnfSlabs(hasSnfSlabs ? existing.snfSlabs : []);
      setSlabsEnabled(hasFatSlabs || hasSnfSlabs);
    } else {
      setFormValues(COOPERATIVE_DEFAULTS[category]);
      setFatSlabs([]);
      setSnfSlabs([]);
      setSlabsEnabled(false);
    }
  };

  const handleInputChange = (field, val) => {
    setFormValues(prev => ({ ...prev, [field]: val }));
  };

  // ── Slab CRUD Handlers ──────────────────────────────────────────────
  const addFatSlab = () => {
    const lastTo = fatSlabs.length > 0 ? parseFloat(fatSlabs[fatSlabs.length - 1].toFat) || 0 : parseFloat(formValues.minFat) || 2;
    setFatSlabs(prev => [...prev, { fromFat: lastTo, toFat: lastTo + 2, incrementPerPoint: 0.10 }]);
  };
  const updateFatSlab = (index, field, value) => {
    setFatSlabs(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };
  const removeFatSlab = (index) => {
    setFatSlabs(prev => prev.filter((_, i) => i !== index));
  };

  const addSnfSlab = () => {
    const lastTo = snfSlabs.length > 0 ? parseFloat(snfSlabs[snfSlabs.length - 1].toSnf) || 0 : parseFloat(formValues.minSnf) || 6;
    setSnfSlabs(prev => [...prev, { fromSnf: lastTo, toSnf: lastTo + 1, incrementPerPoint: 0.05 }]);
  };
  const updateSnfSlab = (index, field, value) => {
    setSnfSlabs(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };
  const removeSnfSlab = (index) => {
    setSnfSlabs(prev => prev.filter((_, i) => i !== index));
  };

  // ── Save ────────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const cleanValues = { ...formValues };
      delete cleanValues._id;
      delete cleanValues.adminId;
      delete cleanValues.status;
      delete cleanValues.createdAt;
      delete cleanValues.updatedAt;
      delete cleanValues.__v;
      delete cleanValues.fatSlabs;
      delete cleanValues.snfSlabs;

      const payload = {
        ...cleanValues,
        animalType: selectedCategory,
        fatSlabs: slabsEnabled ? fatSlabs : [],
        snfSlabs: slabsEnabled ? snfSlabs : [],
      };

      const minFat = parseFloat(payload.minFat) || 0;
      const maxFat = parseFloat(payload.maxFat) || 0;
      const minSnf = parseFloat(payload.minSnf) || 0;
      const maxSnf = parseFloat(payload.maxSnf) || 0;
      const minDegree = parseFloat(payload.minDegree) || 0;
      const maxDegree = parseFloat(payload.maxDegree) || 0;

      if (minFat >= maxFat) throw new Error("Min FAT must be strictly less than Max FAT.");
      if (previewMode === "snf" && minSnf >= maxSnf) throw new Error("Min SNF must be strictly less than Max SNF.");
      if (previewMode === "degree" && minDegree >= maxDegree) throw new Error("Min Degree must be strictly less than Max Degree.");

      await api.post("/rates", payload);
      toast.success(`Pricing config for ${selectedCategory.toUpperCase()} saved! (₹ INR)`);
      fetchConfigs();
    } catch (err) {
      console.error(err);
      toast.error(err.message || err.response?.data?.message || "Failed to save pricing configuration.");
    } finally {
      setSaving(false);
    }
  };

  // ── Calculator Functions (INR) ─────────────────────────────────────
  const calculateSnfFromDegree = (fat, degree) => {
    const f = parseFloat(fat) || 0;
    const d = parseFloat(degree) || 0;
    if (d <= 0) return 0;
    return parseFloat(((d / 4) + (0.21 * f) + 0.36).toFixed(2));
  };

  // Slab-aware calculator (mirrors backend _calculateSlabAdjustment exactly)
  const _calcSlabAdj = useCallback((baseVal, actualVal, slabs, type) => {
    const SCALE = 10;
    const baseScaled = Math.round(baseVal * SCALE);
    const actualScaled = Math.round(actualVal * SCALE);
    if (baseScaled === actualScaled) return 0;

    const direction = actualScaled > baseScaled ? 1 : -1;
    let totalPaise = 0;
    const PAISE_SCALE = 10000;
    const fromKey = type === 'fat' ? 'fromFat' : 'fromSnf';
    const toKey   = type === 'fat' ? 'toFat'   : 'toSnf';

    for (let step = baseScaled; step !== actualScaled; step += direction) {
      const currentVal = step / SCALE;
      const nextVal = (step + direction) / SCALE;
      const checkVal = direction > 0 ? currentVal : nextVal;

      const matched = slabs.find(s => {
        const from = parseFloat(s[fromKey]);
        const to   = parseFloat(s[toKey]);
        return checkVal >= from && checkVal < to;
      });

      if (matched) {
        const inc = parseFloat(matched.incrementPerPoint) || 0;
        totalPaise += Math.round(inc * PAISE_SCALE) * direction;
      }
    }
    return totalPaise / PAISE_SCALE;
  }, []);

  const calculateMilkRate = useCallback((fat, snf) => {
    const f = parseFloat(fat) || 0;
    const s = parseFloat(snf) || 0;
    const baseRate = parseFloat(formValues.baseRate) || 0;
    const baseFat = parseFloat(formValues.baseFat) || 0;
    const baseSnf = parseFloat(formValues.baseSnf) || 0;
    const fatPointValue = parseFloat(formValues.fatPointValue) || 0;
    const snfPointValue = parseFloat(formValues.snfPointValue) || 0;

    // FAT adjustment
    let fatAdj = 0;
    if (slabsEnabled && fatSlabs.length > 0) {
      fatAdj = _calcSlabAdj(baseFat, f, fatSlabs, 'fat');
    } else {
      fatAdj = Math.round((f - baseFat) * 10) * fatPointValue;
    }

    // SNF adjustment
    let snfAdj = 0;
    if (slabsEnabled && snfSlabs.length > 0) {
      snfAdj = _calcSlabAdj(baseSnf, s, snfSlabs, 'snf');
    } else {
      snfAdj = Math.round((s - baseSnf) * 10) * snfPointValue;
    }

    const rate = baseRate + fatAdj + snfAdj;
    return Math.max(0, parseFloat(rate.toFixed(2)));
  }, [formValues, slabsEnabled, fatSlabs, snfSlabs, _calcSlabAdj]);

  // Matrix headers
  const matrixHeaders = useMemo(() => {
    const minF = Math.round((parseFloat(formValues.minFat) || 0) * 10);
    const maxF = Math.round((parseFloat(formValues.maxFat) || 0) * 10);
    const stepF = Math.round(fatStep * 10);

    const fatList = [];
    for (let f = minF; f <= maxF; f += stepF) fatList.push(f / 10);

    const colList = [];
    if (previewMode === "snf") {
      const minS = Math.round((parseFloat(formValues.minSnf) || 0) * 10);
      const maxS = Math.round((parseFloat(formValues.maxSnf) || 0) * 10);
      const stepS = Math.round(columnStep * 10);
      for (let s = minS; s <= maxS; s += stepS) colList.push(s / 10);
    } else {
      const minD = Math.round((parseFloat(formValues.minDegree) || 0) * 10);
      const maxD = Math.round((parseFloat(formValues.maxDegree) || 0) * 10);
      const stepD = Math.round(columnStep * 10);
      for (let d = minD; d <= maxD; d += stepD) colList.push(d / 10);
    }

    return { fatList, colList };
  }, [formValues.minFat, formValues.maxFat, formValues.minSnf, formValues.maxSnf, formValues.minDegree, formValues.maxDegree, fatStep, columnStep, previewMode]);

  // ── Slab Card Component (Mobile-Responsive) ────────────────────────
  const SlabCard = ({ slab, index, type, onUpdate, onRemove }) => {
    const fromKey = type === 'fat' ? 'fromFat' : 'fromSnf';
    const toKey   = type === 'fat' ? 'toFat'   : 'toSnf';
    const label   = type === 'fat' ? 'FAT' : 'SNF';
    const accentColor = type === 'fat' ? 'amber' : 'sky';

    return (
      <div className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm group hover:shadow-md transition-all space-y-2.5">
        {/* Top: Slab number badge + delete */}
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-${accentColor}-100 dark:bg-${accentColor}-950/30 text-${accentColor}-700 dark:text-${accentColor}-400 border border-${accentColor}-200/50 dark:border-${accentColor}-800/30`}>
            {label} Slab #{index + 1}
          </span>
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 transition-all border border-transparent hover:border-red-200 dark:hover:border-red-900/30"
          >
            <Trash2 className="h-3 w-3" />
            <span className="hidden sm:inline">Remove</span>
          </button>
        </div>

        {/* Range Row: From → To (stacks on very small screens) */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase">From (%)</label>
            <input
              type="number" step="0.1"
              value={slab[fromKey]}
              onChange={(e) => onUpdate(index, fromKey, parseFloat(e.target.value) || 0)}
              className="w-full h-9 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 px-2.5 text-sm font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase">To (%)</label>
            <input
              type="number" step="0.1"
              value={slab[toKey]}
              onChange={(e) => onUpdate(index, toKey, parseFloat(e.target.value) || 0)}
              className="w-full h-9 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 px-2.5 text-sm font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Increment Row */}
        <div className="space-y-1">
          <label className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase">₹ Increment per 0.1% {label} Point</label>
          <input
            type="number" step="0.01" min="0"
            value={slab.incrementPerPoint}
            onChange={(e) => onUpdate(index, 'incrementPerPoint', parseFloat(e.target.value) || 0)}
            className="w-full h-9 border border-emerald-200 dark:border-emerald-800/50 dark:bg-slate-900 px-2.5 text-sm font-extrabold rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="h-6 w-6 sm:h-8 sm:w-8 text-primary animate-pulse shrink-0" />
            <span>Pricing Engine</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Cooperative-grade rate charts with slab-based variable pricing (₹ INR).
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

      {/* Animal Category Cards */}
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
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/55"
                      }`}>
                        <CheckCircle className="w-2.5 h-2.5 shrink-0" />
                        Active
                      </span>
                      {(Array.isArray(activeCfg.fatSlabs) && activeCfg.fatSlabs.length > 0) && (
                        <span className={`inline-flex items-center gap-0.5 text-[8px] sm:text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                          isSelected
                            ? "bg-white/15 text-white/90"
                            : "bg-violet-100 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400 border border-violet-200/55"
                        }`}>
                          <Layers className="w-2 h-2" />
                          Slabs
                        </span>
                      )}
                    </div>
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
        {/* Left Side: Configurator Form */}
        <form onSubmit={handleSave} className="lg:col-span-5 bg-white/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800/80 backdrop-blur-md rounded-2xl shadow-xl p-4 sm:p-6 space-y-5 sm:space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-lg font-black text-slate-950 dark:text-white uppercase tracking-wider">
                {selectedCategory} parameters
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-500 font-semibold mt-0.5">
                Base rates, modifiers &amp; ranges (₹ INR).
              </p>
            </div>
          </div>

          {/* Base Rate Fields */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <IndianRupee className="h-3 w-3" />
              Base Pricing (₹ INR)
            </h3>

            <div className="grid grid-cols-3 gap-2 sm:gap-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                  Base Rate (₹)
                </label>
                <input
                  type="number" step="0.01" required
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
                  type="number" step="0.1" required
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
                  type="number" step="0.1" required
                  value={formValues.baseSnf}
                  onChange={(e) => handleInputChange("baseSnf", e.target.value)}
                  className="w-full h-10 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 px-3 text-sm font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-950 dark:text-white"
                />
              </div>
            </div>

            {/* Slab Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 border border-violet-200/50 dark:border-violet-800/30">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                <div>
                  <p className="text-xs font-black text-violet-700 dark:text-violet-300">Slab-Based Pricing</p>
                  <p className="text-[9px] text-violet-500 dark:text-violet-400 font-medium">Variable ₹ increments per FAT/SNF range</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSlabsEnabled(!slabsEnabled)}
                className="transition-all active:scale-90"
              >
                {slabsEnabled ? (
                  <ToggleRight className="h-7 w-7 text-violet-600 dark:text-violet-400" />
                ) : (
                  <ToggleLeft className="h-7 w-7 text-slate-400" />
                )}
              </button>
            </div>

            {/* Flat Point Increments (shown only when slabs are OFF) */}
            {!slabsEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 animate-fade-in">
                <div className="space-y-1.5 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800/80">
                  <label className="text-[10px] font-black uppercase tracking-wide text-slate-500 block">
                    FAT Point Value (₹/0.1%)
                  </label>
                  <input
                    type="number" step="0.01" required
                    value={formValues.fatPointValue}
                    onChange={(e) => handleInputChange("fatPointValue", e.target.value)}
                    className="w-full h-9 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 px-2.5 text-sm font-extrabold rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-950 dark:text-white"
                  />
                  <span className="text-[9px] text-slate-400 font-medium block">
                    Adds/deducts ₹ per 0.1% fat offset.
                  </span>
                </div>
                <div className="space-y-1.5 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800/80">
                  <label className="text-[10px] font-black uppercase tracking-wide text-slate-500 block">
                    SNF Point Value (₹/0.1%)
                  </label>
                  <input
                    type="number" step="0.01" required
                    value={formValues.snfPointValue}
                    onChange={(e) => handleInputChange("snfPointValue", e.target.value)}
                    className="w-full h-9 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 px-2.5 text-sm font-extrabold rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-950 dark:text-white"
                  />
                  <span className="text-[9px] text-slate-400 font-medium block">
                    Adds/deducts ₹ per 0.1% snf offset.
                  </span>
                </div>
              </div>
            )}

            {/* Slab Configuration Section (shown only when slabs are ON) */}
            {slabsEnabled && (
              <div className="space-y-4 animate-fade-in">
                <button
                  type="button"
                  onClick={() => setSlabSectionOpen(!slabSectionOpen)}
                  className="flex items-center justify-between w-full px-2.5 sm:px-3 py-2 rounded-xl bg-violet-50/50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-800/30 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-all gap-2"
                >
                  <span className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-black uppercase tracking-wider min-w-0">
                    <Layers className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">Rate Slabs (₹)</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-violet-200/60 dark:bg-violet-800/30 text-[9px] shrink-0">
                      {fatSlabs.length + snfSlabs.length}
                    </span>
                  </span>
                  {slabSectionOpen ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
                </button>

                {slabSectionOpen && (
                  <div className="space-y-5 pl-0 sm:pl-1">
                    {/* FAT Slabs */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h4 className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                          FAT Slabs
                          <span className="text-slate-400 font-semibold normal-case">
                            ({fatSlabs.length})
                          </span>
                        </h4>
                        <button
                          type="button"
                          onClick={addFatSlab}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase hover:bg-amber-100 dark:hover:bg-amber-950/40 transition-all active:scale-95"
                        >
                          <Plus className="h-3 w-3" />
                          Add Slab
                        </button>
                      </div>
                      {fatSlabs.length === 0 && (
                        <p className="text-[10px] text-slate-400 italic py-2 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                          No FAT slabs configured. Click &quot;Add Slab&quot; to define variable ₹ increments per FAT range.
                        </p>
                      )}
                      <div className="space-y-2">
                        {fatSlabs.map((slab, i) => (
                          <SlabCard
                            key={i}
                            slab={slab}
                            index={i}
                            type="fat"
                            onUpdate={updateFatSlab}
                            onRemove={removeFatSlab}
                          />
                        ))}
                      </div>
                    </div>

                    {/* SNF Slabs */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h4 className="text-[10px] font-black uppercase tracking-wider text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                          SNF Slabs
                          <span className="text-slate-400 font-semibold normal-case">
                            ({snfSlabs.length})
                          </span>
                        </h4>
                        <button
                          type="button"
                          onClick={addSnfSlab}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/20 border border-sky-200/50 dark:border-sky-800/30 text-sky-700 dark:text-sky-400 text-[10px] font-black uppercase hover:bg-sky-100 dark:hover:bg-sky-950/40 transition-all active:scale-95"
                        >
                          <Plus className="h-3 w-3" />
                          Add Slab
                        </button>
                      </div>
                      {snfSlabs.length === 0 && (
                        <p className="text-[10px] text-slate-400 italic py-2 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                          No SNF slabs configured. Click &quot;Add Slab&quot; to define variable ₹ increments per SNF range.
                        </p>
                      )}
                      <div className="space-y-2">
                        {snfSlabs.map((slab, i) => (
                          <SlabCard
                            key={i}
                            slab={slab}
                            index={i}
                            type="snf"
                            onUpdate={updateSnfSlab}
                            onRemove={removeSnfSlab}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Flat fallback info */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800/60 text-[10px] text-slate-500 font-medium space-y-1">
                      <p className="font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
                        <HelpCircle className="h-3 w-3 text-primary" /> How Slabs Work
                      </p>
                      <ul className="list-disc list-inside space-y-0.5 leading-relaxed">
                        <li>Each slab defines a FAT/SNF range and its ₹ increment per 0.1% point deviation from the base value.</li>
                        <li>The engine walks from base to actual value in 0.1% steps, applying the matching slab&apos;s increment at each step.</li>
                        <li>Points outside all slab ranges get ₹0 adjustment (no increment/deduction).</li>
                        <li>The flat FAT/SNF Point Values are still saved as fallback defaults.</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Matrix Boundaries */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Chart/Matrix Bounds &amp; Limits
            </h3>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wide text-slate-500">Min FAT Bound (%)</label>
                  <input type="number" step="0.1" required value={formValues.minFat} onChange={(e) => handleInputChange("minFat", e.target.value)}
                    className="w-full h-9 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 px-3 text-sm font-extrabold rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-950 dark:text-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wide text-slate-500">Max FAT Bound (%)</label>
                  <input type="number" step="0.1" required value={formValues.maxFat} onChange={(e) => handleInputChange("maxFat", e.target.value)}
                    className="w-full h-9 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 px-3 text-sm font-extrabold rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-950 dark:text-white" />
                </div>
              </div>

              {previewMode === "snf" ? (
                <div className="grid grid-cols-2 gap-3 animate-fade-in">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wide text-slate-500">Min SNF Bound (%)</label>
                    <input type="number" step="0.1" required value={formValues.minSnf} onChange={(e) => handleInputChange("minSnf", e.target.value)}
                      className="w-full h-9 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 px-3 text-sm font-extrabold rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-950 dark:text-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wide text-slate-500">Max SNF Bound (%)</label>
                    <input type="number" step="0.1" required value={formValues.maxSnf} onChange={(e) => handleInputChange("maxSnf", e.target.value)}
                      className="w-full h-9 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 px-3 text-sm font-extrabold rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-950 dark:text-white" />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 animate-fade-in">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wide text-slate-500">Min Degree Bound (CLR)</label>
                    <input type="number" step="0.5" required value={formValues.minDegree} onChange={(e) => handleInputChange("minDegree", e.target.value)}
                      className="w-full h-9 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 px-3 text-sm font-extrabold rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-950 dark:text-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wide text-slate-500">Max Degree Bound (CLR)</label>
                    <input type="number" step="0.5" required value={formValues.maxDegree} onChange={(e) => handleInputChange("maxDegree", e.target.value)}
                      className="w-full h-9 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 px-3 text-sm font-extrabold rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-950 dark:text-white" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Save Button */}
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

        {/* Right Side: 2D Matrix Preview */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800/80 backdrop-blur-md rounded-2xl shadow-xl p-4 sm:p-6 flex flex-col h-full min-h-[400px] sm:min-h-[500px]">
            {/* Matrix Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600">
                  <Grid className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-lg font-black text-slate-950 dark:text-white uppercase tracking-wider">
                    Rate Chart Preview
                  </h2>
                  <p className="text-[10px] sm:text-xs text-slate-500 font-semibold mt-0.5">
                    ₹ INR per Liter {slabsEnabled && <span className="text-violet-500">(Slab-Based)</span>}
                  </p>
                </div>
              </div>

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

            {/* Matrix Step Sizes */}
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

            {/* Matrix Table */}
            <div className="flex-1 mt-4 overflow-auto border border-slate-100 dark:border-slate-800 rounded-xl relative max-h-[500px]">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-950 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2.5 text-xs font-black text-slate-400 uppercase border border-slate-100 dark:border-slate-800 text-center sticky left-0 bg-slate-50 dark:bg-slate-950 z-20">
                      FAT \ {previewMode === "snf" ? "SNF" : "CLR"}
                    </th>
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
                      <td className="px-3 py-2 text-xs font-black text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800 text-center sticky left-0 bg-white dark:bg-slate-900 z-10 font-mono">
                        {fatVal.toFixed(1)}%
                      </td>
                      {matrixHeaders.colList.map((colVal) => {
                        let finalSnf = 0;
                        if (previewMode === "snf") {
                          finalSnf = colVal;
                        } else {
                          finalSnf = calculateSnfFromDegree(fatVal, colVal);
                        }
                        const cellPrice = calculateMilkRate(fatVal, finalSnf);

                        const isBaseCell = Math.abs(fatVal - parseFloat(formValues.baseFat || 0)) < 0.05 &&
                                           (previewMode === "snf"
                                             ? Math.abs(colVal - parseFloat(formValues.baseSnf || 0)) < 0.05
                                             : Math.abs(finalSnf - parseFloat(formValues.baseSnf || 0)) < 0.2);

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
                            title={`FAT: ${fatVal.toFixed(1)}%, ${previewMode === "snf" ? "SNF" : "CLR"}: ${colVal.toFixed(1)}% => ₹${cellPrice.toFixed(2)}/L`}
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

            {/* Legend */}
            <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 space-y-2">
              <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-700 dark:text-slate-300">
                <HelpCircle className="h-4 w-4 text-primary" /> Formula Details (₹ INR)
              </div>
              <ul className="text-3xs sm:text-2xs font-semibold list-disc list-inside space-y-1 leading-relaxed">
                {slabsEnabled ? (
                  <li>
                    <strong className="text-violet-600 dark:text-violet-400">Slab-Based Formula:</strong> Rate = BaseRate + Σ(slab increment × steps within each FAT/SNF slab range)
                  </li>
                ) : (
                  <li>
                    <strong className="text-slate-700 dark:text-slate-300">Point Increment Formula:</strong> Rate = BaseRate + (ActualFat - BaseFat) × 10 × FatPointValue + (ActualSnf - BaseSnf) × 10 × SnfPointValue
                  </li>
                )}
                {previewMode === "degree" && (
                  <li>
                    <strong className="text-slate-700 dark:text-slate-300">Richmond&apos;s Formula:</strong> SNF% = (CLR / 4) + (0.21 × FAT) + 0.36
                  </li>
                )}
                <li>
                  <span className="inline-block w-2.5 h-2.5 rounded bg-primary/20 mr-1.5 align-middle border border-primary/20" />
                  Highlights represent cells close to your configured Base FAT &amp; Base SNF coordinates (Base Rate: ₹{parseFloat(formValues.baseRate || 0).toFixed(2)}).
                </li>
                <li>All rates are in Indian Rupees (₹ INR) per liter.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
