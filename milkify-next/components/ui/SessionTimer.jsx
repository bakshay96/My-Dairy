"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store";
import { toast } from "sonner";

const SESSION_MS = 30 * 60 * 1000;

export default function SessionTimer() {
  const sessionStartedAt = useAuthStore((s) => s.sessionStartedAt);
  const logout = useAuthStore((s) => s.logout);
  const [remaining, setRemaining] = useState(SESSION_MS);

  useEffect(() => {
    if (!sessionStartedAt) return;
    const timer = setInterval(() => {
      const elapsed = Date.now() - sessionStartedAt;
      const left = Math.max(SESSION_MS - elapsed, 0);
      setRemaining(left);
      if (left === 0) {
        clearInterval(timer);
        toast.error("Session expired. Please login again.");
        logout();
        window.location.href = "/login";
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [sessionStartedAt, logout]);

  const mins = String(Math.floor(remaining / 60000)).padStart(2, "0");
  const secs = String(Math.floor((remaining % 60000) / 1000)).padStart(2, "0");

  return (
    <div className="text-xs px-3 py-1 rounded-full border bg-background">
      Session: {mins}:{secs}
    </div>
  );
}
