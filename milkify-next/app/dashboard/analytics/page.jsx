"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import FarmerAnalyticsChart from "@/components/analytics/FarmerAnalyticsChart";
import MilkifyLoader from "@/components/ui/Loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Droplet, IndianRupee, Percent } from "lucide-react";
import { formatRupees } from "@/lib/utils";

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1">Daily collection and quality trends for your dairy.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Farmers</CardTitle>
            <Users className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalFarmers || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Milk</CardTitle>
            <Droplet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalLitersToday || 0} L</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Avg FAT</CardTitle>
            <Percent className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.avgFatToday || 0}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cycle Amount Owed</CardTitle>
            <IndianRupee className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupees(stats?.totalAmountOwed || 0)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Farmer Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {farmers.length > 0 ? (
            <select
              value={selectedFarmerId}
              onChange={(e) => setSelectedFarmerId(e.target.value)}
              className="mb-4 flex h-10 w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {farmers.map((farmer) => (
                <option key={farmer._id} value={farmer._id}>
                  {farmer.name} ({farmer.mobile})
                </option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-muted-foreground mb-4">No farmers available to chart.</p>
          )}

          {chartData ? (
            <FarmerAnalyticsChart rawData={chartData} />
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-500">
              Not enough data to generate trends yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
