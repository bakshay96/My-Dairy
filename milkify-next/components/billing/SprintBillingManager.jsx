"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import api from "@/lib/api";
import { toast } from "@/lib/toast";
import { formatIndianDate, formatRupees } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  CalendarDays,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Mail,
  Send,
  Sliders,
  FileText,
  User,
  ArrowRight,
  RefreshCw,
  X,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Calendar,
  Layers,
  Check,
  Lock,
  Download,
  Plus,
  Trash2,
  Loader2,
  IndianRupee
} from "lucide-react";
import BillingSlipModal from "./BillingSlipModal";
import PaymentModal from "@/components/farmers/PaymentModal";

// Color configuration themes per month
const MONTH_STYLES = {
  purple: {
    badgeBg: "bg-purple-500/20 text-purple-200 border-purple-400/40",
    pillActive: "bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-600/30",
    pillInactive: "bg-purple-950/40 border-purple-800/50 text-purple-200 hover:bg-purple-900/50",
    headerText: "text-purple-300",
    dot: "bg-purple-400",
  },
  sky: {
    badgeBg: "bg-sky-500/20 text-sky-200 border-sky-400/40",
    pillActive: "bg-sky-600 border-sky-500 text-white shadow-md shadow-sky-600/30",
    pillInactive: "bg-sky-950/40 border-sky-800/50 text-sky-200 hover:bg-sky-900/50",
    headerText: "text-sky-300",
    dot: "bg-sky-400",
  },
  emerald: {
    badgeBg: "bg-emerald-500/20 text-emerald-200 border-emerald-400/40",
    pillActive: "bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-600/30",
    pillInactive: "bg-emerald-950/40 border-emerald-800/50 text-emerald-200 hover:bg-emerald-900/50",
    headerText: "text-emerald-300",
    dot: "bg-emerald-400",
  },
  amber: {
    badgeBg: "bg-amber-500/20 text-amber-200 border-amber-400/40",
    pillActive: "bg-amber-600 border-amber-500 text-white shadow-md shadow-amber-600/30",
    pillInactive: "bg-amber-950/40 border-amber-800/50 text-amber-200 hover:bg-amber-900/50",
    headerText: "text-amber-300",
    dot: "bg-amber-400",
  },
};

export default function SprintBillingManager({ onApplySprintDates }) {
  const [historyLoading, setHistoryLoading] = useState(true);
  const [activeMode, setActiveMode] = useState("auto"); // "auto" | "custom"

  const [cycleConfig, setCycleConfig] = useState({
    cycleDays: 10,
    sprintMode: "auto",
    customSprintDurationDays: 10,
    autoCloseOnSprintEnd: false,
    autoEmailOnSprintClose: true,
    notifyZeroCollectionFarmers: true,
    currentSprint: null,
    availableSprints: [],
    availableSprintsGrouped: [],
  });

  const [selectedSprint, setSelectedSprint] = useState(null);
  const [sprintHistory, setSprintHistory] = useState([]);
  const [savingConfig, setSavingConfig] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  // Month-wise dropdown selection: Defaults to current active month
  const [selectedMonthView, setSelectedMonthView] = useState("");

  // Custom Sprints Choices saved locally
  const [customSprintsList, setCustomSprintsList] = useState([]);

  // Custom Sprint Inputs
  const [customSprintName, setCustomSprintName] = useState("");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Historical sprint archive compact view toggle
  const [showAllHistoricalSprints, setShowAllHistoricalSprints] = useState(false);

  // Detail Modal for a specific historical sprint
  const [inspectSprint, setInspectSprint] = useState(null);
  const [inspectFarmerSearch, setInspectFarmerSearch] = useState("");
  const [inspectFilter, setInspectFilter] = useState("all"); // "all" | "active" | "zero"

  // Thermal Slip Modal & Download states
  const [slipDataForModal, setSlipDataForModal] = useState(null);
  const [loadingSlipFarmerId, setLoadingSlipFarmerId] = useState(null);
  const [downloadingSlipFarmerId, setDownloadingSlipFarmerId] = useState(null);

  // Pending Sprint Farmer Settlement Drawer/Modal state
  const [pendingSprintDetails, setPendingSprintDetails] = useState(null);
  const [pendingSprintLoading, setPendingSprintLoading] = useState(false);
  const [pendingFilter, setPendingFilter] = useState("all"); // "all" | "pending" | "settled"
  const [pendingSearch, setPendingSearch] = useState("");

  // PaymentModal state for individual farmer settlement from sprint card
  const [payingFarmer, setPayingFarmer] = useState(null);

  // Load saved custom sprints on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("milkify_custom_sprints");
      if (saved) {
        setCustomSprintsList(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load custom sprints from storage:", e);
    }
  }, []);

  // Fetch Config & Available Sprints
  const fetchConfig = useCallback(async () => {
    try {
      const res = await api.get("/billing/sprint/config");
      const d = res.data?.data || res.data;
      if (d) {
        setCycleConfig(d);
        if (d.sprintMode) setActiveMode(d.sprintMode);
        if (!selectedSprint && d.currentSprint) {
          setSelectedSprint(d.currentSprint);
          setCustomStartDate(d.currentSprint.startDate);
          setCustomEndDate(d.currentSprint.endDate);
          setCustomSprintName(`Custom Sprint (${formatIndianDate(d.currentSprint.startDate)} to ${formatIndianDate(d.currentSprint.endDate)})`);
        }

        // Set default month to Current Active Month
        if (d.availableSprintsGrouped?.length) {
          const currentGrp = d.availableSprintsGrouped.find((g) => g.isCurrentMonth) || d.availableSprintsGrouped[0];
          setSelectedMonthView(currentGrp.monthYear);
        }
      }
    } catch (err) {
      console.error("fetchConfig error:", err);
      toast.error("Failed to load sprint configuration");
    }
  }, [selectedSprint]);

  // Fetch Sprint History
  const fetchHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const res = await api.get("/billing/sprint/history");
      const list = res.data?.data?.sprints || res.data?.sprints || [];
      setSprintHistory(list);
    } catch (err) {
      console.error("fetchHistory error:", err);
      toast.error("Failed to load sprint history");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
    fetchHistory();
  }, [fetchConfig, fetchHistory]);

  // Save Cycle preferences
  const handleUpdateCycleDays = async (newDays) => {
    try {
      setSavingConfig(true);
      const res = await api.put("/billing/sprint/config", {
        billingCycleDays: newDays,
        sprintMode: "auto",
        autoCloseOnSprintEnd: cycleConfig.autoCloseOnSprintEnd,
        autoEmailOnSprintClose: cycleConfig.autoEmailOnSprintClose,
        notifyZeroCollectionFarmers: cycleConfig.notifyZeroCollectionFarmers,
      });
      const d = res.data?.data || res.data;
      if (d) {
        setCycleConfig(d);
        setSelectedSprint(d.currentSprint);
        if (d.availableSprintsGrouped?.length) {
          const currentGrp = d.availableSprintsGrouped.find((g) => g.isCurrentMonth) || d.availableSprintsGrouped[0];
          setSelectedMonthView(currentGrp.monthYear);
        }
        toast.success(`Billing cycle updated to ${newDays} days`);
      }
    } catch (err) {
      console.error("handleUpdateCycleDays error:", err);
      toast.error("Failed to update billing cycle");
    } finally {
      setSavingConfig(false);
    }
  };

  const handleTogglePreference = async (key) => {
    const updatedVal = !cycleConfig[key];
    setCycleConfig((prev) => ({ ...prev, [key]: updatedVal }));
    try {
      await api.put("/billing/sprint/config", {
        [key]: updatedVal,
      });
      toast.success("Preference updated");
    } catch (err) {
      console.error("handleTogglePreference error:", err);
      setCycleConfig((prev) => ({ ...prev, [key]: !updatedVal }));
      toast.error("Failed to update preference");
    }
  };

  // Check if selected sprint or custom sprint is still active (ongoing)
  const isSelectedSprintLocked = useMemo(() => {
    const endStr = activeMode === "custom" ? customEndDate : selectedSprint?.endDate;
    if (!endStr) return false;
    const end = new Date(endStr);
    end.setHours(23, 59, 59, 999);
    return new Date() < end;
  }, [activeMode, customEndDate, selectedSprint]);

  // Close & Dispatch Sprint (Auto or Custom)
  const handleConfirmCloseSprint = async () => {
    if (isSelectedSprintLocked) {
      const endStr = activeMode === "custom" ? customEndDate : selectedSprint?.endDate;
      toast.error(`Settlement cannot proceed before sprint completes. Ends on ${formatIndianDate(endStr)}.`);
      return;
    }

    try {
      setDispatching(true);
      setConfirmModalOpen(false);

      let payload = {};
      if (activeMode === "custom") {
        if (!customStartDate || !customEndDate) {
          toast.error("Please specify both Start Date and End Date for custom sprint");
          setDispatching(false);
          return;
        }
        payload = {
          startDate: customStartDate,
          endDate: customEndDate,
          sprintName: customSprintName.trim() || `Custom Sprint (${formatIndianDate(customStartDate)} to ${formatIndianDate(customEndDate)})`,
          isCustom: true,
        };
      } else {
        if (!selectedSprint) return;
        payload = {
          startDate: selectedSprint.startDate,
          endDate: selectedSprint.endDate,
          cycleDays: selectedSprint.cycleDays || cycleConfig.cycleDays,
          sprintName: selectedSprint.sprintName,
          isCustom: Boolean(selectedSprint.isCustom),
        };
      }

      const res = await api.post("/billing/sprint/close-and-dispatch", payload);
      toast.success(res.data?.message || "Sprint billing closed & email dispatch queued!");
      fetchHistory();
      if (pendingSprintDetails) {
        handleOpenPendingSprintCard();
      }
    } catch (err) {
      console.error("handleConfirmCloseSprint error:", err);
      toast.error(err.response?.data?.message || "Failed to process sprint billing");
    } finally {
      setDispatching(false);
    }
  };

  // Open Pending Settlement Sprint card & fetch current collection + settlement breakdown
  const handleOpenPendingSprintCard = async () => {
    const s = selectedSprint || cycleConfig.currentSprint;
    if (!s) return;
    try {
      setPendingSprintLoading(true);
      const res = await api.get(`/billing/10-day?startDate=${s.startDate}&endDate=${s.endDate}`);
      const billingData = res.data?.data || res.data;

      // Also fetch payments captured for this range to distinguish settled vs pending
      const payRes = await api.get(`/payment/history?status=captured&startDate=${s.startDate}&endDate=${s.endDate}&pageSize=100`);
      const payments = payRes.data?.payments || [];
      const paidFarmerIds = new Set(payments.map((p) => String(p.farmerId?._id || p.farmerId || "")));

      const farmersWithSettlementState = (billingData?.farmers || []).map((f) => {
        const isPaid = paidFarmerIds.has(String(f.farmerId));
        return {
          ...f,
          isSettled: isPaid,
        };
      });

      setPendingSprintDetails({
        sprint: s,
        summary: billingData?.summary || {},
        totalFarmers: billingData?.totalFarmers || 0,
        farmers: farmersWithSettlementState,
      });
    } catch (err) {
      console.error("handleOpenPendingSprintCard error:", err);
      toast.error("Failed to load pending sprint settlement details");
    } finally {
      setPendingSprintLoading(false);
    }
  };

  // Filtered farmers in pending sprint settlement drawer
  const filteredPendingSprintFarmers = useMemo(() => {
    if (!pendingSprintDetails?.farmers) return [];
    return pendingSprintDetails.farmers.filter((f) => {
      const matchSearch =
        !pendingSearch.trim() ||
        f.farmerName?.toLowerCase().includes(pendingSearch.toLowerCase()) ||
        String(f.farmerMobile || "").includes(pendingSearch);

      if (!matchSearch) return false;
      if (pendingFilter === "pending") return !f.isSettled;
      if (pendingFilter === "settled") return f.isSettled;
      return true;
    });
  }, [pendingSprintDetails, pendingSearch, pendingFilter]);

  // Inspect specific historical sprint details
  const handleOpenSprintDetails = async (sprintId) => {
    try {
      const res = await api.get(`/billing/sprint/details/${sprintId}`);
      const d = res.data?.data?.sprint || res.data?.sprint;
      if (d) {
        setInspectSprint(d);
      }
    } catch (err) {
      console.error("handleOpenSprintDetails error:", err);
      toast.error("Failed to load sprint details");
    }
  };

  // View 80mm Thermal Slip in modal (fetches full slip data)
  const handleViewThermalSlip = async (f, start, end) => {
    try {
      setLoadingSlipFarmerId(f.farmerId);
      const res = await api.get(
        `/billing/slip/${f.farmerId}?startDate=${start}&endDate=${end}&lang=mr&status=all`
      );
      const slip = res.data?.data || res.data;
      if (slip) {
        setSlipDataForModal(slip);
      } else {
        toast.error("No slip details available");
      }
    } catch (err) {
      console.error("handleViewThermalSlip error:", err);
      toast.error("Failed to load 80mm thermal slip");
    } finally {
      setLoadingSlipFarmerId(null);
    }
  };

  // Direct 1-Click Download of 80mm Thermal Slip PDF
  const handleDirectDownloadSlipPdf = async (f, start, end) => {
    try {
      setDownloadingSlipFarmerId(f.farmerId);
      const url = `/billing/pdf/${f.farmerId}?startDate=${start}&endDate=${end}&lang=mr&status=all`;
      const res = await api.get(url, { responseType: "blob" });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute(
        "download",
        `Thermal_Slip_${f.farmerName || "Farmer"}_${formatIndianDate(start)}_to_${formatIndianDate(end)}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success(`80mm Thermal Slip downloaded for ${f.farmerName}`);
    } catch (err) {
      console.error("Direct PDF download error:", err);
      toast.error("Failed to download PDF slip");
    } finally {
      setDownloadingSlipFarmerId(null);
    }
  };

  // Filter inspect farmer list
  const filteredInspectFarmers = useMemo(() => {
    if (!inspectSprint?.farmerSummaries) return [];
    return inspectSprint.farmerSummaries.filter((f) => {
      const matchSearch =
        !inspectFarmerSearch.trim() ||
        f.farmerName?.toLowerCase().includes(inspectFarmerSearch.toLowerCase()) ||
        f.farmerMobile?.includes(inspectFarmerSearch) ||
        f.memberId?.toLowerCase().includes(inspectFarmerSearch.toLowerCase());

      if (!matchSearch) return false;
      if (inspectFilter === "active") return f.hasCollection;
      if (inspectFilter === "zero") return !f.hasCollection;
      return true;
    });
  }, [inspectSprint, inspectFarmerSearch, inspectFilter]);

  // Quick Preset setter for custom sprint
  const handleCustomPresetDays = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));
    const sStr = start.toISOString().split("T")[0];
    const eStr = end.toISOString().split("T")[0];
    setCustomStartDate(sStr);
    setCustomEndDate(eStr);
    setCustomSprintName(`Custom ${days}-Day Sprint (${formatIndianDate(sStr)} to ${formatIndianDate(eStr)})`);
  };

  // Add Custom Sprint to Choices (appears in choices dropdown alongside standard presets)
  const handleAddCustomSprintToChoices = () => {
    if (!customStartDate || !customEndDate) {
      toast.error("Please pick both start date and end date");
      return;
    }
    const s = new Date(customStartDate);
    const e = new Date(customEndDate);
    if (e < s) {
      toast.error("End date cannot be earlier than start date");
      return;
    }
    const diffDays = Math.max(1, Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1);
    const newCustomSprint = {
      id: `custom_${Date.now()}`,
      sprintName: customSprintName.trim() || `Custom Sprint (${formatIndianDate(customStartDate)} to ${formatIndianDate(customEndDate)})`,
      startDate: customStartDate,
      endDate: customEndDate,
      cycleDays: diffDays,
      isCustom: true,
    };

    const updatedList = [
      newCustomSprint,
      ...customSprintsList.filter((item) => !(item.startDate === customStartDate && item.endDate === customEndDate)),
    ];
    setCustomSprintsList(updatedList);
    try {
      localStorage.setItem("milkify_custom_sprints", JSON.stringify(updatedList));
    } catch (saveErr) {
      console.error("Storage save error:", saveErr);
    }

    setSelectedSprint(newCustomSprint);
    setActiveMode("auto");
    toast.success("Custom sprint added to choices!");
  };

  const handleRemoveCustomSprint = (id, e) => {
    e.stopPropagation();
    const updated = customSprintsList.filter((c) => c.id !== id);
    setCustomSprintsList(updated);
    try {
      localStorage.setItem("milkify_custom_sprints", JSON.stringify(updated));
    } catch (removeErr) {
      console.error("Storage remove error:", removeErr);
    }
    toast.success("Custom sprint choice removed");
  };

  // Visible historical sprints based on space-saving compact toggle
  const visibleHistoricalSprints = showAllHistoricalSprints ? sprintHistory : sprintHistory.slice(0, 3);

  // Active Month Group data for single month view
  const activeMonthGroup = useMemo(() => {
    if (!cycleConfig.availableSprintsGrouped?.length) return null;
    return (
      cycleConfig.availableSprintsGrouped.find((g) => g.monthYear === selectedMonthView) ||
      cycleConfig.availableSprintsGrouped[0]
    );
  }, [cycleConfig.availableSprintsGrouped, selectedMonthView]);

  return (
    <div className="space-y-6">
      {/* ── TOP SECTION: Mode Switcher & Sprint Duration Configuration ── */}
      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 backdrop-blur-md shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-100 dark:bg-purple-950/40 border border-purple-200/50 dark:border-purple-800/40 rounded-xl">
                <Sliders className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  Sprint Billing Engine
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                  Select standard calendar sprints or customize duration with calendar date bounds.
                </CardDescription>
              </div>
            </div>

            {/* Mode Toggle Pills: Auto vs Custom */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60 max-w-fit shadow-inner">
              <button
                type="button"
                onClick={() => setActiveMode("auto")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                  activeMode === "auto"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <Layers className="h-3.5 w-3.5 shrink-0" />
                <span>Sprint Choices</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMode("custom")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                  activeMode === "custom"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                <span>Customize Sprint</span>
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-6">
          {activeMode === "auto" ? (
            /* COMPACT DURATION SELECTION: SHOW ONLY ACTIVE + DROPDOWN */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-800/40">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-600 text-white rounded-xl shadow-md shadow-purple-600/30">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
                        Active Calendar Sprint Duration
                      </span>
                      <span className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-400/30 text-[9px] font-black px-2 py-0.2 rounded-full uppercase">
                        Current Active
                      </span>
                    </div>
                    <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                      {cycleConfig.cycleDays} Days Cycle{" "}
                      <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                        {cycleConfig.cycleDays === 10
                          ? "(1-10, 11-20, 21-End Standard)"
                          : cycleConfig.cycleDays === 15
                          ? "(1-15, 16-End Bi-Monthly)"
                          : cycleConfig.cycleDays === 30
                          ? "(Full Calendar Month)"
                          : "(Custom Cycle)"}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Dropdown to switch duration & save space */}
                <div className="sm:w-72">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Select Sprint Duration (Dropdown):
                  </label>
                  <select
                    value={cycleConfig.cycleDays}
                    onChange={(e) => handleUpdateCycleDays(Number(e.target.value))}
                    disabled={savingConfig}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer shadow-sm"
                  >
                    <option value={10}>10 Days (1-10, 11-20, 21-End) · Standard</option>
                    <option value={15}>15 Days (1-15, 16-End) · Bi-Monthly</option>
                    <option value={20}>20 Days (1-20, 21-End)</option>
                    <option value={5}>5 Days (Rolling Micro-Sprints)</option>
                    <option value={30}>30 Days (Full Calendar Month)</option>
                  </select>
                </div>
              </div>

              {/* SAVED CUSTOM SPRINT CHOICES (IF ANY) */}
              {customSprintsList.length > 0 && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                      Saved Custom Sprint Choices
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Click to activate or select for settlement
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {customSprintsList.map((c) => {
                      const isSelected = selectedSprint?.id === c.id;
                      return (
                        <div
                          key={c.id}
                          onClick={() => {
                            setSelectedSprint(c);
                            setCustomStartDate(c.startDate);
                            setCustomEndDate(c.endDate);
                            setCustomSprintName(c.sprintName);
                          }}
                          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? "bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-600/20"
                              : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-purple-300 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <div className="space-y-0.5 truncate pr-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-black truncate">{c.sprintName}</span>
                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded font-black uppercase ${
                                  isSelected
                                    ? "bg-white/20 text-white"
                                    : "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300"
                                }`}
                              >
                                Custom
                              </span>
                            </div>
                            <p className={`text-[10px] ${isSelected ? "text-purple-100" : "text-slate-400"}`}>
                              {formatIndianDate(c.startDate)} to {formatIndianDate(c.endDate)} ({c.cycleDays}d)
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {isSelected && <Check className="h-4 w-4 text-white mr-1" />}
                            <button
                              type="button"
                              onClick={(e) => handleRemoveCustomSprint(c.id, e)}
                              className={`p-1 rounded hover:bg-black/20 ${
                                isSelected ? "text-purple-200" : "text-slate-400 hover:text-red-500"
                              }`}
                              title="Remove choice"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* CUSTOM SPRINT BUILDER WITH CALENDAR AND ADD TO CHOICES */
            <div className="space-y-4 bg-slate-50/60 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-850">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    Configure Custom Sprint Window
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Select calendar dates for festival periods, audits, or custom payout cycles and save to choices.
                  </p>
                </div>
                {/* Quick Presets */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Presets:</span>
                  {[7, 10, 15, 20].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => handleCustomPresetDays(d)}
                      className="px-2 py-0.5 text-[10px] font-bold rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-purple-400 text-slate-700 dark:text-slate-200 transition-all"
                    >
                      {d}d
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Sprint Label / Name
                  </label>
                  <input
                    type="text"
                    value={customSprintName}
                    onChange={(e) => setCustomSprintName(e.target.value)}
                    placeholder="e.g. Festival Sprint, Mid-Month Cycle"
                    className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Start Date ({customStartDate ? formatIndianDate(customStartDate) : "DD-MM-YYYY"})
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    End Date ({customEndDate ? formatIndianDate(customEndDate) : "DD-MM-YYYY"})
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500 font-semibold"
                  />
                </div>
              </div>

              {/* Action Bar for Custom Sprint */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {customStartDate && customEndDate ? (
                    <span>
                      Selected Range: <strong className="text-slate-900 dark:text-white">{formatIndianDate(customStartDate)}</strong> to{" "}
                      <strong className="text-slate-900 dark:text-white">{formatIndianDate(customEndDate)}</strong>
                    </span>
                  ) : (
                    <span>Choose calendar dates above</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={handleAddCustomSprintToChoices}
                    className="h-9 px-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs gap-1.5 shadow-sm"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add to Sprint Choices</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Automated Dispatch & Auto-Close Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            {/* Auto-Close on Span Complete */}
            <div
              onClick={() => handleTogglePreference("autoCloseOnSprintEnd")}
              className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 hover:border-purple-300 dark:hover:border-purple-700 cursor-pointer transition-all"
            >
              <div className="space-y-0.5 pr-2">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  Auto-Close When Span Completes
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Automatically seals sprint & queues statements the morning after sprint ends.
                </p>
              </div>
              <input
                type="checkbox"
                checked={cycleConfig.autoCloseOnSprintEnd}
                onChange={() => {}}
                className="h-4 w-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
            </div>

            {/* Auto-Email 80mm Thermal Slips */}
            <div
              onClick={() => handleTogglePreference("autoEmailOnSprintClose")}
              className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 hover:border-purple-300 dark:hover:border-purple-700 cursor-pointer transition-all"
            >
              <div className="space-y-0.5 pr-2">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                  Auto-Email 80mm Thermal Slip
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Dispatches dedicated POS receipts to farmers with milk records.
                </p>
              </div>
              <input
                type="checkbox"
                checked={cycleConfig.autoEmailOnSprintClose}
                onChange={() => {}}
                className="h-4 w-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
            </div>

            {/* Notify Zero-Collection Farmers */}
            <div
              onClick={() => handleTogglePreference("notifyZeroCollectionFarmers")}
              className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 hover:border-purple-300 dark:hover:border-purple-700 cursor-pointer transition-all"
            >
              <div className="space-y-0.5 pr-2">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  Notify Zero-Collection Farmers
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Sends courteous inactivity notice for transparent verification.
                </p>
              </div>
              <input
                type="checkbox"
                checked={cycleConfig.notifyZeroCollectionFarmers}
                onChange={() => {}}
                className="h-4 w-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── MIDDLE SECTION: ACTIVE SETTLEMENT SPRINT & MONTH DROPDOWN SELECTOR ── */}
      <div className="bg-gradient-to-br from-purple-900/90 via-slate-900 to-indigo-950 text-white rounded-2xl p-5 sm:p-6 shadow-xl border border-purple-500/20 relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 relative z-10">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-purple-500/30 text-purple-200 border border-purple-400/30 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider">
                <Clock className="h-3 w-3 animate-spin text-purple-300" />
                {activeMode === "auto" ? "Active Settlement Sprint" : "Custom Sprint Clearance"}
              </span>
              {activeMode === "auto" && selectedSprint?.isCurrent && (
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase">
                  Current
                </span>
              )}
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
                {activeMode === "custom"
                  ? customSprintName || "Custom Sprint"
                  : selectedSprint?.sprintName || `Sprint (${cycleConfig.cycleDays} Days)`}
              </h2>
              <p className="text-purple-200/80 text-xs sm:text-sm mt-1">
                Date Span:{" "}
                <strong className="text-white">
                  {activeMode === "custom"
                    ? formatIndianDate(customStartDate)
                    : selectedSprint ? formatIndianDate(selectedSprint.startDate) : "--"}
                </strong>{" "}
                to{" "}
                <strong className="text-white">
                  {activeMode === "custom"
                    ? formatIndianDate(customEndDate)
                    : selectedSprint ? formatIndianDate(selectedSprint.endDate) : "--"}
                </strong>
              </p>
            </div>

            {/* MONTH-WISE DROPDOWN: SHOW CURRENT MONTH, SELECT OTHERS FROM DROPDOWN */}
            {activeMode === "auto" && (
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <span className="text-[11px] text-purple-300/80 font-black uppercase tracking-wider block">
                    Active Month Sprint View:
                  </span>

                  {/* Month Selection Dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-300 uppercase font-bold">Month:</span>
                    <select
                      value={selectedMonthView}
                      onChange={(e) => setSelectedMonthView(e.target.value)}
                      className="h-8 px-2.5 rounded-xl border border-purple-400/30 bg-purple-950/60 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-purple-400 cursor-pointer"
                    >
                      {(cycleConfig.availableSprintsGrouped || []).map((grp) => (
                        <option key={grp.monthYear} value={grp.monthYear}>
                          {grp.monthYear} {grp.isCurrentMonth ? "(Active Month)" : `(${grp.sprints.length} Sprints)`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Sprints for Selected Month Only */}
                {activeMonthGroup && (
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-black uppercase text-purple-200 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                        {activeMonthGroup.monthYear} Sprints:
                      </span>
                      {activeMonthGroup.isCurrentMonth && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-bold">
                          Current Month
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {activeMonthGroup.sprints.map((s) => {
                        const isSelected =
                          selectedSprint?.startDate === s.startDate && selectedSprint?.endDate === s.endDate;
                        const style = MONTH_STYLES[activeMonthGroup.colorScheme] || MONTH_STYLES.purple;
                        return (
                          <button
                            key={`${s.startDate}_${s.endDate}`}
                            type="button"
                            onClick={() => setSelectedSprint(s)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 shadow-sm ${
                              isSelected ? style.pillActive : style.pillInactive
                            }`}
                          >
                            <span>{s.displayLabel || s.sprintName}</span>
                            <span className="text-[10px] opacity-75">
                              ({formatIndianDate(s.startDate)} - {formatIndianDate(s.endDate)})
                            </span>
                            {s.isCurrent && (
                              <span className="text-[9px] bg-emerald-500/80 text-white px-1.5 py-0.2 rounded font-black">
                                NOW
                              </span>
                            )}
                            {isSelected && <Check className="h-3.5 w-3.5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons Column */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch gap-3 shrink-0 lg:w-64 pt-2 lg:pt-0">
            {onApplySprintDates && (
              <Button
                variant="outline"
                onClick={() => {
                  if (activeMode === "custom") {
                    onApplySprintDates(customStartDate, customEndDate);
                  } else if (selectedSprint) {
                    onApplySprintDates(selectedSprint.startDate, selectedSprint.endDate);
                  }
                }}
                className="h-11 px-4 bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-xl text-xs font-bold shadow-sm justify-center"
              >
                Apply to Collection Table
                <ArrowRight className="h-3.5 w-3.5 ml-2" />
              </Button>
            )}

            {/* Enforce settlement rule: Settlement locked until sprint span completes */}
            {isSelectedSprintLocked ? (
              <div className="space-y-1.5">
                <Button
                  disabled
                  className="h-12 w-full px-4 bg-slate-800/90 text-slate-400 border border-slate-700/60 font-black rounded-xl text-xs justify-center cursor-not-allowed shadow-none flex items-center"
                  title={`Sprint is active until ${formatIndianDate(activeMode === "custom" ? customEndDate : selectedSprint?.endDate)}. Settlement unlocks once completed.`}
                >
                  <Lock className="h-4 w-4 mr-2 text-amber-400 shrink-0" />
                  <span>Settlement Locked (Active Sprint)</span>
                </Button>
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-amber-300 font-bold bg-amber-950/40 border border-amber-800/50 py-1.5 px-2.5 rounded-xl text-center leading-tight">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                  <span>
                    Unlocks on {formatIndianDate(activeMode === "custom" ? customEndDate : selectedSprint?.endDate)} when sprint completes
                  </span>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => setConfirmModalOpen(true)}
                disabled={dispatching || (activeMode === "auto" ? !selectedSprint : (!customStartDate || !customEndDate))}
                className="h-12 px-5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-black rounded-xl text-xs shadow-lg shadow-emerald-500/25 active:scale-95 transition-all justify-center"
              >
                {dispatching ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Queuing Clearance...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Close Sprint & Dispatch Bills
                  </>
                )}
              </Button>
            )}

            <p className="text-[10px] text-purple-200/60 text-center leading-tight">
              Dispatches thermal PDF slips to active farmers and polite zero-collection notices to inactive farmers.
            </p>
          </div>
        </div>
      </div>

      {/* ── PENDING SETTLEMENT SPRINT CARD (CLICK TO SETTLE EACH FARMER) ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 rounded-xl text-amber-600 dark:text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Pending Settlement Sprint
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  Ready to Inspect & Settle
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5">
                {selectedSprint?.sprintName || `Sprint (${cycleConfig.cycleDays} Days)`}
                <span className="text-xs text-slate-500 font-normal ml-2">
                  ({formatIndianDate(selectedSprint?.startDate)} to {formatIndianDate(selectedSprint?.endDate)})
                </span>
              </h3>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleOpenPendingSprintCard}
            disabled={pendingSprintLoading}
            className="h-10 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs gap-1.5 shadow-sm"
          >
            {pendingSprintLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <IndianRupee className="h-3.5 w-3.5" />
            )}
            <span>View Farmers & Settle Payments</span>
          </Button>
        </div>

        {/* Inline Farmer Settlement Breakdown Drawer */}
        {pendingSprintDetails && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4 animate-in fade-in duration-200">
            {/* Header toolbar for settlement list */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-slate-500">Filter:</span>
                <div className="flex bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setPendingFilter("all")}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                      pendingFilter === "all" ? "bg-purple-600 text-white" : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    All ({pendingSprintDetails.farmers?.length || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingFilter("pending")}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                      pendingFilter === "pending" ? "bg-amber-600 text-white" : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    Pending ({pendingSprintDetails.farmers?.filter((f) => !f.isSettled).length || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingFilter("settled")}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                      pendingFilter === "settled" ? "bg-emerald-600 text-white" : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    Settled ({pendingSprintDetails.farmers?.filter((f) => f.isSettled).length || 0})
                  </button>
                </div>
              </div>

              <input
                type="text"
                value={pendingSearch}
                onChange={(e) => setPendingSearch(e.target.value)}
                placeholder="Search farmer name/mobile..."
                className="h-8 w-full sm:w-60 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
              />
            </div>

            {/* Farmers List in this Pending Sprint */}
            {!filteredPendingSprintFarmers.length ? (
              <div className="py-8 text-center text-slate-400">
                <p className="text-xs font-semibold">No farmers match the current filter in this sprint.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredPendingSprintFarmers.map((f) => (
                  <div
                    key={f.farmerId}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2 hover:border-purple-300 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">{f.farmerName}</h4>
                        <p className="text-[10px] text-slate-400">{f.farmerMobile || "No Mobile"}</p>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                          f.isSettled
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                            : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                        }`}
                      >
                        {f.isSettled ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" /> Settled
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3" /> Pending
                          </>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                      <span className="text-slate-500 text-[11px]">
                        Total: {Number(f.totalLiters || 0).toFixed(2)} L · FAT {Number(f.avgFat || 0).toFixed(1)}%
                      </span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400 text-xs">
                        {formatRupees(f.totalAmount || 0)}
                      </span>
                    </div>

                    {/* Cow & Buffalo Breakdown Badges */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px]">
                      <div className="p-1.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/40">
                        <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 font-bold">
                          <span>🐄 Cow</span>
                          <span>{Number(f.cowRate || 0) > 0 ? `₹${Number(f.cowRate).toFixed(1)}/L` : "--"}</span>
                        </div>
                        <p className="font-black text-slate-800 dark:text-slate-100">{Number(f.cowLiters || 0).toFixed(1)} L</p>
                      </div>
                      <div className="p-1.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-800/40">
                        <div className="flex items-center justify-between text-blue-700 dark:text-blue-400 font-bold">
                          <span>🐃 Buffalo</span>
                          <span>{Number(f.buffaloRate || 0) > 0 ? `₹${Number(f.buffaloRate).toFixed(1)}/L` : "--"}</span>
                        </div>
                        <p className="font-black text-slate-800 dark:text-slate-100">{Number(f.buffaloLiters || 0).toFixed(1)} L</p>
                      </div>
                    </div>

                    {/* Actions: Settle Payment / View Slip */}
                    <div className="pt-2 flex items-center justify-between border-t border-slate-200/40 dark:border-slate-700/40">
                      <button
                        type="button"
                        onClick={() =>
                          handleViewThermalSlip(f, pendingSprintDetails.sprint.startDate, pendingSprintDetails.sprint.endDate)
                        }
                        className="text-[10px] font-bold text-purple-600 hover:underline flex items-center gap-1"
                      >
                        <FileText className="h-3 w-3" />
                        Slip
                      </button>

                      {!f.isSettled ? (
                        <Button
                          size="sm"
                          disabled={isSelectedSprintLocked}
                          onClick={() => {
                            if (isSelectedSprintLocked) {
                              toast.error(`Settlement is locked because sprint is active. Unlocks on ${formatIndianDate(selectedSprint?.endDate)}.`);
                              return;
                            }
                            setPayingFarmer({
                              ...f,
                              farmerId: f.farmerId,
                            });
                          }}
                          className={`h-7 px-2.5 text-[11px] font-bold rounded-lg gap-1 ${
                            isSelectedSprintLocked
                              ? "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400 cursor-not-allowed border border-slate-300 dark:border-slate-700"
                              : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                          }`}
                          title={isSelectedSprintLocked ? `Sprint is active until ${formatIndianDate(selectedSprint?.endDate)}. Settlement unlocks once completed.` : "Settle payment"}
                        >
                          {isSelectedSprintLocked ? <Lock className="h-3 w-3 text-amber-500" /> : <IndianRupee className="h-3 w-3" />}
                          <span>{isSelectedSprintLocked ? "Locked" : "Settle Payment"}</span>
                        </Button>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                          <Check className="h-3 w-3" /> Cleared
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── BOTTOM SECTION: Completed Sprints History Table (Space-Saving Compact) ── */}
      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-950/40 border border-blue-200/50 dark:border-blue-800/40 rounded-xl">
                <CalendarDays className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-lg font-black text-slate-900 dark:text-slate-100">
                  Sprint Settlement Archive
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                  Audited historical sprint executions, delivery tallies, and farmer ledger breakdowns.
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {sprintHistory.length > 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllHistoricalSprints(!showAllHistoricalSprints)}
                  className="h-8 text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  {showAllHistoricalSprints ? "Show Less" : `View All (${sprintHistory.length})`}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={fetchHistory}
                disabled={historyLoading}
                className="h-8 text-xs font-bold rounded-lg border-slate-200 dark:border-slate-800"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${historyLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {historyLoading && !sprintHistory.length ? (
            <div className="py-16 text-center text-slate-400">
              <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin opacity-40 text-purple-600" />
              <p className="text-xs font-bold">Loading historical sprint records...</p>
            </div>
          ) : !sprintHistory.length ? (
            <div className="py-16 text-center text-slate-400 dark:text-slate-500">
              <CalendarDays className="h-10 w-10 mx-auto mb-2 opacity-25" />
              <p className="text-sm font-semibold">No sprint billing records generated yet.</p>
              <p className="text-xs mt-1">
                Close your first sprint using the button above to record and dispatch automated thermal statements.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="py-3 px-4">Sprint & Dates</th>
                    <th className="py-3 px-4">Cycle</th>
                    <th className="py-3 px-4 text-center">Farmers (Active / Zero)</th>
                    <th className="py-3 px-4 text-right">Volume</th>
                    <th className="py-3 px-4 text-right">Total Payout</th>
                    <th className="py-3 px-4 text-center">Emails Delivered</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {visibleHistoricalSprints.map((s) => (
                    <tr
                      key={s._id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                        <div>{s.sprintName}</div>
                        <div className="text-[10px] font-medium text-slate-400 mt-0.5">
                          {formatIndianDate(s.startDate)} - {formatIndianDate(s.endDate)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {s.cycleDays}d
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 font-bold">
                          <span className="text-emerald-600 dark:text-emerald-400">{s.activeFarmers || 0} active</span>
                          <span className="text-slate-300 dark:text-slate-700">/</span>
                          <span className="text-amber-600 dark:text-amber-400">{s.zeroCollectionFarmers || 0} zero</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-slate-800 dark:text-slate-200">
                        {Number(s.totalLiters || 0).toFixed(2)} L
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-emerald-600 dark:text-emerald-400">
                        {formatRupees(s.totalAmount || 0)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          <Mail className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                          <span>{s.emailsSent || 0}</span>
                          {s.emailsFailed > 0 && (
                            <span className="text-[10px] font-black text-red-500">
                              ({s.emailsFailed} failed)
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            s.status === "completed"
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50"
                              : s.status === "processing"
                              ? "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50 animate-pulse"
                              : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50"
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenSprintDetails(s._id)}
                          className="h-8 px-2.5 text-xs font-bold text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-950/40"
                        >
                          Inspect Farmers
                          <ChevronRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── MODAL: Confirm Sprint Close & Dispatch ── */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-100 dark:bg-purple-950/40 rounded-xl text-purple-600">
                  <Send className="h-5 w-5" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Close Sprint & Dispatch Bills
                </h3>
              </div>
              <button
                onClick={() => setConfirmModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2.5 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <p>
                You are about to close billing for:{" "}
                <strong className="text-purple-700 dark:text-purple-400">
                  {activeMode === "custom" ? customSprintName : selectedSprint?.sprintName}
                </strong>{" "}
                ({formatIndianDate(activeMode === "custom" ? customStartDate : selectedSprint?.startDate)} to{" "}
                {formatIndianDate(activeMode === "custom" ? customEndDate : selectedSprint?.endDate)}).
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-500 dark:text-slate-400">
                <li>
                  <strong>Farmers with milk collections:</strong> will receive an email statement with an attached 80mm thermal PDF receipt.
                </li>
                <li>
                  <strong>Farmers with 0 milk collections:</strong> will receive a courteous inactivity notice to verify and reconcile.
                </li>
                <li>
                  <strong>Resilient load management:</strong> emails are batched and throttled to prevent SMTP server overload.
                </li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                onClick={() => setConfirmModalOpen(false)}
                className="h-9 px-4 rounded-xl text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmCloseSprint}
                disabled={dispatching || isSelectedSprintLocked}
                className="h-9 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black shadow-md"
              >
                Confirm & Dispatch
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Inspect Historical Sprint Farmers Ledger ── */}
      {inspectSprint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  {inspectSprint.sprintName} — Farmer Statements
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Period: {formatIndianDate(inspectSprint.startDate)} to {formatIndianDate(inspectSprint.endDate)} · Total Volume: {Number(inspectSprint.totalLiters || 0).toFixed(2)} L · Payout: {formatRupees(inspectSprint.totalAmount || 0)}
                </p>
              </div>
              <button
                onClick={() => setInspectSprint(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Filter Toolbar */}
            <div className="p-3 sm:px-5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60 max-w-fit">
                <button
                  type="button"
                  onClick={() => setInspectFilter("all")}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                    inspectFilter === "all"
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                  }`}
                >
                  All ({inspectSprint.farmerSummaries?.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setInspectFilter("active")}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                    inspectFilter === "active"
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                  }`}
                >
                  Active ({inspectSprint.activeFarmers || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setInspectFilter("zero")}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                    inspectFilter === "zero"
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                  }`}
                >
                  Zero Collection ({inspectSprint.zeroCollectionFarmers || 0})
                </button>
              </div>

              <input
                type="text"
                placeholder="Search farmer name, mobile, ID..."
                value={inspectFarmerSearch}
                onChange={(e) => setInspectFarmerSearch(e.target.value)}
                className="h-8 w-full sm:w-64 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {/* Farmers List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {!filteredInspectFarmers.length ? (
                <div className="py-12 text-center text-slate-400">
                  <User className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-semibold">No farmers match the current filter.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredInspectFarmers.map((f) => (
                    <div
                      key={f.farmerId}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2 hover:border-purple-300 dark:hover:border-purple-800 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            {f.farmerName}
                            {f.memberId && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                ({f.memberId})
                              </span>
                            )}
                          </h4>
                          <p className="text-[10px] text-slate-400">
                            {f.farmerMobile || "No Mobile"} {f.farmerEmail ? `· ${f.farmerEmail}` : ""}
                          </p>
                        </div>

                        {/* Email status pill */}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                            f.emailStatus === "sent"
                              ? f.hasCollection
                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                                : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                              : f.emailStatus === "no_email"
                              ? "bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700"
                              : f.emailStatus === "failed"
                              ? "bg-red-50 dark:bg-red-950/40 text-red-600 border border-red-200 dark:border-red-800"
                              : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 border border-amber-200"
                          }`}
                        >
                          <Mail className="h-2.5 w-2.5" />
                          {f.emailStatus === "sent"
                            ? f.hasCollection
                              ? "Slip Sent"
                              : "Zero Notice Sent"
                            : f.emailStatus === "no_email"
                            ? "No Email"
                            : f.emailStatus}
                        </span>
                      </div>

                      {/* Collection stats */}
                      {f.hasCollection ? (
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                          <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                            {f.totalEntries} entries · {Number(f.totalLiters || 0).toFixed(2)} L · FAT {Number(f.avgFat || 0).toFixed(1)}%
                          </span>
                          <span className="font-black text-emerald-600 dark:text-emerald-400 text-xs">
                            {formatRupees(f.totalAmount || 0)}
                          </span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold pt-1 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 shrink-0" />
                          Zero collections recorded this sprint
                        </div>
                      )}

                      {/* View & Download Thermal Slip buttons for active farmers */}
                      {f.hasCollection && (
                        <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200/40 dark:border-slate-750">
                          <button
                            type="button"
                            disabled={loadingSlipFarmerId === f.farmerId}
                            onClick={() =>
                              handleViewThermalSlip(f, inspectSprint.startDate, inspectSprint.endDate)
                            }
                            className="px-2.5 py-1 text-[11px] font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 rounded-lg flex items-center gap-1 border border-purple-200/60 dark:border-purple-800/60 transition-colors"
                          >
                            {loadingSlipFarmerId === f.farmerId ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <FileText className="h-3 w-3" />
                            )}
                            View 80mm Slip
                          </button>

                          <button
                            type="button"
                            disabled={downloadingSlipFarmerId === f.farmerId}
                            onClick={() =>
                              handleDirectDownloadSlipPdf(f, inspectSprint.startDate, inspectSprint.endDate)
                            }
                            className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 rounded-lg flex items-center gap-1 border border-emerald-200/60 dark:border-emerald-800/60 transition-colors"
                            title="Download dedicated 80mm PDF slip directly"
                          >
                            {downloadingSlipFarmerId === f.farmerId ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Download className="h-3 w-3" />
                            )}
                            Download PDF
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:px-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInspectSprint(null)}
                className="h-8 px-4 rounded-xl text-xs font-bold"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── EMBEDDED MODAL: Thermal Slip Modal ── */}
      {slipDataForModal && (
        <BillingSlipModal
          slipData={slipDataForModal}
          isOpen={Boolean(slipDataForModal)}
          onClose={() => setSlipDataForModal(null)}
          initialLanguage="mr"
        />
      )}

      {/* ── EMBEDDED MODAL: Settle Payment Modal for Individual Farmer ── */}
      {payingFarmer && (
        <PaymentModal
          farmer={payingFarmer}
          startDate={selectedSprint?.startDate}
          endDate={selectedSprint?.endDate}
          isOpen={Boolean(payingFarmer)}
          onClose={() => setPayingFarmer(null)}
          onSuccess={() => {
            setPayingFarmer(null);
            handleOpenPendingSprintCard();
          }}
        />
      )}
    </div>
  );
}
