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
  ShieldCheck
} from "lucide-react";
import BillingSlipModal from "./BillingSlipModal";

export default function SprintBillingManager({ onApplySprintDates }) {
  const [historyLoading, setHistoryLoading] = useState(true);
  const [cycleConfig, setCycleConfig] = useState({
    cycleDays: 10,
    autoEmailOnSprintClose: true,
    notifyZeroCollectionFarmers: true,
    currentSprint: null,
    availableSprints: [],
  });

  const [selectedSprint, setSelectedSprint] = useState(null);
  const [sprintHistory, setSprintHistory] = useState([]);
  const [savingConfig, setSavingConfig] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  // Detail Modal for a specific historical sprint
  const [inspectSprint, setInspectSprint] = useState(null);
  const [inspectFarmerSearch, setInspectFarmerSearch] = useState("");
  const [inspectFilter, setInspectFilter] = useState("all"); // "all" | "active" | "zero"

  // Thermal Slip Modal state
  const [activeSlipFarmer, setActiveSlipFarmer] = useState(null);

  // Fetch Config & Available Sprints
  const fetchConfig = useCallback(async () => {
    try {
      const res = await api.get("/billing/sprint/config");
      const d = res.data?.data || res.data;
      if (d) {
        setCycleConfig(d);
        if (!selectedSprint && d.currentSprint) {
          setSelectedSprint(d.currentSprint);
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
        autoEmailOnSprintClose: cycleConfig.autoEmailOnSprintClose,
        notifyZeroCollectionFarmers: cycleConfig.notifyZeroCollectionFarmers,
      });
      const d = res.data?.data || res.data;
      if (d) {
        setCycleConfig((prev) => ({
          ...prev,
          cycleDays: d.cycleDays,
          currentSprint: d.currentSprint,
          availableSprints: d.availableSprints,
        }));
        setSelectedSprint(d.currentSprint);
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
      toast.success("Preference saved");
    } catch (err) {
      console.error("handleTogglePreference error:", err);
      setCycleConfig((prev) => ({ ...prev, [key]: !updatedVal }));
      toast.error("Failed to update preference");
    }
  };

  // Close & Dispatch Sprint
  const handleConfirmCloseSprint = async () => {
    if (!selectedSprint) return;
    try {
      setDispatching(true);
      setConfirmModalOpen(false);

      const payload = {
        startDate: selectedSprint.startDate,
        endDate: selectedSprint.endDate,
        cycleDays: cycleConfig.cycleDays,
        sprintName: selectedSprint.sprintName,
      };

      const res = await api.post("/billing/sprint/close-and-dispatch", payload);

      toast.success(res.data?.message || "Sprint billing closed & email dispatch queued!");
      fetchHistory();
    } catch (err) {
      console.error("handleConfirmCloseSprint error:", err);
      toast.error(err.response?.data?.message || "Failed to process sprint billing");
    } finally {
      setDispatching(false);
    }
  };

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

  return (
    <div className="space-y-6">
      {/* ── TOP SECTION: Billing Cycle Configuration Card ── */}
      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 backdrop-blur-md shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-100 dark:bg-purple-950/40 border border-purple-200/50 dark:border-purple-800/40 rounded-xl">
                <Sliders className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  Configurable Billing Cycles
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                  Select your cooperative&apos;s settlement sprint duration. Months are automatically sliced starting from Day 1.
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-3 py-1 rounded-full border border-purple-200 dark:border-purple-800/50">
                Active Cycle: {cycleConfig.cycleDays} Days
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-6">
          {/* Cycle Selection Pills */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
              Cycle Length Preset
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {[
                { days: 10, label: "10 Days", desc: "1-10, 11-20, 21-End (Standard)" },
                { days: 15, label: "15 Days", desc: "1-15, 16-End (Bi-Monthly)" },
                { days: 20, label: "20 Days", desc: "1-20, 21-End" },
                { days: 5,  label: "5 Days",  desc: "5-Day Rolling Micro-Sprints" },
                { days: 30, label: "30 Days", desc: "1-End (Full Calendar Month)" },
              ].map((opt) => {
                const isActive = cycleConfig.cycleDays === opt.days;
                return (
                  <button
                    key={opt.days}
                    type="button"
                    disabled={savingConfig}
                    onClick={() => handleUpdateCycleDays(opt.days)}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                      isActive
                        ? "bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-600/20"
                        : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <span className="text-sm font-black flex items-center gap-1.5">
                      {opt.label}
                      {isActive && <CheckCircle2 className="h-3.5 w-3.5 text-white shrink-0" />}
                    </span>
                    <span className={`text-[10px] mt-1 line-clamp-1 ${isActive ? "text-purple-100" : "text-slate-400"}`}>
                      {opt.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Automated Dispatch Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
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

      {/* ── MIDDLE SECTION: Active Sprint Action Desk ── */}
      <div className="bg-gradient-to-br from-purple-900/90 via-slate-900 to-indigo-950 text-white rounded-2xl p-5 sm:p-6 shadow-xl border border-purple-500/20 relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-purple-500/30 text-purple-200 border border-purple-400/30 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider">
                <Clock className="h-3 w-3 animate-spin text-purple-300" /> Active Settlement Sprint
              </span>
              {selectedSprint?.isCurrent && (
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase">
                  Current
                </span>
              )}
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
                {selectedSprint?.sprintName || `Sprint (${cycleConfig.cycleDays} Days)`}
              </h2>
              <p className="text-purple-200/80 text-xs sm:text-sm mt-1">
                Date Span:{" "}
                <strong className="text-white">
                  {selectedSprint ? formatIndianDate(selectedSprint.startDate) : "--"}
                </strong>{" "}
                to{" "}
                <strong className="text-white">
                  {selectedSprint ? formatIndianDate(selectedSprint.endDate) : "--"}
                </strong>{" "}
                ({selectedSprint?.daysCount || cycleConfig.cycleDays} Days)
              </p>
            </div>

            {/* Quick Sprint Picker Dropdown / Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-purple-300/80 font-bold uppercase tracking-wider mr-1">
                Select Sprint:
              </span>
              {(cycleConfig.availableSprints || []).map((s) => {
                const isSelected =
                  selectedSprint?.startDate === s.startDate && selectedSprint?.endDate === s.endDate;
                return (
                  <button
                    key={`${s.startDate}_${s.endDate}`}
                    type="button"
                    onClick={() => setSelectedSprint(s)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      isSelected
                        ? "bg-white text-purple-900 shadow-md font-black"
                        : "bg-white/10 hover:bg-white/20 text-white/90 border border-white/10"
                    }`}
                  >
                    {s.sprintName.split("(")[0].trim() || `${s.startDate}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {onApplySprintDates && selectedSprint && (
              <Button
                variant="outline"
                onClick={() => onApplySprintDates(selectedSprint.startDate, selectedSprint.endDate)}
                className="h-11 px-4 bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-xl text-xs font-bold shadow-sm"
              >
                Apply to Collection Table
                <ArrowRight className="h-3.5 w-3.5 ml-2" />
              </Button>
            )}

            <Button
              onClick={() => setConfirmModalOpen(true)}
              disabled={dispatching || !selectedSprint}
              className="h-11 px-5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-black rounded-xl text-xs shadow-lg shadow-emerald-500/25 active:scale-95 transition-all"
            >
              {dispatching ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Queuing Sprint Clearance...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Close Sprint & Dispatch Bills
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* ── BOTTOM SECTION: Completed Sprints History Table ── */}
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
                    <th className="py-3 px-4 text-center">Emails Sent</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {sprintHistory.map((s) => (
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
                  {selectedSprint?.sprintName}
                </strong>{" "}
                ({selectedSprint ? formatIndianDate(selectedSprint.startDate) : ""} to{" "}
                {selectedSprint ? formatIndianDate(selectedSprint.endDate) : ""}).
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
                disabled={dispatching}
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

                      {/* View Thermal Slip button for active farmers */}
                      {f.hasCollection && (
                        <div className="pt-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveSlipFarmer({
                                farmerId: f.farmerId,
                                farmerName: f.farmerName,
                                startDate: inspectSprint.startDate,
                                endDate: inspectSprint.endDate,
                              })
                            }
                            className="text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                          >
                            <FileText className="h-3 w-3" />
                            View 80mm Thermal Slip
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
      {activeSlipFarmer && (
        <BillingSlipModal
          isOpen={true}
          onClose={() => setActiveSlipFarmer(null)}
          farmerId={activeSlipFarmer.farmerId}
          farmerName={activeSlipFarmer.farmerName}
          startDate={activeSlipFarmer.startDate}
          endDate={activeSlipFarmer.endDate}
        />
      )}
    </div>
  );
}
