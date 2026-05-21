"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Bell, BellOff, Clock, Play, Pause, Search, ChevronDown, ChevronUp,
  Users, CheckCircle2, AlertTriangle, CreditCard, Tractor, ShieldAlert,
  TicketIcon, Zap, X,
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "@/lib/toast";

// ── Notification type config ─────────────────────────────────────────────────
const NOTIFICATION_TYPES = [
  { key: "paymentAlert",       label: "Payment Alerts",      icon: CreditCard,   color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
  { key: "farmerUpdate",       label: "Farmer Updates",      icon: Tractor,       color: "text-blue-500",    bg: "bg-blue-50 dark:bg-blue-900/20" },
  { key: "subscriptionAlert",  label: "Subscription Alerts", icon: Zap,           color: "text-amber-500",   bg: "bg-amber-50 dark:bg-amber-900/20" },
  { key: "ticketReply",        label: "Ticket Replies",      icon: TicketIcon,    color: "text-purple-500",  bg: "bg-purple-50 dark:bg-purple-900/20" },
  { key: "systemAlert",        label: "System Alerts",       icon: ShieldAlert,   color: "text-red-500",     bg: "bg-red-50 dark:bg-red-900/20" },
];

// ── Toggle Switch ────────────────────────────────────────────────────────────
const Toggle = ({ enabled, onChange, disabled = false }) => (
  <button
    onClick={() => !disabled && onChange(!enabled)}
    disabled={disabled}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${
      enabled ? "bg-indigo-500" : "bg-slate-300 dark:bg-slate-600"
    } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    aria-label="Toggle"
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
        enabled ? "translate-x-6" : "translate-x-1"
      }`}
    />
  </button>
);

// ── Skeleton ─────────────────────────────────────────────────────────────────
const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700/60 ${className}`} />
);

// ── Countdown hook ───────────────────────────────────────────────────────────
const useCountdown = (pausedUntil) => {
  const [text, setText] = useState("");

  useEffect(() => {
    if (!pausedUntil) { setText(""); return; }

    const update = () => {
      const diff = new Date(pausedUntil) - new Date();
      if (diff <= 0) { setText("Resuming..."); return; }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) setText(`${days}d ${hours}h ${minutes}m`);
      else if (hours > 0) setText(`${hours}h ${minutes}m ${seconds}s`);
      else setText(`${minutes}m ${seconds}s`);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [pausedUntil]);

  return text;
};

// ── Countdown Cell Component ─────────────────────────────────────────────────
const CountdownCell = ({ pausedUntil }) => {
  const countdown = useCountdown(pausedUntil);
  if (!pausedUntil) return <span className="text-slate-400">—</span>;
  return (
    <div className="flex items-center gap-1.5">
      <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse-soft" />
      <span className="text-sm font-mono font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
        {countdown}
      </span>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════════════════════════════
export default function NotificationManagement() {
  const [settings, setSettings]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [searchTerm, setSearchTerm]     = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId]     = useState(null);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin]   = useState(null);
  const [pauseDate, setPauseDate]       = useState("");
  const [pauseTime, setPauseTime]       = useState("09:00");
  const [saving, setSaving]             = useState(false);
  const [soundTrigger, setSoundTrigger] = useState(0);

  // ── Fetch settings ─────────────────────────────────────────────────────
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/master/notification-settings");
      setSettings(res.data?.settings || []);
    } catch (err) {
      console.error("[Notifications] Fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  // ── Handlers ───────────────────────────────────────────────────────────
  const handlePauseClick = (admin) => {
    setSelectedAdmin(admin);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setPauseDate(tomorrow.toISOString().split("T")[0]);
    setPauseTime("09:00");
    setShowPauseModal(true);
  };

  const handleConfirmPause = async () => {
    if (!selectedAdmin || !pauseDate) return;
    try {
      setSaving(true);
      const pausedUntil = new Date(`${pauseDate}T${pauseTime}:00`);
      await api.patch(`/master/notification-settings/${selectedAdmin.adminId}`, {
        enabled: false,
        pausedUntil: pausedUntil.toISOString(),
      });
      setShowPauseModal(false);
      fetchSettings();
    } catch (err) {
      console.error("[Notifications] Pause failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleResume = async (adminId) => {
    try {
      await api.patch(`/master/notification-settings/${adminId}/resume`);
      fetchSettings();
    } catch (err) {
      console.error("[Notifications] Resume failed:", err);
    }
  };

  const handleToggleType = async (adminId, typeKey, newValue) => {
    try {
      await api.patch(`/master/notification-settings/${adminId}/types`, {
        notificationTypes: { [typeKey]: newValue },
      });
      fetchSettings();
    } catch (err) {
      console.error("[Notifications] Toggle type failed:", err);
    }
  };

  // ── Filtering ──────────────────────────────────────────────────────────
  const filteredSettings = settings.filter((s) => {
    const matchesSearch =
      s.adminName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.adminEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.shopName?.toLowerCase().includes(searchTerm.toLowerCase());
    if (statusFilter === "active") return matchesSearch && !s.isPaused;
    if (statusFilter === "paused") return matchesSearch && s.isPaused;
    return matchesSearch;
  });

  // ── Summary stats ─────────────────────────────────────────────────────
  const totalAdmins = settings.length;
  const activeCount = settings.filter((s) => !s.isPaused).length;
  const pausedCount = settings.filter((s) => s.isPaused).length;

  const summaryCards = [
    { label: "Total Admins",  value: totalAdmins, icon: Users,         gradient: "from-indigo-500 to-purple-600" },
    { label: "Active",        value: activeCount,  icon: CheckCircle2,  gradient: "from-emerald-500 to-teal-600" },
    { label: "Paused",        value: pausedCount,  icon: AlertTriangle, gradient: "from-amber-500 to-orange-600" },
  ];

  // ══════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════
  if (loading) {
    return (
      <div className="space-y-6">
        <div><Skeleton className="h-8 w-56 mb-2" /><Skeleton className="h-4 w-72" /></div>
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <Skeleton className="h-16 rounded-2xl" />
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Notification Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage email notification services for all admin accounts
        </p>
      </div>

      {/* ── Summary Cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 p-4 sm:p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
          >
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient} opacity-80`} />
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-sm`}>
                <card.icon className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {card.label}
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{card.value}</p>
          </div>
        ))}
      </div>

      {/* ── Search + Filter ─────────────────────────────────────────────── */}
      <Card className="p-4 sm:p-5 bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/60">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, or shop..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow sm:w-36"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
          </select>
          <div className="flex items-center text-xs font-semibold text-slate-500 dark:text-slate-400 sm:w-24 justify-end">
            {filteredSettings.length} result{filteredSettings.length !== 1 ? "s" : ""}
          </div>
        </div>
      </Card>

      {/* ── Admin Cards (Mobile) / Table (Desktop) ──────────────────────── */}
      {filteredSettings.length > 0 ? (
        <div className="space-y-3">
          {filteredSettings.map((setting) => {
            const isExpanded = expandedId === setting._id;
            return (
              <Card
                key={setting._id}
                className="overflow-hidden bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/60 transition-all duration-300"
              >
                {/* ── Main row ─────────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 sm:p-5">
                  {/* Admin info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {setting.adminName}
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          setting.isPaused
                            ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                            : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                        }`}
                      >
                        {setting.isPaused ? (
                          <><BellOff className="w-2.5 h-2.5" /> Paused</>
                        ) : (
                          <><Bell className="w-2.5 h-2.5" /> Active</>
                        )}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {setting.adminEmail} · {setting.shopName}
                    </p>
                  </div>

                  {/* Countdown */}
                  <div className="sm:w-32 shrink-0">
                    <CountdownCell pausedUntil={setting.isPaused ? setting.pausedUntil : null} />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {setting.isPaused ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResume(setting.adminId)}
                        className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                      >
                        <Play className="w-3 h-3" /> Resume
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePauseClick(setting)}
                        className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                      >
                        <Pause className="w-3 h-3" /> Pause
                      </Button>
                    )}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : setting._id)}
                      className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
                      aria-label="Toggle notification types"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* ── Expanded: notification type toggles ──────────────── */}
                {isExpanded && (
                  <div className="border-t border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/30 px-4 sm:px-5 py-4 animate-slide-down">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                      Notification Types
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {NOTIFICATION_TYPES.map((type) => {
                        const isEnabled = setting.notificationTypes?.[type.key] !== false;
                        return (
                          <div
                            key={type.key}
                            className={`flex items-center justify-between gap-3 rounded-xl p-3 transition-colors ${type.bg}`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <type.icon className={`w-4 h-4 shrink-0 ${type.color}`} />
                              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
                                {type.label}
                              </span>
                            </div>
                            <Toggle
                              enabled={isEnabled}
                              onChange={(val) => handleToggleType(setting.adminId, type.key, val)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-12 sm:p-16 text-center bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/60">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center">
            <Bell className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-medium">
            {searchTerm || statusFilter !== "all"
              ? "No admins found matching your filters"
              : "No notification settings available"}
          </p>
        </Card>
      )}

      {/* ── Sound & Audio Notifications ─────────────────────────────────── */}
      <Card className="shadow-lg border-none bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/60 overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/50">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <svg className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            Sound &amp; Audio Notifications
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Control live activity audio chimes for incoming desk tickets</p>
        </div>
        <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-sm text-slate-900 dark:text-white">Synthesize Live Activity Sound</p>
            <p className="text-xs text-slate-500 mt-1 leading-normal">
              Plays a sleek triple-tone sound synthesizer chime immediately on incoming support desk tickets and replies.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const disabled = localStorage.getItem("milkify-sound-disabled") === "true";
                localStorage.setItem("milkify-sound-disabled", disabled ? "false" : "true");
                setSoundTrigger(p => p + 1);
                toast.success(`Notification chime ${disabled ? "enabled" : "disabled"} successfully!`);
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                localStorage.getItem("milkify-sound-disabled") !== "true" ? "bg-indigo-500" : "bg-slate-300 dark:bg-slate-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  localStorage.getItem("milkify-sound-disabled") !== "true" ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>

            <button
              onClick={() => {
                try {
                  const AudioContext = window.AudioContext || window.webkitAudioContext;
                  if (!AudioContext) return;
                  const ctx = new AudioContext();
                  const playTone = (freq, startTime, duration) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = "sine";
                    osc.frequency.value = freq;
                    gain.gain.setValueAtTime(0, startTime);
                    gain.gain.linearRampToValueAtTime(0.15, startTime + 0.03);
                    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(startTime);
                    osc.stop(startTime + duration);
                  };
                  const now = ctx.currentTime;
                  playTone(784, now, 0.12);
                  playTone(1046.5, now + 0.08, 0.15);
                  playTone(1318.5, now + 0.16, 0.25);
                } catch {}
              }}
              className="px-4 h-9 text-xs font-extrabold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl transition-all border border-slate-200/60 dark:border-slate-600 shadow-sm"
            >
              Test Chime
            </button>
          </div>
        </div>
      </Card>
      {soundTrigger >= 0 && null}
      {/* eslint-disable-next-line @typescript-eslint/no-unused-vars */}


      {/* ── Pause Modal ─────────────────────────────────────────────────── */}
      {showPauseModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <Card className="w-full max-w-md p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Pause Notifications
              </h2>
              <button
                onClick={() => setShowPauseModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-400 mb-5">
              Pause all email notifications for{" "}
              <strong className="text-slate-900 dark:text-white">{selectedAdmin?.adminName}</strong> until:
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  Resume Date
                </label>
                <input
                  type="date"
                  value={pauseDate}
                  onChange={(e) => setPauseDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  Resume Time
                </label>
                <input
                  type="time"
                  value={pauseTime}
                  onChange={(e) => setPauseTime(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-xl">
                <p className="text-xs text-indigo-700 dark:text-indigo-300">
                  Notifications will automatically resume on{" "}
                  <strong>{pauseDate || "selected date"}</strong> at{" "}
                  <strong>{pauseTime}</strong>
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowPauseModal(false)}
                className="flex-1"
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmPause}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
                disabled={saving}
              >
                {saving ? "Pausing..." : "Confirm Pause"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
