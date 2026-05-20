"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { toast } from "@/lib/toast";
import {
  Megaphone, Plus, Trash2, Edit2, X, Loader2, Send,
  Info, CheckCircle2, AlertTriangle, Gift, Zap,
  Users, Globe, Clock, Eye, ToggleLeft, ToggleRight,
  CalendarDays, ChevronDown, ChevronUp,
} from "lucide-react";

// ── Type configs ──────────────────────────────────────────────────────────────
const AD_TYPES = [
  { value: "info",    label: "Info",    Icon: Info,          bg: "bg-blue-50 dark:bg-blue-950/40",    border: "border-blue-200 dark:border-blue-800",    badge: "bg-blue-600",    text: "text-blue-700 dark:text-blue-300",    activeBorder: "border-blue-500" },
  { value: "success", label: "Success", Icon: CheckCircle2,  bg: "bg-emerald-50 dark:bg-emerald-950/40", border: "border-emerald-200 dark:border-emerald-800", badge: "bg-emerald-600", text: "text-emerald-700 dark:text-emerald-300", activeBorder: "border-emerald-500" },
  { value: "warning", label: "Warning", Icon: AlertTriangle, bg: "bg-amber-50 dark:bg-amber-950/40",   border: "border-amber-200 dark:border-amber-800",   badge: "bg-amber-500",   text: "text-amber-700 dark:text-amber-300",   activeBorder: "border-amber-500" },
  { value: "promo",   label: "Promo",   Icon: Gift,          bg: "bg-purple-50 dark:bg-purple-950/40", border: "border-purple-200 dark:border-purple-800", badge: "bg-purple-600", text: "text-purple-700 dark:text-purple-300", activeBorder: "border-purple-500" },
  { value: "update",  label: "Update",  Icon: Zap,           bg: "bg-cyan-50 dark:bg-cyan-950/40",    border: "border-cyan-200 dark:border-cyan-800",    badge: "bg-cyan-600",    text: "text-cyan-700 dark:text-cyan-300",    activeBorder: "border-cyan-500" },
];
const typeCfg = (type) => AD_TYPES.find((t) => t.value === type) || AD_TYPES[0];

const BLANK = {
  title: "", message: "", type: "info",
  targetAdmins: [], visibleDurationHours: 24,
  priority: 0, ctaLabel: "", ctaUrl: "",
};

export default function AdvertisementsPage() {
  const [ads,      setAds]      = useState([]);
  const [admins,   setAdmins]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [form,     setForm]     = useState(BLANK);
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [search,   setSearch]   = useState("");
  const [expanded, setExpanded] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      const [adsRes, adminsRes] = await Promise.all([
        api.get("/master/advertisements"),
        api.get("/master/admins"),
      ]);
      setAds(adsRes.data?.data?.advertisements || adsRes.data?.advertisements || []);
      setAdmins(adminsRes.data?.data?.admins   || adminsRes.data?.admins   || []);
    } catch { toast.error("Failed to load data"); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openCreate = () => { setEditing(null); setForm(BLANK); setShowForm(true); };
  const openEdit   = (ad) => {
    setEditing(ad._id);
    setForm({
      title:                ad.title,
      message:              ad.message,
      type:                 ad.type,
      targetAdmins:         (ad.targetAdmins || []).map((a) => a._id || a),
      visibleDurationHours: ad.visibleDurationHours,
      priority:             ad.priority,
      ctaLabel:             ad.ctaLabel || "",
      ctaUrl:               ad.ctaUrl   || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/master/advertisements/${editing}`, form);
        toast.success("Advertisement updated");
      } else {
        await api.post("/master/advertisements", form);
        toast.success("Advertisement sent!");
      }
      setShowForm(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await api.delete(`/master/advertisements/${id}`);
      toast.success("Deleted");
      fetchAll();
    } catch { toast.error("Delete failed"); }
    finally  { setDeleting(null); }
  };

  const toggleActive = async (ad) => {
    try {
      await api.patch(`/master/advertisements/${ad._id}`, { isActive: !ad.isActive });
      fetchAll();
    } catch { toast.error("Failed to update"); }
  };

  const toggleTarget = (id) => setForm((f) => ({
    ...f,
    targetAdmins: f.targetAdmins.includes(id)
      ? f.targetAdmins.filter((x) => x !== id)
      : [...f.targetAdmins, id],
  }));

  const now     = new Date();
  const filtered = ads.filter((a) =>
    (a.title   || "").toLowerCase().includes(search.toLowerCase()) ||
    (a.message || "").toLowerCase().includes(search.toLowerCase())
  );
  const liveCount = ads.filter((a) => a.isActive && new Date(a.expiresAt) > now).length;

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
    </div>
  );

  return (
    <div className="space-y-5">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-purple-500 shrink-0" />
            Advertisements & Alerts
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-sm">
            Broadcast targeted announcements to admin users in real-time.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 h-10 rounded-xl shadow-lg shadow-purple-200 dark:shadow-purple-900/30 transition-colors text-sm shrink-0"
        >
          <Plus className="h-4 w-4" /> New Alert
        </button>
      </div>

      {/* ── Stats row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {[
          { label: "Total",    value: ads.length,    icon: Megaphone,  color: "text-slate-600 dark:text-slate-300" },
          { label: "Live",     value: liveCount,     icon: Eye,        color: "text-green-600 dark:text-green-400" },
          { label: "Expired",  value: ads.filter((a) => new Date(a.expiresAt) <= now).length, icon: Clock, color: "text-slate-400" },
          { label: "Admins",   value: admins.length, icon: Users,      color: "text-purple-600 dark:text-purple-400" },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <s.icon className={`h-4 w-4 sm:h-5 sm:w-5 shrink-0 ${s.color}`} />
            <div>
              <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-none">{s.value}</p>
              <p className="text-[10px] sm:text-xs text-slate-400 font-medium mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search ─────────────────────────────────────────────────────────── */}
      <input
        type="text"
        placeholder="Search alerts..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white dark:placeholder-slate-500 transition"
      />

      {/* ── Ads list ───────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Megaphone className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold text-sm">No advertisements yet.</p>
          </div>
        )}

        {filtered.map((ad) => {
          const cfg     = typeCfg(ad.type);
          const expired = new Date(ad.expiresAt) <= now;
          const isLive  = ad.isActive && !expired;
          const isExp   = expanded === ad._id;
          const targets = ad.targetAdmins || [];

          return (
            <div
              key={ad._id}
              className={`rounded-xl border transition-all ${cfg.bg} ${cfg.border} ${!isLive ? "opacity-60" : ""}`}
            >
              {/* Card header row */}
              <div className="flex items-start gap-3 p-3 sm:p-4">
                {/* Type icon badge */}
                <div className={`mt-0.5 p-1.5 rounded-lg ${cfg.bg} shrink-0`}>
                  <cfg.Icon className={`h-4 w-4 ${cfg.text}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{ad.title}</p>
                        <span className={`text-[10px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded text-white ${cfg.badge}`}>
                          {ad.type}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isLive  ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" :
                          expired ? "bg-slate-100 text-slate-500 dark:bg-slate-800" :
                                    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                        }`}>
                          {isLive ? "LIVE" : expired ? "EXPIRED" : "PAUSED"}
                        </span>
                      </div>
                      <p className={`text-xs mt-0.5 ${isExp ? "" : "line-clamp-1"} ${cfg.text}`}>{ad.message}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => toggleActive(ad)} className="p-1.5 rounded-lg hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors" title={ad.isActive ? "Deactivate" : "Activate"}>
                        {ad.isActive ? <ToggleRight className="h-4 w-4 text-green-500" /> : <ToggleLeft className="h-4 w-4 text-slate-400" />}
                      </button>
                      <button onClick={() => openEdit(ad)} className="p-1.5 rounded-lg hover:bg-white/60 dark:hover:bg-slate-800/60 text-purple-500 transition-colors" title="Edit">
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDelete(ad._id)} disabled={deleting === ad._id} className="p-1.5 rounded-lg hover:bg-white/60 dark:hover:bg-slate-800/60 text-red-500 transition-colors" title="Delete">
                        {deleting === ad._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                      <button onClick={() => setExpanded(isExp ? null : ad._id)} className="p-1.5 rounded-lg hover:bg-white/60 dark:hover:bg-slate-800/60 text-slate-400 transition-colors">
                        {isExp ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px] sm:text-xs text-slate-400 dark:text-slate-500">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {new Date(ad.expiresAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />{ad.visibleDurationHours}h
                    </span>
                    <span className="flex items-center gap-1">
                      {targets.length > 0
                        ? <><Users className="h-3 w-3" />{targets.length} admin(s)</>
                        : <><Globe className="h-3 w-3" />All</>}
                    </span>
                    {(ad.priority || 0) > 0 && (
                      <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-1 rounded font-bold">P{ad.priority}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded CTA detail */}
              {isExp && ad.ctaLabel && ad.ctaUrl && (
                <div className="px-4 pb-3 border-t border-white/40 dark:border-slate-700/40 pt-2">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    CTA: <span className="font-bold text-slate-700 dark:text-slate-300">{ad.ctaLabel}</span>
                    {" → "}
                    <a href={ad.ctaUrl} target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 underline break-all">{ad.ctaUrl}</a>
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Create / Edit Modal ────────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setShowForm(false)} />
          <div className="relative w-full sm:max-w-xl bg-white dark:bg-slate-950 rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] z-10">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600">
                  <Megaphone className="h-4 w-4" />
                </div>
                <h3 className="font-black text-slate-900 dark:text-white text-sm">
                  {editing ? "Edit Advertisement" : "New Advertisement"}
                </h3>
              </div>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable form body */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto p-5 space-y-4">

                {/* Type picker */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Alert Type</label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {AD_TYPES.map((t) => (
                      <button
                        key={t.value} type="button"
                        onClick={() => setForm((f) => ({ ...f, type: t.value }))}
                        className={`flex flex-col items-center py-2 px-1 rounded-xl border-2 text-[10px] font-bold transition-all ${
                          form.type === t.value
                            ? `${t.bg} ${t.activeBorder} ${t.text}`
                            : "border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500"
                        }`}
                      >
                        <t.Icon className="h-3.5 w-3.5 mb-1" />
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Title *</label>
                  <input
                    required value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    maxLength={120}
                    placeholder="e.g. New feature released!"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Message *</label>
                  <textarea
                    required value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    rows={3} maxLength={1000}
                    placeholder="Full message content..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none transition"
                  />
                  <p className="text-[10px] text-slate-400 text-right mt-0.5">{form.message.length}/1000</p>
                </div>

                {/* CTA */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Button Label</label>
                    <input
                      value={form.ctaLabel}
                      onChange={(e) => setForm((f) => ({ ...f, ctaLabel: e.target.value }))}
                      placeholder="e.g. Learn More"
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Button URL</label>
                    <input
                      type="url"
                      value={form.ctaUrl}
                      onChange={(e) => setForm((f) => ({ ...f, ctaUrl: e.target.value }))}
                      placeholder="https://..."
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                    />
                  </div>
                </div>

                {/* Duration + Priority */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Visible (hours)</label>
                    <input
                      type="number" min={1} max={720}
                      value={form.visibleDurationHours}
                      onChange={(e) => setForm((f) => ({ ...f, visibleDurationHours: Number(e.target.value) }))}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Priority (0–10)</label>
                    <input
                      type="number" min={0} max={10}
                      value={form.priority}
                      onChange={(e) => setForm((f) => ({ ...f, priority: Number(e.target.value) }))}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                    />
                  </div>
                </div>

                {/* Target admins */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Admins</label>
                    <button type="button" onClick={() => setForm((f) => ({ ...f, targetAdmins: [] }))} className="text-[10px] text-purple-600 dark:text-purple-400 font-bold hover:underline">
                      Clear (broadcast all)
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-2">
                    {form.targetAdmins.length === 0 ? "🌍 Visible to ALL admins" : `🎯 ${form.targetAdmins.length} specific admin(s)`}
                  </p>
                  <div className="max-h-32 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                    {admins.map((admin) => (
                      <label key={admin._id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                        <input
                          type="checkbox"
                          checked={form.targetAdmins.includes(admin._id)}
                          onChange={() => toggleTarget(admin._id)}
                          className="h-3.5 w-3.5 rounded text-purple-600"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{admin.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{admin.shopName}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="flex items-center justify-between gap-3 px-5 py-4 border-t dark:border-slate-800 shrink-0 bg-slate-50 dark:bg-slate-900 rounded-b-2xl">
                <button
                  type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-purple-200 dark:shadow-purple-900/30 transition-colors disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {editing ? "Update" : "Send Alert"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
