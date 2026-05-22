"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import {
  Settings, Loader2, AlertCircle,
  User, Lock, Bell,
  Volume2, Calendar, ShieldAlert, Check, Eye, EyeOff,
  ArrowRight
} from "lucide-react";

// ─── Main Settings Page ───────────────────────────────────────────────────────
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("rate");

  // Auth Context & Syncing
  const authUser = useAuthStore((s) => s.user);
  const authToken = useAuthStore((s) => s.token);
  const sessionExpiresAt = useAuthStore((s) => s.sessionExpiresAt);
  const setAuth = useAuthStore((s) => s.setAuth);

  // Profile config states
  const [profileForm, setProfileForm] = useState({
    name: "",
    shopName: "",
    email: "",
    mobile: "",
    village: "",
    gender: "male",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Security config states
  const [securityForm, setSecurityForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [securitySaving, setSecuritySaving] = useState(false);
  const [securityError, setSecurityError] = useState("");

  // Notification states
  const [notificationConfig, setNotificationConfig] = useState({
    emailEnabled: true,
    pausedUntil: null,
    paymentAlert: true,
    farmerUpdate: true,
    subscriptionAlert: true,
    ticketReply: true,
    systemAlert: true,
  });
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifSaving, setNotifSaving] = useState(false);
  const [soundDisabled, setSoundDisabled] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Sync profile fields from user session
  useEffect(() => {
    if (authUser) {
      setProfileForm({
        name: authUser.name || "",
        shopName: authUser.shopName || "",
        email: authUser.email || "",
        mobile: authUser.mobile || "",
        village: authUser.village || "",
        gender: authUser.gender || "male",
      });
    }
  }, [authUser]);

  // Sync sound setting
  useEffect(() => {
    setSoundDisabled(localStorage.getItem("milkify-sound-disabled") === "true");
  }, []);



  const fetchNotificationSettings = useCallback(async () => {
    setNotifLoading(true);
    try {
      const res = await api.get("/admin/notification-settings");
      const s = res.data?.data?.settings || res.data?.settings;
      if (s) {
        setNotificationConfig({
          emailEnabled: s.emailNotifications?.enabled ?? true,
          pausedUntil: s.emailNotifications?.pausedUntil ?? null,
          paymentAlert: s.notificationTypes?.paymentAlert ?? true,
          farmerUpdate: s.notificationTypes?.farmerUpdate ?? true,
          subscriptionAlert: s.notificationTypes?.subscriptionAlert ?? true,
          ticketReply: s.notificationTypes?.ticketReply ?? true,
          systemAlert: s.notificationTypes?.systemAlert ?? true,
        });
      }
    } catch {
      console.warn("Failed to load remote notification configs.");
    } finally {
      setNotifLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotificationSettings();
  }, [fetchNotificationSettings]);



  // Submit Profile Form
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError("");
    try {
      const res = await api.put("/admin/profile", profileForm);
      const updatedAdmin = res.data?.data?.admin || res.data?.admin;
      if (updatedAdmin) {
        setAuth(updatedAdmin, authToken, sessionExpiresAt);
        toast.success("Profile saved successfully!");
      } else {
        toast.success("Profile saved successfully!");
        const meRes = await api.get("/admin/me");
        const meAdmin = meRes.data?.data?.admin || meRes.data?.admin;
        if (meAdmin) setAuth(meAdmin, authToken, sessionExpiresAt);
      }
    } catch (err) {
      setProfileError(err.response?.data?.message || "Failed to save profile.");
      toast.error(err.response?.data?.message || "Failed to save profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  // Submit Password Form
  const handleSecuritySubmit = async (e) => {
    e.preventDefault();
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      setSecurityError("Confirm password does not match with your new password.");
      return;
    }
    setSecuritySaving(true);
    setSecurityError("");
    try {
      await api.put("/admin/change-password", {
        oldPassword: securityForm.oldPassword,
        newPassword: securityForm.newPassword,
      });
      toast.success("Password changed successfully! A security alert email has been sent.");
      setSecurityForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setSecurityError(err.response?.data?.message || "Failed to update security credentials.");
      toast.error(err.response?.data?.message || "Failed to update security credentials.");
    } finally {
      setSecuritySaving(false);
    }
  };

  // Submit Notification configs
  const handleNotificationSubmit = async (e) => {
    if (e) e.preventDefault();
    setNotifSaving(true);
    try {
      const payload = {
        emailNotifications: {
          enabled: notificationConfig.emailEnabled,
          pausedUntil: notificationConfig.pausedUntil,
        },
        notificationTypes: {
          paymentAlert: notificationConfig.paymentAlert,
          farmerUpdate: notificationConfig.farmerUpdate,
          subscriptionAlert: notificationConfig.subscriptionAlert,
          ticketReply: notificationConfig.ticketReply,
          systemAlert: notificationConfig.systemAlert,
        }
      };
      await api.put("/admin/notification-settings", payload);
      toast.success("Notification preferences updated!");
    } catch {
      toast.error("Failed to save remote notification preferences.");
    } finally {
      setNotifSaving(false);
    }
  };

  const toggleSoundChime = () => {
    const disabled = !soundDisabled;
    localStorage.setItem("milkify-sound-disabled", disabled ? "true" : "false");
    setSoundDisabled(disabled);
    toast.success(`Synthesized live notifications chime ${disabled ? "disabled" : "enabled"}!`);
  };

  const playTestChime = () => {
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
    } catch (e) {
      console.warn("Audio Context blocked:", e);
    }
  };

  const handlePausePreset = (days) => {
    let date = null;
    if (days !== "indefinite") {
      date = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    } else {
      date = new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000); // 10 years
    }
    setNotificationConfig(c => ({ ...c, pausedUntil: date }));
    toast.success(`Preset selected! Click 'Save Notification Config' to apply.`);
  };

  const isPaused = notificationConfig.pausedUntil && new Date(notificationConfig.pausedUntil) > new Date();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="h-7 w-7 text-purple-600" /> Account Settings
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Configure pricing algorithms, profile metrics, credentials and active alerts.</p>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar gap-2 py-1 scrollbar-thin">
        {[
          { id: "rate", label: "Rate Configs (Deprecated)", icon: Settings },
          { id: "profile", label: "My Profile", icon: User },
          { id: "security", label: "Security & Passwords", icon: Lock },
          { id: "notification", label: "Notification Desk", icon: Bell },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all border",
                isActive
                  ? "bg-purple-600 text-white border-transparent shadow-md shadow-purple-100 dark:shadow-purple-950/20 scale-102"
                  : "bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:text-slate-700 dark:hover:text-slate-350"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dynamic Tabs Panels */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm min-h-[400px] animate-fadeIn">
        
        {/* TAB 1: Rate Configs (Deprecated) */}
        {activeTab === "rate" && (
          <div className="space-y-6 max-w-2xl animate-in fade-in slide-in-from-bottom-3">
            <div className="p-6 sm:p-8 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-6 shadow-sm">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 flex items-center justify-center animate-pulse">
                <ShieldAlert className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  Legacy Rates Feature Deprecated
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
                  To align with modern cooperative dairy practices and government standards, the static fat-only rate model has been replaced by the dynamic **Milk Rates Generator & Pricing Engine**.
                </p>
              </div>
              <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-2xl text-left text-xs sm:text-sm space-y-2">
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-405 font-black">
                  <Check className="h-4 w-4 shrink-0" />
                  <span>Why use the new Pricing Engine?</span>
                </div>
                <ul className="list-disc pl-5 space-y-1 text-slate-500 dark:text-slate-400 font-medium">
                  <li>Point-increment calculation based on animal types (Cow, Buffalo, Sheep, Goat)</li>
                  <li>Dynamic SNF parsing using Richmond&apos;s formula from Lactometer Degree (CLR)</li>
                  <li>Precise floating-point financial metrics with integer scaling protection</li>
                  <li>Interactive rate chart preview grid tailored for mobile screens</li>
                </ul>
              </div>
              <div className="pt-2 animate-in fade-in zoom-in-95 delay-150">
                <Button
                  onClick={() => window.location.href = "/dashboard/rates"}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-black uppercase tracking-wider rounded-xl h-11 px-6 shadow-md transition-all active:scale-[0.98] gap-2"
                >
                  Configure Rates in Pricing Engine
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: My Profile */}
        {activeTab === "profile" && (
          <form onSubmit={handleProfileSubmit} className="space-y-6 max-w-2xl">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <User className="h-5 w-5 text-purple-600" /> Profile Configurations
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Manage store identifiers, local contact information, and coordinates.</p>
            </div>

            {profileError && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-sm">
                <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                <span className="font-semibold">{profileError}</span>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-450">Full Name *</label>
                <input
                  required
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm(f => ({ ...f, name: e.target.value }))}
                  className="flex h-11 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  placeholder="e.g. Ramesh Patel"
                />
              </div>

              {/* Shop Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-450">Dairy/Shop Name *</label>
                <input
                  required
                  type="text"
                  value={profileForm.shopName}
                  onChange={(e) => setProfileForm(f => ({ ...f, shopName: e.target.value }))}
                  className="flex h-11 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  placeholder="e.g. Krishna Cooperative Dairy"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-450">Email Address *</label>
                <input
                  required
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm(f => ({ ...f, email: e.target.value }))}
                  className="flex h-11 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  placeholder="e.g. admin@dairy.com"
                />
              </div>

              {/* Mobile */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-450">Mobile Number *</label>
                <input
                  required
                  type="tel"
                  value={profileForm.mobile}
                  onChange={(e) => setProfileForm(f => ({ ...f, mobile: e.target.value }))}
                  className="flex h-11 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  placeholder="e.g. 9876543210"
                />
              </div>

              {/* Village */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-450">Village/Region</label>
                <input
                  type="text"
                  value={profileForm.village}
                  onChange={(e) => setProfileForm(f => ({ ...f, village: e.target.value }))}
                  className="flex h-11 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  placeholder="e.g. Anand, Gujarat"
                />
              </div>

              {/* Gender */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-450">Gender</label>
                <div className="grid grid-cols-3 gap-3">
                  {["male", "female", "other"].map((g) => (
                    <label key={g} className={cn(
                      "flex flex-col items-center justify-center p-2 rounded-xl border cursor-pointer transition-all capitalize text-xs font-bold",
                      profileForm.gender === g
                        ? "bg-purple-50/50 border-purple-500 text-purple-700 dark:bg-purple-950/20 dark:border-purple-600 dark:text-purple-300 ring-1 ring-purple-500"
                        : "bg-transparent border-slate-200 hover:border-slate-350 dark:border-slate-800 dark:hover:border-slate-700 text-slate-500"
                    )}>
                      <input type="radio" name="gender" value={g} checked={profileForm.gender === g}
                        onChange={(e) => setProfileForm(f => ({ ...f, gender: e.target.value }))}
                        className="sr-only" />
                      <span>{g}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <Button type="submit" disabled={profileSaving} className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-11 font-black px-6 shadow-md shadow-purple-100 dark:shadow-none transition-all duration-200">
              {profileSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save Profile Details"}
            </Button>
          </form>
        )}

        {/* TAB 3: Security & Passwords */}
        {activeTab === "security" && (
          <form onSubmit={handleSecuritySubmit} className="space-y-6 max-w-xl">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="h-5 w-5 text-purple-600" /> Security Credentials
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Keep your account safe by updating credentials periodically.</p>
            </div>

            {securityError && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-sm">
                <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                <span className="font-semibold">{securityError}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Old Password */}
              <div className="space-y-1.5 relative">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-450">Current Password *</label>
                <div className="relative">
                  <input
                    required
                    type={showOldPass ? "text" : "password"}
                    value={securityForm.oldPassword}
                    onChange={(e) => setSecurityForm(f => ({ ...f, oldPassword: e.target.value }))}
                    className="flex h-11 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 pl-3 pr-10 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    placeholder="Enter current password"
                  />
                  <button type="button" onClick={() => setShowOldPass(!showOldPass)} className="absolute right-3 top-3 text-slate-400 hover:text-slate-650">
                    {showOldPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5 relative">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-450">New Password *</label>
                <div className="relative">
                  <input
                    required
                    type={showNewPass ? "text" : "password"}
                    value={securityForm.newPassword}
                    onChange={(e) => setSecurityForm(f => ({ ...f, newPassword: e.target.value }))}
                    className="flex h-11 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 pl-3 pr-10 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    placeholder="Create secure password"
                  />
                  <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-3 top-3 text-slate-400 hover:text-slate-650">
                    {showNewPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-450">Confirm New Password *</label>
                <input
                  required
                  type="password"
                  value={securityForm.confirmPassword}
                  onChange={(e) => setSecurityForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  className="flex h-11 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  placeholder="Re-enter new password"
                />
              </div>
            </div>

            <Button type="submit" disabled={securitySaving} className="bg-purple-650 hover:bg-purple-700 text-white rounded-xl h-11 font-black px-6 shadow-md shadow-purple-100 dark:shadow-none transition-all duration-200">
              {securitySaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating...</> : "Update Password"}
            </Button>
          </form>
        )}

        {/* TAB 4: Notification Settings */}
        {activeTab === "notification" && (
          <form onSubmit={handleNotificationSubmit} className="space-y-6 max-w-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Bell className="h-5 w-5 text-purple-600" /> Notifications &amp; Alerts
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Control live notifications, system dispatches and synthesize sound settings.</p>
              </div>
              <Button type="submit" disabled={notifSaving} className="bg-purple-650 hover:bg-purple-700 text-white rounded-xl h-10 font-bold px-4 shadow-sm text-xs self-start">
                {notifSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />} Save Notification Config
              </Button>
            </div>

            {notifLoading ? (
              <div className="space-y-4 py-8 animate-pulse">
                <div className="h-14 bg-slate-50 dark:bg-slate-850 border border-slate-200 rounded-xl" />
                <div className="h-32 bg-slate-50 dark:bg-slate-850 border border-slate-200 rounded-xl" />
              </div>
            ) : (
              <div className="space-y-5">
                
                {/* Section A: Global Master Notification Pause/Resume */}
                <div className="p-5 border border-purple-100 dark:border-purple-900/40 rounded-2xl bg-purple-50/20 dark:bg-purple-950/5 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-sm text-slate-900 dark:text-white">Email Dispatch Service</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Allow or suspend transaction reports and analytics email notifications dynamically.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotificationConfig(c => ({ ...c, emailEnabled: !c.emailEnabled }))}
                      className={cn(
                        "relative inline-flex h-6.5 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                        notificationConfig.emailEnabled ? "bg-purple-600" : "bg-slate-350 dark:bg-slate-700"
                      )}
                    >
                      <span className={cn(
                        "pointer-events-none inline-block h-5.5 w-5.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                        notificationConfig.emailEnabled ? "translate-x-5.5" : "translate-x-0"
                      )} />
                    </button>
                  </div>

                  {notificationConfig.emailEnabled && (
                    <div className="border-t border-purple-100/50 dark:border-purple-900/20 pt-4 space-y-3.5 animate-fadeIn">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-slate-650 dark:text-slate-300">Pause Specific Email Alerts</p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-550 mt-0.5">Suspend dispatch services temporarily. Services resume automatically post expiry.</p>
                        </div>
                        {isPaused ? (
                          <button
                            type="button"
                            onClick={() => setNotificationConfig(c => ({ ...c, pausedUntil: null }))}
                            className="px-3 py-1 bg-red-50 dark:bg-red-950/20 border border-red-250 dark:border-red-900 text-red-650 dark:text-red-400 font-bold rounded-lg text-xs hover:bg-red-100 transition-all"
                          >
                            Resume Services Now
                          </button>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            <button type="button" onClick={() => handlePausePreset(1)} className="px-2.5 py-1 border border-slate-200 dark:border-slate-800 text-[10px] font-bold rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">1 Day</button>
                            <button type="button" onClick={() => handlePausePreset(3)} className="px-2.5 py-1 border border-slate-200 dark:border-slate-800 text-[10px] font-bold rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">3 Days</button>
                            <button type="button" onClick={() => handlePausePreset(7)} className="px-2.5 py-1 border border-slate-200 dark:border-slate-800 text-[10px] font-bold rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">7 Days</button>
                            <button type="button" onClick={() => handlePausePreset("indefinite")} className="px-2.5 py-1 border border-slate-200 dark:border-slate-800 text-[10px] font-bold rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">Indefinitely</button>
                            <button type="button" onClick={() => setShowDatePicker(!showDatePicker)} className="px-2 py-1 border border-slate-200 dark:border-slate-800 text-[10px] font-bold rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 flex items-center gap-1">
                              <Calendar className="h-3 w-3" /> Custom
                            </button>
                          </div>
                        )}
                      </div>

                      {showDatePicker && !isPaused && (
                        <div className="flex items-center gap-2 animate-fadeIn max-w-xs mt-2">
                          <input
                            type="date"
                            min={new Date().toISOString().split("T")[0]}
                            value={notificationConfig.pausedUntil ? new Date(notificationConfig.pausedUntil).toISOString().split("T")[0] : ""}
                            onChange={(e) => setNotificationConfig(c => ({ ...c, pausedUntil: e.target.value ? new Date(e.target.value) : null }))}
                            className="flex h-9 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      )}

                      {isPaused && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-xs">
                          <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
                          <span>Suspended: All email services are paused until <strong>{new Date(notificationConfig.pausedUntil).toLocaleString()}</strong></span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Section B: Specific Alert Types */}
                <div className="space-y-3.5">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Configure Dispatched Topics</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { key: "paymentAlert", label: "Farmer Payment finalizations", desc: "Notification on ledger clearance or payouts." },
                      { key: "farmerUpdate", label: "Farmer Profile Alterations", desc: "Alerts when new farmers are configured." },
                      { key: "subscriptionAlert", label: "Subscription Renewals", desc: "Keep track of active billing and expirations." },
                      { key: "ticketReply", label: "Customer Support Desk replies", desc: "Immediate responses from the technical desk." },
                      { key: "systemAlert", label: "Hardware &amp; System Alerts", desc: "Announcements regarding server metrics." },
                    ].map((item) => (
                      <div key={item.key} className="flex items-start justify-between gap-4 p-4 border border-slate-200 dark:border-slate-850 rounded-2xl bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-slate-850 dark:text-slate-200">{item.label}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{item.desc}</p>
                        </div>
                        <button
                          type="button"
                          disabled={!notificationConfig.emailEnabled}
                          onClick={() => setNotificationConfig(c => ({ ...c, [item.key]: !c[item.key] }))}
                          className={cn(
                            "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed",
                            notificationConfig[item.key] && notificationConfig.emailEnabled ? "bg-purple-600" : "bg-slate-200 dark:bg-slate-800"
                          )}
                        >
                          <span className={cn(
                            "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                            notificationConfig[item.key] && notificationConfig.emailEnabled ? "translate-x-4" : "translate-x-0"
                          )} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section C: Sound Notification (Moved from Rate Configs Settings tab) */}
                <div className="border-t border-slate-200 dark:border-slate-800 pt-5 space-y-4">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Volume2 className="h-4.5 w-4.5 text-purple-600" /> Audio &amp; Synthesizer Settings
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Control browser-side audio bells playing on incoming live ticket replies.</p>
                  </div>
                  
                  <div className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-xs text-slate-900 dark:text-white">Synthesize Live Activity Sound</p>
                      <p className="text-[10px] text-slate-450 mt-1">
                        Generates a sleek triple-tone sine-wave synthesized chime instantaneously inside your browser when replies arrive.
                      </p>
                    </div>
                    <div className="flex items-center gap-3 self-start sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={toggleSoundChime}
                        className={cn(
                          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                          !soundDisabled ? "bg-purple-600" : "bg-slate-300 dark:bg-slate-700"
                        )}
                      >
                        <span className={cn(
                          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                          !soundDisabled ? "translate-x-5" : "translate-x-0"
                        )} />
                      </button>

                      <button
                        type="button"
                        onClick={playTestChime}
                        className="px-3 h-8 text-[11px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-200 rounded-xl transition-all"
                      >
                        Test Chime
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </form>
        )}

      </div>

    </div>
  );
}
