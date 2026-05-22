"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import Image from "next/image";
import brandLogo from "@/public/images/milkify-logo.png";
import { 
  TrendingUp, Users, ShieldCheck, Activity, 
  Globe, Database, Sliders, Cpu 
} from "lucide-react";

const ADMIN_HIGHLIGHTS = [
  {
    icon: <Activity className="h-5 w-5 text-blue-500" />,
    title: "Real-time Milk Collection",
    desc: "Seamlessly log fat, SNF, and weight parameters instantly.",
  },
  {
    icon: <Users className="h-5 w-5 text-emerald-500" />,
    title: "Farmer Management",
    desc: "Maintain complete profile records, daily milk logs, and secure bank details.",
  },
  {
    icon: <ShieldCheck className="h-5 w-5 text-indigo-500" />,
    title: "High-Precision Billing",
    desc: "Highly precise floating-point calculations for absolute financial transparency.",
  },
  {
    icon: <TrendingUp className="h-5 w-5 text-purple-500" />,
    title: "Analytical Dashboards",
    desc: "Deep analytical graphs showing milk yields, payout distributions, and rates.",
  },
];

const MASTER_HIGHLIGHTS = [
  {
    icon: <Globe className="h-5 w-5 text-purple-500" />,
    title: "Multi-Tenant SaaS Control",
    desc: "Instantly provision, monitor, and configure isolated tenant environments for dairies.",
  },
  {
    icon: <Database className="h-5 w-5 text-indigo-500" />,
    title: "Global DB Orchestration",
    desc: "Perform automated snapshots, database migrations, and tenant schema scaling.",
  },
  {
    icon: <Sliders className="h-5 w-5 text-fuchsia-500" />,
    title: "Advanced System Control",
    desc: "Manage global feature flags, system parameters, and active API rate limits dynamically.",
  },
  {
    icon: <Cpu className="h-5 w-5 text-pink-500" />,
    title: "Enterprise Support & Health",
    desc: "Centralized system audit logs, critical diagnostic logs, and immediate escalations.",
  },
];

export default function AuthArt({ type = "admin" }) {
  const [activeHighlight, setActiveHighlight] = useState(0);
  const isMaster = type === "master";
  const highlights = isMaster ? MASTER_HIGHLIGHTS : ADMIN_HIGHLIGHTS;

  // Cycle highlights every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveHighlight((prev) => (prev + 1) % highlights.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [highlights.length]);

  return (
    <div className={`hidden lg:flex flex-col w-full h-full min-h-[580px] justify-between items-center rounded-3xl border border-slate-200/40 dark:border-slate-800/40 p-10 overflow-hidden relative shadow-inner transition-all duration-500 ${
      isMaster 
        ? "bg-gradient-to-br from-purple-500/5 via-fuchsia-500/5 to-indigo-500/5 dark:from-slate-950 dark:via-slate-900/90 dark:to-slate-950" 
        : "bg-gradient-to-br from-blue-500/5 via-sky-500/5 to-emerald-500/5 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"
    }`}>
      {/* Background Glowing Ambient Orbs */}
      <motion.div
        animate={{
          x: [0, 40, -20, 0],
          y: [0, -30, 40, 0],
          scale: [1, 1.2, 0.9, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={`absolute top-10 left-10 w-72 h-72 rounded-full blur-3xl -z-10 transition-colors duration-500 ${
          isMaster 
            ? "bg-purple-400/10 dark:bg-purple-600/10" 
            : "bg-blue-400/10 dark:bg-blue-600/10"
        }`}
      />
      <motion.div
        animate={{
          x: [0, -40, 30, 0],
          y: [0, 50, -30, 0],
          scale: [1, 0.8, 1.1, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={`absolute bottom-10 right-10 w-80 h-80 rounded-full blur-3xl -z-10 transition-colors duration-500 ${
          isMaster 
            ? "bg-fuchsia-400/10 dark:bg-fuchsia-600/10" 
            : "bg-emerald-400/10 dark:bg-emerald-600/10"
        }`}
      />

      {/* Decorative Grid Overlay */}
      <div className={`absolute inset-0 [background-size:24px_24px] opacity-30 dark:opacity-10 pointer-events-none transition-all ${
        isMaster 
          ? "bg-[radial-gradient(#d8b4fe_1px,transparent_1px)]" 
          : "bg-[radial-gradient(#e2e8f0_1px,transparent_1px)]"
      }`} />

      {/* Top Header - Animated Brand Showcase */}
      <div className="w-full flex flex-col items-center text-center mt-6 z-10">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative inline-block"
        >
          {/* Logo Pulsing Backlight */}
          <div className={`absolute inset-0 rounded-3xl opacity-20 blur-xl animate-pulse transition-all duration-500 ${
            isMaster 
              ? "bg-gradient-to-tr from-purple-500 to-fuchsia-400" 
              : "bg-gradient-to-tr from-blue-500 to-emerald-400"
          }`} />

          {/* Interactive Floating Card holding Logo */}
          <motion.div
            whileHover={{ y: -6, rotateY: 10, rotateX: 10 }}
            style={{ transformStyle: "preserve-3d" }}
            className="relative h-20 w-20 flex items-center justify-center rounded-3xl overflow-hidden shadow-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-white/40 dark:border-slate-800/50 cursor-pointer"
          >
            <Image
              src={brandLogo}
              alt="Milkify Logo"
              width={64}
              height={64}
              className="object-contain p-2 animate-float"
              priority
              unoptimized
            />
          </motion.div>
        </motion.div>

        {/* Brand Name Text Animation */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className={`text-4xl font-extrabold tracking-tight mt-5 bg-clip-text text-transparent transition-all duration-500 ${
            isMaster 
              ? "bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 dark:from-purple-400 dark:via-fuchsia-400 dark:to-indigo-400" 
              : "bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 dark:from-blue-400 dark:via-indigo-400 dark:to-emerald-400"
          }`}
        >
          {isMaster ? "Milkify Master" : "Milkify"}
        </motion.h1>

        <motion.p
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mt-2 font-medium tracking-wide"
        >
          {isMaster 
            ? "Enterprise Orchestration & Multi-Tenant Infrastructure Control Center."
            : "The Next-Generation SaaS Platform for Smart Agricultural Milk Collection & Dairy Operations."}
        </motion.p>
      </div>

      {/* Middle Interactive Presentation Panel */}
      <div className="w-full max-w-md my-8 z-10">
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-slate-800/40 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3">
            <span className="flex h-2 w-2 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isMaster ? "bg-purple-400" : "bg-emerald-400"}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isMaster ? "bg-purple-500" : "bg-emerald-500"}`}></span>
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeHighlight}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="flex items-start gap-4"
            >
              <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-100 dark:border-slate-700/50">
                {highlights[activeHighlight].icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                  {highlights[activeHighlight].title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {highlights[activeHighlight].desc}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Carousel Indicators */}
        <div className="flex justify-center gap-2 mt-4">
          {highlights.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveHighlight(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                activeHighlight === idx 
                  ? `w-6 ${isMaster ? "bg-purple-600 dark:bg-purple-400" : "bg-blue-600 dark:bg-blue-400"}` 
                  : "w-1.5 bg-slate-300 dark:bg-slate-700"
              }`}
              aria-label={`Show slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Bottom Footer Details */}
      <div className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-400 dark:text-slate-500 border-t border-slate-200/30 dark:border-slate-800/30 pt-6 mt-2 z-10">
        {isMaster ? (
          <>
            <span>⚡ Real-Time SaaS Command</span>
            <span>🔐 Enterprise Class Isolation</span>
          </>
        ) : (
          <>
            <span>💡 Mobile & Desktop Ready</span>
            <span>🔒 Secure Cloud Architecture</span>
          </>
        )}
      </div>
    </div>
  );
}
