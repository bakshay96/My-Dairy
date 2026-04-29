"use client";

import Image from "next/image";
import logo from "@/public/images/milkify-logo.png";

export default function MilkifyLoader({ text = "Loading" }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-white/60 dark:bg-slate-950/60 backdrop-blur-sm fixed inset-0 z-[100]">
      <div className="flex flex-col items-center gap-6">

        {/* Animated Logo with Ripple */}
        <div className="relative flex items-center justify-center">
          {/* Ripple rings */}
          <span className="absolute inline-flex h-24 w-24 rounded-full bg-primary/10 animate-ping" style={{ animationDuration: "1.6s" }} />
          <span className="absolute inline-flex h-20 w-20 rounded-full bg-primary/15 animate-ping" style={{ animationDuration: "2.1s", animationDelay: "0.3s" }} />

          {/* Logo container */}
          <div className="relative h-20 w-20 rounded-2xl bg-white dark:bg-slate-900 border border-primary/20 shadow-2xl flex items-center justify-center">
            <Image
              src={logo}
              alt="Milkify"
              width={52}
              height={52}
              className="object-contain drop-shadow-sm"
              unoptimized
              priority
            />
          </div>
        </div>

        {/* Animated Milk Drop */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-end gap-1 h-5">
            {[0, 0.15, 0.3].map((delay, i) => (
              <span
                key={i}
                className="w-1.5 rounded-full bg-primary"
                style={{
                  height: "100%",
                  animation: `milkDrop 1s ease-in-out ${delay}s infinite`,
                }}
              />
            ))}
          </div>

          <span className="text-xs font-bold tracking-[0.3em] text-primary/70 uppercase">
            {text}
          </span>
        </div>
      </div>

      {/* Inline keyframes */}
      <style>{`
        @keyframes milkDrop {
          0%, 100% { transform: scaleY(0.4); opacity: 0.4; }
          50%       { transform: scaleY(1);   opacity: 1;   }
        }
      `}</style>
    </div>
  );
}
