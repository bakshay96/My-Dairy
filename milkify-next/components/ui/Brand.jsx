"use client";

import { Milk } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Brand({ compact = false, className = "" }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-emerald-400/25 text-primary ring-1 ring-primary/20">
        <Milk className="h-5 w-5" />
      </span>
      {!compact && <span className="text-xl font-extrabold tracking-tight">Milkify</span>}
    </span>
  );
}
