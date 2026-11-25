"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store";
import { toast } from "@/lib/toast";
import api from "@/lib/api";
import { Clock } from "lucide-react";

const SESSION_MS = 30 * 60 * 1000;

export default function SessionTimer() {
  const sessionExpiresAt = useAuthStore((s) => s.sessionExpiresAt);
  const logout = useAuthStore((s) => s.logout);
  const [remaining, setRemaining] = useState(SESSION_MS);

  useEffect(() => {
    if (!sessionExpiresAt) return;
    const timer = setInterval(() => {
      const left = Math.max(sessionExpiresAt - Date.now(), 0);
      setRemaining(left);
      if (left === 0) {
        clearInterval(timer);
        toast.error("Session expired. Please login again.");
        let currentPath = "/dashboard";
        if (typeof window !== "undefined") {
          currentPath = window.location.pathname + (window.location.search || "");
          try {
            localStorage.setItem("milkify_last_admin_route", currentPath);
          } catch {}
        }
        api
          .get("/admin/logout")
          .catch(() => {})
          .finally(() => {
            logout();
            window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
          });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [sessionExpiresAt, logout]);

  const mins = String(Math.floor(remaining / 60000)).padStart(2, "0");
  const secs = String(Math.floor((remaining % 60000) / 1000)).padStart(2, "0");

  return (
    <div
      className="text-[11px] sm:text-xs px-2.5 sm:px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 flex items-center gap-1.5 shadow-xs font-semibold"
      title="Active login session remaining time"
    >
      <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0 animate-pulse" />
      <span className="hidden sm:inline">Session:</span>
      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{mins}:{secs}</span>
    </div>
  );
}
