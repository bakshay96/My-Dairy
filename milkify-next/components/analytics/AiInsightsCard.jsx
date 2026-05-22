"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit, AlertTriangle, Zap, TrendingUp, Droplet } from "lucide-react";

export default function AiInsightsCard({ farmerId, startDate, endDate }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [cached, setCached]   = useState(false);

  useEffect(() => {
    if (!startDate || !endDate) return;
    const fetchInsights = async () => {
      setLoading(true);
      setError(null);
      setData(null);
      try {
        const qs = farmerId
          ? `farmerId=${farmerId}&startDate=${startDate}&endDate=${endDate}`
          : `startDate=${startDate}&endDate=${endDate}`;
        const res = await api.get(`/analytics/ai-insights?${qs}`);
        // The global api interceptor unwraps standard envelopes, making res.data point to the inner data block.
        // We handle both unwrapped and wrapped responses robustly here.
        const rawRes = res.data;
        if (rawRes && rawRes.insight !== undefined) {
          setData(rawRes);
          setCached(!!rawRes.cached);
        } else if (rawRes && rawRes.success && rawRes.data) {
          setData(rawRes.data);
          setCached(!!rawRes.cached);
        } else {
          setError("Unexpected response from server.");
        }
      } catch (err) {
        const msg = err.response?.data?.message || "AI service is temporarily unavailable.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, [farmerId, startDate, endDate]);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Card className="border-2 border-indigo-100 dark:border-indigo-900/50 shadow-md">
        <CardContent className="p-6 flex items-center justify-center min-h-[160px]">
          <div className="flex flex-col items-center gap-3">
            <BrainCircuit className="h-8 w-8 text-indigo-500 animate-pulse" />
            <h3 className="text-xl font-bold mt-4">&quot;Magic&quot; Forecasting Mode</h3>
            <p className="text-slate-600 mt-2">
              The AI engine is currently running in fallback &quot;Demo Mode&quot; because OpenAI tokens are exhausted.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Hard error (API unavailable) ──────────────────────────────────────────
  if (error) {
    return (
      <Card className="border border-red-100 dark:border-red-900/40 shadow-sm">
        <CardContent className="p-5 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-red-600 dark:text-red-400">AI Unavailable</p>
            <p className="text-xs text-red-500/80 dark:text-red-400/70 mt-0.5">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  // ── Not-enough-data state ─────────────────────────────────────────────────
  if (data.predictedYieldNext7Days === null) {
    return (
      <Card className="border border-amber-100 dark:border-amber-900/40 shadow-sm">
        <CardContent className="p-5 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">{data.insight}</p>
        </CardContent>
      </Card>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────
  return (
    <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20 relative">
      {/* top accent bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

      <CardHeader className="pb-3 pt-6 px-5 flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle className="text-base sm:text-lg font-black flex items-center gap-2 text-indigo-900 dark:text-indigo-300">
            <BrainCircuit className="h-5 w-5 text-indigo-500 shrink-0" />
            AI Forecast &amp; Insights
          </CardTitle>
          <p className="text-[10px] font-semibold text-muted-foreground mt-1 uppercase tracking-widest">
            Powered by Generative AI
          </p>
        </div>
        {cached && (
          <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-full shrink-0">
            <Zap className="h-3 w-3" /> Cached
          </span>
        )}
      </CardHeader>

      <CardContent className="px-5 pb-5 space-y-4">
        {/* Insight text */}
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed italic border-l-4 border-indigo-400 pl-3 py-1">
          &quot;{data.insight}&quot;
        </p>

        {/* Prediction cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/40">
              <Droplet className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                Predicted Yield · 7 Days
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  {data.predictedYieldNext7Days}
                </span>
                <span className="text-sm font-semibold text-slate-400">L</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/40">
              <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                Predicted Avg FAT
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
                  {data.predictedAvgFat}
                </span>
                <span className="text-sm font-semibold text-slate-400">%</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
