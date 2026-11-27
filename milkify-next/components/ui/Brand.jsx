import Image from "next/image";
import brandLogo from "@/public/images/milkify-logo.png";
import { cn } from "@/lib/utils";

export default function Brand({ compact = false, className = "", textClassName = "" }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden shadow-sm bg-white border border-slate-200/80 dark:border-white/20 shrink-0">
        <Image 
          src={brandLogo} 
          alt="Milkify Logo" 
          width={34}
          height={34}
          className="object-contain p-0.5"
          priority
          unoptimized
        />
      </span>
      {!compact && (
        <span className={cn("text-xl font-black tracking-tight", textClassName || "text-slate-900 dark:text-white")}>
          Milkify
        </span>
      )}
    </span>
  );
}
