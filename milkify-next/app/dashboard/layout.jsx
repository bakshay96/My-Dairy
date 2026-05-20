"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Droplet, Calculator, Settings, Menu, X, LogOut, FileText, PanelLeftClose, PanelLeftOpen, Loader2, ShieldCheck, Shield, UserCircle, User, KeyRound, Save, ChevronDown, Eye, EyeOff, TicketIcon } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import Brand from "@/components/ui/Brand";
import ThemeToggle from "@/components/ui/ThemeToggle";
import SessionTimer from "@/components/ui/SessionTimer";
import AlertBanner, { useLiveAlertCount, useLiveTicketCount, AlertDot } from "@/components/ui/AlertBanner";
import { useEffect } from "react";
import api from "@/lib/api";
import { toast } from "@/lib/toast";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Farmers", href: "/dashboard/farmers", icon: Users },
  { name: "Add Milk", href: "/dashboard/add-milk", icon: Droplet },
  { name: "Billing", href: "/dashboard/billing", icon: FileText },
  { name: "Analytics", href: "/dashboard/analytics", icon: Calculator },
  { name: "Subscription", href: "/dashboard/subscription", icon: ShieldCheck },
  { name: "Support", href: "/dashboard/support", icon: TicketIcon },
  { name: "Rate Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [hasMasterToken, setHasMasterToken] = useState(false);
  const pathname = usePathname();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);
  const alertCount = useLiveAlertCount();  // live ad count for sidebar badge
  const ticketCount = useLiveTicketCount(); // live ticket count for support badge
  const isAddMilk = pathname === "/dashboard/add-milk"; // suppress alerts on add-milk

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    mobile: "",
    email: "",
    shopName: "",
    village: "",
  });
  const [profileSaving, setProfileSaving] = useState(false);

  const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "" });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || "",
        mobile: user.mobile || "",
        email: user.email || "",
        shopName: user.shopName || "",
        village: user.village || "",
      });
    }
  }, [user]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      setProfileSaving(true);
      const res = await api.put("/admin/profile", profileForm);
      const updatedAdmin = res.data?.admin || res.data?.data?.admin;
      const token = useAuthStore.getState().token;
      if (updatedAdmin) setAuth(updatedAdmin, token);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Profile update failed");
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!passwordForm.oldPassword || !passwordForm.newPassword) {
      return toast.error("Both old and new passwords are required");
    }
    if (passwordForm.newPassword.length < 4) {
      return toast.error("New password must be at least 4 characters");
    }
    try {
      setPasswordSaving(true);
      await api.put("/admin/change-password", passwordForm);
      toast.success("Password changed successfully");
      setPasswordForm({ oldPassword: "", newPassword: "" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Password change failed");
    } finally {
      setPasswordSaving(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHasMasterToken(!!localStorage.getItem("master_token"));
    }
  }, []);

  const handleLogout = async () => {
    try {
      await api.get("/admin/logout");
    } catch {
      // ignore network errors during logout
    } finally {
      logout();
      window.location.href = "/login";
    }
  };

  useEffect(() => {
    // Mark as hydrated once Zustand persistence loads
    setIsHydrated(true);

    const checkSession = async () => {
      // Only call /api/admin/me if we already have a user in the store.
      // Without this guard, every fresh browser visit fires an unauthenticated
      // request that always returns 401 and floods the logs unnecessarily.
      const storedUser = useAuthStore.getState().user;
      if (!storedUser) {
        // No prior session — redirect straight to login, no network call needed.
        window.location.href = "/login";
        return;
      }
      try {
        const me = await api.get("/admin/me");
        if (me.data?.admin) {
          setAuth(me.data.admin, null, me.data.sessionExpiresAt || null);
        } else {
          throw new Error("No admin data");
        }
      } catch (err) {
        const status = err?.response?.status;
        // Only force logout when server explicitly says session is invalid.
        if (status === 401) {
          logout();
          window.location.href = "/login";
          return;
        }
        // For transient/network/proxy issues, avoid hard redirect loop.
        console.warn("Session refresh failed (non-401). Keeping local state.");
      }
    };

    checkSession();
  }, [logout, setAuth]);

  if (!isHydrated) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-slate-500 font-medium animate-pulse">Loading workspace...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-transparent">
      {/* Sidebar (Desktop) */}
      <aside className={cn("hidden border-r border-white/50 bg-white/85 dark:bg-slate-900/90 dark:border-slate-800/80 backdrop-blur-md flex-col md:flex transition-all duration-300", isCollapsed ? "w-14" : "w-56")}>
        <div className={cn("relative flex h-16 items-center border-b border-white/70 dark:border-slate-800/80", isCollapsed ? "justify-center px-2" : "justify-between px-4")}>
          <Link href="/dashboard" className="transition-transform hover:scale-95 active:scale-90">
            <Brand compact={isCollapsed} />
          </Link>
          {!isCollapsed && (
            <button
              onClick={() => setIsCollapsed(true)}
              className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          )}
          {isCollapsed && (
            <button
              onClick={() => setIsCollapsed(false)}
              className="absolute top-4 right-2 rounded-md p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800"
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <nav className={cn("space-y-1", isCollapsed ? "px-2" : "px-4")}>
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  pathname === item.href
                    ? "bg-primary/12 text-primary shadow-sm"
                    : "text-gray-700 dark:text-gray-200 hover:bg-slate-100/80 dark:hover:bg-slate-800",
                  isCollapsed && "justify-center px-2"
                )}
                title={isCollapsed ? item.name : ""}
              >
                <item.icon className={cn("h-5 w-5 shrink-0", pathname === item.href ? "text-primary" : "text-gray-400", !isCollapsed && "mr-3")} />
                {!isCollapsed && (
                  <span className="flex-1 flex items-center justify-between">
                    {item.name}
                    {item.name === "Subscription" && alertCount > 0 && (
                      <AlertDot count={alertCount} />
                    )}
                    {item.name === "Support" && ticketCount > 0 && (
                      <AlertDot count={ticketCount} />
                    )}
                  </span>
                )}
                {isCollapsed && item.name === "Subscription" && alertCount > 0 && (
                  <AlertDot count={alertCount} />
                )}
                {isCollapsed && item.name === "Support" && ticketCount > 0 && (
                  <AlertDot count={ticketCount} />
                )}
              </Link>
            ))}
          </nav>
        </div>
        
        {hasMasterToken && (
          <div className={cn("p-4 border-t border-slate-200 dark:border-slate-800", isCollapsed ? "px-2" : "px-4")}>
            <Link
              href="/master/dashboard"
              className={cn(
                "flex items-center justify-center rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition-all shadow-md shadow-purple-500/20",
                isCollapsed ? "h-10 w-10" : "px-4 py-2.5 text-sm font-bold w-full"
              )}
              title="Master Panel"
            >
              <Shield className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
              {!isCollapsed && "Master Panel"}
            </Link>
          </div>
        )}

        <div className="border-t dark:border-slate-800 p-4 relative">
          {/* Dropdown Menu (renders above card) */}
          {isUserMenuOpen && !isCollapsed && (
            <div className="absolute bottom-full left-4 right-4 mb-2 z-50 rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-950 p-2 shadow-xl ring-1 ring-black/5 animate-slide-up">
              <button
                onClick={() => {
                  setIsAccountModalOpen(true);
                  setIsUserMenuOpen(false);
                }}
                className="flex w-full items-center rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors"
              >
                <UserCircle className="h-4.5 w-4.5 mr-2 text-primary" />
                Account Settings
              </button>
              <div className="my-1 border-t border-gray-100 dark:border-slate-800/80" />
              <button
                onClick={handleLogout}
                className="flex w-full items-center rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
              >
                <LogOut className="h-4.5 w-4.5 mr-2" />
                Logout
              </button>
            </div>
          )}

          {/* User profile card (trigger) */}
          <button
            onClick={() => {
              if (isCollapsed) {
                setIsCollapsed(false);
              } else {
                setIsUserMenuOpen((s) => !s);
              }
            }}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl p-2 text-left transition-all hover:bg-slate-100/80 dark:hover:bg-slate-800",
              isUserMenuOpen && "bg-slate-100/80 dark:hover:bg-slate-800"
            )}
          >
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black shadow-sm">
              {user?.name?.[0]?.toUpperCase() || "A"}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold truncate text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-gray-400" />
                    {user?.name || "Admin"}
                  </p>
                  <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform", isUserMenuOpen && "rotate-180")} />
                </div>
                <p className="text-xs text-gray-500 font-medium truncate mt-0.5">{user?.mobile || ""}</p>
              </div>
            )}
          </button>

          {isCollapsed && (
            <div className="mt-2 flex justify-center">
              <button
                onClick={() => setIsCollapsed(false)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 border dark:border-slate-800"
                title="Expand sidebar"
              >
                <PanelLeftOpen className="h-5 w-5" />
              </button>
            </div>
          )}

          <div className="mt-3 flex justify-between items-center px-1">
            {!isCollapsed && <span className="text-[10px] text-gray-400 font-bold tracking-wider uppercase">Theme</span>}
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Mobile Navbar & Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/70 bg-white/85 dark:bg-slate-900/90 dark:border-slate-800 backdrop-blur-md px-4 md:hidden">
          <Link href="/dashboard" className="transition-transform hover:scale-95 active:scale-90">
            <Brand />
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAccountModalOpen(true)}
              className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
              title="Account Configuration"
            >
              {user?.name?.[0]?.toUpperCase() || "A"}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="rounded-md p-2 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </header>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="absolute inset-0 z-50 mt-16 bg-white dark:bg-slate-900 md:hidden">
            <nav className="space-y-1 p-4">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center rounded-lg px-3 py-3 text-base font-medium",
                    pathname === item.href
                      ? "bg-primary/10 text-primary"
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800"
                  )}
                >
                  <item.icon className={cn("mr-3 h-6 w-6", pathname === item.href ? "text-primary" : "text-gray-400")} />
                  {item.name}
                </Link>
              ))}
              {hasMasterToken && (
                <Link
                  href="/master/dashboard"
                  className="flex items-center rounded-lg px-3 py-3 text-base font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20"
                >
                  <Shield className="mr-3 h-6 w-6" />
                  Master Panel
                </Link>
              )}
              <div className="pt-4 mt-4 border-t border-gray-100 dark:border-slate-800 flex flex-col gap-2">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsAccountModalOpen(true);
                  }}
                  className="flex items-center rounded-lg px-3 py-3 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800"
                >
                  <UserCircle className="mr-3 h-6 w-6 text-primary" />
                  Account Configuration
                </button>
                <div className="flex items-center justify-between px-3 py-2">
                  <ThemeToggle />
                  <button
                    onClick={handleLogout}
                    className="flex items-center rounded-lg py-2 text-base font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <LogOut className="mr-3 h-6 w-6" />
                    Logout
                  </button>
                </div>
              </div>
            </nav>
          </div>
        )}

        {/* Main Content scrollable area */}
        <main className="flex-1 overflow-y-auto bg-transparent p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl mb-3 flex justify-end">
            <SessionTimer />
          </div>
          <div className="mx-auto max-w-6xl">
            {/* Alert Banner — hidden on add-milk page to avoid distraction */}
            <AlertBanner suppress={isAddMilk} />
            <div className="animate-fade-in">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* ── Account Configuration Modal ────────────────────────────────────── */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          {/* Modal backdrop closer */}
          <div className="absolute inset-0" onClick={() => setIsAccountModalOpen(false)} />
          
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-950 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] z-10 animate-scale-up">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <UserCircle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Account Configuration</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Manage your personal admin profile and security credentials.</p>
                </div>
              </div>
              <button
                onClick={() => setIsAccountModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content Tab forms */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:divide-x divide-slate-100 dark:divide-slate-800">
                
                {/* Left Side: Profile Form */}
                <form onSubmit={handleProfileSave} className="space-y-4 pr-0 md:pr-4">
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-primary" /> Admin Profile Info
                  </h4>
                  <div className="space-y-3">
                    {[
                      { key: "name", label: "Name", type: "text" },
                      { key: "mobile", label: "Mobile Number", type: "tel" },
                      { key: "email", label: "Email Address", type: "email" },
                      { key: "shopName", label: "Shop Name", type: "text" },
                      { key: "village", label: "Village", type: "text" },
                    ].map(({ key, label, type }) => (
                      <div key={key} className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</label>
                        <input
                          type={type}
                          required
                          value={profileForm[key] || ""}
                          onChange={(e) => setProfileForm((p) => ({ ...p, [key]: e.target.value }))}
                          className="w-full h-10 border dark:border-slate-800 dark:bg-slate-900 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="w-full h-10 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                      {profileSaving ? (
                        <><Loader2 className="h-4 w-4 animate-spin" />Saving...</>
                      ) : (
                        <><Save className="h-4 w-4" />Save Changes</>
                      )}
                    </button>
                  </div>
                </form>

                {/* Right Side: Change Password Form */}
                <form onSubmit={handlePasswordChange} className="space-y-4 pt-6 md:pt-0 md:pl-8">
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 mb-2">
                    <KeyRound className="h-4 w-4 text-primary" /> Security Credentials
                  </h4>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Old Password</label>
                      <div className="relative">
                        <input
                          type={showOldPassword ? "text" : "password"}
                          placeholder="••••••••"
                          required
                          value={passwordForm.oldPassword}
                          onChange={(e) => setPasswordForm((p) => ({ ...p, oldPassword: e.target.value }))}
                          className="w-full h-10 border dark:border-slate-800 dark:bg-slate-900 rounded-xl pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        <button
                          type="button"
                          onClick={() => setShowOldPassword((s) => !s)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          title={showOldPassword ? "Hide password" : "Show password"}
                        >
                          {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">New Password</label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          placeholder="Minimum 4 characters"
                          required
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                          className="w-full h-10 border dark:border-slate-800 dark:bg-slate-900 rounded-xl pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword((s) => !s)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          title={showNewPassword ? "Hide password" : "Show password"}
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={passwordSaving}
                      className="w-full h-10 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                      {passwordSaving ? (
                        <><Loader2 className="h-4 w-4 animate-spin" />Updating...</>
                      ) : (
                        <><KeyRound className="h-4 w-4" />Update Password</>
                      )}
                    </button>
                  </div>
                </form>

              </div>
            </div>
            
            {/* Footer */}
            <div className="px-6 py-4 border-t dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
              <button
                onClick={() => setIsAccountModalOpen(false)}
                className="px-4 py-2 border dark:border-slate-800 rounded-xl font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
