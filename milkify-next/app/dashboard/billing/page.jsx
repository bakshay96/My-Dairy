"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import api from "@/lib/api";
import { toast } from "@/lib/toast";
import BillingTable from "@/components/billing/BillingTable";
import SprintBillingManager from "@/components/billing/SprintBillingManager";
import PaymentModal from "@/components/farmers/PaymentModal";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Download,
  Search,
  CheckCircle2,
  User,
  CreditCard,
  CalendarDays,
  ReceiptIndianRupee,
  Layers,
  Clock,
  Lock,
  Filter,
  IndianRupee,
  X,
  FileText,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatIndianDate, formatRupees } from "@/lib/utils";
import MilkifyLoader from "@/components/ui/Loader";
import { getLastTenDaysRange, buildDateQuery } from "@/lib/dateRange";

export default function BillingPage() {
  const defaultRange = useMemo(() => getLastTenDaysRange(), []);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [farmerSearch, setFarmerSearch] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [settlements, setSettlements] = useState([]);
  const [selectedFarmerId, setSelectedFarmerId] = useState("");

  const [startDate, setStartDate] = useState(defaultRange.startDate);
  const [endDate, setEndDate] = useState(defaultRange.endDate);

  // Active Sprint Configuration fetched from engine
  const [sprintConfig, setSprintConfig] = useState(null);

  // Settlement History Month & Sprint Dropdown Filters
  const [historySelectedMonth, setHistorySelectedMonth] = useState("current_month");
  const [historySelectedSprint, setHistorySelectedSprint] = useState("current_sprint");
  const [historyStateFilter, setHistoryStateFilter] = useState("all"); // "all" | "settled" | "pending"

  // PaymentModal state for settling pending farmer directly from Settlement History tab
  const [settleModalFarmer, setSettleModalFarmer] = useState(null);

  // Detail Modal state for clicking on any board card in Settlement & Farmer Ledger
  const [cardDetailData, setCardDetailData] = useState(null);

  // Check if current active sprint is still ongoing (settlement locked)
  const isCurrentSprintActive = useMemo(() => {
    if (!endDate) return false;
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return new Date() < end;
  }, [endDate]);

  const isFilteredActive = useMemo(() => {
    return (
      startDate !== defaultRange.startDate ||
      endDate !== defaultRange.endDate ||
      farmerSearch !== "" ||
      selectedFarmerId !== ""
    );
  }, [startDate, endDate, farmerSearch, selectedFarmerId, defaultRange]);

  const fetchBillingData = useCallback(async (overrideStartDate = startDate, overrideEndDate = endDate) => {
    try {
      setLoading(true);
      setError("");
      
      let url = `/billing/10-day${buildDateQuery(overrideStartDate, overrideEndDate)}`;
      const res = await api.get(url);
      if (res.data) {
        setData(res.data);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error("fetchBillingData error:", err);
      setError("Failed to load billing summary. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  const fetchSettlements = useCallback(async (overrideStartDate = startDate, overrideEndDate = endDate) => {
    try {
      const query = buildDateQuery(overrideStartDate, overrideEndDate);
      const res = await api.get(`/payment/history?status=captured&pageSize=100${query ? `&${query.slice(1)}` : ""}`);
      setSettlements(res.data?.payments || []);
    } catch (error) {
      console.error("Failed to fetch settlements:", error);
    }
  }, [startDate, endDate]);

  const fetchSprintConfig = useCallback(async () => {
    try {
      const res = await api.get("/billing/sprint/config");
      const d = res.data?.data || res.data;
      if (d) {
        setSprintConfig(d);
        if (d.currentSprint?.startDate && d.currentSprint?.endDate) {
          setStartDate(d.currentSprint.startDate);
          setEndDate(d.currentSprint.endDate);
          fetchBillingData(d.currentSprint.startDate, d.currentSprint.endDate);
          fetchSettlements(d.currentSprint.startDate, d.currentSprint.endDate);
        }
      }
    } catch (err) {
      console.error("fetchSprintConfig error:", err);
    }
  }, [fetchBillingData, fetchSettlements]);

  // Initial load
  useEffect(() => {
    fetchSprintConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilter = (e) => {
    if (e) e.preventDefault();
    fetchBillingData(startDate, endDate);
    fetchSettlements(startDate, endDate);
  };

  const handleRefresh = () => {
    fetchSprintConfig();
    fetchBillingData(startDate, endDate);
    fetchSettlements(startDate, endDate);
  };

  const handleClearFilter = () => {
    setStartDate(defaultRange.startDate);
    setEndDate(defaultRange.endDate);
    setFarmerSearch("");
    setSelectedFarmerId("");
    setHistorySelectedMonth("current_month");
    setHistorySelectedSprint("current_sprint");
    setHistoryStateFilter("all");
    fetchBillingData(defaultRange.startDate, defaultRange.endDate);
    fetchSettlements(defaultRange.startDate, defaultRange.endDate);
  };

  const handleDownloadSummary = () => {
    const sourceRows =
      activeTab === "pending"
        ? filteredFarmers
        : filteredSettlements.map((p) => ({
            farmerName: p.farmerId?.name || "Unknown",
            farmerMobile: p.farmerId?.mobile || "",
            totalLiters: p.notes?.totalLiters || 0,
            avgFat: p.notes?.avgFat || 0,
            totalEntries: p.notes?.totalEntries || 0,
            totalAmount: (p.amount || 0) / 100,
          }));
    if (!sourceRows?.length) return;
    const headers = ["Farmer Name", "Mobile", "Total Liters", "Avg Fat", "Total Entries", "Total Amount"];
    const rows = sourceRows.map((row) => [
      row.farmerName,
      row.farmerMobile || "",
      Number(row.totalLiters || 0).toFixed(2),
      Number(row.avgFat || 0).toFixed(2),
      row.totalEntries || 0,
      Number(row.totalAmount || 0).toFixed(2),
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `billing-summary-${formatIndianDate(startDate)}-to-${formatIndianDate(endDate)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Compute Active Sprint Progress Bar metrics
  const activeSprintMetrics = useMemo(() => {
    const sprint = sprintConfig?.currentSprint || {
      sprintName: "Current Billing Sprint",
      startDate: data?.windowStart || startDate,
      endDate: data?.windowEnd || endDate,
      cycleDays: 10,
    };

    if (!sprint.startDate || !sprint.endDate) {
      return null;
    }

    const sDate = new Date(sprint.startDate);
    const eDate = new Date(sprint.endDate);
    const now = new Date();

    const startDay = new Date(sDate.getFullYear(), sDate.getMonth(), sDate.getDate()).getTime();
    const endDay = new Date(eDate.getFullYear(), eDate.getMonth(), eDate.getDate()).getTime();
    const todayDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const msDay = 1000 * 60 * 60 * 24;
    const totalDays = Math.max(1, Math.round((endDay - startDay) / msDay) + 1);
    const elapsedDays = Math.max(1, Math.min(totalDays, Math.round((todayDay - startDay) / msDay) + 1));
    const daysRemaining = Math.max(0, totalDays - elapsedDays);
    const progressPercent = Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100)));
    const isCompleted = todayDay > endDay;

    return {
      ...sprint,
      totalDays,
      elapsedDays,
      daysRemaining,
      progressPercent,
      isCompleted,
    };
  }, [sprintConfig, data, startDate, endDate]);

  const filteredFarmers = (data?.farmers || []).filter((farmer) => {
    const q = farmerSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      farmer.farmerName?.toLowerCase().includes(q) ||
      String(farmer.farmerMobile || "").includes(q)
    );
  });

  const farmerOptions = useMemo(() => {
    const pending = (data?.farmers || []).map((f) => ({ id: String(f.farmerId), name: f.farmerName, mobile: f.farmerMobile }));
    const history = (settlements || []).map((p) => ({ id: String(p.farmerId?._id || ""), name: p.farmerId?.name || "Unknown", mobile: p.farmerId?.mobile || "" }));
    const map = new Map();
    [...pending, ...history].forEach((f) => {
      if (f.id) map.set(f.id, f);
    });
    return Array.from(map.values());
  }, [data, settlements]);

  const finalFilteredFarmers = filteredFarmers.filter((f) => !selectedFarmerId || String(f.farmerId) === selectedFarmerId);

  const filteredSettlements = (settlements || []).filter((p) => {
    const q = farmerSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      p.farmerId?.name?.toLowerCase().includes(q) ||
      String(p.farmerId?.mobile || "").includes(q) ||
      String(p.internalOrderId || "").toLowerCase().includes(q)
    );
  }).filter((p) => !selectedFarmerId || String(p.farmerId?._id || "") === selectedFarmerId);

  // Settlement totals
  const settlementStats = useMemo(() => {
    let totalAmt = 0;
    let totalLiters = 0;
    filteredSettlements.forEach((p) => {
      totalAmt += (Number(p.amount || 0) / 100);
      totalLiters += Number(p.notes?.totalLiters || 0);
    });
    return {
      count: filteredSettlements.length,
      totalAmount: totalAmt,
      totalLiters,
    };
  }, [filteredSettlements]);

  // Handle Month Dropdown Change in Settlement History
  const handleHistoryMonthChange = (monthKey) => {
    setHistorySelectedMonth(monthKey);
    let s = "";
    let e = "";
    if (monthKey === "current_month") {
      const curMonthGroup = (sprintConfig?.availableSprintsGrouped || []).find((g) => g.isCurrentMonth);
      if (curMonthGroup && curMonthGroup.sprints?.length > 0) {
        const sorted = [...curMonthGroup.sprints].sort((a, b) => a.startDate.localeCompare(b.startDate));
        s = sorted[0].startDate;
        e = sorted[sorted.length - 1].endDate;
      } else {
        s = sprintConfig?.currentSprint?.startDate || "2026-11-01";
        e = sprintConfig?.currentSprint?.endDate || "2026-11-30";
      }
    } else if (monthKey === "all_time") {
      s = "2026-01-01";
      e = "2026-12-31";
    } else {
      const group = (sprintConfig?.availableSprintsGrouped || []).find((g) => g.monthYear === monthKey);
      if (group && group.sprints?.length > 0) {
        const sorted = [...group.sprints].sort((a, b) => a.startDate.localeCompare(b.startDate));
        s = sorted[0].startDate;
        e = sorted[sorted.length - 1].endDate;
      }
    }

    if (s && e) {
      setStartDate(s);
      setEndDate(e);
      setHistorySelectedSprint("all_month_sprints");
      fetchSettlements(s, e);
      fetchBillingData(s, e);
    }
  };

  // Handle Sprint Dropdown Change in Settlement History
  const handleHistorySprintChange = (sprintKey) => {
    setHistorySelectedSprint(sprintKey);
    if (sprintKey === "current_sprint") {
      const s = sprintConfig?.currentSprint?.startDate || "2026-11-21";
      const e = sprintConfig?.currentSprint?.endDate || "2026-11-30";
      setStartDate(s);
      setEndDate(e);
      fetchSettlements(s, e);
      fetchBillingData(s, e);
    } else if (sprintKey === "all_month_sprints") {
      handleHistoryMonthChange(historySelectedMonth);
    } else if (sprintKey.startsWith("sprint_")) {
      const [ , start, end] = sprintKey.split("_");
      if (start && end) {
        setStartDate(start);
        setEndDate(end);
        fetchSettlements(start, end);
        fetchBillingData(start, end);
      }
    }
  };

  // Open detailed inspection modal when clicking on any card
  const handleOpenCardDetail = async (item, isSettled) => {
    try {
      const farmerId = isSettled
        ? String(item.farmerId?._id || item.farmerId || "")
        : String(item.farmerId || item._id || "");

      const fName = isSettled ? (item.farmerId?.name || "Farmer") : (item.farmerName || "Farmer");
      const fMobile = isSettled ? (item.farmerId?.mobile || "") : (item.farmerMobile || "");
      const fVillage = isSettled ? (item.farmerId?.village || "") : (item.village || "");
      const fMemberId = isSettled
        ? (item.farmerId?.farmerMemberId || item.farmerId?.memberId || "#" + farmerId.slice(-6).toUpperCase())
        : (item.farmerMemberId || item.memberId || "#" + farmerId.slice(-6).toUpperCase());

      // FOR SETTLED PAYMENTS: The exact window is that payment's billingStartDate to billingEndDate!
      // NEVER use the page's current date filter for an older settled payment!
      const targetStart = isSettled
        ? (item.billingStartDate || item.notes?.cycleStart || startDate)
        : startDate;
      const targetEnd = isSettled
        ? (item.billingEndDate || item.notes?.cycleEnd || endDate)
        : endDate;

      setCardDetailData({
        farmerId,
        farmerMemberId: fMemberId,
        farmerName: fName,
        farmerMobile: fMobile,
        village: fVillage,
        startDate: targetStart,
        endDate: targetEnd,
        isSettled,
        rawItem: item,
        loading: true,
        breakdown: null,
      });

      // Pass paymentId (if settled) and paymentStatus so that:
      // - If settled, ONLY paid records belonging to this settlement/sprint window are returned.
      // - If pending, ONLY unpaid records belonging to this sprint window are returned.
      let queryUrl = `/billing/breakdown/${farmerId}?startDate=${targetStart}&endDate=${targetEnd}`;
      if (isSettled) {
        queryUrl += `&paymentStatus=paid`;
        if (item._id) queryUrl += `&paymentId=${item._id}`;
      } else {
        queryUrl += `&paymentStatus=unpaid`;
      }

      const res = await api.get(queryUrl);
      const bData = res.data?.data || res.data;

      setCardDetailData((prev) => (prev ? {
        ...prev,
        loading: false,
        breakdown: bData,
      } : null));
    } catch (err) {
      console.error("handleOpenCardDetail error:", err);
      toast.error("Failed to load detailed farmer collection records");
      setCardDetailData((prev) => (prev ? { ...prev, loading: false } : null));
    }
  };

  return (
    <div className="space-y-6">
      {/* Sleek Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ReceiptIndianRupee className="h-7 w-7 text-purple-600 dark:text-purple-400" /> Billing Hub
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Settle pending sheets and track historical cooperative payouts.</p>
        </div>
        
        {data && (
          <div className="flex items-center gap-2.5 self-stretch sm:self-auto justify-end">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-xl shadow-sm text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">
              <CalendarDays className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span>
                {formatIndianDate(data.windowStart || data.cycleStart)} - {formatIndianDate(data.windowEnd || data.cycleEnd)}
              </span>
            </div>
            <Button variant="outline" size="icon" onClick={handleRefresh} title="Refresh Data" className="h-10 w-10 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={cn("text-slate-600 dark:text-slate-300", loading ? "animate-spin" : "")}><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
            </Button>
            <Button variant="outline" size="icon" onClick={handleDownloadSummary} title="Export CSV Summary" className="h-10 w-10 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
              <Download className="h-4 w-4 text-slate-600 dark:text-slate-300" />
            </Button>
          </div>
        )}
      </div>

      {/* ── ACTIVE SPRINT PROGRESS BAR BANNER ── */}
      {activeSprintMetrics && (
        <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-4 sm:p-5 border border-purple-500/30 shadow-lg relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/20 border border-purple-400/30 text-purple-300 shrink-0">
                <Clock className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black tracking-wider uppercase text-purple-200">
                    Active Billing Sprint
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border",
                      activeSprintMetrics.isCompleted
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/30"
                        : "bg-amber-500/20 text-amber-300 border-amber-400/30"
                    )}
                  >
                    {activeSprintMetrics.isCompleted ? "Completed · Ready to Settle" : "In Progress"}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white mt-0.5 flex items-center gap-2">
                  {activeSprintMetrics.sprintName}
                  <span className="text-purple-300/80 font-normal text-xs sm:text-sm">
                    ({formatIndianDate(activeSprintMetrics.startDate)} to {formatIndianDate(activeSprintMetrics.endDate)})
                  </span>
                </h3>
              </div>
            </div>

            <div className="sm:text-right shrink-0">
              <div className="text-sm font-black text-white flex items-center sm:justify-end gap-1.5">
                <span>Day {activeSprintMetrics.elapsedDays} of {activeSprintMetrics.totalDays}</span>
                <span className="text-purple-300 text-xs">({activeSprintMetrics.progressPercent}%)</span>
              </div>
              <div className="text-[11px] text-purple-200/80 font-medium mt-0.5">
                {activeSprintMetrics.isCompleted ? (
                  <span className="text-emerald-400 font-bold flex items-center sm:justify-end gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Sprint span complete · Settle & dispatch unlocked
                  </span>
                ) : (
                  <span className="flex items-center sm:justify-end gap-1">
                    <Lock className="h-3 w-3 text-amber-400" />
                    {activeSprintMetrics.daysRemaining} {activeSprintMetrics.daysRemaining === 1 ? "day" : "days"} remaining until settlement unlocks
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Progress Bar Track */}
          <div className="w-full bg-slate-800/90 h-3.5 rounded-full overflow-hidden p-0.5 border border-purple-500/30 relative z-10 shadow-inner">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700 ease-out",
                activeSprintMetrics.isCompleted
                  ? "bg-gradient-to-r from-emerald-500 via-emerald-400 to-green-400 shadow-md shadow-emerald-500/50"
                  : "bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-400 shadow-md shadow-purple-500/50"
              )}
              style={{ width: `${Math.max(5, activeSprintMetrics.progressPercent)}%` }}
            />
          </div>

          {/* Sub-label dates */}
          <div className="flex items-center justify-between text-[11px] text-purple-200/70 mt-2 font-medium relative z-10">
            <span>Start: <strong className="text-white">{formatIndianDate(activeSprintMetrics.startDate)}</strong></span>
            <span className="text-xs font-bold text-white bg-white/10 px-2 py-0.5 rounded-md">
              {activeSprintMetrics.progressPercent}% Elapsed
            </span>
            <span>Target End: <strong className="text-white">{formatIndianDate(activeSprintMetrics.endDate)}</strong></span>
          </div>
        </div>
      )}

      {/* Space-Saving Modern Administrative Billing Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-sm transition-all duration-300 space-y-3">
        {/* Row 1: Segmented Tab Toggles & Responsive Date Span Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50 gap-1 w-full sm:w-auto shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab("pending")}
              className={cn(
                "flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                activeTab === "pending"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              )}
            >
              <ReceiptIndianRupee className="h-3.5 w-3.5 shrink-0" />
              <span>Pending Billing</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={cn(
                "flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                activeTab === "history"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              )}
            >
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span>Settlement History</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("sprints")}
              className={cn(
                "flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                activeTab === "sprints"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              )}
            >
              <Layers className="h-3.5 w-3.5 shrink-0" />
              <span>Sprint Cycles & History</span>
            </button>
          </div>

          {data && activeTab !== "sprints" && (
            <div className="hidden lg:flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 shrink-0">
              <CalendarDays className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              <span>
                {formatIndianDate(data.windowStart || data.cycleStart)} - {formatIndianDate(data.windowEnd || data.cycleEnd)}
              </span>
            </div>
          )}
        </div>

        {/* Row 2: Quick Search & Inline Filters (Only for Pending & History tabs) */}
        {activeTab !== "sprints" && (
          <form onSubmit={handleFilter} className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[150px] sm:min-w-[190px]">
              <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
              <input
                value={farmerSearch}
                onChange={(e) => setFarmerSearch(e.target.value)}
                placeholder="Search name/mobile..."
                className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 pl-8 pr-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all shadow-inner"
              />
            </div>

            {/* Farmer Select */}
            <div className="w-full sm:w-44 shrink-0">
              <select
                value={selectedFarmerId}
                onChange={(e) => setSelectedFarmerId(e.target.value)}
                className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all cursor-pointer"
              >
                <option value="">All Farmers</option>
                {farmerOptions.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Boundary */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 w-full sm:w-32 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all"
              />
              <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase shrink-0">to</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 w-full sm:w-32 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 shrink-0 ml-auto sm:ml-0">
              <Button type="submit" className="h-9 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-sm hover:shadow active:scale-95 transition-all">
                Filter
              </Button>
              {isFilteredActive && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleClearFilter}
                  className="h-9 px-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  Clear
                </Button>
              )}
            </div>
          </form>
        )}
      </div>

      {/* Main Tab Renderings */}
      {activeTab === "sprints" ? (
        <SprintBillingManager
          onApplySprintDates={(start, end) => {
            setStartDate(start);
            setEndDate(end);
            setActiveTab("pending");
            fetchBillingData(start, end);
            fetchSettlements(start, end);
          }}
        />
      ) : activeTab === "pending" ? (
        /* PENDING BILLING TAB WITH SUMMARY STATS AND BREAKDOWN TABLE */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          <div className="lg:col-span-3 space-y-6">
            {/* Top 5 Metrics Highlights */}
            {data && data.summary && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
                {/* Total Farmers */}
                <div className="bg-gradient-to-br from-indigo-50/50 to-blue-50/50 dark:from-slate-900/40 dark:to-slate-900/60 border border-indigo-100/40 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300">
                  <p className="text-[10px] font-black uppercase tracking-wider text-indigo-500 dark:text-indigo-400 mb-1">Total Farmers</p>
                  <p className="text-2xl font-black text-indigo-900 dark:text-white leading-tight">{data.totalFarmers || 0}</p>
                  <div className="h-1 w-6 bg-indigo-500/20 rounded-full mt-2"></div>
                </div>
                
                {/* Total Volume */}
                <div className="bg-gradient-to-br from-blue-50/50 to-cyan-50/50 dark:from-slate-900/40 dark:to-slate-900/60 border border-blue-100/40 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300">
                  <p className="text-[10px] font-black uppercase tracking-wider text-blue-500 dark:text-blue-400 mb-1">Total Volume</p>
                  <p className="text-2xl font-black text-blue-900 dark:text-white leading-tight">
                    {Number(data.summary.totalLiters || 0).toFixed(1)} <span className="text-xs opacity-65 font-bold">L</span>
                  </p>
                  <div className="h-1 w-6 bg-blue-500/20 rounded-full mt-2"></div>
                </div>

                {/* Total Entries */}
                <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-slate-900/40 dark:to-slate-900/60 border border-amber-100/40 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300">
                  <p className="text-[10px] font-black uppercase tracking-wider text-amber-500 dark:text-amber-400 mb-1">Total Entries</p>
                  <p className="text-2xl font-black text-amber-900 dark:text-white leading-tight">{data.summary.totalEntries || 0}</p>
                  <div className="h-1 w-6 bg-amber-500/20 rounded-full mt-2"></div>
                </div>

                {/* Cycle Amount */}
                <div className="bg-gradient-to-br from-emerald-50/50 to-green-50/50 dark:from-slate-900/40 dark:to-slate-900/60 border border-emerald-100/40 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300">
                  <p className="text-[10px] font-black uppercase tracking-wider text-emerald-500 dark:text-emerald-400 mb-1">Cycle Amount</p>
                  <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 leading-tight">{formatRupees(data.summary.totalAmount || 0)}</p>
                  <div className="h-1 w-6 bg-emerald-500/20 rounded-full mt-2"></div>
                </div>

                {/* Avg Rate/Ltr */}
                <div className="bg-gradient-to-br from-violet-50/50 to-purple-50/50 dark:from-slate-900/40 dark:to-slate-900/60 border border-violet-100/40 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 col-span-2 sm:col-span-1">
                  <p className="text-[10px] font-black uppercase tracking-wider text-violet-500 dark:text-violet-400 mb-1">Avg Rate/Ltr</p>
                  <p className="text-2xl font-black text-violet-900 dark:text-white leading-tight">
                    {Number(data.summary.totalLiters || 0) > 0
                      ? formatRupees((Number(data.summary.totalAmount || 0) / Number(data.summary.totalLiters || 1)).toFixed(2))
                      : "--"}
                  </p>
                  <div className="h-1 w-6 bg-violet-500/20 rounded-full mt-2"></div>
                </div>
              </div>
            )}

            {/* Active farmer details ledger */}
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm rounded-2xl">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 pb-4">
                <CardTitle className="text-lg font-black text-slate-800 dark:text-slate-200">Active Collection Sheets</CardTitle>
                <CardDescription>Individual farmer collection aggregates waiting for clearance.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex justify-center items-center py-20 min-h-[300px]">
                    <MilkifyLoader text="Synthesizing ledger data..." />
                  </div>
                ) : error ? (
                  <div className="text-center py-12 text-red-500 font-semibold">{error}</div>
                ) : data?.farmers?.length > 0 ? (
                  <BillingTable
                    farmers={finalFilteredFarmers}
                    startDate={startDate}
                    endDate={endDate}
                    onPaymentSuccess={() => {
                      fetchBillingData(startDate, endDate);
                      fetchSettlements(startDate, endDate);
                    }}
                  />
                ) : (
                  <div className="text-center py-16 text-slate-400 dark:text-slate-500 flex flex-col items-center gap-3">
                    <ReceiptIndianRupee className="h-10 w-10 opacity-20 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm font-semibold">No pending collections found for this query.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN: Highly compact vertical Daily History Feed */}
          <Card className="lg:col-span-1 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 backdrop-blur-md shadow-sm rounded-2xl overflow-hidden self-stretch lg:max-h-[700px] flex flex-col">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 pb-4">
              <CardTitle className="text-base font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <CalendarDays className="h-4.5 w-4.5 text-purple-600 dark:text-purple-400" /> Daily History Feed
              </CardTitle>
              <CardDescription className="text-xs">Day-wise collection aggregates.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 flex-1 overflow-y-auto scrollbar-thin">
              {data?.dailyHistory?.length ? (
                <div className="space-y-3">
                  {data.dailyHistory.map((day) => (
                    <div key={day.date} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200/40 dark:border-slate-800/40 hover:border-purple-200 dark:hover:border-purple-900/40 hover:shadow-sm transition-all duration-200">
                      <div className="space-y-1">
                        <p className="text-xs font-black text-slate-800 dark:text-slate-200">{formatIndianDate(day.date)}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                          <span>{day.totalEntries} entries</span>
                          <span className="opacity-45">•</span>
                          <span>{Number(day.avgFat || 0).toFixed(1)}% FAT</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-slate-900 dark:text-white">{Number(day.totalLiters || 0).toFixed(1)} L</p>
                        <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{formatRupees(day.totalAmount || 0)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500">
                  <CalendarDays className="h-10 w-10 mb-2.5 opacity-20" />
                  <p className="text-xs font-bold">No daily summary data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        /* ── SETTLEMENT HISTORY TAB WITH MONTH & SPRINT DROPDOWNS AND STATE CATEGORIZATION ── */
        <div className="space-y-4">
          {/* Quick Sprint & Month Selector Toolbar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3 transition-all duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <Filter className="h-3.5 w-3.5" />
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 block">
                    Settlement History & Sprint Filters
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Filter historical cooperative records by calendar month & sprint
                  </span>
                </div>
              </div>

              {/* Active Selection Pill & Quick Jump to Current Sprint */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800/60 text-xs font-bold text-purple-700 dark:text-purple-300">
                  <CalendarDays className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                  <span>
                    {formatIndianDate(startDate)} — {formatIndianDate(endDate)}
                  </span>
                </div>
                {sprintConfig?.currentSprint && (historySelectedSprint !== "current_sprint" || startDate !== sprintConfig.currentSprint.startDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      handleHistorySprintChange("current_sprint");
                      setHistorySelectedMonth("current_month");
                    }}
                    className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 transition-all flex items-center gap-1 active:scale-95"
                  >
                    <span>⚡ Reset to Current Sprint</span>
                  </button>
                )}
              </div>
            </div>

            {/* Row 1: Month Dropdown & Sprint Dropdown with rich theme colors & transitions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Month Dropdown */}
              <div className="relative group">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-between">
                  <span>Month View (महिना निवडा)</span>
                  <span className="text-purple-600 dark:text-purple-400 font-bold text-[9px] uppercase">
                    {historySelectedMonth === "current_month" ? "🌟 Active Month" : "Archived"}
                  </span>
                </label>
                <div className="relative">
                  <select
                    value={historySelectedMonth}
                    onChange={(e) => handleHistoryMonthChange(e.target.value)}
                    className="w-full h-11 pl-3.5 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40 hover:border-purple-400 transition-all duration-300 cursor-pointer shadow-sm appearance-none"
                  >
                    <option value="current_month">
                      🌟 {sprintConfig?.availableSprintsGrouped?.[0]?.monthYear || "November 2026"} (Current Active Month)
                    </option>
                    {(sprintConfig?.availableSprintsGrouped || []).filter((g) => !g.isCurrentMonth).map((g) => (
                      <option key={g.monthYear} value={g.monthYear}>
                        📅 {g.monthYear}
                      </option>
                    ))}
                    <option value="all_time">🗄️ All Historical Months (Full Archive)</option>
                  </select>
                  <div className="absolute right-3 top-3.5 pointer-events-none text-slate-400 group-hover:text-purple-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              </div>

              {/* Sprint Dropdown */}
              <div className="relative group">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-between">
                  <span>Sprint Cycle (बिलिंग सायकल)</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[9px] uppercase">
                    {historySelectedSprint === "current_sprint" ? "⚡ Current" : "Selected"}
                  </span>
                </label>
                <div className="relative">
                  <select
                    value={historySelectedSprint}
                    onChange={(e) => handleHistorySprintChange(e.target.value)}
                    className="w-full h-11 pl-3.5 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40 hover:border-purple-400 transition-all duration-300 cursor-pointer shadow-sm appearance-none"
                  >
                    <option value="current_sprint">
                      ⚡ Current Sprint ({formatIndianDate(sprintConfig?.currentSprint?.startDate || "2026-11-21")} - {formatIndianDate(sprintConfig?.currentSprint?.endDate || "2026-11-30")}) [Active]
                    </option>
                    <option value="all_month_sprints">📑 All Sprints of Selected Month</option>
                    {(sprintConfig?.availableSprints || []).map((s, idx) => {
                      const isOngoing = new Date(s.endDate + "T23:59:59.999Z") >= new Date() && new Date(s.startDate) <= new Date();
                      return (
                        <option key={`s_${idx}_${s.startDate}`} value={`sprint_${s.startDate}_${s.endDate}`}>
                          {isOngoing ? "⚡" : "✅"} {s.sprintName} ({formatIndianDate(s.startDate)} - {formatIndianDate(s.endDate)}) {isOngoing ? "[Active]" : "[Completed]"}
                        </option>
                      );
                    })}
                  </select>
                  <div className="absolute right-3 top-3.5 pointer-events-none text-slate-400 group-hover:text-purple-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: State Filter Pills (All / Current / Pending / Settled) */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setHistoryStateFilter("all")}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-bold transition-all duration-200",
                    historyStateFilter === "all" ? "bg-purple-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  )}
                >
                  All Records ({settlementStats.count + (finalFilteredFarmers?.length || 0)})
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryStateFilter("current")}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1",
                    historyStateFilter === "current" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  )}
                >
                  <Clock className="h-3 w-3" />
                  Current Ongoing ({isCurrentSprintActive ? (finalFilteredFarmers?.length || 0) : 0})
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryStateFilter("pending")}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1",
                    historyStateFilter === "pending" ? "bg-amber-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  )}
                >
                  <Clock className="h-3 w-3" />
                  Pending Clearance ({!isCurrentSprintActive ? (finalFilteredFarmers?.length || 0) : 0})
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryStateFilter("settled")}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1",
                    historyStateFilter === "settled" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  )}
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Settled Records ({settlementStats.count})
                </button>
              </div>

              <div className="text-[11px] text-slate-400 font-semibold">
                Click any card to inspect full daily collection breakdown
              </div>
            </div>
          </div>

          {/* Quick Summary Cards for Selected Settlements */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Settled Farmers</span>
              <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{settlementStats.count} Payouts</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Settled Milk Volume</span>
              <p className="text-xl font-black text-blue-600 dark:text-blue-400 mt-0.5">{settlementStats.totalLiters.toFixed(2)} L</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Cleared Payout</span>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{formatRupees(settlementStats.totalAmount)}</p>
            </div>
          </div>

          {/* SETTLEMENT LEDGER HISTORY CONTENT (SHOWING SETTLED AND/OR PENDING BASED ON STATE FILTER) */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 backdrop-blur-md shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100/80 dark:bg-emerald-950/20 border border-emerald-200/30 dark:border-emerald-900/40 rounded-xl">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <CardTitle className="text-lg font-black text-slate-800 dark:text-slate-200">
                    Settlement & Farmer Ledger Board
                  </CardTitle>
                  <CardDescription>
                    {historyStateFilter === "current"
                      ? "Active ongoing sprint entries. Settlement is locked until sprint completion."
                      : historyStateFilter === "pending"
                      ? "Unsettled farmers awaiting payment clearance. Click any card for detailed daily logs."
                      : historyStateFilter === "settled"
                      ? "Verified settled records of completed payments. Click any card for detailed audit logs."
                      : "Combined ledger of settled payouts and pending clearance. Click any card to inspect full records."}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-6">
              {/* If Pending / Current / All filter is active, show Farmers according to filter */}
              {(historyStateFilter === "all" || (historyStateFilter === "current" && isCurrentSprintActive) || (historyStateFilter === "pending" && !isCurrentSprintActive)) && finalFilteredFarmers?.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      {isCurrentSprintActive ? "Current Active Sprint Farmers" : "Pending Clearance Farmers"} ({finalFilteredFarmers.length})
                    </h4>
                    <span className="text-[11px] text-slate-400 font-semibold">
                      Click any card for full details · Settle payments once sprint duration completes
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {finalFilteredFarmers.map((f) => {
                      const overallRate = Number(f.totalLiters || 0) > 0 ? (Number(f.totalAmount || 0) / Number(f.totalLiters || 1)).toFixed(2) : "0.00";
                      const cowL = Number(f.cowLiters || 0);
                      const cowR = Number(f.cowRate || 0);
                      const cowA = Number(f.cowAmount || 0);
                      const bufL = Number(f.buffaloLiters || 0);
                      const bufR = Number(f.buffaloRate || 0);
                      const bufA = Number(f.buffaloAmount || 0);

                      return (
                        <div
                          key={f.farmerId}
                          onClick={() => handleOpenCardDetail(f, false)}
                          className="group relative bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/50 rounded-2xl p-4 space-y-3 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-purple-600 transition-colors">
                                  {f.farmerName}
                                </h4>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                  {f.farmerMemberId || "#" + String(f.farmerId).slice(-6).toUpperCase()}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {f.farmerMobile || "No Mobile"} {f.village ? `· ${f.village}` : ""} · Window: {formatIndianDate(startDate)} — {formatIndianDate(endDate)}
                              </p>
                            </div>
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border shrink-0 flex items-center gap-1",
                              isCurrentSprintActive
                                ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300"
                            )}>
                              <Clock className="h-2.5 w-2.5" />
                              {isCurrentSprintActive ? "Current Active" : "Pending Settle"}
                            </span>
                          </div>

                          {/* Primary Metrics */}
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="p-2 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                              <span className="text-[9px] uppercase font-bold text-slate-400">Volume</span>
                              <p className="font-black text-slate-900 dark:text-white">{Number(f.totalLiters || 0).toFixed(1)} L</p>
                            </div>
                            <div className="p-2 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                              <span className="text-[9px] uppercase font-bold text-slate-400">Avg Rate</span>
                              <p className="font-black text-slate-900 dark:text-white">₹{overallRate}</p>
                            </div>
                            <div className="p-2 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                              <span className="text-[9px] uppercase font-bold text-slate-400">Amount Due</span>
                              <p className="font-black text-emerald-600 dark:text-emerald-400">{formatRupees(f.totalAmount || 0)}</p>
                            </div>
                          </div>

                          {/* Cow & Buffalo Detailed Breakdown Badges */}
                          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-amber-200/40 dark:border-amber-900/40">
                            {/* Cow Milk Badge */}
                            <div className="p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/40">
                              <div className="flex items-center justify-between text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400">
                                <span>🐄 Cow</span>
                                <span>{cowR > 0 ? `₹${cowR.toFixed(1)}/L` : "--"}</span>
                              </div>
                              <div className="flex items-baseline justify-between mt-1">
                                <span className="text-xs font-black text-slate-800 dark:text-slate-100">{cowL.toFixed(1)} L</span>
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{formatRupees(cowA)}</span>
                              </div>
                            </div>

                            {/* Buffalo Milk Badge */}
                            <div className="p-2 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-800/40">
                              <div className="flex items-center justify-between text-[10px] font-black uppercase text-blue-700 dark:text-blue-400">
                                <span>🐃 Buffalo</span>
                                <span>{bufR > 0 ? `₹${bufR.toFixed(1)}/L` : "--"}</span>
                              </div>
                              <div className="flex items-baseline justify-between mt-1">
                                <span className="text-xs font-black text-slate-800 dark:text-slate-100">{bufL.toFixed(1)} L</span>
                                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">{formatRupees(bufA)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Settle Action Button: Enforce Settlement Disabled for Active Sprint */}
                          <div className="pt-1">
                            {isCurrentSprintActive ? (
                              <Button
                                size="sm"
                                disabled
                                className="w-full h-8 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold rounded-xl text-xs gap-1.5 cursor-not-allowed border border-slate-200 dark:border-slate-700 shadow-none"
                                title={`Settlement is locked because sprint is active until ${formatIndianDate(endDate)}. Settlement unlocks once completed.`}
                              >
                                <Lock className="h-3 w-3 text-amber-500" />
                                <span>Settlement Locked (Active Sprint)</span>
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSettleModalFarmer(f);
                                }}
                                className="w-full h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs gap-1.5 shadow-sm"
                              >
                                <IndianRupee className="h-3.5 w-3.5" />
                                <span>Settle Payment</span>
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Settled Records */}
              {(historyStateFilter === "settled" || historyStateFilter === "all") && (
                <div className="space-y-3">
                  {historyStateFilter === "all" && (
                    <h4 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <CheckCircle2 className="h-4 w-4" />
                      Completed Settlements ({filteredSettlements.length})
                    </h4>
                  )}

                  {filteredSettlements.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500">
                      <ReceiptIndianRupee className="h-10 w-10 mb-2.5 opacity-20 text-slate-300 dark:text-slate-600" />
                      <p className="text-xs font-semibold">No settled payment records found for this view.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {filteredSettlements.map((p) => {
                        const totalLit = Number(p.notes?.totalLiters || 0);
                        const totalAmt = (p.amount || 0) / 100;
                        const avgRate = totalLit > 0 ? (totalAmt / totalLit).toFixed(2) : "0.00";
                        const cowL = Number(p.notes?.cowLiters || 0);
                        const cowR = Number(p.notes?.cowRate || 0);
                        const cowA = Number(p.notes?.cowAmount || 0);
                        const bufL = Number(p.notes?.buffaloLiters || 0);
                        const bufR = Number(p.notes?.buffaloRate || 0);
                        const bufA = Number(p.notes?.buffaloAmount || 0);

                        return (
                          <div
                            key={p._id}
                            onClick={() => handleOpenCardDetail(p, true)}
                            className="group relative bg-slate-50/40 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-purple-400 hover:shadow-md transition-all duration-200 cursor-pointer"
                          >
                            {/* Status Badge */}
                            <div className="absolute top-4 right-4">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
                                <CheckCircle2 className="h-3 w-3" />
                                Settled
                              </span>
                            </div>

                            {/* Farmer Identity */}
                            <div className="flex items-center gap-3.5 mb-3">
                              <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:bg-purple-50 dark:group-hover:bg-purple-950/30 group-hover:text-purple-600 transition-all">
                                <User className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 group-hover:text-purple-600 transition-colors">
                                    {p.farmerId?.name || "Unknown Farmer"}
                                  </h4>
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                    {p.farmerId?.farmerMemberId || p.farmerId?.memberId || "#" + String(p.farmerId?._id || p.farmerId || "").slice(-6).toUpperCase()}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 font-semibold mt-0.5 tracking-wide">
                                  {p.farmerId?.mobile || "No Mobile"}
                                </p>
                              </div>
                            </div>

                            {/* Transaction Details */}
                            <div className="space-y-2.5">
                              <div className="flex items-center gap-2 p-2 bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400">
                                <CalendarDays className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                                <span>
                                  {formatIndianDate(p.billingStartDate || p.notes?.cycleStart)} — {formatIndianDate(p.billingEndDate || p.notes?.cycleEnd)}
                                </span>
                              </div>

                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div className="bg-white/40 dark:bg-slate-900/30 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                                  <p className="text-[9px] text-slate-400 uppercase font-bold">Volume</p>
                                  <p className="text-xs font-black text-slate-800 dark:text-white">{totalLit.toFixed(1)} L</p>
                                </div>
                                <div className="bg-white/40 dark:bg-slate-900/30 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                                  <p className="text-[9px] text-slate-400 uppercase font-bold">Avg Rate</p>
                                  <p className="text-xs font-black text-slate-800 dark:text-white">₹{avgRate}</p>
                                </div>
                                <div className="bg-white/40 dark:bg-slate-900/30 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                                  <p className="text-[9px] text-slate-400 uppercase font-bold">FAT</p>
                                  <p className="text-xs font-black text-slate-800 dark:text-white">{Number(p.notes?.avgFat || 0).toFixed(1)}%</p>
                                </div>
                              </div>

                              {/* Cow & Buffalo Breakdown Badges */}
                              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/50 dark:border-slate-800">
                                <div className="p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/40">
                                  <div className="flex items-center justify-between text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400">
                                    <span>🐄 Cow</span>
                                    <span>{cowR > 0 ? `₹${cowR.toFixed(1)}/L` : "--"}</span>
                                  </div>
                                  <div className="flex items-baseline justify-between mt-1">
                                    <span className="text-xs font-black text-slate-800 dark:text-slate-100">{cowL.toFixed(1)} L</span>
                                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{formatRupees(cowA)}</span>
                                  </div>
                                </div>

                                <div className="p-2 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/40">
                                  <div className="flex items-center justify-between text-[10px] font-black uppercase text-blue-700 dark:text-blue-400">
                                    <span>🐃 Buffalo</span>
                                    <span>{bufR > 0 ? `₹${bufR.toFixed(1)}/L` : "--"}</span>
                                  </div>
                                  <div className="flex items-baseline justify-between mt-1">
                                    <span className="text-xs font-black text-slate-800 dark:text-slate-100">{bufL.toFixed(1)} L</span>
                                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">{formatRupees(bufA)}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Payment Mode & Total Payout */}
                              <div className="flex items-center justify-between p-2.5 bg-emerald-500/5 dark:bg-emerald-400/5 rounded-xl border border-emerald-500/10">
                                <div className="flex items-center gap-1.5">
                                  <CreditCard className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                  <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">{p.paymentMode || "Cash"}</span>
                                </div>
                                <p className="text-base font-black text-emerald-600 dark:text-emerald-400">
                                  {formatRupees(totalAmt)}
                                </p>
                              </div>

                              <div className="pt-1 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-[9px] text-slate-400 font-mono">
                                <span>Ref: {p.notes?.referenceId || "CASH-SETTLED"}</span>
                                <span className="text-purple-600 dark:text-purple-400 font-bold hover:underline">Click for details →</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── MODAL: COMPREHENSIVE SETTLEMENT & FARMER LEDGER DETAIL (ON CARD CLICK) ── */}
      {cardDetailData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-100 dark:bg-purple-950/40 rounded-xl text-purple-600 dark:text-purple-400">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                      {cardDetailData.farmerName}
                    </h3>
                    <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 text-xs font-mono font-bold border border-purple-300 dark:border-purple-800">
                      {cardDetailData.farmerMemberId}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        cardDetailData.isSettled
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                          : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                      }`}
                    >
                      {cardDetailData.isSettled ? "Settled (Paid)" : "Pending Clearance"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {cardDetailData.farmerMobile || "No Mobile"} {cardDetailData.village ? `· ${cardDetailData.village}` : ""} · Window: {formatIndianDate(cardDetailData.startDate)} to {formatIndianDate(cardDetailData.endDate)}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setCardDetailData(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              {cardDetailData.loading ? (
                <div className="py-20 text-center text-slate-400">
                  <MilkifyLoader text="Synthesizing detailed collection records..." />
                </div>
              ) : (
                <>
                  {/* Detailed Summary KPI Cards */}
                  {cardDetailData.breakdown?.summary && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Volume</span>
                        <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                          {Number(cardDetailData.breakdown.summary.totalLiters || 0).toFixed(2)} L
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Avg FAT / SNF</span>
                        <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                          {Number(cardDetailData.breakdown.summary.avgFat || 0).toFixed(1)}% / {Number(cardDetailData.breakdown.summary.avgSnf || 0).toFixed(1)}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Avg Rate/L</span>
                        <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                          {formatRupees(cardDetailData.breakdown.summary.ratePerLiter || 0)}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                          {cardDetailData.isSettled ? "Total Cleared" : "Total Due"}
                        </span>
                        <p className="text-lg font-black text-emerald-700 dark:text-emerald-400 mt-0.5">
                          {formatRupees(cardDetailData.breakdown.summary.totalAmount || 0)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Animal Breakdown (Cow vs Buffalo) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Cow Details */}
                    {(() => {
                      const cowEntries = (cardDetailData.breakdown?.entries || []).filter((e) => e.category === "cow");
                      const cLiters = cowEntries.reduce((s, e) => s + Number(e.litter || 0), 0);
                      const cAmount = cowEntries.reduce((s, e) => s + Number(e.calculatedAmount || 0), 0);
                      const cRate = cLiters > 0 ? cAmount / cLiters : 0;
                      return (
                        <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase flex items-center gap-1.5">
                              🐄 Cow Milk Collections
                            </span>
                            <span className="text-[10px] font-bold text-emerald-600 bg-white/60 dark:bg-slate-900 px-2 py-0.5 rounded-md">
                              {cowEntries.length} entries
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                            <div>
                              <span className="text-[9px] uppercase font-bold text-slate-400">Volume</span>
                              <p className="font-black text-slate-900 dark:text-white">{cLiters.toFixed(2)} L</p>
                            </div>
                            <div>
                              <span className="text-[9px] uppercase font-bold text-slate-400">Avg Rate</span>
                              <p className="font-black text-slate-900 dark:text-white">₹{cRate.toFixed(2)}/L</p>
                            </div>
                            <div>
                              <span className="text-[9px] uppercase font-bold text-slate-400">Payout</span>
                              <p className="font-black text-emerald-600 dark:text-emerald-400">{formatRupees(cAmount)}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Buffalo Details */}
                    {(() => {
                      const bufEntries = (cardDetailData.breakdown?.entries || []).filter((e) => e.category === "buffalo");
                      const bLiters = bufEntries.reduce((s, e) => s + Number(e.litter || 0), 0);
                      const bAmount = bufEntries.reduce((s, e) => s + Number(e.calculatedAmount || 0), 0);
                      const bRate = bLiters > 0 ? bAmount / bLiters : 0;
                      return (
                        <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/50 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-blue-800 dark:text-blue-300 uppercase flex items-center gap-1.5">
                              🐃 Buffalo Milk Collections
                            </span>
                            <span className="text-[10px] font-bold text-blue-600 bg-white/60 dark:bg-slate-900 px-2 py-0.5 rounded-md">
                              {bufEntries.length} entries
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                            <div>
                              <span className="text-[9px] uppercase font-bold text-slate-400">Volume</span>
                              <p className="font-black text-slate-900 dark:text-white">{bLiters.toFixed(2)} L</p>
                            </div>
                            <div>
                              <span className="text-[9px] uppercase font-bold text-slate-400">Avg Rate</span>
                              <p className="font-black text-slate-900 dark:text-white">₹{bRate.toFixed(2)}/L</p>
                            </div>
                            <div>
                              <span className="text-[9px] uppercase font-bold text-slate-400">Payout</span>
                              <p className="font-black text-blue-600 dark:text-blue-400">{formatRupees(bAmount)}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Itemized Daily Collection Records Table */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-purple-600" />
                      Itemized Daily Collection Records ({cardDetailData.breakdown?.entries?.length || 0})
                    </h4>

                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase text-slate-500">
                          <tr>
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Shift</th>
                            <th className="py-2.5 px-3">Category</th>
                            <th className="py-2.5 px-3 text-right">Liters</th>
                            <th className="py-2.5 px-3 text-right">FAT%</th>
                            <th className="py-2.5 px-3 text-right">SNF%</th>
                            <th className="py-2.5 px-3 text-right">Rate/L</th>
                            <th className="py-2.5 px-3 text-right">Amount</th>
                            <th className="py-2.5 px-3 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {(cardDetailData.breakdown?.entries || []).map((e) => (
                            <tr key={e._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                              <td className="py-2 px-3 font-semibold text-slate-900 dark:text-slate-100">
                                {formatIndianDate(e.createdAt)}
                              </td>
                              <td className="py-2 px-3 capitalize">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${e.shift === "morning" ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" : "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"}`}>
                                  {e.shift}
                                </span>
                              </td>
                              <td className="py-2 px-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${e.category === "cow" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"}`}>
                                  {e.category === "cow" ? "🐄 Cow" : "🐃 Buffalo"}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right font-black">{Number(e.litter || 0).toFixed(2)} L</td>
                              <td className="py-2 px-3 text-right">{Number(e.fat || 0).toFixed(1)}%</td>
                              <td className="py-2 px-3 text-right">{Number(e.snf || 0).toFixed(1)}%</td>
                              <td className="py-2 px-3 text-right">₹{Number(e.rate || 0).toFixed(2)}</td>
                              <td className="py-2 px-3 text-right font-black text-emerald-600 dark:text-emerald-400">
                                {formatRupees(e.calculatedAmount || 0)}
                              </td>
                              <td className="py-2 px-3 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${e.paymentStatus === "paid" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"}`}>
                                  {e.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer with Actions & Settlement Rule Lock */}
            <div className="p-3 sm:px-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                {!cardDetailData.isSettled && isCurrentSprintActive && (
                  <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    Sprint is ongoing. Settlement unlocks on {formatIndianDate(endDate)}.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCardDetailData(null)}
                  className="h-8 px-4 rounded-xl text-xs font-bold"
                >
                  Close
                </Button>

                {!cardDetailData.isSettled && (
                  <Button
                    size="sm"
                    disabled={isCurrentSprintActive}
                    onClick={() => {
                      if (isCurrentSprintActive) {
                        toast.error(`Settlement cannot proceed before sprint completes. Unlocks on ${formatIndianDate(endDate)}.`);
                        return;
                      }
                      const raw = cardDetailData.rawItem;
                      setCardDetailData(null);
                      setSettleModalFarmer(raw);
                    }}
                    className={cn(
                      "h-8 px-4 font-bold rounded-xl text-xs gap-1.5 shadow-sm",
                      isCurrentSprintActive
                        ? "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400 cursor-not-allowed border border-slate-300 dark:border-slate-700"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
                    )}
                  >
                    {isCurrentSprintActive ? <Lock className="h-3.5 w-3.5 text-amber-500" /> : <IndianRupee className="h-3.5 w-3.5" />}
                    <span>{isCurrentSprintActive ? "Settlement Locked" : "Settle Payment Now"}</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settle Modal for Settlement History */}
      {settleModalFarmer && (
        <PaymentModal
          farmer={settleModalFarmer}
          startDate={startDate}
          endDate={endDate}
          isOpen={Boolean(settleModalFarmer)}
          onClose={() => setSettleModalFarmer(null)}
          onSuccess={() => {
            setSettleModalFarmer(null);
            fetchBillingData(startDate, endDate);
            fetchSettlements(startDate, endDate);
          }}
        />
      )}
    </div>
  );
}
