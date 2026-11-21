"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import api from "@/lib/api";
import { formatRupees, formatIndianDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  X, 
  Loader2, 
  CheckCircle, 
  IndianRupee, 
  Calendar, 
  History, 
  ReceiptIndianRupee,
  Tag,
  FileText
} from "lucide-react";
import { toast } from "@/lib/toast";

export default function PaymentModal({ farmer, isOpen, onClose, onSuccess, startDate = "", endDate = "" }) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [referenceId, setReferenceId] = useState("");
  const [paymentMode] = useState("cash");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [settlementHistory, setSettlementHistory] = useState([]);

  // Sprint Detailed Shift Records state
  const [activeRightTab, setActiveRightTab] = useState("sprint_records"); // "sprint_records" | "history"
  const [breakdownLoading, setBreakdownLoading] = useState(false);
  const [breakdownData, setBreakdownData] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Keyboard navigation & body overflow lock
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !loading && !paymentSuccess) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose, loading, paymentSuccess]);

  // Fetch past clearance history
  useEffect(() => {
    const fetchHistory = async () => {
      if (!isOpen || !farmer?.farmerId) return;
      try {
        setHistoryLoading(true);
        const res = await api.get(
          `/payment/history?status=captured&pageSize=50&farmerId=${encodeURIComponent(String(farmer.farmerId))}`
        );
        setSettlementHistory(res.data?.payments || []);
      } catch (e) {
        console.error("Failed to fetch settlement history:", e);
        setSettlementHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    };
    fetchHistory();
  }, [isOpen, farmer?.farmerId, paymentSuccess]);

  // Fetch detailed shift entries for the selected sprint
  useEffect(() => {
    const fetchSprintBreakdown = async () => {
      if (!isOpen || !farmer?.farmerId) return;
      try {
        setBreakdownLoading(true);
        const query = `?startDate=${startDate}&endDate=${endDate}&paymentStatus=unpaid`;
        const res = await api.get(`/billing/breakdown/${farmer.farmerId}${query}`);
        setBreakdownData(res.data?.data || res.data);
      } catch (err) {
        console.error("Failed to load sprint breakdown in PaymentModal:", err);
      } finally {
        setBreakdownLoading(false);
      }
    };
    fetchSprintBreakdown();
  }, [isOpen, farmer?.farmerId, startDate, endDate]);

  const handlePayment = async () => {
    try {
      setLoading(true);

      await api.post("/payment/settle", {
        farmerId: farmer.farmerId,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        paymentMode: paymentMode || "cash",
        paymentChannel: paymentMode || "cash",
        referenceId: referenceId.trim() || undefined,
      });
      setPaymentSuccess(true);
      toast.success("Cash settlement completed successfully");
      setTimeout(() => onSuccess(), 1500);
    } catch (error) {
      console.error("Failed to initiate payment:", error);
      toast.error(error.response?.data?.message || "Failed to initiate payment.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !farmer || !mounted) return null;

  const farmerCode = farmer.farmerMemberId || farmer.memberId || "#" + String(farmer.farmerId).slice(-6).toUpperCase();
  const entries = breakdownData?.entries || [];
  const cowEntries = entries.filter((e) => e.category === "cow");
  const buffaloEntries = entries.filter((e) => e.category === "buffalo");

  const cowLiters = cowEntries.reduce((s, e) => s + Number(e.litter || 0), 0);
  const cowAmount = cowEntries.reduce((s, e) => s + Number(e.calculatedAmount || 0), 0);
  const cowRate = cowLiters > 0 ? cowAmount / cowLiters : 0;

  const buffaloLiters = buffaloEntries.reduce((s, e) => s + Number(e.litter || 0), 0);
  const buffaloAmount = buffaloEntries.reduce((s, e) => s + Number(e.calculatedAmount || 0), 0);
  const buffaloRate = buffaloLiters > 0 ? buffaloAmount / buffaloLiters : 0;

  // ── Render Directly to document.body via Portal ─────────────────────────
  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden animate-in fade-in duration-200">
      
      {/* ── Main Compact Interactive Cockpit ── */}
      <div className="w-full max-w-6xl max-h-[95vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* ── Compact Header Bar ─────────────────────────────────────────── */}
        <header className="bg-slate-50/90 dark:bg-slate-850/90 px-5 sm:px-7 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <IndianRupee className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 dark:text-white text-base sm:text-lg leading-tight">
                  Cash Clearance Desk
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-mono font-bold border border-emerald-300 dark:border-emerald-800">
                  {farmerCode}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Direct Farmer Disbursal & Clearance Ledger
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200/60 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300">
              <Calendar className="h-3 w-3 text-purple-600" />
              <span>Sprint Window: {startDate ? formatIndianDate(startDate) : "Start"} → {endDate ? formatIndianDate(endDate) : "End"}</span>
            </span>

            <button
              onClick={onClose}
              disabled={loading || paymentSuccess}
              title="Close (Esc)"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* ── Main Body: 2-Column Split Cockpit Layout ────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin">
          {paymentSuccess ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
              <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 animate-bounce">
                <CheckCircle className="h-10 w-10" />
              </div>
              <h4 className="text-2xl font-black text-slate-900 dark:text-white">Settlement Completed!</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm">
                Successfully recorded payment of <strong className="text-emerald-600">{formatRupees(farmer.totalAmount)}</strong> for <strong>{farmer.farmerName}</strong>.
              </p>
              <span className="text-xs font-mono text-slate-400">Cycle collection records updated to PAID</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              
              {/* LEFT COLUMN: Hero Amount, Presets & Farmer Info (5 cols) ─ */}
              <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
                
                {/* Hero Payable Amount Box */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-blue-500/10 dark:from-emerald-950/40 dark:to-slate-800 border border-emerald-200/80 dark:border-emerald-800/60">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-0.5">
                        Net Amount Payable (एकूण रक्कम)
                      </span>
                      <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
                        {formatRupees(farmer.totalAmount)}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Cycle Volume</span>
                      <span className="text-lg font-black text-blue-600 dark:text-blue-400">
                        {Number(farmer.totalLiters || 0).toFixed(2)} L
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5 font-semibold">
                        {farmer.totalEntries || entries.length || 0} Collections
                      </span>
                    </div>
                  </div>
                </div>

                {/* Farmer Info Compact Grid */}
                <div className="grid grid-cols-3 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Farmer</span>
                    <strong className="text-slate-900 dark:text-white font-extrabold truncate block">
                      {farmer.farmerName}
                    </strong>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Mobile</span>
                    <strong className="text-slate-900 dark:text-white font-extrabold truncate block">
                      {farmer.farmerMobile || "—"}
                    </strong>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Channel</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold truncate block">
                      Cash Desk
                    </strong>
                  </div>
                </div>

                {/* Cow & Buffalo Quick Snapshot */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400">
                      <span>🐄 Cow Milk</span>
                      <span>{cowRate > 0 ? `₹${cowRate.toFixed(1)}/L` : "--"}</span>
                    </div>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-xs font-black text-slate-800 dark:text-slate-100">{cowLiters.toFixed(1)} L</span>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{formatRupees(cowAmount)}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/40">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase text-blue-700 dark:text-blue-400">
                      <span>🐃 Buffalo Milk</span>
                      <span>{buffaloRate > 0 ? `₹${buffaloRate.toFixed(1)}/L` : "--"}</span>
                    </div>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-xs font-black text-slate-800 dark:text-slate-100">{buffaloLiters.toFixed(1)} L</span>
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">{formatRupees(buffaloAmount)}</span>
                    </div>
                  </div>
                </div>

                {/* Reference ID & Quick Presets */}
                <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 text-slate-400" /> Reference / Voucher ID (Optional)
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">Quick chips:</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "Cash Voucher",
                      "Cycle Settlement",
                      "Full Paid",
                      "Passbook Cleared"
                    ].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setReferenceId(chip)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-all ${
                          referenceId === chip
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>

                  <input
                    value={referenceId}
                    onChange={(e) => setReferenceId(e.target.value)}
                    className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 px-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner"
                    placeholder="Enter custom voucher number or cash notes..."
                  />
                </div>

                {/* Quick Settle Action Block */}
                <div className="pt-1">
                  <Button
                    onClick={handlePayment}
                    disabled={loading}
                    className="w-full h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-xl shadow-emerald-600/25 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Processing Clearance...
                      </>
                    ) : (
                      <>
                        <IndianRupee className="h-4 w-4" /> Disburse & Settle {formatRupees(farmer.totalAmount)} (Cash)
                      </>
                    )}
                  </Button>
                </div>

              </div>

              {/* RIGHT COLUMN: Detailed Records of Selected Sprint & History Tabs (7 cols) ─────── */}
              <div className="lg:col-span-7 bg-slate-50/60 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-4 flex flex-col justify-between">
                <div>
                  {/* Segmented Tab Headers */}
                  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-1.5 bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setActiveRightTab("sprint_records")}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                          activeRightTab === "sprint_records"
                            ? "bg-purple-600 text-white shadow-sm"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                        }`}
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>Sprint Records ({entries.length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveRightTab("history")}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                          activeRightTab === "history"
                            ? "bg-purple-600 text-white shadow-sm"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                        }`}
                      >
                        <History className="h-3.5 w-3.5" />
                        <span>Past Settlements ({settlementHistory.length})</span>
                      </button>
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono">
                      {activeRightTab === "sprint_records" ? "Unsettled Sprint Shifts" : "Past Cleared Vouchers"}
                    </div>
                  </div>

                  {/* Tab 1: Detailed Daily Shift Records of this Sprint */}
                  {activeRightTab === "sprint_records" && (
                    <div>
                      {breakdownLoading ? (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                          <Loader2 className="h-6 w-6 animate-spin text-purple-600 mb-2" />
                          <p className="text-xs font-bold">Loading shift records...</p>
                        </div>
                      ) : entries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-14 text-slate-400 text-center space-y-1.5">
                          <ReceiptIndianRupee className="h-8 w-8 opacity-25" />
                          <p className="text-xs font-bold text-slate-500">No shift entries found for this sprint window</p>
                          <p className="text-[10px] text-slate-400">{startDate} to {endDate}</p>
                        </div>
                      ) : (
                        <div className="max-h-[320px] overflow-y-auto pr-1 scrollbar-thin border border-slate-200/60 dark:border-slate-700/60 rounded-xl overflow-hidden">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-[10px] font-black uppercase text-slate-500 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                              <tr>
                                <th className="py-2 px-2.5">Date</th>
                                <th className="py-2 px-2">Shift</th>
                                <th className="py-2 px-2">Animal</th>
                                <th className="py-2 px-2 text-right">Liters</th>
                                <th className="py-2 px-2 text-right">FAT%</th>
                                <th className="py-2 px-2 text-right">SNF%</th>
                                <th className="py-2 px-2 text-right">Rate</th>
                                <th className="py-2 px-2.5 text-right">Amount</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-850">
                              {entries.map((e) => (
                                <tr key={e._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                  <td className="py-1.5 px-2.5 font-semibold text-slate-800 dark:text-slate-200">
                                    {formatIndianDate(e.createdAt || e.date)}
                                  </td>
                                  <td className="py-1.5 px-2 capitalize">
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${e.shift === "morning" ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" : "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"}`}>
                                      {e.shift}
                                    </span>
                                  </td>
                                  <td className="py-1.5 px-2">
                                    <span className="text-[10px] font-bold">
                                      {e.category === "cow" ? "🐄 Cow" : "🐃 Buffalo"}
                                    </span>
                                  </td>
                                  <td className="py-1.5 px-2 text-right font-black text-slate-900 dark:text-white">
                                    {Number(e.litter || 0).toFixed(2)} L
                                  </td>
                                  <td className="py-1.5 px-2 text-right font-mono">{Number(e.fat || 0).toFixed(1)}%</td>
                                  <td className="py-1.5 px-2 text-right font-mono">{Number(e.snf || 0).toFixed(1)}%</td>
                                  <td className="py-1.5 px-2 text-right font-mono">₹{Number(e.rate || 0).toFixed(1)}</td>
                                  <td className="py-1.5 px-2.5 text-right font-black text-emerald-600 dark:text-emerald-400">
                                    {formatRupees(e.calculatedAmount || 0)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 2: Past Clearance History */}
                  {activeRightTab === "history" && (
                    <div>
                      {historyLoading ? (
                        <div className="flex items-center justify-center py-16 text-slate-400">
                          <Loader2 className="h-6 w-6 animate-spin text-purple-600 mb-2" />
                        </div>
                      ) : settlementHistory.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-14 text-slate-400 text-center space-y-1.5">
                          <ReceiptIndianRupee className="h-8 w-8 opacity-25" />
                          <p className="text-xs font-bold text-slate-500">No prior settlements found</p>
                          <p className="text-[10px] text-slate-400">First time cycle settlement for this farmer.</p>
                        </div>
                      ) : (
                        <div className="max-h-[320px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                          {settlementHistory.map((p) => (
                            <div
                              key={p._id}
                              className="p-2.5 rounded-xl bg-white dark:bg-slate-850 border border-slate-200/70 dark:border-slate-700 shadow-sm text-xs flex items-center justify-between"
                            >
                              <div className="space-y-0.5">
                                <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                                  <span>{formatRupees((p.amount || 0) / 100)}</span>
                                  <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-bold">
                                    ({p.notes?.referenceId || "Cash"})
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400">
                                  {formatIndianDate(p.billingStartDate || p.notes?.cycleStart || "")} → {formatIndianDate(p.billingEndDate || p.notes?.cycleEnd || "")}
                                </p>
                              </div>
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wide">
                                Paid
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-2 text-[10px] text-slate-400 text-center font-medium border-t border-slate-200/50 dark:border-slate-700/50 mt-3">
                  Verified Cooperative Dairy Clearance · Precision Decimal128 Audit
                </div>
              </div>

            </div>
          )}
        </div>

      </div>

    </div>,
    document.body
  );
}
