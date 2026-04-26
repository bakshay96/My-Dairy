"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FarmerAnalyticsChart from "@/components/analytics/FarmerAnalyticsChart";
import { Droplet, Users, IndianRupee, Percent } from "lucide-react";
import MilkifyLoader from "@/components/ui/Loader";
import { formatRupees } from "@/lib/utils";

export default function DashboardHome() {
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [statsRes, farmersRes] = await Promise.all([
          api.get("/analytics/dashboard-stats"),
          api.get("/farmer") // get farmers to pick one for chart
        ]);
        
        setStats(statsRes.data);

        // Fetch chart data for first farmer as a sample trend, or generic
        const farmersList = farmersRes.data?.farmers || farmersRes.data || [];
        if (farmersList && farmersList.length > 0) {
           const trendRes = await api.get(`/billing/farmer/${farmersList[0]._id}`);
           if (trendRes.data) {
             setChartData(trendRes.data);
           }
        }
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setTimeout(() => setLoading(false), 600);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return <MilkifyLoader text="Loading Dashboard" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Welcome back, {user?.name || "Admin"}
        </h1>
        <p className="text-muted-foreground mt-1">Here is your dairy collection overview.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-indigo-900">Active Farmers</CardTitle>
            <Users className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-950">{stats?.totalFarmers || 0}</div>
            <p className="text-xs text-indigo-700/70">Total registered</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Today's Milk</CardTitle>
            <Droplet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-950">{stats?.totalLitersToday || 0} L</div>
            <p className="text-xs text-blue-700/70">Collected today</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-900">Today's Avg FAT</CardTitle>
            <Percent className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-950">{stats?.avgFatToday || 0}%</div>
            <p className="text-xs text-amber-700/70">Overall quality today</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-900">Cycle Amount Owed</CardTitle>
            <IndianRupee className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-950">{formatRupees(stats?.totalAmountOwed || 0)}</div>
            <p className="text-xs text-green-700/70">Current 10-day cycle</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        {chartData ? (
           <FarmerAnalyticsChart rawData={chartData} />
        ) : (
           <Card className="h-64 flex items-center justify-center bg-gray-50/50">
             <p className="text-gray-500">Not enough data to generate trends yet.</p>
           </Card>
        )}
      </div>
    </div>
  );
}
