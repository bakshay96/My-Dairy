"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/lib/store";
import Brand from "@/components/ui/Brand";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Droplet,
  Calculator,
  Calendar,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Users,
  Bell,
  Cpu,
  ArrowRight,
  CheckCircle2,
  Lock,
  Layers,
  ChevronRight,
  Database,
  BarChart3,
  FileText,
  Smartphone,
  Printer,
  Zap,
  Check,
  Sun,
  Moon,
  Receipt,
  BadgeCheck,
  SlidersHorizontal,
  Workflow,
  Globe2,
  Activity,
  Laptop,
  CheckCircle,
  Copy,
  Radio,
  ExternalLink,
  Coins
} from "lucide-react";

export default function LandingPage() {
  const user = useAuthStore((state) => state.user);
  const [mounted, setMounted] = useState(false);

  // ── Scroll Hide / Show Navbar State ──────────────────────────────────────
  const [navVisible, setNavVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    setMounted(true);

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Track if page has scrolled away from the very top
      setIsScrolled(currentScrollY > 20);

      // Hide navbar when scrolling down past 80px; show when scrolling up or at top
      if (currentScrollY > 80 && currentScrollY > lastScrollY) {
        setNavVisible(false);
      } else {
        setNavVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // ── Interactive Milk Calculator Sandbox State ─────────────────────────────
  const [milkType, setMilkType] = useState("cow"); // "cow" | "buffalo"
  const [liters, setLiters] = useState(25);
  const [fat, setFat] = useState(4.2);
  const [snf, setSnf] = useState(8.5);

  // Dynamic calculations based on live rate matrix formula
  const baseRate = milkType === "cow" ? 32.0 : 45.0;
  const fatFactor = milkType === "cow" ? 1.5 : 1.8;
  const snfFactor = milkType === "cow" ? 0.8 : 1.1;
  const ratePerLiter = Math.round((baseRate + (fat - 3.5) * fatFactor + (snf - 8.5) * snfFactor) * 100) / 100;
  const totalPayout = Math.round(liters * ratePerLiter * 100) / 100;

  // ── Feature Updates Tab State ─────────────────────────────────────────────
  const [activeUpdateTab, setActiveUpdateTab] = useState("v24"); // "v24" | "collection" | "billing" | "master"

  // ── Role-Based Workspace Interactive State ────────────────────────────────
  const [selectedRole, setSelectedRole] = useState("admin"); // "admin" | "master"
  const [simulatedShift, setSimulatedShift] = useState("morning"); // "morning" | "evening"
  const [slipPrinted, setSlipPrinted] = useState(false);
  const [broadcastSent, setBroadcastSent] = useState(false);

  const handlePrintSlip = () => {
    setSlipPrinted(true);
    setTimeout(() => setSlipPrinted(false), 3000);
  };

  const handleBroadcast = () => {
    setBroadcastSent(true);
    setTimeout(() => setBroadcastSent(false), 3500);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-blue-500 selection:text-white transition-colors duration-300 overflow-x-hidden font-sans">
      
      {/* ── Auto-Hiding Sticky Navigation Bar ──────────────────────────────── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
          navVisible ? "translate-y-0" : "-translate-y-full"
        } ${
          isScrolled
            ? "backdrop-blur-xl bg-white/90 dark:bg-slate-950/90 shadow-md border-b border-slate-200/80 dark:border-slate-800/80"
            : "bg-white/70 dark:bg-slate-950/70 backdrop-blur-md border-b border-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Brand className="scale-105" />
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <a href="#features" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Features
            </a>
            <a href="#roles" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5">
              <Laptop className="h-4 w-4 text-indigo-500" />
              Workspaces
            </a>
            <a href="#calculator" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5">
              <Calculator className="h-4 w-4 text-emerald-500" />
              Rate Sandbox
            </a>
            <a href="#updates" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-500" />
              What's New
            </a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <Link href="/dashboard">
                <Button className="h-10 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-md shadow-blue-500/20">
                  Open Dashboard <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" className="h-10 px-4 rounded-xl font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
                    Dairy Sign In
                  </Button>
                </Link>
                <Link href="/master/login">
                  <Button className="h-10 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold shadow-md shadow-purple-500/20 text-xs">
                    <Lock className="h-3.5 w-3.5 mr-1.5" /> Master Control
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero Section (with Dairy Motifs & Animation) ─────────────────────── */}
      <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 overflow-hidden">
        {/* Decorative Dairy Waves & Glowing Halos */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[720px] h-[380px] bg-gradient-to-tr from-sky-400/20 via-blue-500/15 to-emerald-400/15 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          
          {/* Animated Dairy Badge */}
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/80 text-blue-700 dark:text-blue-300 text-xs font-bold tracking-wide uppercase mb-6 shadow-sm"
          >
            <Droplet className="h-4 w-4 text-blue-500 fill-blue-500 animate-bounce" />
            Rural & Enterprise Dairy Management SaaS
          </motion.div>

          {/* Hero Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight"
          >
            Precision Milk Collection,{" "}
            <span className="bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 bg-clip-text text-transparent">
              Smart Rates & 10-Day Billing
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mt-6 leading-relaxed font-medium"
          >
            Replace manual paperwork with real-time digital milk intake. Instant Fat/SNF calculations, thermal receipt printing in Marathi & English, and automated cycle payment disbursements.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8"
          >
            <Link href="/login" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto h-12 px-7 rounded-xl bg-gradient-to-r from-blue-600 via-sky-600 to-blue-700 hover:from-blue-700 hover:to-sky-700 text-white text-base font-extrabold shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2">
                Launch Dairy Admin <ChevronRight className="h-5 w-5" />
              </Button>
            </Link>
            <a href="#roles" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto h-12 px-6 rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-extrabold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-2">
                <Laptop className="h-5 w-5 text-indigo-500" /> Explore Interactive Workspaces
              </Button>
            </a>
          </motion.div>

          {/* ── Live Shift & Collection Status Bar ────────────────────────────── */}
          <div className="mt-12 max-w-5xl mx-auto">
            <div className="relative rounded-3xl p-3 sm:p-5 bg-gradient-to-b from-white/90 to-slate-100/70 dark:from-slate-900/90 dark:to-slate-950/70 border border-slate-200/80 dark:border-slate-800 shadow-2xl backdrop-blur-md">
              
              {/* Shift Banner */}
              <div className="flex flex-wrap items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <span>Active Collection Session: <strong className="text-slate-900 dark:text-white">Morning Shift (सकाळ सत्र)</strong></span>
                </div>
                <div className="flex items-center gap-4 mt-2 sm:mt-0">
                  <span className="flex items-center gap-1.5"><Sun className="h-3.5 w-3.5 text-amber-500" /> 06:00 AM – 09:30 AM</span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="flex items-center gap-1.5"><Moon className="h-3.5 w-3.5 text-indigo-400" /> 05:30 PM – 08:30 PM</span>
                </div>
              </div>

              {/* Quick Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-left">
                  <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Today's Intake</span>
                    <Droplet className="h-5 w-5 fill-blue-500/20" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">1,480.50 L</div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-1">↑ 8.4% Morning Peak</div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-left">
                  <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Active Farmers</span>
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">124 Registered</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-1">100% Passbook Sync</div>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 text-left">
                  <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Quality Standard</span>
                    <Calculator className="h-5 w-5" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">4.2 FAT / 8.6 SNF</div>
                  <div className="text-xs text-purple-600 dark:text-purple-400 font-bold mt-1">Grade A Premium Yield</div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 text-left">
                  <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Cycle Payout</span>
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">Cycle 1 (1–10th)</div>
                  <div className="text-xs text-amber-600 dark:text-amber-400 font-bold mt-1">Automated Settlement</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Enhanced Role-Based Interactive Workspaces (Realistic & Mobile-Friendly) ─ */}
      <section id="roles" className="py-20 lg:py-28 bg-white dark:bg-slate-900/90 border-t border-b border-slate-200/80 dark:border-slate-800/80 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100/70 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider mb-3">
              <Laptop className="h-3.5 w-3.5" /> Interactive UI/UX Showcase
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Two Tailored Workspaces. One Unified Platform.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-4 leading-relaxed font-medium">
              Experience the dual-tier architecture in action. Toggle between the village dairy collection desk and the enterprise superadmin command center.
            </p>

            {/* Role Switcher Tabs (Mobile-Friendly Pill) */}
            <div className="inline-flex p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 mt-8 shadow-inner w-full sm:w-auto">
              <button
                onClick={() => setSelectedRole("admin")}
                className={`flex-1 sm:flex-initial px-5 py-3 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2.5 transition-all duration-300 relative ${
                  selectedRole === "admin"
                    ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-md scale-[1.02]"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Dairy Admin Workspace</span>
                {selectedRole === "admin" && (
                  <span className="hidden sm:inline-block h-2 w-2 rounded-full bg-blue-500 animate-pulse ml-1" />
                )}
              </button>

              <button
                onClick={() => setSelectedRole("master")}
                className={`flex-1 sm:flex-initial px-5 py-3 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2.5 transition-all duration-300 relative ${
                  selectedRole === "master"
                    ? "bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-md scale-[1.02]"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Master Superadmin Control</span>
                {selectedRole === "master" && (
                  <span className="hidden sm:inline-block h-2 w-2 rounded-full bg-purple-500 animate-pulse ml-1" />
                )}
              </button>
            </div>
          </div>

          {/* Interactive Realistic Workspace Canvas */}
          <div className="max-w-6xl mx-auto">
            <AnimatePresence mode="wait">
              {selectedRole === "admin" ? (
                <motion.div
                  key="admin-workspace"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="rounded-3xl border border-blue-200/80 dark:border-blue-900/40 bg-gradient-to-b from-blue-50/30 to-white dark:from-slate-900 dark:to-slate-950 p-4 sm:p-8 shadow-2xl overflow-hidden relative"
                >
                  {/* Decorative Glow */}
                  <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

                  {/* Top Window Bar (Realistic App Chrome) */}
                  <div className="flex flex-wrap items-center justify-between pb-4 mb-6 border-b border-slate-200 dark:border-slate-800 gap-3">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-400" />
                        <div className="w-3 h-3 rounded-full bg-amber-400" />
                        <div className="w-3 h-3 rounded-full bg-emerald-400" />
                      </div>
                      <span className="ml-2 text-xs font-mono font-bold text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-1.5">
                        <Lock className="h-3 w-3 text-emerald-500" /> milkify.app/dashboard (Dairy Admin: Anand Milk Society)
                      </span>
                    </div>

                    {/* Shift Toggle in Mockup */}
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <span className="text-slate-400 text-[11px] hidden sm:inline">Active Shift:</span>
                      <button
                        onClick={() => setSimulatedShift("morning")}
                        className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
                          simulatedShift === "morning"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 ring-1 ring-amber-400"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        <Sun className="h-3 w-3" /> Morning
                      </button>
                      <button
                        onClick={() => setSimulatedShift("evening")}
                        className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
                          simulatedShift === "evening"
                            ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 ring-1 ring-indigo-400"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        <Moon className="h-3 w-3" /> Evening
                      </button>
                    </div>
                  </div>

                  {/* Main Realistic Workspace Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    
                    {/* Left: Role Explanation & Direct Launch */}
                    <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 text-xs font-extrabold mb-3">
                          <Users className="h-3.5 w-3.5" /> For Dairy Owners & Booth Agents
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
                          Dairy Operator Workspace
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
                          Engineered for rugged, high-speed rural milk collection. Enter daily liters and lactometer fat readings in under 4 seconds per farmer, print instant receipts, and automate 10-day payment reconciliations.
                        </p>

                        <ul className="space-y-3 mt-6 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                          <li className="flex items-start gap-2.5">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span><strong>Fast Intake Form:</strong> Supports Cow & Buffalo with instant Fat/SNF calculations.</span>
                          </li>
                          <li className="flex items-start gap-2.5">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span><strong>Thermal Print Engine:</strong> Standard 58mm/80mm slips with Marathi & English headers.</span>
                          </li>
                          <li className="flex items-start gap-2.5">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span><strong>Automated 10-Day Billing:</strong> 1-click PDF statements and cycle payout sheets.</span>
                          </li>
                          <li className="flex items-start gap-2.5">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span><strong>Farmer Passbooks:</strong> Member IDs (<code className="text-blue-600 font-bold">MI-FAR</code>) and debit/credit ledger tracking.</span>
                          </li>
                        </ul>
                      </div>

                      <div className="pt-4">
                        <Link href="/login" className="block">
                          <Button className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2">
                            Launch Dairy Admin Portal <ArrowRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* Right: Realistic Simulated Live Action Window */}
                    <div className="lg:col-span-7 bg-white dark:bg-slate-900/95 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xl flex flex-col justify-between space-y-5">
                      
                      {/* Top Header Simulation */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-slate-400 uppercase">Live Intake Simulation</div>
                          <div className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                            <span>Farmer: Ramesh Patil</span>
                            <span className="text-xs px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-mono font-bold">MI-FAR-0042</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-200/60 dark:border-emerald-800/60">
                            <Radio className="h-3 w-3 animate-ping" /> Real-Time Sync
                          </span>
                        </div>
                      </div>

                      {/* Mock Form Matrix */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-700/70 text-center">
                        <div className="p-2">
                          <span className="text-[11px] font-bold text-slate-500 block">Variety</span>
                          <span className="text-sm font-black text-slate-900 dark:text-white">COW (गाय)</span>
                        </div>
                        <div className="p-2 border-l border-slate-200 dark:border-slate-700">
                          <span className="text-[11px] font-bold text-slate-500 block">Quantity</span>
                          <span className="text-sm font-black text-blue-600 dark:text-blue-400">24.50 L</span>
                        </div>
                        <div className="p-2 border-l border-slate-200 dark:border-slate-700">
                          <span className="text-[11px] font-bold text-slate-500 block">FAT / SNF</span>
                          <span className="text-sm font-black text-purple-600 dark:text-purple-400">4.2 / 8.6</span>
                        </div>
                        <div className="p-2 border-l border-slate-200 dark:border-slate-700">
                          <span className="text-[11px] font-bold text-slate-500 block">Total Due</span>
                          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">₹940.80</span>
                        </div>
                      </div>

                      {/* Interactive Print Slip Action */}
                      <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3 text-left">
                          <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <Printer className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-white">Instant Thermal Slip Dispatch</div>
                            <div className="text-[11px] text-slate-500">Ready for Bluetooth / USB 58mm or 80mm printers</div>
                          </div>
                        </div>

                        <Button
                          onClick={handlePrintSlip}
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto h-9 px-4 rounded-lg font-bold border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 flex items-center justify-center gap-1.5"
                        >
                          {slipPrinted ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-emerald-500" /> Slip Printed!
                            </>
                          ) : (
                            <>
                              <Printer className="h-4 w-4" /> Simulate Print Slip
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Animated Thermal Slip Preview popup when simulated */}
                      {slipPrinted && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-mono text-emerald-800 dark:text-emerald-300 flex items-center justify-between"
                        >
                          <span>🧾 Receipt #MKF-84920 dispatched to Thermal Printer buffer (Devanagari Font Loaded)</span>
                          <span className="font-bold">STATUS: OK</span>
                        </motion.div>
                      )}

                      {/* Quick Shift Summary Bar */}
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 font-medium">
                        <span>Today's Total: <strong>1,480.50 L</strong> (58 Farmers)</span>
                        <Link href="/login" className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1">
                          View Live Register <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>

                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="master-workspace"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="rounded-3xl border border-purple-200/80 dark:border-purple-900/40 bg-gradient-to-b from-purple-50/30 to-white dark:from-slate-900 dark:to-slate-950 p-4 sm:p-8 shadow-2xl overflow-hidden relative"
                >
                  {/* Decorative Glow */}
                  <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

                  {/* Top Window Bar (Realistic App Chrome) */}
                  <div className="flex flex-wrap items-center justify-between pb-4 mb-6 border-b border-slate-200 dark:border-slate-800 gap-3">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-400" />
                        <div className="w-3 h-3 rounded-full bg-amber-400" />
                        <div className="w-3 h-3 rounded-full bg-emerald-400" />
                      </div>
                      <span className="ml-2 text-xs font-mono font-bold text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-1.5">
                        <ShieldCheck className="h-3 w-3 text-purple-500" /> milkify.app/master/dashboard (Superadmin Console)
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold">
                      <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-mono text-[11px] border border-purple-200 dark:border-purple-800">
                        CLUSTER: ap-south-1 (AWS Mumbai)
                      </span>
                    </div>
                  </div>

                  {/* Main Realistic Workspace Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    
                    {/* Left: Role Explanation & Direct Launch */}
                    <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 text-xs font-extrabold mb-3 font-mono">
                          <ShieldCheck className="h-3.5 w-3.5" /> PLATFORM ORCHESTRATOR
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
                          Master Superadmin Control
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
                          Enterprise infrastructure console commanding all registered milk societies. Control SaaS subscription tiers, issue discount coupons, broadcast urgent alerts, inspect database schemas, and monitor GeoIP visitor telemetry.
                        </p>

                        <ul className="space-y-3 mt-6 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                          <li className="flex items-start gap-2.5">
                            <CheckCircle2 className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                            <span><strong>Global Tenant Directory:</strong> Audit all dairy centers and farmers across India.</span>
                          </li>
                          <li className="flex items-start gap-2.5">
                            <CheckCircle2 className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                            <span><strong>GeoIP Visitor Telemetry:</strong> Real-time city, country, device & IP audit trails.</span>
                          </li>
                          <li className="flex items-start gap-2.5">
                            <CheckCircle2 className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                            <span><strong>SaaS Monetization Engine:</strong> Dynamic Razorpay subscription tiers & promo codes.</span>
                          </li>
                          <li className="flex items-start gap-2.5">
                            <CheckCircle2 className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                            <span><strong>MindMapFlow Architecture:</strong> Interactive full-stack visualizer & Mongoose schema inspector.</span>
                          </li>
                        </ul>
                      </div>

                      <div className="pt-4">
                        <Link href="/master/login" className="block">
                          <Button className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2">
                            Enter Master Command Center <ArrowRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* Right: Realistic Simulated Superadmin Window */}
                    <div className="lg:col-span-7 bg-white dark:bg-slate-900/95 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xl flex flex-col justify-between space-y-5">
                      
                      {/* Top Header Simulation */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-slate-400 uppercase">Multi-Tenant Telemetry</div>
                          <div className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                            <span>Platform Health: 100% Operational</span>
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
                            48 Active Dairies
                          </span>
                        </div>
                      </div>

                      {/* Mock Superadmin Metrics Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700/70 text-left">
                          <span className="text-[11px] font-bold text-slate-400 uppercase block">Daily Platform Milk</span>
                          <span className="text-xl font-black text-slate-900 dark:text-white">64,280 L</span>
                          <span className="text-[10px] text-emerald-500 font-bold block mt-0.5">Across 48 Centers</span>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700/70 text-left">
                          <span className="text-[11px] font-bold text-slate-400 uppercase block">Monthly Recurring (MRR)</span>
                          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">₹1,42,000</span>
                          <span className="text-[10px] text-blue-500 font-bold block mt-0.5">Razorpay Subscriptions</span>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700/70 text-left col-span-2 sm:col-span-1">
                          <span className="text-[11px] font-bold text-slate-400 uppercase block">Visitor Telemetry</span>
                          <span className="text-xl font-black text-purple-600 dark:text-purple-400">3,492 Hits</span>
                          <span className="text-[10px] text-slate-400 font-bold block mt-0.5">GeoIP-Lite Real-Time</span>
                        </div>
                      </div>

                      {/* Interactive Broadcast Simulator */}
                      <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3 text-left">
                          <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                            <Bell className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-white">Dispatch Global Announcement</div>
                            <div className="text-[11px] text-slate-500">Push broadcast banner to all 48 dairy operator dashboards</div>
                          </div>
                        </div>

                        <Button
                          onClick={handleBroadcast}
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto h-9 px-4 rounded-lg font-bold border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/50 flex items-center justify-center gap-1.5"
                        >
                          {broadcastSent ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-emerald-500" /> Alert Broadcasted!
                            </>
                          ) : (
                            <>
                              <Zap className="h-4 w-4 text-amber-500" /> Test Broadcast Alert
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Broadcast Live Notification Toast Simulator */}
                      {broadcastSent && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-800 rounded-xl text-xs font-mono text-purple-800 dark:text-purple-300 flex items-center justify-between"
                        >
                          <span>📢 Broadcast: "Scheduled Database Backup at 11:00 PM IST" dispatched to 48 dairy sockets</span>
                          <span className="font-bold">200 OK</span>
                        </motion.div>
                      )}

                      {/* Quick Schema & Audit Bar */}
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 font-medium">
                        <span>Database: <strong>Mongoose 8.0 Decimal128</strong> Isolation</span>
                        <Link href="/master/login" className="text-purple-600 dark:text-purple-400 font-bold hover:underline flex items-center gap-1">
                          Open MindMap Architecture <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>

                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </section>

      {/* ── Interactive Milk Rate Calculator Sandbox ───────────────────────── */}
      <section id="calculator" className="py-20 bg-gradient-to-b from-white to-blue-50/40 dark:from-slate-900/80 dark:to-slate-950 border-t border-b border-slate-200/80 dark:border-slate-800/80 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider mb-3">
              <Calculator className="h-3.5 w-3.5" /> Interactive Sandbox
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
              Try the Milkify Dynamic Rate Engine
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-3 font-medium">
              Adjust milk volume, fat percentage, and SNF to simulate how Milkify computes instant rates and farmer settlement slips.
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            
            {/* Input Controls */}
            <div className="md:col-span-7 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6">
              
              {/* Milk Type Toggle */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Select Milk Variety (दुधाचा प्रकार)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setMilkType("cow")}
                    className={`py-3 px-4 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all ${
                      milkType === "cow"
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25 ring-2 ring-blue-600"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    <span>🐄 Cow Milk (गाय)</span>
                  </button>
                  <button
                    onClick={() => setMilkType("buffalo")}
                    className={`py-3 px-4 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all ${
                      milkType === "buffalo"
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 ring-2 ring-indigo-600"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    <span>🐃 Buffalo Milk (म्हैस)</span>
                  </button>
                </div>
              </div>

              {/* Quantity Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Quantity Delivered (लिटर)
                  </label>
                  <span className="text-base font-black text-blue-600 dark:text-blue-400">
                    {liters} Liters
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  step="1"
                  value={liters}
                  onChange={(e) => setLiters(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[11px] font-bold text-slate-400 mt-1">
                  <span>1 L</span>
                  <span>50 L</span>
                  <span>100 L</span>
                </div>
              </div>

              {/* Fat % Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Fat Percentage (फॅट %)
                  </label>
                  <span className="text-base font-black text-purple-600 dark:text-purple-400">
                    {fat.toFixed(1)}% FAT
                  </span>
                </div>
                <input
                  type="range"
                  min="3.0"
                  max="10.0"
                  step="0.1"
                  value={fat}
                  onChange={(e) => setFat(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
                <div className="flex justify-between text-[11px] font-bold text-slate-400 mt-1">
                  <span>3.0%</span>
                  <span>6.5%</span>
                  <span>10.0%</span>
                </div>
              </div>

              {/* SNF % Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Solids-Not-Fat (SNF %)
                  </label>
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                    {snf.toFixed(1)}% SNF
                  </span>
                </div>
                <input
                  type="range"
                  min="7.5"
                  max="10.0"
                  step="0.1"
                  value={snf}
                  onChange={(e) => setSnf(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <div className="flex justify-between text-[11px] font-bold text-slate-400 mt-1">
                  <span>7.5%</span>
                  <span>8.5% Standard</span>
                  <span>10.0%</span>
                </div>
              </div>
            </div>

            {/* Live Calculation & Sample Receipt Preview */}
            <div className="md:col-span-5 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl shadow-2xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                  <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest">
                    LIVE RATE EVALUATION
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                    Instant Auto-Formula
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Calculated Rate / Liter:</span>
                    <span className="text-2xl font-black text-white">₹{ratePerLiter.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Quantity Logged:</span>
                    <span className="text-sm font-bold text-slate-200">{liters} Liters</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Shift Type:</span>
                    <span className="text-sm font-bold text-amber-300">Morning Session</span>
                  </div>

                  <div className="pt-4 border-t border-slate-800/80">
                    <span className="text-xs uppercase text-slate-400 font-bold block mb-1">Total Farmer Payment</span>
                    <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400">
                      ₹{totalPayout.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                {/* Thermal Slip Sample Box */}
                <div className="mt-6 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 font-mono text-[11px] space-y-1 text-slate-300">
                  <div className="text-center font-bold text-white border-b border-slate-700 pb-1 mb-1">
                    MILKIFY COLLECTION SLIP
                  </div>
                  <div className="flex justify-between"><span>Farmer ID:</span><span className="text-white">MI-FAR-0042</span></div>
                  <div className="flex justify-between"><span>Farmer Name:</span><span className="text-white">RAMESH PATIL</span></div>
                  <div className="flex justify-between"><span>Date/Shift:</span><span className="text-white">TODAY / MORNING</span></div>
                  <div className="flex justify-between"><span>Milk / Qty:</span><span className="text-white">{milkType.toUpperCase()} / {liters} L</span></div>
                  <div className="flex justify-between"><span>Fat / SNF:</span><span className="text-white">{fat.toFixed(1)}% / {snf.toFixed(1)}%</span></div>
                  <div className="flex justify-between font-bold text-emerald-400 pt-1 border-t border-slate-700">
                    <span>Amount:</span><span>₹{totalPayout.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Link href="/login">
                  <Button className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2">
                    <Printer className="h-4 w-4" /> Start Live Dairy Intake
                  </Button>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Dedicated Feature Updates Section (What's New in Milkify) ───────── */}
      <section id="updates" className="py-20 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100/70 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="h-3.5 w-3.5" /> Latest Capabilities & Roadmap
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
              What's New in Milkify Platform
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-3 font-medium">
              Explore the cutting-edge features built to streamline dairy management and scale cooperative societies.
            </p>

            {/* Interactive Category Tabs */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
              {[
                { id: "v24", label: "🚀 v2.4 Latest Release", icon: Zap },
                { id: "collection", label: "🥛 Milk Intake & Slips", icon: Droplet },
                { id: "billing", label: "🧾 Cycle Billing & PDF", icon: Receipt },
                { id: "master", label: "🛡️ Superadmin & Telemetry", icon: ShieldCheck },
              ].map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeUpdateTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveUpdateTab(tab.id)}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                      isActive
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md scale-105"
                        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <IconComponent className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content Display */}
          <div className="max-w-5xl mx-auto">
            <AnimatePresence mode="wait">
              {activeUpdateTab === "v24" && (
                <motion.div
                  key="v24"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 p-6 shadow-md hover:shadow-xl transition-all">
                    <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                      <BadgeCheck className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                      Standardized Member ID Architecture
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                      Unique alphanumeric member identifiers for every user role (<code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-blue-600 font-bold">MI-MST</code>, <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-blue-600 font-bold">MI-DA</code>, <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-blue-600 font-bold">MI-FAR</code>) ensuring strict auditability and error-free multi-tenant record tracing.
                    </p>
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" /> Live across all database collections
                    </div>
                  </Card>

                  <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 p-6 shadow-md hover:shadow-xl transition-all">
                    <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
                      <Workflow className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                      MindMapFlow Architecture Visualizer
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                      Interactive full-stack architecture canvas embedded directly into the Master Control Room. Inspect service nodes, database models, and real-time schema relationships visually.
                    </p>
                    <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400">
                      <CheckCircle2 className="h-4 w-4" /> Embedded in Superadmin portal
                    </div>
                  </Card>

                  <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 p-6 shadow-md hover:shadow-xl transition-all">
                    <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                      <Globe2 className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                      Real-Time GeoIP Telemetry & Drilldown
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                      Monitor platform traffic by country, city, client device, and IP address with interactive sorting, multi-column search filters, and responsive mobile audit cards.
                    </p>
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" /> Powered by GeoIP-Lite
                    </div>
                  </Card>

                  <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 p-6 shadow-md hover:shadow-xl transition-all">
                    <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                      <SlidersHorizontal className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                      Dynamic Rate Matrix Customizer
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                      Granular configuration for Cow and Buffalo milk rates based on Fat and SNF steps, enabling dairies to adapt to changing seasonal government rates seamlessly.
                    </p>
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                      <CheckCircle2 className="h-4 w-4" /> 1-click rate matrix update
                    </div>
                  </Card>
                </motion.div>
              )}

              {activeUpdateTab === "collection" && (
                <motion.div
                  key="collection"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <div className="text-blue-600 font-extrabold text-sm flex items-center gap-1.5">
                        <Droplet className="h-4 w-4" /> Sub-4-Second Intake
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Keyboard-optimized intake form allowing dairy operators to enter Liters, Fat, and Degree in seconds without touching the mouse.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="text-emerald-600 font-extrabold text-sm flex items-center gap-1.5">
                        <Printer className="h-4 w-4" /> Thermal Print Slips
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Direct printing support for standard 58mm and 80mm ESC/POS thermal printers common in Indian rural milk collection booths.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="text-purple-600 font-extrabold text-sm flex items-center gap-1.5">
                        <Receipt className="h-4 w-4" /> Devanagari Bilingual
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Full Marathi (मराठी) and English slip headers so village farmers can clearly verify their fat, rate, and daily earnings.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeUpdateTab === "billing" && (
                <motion.div
                  key="billing"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <div className="text-emerald-600 font-extrabold text-sm flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" /> 10-Day Automated Cycles
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Cycles automatically partitioned (1st to 10th, 11th to 20th, 21st to end-of-month) as practiced by standard Indian dairy cooperatives.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="text-blue-600 font-extrabold text-sm flex items-center gap-1.5">
                        <FileText className="h-4 w-4" /> Instant PDF Statements
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Export complete bill sheets, deduction details, cattle feed loans, and net payable figures with 1-click batch PDF rendering.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="text-amber-600 font-extrabold text-sm flex items-center gap-1.5">
                        <Activity className="h-4 w-4" /> Payout Reconciliation
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Track settlement status (Pending vs Paid) per farmer with full historical ledger audit trails.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeUpdateTab === "master" && (
                <motion.div
                  key="master"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <div className="text-purple-600 font-extrabold text-sm flex items-center gap-1.5">
                        <ShieldCheck className="h-4 w-4" /> SaaS Subscription Engine
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Configure pricing plans, trial periods, and feature access. Seamless Razorpay automated renewals and discount promo codes.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="text-indigo-600 font-extrabold text-sm flex items-center gap-1.5">
                        <Bell className="h-4 w-4" /> Broadcast Announcements
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Dispatch system-wide maintenance banners and policy announcements visible directly on all active dairy admin headers.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="text-rose-600 font-extrabold text-sm flex items-center gap-1.5">
                        <Database className="h-4 w-4" /> Schema & Security Audits
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Interactive Mongoose schema visualizer, centralized ticket resolution desk, and modifiedBy audit signature tracking.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </section>

      {/* ── Key Features Grid ───────────────────────────────────────── */}
      <section id="features" className="py-20 bg-white dark:bg-slate-900/60 border-t border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-2 font-mono">
              ENGINEERED FOR MODERN DAIRIES
            </h2>
            <p className="text-3xl font-black text-slate-900 dark:text-white sm:text-4xl">
              Everything Your Dairy Center Needs in One Platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                  <Calculator className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Dynamic Rate Matrix Engine</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Support for both Cow and Buffalo rate charts. Compute rates instantly using FAT-only, FAT+SNF, or CLR degree conversion models.
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
                  <Calendar className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">10-Day Automated Billing</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Rural standard 10-day cycle billing (1-10, 11-20, 21-end). Generate PDF billing statements with bilingual Devanagari font rendering.
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-xl bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Predictive AI Analytics</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  AI-driven yield forecasts, cattle performance anomaly detection, and seasonal trend predictions powered by OpenAI and Gemini models.
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
                  <Layers className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Multi-Tenant Cloud Isolation</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Strict logical tenant boundary isolation scoping every collection, farmer, and payment record strictly to the authenticated dairy center.
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4">
                  <Bell className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Instant SMS & Thermal Printing</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Farmers receive instant notifications for every morning/evening milk entry. One-click thermal receipt printer format for village hardware.
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-xl bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-4">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Master Superadmin Command</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Dedicated master orchestrator console for global subscriptions, promo vouchers, broadcast banners, GeoIP visitor telemetry, and support tickets.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="bg-white dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-800/80 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <Brand />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
              Next-Generation Agricultural Dairy SaaS Platform. Built for precision & scale.
            </p>
          </div>
          <div className="flex items-center gap-6 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Link href="/login" className="hover:text-blue-600 dark:hover:text-blue-400">Dairy Sign In</Link>
            <Link href="/login?tab=register" className="hover:text-blue-600 dark:hover:text-blue-400">Register Dairy</Link>
            <Link href="/master/login" className="hover:text-purple-600 dark:hover:text-purple-400">Master Control</Link>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            © 2026 Milkify Dairy Systems. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
