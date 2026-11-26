/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/lib/store";
import Brand from "@/components/ui/Brand";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  Droplet,
  Calculator,
  Calendar,
  Sparkles,
  ShieldCheck,
  Users,
  Bell,
  ArrowRight,
  CheckCircle2,
  Lock,
  Layers,
  ChevronRight,
  Printer,
  Zap,
  Sun,
  Moon,
  ReceiptIndianRupee,
  Laptop,
  CheckCircle,
  Radio,
  Store,
  Truck,
  CreditCard,
  Smartphone,
  Tag,
  BarChart3,
  Wifi,
  Star,
  ArrowUpRight,
  ChevronDown,
} from "lucide-react";

export default function LandingPage() {
  const user = useAuthStore((state) => state.user);

  const [navVisible, setNavVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [milkType, setMilkType] = useState("cow");
  const [liters, setLiters] = useState(25);
  const [fat, setFat] = useState(4.2);
  const [snf, setSnf] = useState(8.5);
  const [selectedRole, setSelectedRole] = useState("admin");
  const [simulatedShift, setSimulatedShift] = useState("morning");
  const [slipPrinted, setSlipPrinted] = useState(false);
  const [broadcastSent, setBroadcastSent] = useState(false);
  const [pricingCycle, setPricingCycle] = useState("monthly");
  const [activeEcoService, setActiveEcoService] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setIsScrolled(y > 20);
      setNavVisible(!(y > 80 && y > lastScrollY));
      setLastScrollY(y);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const baseRate = milkType === "cow" ? 32.0 : 45.0;
  const fatFactor = milkType === "cow" ? 1.5 : 1.8;
  const snfFactor = milkType === "cow" ? 0.8 : 1.1;
  const ratePerLiter = Math.round((baseRate + (fat - 3.5) * fatFactor + (snf - 8.5) * snfFactor) * 100) / 100;
  const totalPayout = Math.round(liters * ratePerLiter * 100) / 100;

  const handlePrintSlip = () => {
    setSlipPrinted(true);
    setTimeout(() => setSlipPrinted(false), 3000);
  };
  const handleBroadcast = () => {
    setBroadcastSent(true);
    setTimeout(() => setBroadcastSent(false), 3500);
  };

  // Ecosystem services for the interactive hub
  const ecoServices = [
    {
      id: "dairy",
      icon: Droplet,
      emoji: "🥛",
      label: "Dairy Collection",
      color: "blue",
      gradient: "from-blue-500 to-sky-500",
      bg: "bg-blue-500/10",
      border: "border-blue-500/30",
      text: "text-blue-600 dark:text-blue-400",
      ring: "ring-blue-500/40",
      title: "Precision Milk Collection",
      desc: "Real-time milk intake portal for village dairy operators. Enter Fat/SNF readings per farmer in under 4 seconds with keyboard-first form UX and instant rate computation.",
      features: ["Cow & Buffalo support", "Morning & Evening shifts", "Fat/SNF/CLR rate matrix", "Bilingual Marathi slips", "1-click thermal print", "Farmer passbook ledger"],
    },
    {
      id: "billing",
      icon: ReceiptIndianRupee,
      emoji: "🧾",
      label: "10-Day Billing",
      color: "emerald",
      gradient: "from-emerald-500 to-teal-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      text: "text-emerald-600 dark:text-emerald-400",
      ring: "ring-emerald-500/40",
      title: "Automated Cycle Billing",
      desc: "Three-cycle automatic billing system (1–10, 11–20, 21–end) matching Indian dairy cooperative standards. Generate batch PDFs, deduction statements, and settlement sheets.",
      features: ["3-cycle automation", "Cattle feed loan deductions", "Batch PDF generation", "Settlement audit trail", "Per-farmer statements", "Net payout computation"],
    },
    {
      id: "store",
      icon: Store,
      emoji: "🛍️",
      label: "Public E-Store",
      color: "violet",
      gradient: "from-violet-500 to-purple-500",
      bg: "bg-violet-500/10",
      border: "border-violet-500/30",
      text: "text-violet-600 dark:text-violet-400",
      ring: "ring-violet-500/40",
      title: "Public Dairy Storefront",
      desc: "Every dairy center gets a branded public e-commerce storefront at /store/[slug]. Customers can browse dairy products, cattle feed, and place delivery or walk-in orders online.",
      features: ["Custom branded URL slug", "Product catalog with stock", "Real-time WebSocket sync", "Order tracking portal", "Coupon & promo system", "Category management"],
    },
    {
      id: "delivery",
      icon: Truck,
      emoji: "🚚",
      label: "Geo Delivery",
      color: "amber",
      gradient: "from-amber-500 to-orange-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
      text: "text-amber-600 dark:text-amber-400",
      ring: "ring-amber-500/40",
      title: "Hyper-Local Village Delivery",
      desc: "GPS geofencing engine validates delivery eligibility within a configurable 15 km radius from the dairy center. Auto-calculates delivery charges and free-shipping thresholds.",
      features: ["15 km GPS geofence", "Haversine distance engine", "Auto delivery fee calc", "Free-shipping threshold", "Village cluster mapping", "COD + UPI support"],
    },
    {
      id: "pos",
      icon: Printer,
      emoji: "🖨️",
      label: "Walk-in POS",
      color: "rose",
      gradient: "from-rose-500 to-pink-500",
      bg: "bg-rose-500/10",
      border: "border-rose-500/30",
      text: "text-rose-600 dark:text-rose-400",
      ring: "ring-rose-500/40",
      title: "Walk-In POS Counter",
      desc: "Ultra-fast counter billing for walk-in customers with 80mm thermal slip generation, auto-print, vector PDF export, and optional WhatsApp invoice sharing.",
      features: ["80mm thermal receipts", "Vector PDF invoices", "Walk-in cart builder", "Cash/UPI/MilkPay", "GST-ready billing", "Sales analytics"],
    },
    {
      id: "payments",
      icon: CreditCard,
      emoji: "💳",
      label: "Multi-UPI Pay",
      color: "teal",
      gradient: "from-teal-500 to-cyan-500",
      bg: "bg-teal-500/10",
      border: "border-teal-500/30",
      text: "text-teal-600 dark:text-teal-400",
      ring: "ring-teal-500/40",
      title: "Razorpay Multi-UPI Gateway",
      desc: "Full Razorpay integration supporting Google Pay, PhonePe, Paytm, RuPay, Cards, and the unique Milk-Pay credit mode where farmers pay via their pending milk payout balance.",
      features: ["Google Pay & PhonePe", "Razorpay Subscriptions", "Farmer Milk-Pay credit", "COD reconciliation", "Order session timers", "Webhook verification"],
    },
    {
      id: "analytics",
      icon: BarChart3,
      emoji: "📊",
      label: "Analytics",
      color: "indigo",
      gradient: "from-indigo-500 to-blue-600",
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/30",
      text: "text-indigo-600 dark:text-indigo-400",
      ring: "ring-indigo-500/40",
      title: "Revenue & Collection Analytics",
      desc: "Date-range analytics dashboard with POS vs online revenue split, top-selling products, category breakdowns, payment-method splits (Cash/UPI/Credit), and 7-day trend tables.",
      features: ["Date span selector", "POS vs online split", "Payment method split", "Category breakdowns", "Top 5 products", "Avg order value"],
    },
    {
      id: "master",
      icon: ShieldCheck,
      emoji: "🛡️",
      label: "Master Control",
      color: "purple",
      gradient: "from-purple-600 to-indigo-600",
      bg: "bg-purple-500/10",
      border: "border-purple-500/30",
      text: "text-purple-600 dark:text-purple-400",
      ring: "ring-purple-500/40",
      title: "Master Superadmin Console",
      desc: "Enterprise-grade orchestration console managing all registered dairy tenants globally — SaaS plans, GeoIP visitor telemetry, broadcast alerts, promo vouchers, and architecture diagrams.",
      features: ["Multi-tenant management", "GeoIP visitor telemetry", "SaaS subscription engine", "Broadcast announcements", "MindMap architecture", "Ticket resolution desk"],
    },
  ];

  const colorMap = {
    blue: { dot: "bg-blue-500", badge: "bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300" },
    emerald: { dot: "bg-emerald-500", badge: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300" },
    violet: { dot: "bg-violet-500", badge: "bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300" },
    amber: { dot: "bg-amber-500", badge: "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300" },
    rose: { dot: "bg-rose-500", badge: "bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300" },
    teal: { dot: "bg-teal-500", badge: "bg-teal-100 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300" },
    indigo: { dot: "bg-indigo-500", badge: "bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300" },
    purple: { dot: "bg-purple-500", badge: "bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300" },
  };

  const active = ecoServices[activeEcoService];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080c14] text-slate-900 dark:text-slate-100 overflow-x-hidden font-sans">

      {/* ── Sticky Navigation ─────────────────────────────── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${navVisible ? "translate-y-0" : "-translate-y-full"} ${isScrolled ? "backdrop-blur-xl bg-white/90 dark:bg-slate-950/90 shadow-lg shadow-black/5 border-b border-slate-200/80 dark:border-slate-800/60" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <Brand />
          </Link>

          <nav className="hidden lg:flex items-center gap-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
            {[
              { href: "#ecosystem", label: "Ecosystem" },
              { href: "#features", label: "Features" },
              { href: "#roles", label: "Workspaces" },
              { href: "#pricing", label: "Pricing" },
            ].map((link) => (
              <a key={link.href} href={link.href} className="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200">
                {link.label}
              </a>
            ))}
            <Link href="/version" className="px-3 py-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center gap-1.5 transition-all">
              <Sparkles className="h-3.5 w-3.5" />
              <span>v2.5.0</span>
              <span className="text-[10px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-full font-black">NEW</span>
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <Link href="/dashboard">
                <Button className="h-9 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-lg shadow-blue-500/20 text-sm">
                  Dashboard <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" className="h-9 px-4 rounded-xl font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm hidden sm:flex">
                    Sign In
                  </Button>
                </Link>
                <Link href="/login">
                  <Button className="h-9 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-lg shadow-blue-500/20 text-sm">
                    Get Started
                  </Button>
                </Link>
                <Link href="/master/login" className="hidden md:flex">
                  <Button variant="outline" className="h-9 px-3 rounded-xl text-xs font-bold border-slate-300 dark:border-slate-700">
                    <Lock className="h-3.5 w-3.5 mr-1.5 text-purple-500" /> Master
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative pt-28 pb-16 lg:pt-40 lg:pb-24 overflow-hidden">
        {/* Animated background glows */}
        <div className="absolute inset-0 pointer-events-none -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-br from-blue-600/20 via-sky-500/10 to-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute top-24 right-10 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]" style={{ backgroundImage: "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-5xl mx-auto">
            {/* Badge */}
            <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 text-xs font-bold tracking-wide uppercase mb-6">
              <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" /><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" /></span>
              Uplifting Rural Dairies &bull; Empowering Every Village Farmer
            </motion.div>

            {/* Headline */}
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.05]">
              The Complete
              <span className="block bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 bg-clip-text text-transparent py-1">
                Milkify Ecosystem
              </span>
              for Modern Dairies
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto mt-6 leading-relaxed font-medium">
              From precision milk collection and 10-day automated billing to public e-commerce storefronts, geofenced delivery, walk-in POS, and enterprise superadmin control — all in one unified platform.
            </motion.p>

            {/* CTAs */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
              <Link href="/login" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto h-13 px-8 rounded-2xl bg-gradient-to-r from-blue-600 via-sky-500 to-blue-700 hover:from-blue-700 hover:to-sky-700 text-white text-base font-extrabold shadow-2xl shadow-blue-500/30 flex items-center justify-center gap-2 py-3.5">
                  Launch Dairy Admin <ChevronRight className="h-5 w-5" />
                </Button>
              </Link>
              <a href="#ecosystem" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto h-13 px-6 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-slate-800 dark:text-slate-200 font-extrabold hover:border-blue-300 dark:hover:border-blue-600 flex items-center justify-center gap-2 py-3.5 text-base">
                  Explore the Ecosystem <ChevronDown className="h-5 w-5" />
                </Button>
              </a>
            </motion.div>

            {/* Stat strip */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.4 }}
              className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {[
                { label: "Active Dairy Centers", val: "48+", icon: "🏪" },
                { label: "Daily Milk Processed", val: "64K L", icon: "🥛" },
                { label: "Farmers Registered", val: "5,900+", icon: "👨‍🌾" },
                { label: "Platform Uptime", val: "99.9%", icon: "⚡" },
              ].map((s) => (
                <div key={s.label} className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 text-center shadow-sm">
                  <div className="text-xl mb-1">{s.icon}</div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{s.val}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">{s.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Live dashboard preview bar */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-16 max-w-5xl mx-auto">
            <div className="rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-700/50 shadow-2xl bg-white dark:bg-slate-900/90 backdrop-blur-xl">
              {/* Window chrome */}
              <div className="flex items-center gap-2 px-5 py-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="ml-3 text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Lock className="h-3 w-3 text-emerald-500" />
                  milkify.app/dashboard • Anand Dairy Society
                </span>
                <span className="ml-auto flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Session
                </span>
              </div>
              {/* Dashboard metrics preview */}
              <div className="p-5 sm:p-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Today's Intake", val: "1,480.50 L", sub: "↑ 8.4% from yesterday", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/40", icon: "💧" },
                    { label: "Active Farmers", val: "124", sub: "100% passbook synced", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40", icon: "👥" },
                    { label: "Fat / SNF Quality", val: "4.2 / 8.6", sub: "Grade A Premium", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/40", icon: "🧪" },
                    { label: "Cycle Payout", val: "₹3,42,800", sub: "Cycle 1 Auto-settled", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40", icon: "💰" },
                  ].map((m) => (
                    <div key={m.label} className={`p-4 rounded-2xl ${m.bg} text-left`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{m.label}</span>
                        <span className="text-lg">{m.icon}</span>
                      </div>
                      <div className={`text-xl font-black ${m.color}`}>{m.val}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-1">{m.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── ECOSYSTEM HUB ─────────────────────────────────── */}
      <section id="ecosystem" className="py-24 lg:py-32 relative">
        <div className="absolute inset-0 pointer-events-none -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-blue-600/5 via-purple-600/5 to-emerald-600/5 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section heading */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">
              <Layers className="h-3.5 w-3.5" /> Full Ecosystem Overview
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Every Service the{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Milkify Platform
              </span>{" "}
              Provides
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-400 mt-4 font-medium max-w-2xl mx-auto">
              Click any service below to explore its capabilities in detail. 8 fully integrated modules, one unified platform.
            </p>
          </div>

          {/* Service icon grid */}
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 sm:gap-4 mb-10 max-w-3xl mx-auto">
            {ecoServices.map((svc, idx) => {
              const isActive = idx === activeEcoService;
              return (
                <button
                  key={svc.id}
                  onClick={() => setActiveEcoService(idx)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all duration-300 group ${isActive ? `${svc.bg} ${svc.border} ring-4 ${svc.ring} scale-110` : "bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:scale-105 hover:border-slate-300 dark:hover:border-slate-700"}`}
                >
                  <span className="text-xl">{svc.emoji}</span>
                  <span className={`text-[9px] sm:text-[10px] font-black text-center leading-tight ${isActive ? svc.text : "text-slate-500 dark:text-slate-400"}`}>
                    {svc.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active service detail panel */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeEcoService}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
              className={`rounded-3xl border-2 ${active.border} bg-white dark:bg-slate-900/90 shadow-2xl overflow-hidden`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-5">
                {/* Left info panel */}
                <div className={`lg:col-span-2 p-8 sm:p-10 bg-gradient-to-br ${active.gradient} text-white relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                  <div className="relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6 text-3xl">
                      {active.emoji}
                    </div>
                    <div className="text-xs font-black uppercase tracking-widest opacity-80 mb-2">Service Module</div>
                    <h3 className="text-2xl sm:text-3xl font-black leading-tight mb-4">{active.title}</h3>
                    <p className="text-sm opacity-90 leading-relaxed">{active.desc}</p>

                    <Link href="/login" className="inline-flex items-center gap-2 mt-8 px-5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-sm font-bold transition-all border border-white/20">
                      Explore {active.label} <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>

                {/* Right feature grid */}
                <div className="lg:col-span-3 p-8 sm:p-10">
                  <div className="flex items-center gap-2 mb-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-black ${colorMap[active.color].badge}`}>
                      {active.label}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{active.features.length} core capabilities</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {active.features.map((feat) => (
                      <div key={feat} className={`flex items-center gap-3 p-3 rounded-xl ${active.bg} border ${active.border}`}>
                        <CheckCircle2 className={`h-4 w-4 shrink-0 ${active.text}`} />
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{feat}</span>
                      </div>
                    ))}
                  </div>
                  {/* Navigation arrows */}
                  <div className="flex items-center gap-3 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <button onClick={() => setActiveEcoService((p) => (p - 1 + ecoServices.length) % ecoServices.length)}
                      className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                      ← Prev
                    </button>
                    <div className="flex gap-1.5 flex-1 justify-center">
                      {ecoServices.map((_, i) => (
                        <button key={i} onClick={() => setActiveEcoService(i)}
                          className={`h-1.5 rounded-full transition-all duration-300 ${i === activeEcoService ? `w-6 ${colorMap[active.color].dot}` : "w-1.5 bg-slate-300 dark:bg-slate-700"}`} />
                      ))}
                    </div>
                    <button onClick={() => setActiveEcoService((p) => (p + 1) % ecoServices.length)}
                      className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                      Next →
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ── BENTO FEATURES GRID ────────────────────────────── */}
      <section id="features" className="py-24 bg-white dark:bg-slate-900/60 border-t border-b border-slate-200/80 dark:border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 font-mono mb-2 block">PLATFORM CAPABILITIES</span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Everything Your Dairy Needs
            </h2>
          </div>

          {/* Bento grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Large feature card */}
            <div className="lg:col-span-2 rounded-3xl p-8 bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-5">
                  <Calculator className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-2xl font-black mb-3">Dynamic Fat/SNF Rate Matrix</h3>
                <p className="text-sm opacity-90 leading-relaxed max-w-md">
                  Compute milk rates instantly using configurable Fat-only, Fat+SNF, or CLR degree conversion models. Rates auto-refresh for every entry without page reloads.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {["Cow & Buffalo rates", "Real-time computation", "Custom step matrix", "Government rate sync"].map(f => (
                    <span key={f} className="px-3 py-1 rounded-full bg-white/20 text-xs font-bold border border-white/20">{f}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-3xl p-7 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">10-Day Auto Billing</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Three automated billing cycles (1–10, 11–20, 21–end) matching Indian cooperative standards. PDF batch export with Devanagari fonts.
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /> Auto-scheduled payout
              </div>
            </div>

            <div className="rounded-3xl p-7 bg-purple-50 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/60 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/15 flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">AI Yield Analytics</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                AI-powered yield forecasts, cattle anomaly detection, and seasonal trend predictions via OpenAI and Gemini integrations.
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400">
                <CheckCircle2 className="h-4 w-4" /> Predictive intelligence
              </div>
            </div>

            <div className="rounded-3xl p-7 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 flex items-center justify-center mb-4">
                <Bell className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">SMS & Push Notifications</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Farmers receive instant SMS confirmations for every milk entry. Admins get real-time push alerts for new orders, low stock, and payment events.
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                <CheckCircle2 className="h-4 w-4" /> WhatsApp & SMS
              </div>
            </div>

            {/* Large bottom card */}
            <div className="lg:col-span-2 rounded-3xl p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white shadow-xl relative overflow-hidden">
              <div className="absolute bottom-0 right-0 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-5">
                  <Layers className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-2xl font-black mb-3">Multi-Tenant Cloud Isolation</h3>
                <p className="text-sm opacity-90 leading-relaxed max-w-md">
                  Every dairy center operates in strict logical isolation. All farmers, collections, billings, orders, and payments are scoped exclusively to the authenticated admin tenant.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {["JWT auth isolation", "Per-tenant DB scoping", "Role-based access", "Audit signatures"].map(f => (
                    <span key={f} className="px-3 py-1 rounded-full bg-white/10 text-xs font-bold border border-white/15">{f}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-3xl p-7 bg-rose-50 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800/60 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 flex items-center justify-center mb-4">
                <Wifi className="h-6 w-6 text-rose-600 dark:text-rose-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Real-Time WebSocket Sync</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Socket.io powered live updates push inventory changes, new orders, and coupon updates directly to open customer storefront tabs.
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                <CheckCircle2 className="h-4 w-4" /> Zero-refresh sync
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── INTERACTIVE WORKSPACES ─────────────────────────── */}
      <section id="roles" className="py-24 lg:py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100/70 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider mb-3">
              <Laptop className="h-3.5 w-3.5" /> Interactive Workspace Demos
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Two Tailored Workspaces
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-400 mt-4 font-medium">
              Toggle between the dairy collection desk and the enterprise superadmin command center.
            </p>

            <div className="inline-flex p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 mt-8 shadow-inner">
              <button onClick={() => setSelectedRole("admin")}
                className={`px-5 py-2.5 rounded-xl text-sm font-extrabold flex items-center gap-2 transition-all duration-300 ${selectedRole === "admin" ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-md" : "text-slate-600 dark:text-slate-400"}`}>
                <Users className="h-4 w-4" /> Dairy Admin
                {selectedRole === "admin" && <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />}
              </button>
              <button onClick={() => setSelectedRole("master")}
                className={`px-5 py-2.5 rounded-xl text-sm font-extrabold flex items-center gap-2 transition-all duration-300 ${selectedRole === "master" ? "bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-md" : "text-slate-600 dark:text-slate-400"}`}>
                <ShieldCheck className="h-4 w-4" /> Master Superadmin
                {selectedRole === "master" && <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />}
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {selectedRole === "admin" ? (
              <motion.div key="admin" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}
                className="rounded-3xl border-2 border-blue-200/80 dark:border-blue-900/50 bg-gradient-to-b from-blue-50/40 to-white dark:from-slate-900 dark:to-slate-950 p-6 sm:p-10 shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
                {/* Chrome bar */}
                <div className="flex flex-wrap items-center justify-between pb-5 mb-7 border-b border-slate-200 dark:border-slate-800 gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-400" /><div className="w-3 h-3 rounded-full bg-amber-400" /><div className="w-3 h-3 rounded-full bg-emerald-400" /></div>
                    <span className="ml-2 text-xs font-mono text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                      <Lock className="h-3 w-3 text-emerald-500" /> milkify.app/dashboard (Anand Milk Society)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <span className="text-slate-400 hidden sm:inline">Shift:</span>
                    {["morning", "evening"].map((s) => (
                      <button key={s} onClick={() => setSimulatedShift(s)}
                        className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all capitalize ${simulatedShift === s ? (s === "morning" ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 ring-1 ring-amber-400" : "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 ring-1 ring-indigo-400") : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}`}>
                        {s === "morning" ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />} {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
                  <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 text-xs font-extrabold mb-3">
                        <Users className="h-3.5 w-3.5" /> For Dairy Owners & Agents
                      </span>
                      <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">Dairy Operator Workspace</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">Engineered for high-speed rural milk collection. Enter liters and fat readings in under 4 seconds, print thermal receipts, and automate 10-day payment reconciliations.</p>
                      <ul className="space-y-3 mt-6 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {["Fast Intake: Cow & Buffalo with instant Fat/SNF calc", "Thermal Print: 58mm/80mm slips in Marathi & English", "10-Day Billing: 1-click PDF cycle payment sheets", "Passbooks: MI-FAR member IDs with debit/credit ledger"].map(f => (
                          <li key={f} className="flex items-start gap-2.5">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span dangerouslySetInnerHTML={{ __html: f.replace(/(.*?):/, '<strong>$1:</strong>') }} />
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Link href="/login">
                      <Button className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2">
                        Launch Dairy Admin Portal <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>

                  <div className="lg:col-span-7 bg-white dark:bg-slate-900/95 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xl flex flex-col space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-400 uppercase">Live Intake Simulation</div>
                        <div className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mt-0.5">
                          <span>Farmer: Ramesh Patil</span>
                          <span className="text-xs px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-mono font-bold">MI-FAR-0042</span>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-200/60 dark:border-emerald-800/60">
                        <Radio className="h-3 w-3 animate-ping" /> Real-Time
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-700/70 text-center">
                      {[["Variety", "COW (गाय)", "text-slate-900 dark:text-white"], ["Quantity", "24.50 L", "text-blue-600 dark:text-blue-400"], ["FAT / SNF", "4.2 / 8.6", "text-purple-600 dark:text-purple-400"], ["Total Due", "₹940.80", "text-emerald-600 dark:text-emerald-400"]].map(([label, val, cls]) => (
                        <div key={label} className="p-2">
                          <span className="text-[11px] font-bold text-slate-500 block">{label}</span>
                          <span className={`text-sm font-black ${cls}`}>{val}</span>
                        </div>
                      ))}
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                          <Printer className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">Instant Thermal Slip</div>
                          <div className="text-[11px] text-slate-500">58mm / 80mm Bluetooth printers</div>
                        </div>
                      </div>
                      <Button onClick={handlePrintSlip} variant="outline" size="sm"
                        className="w-full sm:w-auto h-9 px-4 rounded-lg font-bold border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 flex items-center justify-center gap-1.5">
                        {slipPrinted ? <><CheckCircle className="h-4 w-4 text-emerald-500" /> Printed!</> : <><Printer className="h-4 w-4" /> Simulate Print</>}
                      </Button>
                    </div>

                    {slipPrinted && (
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-mono text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                        <span>🧾 Receipt #MKF-84920 dispatched (Devanagari Font Loaded)</span>
                        <span className="font-bold">STATUS: OK</span>
                      </motion.div>
                    )}

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 font-medium">
                      <span>Today: <strong>1,480.50 L</strong> (58 Farmers)</span>
                      <Link href="/login" className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1">
                        View Live Register <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="master" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}
                className="rounded-3xl border-2 border-purple-200/80 dark:border-purple-900/50 bg-gradient-to-b from-purple-50/30 to-white dark:from-slate-900 dark:to-slate-950 p-6 sm:p-10 shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
                <div className="flex flex-wrap items-center justify-between pb-5 mb-7 border-b border-slate-200 dark:border-slate-800 gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-400" /><div className="w-3 h-3 rounded-full bg-amber-400" /><div className="w-3 h-3 rounded-full bg-emerald-400" /></div>
                    <span className="ml-2 text-xs font-mono text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                      <ShieldCheck className="h-3 w-3 text-purple-500" /> milkify.app/master/dashboard (Superadmin)
                    </span>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-mono text-[11px] border border-purple-200 dark:border-purple-800 font-bold">
                    CLUSTER: ap-south-1 (AWS Mumbai)
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
                  <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 text-xs font-extrabold mb-3 font-mono">
                        <ShieldCheck className="h-3.5 w-3.5" /> PLATFORM ORCHESTRATOR
                      </span>
                      <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">Master Superadmin Control</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">Enterprise console commanding all dairy tenants globally — SaaS tiers, GeoIP telemetry, broadcast alerts, promo vouchers, and architecture visualizations.</p>
                      <ul className="space-y-3 mt-6 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {["Tenant Directory: Audit all dairy centers & farmers", "GeoIP Telemetry: City, device & IP audit trails", "SaaS Engine: Dynamic Razorpay tiers & promo codes", "MindMap: Interactive architecture visualizer"].map(f => (
                          <li key={f} className="flex items-start gap-2.5">
                            <CheckCircle2 className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                            <span dangerouslySetInnerHTML={{ __html: f.replace(/(.*?):/, '<strong>$1:</strong>') }} />
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Link href="/master/login">
                      <Button className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2">
                        Enter Master Command Center <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>

                  <div className="lg:col-span-7 bg-white dark:bg-slate-900/95 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xl flex flex-col space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-400 uppercase">Multi-Tenant Telemetry</div>
                        <div className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mt-0.5">
                          Platform Health: 100% Operational
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">48 Active Dairies</span>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {[["Daily Platform Milk", "64,280 L", "Across 48 Centers", "text-slate-900 dark:text-white", "text-emerald-500"], ["Monthly MRR", "₹1,42,000", "Razorpay Subscriptions", "text-emerald-600 dark:text-emerald-400", "text-blue-500"], ["Visitor Telemetry", "3,492 Hits", "GeoIP-Lite Real-Time", "text-purple-600 dark:text-purple-400", "text-slate-400"]].map(([label, val, sub, valCls, subCls]) => (
                        <div key={label} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700/70">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">{label}</span>
                          <span className={`text-lg font-black ${valCls} block mt-0.5`}>{val}</span>
                          <span className={`text-[10px] font-bold ${subCls} block mt-0.5`}>{sub}</span>
                        </div>
                      ))}
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                          <Bell className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">Dispatch Global Announcement</div>
                          <div className="text-[11px] text-slate-500">Push to all 48 dairy dashboards via WebSocket</div>
                        </div>
                      </div>
                      <Button onClick={handleBroadcast} variant="outline" size="sm"
                        className="w-full sm:w-auto h-9 px-4 rounded-lg font-bold border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/50 flex items-center justify-center gap-1.5">
                        {broadcastSent ? <><CheckCircle className="h-4 w-4 text-emerald-500" /> Broadcasted!</> : <><Zap className="h-4 w-4 text-amber-500" /> Test Broadcast</>}
                      </Button>
                    </div>

                    {broadcastSent && (
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-800 rounded-xl text-xs font-mono text-purple-800 dark:text-purple-300 flex items-center justify-between">
                        <span>📢 &quot;Scheduled Backup at 11:00 PM IST&quot; → 48 dairy sockets</span>
                        <span className="font-bold">200 OK</span>
                      </motion.div>
                    )}

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 font-medium">
                      <span>DB: <strong>Mongoose 8.0 Decimal128</strong> Isolation</span>
                      <Link href="/master/login" className="text-purple-600 dark:text-purple-400 font-bold hover:underline flex items-center gap-1">
                        Open MindMap <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ── MILK RATE CALCULATOR ──────────────────────────── */}
      <section className="py-24 bg-gradient-to-b from-white to-blue-50/40 dark:from-slate-900 dark:to-slate-950 border-t border-slate-200/80 dark:border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider mb-3">
              <Calculator className="h-3.5 w-3.5" /> Interactive Sandbox
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">Try the Dynamic Rate Engine</h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-3 font-medium">
              Adjust milk volume, fat %, and SNF to simulate instant rate computation and farmer settlement slips.
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-7 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Select Milk Variety (दुधाचा प्रकार)</label>
                <div className="grid grid-cols-2 gap-3">
                  {[["cow", "🐄 Cow Milk (गाय)", "bg-blue-600 ring-blue-600 shadow-blue-500/25"], ["buffalo", "🐃 Buffalo Milk (म्हैस)", "bg-indigo-600 ring-indigo-600 shadow-indigo-500/25"]].map(([type, label, activeClass]) => (
                    <button key={type} onClick={() => setMilkType(type)}
                      className={`py-3 px-4 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all ${milkType === type ? `${activeClass} text-white shadow-lg ring-2` : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {[{ label: "Quantity Delivered (लिटर)", key: "liters", min: 1, max: 100, step: 1, val: liters, set: setLiters, display: `${liters} L`, color: "accent-blue-600", marks: ["1 L", "50 L", "100 L"] },
              { label: "Fat Percentage (फॅट %)", key: "fat", min: 3.0, max: 10.0, step: 0.1, val: fat, set: setFat, display: `${fat.toFixed(1)}% FAT`, color: "accent-purple-600", marks: ["3.0%", "6.5%", "10.0%"] },
              { label: "Solids-Not-Fat (SNF %)", key: "snf", min: 7.5, max: 10.0, step: 0.1, val: snf, set: setSnf, display: `${snf.toFixed(1)}% SNF`, color: "accent-emerald-600", marks: ["7.5%", "8.5% Std", "10.0%"] },
              ].map((s) => (
                <div key={s.key}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{s.label}</label>
                    <span className="text-base font-black text-slate-800 dark:text-white">{s.display}</span>
                  </div>
                  <input type="range" min={s.min} max={s.max} step={s.step} value={s.val}
                    onChange={(e) => s.set(Number(e.target.value))}
                    className={`w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer ${s.color}`} />
                  <div className="flex justify-between text-[11px] font-bold text-slate-400 mt-1">
                    {s.marks.map(m => <span key={m}>{m}</span>)}
                  </div>
                </div>
              ))}
            </div>

            <div className="md:col-span-5 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl shadow-2xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                  <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest">LIVE RATE ENGINE</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">Auto-Formula</span>
                </div>
                <div className="space-y-4">
                  {[["Calc Rate / Liter", `₹${ratePerLiter.toFixed(2)}`, "text-2xl font-black text-white"],
                  ["Quantity Logged", `${liters} Liters`, "text-sm font-bold text-slate-200"],
                  ["Milk Variety", milkType === "cow" ? "🐄 Cow (गाय)" : "🐃 Buffalo (म्हैस)", "text-sm font-bold text-amber-300"],
                  ].map(([label, val, valCls]) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">{label}:</span>
                      <span className={valCls}>{val}</span>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-slate-800">
                    <span className="text-xs uppercase text-slate-400 font-bold block mb-1">Total Farmer Payment</span>
                    <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400">
                      ₹{totalPayout.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 font-mono text-[11px] space-y-1 text-slate-300">
                  <div className="text-center font-bold text-white border-b border-slate-700 pb-1 mb-1">MILKIFY COLLECTION SLIP</div>
                  {[["Farmer ID", "MI-FAR-0042"], ["Name", "RAMESH PATIL"], ["Variety / Qty", `${milkType.toUpperCase()} / ${liters} L`], ["Fat / SNF", `${fat.toFixed(1)}% / ${snf.toFixed(1)}%`]].map(([k, v]) => (
                    <div key={k} className="flex justify-between"><span>{k}:</span><span className="text-white">{v}</span></div>
                  ))}
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

      {/* ── SERVICES BENTO GRID ───────────────────────────── */}
      <section className="py-24 border-t border-slate-200/80 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold font-mono mb-3">
              <Store className="w-3.5 h-3.5" /> MILKIFY V2.5.0 SERVICES
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Customer & Retail Services
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
              End-to-end digital retail commerce, village delivery logistics, and integrated payment processing — all built in.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Store, label: "Public E-Commerce Storefront", desc: "Every dairy center gets a branded public storefront at /store/[slug] enabling local customers to order milk, ghee, paneer, and cattle feed online.", badge: "Custom Branded URLs", color: "emerald", emoji: "🛍️" },
              { icon: Truck, label: "Hyper-Local Village Delivery", desc: "GPS geofencing engine validates delivery eligibility within a configurable 15 km radius. Auto-calculates delivery fees and free-shipping thresholds.", badge: "GPS Geofencing Active", color: "blue", emoji: "🚚" },
              { icon: CreditCard, label: "Farmer Milk Credit (Milk-Pay)", desc: "Registered farmers can purchase cattle feed directly by deducting the amount from their upcoming milk settlement payout — zero cash required.", badge: "Auto Payout Deduction", color: "amber", emoji: "💳" },
              { icon: Printer, label: "Walk-in POS & 80mm Thermal", desc: "Ultra-fast walk-in POS billing generating 80mm thermal roll receipts with auto-print, vector PDF downloads, and 1-tap WhatsApp invoice sharing.", badge: "Vector PDF & Thermal", color: "purple", emoji: "🖨️" },
              { icon: Smartphone, label: "Razorpay & Multi-UPI Gateway", desc: "Full payment flow: Google Pay, PhonePe, Paytm, RuPay, and Cards. Swiggy-inspired 10-minute order session countdowns with auto-restocking.", badge: "10-Minute Safe Countdown", color: "teal", emoji: "📱" },
              { icon: Tag, label: "Promotional Coupons & Live Sync", desc: "Admins launch festive coupon campaigns with custom expiry. Any inventory or coupon change updates customer storefront tabs via real-time WebSockets.", badge: "Socket.io Broadcast", color: "rose", emoji: "🎁" },
            ].map((s) => {
              const Icon = s.icon;
              const cols = { emerald: "hover:border-emerald-500/50", blue: "hover:border-blue-500/50", amber: "hover:border-amber-500/50", purple: "hover:border-purple-500/50", teal: "hover:border-teal-500/50", rose: "hover:border-rose-500/50" };
              const iconCols = { emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400", amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400", purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400", teal: "bg-teal-500/10 text-teal-600 dark:text-teal-400", rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400" };
              const badgeCols = { emerald: "text-emerald-600 dark:text-emerald-400", blue: "text-blue-600 dark:text-blue-400", amber: "text-amber-600 dark:text-amber-400", purple: "text-purple-600 dark:text-purple-400", teal: "text-teal-600 dark:text-teal-400", rose: "text-rose-600 dark:text-rose-400" };
              return (
                <div key={s.label} className={`group p-7 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 ${cols[s.color]} hover:shadow-xl transition-all duration-300 flex flex-col justify-between`}>
                  <div>
                    <div className={`w-13 h-13 rounded-2xl ${iconCols[s.color]} flex items-center justify-center mb-5 w-12 h-12`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                      <span>{s.emoji}</span> {s.label}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{s.desc}</p>
                  </div>
                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1">
                    <span className={`text-xs font-bold ${badgeCols[s.color]}`}>{s.badge}</span>
                    <CheckCircle2 className={`w-4 h-4 ml-auto ${badgeCols[s.color]}`} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Payment trust banner */}
          <div className="mt-14 p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-2xl border border-indigo-900/40">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold mb-2">
                  <ShieldCheck className="w-4 h-4" /> Enterprise Payment Security
                </div>
                <h4 className="text-xl sm:text-2xl font-black">Accept All Major Indian Payment Modes</h4>
                <p className="text-sm text-slate-300 mt-1 max-w-xl">Multi-channel payment orchestrator supporting instant UPI, bank settlements, and rural cash-on-delivery reconciliation.</p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                {["⚡ Razorpay", "📱 Google Pay", "🟣 PhonePe", "💳 Paytm UPI", "🏦 RuPay & NetBanking", "🥛 Dairy Milk-Pay"].map((p, i) => (
                  <span key={p} className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${i === 5 ? "bg-amber-500/20 text-amber-300 border-amber-500/40" : "bg-white/10 border-white/15"}`}>{p}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ───────────────────────────────────────── */}
      <section id="pricing" className="py-24 bg-white dark:bg-slate-900/40 border-t border-slate-200/80 dark:border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-2 font-mono block">TRANSPARENT SAAS PRICING</span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">Predictable Plans for Growing Dairies</h2>
            <p className="text-base text-slate-600 dark:text-slate-400 mt-3 max-w-xl mx-auto">Start with a 14-day free trial. Cancel anytime or upgrade as your farmer network expands.</p>

            <div className="mt-8 inline-flex items-center p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              {[["monthly", "Monthly Billing"], ["annual", "Annual Billing"]].map(([cycle, label]) => (
                <button key={cycle} type="button" onClick={() => setPricingCycle(cycle)}
                  className={`px-5 py-2 text-sm font-bold rounded-xl transition flex items-center gap-1.5 ${pricingCycle === cycle ? (cycle === "annual" ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm") : "text-slate-600 dark:text-slate-400"}`}>
                  {label}
                  {cycle === "annual" && <span className="text-[10px] bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full font-black">Save 20%</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {[
              {
                tier: "Basic", label: "Starter Dairy", desc: "Ideal for small village milk centers and independent collectors.", price: pricingCycle === "monthly" ? "999" : "799", annual: "Billed ₹9,588 (Save ₹2,400)", color: "", features: ["Up to 50 Registered Farmers", "Morning & Evening Milk Collection", "Dynamic Fat & SNF Rate Matrix", "10-Day Automated Billing (PDF)", "Standard SMS Collection Receipts", "Bilingual Devanagari Slip Printing"], cta: "Start 14-Day Free Trial", ctaStyle: "bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white", popular: false
              },
              {
                tier: "Pro", label: "Smart Dairy & Storefront", desc: "Complete operating system for modern dairies selling milk & cattle feed.", price: pricingCycle === "monthly" ? "2,499" : "1,999", annual: "Billed ₹23,988 (Save ₹6,000)", color: "blue", features: ["Unlimited Farmers & Collectors", "Public Storefront (/store/[slug])", "Hyper-Local Geofence Delivery Engine", "Walk-in POS & 80mm Thermal Slips", "Razorpay & Multi-UPI Gateway", "Farmer Milk Credit (Milk-Pay)", "Promotional Coupons with Expiry", "Real-Time Socket.io Live Sync"], cta: "Start 14-Day Free Trial", ctaStyle: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25", popular: true
              },
              {
                tier: "Pro Max", label: "Enterprise & Multi-Chilling", desc: "For dairy federations, multi-center chilling hubs, and retail chains.", price: pricingCycle === "monthly" ? "4,999" : "3,999", annual: "Billed ₹47,988 (Save ₹12,000)", color: "purple", features: ["Everything in Pro Plan", "Multi-Outlet Chilling Network", "Custom Brand Subdomains & White-label", "IoT Milk Analyzer Auto-Read API", "AI Predictive Yield Detection", "Master Superadmin Multi-Tenant Console", "24/7 Dedicated Account Manager & 99.99% SLA"], cta: "Contact Enterprise Sales", ctaStyle: "bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white", popular: false
              },
            ].map((plan) => (
              <div key={plan.tier} className={`relative p-8 rounded-3xl flex flex-col justify-between transition-all ${plan.popular ? "bg-white dark:bg-slate-900 border-2 border-blue-600 dark:border-blue-500 shadow-2xl scale-[1.02] lg:-translate-y-2" : "bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg"}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[11px] font-black uppercase tracking-wider px-5 py-1.5 rounded-full shadow-md whitespace-nowrap">
                    ⭐ Most Popular • Full Retail Stack
                  </div>
                )}
                <div>
                  <div className={`text-xs font-mono font-black uppercase tracking-wider mb-1 ${plan.color === "blue" ? "text-blue-600 dark:text-blue-400" : plan.color === "purple" ? "text-purple-600 dark:text-purple-400" : "text-slate-500 dark:text-slate-400"}`}>{plan.label}</div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">{plan.tier}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{plan.desc}</p>
                  <div className="my-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-slate-900 dark:text-white">₹{plan.price}</span>
                      <span className="text-xs text-slate-500">/ month</span>
                    </div>
                    {pricingCycle === "annual" && <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block mt-1">{plan.annual}</span>}
                  </div>
                  <div className="space-y-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
                    {plan.features.map((f) => (
                      <div key={f} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                        <CheckCircle2 className={`w-4 h-4 shrink-0 ${plan.color === "blue" ? "text-blue-600" : plan.color === "purple" ? "text-purple-600" : "text-emerald-500"}`} />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <Link href="/login?tab=register" className="mt-8 block">
                  <Button className={`w-full h-11 rounded-xl font-extrabold text-sm transition ${plan.ctaStyle}`}>
                    {plan.cta} {plan.popular && <ArrowRight className="w-4 h-4 ml-1.5" />}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer className="bg-slate-900 dark:bg-[#060a10] border-t border-slate-800/80 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-10 border-b border-slate-800">
            <div className="md:col-span-2">
              <Brand className="invert" />
              <p className="text-sm text-slate-400 mt-3 leading-relaxed max-w-sm">
                Next-generation agricultural dairy SaaS platform powering rural milk societies, cooperative dairies, and digital retail storefronts across India.
              </p>
              <div className="flex items-center gap-2 mt-5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-slateald-400 font-semibold text-emerald-400">All Systems Operational</span>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-widest mb-4">Platform</h4>
              <div className="space-y-2.5 text-sm text-slate-400">
                {[["Dairy Admin Portal", "/login"], ["Master Control Center", "/master/login"], ["Register Dairy", "/login?tab=register"], ["Milkify admin store", "/dashboard/store"], ["v2.5.0 Release Notes", "/version"]].map(([label, href]) => (
                  <Link key={label} href={href} className="block hover:text-white transition-colors">{label}</Link>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-widest mb-4">Ecosystem</h4>
              <div className="space-y-2.5 text-sm text-slate-400">
                {["Milk Collection", "10-Day Billing", "Public Storefront", "Delivery Engine", "POS Counter", "Analytics Dashboard"].map((item) => (
                  <div key={item} className="flex items-center gap-2 cursor-default">
                    <Star className="h-3 w-3 text-amber-500" />{item}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© 2026 Milkify Dairy Systems. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span className="font-mono">v2.5.0</span>
              <span>Built in India 🇮🇳</span>
              <span>MongoDB + Next.js + Socket.io</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
