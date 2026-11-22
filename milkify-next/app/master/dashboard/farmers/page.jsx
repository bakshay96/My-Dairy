/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "@/lib/toast";
import { 
  Loader2, Users, Search, ArrowUpDown, 
  Trash2, Eye, EyeOff, AlertTriangle, X, KeyRound, Lock, Phone, 
  Copy, Check, Sparkles, Save, ShieldAlert, Building, 
  MapPin, CheckCircle2, PauseCircle, RefreshCw, UserCheck, Camera
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function MasterFarmersDirectory() {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "desc" });

  const formatDateTime = (dateVal) => {
    if (!dateVal) return null;
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return null;
    }
  };

  // Credential viewing state
  const [showPasswordMap, setShowPasswordMap] = useState({});
  const [copiedKey, setCopiedKey] = useState(null);

  // Credential editing modal state
  const [credModalFarmer, setCredModalFarmer] = useState(null);
  const [credForm, setCredForm] = useState({
    mobile: "",
    memberId: "",
    name: "",
    village: "",
    email: "",
    password: "",
    status: "active",
    notifyUser: false,
  });
  const [savingCreds, setSavingCreds] = useState(false);
  const [showModalPassword, setShowModalPassword] = useState(false);

  // View details modal state
  const [viewFarmer, setViewFarmer] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handleMasterPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !viewFarmer?._id) return;
    const formData = new FormData();
    formData.append("photo", file);
    setUploadingPhoto(true);
    try {
      const res = await api.post(`/master/farmers/${viewFarmer._id}/photo`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const newUrl = res.data?.profilePhoto;
      setViewFarmer((prev) => ({ ...prev, profilePhoto: newUrl }));
      setFarmers((prev) => prev.map((f) => (f._id === viewFarmer._id ? { ...f, profilePhoto: newUrl } : f)));
      toast.success("Farmer photo uploaded to AWS S3!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleMasterPhotoDelete = async () => {
    if (!window.confirm("Remove farmer's profile photo?")) return;
    if (!viewFarmer?._id) return;
    setUploadingPhoto(true);
    try {
      await api.delete(`/master/farmers/${viewFarmer._id}/photo`);
      setViewFarmer((prev) => ({ ...prev, profilePhoto: "" }));
      setFarmers((prev) => prev.map((f) => (f._id === viewFarmer._id ? { ...f, profilePhoto: "" } : f)));
      toast.success("Farmer photo removed from AWS S3");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Delete modal state
  const [deleteFarmerId, setDeleteFarmerId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchFarmers = async () => {
    try {
      const res = await api.get("/master/farmers");
      const list = res.data?.data?.farmers || res.data?.farmers || [];
      setFarmers(list);
    } catch {
      toast.error("Failed to load farmers directory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarmers();
  }, []);

  const togglePasswordVisibility = (farmerId) => {
    setShowPasswordMap((prev) => ({ ...prev, [farmerId]: !prev[farmerId] }));
  };

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const openCredModal = (farmer) => {
    setCredModalFarmer(farmer);
    setCredForm({
      mobile: farmer.mobile || "",
      memberId: farmer.memberId || "",
      name: farmer.name || "",
      village: farmer.village || "",
      email: farmer.email && farmer.email !== "milkify@gmail.com" ? farmer.email : "",
      password: "",
      status: farmer.status || "active",
      notifyUser: !!(farmer.email && farmer.email !== "milkify@gmail.com"),
    });
    setShowModalPassword(false);
  };

  const generateRandomPassword = () => {
    const prefixes = ["Kisan", "GauPal", "Dairy", "Mitra", "Amrit"];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(1000 + Math.random() * 9000);
    const symbols = ["@", "#", "!", "$"];
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const pass = `${prefix}${symbol}${num}`;
    setCredForm((prev) => ({ ...prev, password: pass }));
    setShowModalPassword(true);
    toast.success("Generated password: " + pass);
  };

  const handleUpdateCredentials = async (e) => {
    e.preventDefault();
    if (!credModalFarmer) return;

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
        memberId: credForm.memberId.trim(),
        name: credForm.name.trim(),
        village: credForm.village.trim(),
        email: credForm.email.trim() || undefined,
        password: credForm.password.trim() || undefined,
        status: credForm.status,
        notifyUser: credForm.notifyUser,
      };

      const res = await api.patch(`/master/farmers/${credModalFarmer._id}/credentials`, payload);
      toast.success(res.data?.message || "Farmer credentials updated successfully!");
      setCredModalFarmer(null);
      fetchFarmers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update farmer credentials");
    } finally {
      setSavingCreds(false);
    }
  };

  const handleDeleteFarmer = async () => {
    if (!deleteFarmerId) return;
    setDeleting(true);
    try {
      await api.delete(`/master/farmers/${deleteFarmerId}`);
      toast.success("Farmer deleted successfully");
      setDeleteFarmerId(null);
      fetchFarmers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete farmer");
    } finally {
      setDeleting(false);
    }
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const filteredFarmers = farmers.filter((f) => {
    const matchesSearch = 
      f.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.memberId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.mobile?.includes(searchTerm) ||
      f.village?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.adminId?.shopName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.adminId?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || f.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (!sortConfig.key) return 0;
    let aVal = a[sortConfig.key];
    let bVal = b[sortConfig.key];
    if (sortConfig.key === "dairy") {
      aVal = a.adminId?.shopName || "";
      bVal = b.adminId?.shopName || "";
    }
    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const activeCount = farmers.filter((f) => f.status === "active").length;
  const pauseCount = farmers.filter((f) => f.status === "pause").length;

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="h-8 w-8 text-purple-600" /> All Farmers Directory
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Master control of all farmers across dairy tenants. View login credentials and update user access.
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchFarmers} 
          className="gap-2 text-xs font-bold"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-none shadow-md">
          <CardContent className="p-5 flex justify-between items-center">
            <div>
              <p className="text-xs font-bold uppercase opacity-80">Total Registered Farmers</p>
              <h3 className="text-3xl font-black mt-1">{farmers.length}</h3>
            </div>
            <Users className="h-8 w-8 opacity-40" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-none shadow-md">
          <CardContent className="p-5 flex justify-between items-center">
            <div>
              <p className="text-xs font-bold uppercase opacity-80">Active Accounts</p>
              <h3 className="text-3xl font-black mt-1">{activeCount}</h3>
            </div>
            <CheckCircle2 className="h-8 w-8 opacity-40" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-none shadow-md">
          <CardContent className="p-5 flex justify-between items-center">
            <div>
              <p className="text-xs font-bold uppercase opacity-80">Paused Accounts</p>
              <h3 className="text-3xl font-black mt-1">{pauseCount}</h3>
            </div>
            <PauseCircle className="h-8 w-8 opacity-40" />
          </CardContent>
        </Card>
      </div>

      {/* Main Directory Table */}
      <Card className="shadow-lg border-none bg-white dark:bg-slate-950">
        <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <CardTitle className="text-base font-bold">Farmers List ({filteredFarmers.length})</CardTitle>
            <div className="flex gap-1 bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-bold">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`px-2.5 py-1 rounded-md transition-colors ${statusFilter === "all" ? "bg-white dark:bg-slate-950 shadow-xs text-purple-600" : "text-slate-500"}`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("active")}
                className={`px-2.5 py-1 rounded-md transition-colors ${statusFilter === "active" ? "bg-white dark:bg-slate-950 shadow-xs text-emerald-600" : "text-slate-500"}`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("pause")}
                className={`px-2.5 py-1 rounded-md transition-colors ${statusFilter === "pause" ? "bg-white dark:bg-slate-950 shadow-xs text-amber-600" : "text-slate-500"}`}
              >
                Paused
              </button>
            </div>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search farmer, ID, mobile, dairy..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[620px] overflow-y-auto relative">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/90 text-slate-500 uppercase font-bold sticky top-0 z-10 shadow-xs backdrop-blur-md">
                <tr>
                  <th className="px-5 py-3.5 cursor-pointer whitespace-nowrap" onClick={() => handleSort("name")}>
                    Farmer Info <ArrowUpDown className="h-3 w-3 inline ml-1 opacity-40" />
                  </th>
                  <th className="px-5 py-3.5 cursor-pointer whitespace-nowrap" onClick={() => handleSort("dairy")}>
                    Dairy Tenant <ArrowUpDown className="h-3 w-3 inline ml-1 opacity-40" />
                  </th>
                  <th className="px-5 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-purple-600">
                      <KeyRound className="h-3.5 w-3.5" />
                      <span>Farmer Login Credentials</span>
                    </div>
                  </th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Status</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Modified By &amp; Date</th>
                  <th className="px-5 py-3.5 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredFarmers.map((f) => (
                  <tr key={f._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    {/* Farmer Info */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-900/40 overflow-hidden flex items-center justify-center text-purple-700 dark:text-purple-300 font-bold text-xs shrink-0 border border-purple-200 dark:border-purple-800">
                          {f.profilePhoto ? (
                            <img src={f.profilePhoto} alt={f.name} className="w-full h-full object-cover" />
                          ) : (
                            f.name?.[0]?.toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-purple-700 dark:text-purple-300 border border-slate-200 dark:border-slate-700">
                              {f.memberId || "MI-000"}
                            </span>
                            <p className="font-bold text-slate-900 dark:text-white text-sm">{f.name}</p>
                          </div>
                          <p className="text-slate-500 text-[11px] mt-0.5 flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-slate-400" /> {f.village} &bull; {f.gender || "Male"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Dairy Tenant */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                        <Building className="h-3.5 w-3.5 text-slate-400" />
                        <span>{f.adminId?.shopName || "Self Dairy"}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Owner: {f.adminId?.name || "N/A"} ({f.adminId?.village || ""})
                      </p>
                    </td>

                    {/* Login Credentials */}
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
                            onClick={() => handleCopy(f.mobile, `f-mob-${f._id}`)}
                            className="text-slate-400 hover:text-purple-600 transition-colors p-0.5 rounded"
                            title="Copy Mobile"
                          >
                            {copiedKey === `f-mob-${f._id}` ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>

                        {/* Password / Key */}
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
                              className="text-slate-400 hover:text-purple-600 transition-colors p-0.5 rounded"
                              title={showPasswordMap[f._id] ? "Hide Password" : "Show Password"}
                            >
                              {showPasswordMap[f._id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopy(f.key, `f-pass-${f._id}`)}
                              className="text-slate-400 hover:text-purple-600 transition-colors p-0.5 rounded"
                              title="Copy Password"
                            >
                              {copiedKey === `f-pass-${f._id}` ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => openCredModal(f)}
                              className="text-purple-600 hover:text-purple-800 dark:text-purple-400 p-0.5 rounded hover:bg-purple-100 dark:hover:bg-purple-900/50"
                              title="Change Credentials"
                            >
                              <KeyRound className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${f.status === "active" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"}`}>
                        {f.status || "active"}
                      </span>
                    </td>

                    {/* Modified Signature */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {f.modifiedBy ? (
                        <div className="flex flex-col text-[11px] leading-tight">
                          <span className="font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-1">
                            <UserCheck className="h-3 w-3 text-purple-500 shrink-0" />
                            <span className="truncate max-w-[130px]" title={f.modifiedBy}>
                              {f.modifiedBy}
                            </span>
                          </span>
                          {f.modifiedAt && (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                              {formatDateTime(f.modifiedAt)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-purple-600 border-purple-200 hover:bg-purple-50 dark:border-purple-800 h-8 px-2"
                          onClick={() => openCredModal(f)}
                          title="Manage Farmer Credentials"
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-800 h-8 px-2"
                          onClick={() => setViewFarmer(f)}
                          title="View Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 h-8 px-2"
                          onClick={() => setDeleteFarmerId(f._id)}
                          title="Delete Farmer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredFarmers.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500 text-sm">
                      No farmers found matching the filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* View Farmer Details Modal */}
      {viewFarmer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 border dark:border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 border-2 border-white/40 overflow-hidden flex items-center justify-center font-bold text-2xl text-white shadow-lg">
                    {viewFarmer.profilePhoto ? (
                      <img src={viewFarmer.profilePhoto} alt={viewFarmer.name} className="w-full h-full object-cover" />
                    ) : (
                      viewFarmer.name?.[0]?.toUpperCase()
                    )}
                  </div>
                  <label
                    htmlFor={`master-farmer-photo-${viewFarmer._id}`}
                    className={`absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-purple-900 hover:bg-black text-white shadow-md cursor-pointer transition-transform hover:scale-105 ${uploadingPhoto ? "opacity-50 pointer-events-none" : ""}`}
                    title="Upload photo to S3"
                  >
                    {uploadingPhoto ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                  </label>
                  <input
                    id={`master-farmer-photo-${viewFarmer._id}`}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleMasterPhotoUpload}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase bg-white/20 px-2 py-0.5 rounded tracking-wider">
                      {viewFarmer.memberId || "MI-000"}
                    </span>
                    {viewFarmer.profilePhoto && (
                      <button
                        onClick={handleMasterPhotoDelete}
                        disabled={uploadingPhoto}
                        className="text-[10px] text-red-200 hover:text-white bg-red-900/40 px-2 py-0.5 rounded border border-red-400/30"
                      >
                        Remove Photo
                      </button>
                    )}
                  </div>
                  <h2 className="text-xl font-black mt-1">{viewFarmer.name}</h2>
                  <p className="text-xs text-white/80">{viewFarmer.village} &bull; Dairy: {viewFarmer.adminId?.shopName}</p>
                </div>
              </div>
              <button onClick={() => setViewFarmer(null)} className="text-white/80 hover:text-white bg-white/10 p-2 rounded-full">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Credentials Highlight Card */}
              <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-purple-200/60 dark:border-purple-800/60 pb-2">
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-purple-600" />
                    <span className="font-bold text-xs text-slate-900 dark:text-white">Farmer Login Credentials</span>
                  </div>
                  <Button
                    size="sm"
                    className="h-7 text-xs bg-purple-600 hover:bg-purple-700 text-white font-bold"
                    onClick={() => {
                      const cur = viewFarmer;
                      setViewFarmer(null);
                      openCredModal(cur);
                    }}
                  >
                    Change Credentials
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Login Mobile</span>
                    <p className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">{viewFarmer.mobile}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Password</span>
                    <p className="font-mono font-bold text-purple-600 dark:text-purple-400 mt-0.5">{viewFarmer.key || "1234"}</p>
                  </div>
                </div>
              </div>

              {/* General Info */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Associated Dairy</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{viewFarmer.adminId?.shopName || "N/A"}</p>
                  <p className="text-[11px] text-slate-500">Owner: {viewFarmer.adminId?.name}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Status</span>
                  <p className="font-bold mt-0.5 capitalize text-emerald-600">{viewFarmer.status || "active"}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Village / Address</span>
                  <p className="font-medium text-slate-900 dark:text-white mt-0.5">{viewFarmer.village}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Email Address</span>
                  <p className="font-medium text-slate-900 dark:text-white mt-0.5">{viewFarmer.email || "No email"}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t dark:border-slate-800 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setViewFarmer(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Manage Farmer Credentials Modal */}
      {credModalFarmer && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 border dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-5 text-white flex justify-between items-start">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/10 rounded-xl">
                  <KeyRound className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-black">Set Farmer Credentials</h2>
                  <p className="text-xs text-white/80">
                    For <strong>{credModalFarmer.name}</strong> ({credModalFarmer.memberId})
                  </p>
                </div>
              </div>
              <button onClick={() => setCredModalFarmer(null)} className="text-white/80 hover:text-white bg-white/10 p-1.5 rounded-full">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateCredentials} className="p-5 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                <span>Update this farmer&apos;s login user ID (mobile / member ID) and assign a new password.</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold uppercase text-slate-500">Login Mobile (10 Digits) *</label>
                  <input
                    required
                    maxLength={10}
                    value={credForm.mobile}
                    onChange={(e) => setCredForm({ ...credForm, mobile: e.target.value.replace(/\D/g, "") })}
                    className="w-full h-9 border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg px-2.5 font-mono text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase text-slate-500">Member ID</label>
                  <input
                    value={credForm.memberId}
                    onChange={(e) => setCredForm({ ...credForm, memberId: e.target.value })}
                    className="w-full h-9 border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg px-2.5 font-mono text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold uppercase text-slate-500">Farmer Name</label>
                  <input
                    value={credForm.name}
                    onChange={(e) => setCredForm({ ...credForm, name: e.target.value })}
                    className="w-full h-9 border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg px-2.5 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase text-slate-500">Village</label>
                  <input
                    value={credForm.village}
                    onChange={(e) => setCredForm({ ...credForm, village: e.target.value })}
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
                    onClick={generateRandomPassword}
                    className="text-purple-600 font-bold hover:underline flex items-center gap-1 text-[11px]"
                  >
                    <Sparkles className="h-3 w-3" /> Auto-Generate
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showModalPassword ? "text" : "password"}
                    value={credForm.password}
                    onChange={(e) => setCredForm({ ...credForm, password: e.target.value })}
                    placeholder="Enter new password (or leave blank to keep unchanged)"
                    className="w-full h-9 border dark:border-slate-800 bg-white dark:bg-slate-950 rounded-lg pl-2.5 pr-8 font-mono text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowModalPassword(!showModalPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showModalPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">
                  Current password: <strong className="font-mono text-purple-600">{credModalFarmer.key || "Not recorded"}</strong>
                </p>
              </div>

              {/* Account Status */}
              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="font-bold uppercase text-slate-500 block mb-1">Account Status</label>
                  <select
                    value={credForm.status}
                    onChange={(e) => setCredForm({ ...credForm, status: e.target.value })}
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
                    value={credForm.email}
                    onChange={(e) => setCredForm({ ...credForm, email: e.target.value })}
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
                  disabled={savingCreds}
                  className="flex-1 h-9 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs gap-1.5"
                >
                  {savingCreds ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Save Credentials
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Farmer Modal */}
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
    </div>
  );
}
