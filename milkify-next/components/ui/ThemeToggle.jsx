"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

const THEMES = ["light", "dark", "system"];
const ICONS  = { light: Sun, dark: Moon, system: Monitor };

export default function ThemeToggle({ compact = false }) {
  const [theme, setTheme] = useState("system");

  useEffect(() => {
    const stored = localStorage.getItem("theme") || "system";
    setTheme(stored);
    applyTheme(stored);
  }, []);

  const applyTheme = (t) => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", t === "dark" || (t === "system" && prefersDark));
  };

  const cycle = () => {
    const next = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
    setTheme(next);
    localStorage.setItem("theme", next);
    applyTheme(next);
  };

  const Icon  = ICONS[theme] || Monitor;
  const label = { light: "Light", dark: "Dark", system: "System" }[theme];

  return (
    <button
      onClick={cycle}
      aria-label={`Switch theme (current: ${label})`}
      title={label}
      className={cn(
        "flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700",
        "bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm",
        "text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary",
        "hover:bg-white dark:hover:bg-slate-800 hover:border-primary/30",
        "transition-all active:scale-90",
        compact ? "h-8 w-8" : "h-9 w-9"
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
