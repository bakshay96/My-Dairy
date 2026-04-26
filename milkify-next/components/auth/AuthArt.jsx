"use client";

export default function AuthArt() {
  return (
    <div className="hidden lg:flex w-full items-center justify-center rounded-2xl border bg-gradient-to-br from-blue-50 via-sky-50 to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6">
      <svg viewBox="0 0 640 420" className="w-full max-w-xl">
        <rect x="40" y="120" width="560" height="240" rx="20" fill="#e2f2ff" />
        <rect x="70" y="150" width="180" height="170" rx="12" fill="#bfdbfe" />
        <rect x="280" y="170" width="280" height="25" rx="8" fill="#93c5fd" />
        <rect x="280" y="210" width="220" height="20" rx="8" fill="#c7d2fe" />
        <rect x="280" y="245" width="260" height="20" rx="8" fill="#bfdbfe" />
        <circle cx="160" cy="210" r="45" fill="#60a5fa" />
        <rect x="120" y="260" width="80" height="55" rx="10" fill="#3b82f6" />
        <path d="M360 90c34 0 62 28 62 62h-20c0-23-19-42-42-42s-42 19-42 42h-20c0-34 28-62 62-62z" fill="#22c55e" />
        <circle cx="355" cy="145" r="9" fill="#16a34a" />
        <circle cx="392" cy="145" r="9" fill="#16a34a" />
      </svg>
    </div>
  );
}
