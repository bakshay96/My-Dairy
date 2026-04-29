import Image from "next/image";
import { cn } from "@/lib/utils";

export default function Brand({ compact = false, className = "" }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden ring-1 ring-primary/10">
        <Image 
          src="/images/milkify-logo.png" 
          alt="Milkify Logo" 
          width={36} 
          height={36} 
          className="object-contain"
        />
      </span>
      {!compact && <span className="text-xl font-black tracking-tighter text-gray-900 dark:text-white">Milkify</span>}
    </span>
  );
}
