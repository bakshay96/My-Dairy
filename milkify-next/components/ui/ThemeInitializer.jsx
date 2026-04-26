"use client";

import { useEffect } from "react";

export default function ThemeInitializer() {
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") || "system";
    const isSystemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldUseDark = storedTheme === "dark" || (storedTheme === "system" && isSystemDark);
    document.documentElement.classList.toggle("dark", shouldUseDark);
  }, []);

  return null;
}
