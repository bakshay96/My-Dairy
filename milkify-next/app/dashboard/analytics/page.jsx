"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import FarmerAnalyticsChart from "@/components/analytics/FarmerAnalyticsChart";
import AiInsightsCard from "@/components/analytics/AiInsightsCard";
import MilkifyLoader from "@/components/ui/Loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Droplet, IndianRupee, Percent, TrendingUp, Calculator, Calendar } from "lucide-react";
import { formatRupees } from "@/lib/utils";

export default function AnalyticsPage() {
  const [loading, setLoading]               = useState(true);
  const [stats, setStats]                   = useState(null);
  const [farmers, setFarmers]               = useState([]);
  const [selectedFarmerId, setSelectedFarmerId] = useState("");
  const [chartData, setChartData]           = useState(null);
  const [chartLoading, setChartLoading]     = useState(false);

  const initEnd   = new Date();
  const initStart = new Date();
  initStart.setDate(initStart.getDate() - 7);

  const [startDate, setStartDate] = useState(initStart.toISOString().split("T")[0]);
  const [endDate,   setEndDate]   = useState(initEnd.toISOString().split("T")[0]);

  // ── Load dashboard stats & farmer list once ─────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, farmersRes] = await Promise.all([
          api.get("/analytics/dashboard-stats"),
          api.get("/farmer"),
        ]);
        setStats(statsRes.data?.data || statsRes.data);
        const list = farmersRes.data?.farmers || farmersRes.data || [];
        setFarmers(list);
        if (list.length > 0) setSelectedFarmerId(list[0]._id);
      } catch (e) {
        console.error("Analytics load error:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Load chart data when farmer / dates change ──────────────────────────
  useEffect(() => {
    if (!selectedFarmerId || !startDate || !endDate) { setChartData(null); return; }
    const load = async () => {
      setChartLoading(true);
      try {
        const r = await api.get(`/billing/farmer/${selectedFarmerId}?startDate=${startDate}&endDate=${endDate}`);
        setChartData(r.data || null);
      } catch (e) {
        console.error("Farmer trend error:", e);
        setChartData(null);
      } finally {
        setChartLoading(false);
      }
    };
    load();
  }, [selectedFarmerId, startDate, endDate]);

  if (loading) return <MilkifyLoader text="Loading Analytics" />;

  return (
    <div className="space-y-6 pb-10 px-1 sm:px-0">

      {/* ── Page title ─────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          Data Insights
        </h1>
        <p className="text-sm text-muted-foreground mt-1 font-medium ml-1">
          Real-time collection trends and quality metrics.
        </p>
      </div>

      {/* ── KPI cards ──────────────────────────────────────────────────── */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-indigo-500 to-blue-600 border-0 shadow-lg shadow-blue-200 dark:shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4 px-4">
            <CardTitle className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-white/80">Active Farmers</CardTitle>
            <Users className="h-4 w-4 text-white/60" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl sm:text-3xl font-black text-white">{stats?.totalFarmers || 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-400 to-cyan-500 border-0 shadow-lg shadow-cyan-200 dark:shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4 px-4">
            <CardTitle className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-white/80">Today&apos;s Volume</CardTitle>
            <Droplet className="h-4 w-4 text-white/60" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl sm:text-3xl font-black text-white">
              {stats?.totalLitersToday || 0} <span className="text-sm opacity-60">L</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-400 to-orange-500 border-0 shadow-lg shadow-orange-200 dark:shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4 px-4">
            <CardTitle className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-white/80">Avg FAT Quality</CardTitle>
            <Percent className="h-4 w-4 text-white/60" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl sm:text-3xl font-black text-white">
              {stats?.avgFatToday || 0}<span className="text-sm opacity-60">%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 border-0 shadow-lg shadow-emerald-200 dark:shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4 px-4">
            <CardTitle className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-white/80">Cycle Payout</CardTitle>
            <IndianRupee className="h-4 w-4 text-white/60" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl sm:text-3xl font-black text-white">{formatRupees(stats?.totalAmountOwed || 0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* ── Performance Trend ──────────────────────────────────────────── */}
      <Card className="shadow-xl border-gray-100 dark:border-slate-800 overflow-hidden">
        <CardHeader className="bg-gray-50/50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-slate-800 py-5 px-4 sm:px-6">
          <div className="flex flex-col gap-3">
            <div>
              <CardTitle className="text-lg sm:text-xl font-black tracking-tight">Performance Trend</CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-0.5">
                Analyse individual farmer contribution over time.
              </p>
            </div>

            {/* Controls — responsive stack */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center">
              {/* Date range */}
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 shadow-sm flex-1 min-w-0">
                <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent text-xs sm:text-sm font-medium focus:outline-none dark:[color-scheme:dark] min-w-0 flex-1"
                />
                <span className="text-slate-400 text-xs">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent text-xs sm:text-sm font-medium focus:outline-none dark:[color-scheme:dark] min-w-0 flex-1"
                />
              </div>

              {/* Farmer selector */}
              {farmers.length > 0 ? (
                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-primary/30 rounded-xl px-3 py-2 shadow-sm">
                  <Users className="h-4 w-4 text-primary shrink-0" />
                  <select
                    value={selectedFarmerId}
                    onChange={(e) => setSelectedFarmerId(e.target.value)}
                    className="bg-transparent border-none focus:ring-0 text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-200 pr-6 focus:outline-none min-w-0"
                  >
                    {farmers.map((f) => (
                      <option key={f._id} value={f._id}>{f.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="px-4 py-2 rounded-xl bg-gray-100 text-gray-500 text-xs font-bold uppercase">
                  No Farmers Found
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6 px-3 sm:px-6">
          {chartLoading ? (
            <div className="h-48 sm:h-64 flex items-center justify-center text-slate-400">
              <div className="flex flex-col items-center gap-2">
                <Calculator className="h-8 w-8 animate-pulse opacity-30" />
                <p className="text-xs font-bold animate-pulse">Loading chart data…</p>
              </div>
            </div>
          ) : chartData ? (
            <div className="animate-in fade-in zoom-in-95 duration-500">
              <FarmerAnalyticsChart rawData={chartData} />
            </div>
          ) : (
            <div className="h-48 sm:h-64 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 dark:bg-slate-900/30 rounded-2xl border-2 border-dashed">
              <Calculator className="h-10 w-10 mb-3 opacity-20" />
              <p className="font-bold text-sm">No data for this period</p>
              <p className="text-xs font-medium opacity-60 mt-1">Record more milk entries to unlock deep trends.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── AI Insights ────────────────────────────────────────────────── */}
      <AiInsightsCard farmerId={selectedFarmerId} startDate={startDate} endDate={endDate} />
    </div>
  );
}
