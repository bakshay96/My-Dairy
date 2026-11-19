"use client";

import React, { useEffect, useState, useMemo, Fragment } from "react";
import api from "@/lib/api";
import { toast } from "@/lib/toast";
import { 
  Loader2, Users, Search, Play, Pause, 
  ArrowUpDown, ChevronUp, ChevronDown, Trash2, Eye, EyeOff, AlertTriangle, 
  X, KeyRound, Lock, Phone, Mail, Copy, Check, Sparkles, Save, ShieldAlert,
  Building, User, ChevronRight, Filter, Shield, UserCheck, RefreshCw
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function MasterDashboardOverview() {
  const [admins, setAdmins] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [masters, setMasters] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Category / Role Filter: "admins" | "farmers" | "masters" | "all"
  const [roleFilter, setRoleFilter] = useState("admins");

  // Dairy Admin filter (to isolate a specific dairy and its associated farmers)
  const [selectedDairyId, setSelectedDairyId] = useState("all");

  // Expanded Admins for nested farmers view: { [adminId]: boolean }
  const [expandedAdmins, setExpandedAdmins] = useState({});

  // Search & Sorting
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "desc" });

  // Admin Actions state
  const [extending, setExtending] = useState(null);
  const [extendDays, setExtendDays] = useState(30);
  const [deleteAdminId, setDeleteAdminId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [viewAdmin, setViewAdmin] = useState(null);
  const [selectedAdmins, setSelectedAdmins] = useState([]);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(0);

  // Visibility toggle map & Copy state for passwords
  const [showPasswordMap, setShowPasswordMap] = useState({});
  const [copiedKey, setCopiedKey] = useState(null);

  // Admin Credentials Modal
  const [credentialModalAdmin, setCredentialModalAdmin] = useState(null);
  const [credForm, setCredForm] = useState({
    mobile: "",
    email: "",
    password: "",
    name: "",
    shopName: "",
    notifyUser: true,
  });
  const [savingCreds, setSavingCreds] = useState(false);
  const [showModalPassword, setShowModalPassword] = useState(false);

  // Farmer Credentials Modal
  const [credModalFarmer, setCredModalFarmer] = useState(null);
  const [farmerCredForm, setFarmerCredForm] = useState({
    mobile: "",
    memberId: "",
    name: "",
    village: "",
    email: "",
    password: "",
    status: "active",
  });
  const [savingFarmerCreds, setSavingFarmerCreds] = useState(false);
  const [showFarmerModalPassword, setShowFarmerModalPassword] = useState(false);

  // Master Admin Credentials Modal
  const [editingMaster, setEditingMaster] = useState(null);
  const [editMasterForm, setEditMasterForm] = useState({
    firstName: "",
    lastName: "",
    mobile: "",
    email: "",
    username: "",
    password: "",
  });
  const [savingEditMaster, setSavingEditMaster] = useState(false);
  const [showMasterPassword, setShowMasterPassword] = useState(false);

  // Single Farmer Delete
  const [deleteFarmerId, setDeleteFarmerId] = useState(null);

  const fetchData = async () => {
    try {
      const [adminsRes, farmersRes, mastersRes] = await Promise.all([
        api.get("/master/admins"),
        api.get("/master/farmers").catch(() => ({ data: { data: { farmers: [] } } })),
        api.get("/master/credentials/list").catch(() => ({ data: { data: { masters: [] } } }))
      ]);

      setAdmins(adminsRes.data?.data?.admins || adminsRes.data?.admins || []);
      setFarmers(farmersRes.data?.data?.farmers || farmersRes.data?.farmers || []);
      setMasters(mastersRes.data?.data?.masters || mastersRes.data?.masters || []);
    } catch {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Map farmers grouped by adminId for instant lookup
  const farmersByAdminMap = useMemo(() => {
    const map = {};
    farmers.forEach((f) => {
      const aId = String(f.adminId?._id || f.adminId || "");
      if (!map[aId]) map[aId] = [];
      map[aId].push(f);
    });
    // Sort each admin's farmers by memberId ascending
    Object.keys(map).forEach((aId) => {
      map[aId].sort((a, b) => (a.memberId || "").localeCompare(b.memberId || "", undefined, { numeric: true }));
    });
    return map;
  }, [farmers]);

  const toggleExpandAdmin = (adminId) => {
    setExpandedAdmins((prev) => ({ ...prev, [adminId]: !prev[adminId] }));
  };

  const togglePasswordVisibility = (id) => {
    setShowPasswordMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

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
      toast.success(`${selectedAdmins.length} Admins deleted permanently.`);
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

  const handleDeleteFarmer = async () => {
    if (!deleteFarmerId) return;
    setDeleting(true);
    try {
      await api.delete(`/master/farmers/${deleteFarmerId}`);
      toast.success("Farmer deleted permanently");
      setDeleteFarmerId(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete farmer");
    } finally {
      setDeleting(false);
    }
  };

  // Open Admin Credentials Modal
  const openCredentialModal = (admin) => {
    setCredentialModalAdmin(admin);
    setCredForm({
      mobile: admin.mobile || "",
      email: admin.email || "",
      password: "",
      name: admin.name || "",
      shopName: admin.shopName || "",
      notifyUser: !!admin.email,
    });
    setShowModalPassword(false);
  };

  // Open Farmer Credentials Modal
  const openFarmerCredModal = (farmer) => {
    setCredModalFarmer(farmer);
    setFarmerCredForm({
      mobile: farmer.mobile || "",
      memberId: farmer.memberId || "",
      name: farmer.name || "",
      village: farmer.village || "",
      email: farmer.email && farmer.email !== "milkify@gmail.com" ? farmer.email : "",
      password: "",
      status: farmer.status || "active",
    });
    setShowFarmerModalPassword(false);
  };

  // Open Master Admin Edit Modal
  const openEditMasterModal = (m) => {
    setEditingMaster(m);
    setEditMasterForm({
      firstName: m.firstName || "",
      lastName: m.lastName || "",
      mobile: m.mobile || "",
      email: m.email || "",
      username: m.username || "",
      password: "",
    });
    setShowMasterPassword(false);
  };

  const generateRandomPassword = (target = "admin") => {
    const prefixes = target === "farmer" 
      ? ["Kisan", "GauPal", "Dairy", "Mitra"] 
      : ["Milkify", "Dairy", "Amrit", "Kalyan"];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(1000 + Math.random() * 9000);
    const symbols = ["@", "#", "!", "$"];
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const pass = `${prefix}${symbol}${num}`;
    
    if (target === "farmer") {
      setFarmerCredForm((prev) => ({ ...prev, password: pass }));
      setShowFarmerModalPassword(true);
    } else if (target === "master") {
      setEditMasterForm((prev) => ({ ...prev, password: pass }));
      setShowMasterPassword(true);
    } else {
      setCredForm((prev) => ({ ...prev, password: pass }));
      setShowModalPassword(true);
    }
    toast.success("Generated secure password: " + pass);
  };

  const handleUpdateAdminCredentials = async (e) => {
    e.preventDefault();
    if (!credentialModalAdmin) return;

    if (credForm.mobile && !/^\d{10}$/.test(credForm.mobile.trim())) {
      return toast.error("Mobile number must be exactly 10 digits");
    }

    if (credForm.password && credForm.password.trim().length > 0 && credForm.password.trim().length < 4) {
      return toast.error("Password must be at least 4 characters long");
    }

    setSavingCreds(true);
    try {
      const payload = {
        mobile: credForm.mobile.trim(),
        email: credForm.email.trim(),
        password: credForm.password.trim() || undefined,
        name: credForm.name?.trim() || undefined,
        shopName: credForm.shopName?.trim() || undefined,
        notifyUser: credForm.notifyUser,
      };

      const res = await api.patch(`/master/admins/${credentialModalAdmin._id}/credentials`, payload);
      toast.success(res.data?.message || "Admin credentials updated successfully!");
      setCredentialModalAdmin(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update credentials");
    } finally {
      setSavingCreds(false);
    }
  };

  const handleUpdateFarmerCredentials = async (e) => {
    e.preventDefault();
    if (!credModalFarmer) return;

    if (farmerCredForm.mobile && !/^\d{10}$/.test(farmerCredForm.mobile.trim())) {
      return toast.error("Mobile number must be exactly 10 digits");
    }

    if (farmerCredForm.password && farmerCredForm.password.trim().length > 0 && farmerCredForm.password.trim().length < 4) {
      return toast.error("Password must be at least 4 characters long");
    }

    setSavingFarmerCreds(true);
    try {
      const payload = {
        mobile: farmerCredForm.mobile.trim(),
        memberId: farmerCredForm.memberId.trim(),
        name: farmerCredForm.name.trim(),
        village: farmerCredForm.village.trim(),
        email: farmerCredForm.email.trim() || undefined,
        password: farmerCredForm.password.trim() || undefined,
        status: farmerCredForm.status,
      };

      const res = await api.patch(`/master/farmers/${credModalFarmer._id}/credentials`, payload);
      toast.success(res.data?.message || "Farmer credentials updated successfully!");
      setCredModalFarmer(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update farmer credentials");
    } finally {
      setSavingFarmerCreds(false);
    }
  };

  const handleUpdateMasterCredentials = async (e) => {
    e.preventDefault();
    if (!editingMaster) return;
    setSavingEditMaster(true);
    try {
      const payload = {
        firstName: editMasterForm.firstName.trim(),
        lastName: editMasterForm.lastName.trim(),
        mobile: editMasterForm.mobile.trim(),
        email: editMasterForm.email.trim(),
        username: editMasterForm.username.trim(),
      };
      if (editMasterForm.password && editMasterForm.password.trim().length > 0) {
        payload.password = editMasterForm.password.trim();
      }

      await api.patch(`/master/credentials/${editingMaster._id}`, payload);
      toast.success("Master admin credentials updated successfully!");
      setEditingMaster(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update master credentials");
    } finally {
      setSavingEditMaster(false);
    }
  };

  // Filtered lists
  const filteredAdmins = admins
    .filter((a) => {
      const matchesDairy = selectedDairyId === "all" || String(a._id) === selectedDairyId;
      const matchesSearch = 
        a.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        a.shopName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        a.mobile?.includes(searchTerm) ||
        a.email?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesDairy && matchesSearch;
    })
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

  const filteredFarmers = farmers
    .filter((f) => {
      const aId = String(f.adminId?._id || f.adminId || "");
      const matchesDairy = selectedDairyId === "all" || aId === selectedDairyId;
      const matchesSearch = 
        f.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.memberId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.mobile?.includes(searchTerm) ||
        f.village?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.adminId?.shopName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.adminId?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesDairy && matchesSearch;
    })
    .sort((a, b) => (a.memberId || "").localeCompare(b.memberId || "", undefined, { numeric: true }));

  const filteredMasters = masters.filter((m) => 
    m.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.mobile?.includes(searchTerm)
  );

  const totalUserCount = admins.length + farmers.length + masters.length;

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return <ArrowUpDown className="h-3 w-3 inline ml-1 opacity-40 cursor-pointer" />;
    return sortConfig.direction === "asc" ? <ChevronUp className="h-3 w-3 inline ml-1 text-purple-500 cursor-pointer" /> : <ChevronDown className="h-3 w-3 inline ml-1 text-purple-500 cursor-pointer" />;
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-purple-500" /></div>;
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Master Administration</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Categorize and monitor all user roles (Master Admin, Dairy Admin, Farmers) with full credential oversight.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} className="gap-1.5 text-xs font-bold">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh Data
          </Button>
          <Link href="/master/dashboard/farmers">
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs gap-1.5 shadow-sm">
              <Users className="h-3.5 w-3.5" /> Farmers Directory &rarr;
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-md">
          <CardContent className="p-5 flex justify-between items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-300">Total System Users</p>
              <h3 className="text-3xl font-black mt-1.5">{totalUserCount}</h3>
              <p className="text-[11px] text-slate-400 mt-1">Masters, Admins &amp; Farmers</p>
            </div>
            <Shield className="h-9 w-9 text-slate-400 opacity-60" />
          </CardContent>
        </Card>

        {/* Dairy Admins */}
        <Card className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white border-none shadow-md">
          <CardContent className="p-5 flex justify-between items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-100">Dairy Admins</p>
              <h3 className="text-3xl font-black mt-1.5">{admins.length}</h3>
              <p className="text-[11px] text-blue-200 mt-1">Tenant Dairy Owners</p>
            </div>
            <Building className="h-9 w-9 text-blue-200 opacity-60" />
          </CardContent>
        </Card>

        {/* Farmers */}
        <Card className="bg-gradient-to-br from-purple-600 to-pink-600 text-white border-none shadow-md">
          <CardContent className="p-5 flex justify-between items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-purple-100">Farmers Registered</p>
              <h3 className="text-3xl font-black mt-1.5">{farmers.length}</h3>
              <p className="text-[11px] text-purple-200 mt-1">Associated Milk Providers</p>
            </div>
            <Users className="h-9 w-9 text-purple-200 opacity-60" />
          </CardContent>
        </Card>

        {/* Master Admins */}
        <Card className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white border-none shadow-md">
          <CardContent className="p-5 flex justify-between items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-100">Master Admins</p>
              <h3 className="text-3xl font-black mt-1.5">{masters.length}</h3>
              <p className="text-[11px] text-emerald-200 mt-1">Superadmin Network</p>
            </div>
            <UserCheck className="h-9 w-9 text-emerald-200 opacity-60" />
          </CardContent>
        </Card>
      </div>

      {/* Main Filter & Categorization Panel */}
      <Card className="shadow-lg border-none bg-white dark:bg-slate-950">
        <CardHeader className="bg-slate-50 dark:bg-slate-900/60 border-b dark:border-slate-800 p-4 flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* User Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-200/80 dark:bg-slate-800 p-1.5 rounded-2xl w-full lg:w-auto">
            <button
              type="button"
              onClick={() => setRoleFilter("admins")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                roleFilter === "admins"
                  ? "bg-white dark:bg-slate-950 text-purple-600 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <Building className="h-3.5 w-3.5 text-blue-600" />
              Dairy Admins &amp; Farmers ({admins.length})
            </button>

            <button
              type="button"
              onClick={() => setRoleFilter("farmers")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                roleFilter === "farmers"
                  ? "bg-white dark:bg-slate-950 text-purple-600 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <Users className="h-3.5 w-3.5 text-purple-600" />
              All Farmers ({farmers.length})
            </button>

            <button
              type="button"
              onClick={() => setRoleFilter("masters")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                roleFilter === "masters"
                  ? "bg-white dark:bg-slate-950 text-purple-600 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <Shield className="h-3.5 w-3.5 text-emerald-600" />
              Master Admin Team ({masters.length})
            </button>
          </div>

          {/* Secondary Filters: Dairy Dropdown & Real-time Search */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            {/* Filter by Dairy / Admin Dropdown */}
            {(roleFilter === "admins" || roleFilter === "farmers") && (
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <select
                  value={selectedDairyId}
                  onChange={(e) => setSelectedDairyId(e.target.value)}
                  className="h-9 text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-lg px-2.5 font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none w-full sm:w-56"
                >
                  <option value="all">All Dairies / All Admins</option>
                  {admins.map((adm) => (
                    <option key={adm._id} value={adm._id}>
                      {adm.shopName} ({adm.name})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder={
                  roleFilter === "admins"
                    ? "Search admin, shop, mobile..."
                    : roleFilter === "farmers"
                    ? "Search farmer, ID, village..."
                    : "Search master admin..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* ========================================================= */}
          {/* CATEGORY 1: DAIRY ADMINS & ASSOCIATED FARMERS HIERARCHY */}
          {/* ========================================================= */}
          {roleFilter === "admins" && (
            <div className="overflow-x-auto max-h-[640px] overflow-y-auto relative">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/90 text-slate-500 uppercase font-bold sticky top-0 z-10 shadow-xs backdrop-blur-md">
                  <tr>
                    <th className="px-4 py-3.5 w-10 text-center">Tree</th>
                    <th className="px-4 py-3.5 cursor-pointer whitespace-nowrap" onClick={() => handleSort("name")}>
                      Dairy Admin Info <SortIcon column="name" />
                    </th>
                    <th className="px-4 py-3.5 cursor-pointer whitespace-nowrap" onClick={() => handleSort("shopName")}>
                      Dairy Shop &amp; Location <SortIcon column="shopName" />
                    </th>
                    <th className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-purple-600">
                        <KeyRound className="h-3.5 w-3.5" />
                        <span>Admin Login Credentials</span>
                      </div>
                    </th>
                    <th className="px-4 py-3.5 whitespace-nowrap text-center">Associated Farmers</th>
                    <th className="px-4 py-3.5 whitespace-nowrap" onClick={() => handleSort("Status")}>
                      Status <SortIcon column="Status" />
                    </th>
                    <th className="px-4 py-3.5 whitespace-nowrap" onClick={() => handleSort("subscription")}>
                      Subscription <SortIcon column="subscription" />
                    </th>
                    <th className="px-4 py-3.5 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredAdmins.map((admin) => {
                    const sub = admin.subscription;
                    const isTrial = sub?.status === "trial";
                    const isActiveSub = sub?.status === "active";
                    const subEnd = isTrial ? sub?.trialEndDate : sub?.endDate;
                    const adminFarmersList = farmersByAdminMap[String(admin._id)] || [];
                    const isExpanded = expandedAdmins[admin._id];

                    return (
                      <React.Fragment key={admin._id}>
                        {/* Primary Dairy Admin Row */}
                        <tr className={`hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors ${isExpanded ? "bg-purple-50/40 dark:bg-purple-950/20" : ""}`}>
                          {/* Tree Expand Button */}
                          <td className="px-4 py-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => toggleExpandAdmin(admin._id)}
                              className="p-1 rounded-md text-slate-400 hover:text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-950/60 transition-colors"
                              title={isExpanded ? "Collapse associated farmers" : "Expand associated farmers"}
                            >
                              <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? "rotate-90 text-purple-600" : ""}`} />
                            </button>
                          </td>

                          {/* Admin Info */}
                          <td className="px-4 py-3.5">
                            <p className="font-bold text-slate-900 dark:text-white text-sm">{admin.name}</p>
                            <p className="text-slate-500 text-[11px]">{admin.email || "No email"}</p>
                            <p className="text-[10px] text-slate-400 uppercase mt-0.5">Joined: {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString("en-GB") : "N/A"}</p>
                          </td>

                          {/* Dairy Shop */}
                          <td className="px-4 py-3.5">
                            <p className="font-bold text-slate-900 dark:text-white">{admin.shopName}</p>
                            <p className="text-slate-500 text-[11px]">{admin.village}</p>
                          </td>

                          {/* Admin Login Credentials */}
                          <td className="px-4 py-3.5">
                            <div className="space-y-1.5 min-w-[210px]">
                              {/* Login Mobile / Username */}
                              <div className="flex items-center justify-between gap-1.5 bg-slate-100/90 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 px-2 py-1 rounded-lg">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{admin.mobile}</span>
                                </div>
                                <button 
                                  type="button"
                                  onClick={() => handleCopy(admin.mobile, `mobile-${admin._id}`)}
                                  className="text-slate-400 hover:text-purple-600 p-0.5 rounded"
                                  title="Copy login mobile"
                                >
                                  {copiedKey === `mobile-${admin._id}` ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                                </button>
                              </div>

                              {/* Password */}
                              <div className="flex items-center justify-between gap-1.5 bg-purple-50/70 dark:bg-purple-950/25 border border-purple-200/70 dark:border-purple-900/40 px-2 py-1 rounded-lg">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <Lock className="h-3 w-3 text-purple-600 dark:text-purple-400 shrink-0" />
                                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                                    {showPasswordMap[admin._id] ? admin.key : "••••••••"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  {admin.key && (
                                    <>
                                      <button 
                                        type="button"
                                        onClick={() => togglePasswordVisibility(admin._id)}
                                        className="text-slate-400 hover:text-purple-600 p-0.5 rounded"
                                        title={showPasswordMap[admin._id] ? "Hide password" : "Show password"}
                                      >
                                        {showPasswordMap[admin._id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                      </button>
                                      <button 
                                        type="button"
                                        onClick={() => handleCopy(admin.key, `pass-${admin._id}`)}
                                        className="text-slate-400 hover:text-purple-600 p-0.5 rounded"
                                        title="Copy password"
                                      >
                                        {copiedKey === `pass-${admin._id}` ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                                      </button>
                                    </>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => openCredentialModal(admin)}
                                    className="text-purple-600 hover:text-purple-800 p-0.5 rounded"
                                    title="Set / update credentials"
                                  >
                                    <KeyRound className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Associated Farmers Count Badge & Expand Toggle */}
                          <td className="px-4 py-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => toggleExpandAdmin(admin._id)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800 hover:bg-indigo-100 transition-colors"
                            >
                              <Users className="h-3 w-3" />
                              <span>{adminFarmersList.length} Farmers</span>
                            </button>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${admin.Status === "Active" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-red-100 text-red-700"}`}>
                              {admin.Status}
                            </span>
                          </td>

                          {/* Subscription */}
                          <td className="px-4 py-3.5">
                            {sub ? (
                              <div>
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${isActiveSub ? "bg-blue-100 text-blue-700" : isTrial ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                                  {sub.status}
                                </span>
                                <p className="text-[10px] text-slate-400 mt-0.5">Ends: {subEnd ? new Date(subEnd).toLocaleDateString("en-GB") : "N/A"}</p>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[10px]">No Sub Data</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex justify-end gap-1">
                              {extending === admin._id ? (
                                <div className="flex items-center gap-1.5">
                                  <input 
                                    type="number" 
                                    value={extendDays} 
                                    onChange={(e) => setExtendDays(Number(e.target.value))}
                                    className="w-14 h-7 text-xs border rounded px-1.5"
                                  />
                                  <Button size="sm" onClick={() => handleExtendSub(admin._id)} className="bg-purple-600 hover:bg-purple-700 text-white h-7 px-2 text-xs">Save</Button>
                                  <Button size="sm" variant="outline" onClick={() => setExtending(null)} className="h-7 px-1.5 text-xs">X</Button>
                                </div>
                              ) : (
                                <>
                                  <Button size="sm" variant="outline" onClick={() => setExtending(admin._id)} className="text-purple-600 border-purple-200 hover:bg-purple-50 h-7 px-2 text-xs" title="Extend Subscription">
                                    + Days
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 h-7 px-2 text-xs"
                                    onClick={() => openCredentialModal(admin)}
                                    title="Set Admin Credentials"
                                  >
                                    <KeyRound className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="text-blue-600 border-blue-200 hover:bg-blue-50 h-7 px-2 text-xs"
                                    onClick={() => setViewAdmin(admin)}
                                    title="View Admin Details"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className={admin.Status === "Active" ? "text-amber-600 border-amber-200 hover:bg-amber-50 h-7 px-2 text-xs" : "text-emerald-600 border-emerald-200 hover:bg-emerald-50 h-7 px-2 text-xs"}
                                    onClick={() => handleStatusChange(admin._id, admin.Status)}
                                    title={admin.Status === "Active" ? "Pause Account" : "Activate Account"}
                                  >
                                    {admin.Status === "Active" ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="text-red-600 border-red-200 hover:bg-red-50 h-7 px-2 text-xs"
                                    onClick={() => setDeleteAdminId(admin._id)}
                                    title="Delete Admin"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Nested Sub-Table: All Farmers Associated With This Admin */}
                        {isExpanded && (
                          <tr className="bg-slate-50/70 dark:bg-slate-900/40">
                            <td colSpan={8} className="p-3 pl-8">
                              <div className="bg-white dark:bg-slate-950 border border-purple-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
                                <div className="flex items-center justify-between border-b dark:border-slate-800 pb-2">
                                  <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-purple-600" />
                                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                                      Registered Farmers under {admin.shopName} ({adminFarmersList.length})
                                    </h4>
                                  </div>
                                  <span className="text-[10px] text-slate-400">Sorted by Member ID</span>
                                </div>

                                {adminFarmersList.length === 0 ? (
                                  <p className="text-slate-400 text-xs italic py-2">No farmers currently registered under this dairy.</p>
                                ) : (
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-xs text-left">
                                      <thead className="text-[10px] uppercase font-bold text-slate-400 border-b dark:border-slate-800 pb-1">
                                        <tr>
                                          <th className="py-2 px-3">Member ID</th>
                                          <th className="py-2 px-3">Farmer Name</th>
                                          <th className="py-2 px-3">Village</th>
                                          <th className="py-2 px-3">Login Mobile (User ID)</th>
                                          <th className="py-2 px-3">Password (Key)</th>
                                          <th className="py-2 px-3">Status</th>
                                          <th className="py-2 px-3 text-right">Actions</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {adminFarmersList.map((farmer) => (
                                          <tr key={farmer._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/60">
                                            <td className="py-2 px-3 font-mono font-bold text-purple-700 dark:text-purple-300">
                                              {farmer.memberId || "MI-000"}
                                            </td>
                                            <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">
                                              {farmer.name}
                                            </td>
                                            <td className="py-2 px-3 text-slate-500">
                                              {farmer.village}
                                            </td>
                                            <td className="py-2 px-3">
                                              <div className="flex items-center gap-1.5 font-mono">
                                                <span>{farmer.mobile}</span>
                                                <button
                                                  type="button"
                                                  onClick={() => handleCopy(farmer.mobile, `af-mob-${farmer._id}`)}
                                                  className="text-slate-400 hover:text-purple-600 p-0.5"
                                                  title="Copy Mobile"
                                                >
                                                  {copiedKey === `af-mob-${farmer._id}` ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                                                </button>
                                              </div>
                                            </td>
                                            <td className="py-2 px-3">
                                              <div className="flex items-center gap-1.5 font-mono">
                                                <span className="font-semibold text-purple-600 dark:text-purple-400">
                                                  {showPasswordMap[farmer._id] ? farmer.key : "••••••••"}
                                                </span>
                                                <button
                                                  type="button"
                                                  onClick={() => togglePasswordVisibility(farmer._id)}
                                                  className="text-slate-400 hover:text-purple-600 p-0.5"
                                                  title={showPasswordMap[farmer._id] ? "Hide" : "Show"}
                                                >
                                                  {showPasswordMap[farmer._id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => handleCopy(farmer.key, `af-pass-${farmer._id}`)}
                                                  className="text-slate-400 hover:text-purple-600 p-0.5"
                                                  title="Copy Password"
                                                >
                                                  {copiedKey === `af-pass-${farmer._id}` ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                                                </button>
                                              </div>
                                            </td>
                                            <td className="py-2 px-3">
                                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${farmer.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                                                {farmer.status || "active"}
                                              </span>
                                            </td>
                                            <td className="py-2 px-3 text-right">
                                              <div className="flex justify-end gap-1">
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  className="text-purple-600 border-purple-200 hover:bg-purple-50 h-6 px-2 text-[11px] gap-1 font-bold"
                                                  onClick={() => openFarmerCredModal(farmer)}
                                                >
                                                  <KeyRound className="h-3 w-3" /> Set Credentials
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  className="text-red-600 border-red-200 hover:bg-red-50 h-6 px-1.5 text-[11px]"
                                                  onClick={() => setDeleteFarmerId(farmer._id)}
                                                >
                                                  <Trash2 className="h-3 w-3" />
                                                </Button>
                                              </div>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}

                  {filteredAdmins.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-slate-500">No dairy admins found matching filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ========================================================= */}
          {/* CATEGORY 2: ALL FARMERS DIRECTORY */}
          {/* ========================================================= */}
          {roleFilter === "farmers" && (
            <div className="overflow-x-auto max-h-[640px] overflow-y-auto relative">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/90 text-slate-500 uppercase font-bold sticky top-0 z-10 shadow-xs backdrop-blur-md">
                  <tr>
                    <th className="px-5 py-3.5">Farmer &amp; Member ID</th>
                    <th className="px-5 py-3.5">Associated Dairy Admin</th>
                    <th className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 text-purple-600">
                        <KeyRound className="h-3.5 w-3.5" />
                        <span>Farmer Login Credentials</span>
                      </div>
                    </th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredFarmers.map((f) => (
                    <tr key={f._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-purple-700 dark:text-purple-300 border border-slate-200 dark:border-slate-700">
                            {f.memberId || "MI-000"}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white text-sm">{f.name}</span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-0.5">Village: {f.village} &bull; {f.gender || "Male"}</p>
                      </td>

                      <td className="px-5 py-3.5">
                        <p className="font-bold text-slate-900 dark:text-white">{f.adminId?.shopName || "Self Dairy"}</p>
                        <p className="text-[11px] text-slate-400">Owner: {f.adminId?.name || "N/A"}</p>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="space-y-1.5 min-w-[210px]">
                          {/* Login ID / Mobile */}
                          <div className="flex items-center justify-between gap-1.5 bg-slate-100/90 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 px-2 py-1 rounded-lg">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{f.mobile}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopy(f.mobile, `allf-mob-${f._id}`)}
                              className="text-slate-400 hover:text-purple-600 p-0.5 rounded"
                              title="Copy Mobile"
                            >
                              {copiedKey === `allf-mob-${f._id}` ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          </div>

                          {/* Password */}
                          <div className="flex items-center justify-between gap-1.5 bg-purple-50/70 dark:bg-purple-950/25 border border-purple-200/70 dark:border-purple-900/40 px-2 py-1 rounded-lg">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Lock className="h-3 w-3 text-purple-600 dark:text-purple-400 shrink-0" />
                              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                                {showPasswordMap[f._id] ? f.key : "••••••••"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility(f._id)}
                                className="text-slate-400 hover:text-purple-600 p-0.5 rounded"
                                title={showPasswordMap[f._id] ? "Hide Password" : "Show Password"}
                              >
                                {showPasswordMap[f._id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopy(f.key, `allf-pass-${f._id}`)}
                                className="text-slate-400 hover:text-purple-600 p-0.5 rounded"
                                title="Copy Password"
                              >
                                {copiedKey === `allf-pass-${f._id}` ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => openFarmerCredModal(f)}
                                className="text-purple-600 hover:text-purple-800 p-0.5 rounded"
                                title="Set / Update Credentials"
                              >
                                <KeyRound className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${f.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                          {f.status || "active"}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-purple-600 border-purple-200 hover:bg-purple-50 h-7 px-2 text-xs font-bold gap-1"
                            onClick={() => openFarmerCredModal(f)}
                          >
                            <KeyRound className="h-3.5 w-3.5" /> Set Credentials
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50 h-7 px-2 text-xs"
                            onClick={() => setDeleteFarmerId(f._id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredFarmers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No farmers found matching filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ========================================================= */}
          {/* CATEGORY 3: MASTER ADMIN TEAM */}
          {/* ========================================================= */}
          {roleFilter === "masters" && (
            <div className="overflow-x-auto max-h-[640px] overflow-y-auto relative">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/90 text-slate-500 uppercase font-bold sticky top-0 z-10 shadow-xs backdrop-blur-md">
                  <tr>
                    <th className="px-5 py-3.5">Master Administrator</th>
                    <th className="px-5 py-3.5">Contact Details</th>
                    <th className="px-5 py-3.5">Username</th>
                    <th className="px-5 py-3.5">Password (Key)</th>
                    <th className="px-5 py-3.5">Role</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredMasters.map((m) => (
                    <tr key={m._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-slate-900 dark:text-white text-sm">{m.firstName} {m.lastName}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Joined: {m.createdAt ? new Date(m.createdAt).toLocaleDateString("en-GB") : "N/A"}</p>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3 w-3 text-slate-400" />
                          <span>{m.email}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(m.email, `m-em-${m._id}`)}
                            className="text-slate-400 hover:text-purple-600 p-0.5"
                          >
                            {copiedKey === `m-em-${m._id}` ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 font-mono text-slate-500">
                          <Phone className="h-3 w-3 text-slate-400" />
                          <span>{m.mobile}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(m.mobile, `m-mob-${m._id}`)}
                            className="text-slate-400 hover:text-purple-600 p-0.5"
                          >
                            {copiedKey === `m-mob-${m._id}` ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-bold text-slate-800 dark:text-slate-200">
                            {m.username}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(m.username, `m-un-${m._id}`)}
                            className="text-slate-400 hover:text-purple-600 p-0.5"
                          >
                            {copiedKey === `m-un-${m._id}` ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="font-semibold text-purple-600 dark:text-purple-400">
                            {showPasswordMap[m._id] ? m.key || "Hidden" : "••••••••"}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(m._id)}
                            className="text-slate-400 hover:text-purple-600 p-0.5"
                          >
                            {showPasswordMap[m._id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                          {m.key && (
                            <button
                              type="button"
                              onClick={() => handleCopy(m.key, `m-pass-${m._id}`)}
                              className="text-slate-400 hover:text-purple-600 p-0.5"
                            >
                              {copiedKey === `m-pass-${m._id}` ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                          Master Admin
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-purple-600 border-purple-200 hover:bg-purple-50 h-7 px-2.5 text-xs font-bold gap-1"
                          onClick={() => openEditMasterModal(m)}
                        >
                          <KeyRound className="h-3.5 w-3.5" /> Edit Credentials
                        </Button>
                      </td>
                    </tr>
                  ))}

                  {filteredMasters.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No master admins found matching filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* =================== MODAL: DELETE CONFIRMATION =================== */}
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

      {/* =================== MODAL: DELETE FARMER =================== */}
      {deleteFarmerId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 border dark:border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-3">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Delete Farmer?</h3>
            <p className="text-slate-500 text-xs mt-1 mb-5">
              This action will permanently delete this farmer account and all associated milk records.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 h-9 text-xs" onClick={() => setDeleteFarmerId(null)}>Cancel</Button>
              <Button
                variant="destructive"
                className="flex-1 h-9 bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
                onClick={handleDeleteFarmer}
                disabled={deleting}
              >
                {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* =================== MODAL: VIEW ADMIN DETAILS =================== */}
      {viewAdmin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 border dark:border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white flex justify-between items-start">
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

              {/* Full-width Login Credentials Card */}
              <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-purple-50 to-indigo-50/50 dark:from-purple-950/20 dark:to-indigo-950/10 border border-purple-200/80 dark:border-purple-900/50 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-200/60 dark:border-purple-800/50 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-purple-600 text-white rounded-xl shadow-sm">
                      <KeyRound className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">Account Login Credentials</h3>
                      <p className="text-xs text-slate-500">Authentication identifiers used by this dairy owner</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      const targetAdmin = viewAdmin;
                      setViewAdmin(null);
                      openCredentialModal(targetAdmin);
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold gap-1.5 shadow-sm"
                  >
                    <KeyRound className="h-3.5 w-3.5" /> Set New Credentials
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
                  {/* Login Mobile */}
                  <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Login ID (Mobile)</span>
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm tracking-wide">{viewAdmin.mobile}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(viewAdmin.mobile, `detail-mobile-${viewAdmin._id}`)}
                        className="text-slate-400 hover:text-purple-600 p-1 rounded transition-colors"
                        title="Copy Mobile"
                      >
                        {copiedKey === `detail-mobile-${viewAdmin._id}` ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Primary sign-in credential</p>
                  </div>

                  {/* Registered Email */}
                  <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Registered Email</span>
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-medium text-slate-900 dark:text-slate-100 truncate text-xs" title={viewAdmin.email}>{viewAdmin.email || "No email"}</span>
                      {viewAdmin.email && (
                        <button
                          type="button"
                          onClick={() => handleCopy(viewAdmin.email, `detail-email-${viewAdmin._id}`)}
                          className="text-slate-400 hover:text-purple-600 p-1 rounded transition-colors"
                          title="Copy Email"
                        >
                          {copiedKey === `detail-email-${viewAdmin._id}` ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">For recovery &amp; receipts</p>
                  </div>

                  {/* Active Password */}
                  <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Active Password</span>
                    <div className="flex items-center justify-between gap-1">
                      {viewAdmin.key ? (
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm tracking-wide">
                          {showPasswordMap[viewAdmin._id] ? viewAdmin.key : "••••••••"}
                        </span>
                      ) : (
                        <span className="text-xs text-amber-600 font-semibold italic">Hashed (Legacy)</span>
                      )}
                      {viewAdmin.key && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(viewAdmin._id)}
                            className="text-slate-400 hover:text-purple-600 p-1 rounded transition-colors"
                            title={showPasswordMap[viewAdmin._id] ? "Hide Password" : "Show Password"}
                          >
                            {showPasswordMap[viewAdmin._id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(viewAdmin.key, `detail-pass-${viewAdmin._id}`)}
                            className="text-slate-400 hover:text-purple-600 p-1 rounded transition-colors"
                            title="Copy Password"
                          >
                            {copiedKey === `detail-pass-${viewAdmin._id}` ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">{viewAdmin.key ? "Master view enabled" : "Set new password below"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t dark:border-slate-800 flex justify-end gap-3">
              <Button 
                onClick={() => {
                  const targetAdmin = viewAdmin;
                  setViewAdmin(null);
                  openCredentialModal(targetAdmin);
                }} 
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold gap-2"
              >
                <KeyRound className="h-4 w-4" /> Manage Credentials
              </Button>
              <Button variant="outline" onClick={() => setViewAdmin(null)}>Close Details</Button>
            </div>
          </div>
        </div>
      )}

      {/* =================== MODAL: MANAGE ADMIN CREDENTIALS =================== */}
      {credentialModalAdmin && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 border dark:border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-6 text-white flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                  <KeyRound className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black">Manage Admin Credentials</h2>
                  <p className="text-xs text-white/80 mt-0.5">
                    Update credentials for <strong className="text-white">{credentialModalAdmin.name}</strong> ({credentialModalAdmin.shopName})
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setCredentialModalAdmin(null)} 
                className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleUpdateAdminCredentials} className="p-6 space-y-5">
              <div className="p-3.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/70 dark:border-purple-900/40 text-xs text-purple-900 dark:text-purple-200 flex items-start gap-2.5">
                <ShieldAlert className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                <span>
                  As Master Admin, you can set or update this user&apos;s login credentials based on their requirement. The user will immediately be able to sign in with these new details.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Login Mobile Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1.5">
                    <Phone className="h-3 w-3 text-purple-600" /> Login Mobile (10 Digits) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={credForm.mobile}
                    onChange={(e) => setCredForm({ ...credForm, mobile: e.target.value.replace(/\D/g, "") })}
                    placeholder="e.g. 9876543210"
                    className="w-full h-10 border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl px-3 font-mono text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400">Primary user identifier for dashboard login</p>
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1.5">
                    <Mail className="h-3 w-3 text-purple-600" /> Email Address
                  </label>
                  <input
                    type="email"
                    value={credForm.email}
                    onChange={(e) => setCredForm({ ...credForm, email: e.target.value })}
                    placeholder="dairy@example.com"
                    className="w-full h-10 border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl px-3 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400">For OTP recovery and credential notifications</p>
                </div>
              </div>

              {/* Owner & Shop Name Update */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1.5">
                    <User className="h-3 w-3 text-slate-400" /> Owner Name
                  </label>
                  <input
                    type="text"
                    value={credForm.name}
                    onChange={(e) => setCredForm({ ...credForm, name: e.target.value })}
                    placeholder="Owner Name"
                    className="w-full h-10 border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl px-3 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1.5">
                    <Building className="h-3 w-3 text-slate-400" /> Dairy / Shop Name
                  </label>
                  <input
                    type="text"
                    value={credForm.shopName}
                    onChange={(e) => setCredForm({ ...credForm, shopName: e.target.value })}
                    placeholder="Shop Name"
                    className="w-full h-10 border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl px-3 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Password Section */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-purple-600" /> New Password
                  </label>
                  <button
                    type="button"
                    onClick={() => generateRandomPassword("admin")}
                    className="text-xs font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 flex items-center gap-1 hover:underline"
                  >
                    <Sparkles className="h-3 w-3" /> Auto-Generate Secure
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showModalPassword ? "text" : "password"}
                    value={credForm.password}
                    onChange={(e) => setCredForm({ ...credForm, password: e.target.value })}
                    placeholder="Enter new password (leave blank to keep unchanged)"
                    className="w-full h-11 border dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl pl-3 pr-10 font-mono text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowModalPassword(!showModalPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showModalPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                  <span>
                    {credentialModalAdmin.key ? (
                      <>Current saved password: <strong className="font-mono text-purple-600 dark:text-purple-400">{credentialModalAdmin.key}</strong></>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400 italic">No plaintext password saved yet (bcrypt hashed)</span>
                    )}
                  </span>
                  <span className="text-[10.5px] text-slate-400">Min. 4 characters</span>
                </div>
              </div>

              {/* Email Notification Option */}
              <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                <input
                  type="checkbox"
                  id="notifyUserCreds"
                  checked={credForm.notifyUser}
                  onChange={(e) => setCredForm({ ...credForm, notifyUser: e.target.checked })}
                  className="rounded border-slate-300 dark:border-slate-700 text-purple-600 focus:ring-purple-500 h-4 w-4 mt-0.5 cursor-pointer"
                />
                <label htmlFor="notifyUserCreds" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <strong className="block text-slate-900 dark:text-white">Email updated credentials to user</strong>
                  Dispatches a secure email with their updated login mobile and password to <span className="font-semibold text-purple-600 dark:text-purple-400">{credForm.email || "user's registered email"}</span>.
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-11"
                  onClick={() => setCredentialModalAdmin(null)}
                  disabled={savingCreds}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-11 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 font-bold text-white gap-2 shadow-md"
                  disabled={savingCreds}
                >
                  {savingCreds ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save &amp; Apply Credentials
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================== MODAL: MANAGE FARMER CREDENTIALS =================== */}
      {credModalFarmer && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 border dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-5 text-white flex justify-between items-start">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/10 rounded-xl">
                  <KeyRound className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-black">Set Farmer Credentials</h2>
                  <p className="text-xs text-white/80">
                    For <strong>{credModalFarmer.name}</strong> ({credModalFarmer.memberId}) &bull; Dairy: {credModalFarmer.adminId?.shopName}
                  </p>
                </div>
              </div>
              <button onClick={() => setCredModalFarmer(null)} className="text-white/80 hover:text-white bg-white/10 p-1.5 rounded-full">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateFarmerCredentials} className="p-5 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                <span>Master Admin: Set or update login user ID (mobile / member ID) and password for this farmer.</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold uppercase text-slate-500">Login Mobile (10 Digits) *</label>
                  <input
                    required
                    maxLength={10}
                    value={farmerCredForm.mobile}
                    onChange={(e) => setFarmerCredForm({ ...farmerCredForm, mobile: e.target.value.replace(/\D/g, "") })}
                    className="w-full h-9 border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg px-2.5 font-mono text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase text-slate-500">Member ID</label>
                  <input
                    value={farmerCredForm.memberId}
                    onChange={(e) => setFarmerCredForm({ ...farmerCredForm, memberId: e.target.value })}
                    className="w-full h-9 border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg px-2.5 font-mono text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold uppercase text-slate-500">Farmer Name</label>
                  <input
                    value={farmerCredForm.name}
                    onChange={(e) => setFarmerCredForm({ ...farmerCredForm, name: e.target.value })}
                    className="w-full h-9 border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg px-2.5 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase text-slate-500">Village</label>
                  <input
                    value={farmerCredForm.village}
                    onChange={(e) => setFarmerCredForm({ ...farmerCredForm, village: e.target.value })}
                    className="w-full h-9 border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg px-2.5 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Password Section */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Lock className="h-3 w-3 text-purple-600" /> New Password
                  </label>
                  <button
                    type="button"
                    onClick={() => generateRandomPassword("farmer")}
                    className="text-purple-600 font-bold hover:underline flex items-center gap-1 text-[11px]"
                  >
                    <Sparkles className="h-3 w-3" /> Auto-Generate
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showFarmerModalPassword ? "text" : "password"}
                    value={farmerCredForm.password}
                    onChange={(e) => setFarmerCredForm({ ...farmerCredForm, password: e.target.value })}
                    placeholder="Enter new password (or leave blank to keep unchanged)"
                    className="w-full h-9 border dark:border-slate-800 bg-white dark:bg-slate-950 rounded-lg pl-2.5 pr-8 font-mono text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowFarmerModalPassword(!showFarmerModalPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showFarmerModalPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">
                  Current password: <strong className="font-mono text-purple-600">{credModalFarmer.key || "Not recorded"}</strong>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="font-bold uppercase text-slate-500 block mb-1">Status</label>
                  <select
                    value={farmerCredForm.status}
                    onChange={(e) => setFarmerCredForm({ ...farmerCredForm, status: e.target.value })}
                    className="w-full h-9 border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg px-2 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="pause">Pause</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold uppercase text-slate-500 block mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    value={farmerCredForm.email}
                    onChange={(e) => setFarmerCredForm({ ...farmerCredForm, email: e.target.value })}
                    placeholder="farmer@example.com"
                    className="w-full h-9 border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg px-2.5 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <Button type="button" variant="outline" className="flex-1 h-9 text-xs" onClick={() => setCredModalFarmer(null)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={savingFarmerCreds}
                  className="flex-1 h-9 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs gap-1.5"
                >
                  {savingFarmerCreds ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Save Credentials
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================== MODAL: EDIT MASTER ADMIN CREDENTIALS =================== */}
      {editingMaster && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 border dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-5 text-white flex justify-between items-start">
              <div>
                <h2 className="text-lg font-black">Edit Master Admin Credentials</h2>
                <p className="text-xs text-white/80 mt-0.5">Update login details for {editingMaster.firstName} {editingMaster.lastName}</p>
              </div>
              <button onClick={() => setEditingMaster(null)} className="text-white/80 hover:text-white bg-white/10 p-1.5 rounded-full">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateMasterCredentials} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold uppercase text-slate-500">First Name</label>
                  <input
                    required
                    value={editMasterForm.firstName}
                    onChange={(e) => setEditMasterForm({ ...editMasterForm, firstName: e.target.value })}
                    className="w-full h-9 border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg px-2.5 mt-1"
                  />
                </div>
                <div>
                  <label className="font-bold uppercase text-slate-500">Last Name</label>
                  <input
                    required
                    value={editMasterForm.lastName}
                    onChange={(e) => setEditMasterForm({ ...editMasterForm, lastName: e.target.value })}
                    className="w-full h-9 border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg px-2.5 mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold uppercase text-slate-500">Mobile</label>
                  <input
                    required
                    value={editMasterForm.mobile}
                    onChange={(e) => setEditMasterForm({ ...editMasterForm, mobile: e.target.value })}
                    className="w-full h-9 border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg px-2.5 mt-1"
                  />
                </div>
                <div>
                  <label className="font-bold uppercase text-slate-500">Email</label>
                  <input
                    type="email"
                    required
                    value={editMasterForm.email}
                    onChange={(e) => setEditMasterForm({ ...editMasterForm, email: e.target.value })}
                    className="w-full h-9 border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg px-2.5 mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold uppercase text-slate-500">Username (Login ID)</label>
                <input
                  required
                  value={editMasterForm.username}
                  onChange={(e) => setEditMasterForm({ ...editMasterForm, username: e.target.value })}
                  className="w-full h-9 border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg px-2.5 mt-1 font-mono"
                />
              </div>

              <div className="space-y-1 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center">
                  <label className="font-bold uppercase text-slate-700 dark:text-slate-300">New Password (leave empty to keep unchanged)</label>
                  <button
                    type="button"
                    onClick={() => generateRandomPassword("master")}
                    className="text-purple-600 font-bold hover:underline text-[11px]"
                  >
                    Auto-Generate
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showMasterPassword ? "text" : "password"}
                    value={editMasterForm.password}
                    onChange={(e) => setEditMasterForm({ ...editMasterForm, password: e.target.value })}
                    placeholder="Enter new password"
                    className="w-full h-9 border dark:border-slate-800 bg-white dark:bg-slate-950 rounded-lg pl-2.5 pr-8 mt-1 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowMasterPassword(!showMasterPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showMasterPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <Button type="button" variant="outline" className="flex-1 h-9" onClick={() => setEditingMaster(null)}>Cancel</Button>
                <Button type="submit" disabled={savingEditMaster} className="flex-1 h-9 bg-purple-600 hover:bg-purple-700 text-white font-bold">
                  {savingEditMaster ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Save className="h-3.5 w-3.5 mr-1.5" />} Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
