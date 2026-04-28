import React from "react";
import { Milk } from "lucide-react";

export default function MilkifyLoader({ text = "Milkify" }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-white/40 dark:bg-slate-950/40 backdrop-blur-md fixed inset-0 z-[100] transition-all duration-500">
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          {/* Animated rings */}
          <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
          <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
          
          {/* Central Logo Container */}
          <div className="relative h-20 w-20 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-2xl border border-primary/20 rotate-3 animate-[pulse_2s_ease-in-out_infinite]">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent opacity-50"></div>
            <Milk className="h-10 w-10 text-primary" />
          </div>
        </div>
        
        {/* Sleek Text Label */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-sm font-bold tracking-[0.3em] text-primary/80 uppercase ml-1">
            {text}
          </span>
          <div className="h-0.5 w-8 bg-gradient-to-r from-transparent via-primary/40 to-transparent rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
