"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MilkifyLoader from "@/components/ui/Loader";
import { formatRupees, formatIndianDate } from "@/lib/utils";
import { Droplet, Users, IndianRupee, Activity, CalendarDays, Receipt } from "lucide-react";

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBillingData = async () => {
      try {
        const response = await api.get("/billing/10-day");
        // Due to the global response interceptor in api.js, response.data holds the actual payload
        // The backend returns { windowStart, windowEnd, totalFarmers, summary, farmers }
        setData(response.data);
      } catch (error) {
        console.error("Failed to load 10-day billing data:", error);
      } finally {
        // Adding slight delay so user can see the cool animation
        setTimeout(() => setLoading(false), 800);
      }
    };

    fetchBillingData();
  }, []);

  if (loading) {
    return <MilkifyLoader text="Loading Dashboard" />;
  }

  const { windowStart, windowEnd, summary, farmers } = data || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <Activity className="h-8 w-8 text-primary" /> 10-Day Billing Overview
        </h1>
        <p className="text-muted-foreground mt-1 flex items-center gap-1.5">
          <CalendarDays className="h-4 w-4" /> 
          Cycle: {windowStart ? formatIndianDate(windowStart) : 'N/A'} — {windowEnd ? formatIndianDate(windowEnd) : 'N/A'}
        </p>
      </div>

      {/* ── Summary Stats ── */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Total Milk (10 Days)</CardTitle>
            <Droplet className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-950">{summary?.totalLiters?.toFixed(1) || 0} L</div>
            <p className="text-xs text-blue-700/70 mt-1">From {summary?.totalEntries || 0} entries</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-900">Total Amount Owed</CardTitle>
            <IndianRupee className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-950">{formatRupees(summary?.totalAmount || 0)}</div>
            <p className="text-xs text-green-700/70 mt-1">Calculated across all farmers</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-900">Active Farmers</CardTitle>
            <Users className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-950">{farmers?.length || 0}</div>
            <p className="text-xs text-amber-700/70 mt-1">Contributed in this cycle</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Detailed Table ── */}
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="border-b bg-gray-50/50 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" /> Farmer Billing Breakdown
          </CardTitle>
          <CardDescription>Review the calculated payouts for the current 10-day cycle and process payments.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {!farmers || farmers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Droplet className="h-12 w-12 text-gray-200 mb-3" />
              <h3 className="text-lg font-medium text-gray-900">No data collected</h3>
              <p className="text-gray-500 mt-1">No milk data collected for the last 10 days.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-medium border-b">
                  <tr>
                    <th className="px-5 py-3 text-left">Farmer Name</th>
                    <th className="px-5 py-3 text-right">Total Liters</th>
                    <th className="px-5 py-3 text-right hidden sm:table-cell">Avg FAT %</th>
                    <th className="px-5 py-3 text-right">Amount Owed</th>
                    <th className="px-5 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {farmers.map((farmer) => (
                    <tr key={farmer.farmerId} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-medium text-gray-900">{farmer.farmerName}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{farmer.farmerMobile}</div>
                      </td>
                      <td className="px-5 py-4 text-right font-medium text-gray-700">
                        {farmer.totalLiters.toFixed(1)} <span className="text-gray-400 text-xs">L</span>
                      </td>
                      <td className="px-5 py-4 text-right hidden sm:table-cell text-gray-600">
                        {farmer.avgFat.toFixed(2)}%
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-green-600">
                        {formatRupees(farmer.totalAmount)}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <Button 
                          size="sm" 
                          className="bg-primary hover:bg-primary/90 text-white font-medium px-4 shadow-sm"
                          onClick={() => alert(`Processing payment of ${formatRupees(farmer.totalAmount)} for ${farmer.farmerName}...`)}
                        >
                          Pay Now
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
