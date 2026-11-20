"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
  Smartphone
} from "lucide-react";

export default function LandingPage() {
  const user = useAuthStore((state) => state.user);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-blue-500 selection:text-white transition-colors duration-300 overflow-x-hidden font-sans">
      {/* ── Top Navigation Bar ────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-slate-950/80 border-b border-slate-200/80 dark:border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brand className="scale-105" />
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <a href="#features" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Features</a>
            <a href="#architecture" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Architecture</a>
            <a href="#roles" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Portals</a>
            <a href="#stats" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Capabilities</a>
          </nav>

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
                    <Lock className="h-3.5 w-3.5 mr-1.5" /> Master Access
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero Section ────────────────────────────────────────────── */}
      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 overflow-hidden">
        {/* Glow gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-gradient-to-tr from-blue-500/15 via-indigo-500/15 to-purple-500/15 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/80 text-blue-700 dark:text-blue-300 text-xs font-bold tracking-wide uppercase mb-6 shadow-sm">
            <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-pulse" />
            Next-Gen Agricultural Dairy SaaS Platform
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight sm:leading-none">
            Smart Milk Collection & High-Precision{" "}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Dairy Management
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mt-6 leading-relaxed font-medium">
            Empower village dairy centers with automated Fat/SNF calculations, thermal receipt printing, automated 10-day billing cycles, and predictive AI analytics.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <Link href="/login" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto h-12 px-7 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white text-base font-extrabold shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2">
                Launch Dairy Admin <ChevronRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/master/login" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto h-12 px-6 rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-extrabold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-2">
                <Cpu className="h-5 w-5 text-purple-500" /> Master Platform Control
              </Button>
            </Link>
          </div>

          {/* ── Live Visual Dashboard Preview ──────────────────────────── */}
          <div className="mt-14 max-w-5xl mx-auto">
            <div className="relative rounded-3xl p-2 sm:p-4 bg-gradient-to-b from-slate-200/60 to-slate-200/20 dark:from-slate-800/80 dark:to-slate-800/20 border border-slate-200/80 dark:border-slate-800 shadow-2xl backdrop-blur-md">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 text-left">
                  <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Today's Milk</span>
                    <Droplet className="h-5 w-5" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">1,480.50 L</div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-1">↑ 8.4% vs last week</div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-left">
                  <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Active Farmers</span>
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">124 Registered</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-1">100% KYC Verified</div>
                </div>

                <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 text-left">
                  <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Average Fat/SNF</span>
                    <Calculator className="h-5 w-5" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">4.2 FAT / 8.6 SNF</div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-bold mt-1">Grade A Quality Standard</div>
                </div>

                <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 text-left">
                  <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">10-Day Cycle</span>
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">Cycle 1 (1st–10th)</div>
                  <div className="text-xs text-amber-600 dark:text-amber-400 font-bold mt-1">Automated Settlement</div>
                </div>
              </div>
            </div>
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

      {/* ── User Portals & Roles ────────────────────────────────────── */}
      <section id="roles" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2 font-mono">
              ROLE-BASED WORKSPACES
            </h2>
            <p className="text-3xl font-black text-slate-900 dark:text-white sm:text-4xl">
              Two Tailored Workspaces for Total Control
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Dairy Admin Card */}
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-bold mb-4">
                  <Users className="h-3.5 w-3.5" /> Dairy Owner & Operator
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">Dairy Admin Dashboard</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                  The primary operations console for milk collection centers. Log daily contributions, calculate dynamic fat-based prices, manage local rate cards, disburse cycle payments, and generate PDF bills.
                </p>
                <ul className="space-y-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-8">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Real-time Morning / Evening collection entries</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Farmers directory with member IDs and passbooks</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> 10-day automated bill generation & thermal slips</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Predictive AI collection analytics and chart trends</li>
                </ul>
              </div>
              <Link href="/login">
                <Button className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20">
                  Access Dairy Admin Portal <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </Link>
            </div>

            {/* Master Admin Card */}
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-purple-200/80 dark:border-purple-900/40 shadow-xl relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100/60 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-xs font-bold mb-4 font-mono">
                  <ShieldCheck className="h-3.5 w-3.5" /> SYSTEM ORCHESTRATOR
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">Master Control Room</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                  Superadmin orchestrator console for the entire Milkify SaaS infrastructure. Manage tenant subscription plans, issue promo codes, dispatch platform announcements, review GeoIP logs, and resolve tickets.
                </p>
                <ul className="space-y-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-8">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-purple-500" /> Global Tenant Directory & Account Provisioning</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-purple-500" /> GeoIP Real-Time Visitor Telemetry & Audit Logs</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-purple-500" /> Subscription Tier Configurations & Promo Codes</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-purple-500" /> Interactive Database Schema & Architecture Visualizer</li>
                </ul>
              </div>
              <Link href="/master/login">
                <Button className="w-full h-11 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold shadow-md shadow-purple-500/20">
                  Access Master Admin Portal <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </Link>
            </div>
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
