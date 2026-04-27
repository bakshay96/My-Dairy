"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import BillingTable from "@/components/billing/BillingTable";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar, Download, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatIndianDate, formatRupees } from "@/lib/utils";
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

  const fetchBillingData = useCallback(async (overrideStartDate = startDate, overrideEndDate = endDate) => {
    try {
      setLoading(true);
      setError("");
      
      let url = `/billing/10-day${buildDateQuery(overrideStartDate, overrideEndDate)}`;

      const res = await api.get(url);
      setData(res.data);
    } catch (err) {
      console.error(err);
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

  useEffect(() => {
    fetchBillingData(defaultRange.startDate, defaultRange.endDate);
    fetchSettlements(defaultRange.startDate, defaultRange.endDate);
  }, [fetchBillingData, fetchSettlements, defaultRange]); // Initial load always shows last 10 days

  const handleFilter = (e) => {
    e.preventDefault();
    fetchBillingData(startDate, endDate);
    fetchSettlements(startDate, endDate);
  };

  const handleClearFilter = () => {
    setStartDate(defaultRange.startDate);
    setEndDate(defaultRange.endDate);
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing Management</h1>
          <p className="text-muted-foreground mt-1">Manage farmer payments and view historical cycles.</p>
        </div>
        
        {data && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-4 py-2 rounded-md border shadow-sm text-sm font-medium">
              <Calendar className="h-4 w-4 text-primary" />
              <span>
                {formatIndianDate(data.windowStart || data.cycleStart)} - {formatIndianDate(data.windowEnd || data.cycleEnd)}
              </span>
            </div>
            <Button variant="outline" size="icon" onClick={handleDownloadSummary} title="Download summary CSV">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <Card className="bg-gray-50/50 dark:bg-slate-900/30 border-dashed">
        <CardContent className="p-4">
          <form onSubmit={handleFilter} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div className="space-y-1 w-full sm:w-auto">
              <label className="text-xs font-medium text-gray-500">Start Date</label>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-white dark:bg-slate-900 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1 w-full sm:w-auto">
              <label className="text-xs font-medium text-gray-500">End Date</label>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-white dark:bg-slate-900 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1 w-full">
              <label className="text-xs font-medium text-gray-500">Search Farmer</label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={farmerSearch}
                  onChange={(e) => setFarmerSearch(e.target.value)}
                  placeholder="Search name/mobile"
                  className="flex h-10 w-full rounded-md border border-input bg-white dark:bg-slate-900 pl-9 pr-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
            <div className="space-y-1 w-full">
              <label className="text-xs font-medium text-gray-500">Select Farmer</label>
              <select
                value={selectedFarmerId}
                onChange={(e) => setSelectedFarmerId(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              >
                <option value="">All Farmers</option>
                {farmerOptions.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.mobile || "N/A"})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 w-full">
              <Button type="submit" className="w-full sm:w-auto flex items-center gap-2">
                <Filter className="h-4 w-4" /> Filter Records
              </Button>
              {(startDate || endDate) && (
                <Button type="button" variant="outline" onClick={handleClearFilter}>
                  Clear
                </Button>
              )}
              <Button variant="outline" type="button" onClick={handleDownloadSummary} title="Download CSV">
                <Download className="h-4 w-4 mr-1" /> Download
              </Button>
            </div>
          </form>
          <div className="mt-4 inline-flex rounded-md border p-1 bg-background">
            <button
              type="button"
              onClick={() => setActiveTab("pending")}
              className={`px-4 py-1.5 text-sm rounded ${activeTab === "pending" ? "bg-primary text-white" : "text-muted-foreground"}`}
            >
              Pending Billing
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={`px-4 py-1.5 text-sm rounded ${activeTab === "history" ? "bg-primary text-white" : "text-muted-foreground"}`}
            >
              Settlement History
            </button>
          </div>
        </CardContent>
      </Card>

      {activeTab === "pending" ? (
        <>

      <Card>
        <CardHeader>
          <CardTitle>Billing Summary</CardTitle>
          <CardDescription>All farmer stats for selected date range.</CardDescription>
        </CardHeader>
        <CardContent>
          {data?.summary && (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-5 mb-6">
              <div className="border rounded-lg p-4 bg-gray-50/40 min-h-[110px] flex flex-col justify-between">
                <p className="text-xs text-gray-500">Total Farmers</p>
                <p className="text-2xl font-bold">{data.totalFarmers || 0}</p>
              </div>
              <div className="border rounded-lg p-4 bg-gray-50/40 min-h-[110px] flex flex-col justify-between">
                <p className="text-xs text-gray-500">Total Liters</p>
                <p className="text-2xl font-bold">{Number(data.summary.totalLiters || 0).toFixed(2)} L</p>
              </div>
              <div className="border rounded-lg p-4 bg-gray-50/40 min-h-[110px] flex flex-col justify-between">
                <p className="text-xs text-gray-500">Total Entries</p>
                <p className="text-2xl font-bold">{data.summary.totalEntries || 0}</p>
              </div>
              <div className="border rounded-lg p-4 bg-gray-50/40 min-h-[110px] flex flex-col justify-between">
                <p className="text-xs text-gray-500">Total Amount</p>
                <p className="text-2xl font-bold text-green-700">{formatRupees(data.summary.totalAmount || 0)}</p>
              </div>
              <div className="border rounded-lg p-4 bg-gray-50/40 min-h-[110px] flex flex-col justify-between">
                <p className="text-xs text-gray-500">Avg Rate / Ltr</p>
                <p className="text-2xl font-bold text-blue-700">
                  {Number(data.summary.totalLiters || 0) > 0
                    ? formatRupees((Number(data.summary.totalAmount || 0) / Number(data.summary.totalLiters || 1)).toFixed(2))
                    : "--"}
                </p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-16 min-h-[300px]">
              <MilkifyLoader text="Loading Billing" />
            </div>
          ) : error ? (
            <div className="text-center py-10 text-red-500">{error}</div>
          ) : data?.farmers?.length > 0 ? (
            <BillingTable
              farmers={finalFilteredFarmers}
              startDate={startDate}
              endDate={endDate}
              onPaymentSuccess={fetchBillingData}
            />
          ) : (
            <div className="text-center py-12 text-gray-500">
              No milk entries found for the selected date range.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daily Milk Collection History</CardTitle>
          <CardDescription>Day-wise totals for the selected date range.</CardDescription>
        </CardHeader>
        <CardContent>
          {data?.dailyHistory?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-gray-500 border-b">
                  <tr>
                    <th className="text-left py-2">Date</th>
                    <th className="text-right py-2">Entries</th>
                    <th className="text-right py-2">Liters</th>
                    <th className="text-right py-2">Avg Fat</th>
                    <th className="text-right py-2">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.dailyHistory.map((day) => (
                    <tr key={day.date} className="text-foreground">
                      <td className="py-2">{formatIndianDate(day.date)}</td>
                      <td className="py-2 text-right">{day.totalEntries}</td>
                      <td className="py-2 text-right">{Number(day.totalLiters || 0).toFixed(2)} L</td>
                      <td className="py-2 text-right">{Number(day.avgFat || 0).toFixed(2)}%</td>
                      <td className="py-2 text-right font-medium">{formatRupees(day.totalAmount || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-sm text-gray-500">No daily history found for selected date range.</div>
          )}
        </CardContent>
      </Card>
      </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Settlement History</CardTitle>
            <CardDescription>Farmer-wise paid settlement records.</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredSettlements.length === 0 ? (
              <p className="text-sm text-gray-500">No settled payments found.</p>
            ) : (
              <div className="space-y-3">
                {filteredSettlements.map((p) => (
                  <div key={p._id} className="border rounded-md p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold">{p.farmerId?.name || "Unknown Farmer"}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Paid</span>
                    </div>
                    <p className="text-sm text-gray-600">{p.farmerId?.mobile || "-"}</p>
                    <p className="text-sm mt-1">
                      Range: {formatIndianDate(p.billingStartDate || p.notes?.cycleStart)} - {formatIndianDate(p.billingEndDate || p.notes?.cycleEnd)}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-xs">
                      <p>Total Liters: <strong>{Number(p.notes?.totalLiters || 0).toFixed(2)}</strong></p>
                      <p>Avg FAT: <strong>{Number(p.notes?.avgFat || 0).toFixed(2)}</strong></p>
                      <p>Entries: <strong>{p.notes?.totalEntries || 0}</strong></p>
                      <p>Amount: <strong>{formatRupees((p.amount || 0) / 100)}</strong></p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Order: {p.internalOrderId}</p>
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
