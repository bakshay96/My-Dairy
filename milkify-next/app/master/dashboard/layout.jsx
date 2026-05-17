"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Tag, DollarSign, LogOut, Loader2, ArrowRight } from "lucide-react";
import Brand from "@/components/ui/Brand";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { toast } from "@/lib/toast";

const navItems = [
  { name: "Overview", href: "/master/dashboard", icon: LayoutDashboard },
  { name: "Pricing Plans", href: "/master/dashboard/pricing", icon: DollarSign },
  { name: "Promo Codes", href: "/master/dashboard/promos", icon: Tag },
];

export default function MasterDashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [master, setMaster] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("master_token");
        if (!token) throw new Error("No token");
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        const res = await api.get("/master/me");
        setMaster(res.data.master);
      } catch {
        toast.error("Master session expired");
        router.push("/master/login");
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("master_token");
    delete api.defaults.headers.common["Authorization"];
    router.push("/master/login");
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950">
        <Loader2 className="h-10 w-10 animate-spin text-purple-500 mb-4" />
        <p className="text-slate-400 font-medium animate-pulse">Initializing Master Control...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800">
          <Brand />
          <span className="ml-2 text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded">MASTER</span>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center rounded-xl px-4 py-3 text-sm font-bold transition-all",
                pathname === item.href
                  ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.name}
            </Link>
          ))}

          <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
            <Link
              href="/login"
              className="flex items-center rounded-xl px-4 py-3 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <ArrowRight className="h-5 w-5 mr-3" />
              User Dashboard
            </Link>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4 px-2">
            <div>
              <p className="text-sm font-bold">{master?.username}</p>
              <p className="text-xs text-slate-500">Super Admin</p>
            </div>
            <ThemeToggle />
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 transition-colors"
          >
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8 lg:p-10 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
