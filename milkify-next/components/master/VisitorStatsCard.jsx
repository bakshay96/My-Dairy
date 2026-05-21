"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Eye, TrendingUp, Users, Calendar } from "lucide-react";
import api from "@/lib/api";

const VisitorStatsCard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/master/visitor-stats/summary");
      setStats(response.data.data);
    } catch (error) {
      console.error("Failed to fetch visitor summary:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className="p-6">
        <p className="text-gray-500 dark:text-gray-400">No data available</p>
      </Card>
    );
  }

  const statItems = [
    {
      label: "All-Time Visitors",
      value: stats.allTime?.toLocaleString(),
      icon: Eye,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      label: "Last 7 Days",
      value: stats.last7Days?.toLocaleString(),
      icon: TrendingUp,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-900/20",
    },
    {
      label: "Last 30 Days",
      value: stats.last30Days?.toLocaleString(),
      icon: Calendar,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
    },
    {
      label: "Unique IPs",
      value: stats.uniqueIPs?.toLocaleString(),
      icon: Users,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((item, idx) => (
        <Card key={idx} className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{item.label}</p>
              <p className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">{item.value}</p>
            </div>
            <div className={`p-3 rounded-lg ${item.bgColor}`}>
              <item.icon className={`w-6 h-6 ${item.color}`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default VisitorStatsCard;
