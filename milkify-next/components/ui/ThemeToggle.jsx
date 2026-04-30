"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, Laptop } from "lucide-react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState("system");
  const order = ["light", "dark", "system"];

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    const initialTheme = storedTheme || "system";
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  const applyTheme = (nextTheme) => {
    const isSystemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = nextTheme === "dark" || (nextTheme === "system" && isSystemDark);
    document.documentElement.classList.toggle("dark", isDark);
  };

  const handleThemeChange = (nextTheme) => {
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    applyTheme(nextTheme);
  };

  const active = theme === "light" ? { icon: Sun, label: "Light" } : theme === "dark" ? { icon: Moon, label: "Dark" } : { icon: Laptop, label: "System" };
  const ActiveIcon = active.icon;

  return (
    <div className="flex items-center">
      <button
        onClick={() => {
          const idx = order.indexOf(theme);
          const next = order[(idx + 1) % order.length];
          handleThemeChange(next);
        }}
        className="group relative flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm px-4 py-2 text-xs font-bold transition-all hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg hover:shadow-primary/5 active:scale-95"
        aria-label="Toggle theme mode"
      >
        <div className="flex items-center justify-center h-6 w-6 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
          <ActiveIcon className="h-4 w-4" />
        </div>
        <div className="flex flex-col items-start leading-tight">
          <span className="text-[10px] text-slate-400 uppercase tracking-tighter"></span>
          <span className="text-slate-900 dark:text-white uppercase tracking-wider">{active.label}</span>
        </div>
      </button>
    </div>
  );
}
