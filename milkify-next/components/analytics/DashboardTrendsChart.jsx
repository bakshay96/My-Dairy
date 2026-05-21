"use client";

import { useMemo, useState } from "react";
import {
  Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ComposedChart,
  Area, AreaChart
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatRupees } from "@/lib/utils";
import { BarChart3, LineChart, TrendingUp, Layers } from "lucide-react";

// ── Custom composed tooltip ──────────────────────────────────────────────────
function CustomDashboardTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-slate-900/95 dark:bg-slate-950/95 border border-slate-800 text-white rounded-xl shadow-xl p-4.5 text-xs min-w-[220px] backdrop-blur-md space-y-2">
      <p className="font-extrabold text-slate-300 border-b border-slate-800 pb-1.5 mb-1.5 uppercase tracking-wider text-[10px]">
        {new Date(label).toLocaleDateString(undefined, { dateStyle: "medium" })}
      </p>
      
      <div className="space-y-1.5">
        {payload.map((entry) => {
          let valueStr = `${Number(entry.value).toFixed(2)} L`;
          if (entry.dataKey.includes("Amount") || entry.dataKey === "totalAmount") {
            valueStr = formatRupees(entry.value);
          }
          return (
            <div key={entry.dataKey} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 font-medium text-slate-400">
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: entry.color }} />
                {entry.name}
              </span>
              <span className="font-black font-mono text-[11px]" style={{ color: entry.color }}>
                {valueStr}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DashboardTrendsChart({ rawData }) {
  const [viewMode, setViewMode] = useState("composed"); // composed, liters, amount

  const chartData = useMemo(() => {
    if (!rawData || !rawData.length) return [];
    return rawData.map((day) => {
      const dateObj = new Date(day.date + "T00:00:00");
      const shortDate = dateObj.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      return {
        ...day,
        formattedDate: shortDate,
      };
    });
  }, [rawData]);

  // Calculate dynamic totals for legend / header cards
  const statsSummary = useMemo(() => {
    let cow = 0, buffalo = 0, goat = 0, sheep = 0, totalLiters = 0, totalAmount = 0;
    if (!chartData.length) return { cow, buffalo, goat, sheep, totalLiters, totalAmount };
    chartData.forEach(d => {
      cow += d.cowLiters || 0;
      buffalo += d.buffaloLiters || 0;
      goat += d.goatLiters || 0;
      sheep += d.sheepLiters || 0;
      totalLiters += d.totalLiters || 0;
      totalAmount += d.totalAmount || 0;
    });
    return { cow, buffalo, goat, sheep, totalLiters, totalAmount };
  }, [chartData]);

  // Compute sensible Y-axis domains
  const maxLiters = useMemo(() => {
    if (!chartData.length) return 10;
    return Math.max(...chartData.map(d => d.totalLiters), 10);
  }, [chartData]);

  const maxAmount = useMemo(() => {
    if (!chartData.length) return 100;
    return Math.max(...chartData.map(d => d.totalAmount), 100);
  }, [chartData]);

  if (!chartData.length) {
    return (
      <Card className="border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/10 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4 h-72">
        <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center rounded-2xl text-slate-400 dark:text-slate-500">
          <BarChart3 className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-slate-750 dark:text-slate-250">No Daily Trend Found</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Record cow, buffalo, sheep or goat milk entries for this date range to visualize the detailed trend charts.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-sm border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-slate-800/80 rounded-2xl overflow-hidden">
      <CardHeader className="pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/20 px-5 sm:px-6">
        <div>
          <CardTitle className="text-base sm:text-lg font-black flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
            Collection &amp; Financial Analysis
          </CardTitle>
          <CardDescription className="text-xs font-semibold text-slate-400 mt-0.5">
            Category wise breakdowns vs grand totals in a unified composed dashboard view.
          </CardDescription>
        </div>

        {/* View mode buttons */}
        <div className="flex items-center gap-1 bg-slate-200/60 dark:bg-slate-900/60 p-1 rounded-xl w-fit border border-slate-300/40 dark:border-slate-700/20">
          <Button
            size="sm"
            onClick={() => setViewMode("composed")}
            className={`h-8 text-xs font-extrabold px-3.5 rounded-lg border-none shadow-none transition-all ${
              viewMode === "composed"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                : "bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/40 dark:hover:bg-slate-800/30"
            }`}
          >
            <Layers className="w-3.5 h-3.5 mr-1.5 shrink-0" /> Composed View
          </Button>
          <Button
            size="sm"
            onClick={() => setViewMode("liters")}
            className={`h-8 text-xs font-extrabold px-3.5 rounded-lg border-none shadow-none transition-all ${
              viewMode === "liters"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                : "bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/40 dark:hover:bg-slate-800/30"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 mr-1.5 shrink-0" /> Liters Trend
          </Button>
          <Button
            size="sm"
            onClick={() => setViewMode("amount")}
            className={`h-8 text-xs font-extrabold px-3.5 rounded-lg border-none shadow-none transition-all ${
              viewMode === "amount"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                : "bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/40 dark:hover:bg-slate-800/30"
            }`}
          >
            <LineChart className="w-3.5 h-3.5 mr-1.5 shrink-0" /> Finance (₹)
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6">
        {/* Quick summary strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4.5 mb-6">
          <div className="bg-slate-50/50 dark:bg-slate-900/10 p-3 rounded-xl border border-slate-100 dark:border-slate-800/40">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Overall Volume</p>
            <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">{statsSummary.totalLiters.toFixed(1)} L</p>
          </div>
          <div className="bg-slate-50/50 dark:bg-slate-900/10 p-3 rounded-xl border border-slate-100 dark:border-slate-800/40">
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Cow Total</p>
            <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">{statsSummary.cow.toFixed(1)} L</p>
          </div>
          <div className="bg-slate-50/50 dark:bg-slate-900/10 p-3 rounded-xl border border-slate-100 dark:border-slate-800/40">
            <p className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">Buffalo Total</p>
            <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">{statsSummary.buffalo.toFixed(1)} L</p>
          </div>
          <div className="bg-slate-50/50 dark:bg-slate-900/10 p-3 rounded-xl border border-slate-100 dark:border-slate-800/40">
            <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Goat Total</p>
            <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">{statsSummary.goat.toFixed(1)} L</p>
          </div>
          <div className="bg-slate-50/50 dark:bg-slate-900/10 p-3 rounded-xl border border-slate-100 dark:border-slate-800/40">
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Total Value</p>
            <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-450 mt-0.5">{formatRupees(statsSummary.totalAmount)}</p>
          </div>
        </div>

        <div className="h-[280px] sm:h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === "composed" ? (
              <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-slate-700/40" />
                <XAxis
                  dataKey="formattedDate"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }}
                  dy={8}
                />
                
                {/* Liters Axis */}
                <YAxis
                  yAxisId="left"
                  domain={[0, Math.ceil(maxLiters * 1.15)]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }}
                  tickFormatter={(v) => `${v}L`}
                  width={42}
                />

                {/* Amount Axis */}
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, Math.ceil(maxAmount * 1.15)]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#10b981", fontSize: 10, fontWeight: 700 }}
                  tickFormatter={(v) => `₹${v}`}
                  width={46}
                />

                <Tooltip content={<CustomDashboardTooltip />} cursor={{ fill: "rgba(99,102,241,0.04)" }} />
                <Legend
                  wrapperStyle={{ paddingTop: "20px", fontSize: "11px", fontWeight: 800 }}
                  formatter={(value) => <span className="text-slate-600 dark:text-slate-350">{value}</span>}
                />

                {/* Stacked Animal bars for separate volumes */}
                <Bar yAxisId="left" dataKey="cowLiters" name="Cow L" fill="#6366f1" stackId="animals" maxBarSize={32} radius={[0, 0, 0, 0]} />
                <Bar yAxisId="left" dataKey="buffaloLiters" name="Buffalo L" fill="#a78bfa" stackId="animals" maxBarSize={32} radius={[0, 0, 0, 0]} />
                <Bar yAxisId="left" dataKey="goatLiters" name="Goat L" fill="#f59e0b" stackId="animals" maxBarSize={32} radius={[0, 0, 0, 0]} />
                <Bar yAxisId="left" dataKey="sheepLiters" name="Sheep L" fill="#3b82f6" stackId="animals" maxBarSize={32} radius={[4, 4, 0, 0]} />

                {/* Financial Amount as Line Overlay on separate YAxis */}
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="totalAmount"
                  name="Value (₹)"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                  activeDot={{ r: 6, strokeWidth: 0, fill: "#10b981" }}
                />
              </ComposedChart>
            ) : viewMode === "liters" ? (
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-slate-700/40" />
                <XAxis
                  dataKey="formattedDate"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }}
                  dy={8}
                />
                <YAxis
                  domain={[0, Math.ceil(maxLiters * 1.15)]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }}
                  tickFormatter={(v) => `${v}L`}
                  width={42}
                />
                <Tooltip content={<CustomDashboardTooltip />} cursor={{ fill: "rgba(99,102,241,0.04)" }} />
                <Legend
                  wrapperStyle={{ paddingTop: "20px", fontSize: "11px", fontWeight: 800 }}
                  formatter={(value) => <span className="text-slate-600 dark:text-slate-350">{value}</span>}
                />

                <Bar dataKey="cowLiters" name="Cow Milk (L)" fill="#6366f1" maxBarSize={16} radius={[3, 3, 0, 0]} />
                <Bar dataKey="buffaloLiters" name="Buffalo Milk (L)" fill="#a78bfa" maxBarSize={16} radius={[3, 3, 0, 0]} />
                <Bar dataKey="goatLiters" name="Goat Milk (L)" fill="#f59e0b" maxBarSize={16} radius={[3, 3, 0, 0]} />
                <Bar dataKey="sheepLiters" name="Sheep Milk (L)" fill="#3b82f6" maxBarSize={16} radius={[3, 3, 0, 0]} />
                
                {/* Overall Milk volume overlay */}
                <Line
                  type="monotone"
                  dataKey="totalLiters"
                  name="Total Milk (L)"
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  dot={{ r: 3, strokeWidth: 1.5, fill: "#fff" }}
                />
              </ComposedChart>
            ) : (
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-slate-700/40" />
                <XAxis
                  dataKey="formattedDate"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }}
                  dy={8}
                />
                <YAxis
                  domain={[0, Math.ceil(maxAmount * 1.1)]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }}
                  tickFormatter={(v) => `₹${v}`}
                  width={46}
                />
                <Tooltip content={<CustomDashboardTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: "20px", fontSize: "11px", fontWeight: 800 }}
                  formatter={(value) => <span className="text-slate-600 dark:text-slate-350">{value}</span>}
                />
                <Area
                  type="monotone"
                  dataKey="totalAmount"
                  name="Total Value (₹)"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorAmount)"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
