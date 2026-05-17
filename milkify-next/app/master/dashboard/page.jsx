"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "@/lib/toast";
import { Loader2, Users, CreditCard, ShieldCheck, Clock, Search, Play, Pause, ArrowUpDown, ChevronUp, ChevronDown, Trash2, Eye, AlertTriangle, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function MasterDashboardOverview() {
  const [stats, setStats] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [extending, setExtending] = useState(null);
  const [extendDays, setExtendDays] = useState(30);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "desc" });

  const [deleteAdminId, setDeleteAdminId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [viewAdmin, setViewAdmin] = useState(null);
  const [selectedAdmins, setSelectedAdmins] = useState([]);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(0);

  const fetchData = async () => {
    try {
      const [statsRes, adminsRes] = await Promise.all([
        api.get("/master/dashboard/stats"),
        api.get("/master/admins")
      ]);
      setStats(statsRes.data.stats);
      setAdmins(adminsRes.data.admins);
    } catch {
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
    } catch {
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
    } catch {
      toast.error("Failed to extend subscription");
    }
  };

  const handleDeleteAdmin = async () => {
    if (!deleteAdminId) return;
    setDeleting(true);
    try {
      await api.delete(`/master/admins/${deleteAdminId}`);
      toast.success("Admin and associated data deleted permanently.");
      setDeleteAdminId(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete admin");
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedAdmins.length === 0) return;
    setDeleting(true);
    setDeleteProgress(0);
    let deletedCount = 0;
    try {
      for (const id of selectedAdmins) {
        await api.delete(`/master/admins/${id}`);
        deletedCount++;
        setDeleteProgress(Math.round((deletedCount / selectedAdmins.length) * 100));
      }
      toast.success(`${selectedAdmins.length} Admins and associated data deleted permanently.`);
      setSelectedAdmins([]);
      setBulkDeleteConfirm(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error during bulk deletion");
    } finally {
      setDeleting(false);
      setTimeout(() => setDeleteProgress(0), 1000);
    }
  };

  const toggleSelectAll = () => {
    if (selectedAdmins.length === sortedAndFilteredAdmins.length && sortedAndFilteredAdmins.length > 0) {
      setSelectedAdmins([]);
    } else {
      setSelectedAdmins(sortedAndFilteredAdmins.map(a => a._id));
    }
  };

  const toggleSelectRow = (id) => {
    if (selectedAdmins.includes(id)) {
      setSelectedAdmins(selectedAdmins.filter(aId => aId !== id));
    } else {
      setSelectedAdmins([...selectedAdmins, id]);
    }
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedAndFilteredAdmins = [...admins]
    .filter((a) => a.name?.toLowerCase().includes(searchTerm.toLowerCase()) || a.shopName?.toLowerCase().includes(searchTerm.toLowerCase()) || a.mobile?.includes(searchTerm))
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === "subscription") {
        aValue = a.subscription?.status || "";
        bValue = b.subscription?.status || "";
      }

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return <ArrowUpDown className="h-3 w-3 inline ml-1 opacity-40 cursor-pointer" />;
    return sortConfig.direction === "asc" ? <ChevronUp className="h-3 w-3 inline ml-1 text-purple-500 cursor-pointer" /> : <ChevronDown className="h-3 w-3 inline ml-1 text-purple-500 cursor-pointer" />;
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
        <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <CardTitle className="text-lg">Registered Admins</CardTitle>
            {selectedAdmins.length > 0 && (
              <Button 
                variant="destructive" 
                size="sm" 
                className="bg-red-600 hover:bg-red-700 font-bold"
                onClick={() => setBulkDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" /> Delete Selected ({selectedAdmins.length})
              </Button>
            )}
          </div>
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input type="text" placeholder="Search accounts..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-9 w-full sm:w-64 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto relative">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/90 text-slate-500 text-xs uppercase font-bold sticky top-0 z-10 shadow-sm backdrop-blur-md">
                <tr>
                  <th className="px-6 py-4 w-12">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 dark:border-slate-700 text-purple-600 focus:ring-purple-500 h-4 w-4 cursor-pointer"
                      checked={selectedAdmins.length > 0 && selectedAdmins.length === sortedAndFilteredAdmins.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 transition-colors whitespace-nowrap" onClick={() => handleSort("name")}>
                    Admin Info <SortIcon column="name" />
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 transition-colors whitespace-nowrap" onClick={() => handleSort("shopName")}>
                    Dairy / Shop <SortIcon column="shopName" />
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 transition-colors whitespace-nowrap" onClick={() => handleSort("Status")}>
                    Status <SortIcon column="Status" />
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 transition-colors whitespace-nowrap" onClick={() => handleSort("subscription")}>
                    Subscription <SortIcon column="subscription" />
                  </th>
                  <th className="px-6 py-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sortedAndFilteredAdmins.map((admin) => {
                  const sub = admin.subscription;
                  const isTrial = sub?.status === "trial";
                  const isActiveSub = sub?.status === "active";
                  const subEnd = isTrial ? sub?.trialEndDate : sub?.endDate;
                  
                  return (
                    <tr key={admin._id} className={`hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors ${selectedAdmins.includes(admin._id) ? "bg-purple-50/50 dark:bg-purple-900/10" : ""}`}>
                      <td className="px-6 py-4">
                        <input 
                          type="checkbox" 
                          className="rounded border-slate-300 dark:border-slate-700 text-purple-600 focus:ring-purple-500 h-4 w-4 cursor-pointer"
                          checked={selectedAdmins.includes(admin._id)}
                          onChange={() => toggleSelectRow(admin._id)}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold">{admin.name}</p>
                        <p className="text-xs text-slate-500">{admin.mobile}</p>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase">Joined: {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString("en-GB") : "N/A"}</p>
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
                            <p className="text-xs text-slate-500 mt-1">Ends: {subEnd ? new Date(subEnd).toLocaleDateString("en-GB") : "N/A"}</p>
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
                              <Button size="sm" variant="outline" onClick={() => setExtending(admin._id)} className="text-purple-600 border-purple-200 hover:bg-purple-50 px-2" title="Extend Subscription">
                                + Days
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-blue-600 border-blue-200 hover:bg-blue-50 px-2"
                                onClick={() => setViewAdmin(admin)}
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className={admin.Status === "Active" ? "text-amber-600 border-amber-200 hover:bg-amber-50 px-2" : "text-green-600 border-green-200 hover:bg-green-50 px-2"}
                                onClick={() => handleStatusChange(admin._id, admin.Status)}
                                title={admin.Status === "Active" ? "Pause Account" : "Activate Account"}
                              >
                                {admin.Status === "Active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-red-600 border-red-200 hover:bg-red-50 px-2"
                                onClick={() => setDeleteAdminId(admin._id)}
                                title="Delete Admin"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {sortedAndFilteredAdmins.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-slate-500">No admins found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal (Single & Bulk) */}
      {(deleteAdminId || bulkDeleteConfirm) && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 border dark:border-slate-800 rounded-3xl w-full max-w-md p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-black text-center text-slate-900 dark:text-white mb-2">Permanent Deletion</h2>
            <p className="text-slate-500 text-center text-sm mb-6">
              You are about to permanently delete {bulkDeleteConfirm ? `these ${selectedAdmins.length} Admins` : "this Admin"}. This action will also delete all associated farmers, milk entries, payments, and subscriptions. This cannot be undone. Are you absolutely sure?
            </p>
            {deleting && bulkDeleteConfirm && (
              <div className="mb-6">
                <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                  <span>Processing Deletions...</span>
                  <span>{deleteProgress}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-600 transition-all duration-300 ease-out" 
                    style={{ width: `${deleteProgress}%` }}
                  />
                </div>
              </div>
            )}
            <div className="flex gap-4">
              <Button variant="outline" className="flex-1 h-12" onClick={() => { setDeleteAdminId(null); setBulkDeleteConfirm(false); }} disabled={deleting}>Cancel</Button>
              <Button variant="destructive" className="flex-1 h-12 bg-red-600 hover:bg-red-700 font-bold" onClick={bulkDeleteConfirm ? handleBulkDelete : handleDeleteAdmin} disabled={deleting}>
                {deleting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Yes, Delete Everything"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewAdmin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 border dark:border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-purple-600 p-6 text-white flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-black">{viewAdmin.name}</h2>
                <p className="opacity-80 mt-1">{viewAdmin.email || "No Email Provided"}</p>
              </div>
              <button onClick={() => setViewAdmin(null)} className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500">Contact Number</label>
                  <p className="font-medium text-slate-900 dark:text-white">{viewAdmin.mobile}</p>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500">Dairy / Shop Name</label>
                  <p className="font-medium text-slate-900 dark:text-white">{viewAdmin.shopName}</p>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500">Village / Location</label>
                  <p className="font-medium text-slate-900 dark:text-white">{viewAdmin.village || "N/A"}</p>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500">Gender</label>
                  <p className="font-medium text-slate-900 dark:text-white">{viewAdmin.gender || "N/A"}</p>
                </div>
              </div>
              <div className="space-y-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-white border-b pb-2 dark:border-slate-800">Subscription Status</h3>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500">Current Plan</label>
                  <p className="font-medium text-slate-900 dark:text-white capitalize">{viewAdmin.subscription?.plan || "None"}</p>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500">Account Status</label>
                  <div className="mt-1">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${viewAdmin.Status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {viewAdmin.Status}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500">Subscription Expiry</label>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {viewAdmin.subscription?.endDate ? new Date(viewAdmin.subscription.endDate).toLocaleDateString("en-GB") : "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500">Joined Date</label>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {viewAdmin.createdAt ? new Date(viewAdmin.createdAt).toLocaleDateString("en-GB") : "N/A"}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t dark:border-slate-800 flex justify-end">
              <Button variant="outline" onClick={() => setViewAdmin(null)}>Close Details</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
