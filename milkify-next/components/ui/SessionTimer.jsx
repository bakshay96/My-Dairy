"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store";
import { toast } from "@/lib/toast";
import api from "@/lib/api";

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
        api
          .get("/admin/logout")
          .catch(() => {})
          .finally(() => {
            logout();
            window.location.href = "/login";
          });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [sessionExpiresAt, logout]);

  const mins = String(Math.floor(remaining / 60000)).padStart(2, "0");
  const secs = String(Math.floor((remaining % 60000) / 1000)).padStart(2, "0");

  return (
    <div className="text-xs px-3 py-1 rounded-full border bg-background">
      Session Timeout: {mins}:{secs}
    </div>
  );
}
