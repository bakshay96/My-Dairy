"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import FarmerAnalyticsChart from "@/components/analytics/FarmerAnalyticsChart";
import MilkifyLoader from "@/components/ui/Loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Droplet, IndianRupee, Percent } from "lucide-react";
import { formatRupees } from "@/lib/utils";
import { TrendingUp,Calculator } from "lucide-react";

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [farmers, setFarmers] = useState([]);
  const [selectedFarmerId, setSelectedFarmerId] = useState("");
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    const fetchBaseData = async () => {
      try {
        const [statsRes, farmersRes] = await Promise.all([
          api.get("/analytics/dashboard-stats"),
          api.get("/farmer"),
        ]);
        setStats(statsRes.data);

        const farmersList = farmersRes.data?.farmers || farmersRes.data || [];
        setFarmers(farmersList);

        if (farmersList.length > 0) {
          setSelectedFarmerId(farmersList[0]._id);
        }
      } catch (error) {
        console.error("Failed to load analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBaseData();
  }, []);

  useEffect(() => {
    if (!selectedFarmerId) {
      setChartData(null);
      return;
    }

    const fetchFarmerTrend = async () => {
      try {
        const trendRes = await api.get(`/billing/farmer/${selectedFarmerId}`);
        setChartData(trendRes.data || null);
      } catch (error) {
        console.error("Failed to load farmer trend:", error);
        setChartData(null);
      }
    };

    fetchFarmerTrend();
  }, [selectedFarmerId]);

  if (loading) {
    return <MilkifyLoader text="Loading Analytics" />;
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <TrendingUp className="h-7 w-7" />
            </div>
            Data Insights
          </h1>
          <p className="text-muted-foreground mt-1 font-medium ml-1">Real-time collection trends and quality metrics.</p>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-indigo-500 to-blue-600 border-0 shadow-lg shadow-blue-200 dark:shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-white/80">Active Farmers</CardTitle>
            <Users className="h-4 w-4 text-white/60" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white">{stats?.totalFarmers || 0}</div>
            <p className="text-[10px] text-white/60 font-medium mt-1">Growth: +2% this week</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-400 to-cyan-500 border-0 shadow-lg shadow-cyan-200 dark:shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-white/80">Today&apos;s Volume</CardTitle>
            <Droplet className="h-4 w-4 text-white/60" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white">{stats?.totalLitersToday || 0} <span className="text-sm opacity-60">L</span></div>
            <p className="text-[10px] text-white/60 font-medium mt-1">Target: 500L daily</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-400 to-orange-500 border-0 shadow-lg shadow-orange-200 dark:shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-white/80">Avg FAT Quality</CardTitle>
            <Percent className="h-4 w-4 text-white/60" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white">{stats?.avgFatToday || 0}<span className="text-sm opacity-60">%</span></div>
            <p className="text-[10px] text-white/60 font-medium mt-1">Status: Excellent</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 border-0 shadow-lg shadow-emerald-200 dark:shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-white/80">Cycle Payout</CardTitle>
            <IndianRupee className="h-4 w-4 text-white/60" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white">{formatRupees(stats?.totalAmountOwed || 0)}</div>
            <p className="text-[10px] text-white/60 font-medium mt-1">Due in 3 days</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        <Card className="shadow-xl border-gray-100 dark:border-slate-800 overflow-hidden">
          <CardHeader className="bg-gray-50/50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-slate-800 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-black tracking-tight">Performance Trend</CardTitle>
                <p className="text-sm text-muted-foreground font-medium mt-1">Analyze individual farmer contribution over time.</p>
              </div>
              
              <div className="relative">
                {farmers.length > 0 ? (
                  <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border-2 border-primary/20 rounded-2xl px-3 py-1.5 shadow-sm">
                    <Users className="h-4 w-4 text-primary" />
                    <select
                      value={selectedFarmerId}
                      onChange={(e) => setSelectedFarmerId(e.target.value)}
                      className="bg-transparent border-none focus:ring-0 text-sm font-bold text-gray-700 dark:text-gray-200 pr-8"
                    >
                      {farmers.map((farmer) => (
                        <option key={farmer._id} value={farmer._id}>
                          {farmer.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="px-4 py-2 rounded-xl bg-gray-100 text-gray-500 text-xs font-bold uppercase">No Farmers Found</div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-8">
            {chartData ? (
              <div className="animate-in fade-in zoom-in-95 duration-500">
                <FarmerAnalyticsChart rawData={chartData} />
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 dark:bg-slate-900/30 rounded-3xl border-2 border-dashed">
                <Calculator className="h-12 w-12 mb-3 opacity-20" />
                <p className="font-bold">Gathering data for this period...</p>
                <p className="text-xs font-medium opacity-60">Record more entries to unlock deep trends.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
