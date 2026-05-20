"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Tag, DollarSign, LogOut, Loader2, ArrowLeftRight,
  Settings, Menu, X, PanelLeftClose, PanelLeftOpen, Shield,
  Megaphone, TicketIcon,
} from "lucide-react";
import Brand from "@/components/ui/Brand";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { socket } from "@/lib/socket";
import { toast } from "@/lib/toast";
import { AlertDot } from "@/components/ui/AlertBanner";

const navItems = [
  { name: "Overview",          href: "/master/dashboard",                 icon: LayoutDashboard },
  { name: "Pricing Plans",     href: "/master/dashboard/pricing",         icon: Tag },
  { name: "Promo Codes",       href: "/master/dashboard/promos",          icon: DollarSign },
  { name: "Advertisements",    href: "/master/dashboard/advertisements",  icon: Megaphone },
  { name: "Support Desk",      href: "/master/dashboard/tickets",         icon: TicketIcon },
  { name: "Settings",          href: "/master/dashboard/settings",        icon: Settings },
];

export default function MasterDashboardLayout({ children }) {
  const pathname  = usePathname();
  const router    = useRouter();

  const [loading,          setLoading]          = useState(true);
  const [master,           setMaster]           = useState(null);
  const [isCollapsed,      setIsCollapsed]      = useState(false);
  const [isMobileOpen,     setIsMobileOpen]     = useState(false);
  const [ticketUnread,     setTicketUnread]     = useState(0);

  // ── Auth check ────────────────────────────────────────────────────────────
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("master_token");
        if (!token) throw new Error("No token");
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        const res = await api.get("/master/me");
        setMaster(res.data.data?.master || res.data.master);
      } catch {
        toast.error("Master session expired");
        router.push("/master/login");
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  // ── Master Ticket Stats (Live) ──────────────────────────────────────────
  useEffect(() => {
    if (!master?._id) return;

    const fetchStats = async () => {
      try {
        const res = await api.get("/tickets/master/stats");
        setTicketUnread(res.data?.data?.unread || 0);
      } catch { setTicketUnread(0); }
    };
    fetchStats();

    const onUpdate = () => fetchStats();
    
    if (!socket.connected) socket.connect();
    socket.emit("join_master_room", master._id);
    socket.on("ticket_created", onUpdate);
    socket.on("ticket_reply", onUpdate);
    
    return () => {
      socket.off("ticket_created", onUpdate);
      socket.off("ticket_reply", onUpdate);
    };
  }, [master]);

  // ── Inactivity logout (30 min) ────────────────────────────────────────────
  const handleLogout = useCallback(() => {
    localStorage.removeItem("master_token");
    delete api.defaults.headers.common["Authorization"];
    router.push("/master/login");
  }, [router]);

  useEffect(() => {
    let timeout;
    const reset = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        handleLogout();
        toast.error("Session expired due to inactivity");
      }, 30 * 60 * 1000);
    };
    window.addEventListener("mousemove", reset);
    window.addEventListener("keypress", reset);
    reset();
    return () => {
      window.removeEventListener("mousemove", reset);
      window.removeEventListener("keypress", reset);
      clearTimeout(timeout);
    };
  }, [handleLogout]);

  // ── Close mobile menu on route change ────────────────────────────────────
  useEffect(() => { setIsMobileOpen(false); }, [pathname]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-10 w-10 animate-spin text-purple-500 mb-4" />
        <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">
          Initializing Master Control...
        </p>
      </div>
    );
  }

  // ── Shared nav link renderer ──────────────────────────────────────────────
  const NavLink = ({ item, mobile = false }) => {
    const active = pathname === item.href;
    return (
      <Link
        href={item.href}
        title={isCollapsed && !mobile ? item.name : ""}
        className={cn(
          "flex items-center rounded-xl text-sm font-semibold transition-all duration-200",
          mobile
            ? "px-3 py-3 text-base"
            : cn("px-3 py-2.5", isCollapsed && "justify-center px-2"),
          active
            ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 shadow-sm"
            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        )}
      >
        <item.icon
          className={cn(
            "h-5 w-5 shrink-0",
            active ? "text-purple-600 dark:text-purple-400" : "text-slate-400 dark:text-slate-500",
            !isCollapsed && !mobile && "mr-3",
            mobile && "mr-3"
          )}
        />
        {(!isCollapsed || mobile) && (
           <span className="flex-1 flex items-center justify-between">
             {item.name}
             {item.name === "Support Desk" && ticketUnread > 0 && (
               <AlertDot count={ticketUnread} />
             )}
           </span>
        )}
        {(isCollapsed && !mobile) && item.name === "Support Desk" && ticketUnread > 0 && (
           <AlertDot count={ticketUnread} />
        )}
      </Link>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">

      {/* ── DESKTOP SIDEBAR ─────────────────────────────────────────────── */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-slate-200 dark:border-slate-800",
          "bg-white dark:bg-slate-900 transition-all duration-300",
          isCollapsed ? "w-14" : "w-52"
        )}
      >
        {/* Logo + collapse toggle */}
        <div
          className={cn(
            "relative flex h-16 items-center border-b border-slate-200 dark:border-slate-800",
            isCollapsed ? "justify-center px-2" : "justify-between px-4"
          )}
        >
          <Link href="/master/dashboard" className="transition-transform hover:scale-95 active:scale-90">
            <Brand compact={isCollapsed} />
          </Link>
          {!isCollapsed && (
            <span className="ml-1 text-[10px] font-black text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-1.5 py-0.5 rounded tracking-wider uppercase">
              MASTER
            </span>
          )}
          {!isCollapsed && (
            <button
              onClick={() => setIsCollapsed(true)}
              className="ml-auto rounded-md p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          )}
          {isCollapsed && (
            <button
              onClick={() => setIsCollapsed(false)}
              className="absolute top-4 right-1 rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Nav links */}
        <nav className={cn("flex-1 overflow-y-auto py-4 space-y-1", isCollapsed ? "px-2" : "px-3")}>
          {navItems.map((item) => <NavLink key={item.name} item={item} />)}

          {/* Divider + back to admin */}
          <div className={cn("pt-3 mt-3 border-t border-slate-200 dark:border-slate-800")}>
            <Link
              href="/dashboard"
              title={isCollapsed ? "Admin Dashboard" : ""}
              className={cn(
                "flex items-center rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 dark:text-slate-400",
                "hover:bg-slate-100 dark:hover:bg-slate-800 transition-all",
                isCollapsed && "justify-center px-2"
              )}
            >
              <ArrowLeftRight className={cn("h-5 w-5 shrink-0 text-slate-400", !isCollapsed && "mr-3")} />
              {!isCollapsed && "Admin Dashboard"}
            </Link>
          </div>
        </nav>

        {/* User card + theme + logout */}
        <div className="border-t border-slate-200 dark:border-slate-800 p-3 space-y-2">
          {/* User info */}
          {!isCollapsed && (
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-700 dark:text-purple-300 font-black text-sm shrink-0">
                <Shield className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                  {master?.username || "Master Admin"}
                </p>
                <p className="text-xs text-slate-400 truncate">Super Admin</p>
              </div>
            </div>
          )}

          <div className={cn("flex items-center", isCollapsed ? "justify-center" : "justify-between px-1")}>
            {!isCollapsed && (
              <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">Theme</span>
            )}
            <ThemeToggle />
          </div>

          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center rounded-xl text-sm font-bold text-red-600 dark:text-red-400",
              "bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors",
              isCollapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5 gap-2"
            )}
            title={isCollapsed ? "Logout" : ""}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!isCollapsed && "Logout"}
          </button>
        </div>
      </aside>

      {/* ── CONTENT AREA ────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Mobile header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 md:hidden">
          <Link href="/master/dashboard" className="transition-transform hover:scale-95">
            <Brand />
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded tracking-wider uppercase">
              MASTER
            </span>
            <ThemeToggle />
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </header>

        {/* Mobile menu overlay */}
        {isMobileOpen && (
          <div className="absolute inset-0 z-50 mt-16 bg-white dark:bg-slate-900 md:hidden overflow-y-auto">
            <nav className="p-4 space-y-1">
              {navItems.map((item) => <NavLink key={item.name} item={item} mobile />)}
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 space-y-1">
                <Link
                  href="/dashboard"
                  className="flex items-center rounded-xl px-3 py-3 text-base font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <ArrowLeftRight className="mr-3 h-5 w-5 text-slate-400" />
                  Admin Dashboard
                </Link>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center rounded-xl px-3 py-3 text-base font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  Logout
                </button>
              </div>
            </nav>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
          <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
