"use client";

import Link from "next/link";
import Brand from "@/components/ui/Brand";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Layers,
  Store,
  CreditCard,
  Printer,
  Truck,
  Tag,
  Clock,
  Lock,
  Cpu,
  Smartphone,
  Globe2,
  Calendar,
  Zap,
} from "lucide-react";

export default function VersionPage() {
  const releases = [
    {
      version: "v2.5.0",
      releaseDate: "November 2026",
      tag: "Current Production Release",
      isLatest: true,
      headline: "E-Commerce Dairy Storefront, Hyper-Local Delivery & Real-Time POS Network",
      features: [
        {
          title: "Public Dairy & Cattle Feed E-Commerce Storefront",
          icon: Store,
          desc: "Dedicated white-label customer storefront (/store/[slug]) enabling village residents to order pure cow/buffalo milk, dairy products, and cattle feed online.",
        },
        {
          title: "Hyper-Local Village Delivery & Geofence Engine",
          icon: Truck,
          desc: "Automated geofencing within customizable radii (up to 15 km), verifying village boundary delivery eligibility and delivery charges.",
        },
        {
          title: "Farmer Milk Credit Settlement Payment (Milk-Pay)",
          icon: CreditCard,
          desc: "Dairy farmers can log in with their registered mobile number and directly settle store purchases using their unsettled milk credit balance.",
        },
        {
          title: "Walk-in POS Counter Billing & 80mm Clean Thermal Slips",
          icon: Printer,
          desc: "High-speed retail counter POS billing generating authentic 80mm thermal receipts with auto-print and vector PDF downloads.",
        },
        {
          title: "Integrated Razorpay & Multi-UPI Payment Gateway",
          icon: Smartphone,
          desc: "Accept payments via Google Pay, PhonePe, Paytm UPI, Credit/Debit cards, and NetBanking with a 10-minute session countdown timer.",
        },
        {
          title: "Promotional Coupons & Real-Time Socket.io Sync",
          icon: Tag,
          desc: "Outlet admins can issue custom coupon codes with expiry dates and minimum order values, synchronized live across open store sessions.",
        },
        {
          title: "Enhanced Security & Farmer Credential Reset",
          icon: Lock,
          desc: "Unified credential management allowing dairy farmers to set or update their login password with complete session privacy.",
        },
      ],
    },
    {
      version: "v2.4.0",
      releaseDate: "October 2026",
      tag: "Stable",
      isLatest: false,
      headline: "Predictive AI Yield Analytics & 10-Day Billing Automation",
      features: [
        {
          title: "Automated 10-Day Cycle Billing Statements",
          icon: Calendar,
          desc: "Standard rural 10-day cycle billing (1-10, 11-20, 21-end) with bilingual Devanagari font rendering.",
        },
        {
          title: "Dynamic Rate Matrix Engine (FAT + SNF / CLR)",
          icon: Cpu,
          desc: "Real-time milk pricing calculation for Cow and Buffalo milk based on fat percentages and degree conversions.",
        },
        {
          title: "Predictive AI Analytics & Health Anomalies",
          icon: Sparkles,
          desc: "Yield forecasts and anomaly detection for cattle health and seasonal volume trends.",
        },
      ],
    },
    {
      version: "v2.0.0",
      releaseDate: "August 2026",
      tag: "Major Architecture Milestone",
      isLatest: false,
      headline: "Multi-Tenant Cloud Infrastructure & Master Orchestrator",
      features: [
        {
          title: "Strict Logical Multi-Tenant Boundary Isolation",
          icon: Layers,
          desc: "Every milk entry, farmer record, and financial transaction strictly scoped to the authenticated dairy center.",
        },
        {
          title: "Master Superadmin Command Console",
          icon: Globe2,
          desc: "Centralized orchestrator for SaaS subscription plans, global vouchers, and broadcast alerts.",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-blue-500 selection:text-white font-sans transition-colors">
      {/* Top Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 dark:bg-slate-950/90 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Brand className="scale-105" />
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" className="h-10 px-4 rounded-xl font-bold">
                Sign In
              </Button>
            </Link>
            <Link href="/login?tab=register">
              <Button className="h-10 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-md shadow-blue-500/20">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-blue-50/50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900/40 dark:to-slate-950 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-xs font-bold font-mono">
            <Zap className="w-3.5 h-3.5" />
            <span>MILKIFY VERSION &amp; PLATFORM ROADMAP</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Release Notes &amp; System Updates
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Track new feature launches, architectural enhancements, payment integrations, and hardware improvements deployed across the Milkify SaaS Network.
          </p>
        </div>
      </section>

      {/* Release Timeline */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
        {releases.map((rel) => (
          <div
            key={rel.version}
            className={`relative p-6 sm:p-8 rounded-3xl border transition-all shadow-sm ${
              rel.isLatest
                ? "bg-white dark:bg-slate-900/90 border-blue-500/40 ring-2 ring-blue-500/10 shadow-xl"
                : "bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800"
            }`}
          >
            {/* Version Badge & Date */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400">
                  {rel.version}
                </span>
                <span
                  className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    rel.isLatest
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {rel.tag}
                </span>
              </div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {rel.releaseDate}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mb-6">
              {rel.headline}
            </h2>

            {/* Features List */}
            <div className="grid grid-cols-1 gap-4">
              {rel.features.map((feat, idx) => {
                const IconComponent = feat.icon;
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 flex items-start gap-3.5"
                  >
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{feat.title}</span>
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        {feat.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-800/80 py-10 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Brand />
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
            <Link href="/" className="hover:text-blue-600">Home</Link>
            <Link href="/login" className="hover:text-blue-600">Dairy Sign In</Link>
            <Link href="/login?tab=register" className="hover:text-blue-600">Register</Link>
            <Link href="/version" className="text-blue-600 font-bold">Version Notes</Link>
          </div>
          <p className="text-xs text-slate-400">© 2026 Milkify Cloud Dairy SaaS Platform</p>
        </div>
      </footer>
    </div>
  );
}
