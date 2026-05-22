"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import BillingTable from "@/components/billing/BillingTable";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Download, Search, CheckCircle2, User, CreditCard, CalendarDays, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatIndianDate, formatRupees } from "@/lib/utils";
import MilkifyLoader from "@/components/ui/Loader";
import { getLastTenDaysRange, buildDateQuery } from "@/lib/dateRange";
import { useMemo, useCallback } from "react";

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
      // The axios interceptor already unwraps res.data.data to res.data
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

  // Initial load only
  useEffect(() => {
    fetchBillingData(defaultRange.startDate, defaultRange.endDate);
    fetchSettlements(defaultRange.startDate, defaultRange.endDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilter = (e) => {
    if (e) e.preventDefault();
    fetchBillingData(startDate, endDate);
    fetchSettlements(startDate, endDate);
  };

  const handleRefresh = () => {
    fetchBillingData(startDate, endDate);
    fetchSettlements(startDate, endDate);
  };

  const handleClearFilter = () => {
    setStartDate(defaultRange.startDate);
    setEndDate(defaultRange.endDate);
    setFarmerSearch("");
    setSelectedFarmerId("");
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
    link.download = `billing-summary-${startDate}-to-${endDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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

  return (
    <div className="space-y-6">
      {/* Sleek Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="h-7 w-7 text-purple-600 dark:text-purple-400" /> Billing Hub
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

      {/* Space-Saving Modern Administrative Billing Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-sm transition-all duration-300">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          
          {/* Left Block: Segmented Tab Toggles */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 max-w-fit shadow-inner shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("pending")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                activeTab === "pending"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-slate-200"
              )}
            >
              <Receipt className="h-3.5 w-3.5 shrink-0" />
              <span>Pending Billing</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                activeTab === "history"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-slate-200"
              )}
            >
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span>Settlement History</span>
            </button>
          </div>

          {/* Right Block: Quick Search & Inline Filters */}
          <form onSubmit={handleFilter} className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2 lg:justify-end">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-xs">
              <Search className="h-9 w-3.5 absolute left-2.5 top-0 text-slate-400 dark:text-slate-500 flex items-center pointer-events-none" />
              <input
                value={farmerSearch}
                onChange={(e) => setFarmerSearch(e.target.value)}
                placeholder="Search name/mobile..."
                className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 pl-8 pr-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all shadow-inner"
              />
            </div>

            {/* Farmer Select */}
            <div className="relative shrink-0 w-full sm:w-40">
              <select
                value={selectedFarmerId}
                onChange={(e) => setSelectedFarmerId(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all cursor-pointer"
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
            <div className="flex items-center gap-1 shrink-0 w-full sm:w-auto">
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 w-[115px] sm:w-[125px] rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all"
              />
              <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase shrink-0">to</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 w-[115px] sm:w-[125px] rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Button type="submit" className="h-9 px-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs shadow-sm hover:shadow active:scale-95 transition-all">
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
        </div>
      </div>

      {/* Dynamic Tab Panels */}
      {activeTab === "pending" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
          
          {/* LEFT COLUMN: Billing Summary Deck & active table */}
          <div className="lg:col-span-2 xl:col-span-3 space-y-6">
            
            {/* High-End Glassmorphic Summary metrics */}
            {data?.summary && (
              <div className="grid gap-3.5 grid-cols-2 sm:grid-cols-4 xl:grid-cols-5">
                
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
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 backdrop-blur-md shadow-sm overflow-hidden rounded-2xl">
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
                    <Receipt className="h-10 w-10 opacity-20 text-slate-300 dark:text-slate-600" />
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
        /* SETTLEMENT LEDGER HISTORY tab content */
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 backdrop-blur-md shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100/80 dark:bg-emerald-950/20 border border-emerald-200/30 dark:border-emerald-900/40 rounded-xl">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
              </div>
              <div>
                <CardTitle className="text-lg font-black text-slate-800 dark:text-slate-200">Settlement Ledger</CardTitle>
                <CardDescription>Verified records of completed payments and final farmer ledger clearances.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {filteredSettlements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500">
                <Receipt className="h-12 w-12 mb-3.5 opacity-20 text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-semibold">No settled payment records found for this period.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredSettlements.map((p) => (
                  <div key={p._id} className="group relative bg-slate-50/30 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-emerald-500 dark:hover:border-emerald-700 hover:shadow-md transition-all duration-300">
                    
                    {/* Status Badge */}
                    <div className="absolute top-4 right-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
                        <CheckCircle2 className="h-3 w-3" />
                        Settled
                      </span>
                    </div>

                    {/* Farmer Identity */}
                    <div className="flex items-center gap-3.5 mb-4">
                      <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/30 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-all duration-300">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {p.farmerId?.name || "Unknown Farmer"}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5 tracking-wide">
                          {p.farmerId?.mobile || "No Mobile"}
                        </p>
                      </div>
                    </div>

                    {/* Transaction Details */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2.5 p-2.5 bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                        <CalendarDays className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                          {formatIndianDate(p.billingStartDate || p.notes?.cycleStart)} — {formatIndianDate(p.billingEndDate || p.notes?.cycleEnd)}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 py-0.5">
                        <div className="bg-white/40 dark:bg-slate-900/30 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                          <p className="text-[9px] text-slate-450 uppercase font-black tracking-wider mb-0.5">Volume</p>
                          <p className="text-sm font-black text-slate-800 dark:text-white">{Number(p.notes?.totalLiters || 0).toFixed(2)} <span className="text-[10px] font-medium opacity-65">Ltr</span></p>
                        </div>
                        <div className="bg-white/40 dark:bg-slate-900/30 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                          <p className="text-[9px] text-slate-450 uppercase font-black tracking-wider mb-0.5">Avg FAT</p>
                          <p className="text-sm font-black text-slate-800 dark:text-white">{Number(p.notes?.avgFat || 0).toFixed(2)}<span className="text-[10px] font-medium opacity-65">%</span></p>
                        </div>
                      </div>

                      {/* Payment Mode & Payout */}
                      <div className="flex items-center justify-between p-3 bg-emerald-500/5 dark:bg-emerald-400/5 rounded-2xl border border-emerald-500/10 dark:border-emerald-400/10">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">{p.paymentMode || "Cash"}</span>
                        </div>
                        <p className="text-lg font-black text-emerald-650 dark:text-emerald-400">
                          {formatRupees((p.amount || 0) / 100)}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                        <div className="flex justify-between items-center text-[9px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-wide font-mono">
                          <span>Ref: {p.notes?.referenceId || p.notes?.payoutMeta?.payoutId || "CASH-SETTLED"}</span>
                          <span>ID: {p.internalOrderId?.slice(-8)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
