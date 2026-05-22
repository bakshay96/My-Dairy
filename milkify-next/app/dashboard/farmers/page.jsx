"use client";

import { useState, useEffect, useMemo } from "react";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatRupees, formatIndianDate } from "@/lib/utils";
import MilkifyLoader from "@/components/ui/Loader";
import { 
  Search, Eye, Pencil, X, Loader2, CheckCircle2, 
  AlertCircle, Users, Phone, Calendar, MessageCircle 
} from "lucide-react";
import { toast } from "@/lib/toast";

// ─── Utility: Send WhatsApp Message ──────────────────────────────────────────
const sendWhatsApp = (mobile, message = "") => {
  // Ensure number is in international format (defaulting to Indian +91 if 10 digits)
  const cleanNumber = mobile.replace(/\D/g, "");
  const finalNumber = cleanNumber.length === 10 ? `91${cleanNumber}` : cleanNumber;
  const url = `https://wa.me/${finalNumber}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
  window.open(url, "_blank");
};

// ─── Farmer Detail / Edit Drawer ──────────────────────────────────────────────
function FarmerDrawer({ farmer, mode, onClose, onSaved }) {
  const [editing, setEditing] = useState(mode === "edit");
  const [form, setForm] = useState({
    name: farmer?.name || "",
    mobile: farmer?.mobile || "",
    email: farmer?.email || "",
    address: farmer?.address || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [milkHistory, setMilkHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState("");

  useEffect(() => {
    if (!editing && farmer?._id) {
      // Fetch milk history for this farmer
      setHistoryLoading(true);
      api.get(`/milk/farmer/${farmer._id}`)
        .then((res) => {
          const data = res.data?.data || res.data || [];
          setMilkHistory(Array.isArray(data) ? data.slice(0, 10) : []);
        })
        .catch(() => setMilkHistory([]))
        .finally(() => setHistoryLoading(false));
    }
  }, [editing, farmer]);

  const handleSave = async () => {
    // Client-side validation
    if (!form.name.trim()) {
      setError("Please enter farmer's full name.");
      return;
    }
    if (!form.mobile.trim()) {
      setError("Please enter mobile number.");
      return;
    }
    if (form.mobile.trim().length !== 10) {
      setError("Mobile number must be exactly 10 digits.");
      return;
    }
    
    setSaving(true);
    setError("");
    try {
      await api.put(`/farmer/${farmer._id}`, form);
      toast.success("Farmer updated successfully!");
      onSaved();
      onClose();
    } catch (e) {
      // Extract and display user-friendly error message
      const errorMessage = e.response?.data?.message || "Failed to save changes. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEntry = async (entryId, mode = "soft") => {
    const warning =
      mode === "hard"
        ? "Permanently delete this milk entry from DB? This cannot be undone."
        : "Soft delete this entry? It will be excluded from billing.";
    if (!window.confirm(warning)) return;
    setDeleteLoadingId(entryId);
    try {
      await api.delete(`/milk/${entryId}${mode === "hard" ? "?hard=true" : ""}`);
      toast.success(`Entry ${mode === "hard" ? "hard" : "soft"} deleted`);
      setMilkHistory((prev) => prev.filter((item) => item._id !== entryId));
      onSaved();
    } catch (error) {
      toast.error(error.response?.data?.message || "Delete failed");
    } finally {
      setDeleteLoadingId("");
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/45 backdrop-blur-[2px] z-40 transition-opacity"
        onClick={onClose}
      />
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-md bg-white/95 dark:bg-slate-900/95 shadow-2xl border-l border-white/70 dark:border-slate-800 flex flex-col overflow-hidden backdrop-blur-md">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/70 dark:border-slate-800 bg-gradient-to-r from-blue-50/80 to-indigo-50/70 dark:from-slate-900 dark:to-slate-900">
          <div>
            <h2 className="font-bold text-lg">{editing ? "Edit Farmer" : "Farmer Details"}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{farmer?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            {!editing && (
              <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="gap-1">
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-gradient-to-b from-transparent to-slate-50/40 dark:to-slate-950/20">
          {editing ? (
            /* ── Edit Form ─────────────────────────────────────────────── */
            <div className="space-y-4">
              {[
                { key: "name", label: "Full Name *", type: "text", placeholder: "Farmer name", required: true },
                { key: "mobile", label: "Mobile *", type: "tel", placeholder: "10-digit mobile", required: true, maxLength: 10 },
                { key: "email", label: "Email", type: "email", placeholder: "farmer@example.com" },
                { key: "address", label: "Village / Address *", type: "text", placeholder: "Village name", required: true },
              ].map(({ key, label, type, placeholder, maxLength }) => (
                <div key={key} className="space-y-1.5">
                  <label className="text-sm font-medium">{label}</label>
                  <input
                    type={type}
                    value={form[key]}
                    placeholder={placeholder}
                    maxLength={maxLength}
                    onChange={(e) => {
                      const value = type === "tel" ? e.target.value.replace(/\D/g, '').slice(0, 10) : e.target.value;
                      setForm({ ...form, [key]: value });
                      // Clear error when user starts typing
                      if (error) setError("");
                    }}
                    className={`flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      error && form[key] === '' ? 'border-red-500' : 'border-input bg-background'
                    }`}
                  />
                </div>
              ))}
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  <AlertCircle className="h-4 w-4" /> {error}
                </div>
              )}
            </div>
          ) : (
            /* ── View Details ──────────────────────────────────────────── */
            <div className="space-y-5">
              {/* Profile card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50/70 to-cyan-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 border border-blue-100/80 dark:border-slate-700 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl mb-3">
                  {farmer?.name?.[0]?.toUpperCase()}
                </div>
                <h3 className="font-bold text-gray-900">{farmer?.name}</h3>
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Phone className="h-3.5 w-3.5" />{farmer?.mobile}
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 gap-1.5 font-bold"
                    onClick={() => sendWhatsApp(farmer?.mobile, `Hello ${farmer?.name}, this is regarding your milk collection at Milkify Dairy.`)}
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </Button>
                </div>
                {farmer?.email && (
                  <p className="text-sm text-gray-500 mt-0.5">{farmer.email}</p>
                )}
                {farmer?.address && (
                  <p className="text-sm text-gray-500 mt-0.5">{farmer.address}</p>
                )}
                <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400">
                  <Calendar className="h-3 w-3" />
                  Joined {formatIndianDate(farmer?.createdAt)}
                </div>
              </div>

              {/* Milk history */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Milk Entries</h3>
                {historyLoading ? (
                  <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
                ) : milkHistory.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No milk entries yet.</p>
                ) : (
                  <div className="space-y-2">
                    {milkHistory.map((m) => (
                      <div key={m._id} className="flex items-center justify-between p-3 rounded-xl bg-white/90 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-sm shadow-sm">
                        <div>
                          <span className="font-medium capitalize">{m.shift}</span>
                          <span className="text-gray-500 ml-2">{m.date?.split(",")[0]}</span>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {m.litter}L • FAT {m.fat}% • {m.category}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="font-bold text-green-600">{formatRupees(m.calculatedAmount)}</span>
                          <div className="flex gap-1">
                            <button
                              disabled={deleteLoadingId === m._id}
                              onClick={() => handleDeleteEntry(m._id, "soft")}
                              className="px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-700"
                            >
                              Soft Delete
                            </button>
                            <button
                              disabled={deleteLoadingId === m._id}
                              onClick={() => handleDeleteEntry(m._id, "hard")}
                              className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-700"
                            >
                              Hard Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {editing && (
          <div className="p-4 border-t border-white/70 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-slate-100/70 dark:from-slate-900 dark:to-slate-900 flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => { setEditing(false); setError(""); }}>
              Cancel
            </Button>
            <Button className="flex-1" disabled={saving} onClick={handleSave}>
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save Changes"}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Add Farmer Drawer ────────────────────────────────────────────────────────
function AddFarmerDrawer({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: "", mobile: "", email: "", address: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleAdd = async () => {
    // Client-side validation
    if (!form.name.trim()) {
      setError("Please enter farmer's full name.");
      return;
    }
    if (!form.mobile.trim()) {
      setError("Please enter mobile number.");
      return;
    }
    if (form.mobile.trim().length !== 10) {
      setError("Mobile number must be exactly 10 digits.");
      return;
    }
    if (!form.address.trim()) {
      setError("Please enter village name or address.");
      return;
    }
    
    setSaving(true);
    setError("");
    try {
      await api.post("/farmer", form);
      setSuccess(true);
      toast.success("Farmer added successfully!");
      setTimeout(() => { onSaved(); onClose(); }, 1200);
    } catch (e) {
      // Extract and display user-friendly error message
      const errorMessage = e.response?.data?.message || "Failed to add farmer. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-[2px] z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-md bg-white/95 dark:bg-slate-900/95 shadow-2xl border-l border-white/70 dark:border-slate-800 flex flex-col backdrop-blur-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/70 dark:border-slate-800 bg-gradient-to-r from-indigo-50/80 to-blue-50/70 dark:from-slate-900 dark:to-slate-900">
          <h2 className="font-bold text-lg">Add New Farmer</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {[
            { key: "name", label: "Full Name *", type: "text", placeholder: "e.g. Ramesh Patil", required: true },
            { key: "mobile", label: "Mobile *", type: "tel", placeholder: "10-digit number", required: true, maxLength: 10 },
            { key: "email", label: "Email", type: "email", placeholder: "optional (e.g. farmer@example.com)" },
            { key: "address", label: "Village / Address *", type: "text", placeholder: "e.g. Bhandari, Mumbai", required: true },
          ].map(({ key, label, type, placeholder, maxLength }) => (
            <div key={key} className="space-y-1.5">
              <label className="text-sm font-medium">{label}</label>
              <input
                type={type}
                value={form[key]}
                placeholder={placeholder}
                maxLength={maxLength}
                onChange={(e) => {
                  const value = type === "tel" ? e.target.value.replace(/\D/g, '').slice(0, 10) : e.target.value;
                  setForm({ ...form, [key]: value });
                  // Clear error when user starts typing
                  if (error) setError("");
                }}
                className={`flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  error && form[key] === '' ? 'border-red-500' : 'border-input bg-background'
                }`}
              />
            </div>
          ))}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle className="h-4 w-4" /> {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
              <CheckCircle2 className="h-4 w-4" /> Farmer added successfully!
            </div>
          )}
        </div>
        <div className="p-4 border-t border-white/70 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-slate-100/70 dark:from-slate-900 dark:to-slate-900 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" disabled={saving || success} onClick={handleAdd}>
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Adding...</> : "Add Farmer"}
          </Button>
        </div>
      </div>
    </>
  );
}

// ─── Main Farmers Page ────────────────────────────────────────────────────────
export default function FarmersPage() {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [drawer, setDrawer] = useState(null); // { farmer, mode: "view"|"edit" }
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState("");

  const loadFarmers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/farmer");
      const list = Array.isArray(res.data?.farmers)
        ? res.data.farmers
        : Array.isArray(res.data) ? res.data : [];
      setFarmers(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFarmers(); }, []);

  const handleToggleStatus = async (farmer) => {
    const nextStatus = farmer.status === "active" ? "pause" : "active";
    setStatusUpdatingId(farmer._id);
    try {
      await api.put(`/farmer/${farmer._id}`, { status: nextStatus });
      toast.success(`Farmer ${nextStatus === "active" ? "activated" : "deactivated"}`);
      await loadFarmers();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to update farmer status");
    } finally {
      setStatusUpdatingId("");
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return farmers;
    return farmers.filter(
      (f) =>
        f.name?.toLowerCase().includes(q) ||
        String(f.mobile || "").includes(q) ||
        f.email?.toLowerCase().includes(q)
    );
  }, [farmers, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Farmers</h1>
          <p className="text-muted-foreground mt-1">{farmers.length} registered farmers</p>
        </div>
        <Button onClick={() => setAddDrawerOpen(true)} className="gap-2">
          <Users className="h-4 w-4" /> Add Farmer
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, mobile or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex h-11 w-full rounded-xl border border-input/80 bg-white/90 dark:bg-slate-900 pl-10 pr-10 py-2 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-ring"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Table */}
      <Card className="shadow-md shadow-slate-900/5 dark:bg-slate-900/90 dark:border-slate-800">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center py-16 min-h-[300px]">
              <MilkifyLoader text="Loading Farmers" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Users className="h-10 w-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-500 text-sm">
                {search ? "No farmers match your search." : "No farmers added yet."}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-slate-50 to-slate-100/70 dark:from-slate-900 dark:to-slate-900 border-b text-xs text-gray-500 uppercase tracking-wide">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">#</th>
                    <th className="px-4 py-3 text-left font-medium">Name</th>
                    <th className="px-4 py-3 text-left font-medium">Mobile</th>
                    <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Email</th>
                    <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">Joined</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-center font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {filtered.map((f, i) => (
                    <tr key={f._id} className="hover:bg-slate-50/90 dark:hover:bg-slate-800/70 transition-colors">
                      <td className="px-4 py-3.5 text-gray-400">{i + 1}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                            {f.name?.[0]?.toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{f.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-gray-600 dark:text-gray-300">{f.mobile}</td>
                      <td className="px-4 py-3.5 text-gray-500 dark:text-gray-300 hidden md:table-cell">{f.email || "—"}</td>
                      <td className="px-4 py-3.5 text-gray-400 hidden lg:table-cell text-xs">
                        {formatIndianDate(f.createdAt)}
                      </td>
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => handleToggleStatus(f)}
                          disabled={statusUpdatingId === f._id}
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            f.status === "active"
                              ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800/40"
                              : "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40"
                          }`}
                        >
                          {statusUpdatingId === f._id ? "..." : f.status === "active" ? "Active" : "Paused"}
                        </button>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => sendWhatsApp(f.mobile)}
                            className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600 transition-colors"
                            title="Message on WhatsApp"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDrawer({ farmer: f, mode: "view" })}
                            className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 transition-colors"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDrawer({ farmer: f, mode: "edit" })}
                            className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-600 transition-colors"
                            title="Edit Farmer"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards Grid View */}
            <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((f) => (
                <div key={f._id} className="p-4 flex flex-col gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm select-none">
                        {f.name ? f.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "F"}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-snug">{f.name}</h3>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          <a href={`tel:${f.mobile}`} className="hover:underline font-medium text-slate-700 dark:text-slate-355">{f.mobile}</a>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleStatus(f)}
                      disabled={statusUpdatingId === f._id}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border uppercase tracking-wider ${
                        f.status === "active"
                          ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800/40"
                          : "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40"
                      }`}
                    >
                      {statusUpdatingId === f._id ? "..." : f.status === "active" ? "Active" : "Paused"}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 mt-0.5 border-t border-slate-50 dark:border-slate-800/50 pt-3">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Address</span>
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{f.address || "—"}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Joined</span>
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{formatIndianDate(f.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-50 dark:border-slate-800/50">
                    <button
                      onClick={() => sendWhatsApp(f.mobile)}
                      className="flex-1 py-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-600 dark:text-emerald-500 transition-colors border border-slate-100 dark:border-slate-800 flex items-center justify-center gap-1.5 text-xs font-semibold"
                      title="Message on WhatsApp"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>WhatsApp</span>
                    </button>
                    <button
                      onClick={() => setDrawer({ farmer: f, mode: "view" })}
                      className="flex-1 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/20 text-blue-600 dark:text-blue-400 transition-colors border border-slate-100 dark:border-slate-800 flex items-center justify-center gap-1.5 text-xs font-semibold"
                      title="View Details"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>View</span>
                    </button>
                    <button
                      onClick={() => setDrawer({ farmer: f, mode: "edit" })}
                      className="flex-1 py-2 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/20 text-amber-600 dark:text-amber-400 transition-colors border border-slate-100 dark:border-slate-800 flex items-center justify-center gap-1.5 text-xs font-semibold"
                      title="Edit Farmer"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Farmer Detail / Edit Drawer */}
      {drawer && (
        <FarmerDrawer
          farmer={drawer.farmer}
          mode={drawer.mode}
          onClose={() => setDrawer(null)}
          onSaved={loadFarmers}
        />
      )}

      {/* Add Farmer Drawer */}
      {addDrawerOpen && (
        <AddFarmerDrawer
          onClose={() => setAddDrawerOpen(false)}
          onSaved={loadFarmers}
        />
      )}
    </div>
  );
}
