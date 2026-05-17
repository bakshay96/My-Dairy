"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Droplet, Calculator, Settings, Menu, X, LogOut, FileText, PanelLeftClose, PanelLeftOpen, Loader2, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import Brand from "@/components/ui/Brand";
import ThemeToggle from "@/components/ui/ThemeToggle";
import SessionTimer from "@/components/ui/SessionTimer";
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
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const pathname = usePathname();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);

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
    // Wait for Zustand persistence to hydrate
    setIsHydrated(true);

    const checkSession = async () => {
      try {
        const me = await api.get("/admin/me");
        if (me.data?.admin) {
          setAuth(me.data.admin, null, me.data.sessionExpiresAt || null);
        } else {
          throw new Error("No admin data");
        }
      } catch (err) {
        console.error("Session check failed:", err);
        const status = err?.response?.status;
        // Only force logout when server explicitly says session is invalid.
        if (status === 401) {
          logout();
          window.location.href = "/login";
          return;
        }
        // For transient/network/proxy issues, avoid hard redirect loop.
        toast.error("Session check failed. Please refresh once.");
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
      <aside className={cn("hidden border-r border-white/50 bg-white/85 dark:bg-slate-900/90 dark:border-slate-800/80 backdrop-blur-md flex-col md:flex transition-all duration-300", isCollapsed ? "w-20" : "w-64")}>
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
                <item.icon className={cn("h-5 w-5", pathname === item.href ? "text-primary" : "text-gray-400", !isCollapsed && "mr-3")} />
                {!isCollapsed && item.name}
              </Link>
            ))}
          </nav>
        </div>
        <div className="border-t dark:border-slate-800 p-4">
          <div className={cn("flex items-center gap-3 mb-4", isCollapsed ? "justify-center px-0" : "px-2")}>
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {user?.name?.[0]?.toUpperCase() || "A"}
            </div>
            {!isCollapsed && <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.name || "Admin"}</p>
              <p className="text-xs text-gray-500 truncate">{user?.mobile || ""}</p>
            </div>}
          </div>
          <div className={cn("mb-3", isCollapsed ? "flex justify-center" : "")}>
            <ThemeToggle />
          </div>
          {isCollapsed ? (
            <button
              onClick={() => setIsCollapsed(false)}
              className="w-full flex items-center justify-center rounded-lg px-2 py-2 text-sm font-medium border"
              title="Expand sidebar"
            >
              <PanelLeftOpen className="h-5 w-5" />
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen((s) => !s)}
                className="flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-slate-800"
              >
                <span className="mr-3">Account</span>
              </button>
              {isUserMenuOpen && (
                <div className="absolute bottom-11 left-0 w-full rounded-md border bg-white dark:bg-slate-900 shadow-md">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <LogOut className="h-5 w-5 mr-2" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Navbar & Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/70 bg-white/85 dark:bg-slate-900/90 dark:border-slate-800 backdrop-blur-md px-4 md:hidden">
          <Link href="/dashboard" className="transition-transform hover:scale-95 active:scale-90">
            <Brand />
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-md p-2 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
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
              <div className="pt-4 mt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                <ThemeToggle />
                <button
                  onClick={handleLogout}
                  className="flex items-center rounded-lg px-3 py-3 text-base font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <LogOut className="mr-3 h-6 w-6" />
                  Logout
                </button>
              </div>
            </nav>
          </div>
        )}

        {/* Main Content scrollable area */}
        <main className="flex-1 overflow-y-auto bg-transparent p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl mb-3 flex justify-end">
            <SessionTimer />
          </div>
          <div className="mx-auto max-w-6xl animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
