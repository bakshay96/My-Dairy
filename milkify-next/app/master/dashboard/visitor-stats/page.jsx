"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
  Area, AreaChart,
} from "recharts";
import {
  Eye, Globe, Monitor, Smartphone, Tablet, Calendar, Download,
  TrendingUp, Users, Activity, RefreshCw, Filter, BarChart3,
} from "lucide-react";
import api from "@/lib/api";

// ── Helpers ──────────────────────────────────────────────────────────────────
const DEVICE_COLORS = { desktop: "#6366f1", mobile: "#f59e0b", tablet: "#10b981", unknown: "#94a3b8" };
const DEVICE_ICONS  = { desktop: Monitor, mobile: Smartphone, tablet: Tablet, unknown: Monitor };


const COUNTRY_FLAGS = {
  IN: "🇮🇳", US: "🇺🇸", GB: "🇬🇧", CA: "🇨🇦", AU: "🇦🇺", DE: "🇩🇪", FR: "🇫🇷",
  JP: "🇯🇵", SG: "🇸🇬", AE: "🇦🇪", BR: "🇧🇷", NL: "🇳🇱", KR: "🇰🇷", IT: "🇮🇹",
  Unknown: "🌍",
};

const COUNTRY_NAMES = {
  IN: "India",
  US: "United States",
  GB: "United Kingdom",
  CA: "Canada",
  AU: "Australia",
  DE: "Germany",
  FR: "France",
  JP: "Japan",
  SG: "Singapore",
  AE: "United Arab Emirates",
  BR: "Brazil",
  NL: "Netherlands",
  KR: "South Korea",
  IT: "Italy",
  Unknown: "Localhost (India)",
};

const AnimatedCounter = ({ value, duration = 800 }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!value) { setDisplay(0); return; }
    let start = 0;
    const step = Math.ceil(value / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(start);
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);
  return <span>{display.toLocaleString()}</span>;
};

// ── Shimmer Skeleton ─────────────────────────────────────────────────────────
const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700/60 ${className}`} />
);

const SummaryCardSkeleton = () => (
  <div className="rounded-2xl p-5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
    <Skeleton className="h-4 w-24 mb-3" />
    <Skeleton className="h-8 w-16 mb-2" />
    <Skeleton className="h-3 w-20" />
  </div>
);

// ── Custom Tooltip ───────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-bold" style={{ color: p.color }}>
          {p.name}: {p.value?.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════════════════════════════
export default function VisitorStatsPage() {
  const [stats, setStats]       = useState([]);
  const [summary, setSummary]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [groupBy, setGroupBy]   = useState("day");
  const [sortBy, setSortBy]     = useState("date");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate]     = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // ── Fetch summary (all-time stats) ─────────────────────────────────────
  const fetchSummary = useCallback(async () => {
    try {
      const res = await api.get("/master/visitor-stats/summary");
      setSummary(res.data);
    } catch (err) {
      console.error("[VisitorStats] Summary fetch failed:", err);
    }
  }, []);

  // ── Fetch chart data ───────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      setChartLoading(true);
      const params = { groupBy, sortBy };
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
      const res = await api.get("/master/visitor-stats", { params });
      setStats(res.data?.stats || []);
    } catch (err) {
      console.error("[VisitorStats] Chart fetch failed:", err);
    } finally {
      setChartLoading(false);
    }
  }, [groupBy, sortBy, fromDate, toDate]);

  // ── Initial load ───────────────────────────────────────────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    Promise.all([fetchSummary(), fetchStats()]).finally(() => setLoading(false));
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (!loading) fetchStats(); }, [groupBy, sortBy]);

  const handleApplyFilters = () => fetchStats();
  const handleReset = () => {
    setFromDate(""); setToDate(""); setGroupBy("day"); setSortBy("date");
  };

  const handleExportCSV = () => {
    const headers = ["Date Range", "Visitor Count"];
    const rows = stats.map((item) => [item._id, item.count]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const el = document.createElement("a");
    el.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(csv));
    el.setAttribute("download", `visitor-stats-${new Date().toISOString().split("T")[0]}.csv`);
    el.style.display = "none";
    document.body.appendChild(el);
    el.click();
    document.body.removeChild(el);
  };

  // ── Summary card config ────────────────────────────────────────────────
  const summaryCards = summary ? [
    { label: "All-Time Visits",  value: summary.allTime,         icon: Eye,        gradient: "from-indigo-500 to-purple-600" },
    { label: "Today",            value: summary.todayCount,       icon: Activity,   gradient: "from-emerald-500 to-teal-600" },
    { label: "Last 7 Days",      value: summary.last7Days,        icon: TrendingUp, gradient: "from-blue-500 to-cyan-600" },
    { label: "Last 30 Days",     value: summary.last30Days,       icon: Calendar,   gradient: "from-amber-500 to-orange-600" },
    { label: "Unique IPs",       value: summary.uniqueIPs,        icon: Users,      gradient: "from-rose-500 to-pink-600" },
    { label: "Countries",        value: summary.uniqueCountries,  icon: Globe,      gradient: "from-violet-500 to-fuchsia-600" },
  ] : [];

  // ── Device chart data ──────────────────────────────────────────────────
  const deviceData = summary?.deviceBreakdown?.map((d) => ({
    name: d.device.charAt(0).toUpperCase() + d.device.slice(1),
    value: d.count,
    color: DEVICE_COLORS[d.device] || DEVICE_COLORS.unknown,
  })) || [];

  const totalDeviceVisits = deviceData.reduce((sum, d) => sum + d.value, 0) || 1;

  // ── Top countries ──────────────────────────────────────────────────────
  const topCountries = summary?.topCountries || [];
  const maxCountryCount = topCountries[0]?.count || 1;

  // ══════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════
  if (loading) {
    return (
      <div className="space-y-6">
        <div><Skeleton className="h-8 w-56 mb-2" /><Skeleton className="h-4 w-72" /></div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => <SummaryCardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" /><Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Visitor Analytics
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time traffic insights for your platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { fetchSummary(); fetchStats(); }}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
          {stats.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> CSV
            </Button>
          )}
        </div>
      </div>

      {/* ── Summary Cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 p-4 sm:p-5 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 hover:-translate-y-0.5"
          >
            {/* Gradient accent */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient} opacity-80 group-hover:opacity-100 transition-opacity`} />
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-sm`}>
                <card.icon className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-tight">
                {card.label}
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              <AnimatedCounter value={card.value} />
            </p>
          </div>
        ))}
      </div>

      {/* ── Device Breakdown + Top Countries ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Device Donut */}
        <Card className="p-5 sm:p-6 bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/60">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
            <Monitor className="w-4 h-4 text-indigo-500" /> Device Breakdown
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">All-time visitor distribution by device type</p>

          {deviceData.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-44 h-44 sm:w-48 sm:h-48 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deviceData}
                      cx="50%" cy="50%"
                      innerRadius={50} outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {deviceData.map((d, i) => (
                        <Cell key={i} fill={d.color} className="drop-shadow-sm" />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => v.toLocaleString()} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2.5 w-full">
                {deviceData.map((d) => {
                  const Icon = DEVICE_ICONS[d.name.toLowerCase()] || Monitor;
                  const pct = ((d.value / totalDeviceVisits) * 100).toFixed(1);
                  return (
                    <div key={d.name} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${d.color}20` }}>
                        <Icon className="w-4 h-4" style={{ color: d.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between mb-1">
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{d.name}</span>
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, backgroundColor: d.color }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums w-12 text-right">
                        {d.value.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-slate-400 text-sm">No device data</div>
          )}
        </Card>

        {/* Top Countries */}
        <Card className="p-5 sm:p-6 bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/60">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
            <Globe className="w-4 h-4 text-violet-500" /> Top Countries
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Visitors by geographic location</p>

          {topCountries.length > 0 ? (
            <div className="space-y-2">
              {topCountries.map((c, i) => {
                const pct = ((c.count / maxCountryCount) * 100).toFixed(0);
                const flag = COUNTRY_FLAGS[c.country] || "🌍";
                return (
                  <div key={c.country} className="flex items-center gap-3 group/row">
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 w-5 text-right tabular-nums">{i + 1}</span>
                    <span className="text-lg leading-none">{flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
                          {COUNTRY_NAMES[c.country] || c.country || "Unknown Country"}
                        </span>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 tabular-nums ml-2">
                          {c.count.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-slate-400 text-sm">No country data</div>
          )}
        </Card>
      </div>

      {/* ── Filter Bar ──────────────────────────────────────────────────── */}
      <Card className="p-4 sm:p-6 bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/60">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 w-full sm:hidden mb-3"
        >
          <Filter className="w-4 h-4" /> {showFilters ? "Hide Filters" : "Show Filters"}
        </button>

        <div className={`${showFilters ? "block" : "hidden"} sm:block`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">From</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">To</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Group By</label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
              >
                <option value="day">Daily</option>
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Sort</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
              >
                <option value="date">Date ↑</option>
                <option value="count">Count ↓</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleApplyFilters} disabled={chartLoading} className="flex-1 text-sm">
                {chartLoading ? "Loading..." : "Apply"}
              </Button>
              <Button variant="outline" onClick={handleReset} className="text-sm">
                Reset
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Charts Section ──────────────────────────────────────────────── */}
      {chartLoading ? (
        <div className="grid grid-cols-1 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      ) : stats.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          {/* ── Area/Line Chart ──────────────────────────────────────── */}
          <Card className="p-5 sm:p-6 bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/60">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" /> Visitor Trend
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {groupBy === "day" ? "Daily" : groupBy === "week" ? "Weekly" : "Monthly"} visitor traffic over time
            </p>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={stats} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:opacity-20" />
                <XAxis
                  dataKey="_id"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fill="url(#colorVisitors)"
                  name="Visitors"
                  dot={{ r: 3, fill: "#6366f1", strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "#6366f1", stroke: "#fff", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* ── Bar Chart ────────────────────────────────────────────── */}
          <Card className="p-5 sm:p-6 bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/60">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-500" /> Visitor Distribution
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Comparative visitor volumes
            </p>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={stats} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:opacity-20" />
                <XAxis
                  dataKey="_id"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar
                  dataKey="count"
                  fill="url(#barGradient)"
                  name="Visitors"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* ── Data Table ───────────────────────────────────────────── */}
          <Card className="overflow-hidden bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/60">
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-700/60">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Detailed View
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {stats.length} records found
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="text-left py-3 px-5 sm:px-6 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                      {groupBy === "day" ? "Date" : groupBy === "week" ? "Week" : "Month"}
                    </th>
                    <th className="text-right py-3 px-5 sm:px-6 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                      Visitors
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {stats.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                      <td className="py-3 px-5 sm:px-6 text-slate-700 dark:text-slate-200 font-medium">{item._id}</td>
                      <td className="py-3 px-5 sm:px-6 text-right font-bold text-slate-900 dark:text-white tabular-nums">
                        {item.count.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : (
        <Card className="p-12 sm:p-16 text-center bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/60">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center">
            <Calendar className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-medium">No visitor data available for the selected range</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Try adjusting the date filters or check back later</p>
        </Card>
      )}
    </div>
  );
}
