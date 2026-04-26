"use client";

import { Milk } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Brand({ compact = false, className = "" }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
        <Milk className="h-5 w-5" />
      </span>
      {!compact && <span className="text-xl font-bold tracking-tight">Milkify</span>}
    </span>
  );
}
