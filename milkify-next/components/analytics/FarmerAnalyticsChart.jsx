"use client";

import { useMemo } from "react";
import {
  Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ComposedChart,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// ── Custom tooltip ────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-3 text-xs min-w-[150px]">
      <p className="font-black text-slate-700 dark:text-slate-200 mb-2 border-b border-slate-100 dark:border-slate-700 pb-1">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4 mt-1">
          <span className="flex items-center gap-1.5 font-semibold text-slate-500">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: entry.color }} />
            {entry.name}
          </span>
          <span className="font-black" style={{ color: entry.color }}>
            {entry.dataKey === "liters"
              ? `${Number(entry.value).toFixed(2)} L`
              : entry.dataKey === "avgFat"
              ? `${Number(entry.value).toFixed(2)} %`
              : `₹${Number(entry.value).toFixed(2)}`}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function FarmerAnalyticsChart({ rawData }) {
  const chartData = useMemo(() => {
    if (!rawData?.byDay?.length) return [];
    return rawData.byDay.map((day) => {
      const dateObj  = new Date(day._id + "T00:00:00"); // local parse
      const shortDate = dateObj.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      return {
        date:    shortDate,
        fullDate: day._id,
        liters:  parseFloat((day.liters  || 0).toFixed(2)),
        avgFat:  parseFloat((day.avgFat  || 0).toFixed(2)),
        amount:  parseFloat((day.amount  || 0).toFixed(2)),
      };
    });
  }, [rawData]);

  if (!chartData.length) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-gray-500 text-sm font-medium">
          No data available for the selected range.
        </CardContent>
      </Card>
    );
  }

  // Compute sensible FAT Y-axis domain: round down/up to nearest integer with padding
  const fatValues = chartData.map((d) => d.avgFat).filter(Boolean);
  const fatMin = fatValues.length ? Math.max(0, Math.floor(Math.min(...fatValues)) - 1) : 0;
  const fatMax = fatValues.length ? Math.ceil(Math.max(...fatValues)) + 1 : 10;

  const literValues = chartData.map((d) => d.liters).filter(Boolean);
  const literMax = literValues.length ? Math.ceil(Math.max(...literValues) * 1.2) : 100;

  return (
    <Card className="w-full shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base sm:text-lg font-black">Daily Collection &amp; Quality</CardTitle>
        <CardDescription className="text-xs font-medium">
          Volume (bars, left axis) vs Avg FAT % (line, right axis)
        </CardDescription>
      </CardHeader>
      <CardContent className="pr-2 pl-0">
        <div className="h-[260px] sm:h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 40, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />

              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6b7280", fontSize: 11 }}
                dy={8}
                interval="preserveStartEnd"
              />

              {/* Left Y — Liters */}
              <YAxis
                yAxisId="left"
                domain={[0, literMax]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6b7280", fontSize: 11 }}
                tickFormatter={(v) => `${v}L`}
                width={42}
              />

              {/* Right Y — FAT % */}
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[fatMin, fatMax]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6b7280", fontSize: 11 }}
                tickFormatter={(v) => `${v}%`}
                width={38}
              />

              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(99,102,241,0.06)" }} />
              <Legend
                wrapperStyle={{ paddingTop: "16px", fontSize: "12px", fontWeight: 700 }}
                formatter={(value) => (
                  <span className="text-slate-600 dark:text-slate-300">{value}</span>
                )}
              />

              <Bar
                yAxisId="left"
                dataKey="liters"
                name="Volume (L)"
                fill="#6366f1"
                radius={[5, 5, 0, 0]}
                maxBarSize={36}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="avgFat"
                name="Avg FAT %"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                activeDot={{ r: 6, strokeWidth: 0, fill: "#f59e0b" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
