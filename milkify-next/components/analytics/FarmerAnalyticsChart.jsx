"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function FarmerAnalyticsChart({ rawData }) {
  // Process the daily breakdown into chart data
  const chartData = useMemo(() => {
    if (!rawData || !rawData.byDay || rawData.byDay.length === 0) return [];
    
    return rawData.byDay.map(day => {
      // Date comes as YYYY-MM-DD
      const dateObj = new Date(day._id);
      const shortDate = dateObj.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      
      return {
        date: shortDate,
        fullDate: day._id,
        liters: day.liters,
        avgFat: day.avgFat,
        amount: day.amount
      };
    });
  }, [rawData]);

  if (!chartData.length) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-gray-500">
          No data available for charting.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-sm">
      <CardHeader>
        <CardTitle>Daily Collection & Quality</CardTitle>
        <CardDescription>10-Day overview of volume (Liters) vs FAT %</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#6b7280', fontSize: 12 }}
                dy={10}
              />
              <YAxis 
                yAxisId="left" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                cursor={{ fill: '#f3f4f6' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              
              <Bar 
                yAxisId="left" 
                dataKey="liters" 
                name="Volume (Liters)" 
                fill="#3b82f6" 
                radius={[4, 4, 0, 0]} 
                barSize={32}
              />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="avgFat" 
                name="Avg FAT %" 
                stroke="#f59e0b" 
                strokeWidth={3}
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
