"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "@/lib/toast";
import { Loader2, Users, CreditCard, ShieldCheck, Clock, Search, Play, Pause } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function MasterDashboardOverview() {
  const [stats, setStats] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [extending, setExtending] = useState(null);
  const [extendDays, setExtendDays] = useState(30);

  const fetchData = async () => {
    try {
      const [statsRes, adminsRes] = await Promise.all([
        api.get("/master/dashboard/stats"),
        api.get("/master/admins")
      ]);
      setStats(statsRes.data.stats);
      setAdmins(adminsRes.data.admins);
    } catch (err) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusChange = async (adminId, currentStatus) => {
    const newStatus = currentStatus === "Active" ? "Pause" : "Active";
    try {
      await api.patch(`/master/admins/${adminId}/status`, { status: newStatus });
      toast.success(`Admin account ${newStatus.toLowerCase()}d successfully`);
      fetchData();
    } catch (err) {
      toast.error("Status update failed");
    }
  };

  const handleExtendSub = async (adminId) => {
    if (!extendDays || extendDays <= 0) return toast.error("Enter valid days");
    try {
      await api.patch(`/master/admins/${adminId}/subscription/extend`, { days: extendDays });
      toast.success(`Subscription extended by ${extendDays} days`);
      setExtending(null);
      fetchData();
    } catch (err) {
      toast.error("Failed to extend subscription");
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-purple-500" /></div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Master Overview</h1>
        <p className="text-slate-500 mt-1">Monitor all dairy operations, subscriptions, and platform health.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold opacity-80 text-sm">Total Admins</p>
                <h3 className="text-3xl font-black mt-2">{stats?.totalAdmins || 0}</h3>
              </div>
              <Users className="h-8 w-8 opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold opacity-80 text-sm">Active Subscriptions</p>
                <h3 className="text-3xl font-black mt-2">{stats?.activeSubCount || 0}</h3>
              </div>
              <ShieldCheck className="h-8 w-8 opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold opacity-80 text-sm">Trial Users</p>
                <h3 className="text-3xl font-black mt-2">{stats?.trialCount || 0}</h3>
              </div>
              <Clock className="h-8 w-8 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold opacity-80 text-sm">Monthly Revenue</p>
                <h3 className="text-3xl font-black mt-2">₹{stats?.monthlyRevenue || 0}</h3>
              </div>
              <CreditCard className="h-8 w-8 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg border-none">
        <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Registered Admins</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input type="text" placeholder="Search accounts..." className="h-9 w-64 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 text-xs uppercase font-bold">
                <tr>
                  <th className="px-6 py-4">Admin Info</th>
                  <th className="px-6 py-4">Dairy / Shop</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Subscription</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {admins.map((admin) => {
                  const sub = admin.subscription;
                  const isTrial = sub?.status === "trial";
                  const isActiveSub = sub?.status === "active";
                  const subEnd = isTrial ? sub?.trialEndDate : sub?.endDate;
                  
                  return (
                    <tr key={admin._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold">{admin.name}</p>
                        <p className="text-xs text-slate-500">{admin.mobile}</p>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase">Joined: {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : "N/A"}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium">{admin.shopName}</p>
                        <p className="text-xs text-slate-500">{admin.village}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${admin.Status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {admin.Status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {sub ? (
                          <div>
                            <span className={`px-2 py-1 rounded-md text-xs font-bold ${isActiveSub ? "bg-blue-100 text-blue-700" : isTrial ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                              {sub.status.toUpperCase()}
                            </span>
                            <p className="text-xs text-slate-500 mt-1">Ends: {subEnd ? new Date(subEnd).toLocaleDateString() : "N/A"}</p>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">No Sub Data</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {extending === admin._id ? (
                            <div className="flex items-center gap-2">
                              <input 
                                type="number" 
                                value={extendDays} 
                                onChange={(e) => setExtendDays(Number(e.target.value))}
                                className="w-16 h-8 text-sm border rounded px-2"
                              />
                              <Button size="sm" onClick={() => handleExtendSub(admin._id)} className="bg-purple-600 hover:bg-purple-700 text-white h-8">Save</Button>
                              <Button size="sm" variant="outline" onClick={() => setExtending(null)} className="h-8">X</Button>
                            </div>
                          ) : (
                            <>
                              <Button size="sm" variant="outline" onClick={() => setExtending(admin._id)} className="text-purple-600 border-purple-200 hover:bg-purple-50" title="Extend Subscription">
                                + Days
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className={admin.Status === "Active" ? "text-red-600 border-red-200 hover:bg-red-50" : "text-green-600 border-green-200 hover:bg-green-50"}
                                onClick={() => handleStatusChange(admin._id, admin.Status)}
                              >
                                {admin.Status === "Active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {admins.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">No admins found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
