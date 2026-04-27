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
    <button
      onClick={() => {
        const idx = order.indexOf(theme);
        const next = order[(idx + 1) % order.length];
        handleThemeChange(next);
      }}
      className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-xs hover:bg-muted transition-colors"
      aria-label="Toggle theme mode"
      title={`Theme: ${active.label}`}
    >
      <ActiveIcon className="h-3.5 w-3.5" />
      <span>{active.label}</span>
    </button>
  );
}
