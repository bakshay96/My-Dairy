"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import DashboardTrendsChart from "@/components/analytics/DashboardTrendsChart";
import { 
  Droplet, Users, IndianRupee, Percent, Plus, TrendingUp, 
  Sun, Moon, Sunrise, Coffee, BarChart3, Loader2 
} from "lucide-react";
import MilkifyLoader from "@/components/ui/Loader";
import { formatRupees } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// ── Self-Contained Smooth Count Counter ──────────────────────────────────────
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
  return <span>{display.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>;
};

export default function DashboardHome() {
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [trendRange, setTrendRange] = useState("monthly");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [greeting, setGreeting] = useState("Welcome back");
  const [GreetingIcon, setGreetingIcon] = useState(Coffee);

  useEffect(() => {
    // Dynamic greeting based on hour of day
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting("Good Morning");
      setGreetingIcon(Sunrise);
    } else if (hour < 17) {
      setGreeting("Good Afternoon");
      setGreetingIcon(Sun);
    } else {
      setGreeting("Good Evening");
      setGreetingIcon(Moon);
    }
  }, []);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        if (stats) setChartLoading(true);
        else setLoading(true);

        const params = { range: trendRange };
        if (trendRange === "custom") {
          if (!startDate || !endDate) return;
          params.startDate = startDate;
          params.endDate = endDate;
        }

        const res = await api.get("/analytics/dashboard-stats", { params });
        setStats(res.data);
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
        setChartLoading(false);
      }
    };

    fetchDashboard();
  }, [trendRange, startDate, endDate]);

  if (loading) {
    return <MilkifyLoader text="Hydrating Dashboard stats..." />;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Greeting Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-500 dark:text-indigo-400 font-extrabold text-xs uppercase tracking-wider">
            <GreetingIcon className="w-4 h-4 animate-pulse-soft shrink-0" />
            <span>{greeting}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
            Hey, {user?.name || "Admin"}!
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Here is your live dairy collection analytics and metric summary.
          </p>
        </div>
        <Link href="/dashboard/add-milk" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto h-11.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-black rounded-xl shadow-md hover:shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 border-none">
            <Plus className="h-5 w-5 shrink-0" /> Add Milk Entry
          </Button>
        </Link>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Active Farmers */}
        <Card className="group relative overflow-hidden bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
          <div className="absolute top-0 bottom-0 left-0 w-1 bg-indigo-500 opacity-80 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5 flex items-center justify-between gap-4">
            <div className="space-y-1.5 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
                Active Farmers
              </span>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none pt-1">
                <AnimatedCounter value={stats?.totalFarmers || 0} />
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Registered suppliers</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Liters Collected */}
        <Card className="group relative overflow-hidden bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
          <div className="absolute top-0 bottom-0 left-0 w-1 bg-blue-500 opacity-80 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5 flex items-center justify-between gap-4">
            <div className="space-y-1.5 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
                Today&apos;s Volume
              </span>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none pt-1 flex items-baseline gap-1">
                <AnimatedCounter value={stats?.totalLitersToday || 0} />
                <span className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase">L</span>
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Liters collected today</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
              <Droplet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>

        {/* Avg FAT */}
        <Card className="group relative overflow-hidden bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
          <div className="absolute top-0 bottom-0 left-0 w-1 bg-amber-500 opacity-80 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5 flex items-center justify-between gap-4">
            <div className="space-y-1.5 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
                Average FAT
              </span>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none pt-1 flex items-baseline gap-0.5">
                <AnimatedCounter value={stats?.avgFatToday || 0} />
                <span className="text-xs font-extrabold text-slate-400 dark:text-slate-500">%</span>
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Overall batch quality</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
              <Percent className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Amount Owed */}
        <Card className="group relative overflow-hidden bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
          <div className="absolute top-0 bottom-0 left-0 w-1 bg-emerald-500 opacity-80 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5 flex items-center justify-between gap-4">
            <div className="space-y-1.5 min-w-0 flex-1">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
                Cycle Amount
              </span>
              <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight leading-none pt-1.5 truncate">
                {formatRupees(stats?.totalAmountOwed || 0)}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Active 10-day cycle</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
              <IndianRupee className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Section */}
      <div className="space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-850 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" /> Collection &amp; Financial Trends
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Filter the daily overall yields and financial payouts dynamically.</p>
          </div>

          {/* Time-range Select Filter Row */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1 bg-slate-105 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200 dark:border-slate-805 shadow-sm">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setTrendRange("weekly")}
                className={`h-7.5 text-xs font-black rounded-lg px-3 border-none hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all ${
                  trendRange === "weekly"
                    ? "bg-white dark:bg-slate-800 text-indigo-650 dark:text-indigo-400 shadow-sm font-extrabold"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                }`}
              >
                Weekly
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setTrendRange("monthly")}
                className={`h-7.5 text-xs font-black rounded-lg px-3 border-none hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all ${
                  trendRange === "monthly"
                    ? "bg-white dark:bg-slate-800 text-indigo-650 dark:text-indigo-400 shadow-sm font-extrabold"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                }`}
              >
                Monthly
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setTrendRange("max")}
                className={`h-7.5 text-xs font-black rounded-lg px-3 border-none hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all ${
                  trendRange === "max"
                    ? "bg-white dark:bg-slate-800 text-indigo-650 dark:text-indigo-400 shadow-sm font-extrabold"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                }`}
              >
                Maximum
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setTrendRange("custom")}
                className={`h-7.5 text-xs font-black rounded-lg px-3 border-none hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all ${
                  trendRange === "custom"
                    ? "bg-white dark:bg-slate-800 text-indigo-650 dark:text-indigo-400 shadow-sm font-extrabold"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                }`}
              >
                Custom Range
              </Button>
            </div>

            {trendRange === "custom" && (
              <div className="flex items-center gap-2 animate-fade-in bg-slate-55 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 p-1 rounded-xl">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-7 px-2 bg-transparent text-[10px] font-bold text-slate-700 dark:text-slate-350 focus:outline-none border-none outline-none"
                />
                <span className="text-[10px] text-slate-400 font-bold">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-7 px-2 bg-transparent text-[10px] font-bold text-slate-700 dark:text-slate-350 focus:outline-none border-none outline-none"
                />
              </div>
            )}
          </div>
        </div>

        {chartLoading ? (
          <Card className="shadow-sm border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-slate-800/80 rounded-2xl h-72 flex items-center justify-center p-6">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              <p className="text-xs text-slate-400 font-semibold animate-pulse">Filtering collections data...</p>
            </div>
          </Card>
        ) : stats?.trendData && stats.trendData.length > 0 ? (
          <DashboardTrendsChart rawData={stats.trendData} />
        ) : (
          <Card className="shadow-sm border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/10 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4 h-72">
            <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center rounded-2xl text-slate-400 dark:text-slate-500">
              <BarChart3 className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-750 dark:text-slate-250">No Trend Graph Available</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Add milk billing entries for your registered farmers to generate dynamic charts and compare performance.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
