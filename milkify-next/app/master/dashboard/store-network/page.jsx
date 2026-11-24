"use client";

import React, { useEffect, useState, useMemo } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  Store,
  Building,
  Package,
  ShoppingBag,
  TrendingUp,
  Search,
  ExternalLink,
  MapPin,
  RefreshCw,
  Power,
} from "lucide-react";
import Link from "next/link";

export default function MasterStoreNetworkPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOutlets: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalGMV: 0,
  });
  const [outlets, setOutlets] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [togglingId, setTogglingId] = useState(null);

  const fetchNetworkData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/store/master/network-stats");
      if (res.data?.success) {
        setStats(res.data.stats || {});
        setOutlets(res.data.outlets || []);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load store network statistics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNetworkData();
  }, []);

  const handleToggleStore = async (outletId, currentStatus) => {
    try {
      setTogglingId(outletId);
      const res = await api.patch(`/store/master/outlets/${outletId}/toggle`);
      if (res.data?.success) {
        toast.success(res.data.message || `Store outlet status updated`);
        setOutlets((prev) =>
          prev.map((o) => (o._id === outletId ? { ...o, isStoreEnabled: !currentStatus } : o))
        );
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to toggle store outlet status.");
    } finally {
      setTogglingId(null);
    }
  };

  const filteredOutlets = useMemo(() => {
    return outlets.filter((outlet) => {
      const matchesSearch =
        outlet.storeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        outlet.slug?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        outlet.village?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        outlet.adminId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        outlet.adminId?.shopName?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && outlet.isStoreEnabled) ||
        (statusFilter === "disabled" && !outlet.isStoreEnabled);

      return matchesSearch && matchesStatus;
    });
  }, [outlets, searchQuery, statusFilter]);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Franchise &amp; Retail Network
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Dairy Outlets &amp; E-Commerce Network
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Centralized governance of dairy outlets, cattle feed stores, village geofences, and platform GMV.
          </p>
        </div>

        <button
          onClick={fetchNetworkData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-sm font-semibold text-slate-300 hover:text-white transition active:scale-95 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-400" : ""}`} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Registered Outlets</span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Store className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-white mt-3">{stats.totalOutlets}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Active dairy storefronts</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Catalogued Products</span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-white mt-3">{stats.totalProducts}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Feed, Dairy &amp; Kirana</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Store Orders</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-white mt-3">{stats.totalOrders}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Online &amp; POS Counter Sales</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Network GMV</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-400 mt-3">₹{stats.totalGMV.toLocaleString("en-IN")}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Gross merchandise transacted</span>
        </div>
      </div>

      {/* Outlets Table & Filters */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">All Dairy Outlets ({filteredOutlets.length})</h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search outlet, village, admin..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-48 sm:w-64"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Outlets</option>
              <option value="active">Active Only</option>
              <option value="disabled">Disabled Only</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs">Loading franchise network...</p>
          </div>
        ) : filteredOutlets.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Store className="w-12 h-12 text-slate-700 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-400">No dairy outlets found</p>
            <p className="text-xs text-slate-600 mt-1">Outlets are automatically created when dairy admins open their store.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3.5">Store Outlet</th>
                  <th className="px-4 py-3.5">Dairy Admin</th>
                  <th className="px-4 py-3.5">Location &amp; Geofence</th>
                  <th className="px-4 py-3.5">Delivery Fee</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredOutlets.map((outlet) => (
                  <tr key={outlet._id} className="hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-white text-sm">{outlet.storeName}</div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                        <span>slug: /{outlet.slug}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-200">
                        {outlet.adminId?.name || "Dairy Admin"}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {outlet.adminId?.shopName || "Dairy Hub"} • {outlet.adminId?.mobile || "No phone"}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 text-emerald-400 font-medium">
                        <MapPin className="w-3.5 h-3.5" />
                        {outlet.village}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Radius: {outlet.deliveryRadiusKm || 8} km • Servicing{" "}
                        {outlet.serviceVillages?.length || 1} villages
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-200">₹{outlet.deliveryFee || 20}</div>
                      <div className="text-[10px] text-slate-400">
                        Free above ₹{outlet.freeDeliveryThreshold || 500}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          outlet.isStoreEnabled
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            outlet.isStoreEnabled ? "bg-emerald-400" : "bg-rose-400"
                          }`}
                        />
                        {outlet.isStoreEnabled ? "Store Active" : "Suspended"}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/store/${outlet.slug}`}
                          target="_blank"
                          className="p-1.5 text-slate-400 hover:text-emerald-400 bg-slate-950 border border-slate-800 rounded-lg hover:border-emerald-500/40 transition"
                          title="Open Storefront in New Tab"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>

                        <button
                          onClick={() => handleToggleStore(outlet._id, outlet.isStoreEnabled)}
                          disabled={togglingId === outlet._id}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                            outlet.isStoreEnabled
                              ? "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30"
                              : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30"
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                          {outlet.isStoreEnabled ? "Disable" : "Enable"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
