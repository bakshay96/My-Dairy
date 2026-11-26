/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  GitBranch,
  GitCommit,
  GitPullRequest,
  Search,
  ChevronRight,
  ShieldCheck,
  BarChart3,
  Users,
  Database,
  ArrowRight,
  Terminal,
  Code2,
  FileText,
  Volume2,
  Cloud,
  BadgeCheck,
} from "lucide-react";

const RELEASES = [
    {
      version: "v2.5.0",
      releaseDate: "November 2026",
      tag: "Current Production Release",
      isLatest: true,
      branch: "feat/milki-ecommerce-store",
      secondaryBranch: "feat/store-analytics-and-platform-updates",
      prNumber: "#41",
      mergeCommit: "6ccdf3c",
      category: "store",
      summary: "Full-scale transformation from milk collection SaaS to a unified dairy retail ecosystem with public storefronts, GPS geofencing, walk-in POS, and multi-UPI checkout.",
      headline: "Public E-Commerce Dairy Storefront, Hyper-Local Village Delivery & Real-Time POS Network",
      stats: {
        commits: 14,
        modules: 8,
        breakingChanges: 0,
        schemaUpdates: 4,
      },
      architecture: [
        { label: "New Models", value: "StoreOutlet, StoreProduct, StoreOrder, StoreCoupon, StoreCustomer" },
        { label: "Geofencing Engine", value: "Haversine Distance Algorithm (Configurable 15 km GPS boundary)" },
        { label: "Real-Time Layer", value: "Socket.io broadcast for stock, order states, and live coupons" },
        { label: "POS Hardware", value: "Direct 80mm ESC/POS Thermal Printing & Vector PDF generation" },
      ],
      features: [
        {
          title: "Public Dairy & Cattle Feed E-Commerce Storefront",
          icon: Store,
          badge: "New Public Portal",
          desc: "Dedicated white-label customer storefront at /store/[slug] enabling village residents to order pure cow/buffalo milk, paneer, ghee, and cattle feed online with live inventory sync.",
        },
        {
          title: "Hyper-Local Village Delivery & Geofence Engine",
          icon: Truck,
          badge: "GPS Geofencing",
          desc: "Automated geofencing within customizable radii (up to 15 km), verifying customer village delivery eligibility and computing tiered distance shipping fees.",
        },
        {
          title: "Farmer Milk Credit Settlement Payment (Milk-Pay)",
          icon: CreditCard,
          badge: "Unique Agritech Feature",
          desc: "Registered dairy farmers can purchase cattle feed or dairy items and directly settle orders against their upcoming milk cycle collection payout with zero cash required.",
        },
        {
          title: "Walk-in POS Counter Billing & 80mm Clean Thermal Slips",
          icon: Printer,
          badge: "Hardware Integration",
          desc: "High-speed retail counter POS billing generating authentic 80mm thermal receipts with store logo, GST calculation, watermark, and instant WhatsApp bill sharing.",
        },
        {
          title: "Integrated Razorpay & Multi-UPI Payment Gateway",
          icon: Smartphone,
          badge: "Fintech Integration",
          desc: "Swiggy-inspired payment flow supporting Google Pay, PhonePe, Paytm, RuPay, and Cards with a 10-minute session countdown timer and automatic inventory restock on timeout.",
        },
        {
          title: "Promotional Coupons & Real-Time Socket.io Sync",
          icon: Tag,
          badge: "Marketing Tools",
          desc: "Outlet admins can issue custom coupon codes with percentage or flat discounts, expiry dates, and minimum order values, synchronized live across customer sessions.",
        },
        {
          title: "Multi-Date Range Calendar Analytics",
          icon: BarChart3,
          badge: "Telemetry Upgrade",
          desc: "Granular multi-date range picker (Today, Yesterday, Last 7 Days, This Month, Custom Span) for deep drilldown into Online vs Walk-in POS revenue and customer volume.",
        },
      ],
      commits: [
        { hash: "6ccdf3c", message: "Merge branch 'feat/store-analytics-and-platform-updates'", author: "bakshay96", date: "26 Nov 2026" },
        { hash: "a8ffe8e", message: "feat(store): fix analytics span & ReferenceError, profile photo sync, UI drawer, and offers tab", author: "bakshay96", date: "26 Nov 2026" },
        { hash: "87f007a", message: "feat(store): fix online payment enum, clean razorpay checkout, active order banner, and guest & customer order tracking", author: "bakshay96", date: "25 Nov 2026" },
        { hash: "7870901", message: "Merge pull request #41 from bakshay96/feat/milki-ecommerce-store", author: "bakshay96", date: "24 Nov 2026" },
        { hash: "bae1409", message: "feat(store): standalone store admin tab, 80mm thermal receipt with logo/watermark/GST, light/dark themes & resilient checkout", author: "bakshay96", date: "24 Nov 2026" },
        { hash: "af5cb60", message: "feat(store): add comprehensive seed inventory for dairy, cattle feed, and kirana", author: "bakshay96", date: "24 Nov 2026" },
        { hash: "c2a6d79", message: "feat(milki_store): modularize dairy store backend and implement storefront, POS, and master network", author: "bakshay96", date: "23 Nov 2026" },
      ],
    },
    {
      version: "v2.4.0",
      releaseDate: "Mid November 2026",
      tag: "SaaS & Cloud Media Upgrade",
      isLatest: false,
      branch: "feat/s3-media-payment-audio-notification",
      secondaryBranch: null,
      prNumber: "Direct Merge",
      mergeCommit: "a1417e9",
      category: "cloud",
      summary: "Enterprise cloud media pipeline via AWS S3, audio-tone notifications for payment alerts, and dynamic subscription tier pricing engine.",
      headline: "AWS S3 Media Cloud, Multi-Tone Audio Payment Alerts & Dynamic SaaS Engine",
      stats: {
        commits: 8,
        modules: 5,
        breakingChanges: 0,
        schemaUpdates: 2,
      },
      architecture: [
        { label: "Storage Engine", value: "Amazon Web Services S3 Bucket for farmer KYC photos and media" },
        { label: "Audio Engine", value: "HTML5 Web Audio API multi-frequency sound synthesizer for payments" },
        { label: "Billing Engine", value: "Dynamic PlanConfigModel with Monthly, Quarterly, and Yearly tiers" },
        { label: "Tax Compliance", value: "Downloadable PDF GST tax invoices for dairy SaaS subscriptions" },
      ],
      features: [
        {
          title: "AWS S3 Cloud Farmer Media Storage",
          icon: Cloud,
          badge: "AWS Infrastructure",
          desc: "High-durability object storage for farmer profile pictures and dairy documents with authenticated upload tokens and automated CDN thumbnail caching.",
        },
        {
          title: "Multi-Tone Audio Soundbox for Real-Time Payments",
          icon: Volume2,
          badge: "Hardware Emulation",
          desc: "Paytm Soundbox-inspired audio alerts chime immediately upon successful UPI or Milk-Pay transaction confirmations on the admin counter.",
        },
        {
          title: "Dynamic SaaS Plan Engine & Custom Tiers",
          icon: CreditCard,
          badge: "Master SaaS Engine",
          desc: "Master Superadmin can configure custom plan pricing (Monthly, Quarterly, Annual), feature entitlements, trial periods, and launch promotional coupons.",
        },
        {
          title: "Downloadable Tax Invoices & Active Plan Locking",
          icon: FileText,
          badge: "Compliance",
          desc: "Official GST tax invoice generation for SaaS subscriptions with instant PDF download and active-plan protection against duplicate billing.",
        },
      ],
      commits: [
        { hash: "f08301e", message: "feat(subscription): downloadable tax receipt slips, active plan locking, offer scroller, and dynamic multi-plans engine", author: "bakshay96", date: "23 Nov 2026" },
        { hash: "b5c7f5a", message: "fix(payment): eliminate Razorpay contact prompt and enforce server-side payment verification and capture", author: "bakshay96", date: "23 Nov 2026" },
        { hash: "a1417e9", message: "Merge branch 'feat/s3-media-payment-audio-notification'", author: "bakshay96", date: "22 Nov 2026" },
        { hash: "01df0cc", message: "feat: implement AWS S3 farmer photos, media gallery, secure Razorpay verification, and multi-tone audio notifications", author: "bakshay96", date: "22 Nov 2026" },
      ],
    },
    {
      version: "v2.3.0",
      releaseDate: "November 2026",
      tag: "Billing Sprint Cycles",
      isLatest: false,
      branch: "feat_sprint_billing_enhancements",
      secondaryBranch: "feat_thermal_billing_slip_update",
      prNumber: "#39, #40",
      mergeCommit: "f45ab39",
      category: "billing",
      summary: "Flexible billing sprint intervals (5, 7, 10, 15, 30 days), Marathi Devanagari 80mm thermal receipts, and zero-collection farmer notifications.",
      headline: "Custom Sprint Billing Cycles, Thermal Statement Engine & Shift Cash Audit",
      stats: {
        commits: 11,
        modules: 6,
        breakingChanges: 0,
        schemaUpdates: 3,
      },
      architecture: [
        { label: "Billing Modes", value: "Configurable sprint periods: 5, 7, 10, 15, or 30 days" },
        { label: "Devanagari Font", value: "Preloaded Unicode fonts for seamless Marathi thermal print" },
        { label: "Audit Ledger", value: "Detailed cow/buffalo animal breakdown per farmer settlement" },
        { label: "Email Dispatcher", value: "Automated zero-collection notice engine for inactive members" },
      ],
      features: [
        {
          title: "Configurable Billing Sprint Engine",
          icon: Calendar,
          badge: "Cooperative Billing",
          desc: "Dairy centers can choose custom sprint periods (5, 7, 10, 15, or 30 days) with automated settlement calculations and shift cash audits.",
        },
        {
          title: "Dedicated 80mm Thermal Billing Slips",
          icon: Printer,
          badge: "Thermal Printing",
          desc: "Print compact 80mm or 58mm thermal slips with embedded Devanagari typography for Marathi-speaking rural farmer transparency.",
        },
        {
          title: "Animal Ledger Breakdown (Cow vs Buffalo)",
          icon: Layers,
          badge: "Quality Audit",
          desc: "Per-animal volume, fat, SNF, and rate metrics broken down on every statement with loan and cattle feed deductions.",
        },
        {
          title: "Zero-Collection Member Alerts",
          icon: BellIcon,
          badge: "Farmer Retention",
          desc: "Automated email and SMS notices sent to registered farmers with zero intake during the billing cycle to prompt engagement.",
        },
      ],
      commits: [
        { hash: "f45ab39", message: "Merge pull request #40 from bakshay96/feat_sprint_billing_enhancements", author: "bakshay96", date: "21 Nov 2026" },
        { hash: "18ee0b9", message: "feat(billing): sprint billing cycle engine, detailed animal ledger breakdown, cash desk shift audit and master admin rollout notifications", author: "bakshay96", date: "21 Nov 2026" },
        { hash: "8299a33", message: "feat: configurable billing sprint cycles, automated thermal statements, zero-collection email notices, backend ready confirmation log, and master admin broadcast", author: "bakshay96", date: "21 Nov 2026" },
        { hash: "b652bd5", message: "Merge pull request #39 from bakshay96/feat_thermal_billing_slip_update", author: "bakshay96", date: "20 Nov 2026" },
        { hash: "eb109f5", message: "feat(billing): dedicated 80mm thermal PDF slips, paid/unpaid categorization, and rupee icon replacements", author: "bakshay96", date: "20 Nov 2026" },
      ],
    },
    {
      version: "v2.2.0",
      releaseDate: "Late October 2026",
      tag: "Architecture & Telemetry",
      isLatest: false,
      branch: "feat_my_application_architecture_mindmap",
      secondaryBranch: "feat_visitor_user_login_analytics",
      prNumber: "#37, #38",
      mergeCommit: "7d1c69d",
      category: "master",
      summary: "Interactive tech architecture MindMapFlow tree, country-wise geographic drilldowns, user session auditing, and mobile table cards.",
      headline: "My Application Architecture MindMap & Comprehensive Visitor Analytics",
      stats: {
        commits: 16,
        modules: 7,
        breakingChanges: 0,
        schemaUpdates: 2,
      },
      architecture: [
        { label: "MindMap Visualizer", value: "MindMapFlow dynamic DAG visualization of fullstack architecture" },
        { label: "GeoIP Telemetry", value: "Real-time geographic country, state, city, and device resolution" },
        { label: "Audit Log Model", value: "UserLoginLog tracking IP, browser, OS, timestamp, and duration" },
        { label: "UI Experience", value: "7-field table sort, multi-term filter, and mobile card view" },
      ],
      features: [
        {
          title: "My Application Architecture MindMap Hub",
          icon: Code2,
          badge: "Interactive Graph",
          desc: "Full interactive architecture visualizer mapping frontend Next.js components to backend Express routers, Socket.io rooms, and MongoDB collections.",
        },
        {
          title: "Country & City Traffic Drilldown",
          icon: Globe2,
          badge: "Geo Analytics",
          desc: "Geographic telemetry visualizes live session origins with responsive country badges, IP lookup, and visit frequency counters.",
        },
        {
          title: "User-Wise Login Session Auditing",
          icon: ShieldCheck,
          badge: "Security Logging",
          desc: "Real-time telemetry logging user login events, browser user-agent signatures, device types (Mobile/Tablet/Desktop), and operating systems.",
        },
        {
          title: "7-Field Sorting & Mobile Cards",
          icon: BarChart3,
          badge: "Responsive UX",
          desc: "Clean desktop data tables transform automatically into touch-friendly swipeable cards on mobile viewports.",
        },
      ],
      commits: [
        { hash: "7d1c69d", message: "Merge pull request #37 from bakshay96/feat_my_application_architecture_mindmap", author: "bakshay96", date: "20 Nov 2026" },
        { hash: "f2fa5ac", message: "feat(master): add 'My Application' tech hub with MindMapFlow architecture tree, orientation controls, and live schema telemetry", author: "bakshay96", date: "20 Nov 2026" },
        { hash: "e3898f5", message: "Merge pull request #38 from bakshay96/feat_readme_and_live_screen_tour", author: "bakshay96", date: "20 Nov 2026" },
        { hash: "3870daa", message: "docs: upgrade README with live screenshots, dual-portal screen tour, and modernized tech stack", author: "bakshay96", date: "20 Nov 2026" },
        { hash: "408997d", message: "feat(analytics): add 7-field sorting icons, multi-field filtering, and responsive mobile cards", author: "bakshay96", date: "20 Nov 2026" },
        { hash: "1f85810", message: "feat(analytics): modernize platform traffic tab with interactive country drilldown and multi-metric detailed view", author: "bakshay96", date: "20 Nov 2026" },
        { hash: "d83479b", message: "feat(analytics): add user-wise login telemetry with geographic and device auditing in visitor analytics", author: "bakshay96", date: "20 Nov 2026" },
      ],
    },
    {
      version: "v2.1.0",
      releaseDate: "Mid October 2026",
      tag: "Member ID System",
      isLatest: false,
      branch: "feat_master_user_credentials_and_farmers_directory",
      secondaryBranch: null,
      prNumber: "#29 - #36",
      mergeCommit: "6b8ec60",
      category: "master",
      summary: "Standardized Member IDs (MI-MST, MI-DA, MI-DAS, MI-FAR), audit signatures (modifiedBy/modifiedAt), and farmer credential control.",
      headline: "Standardized Member IDs, Master Admin Signatures & Credential Control",
      stats: {
        commits: 18,
        modules: 6,
        breakingChanges: 1,
        schemaUpdates: 3,
      },
      architecture: [
        { label: "ID Generator", value: "Zero-padded prefix system: MI-MST-0001, MI-DA-0001, MI-FAR-0001" },
        { label: "Audit Fields", value: "modifiedBy (Master ID) and modifiedAt (ISODate) on every model" },
        { label: "Hierarchy Scoping", value: "Farmer accounts strictly assigned to specific dairy admin tenants" },
        { label: "Resilience Fix", value: "Public DNS fallback resolving Mongo Atlas queryTxt ETIMEOUT errors" },
      ],
      features: [
        {
          title: "Standardized Member ID Nomenclature",
          icon: BadgeCheck,
          badge: "Identifier Overhaul",
          desc: "Unified ID numbering across the entire platform: MI-MST (Master), MI-DA (Dairy Admin), MI-DAS (Staff), and MI-FAR (Farmer Member).",
        },
        {
          title: "Master Admin Audit Trail Signatures",
          icon: Lock,
          badge: "Compliance Trail",
          desc: "Every record modified through the Master Superadmin portal stamps a cryptographic signature and audit timestamp.",
        },
        {
          title: "Centralized Farmer Credential Management",
          icon: Users,
          badge: "Account Control",
          desc: "Master Superadmin and Dairy Admins can securely view and update farmer login credentials and toggle active status.",
        },
        {
          title: "Mongo Atlas DNS Timeout Fix",
          icon: Database,
          badge: "Infrastructure Patch",
          desc: "Integrated Node.js dns.setServers(['8.8.8.8', '1.1.1.1']) to eliminate sporadic SRV queryTxt ETIMEOUT connection errors.",
        },
      ],
      commits: [
        { hash: "6b8ec60", message: "Merge pull request #35 from bakshay96/feat_master_user_credentials_and_farmers_directory", author: "bakshay96", date: "19 Nov 2026" },
        { hash: "1d9fd09", message: "feat(memberId): implement unique standardized Member IDs across all roles and migrate database", author: "bakshay96", date: "19 Nov 2026" },
        { hash: "51ac392", message: "fix: resolve Mongo Atlas queryTxt ETIMEOUT via public DNS servers and optimize Next.js font fallbacks", author: "bakshay96", date: "18 Nov 2026" },
        { hash: "0f77b84", message: "feat(master): add modifiedBy master admin signature and modifiedAt timestamp audit tracking across all tables", author: "bakshay96", date: "18 Nov 2026" },
        { hash: "5b4025a", message: "feat(master): add user credentials view/update, role categorization, and farmer-admin association hierarchy", author: "bakshay96", date: "18 Nov 2026" },
      ],
    },
    {
      version: "v2.0.0",
      releaseDate: "Early October 2026",
      tag: "Dynamic Rate Engine",
      isLatest: false,
      branch: "rate_configuration",
      secondaryBranch: "feat_rate_cutter",
      prNumber: "#24 - #28",
      mergeCommit: "e9bd19d",
      category: "core",
      summary: "Dynamic FAT/SNF rate matrix engine, Rate Cutter tool for precision degree adjustments, and AWS Amplify deployment setup.",
      headline: "Dynamic FAT/SNF Rate Matrix, Precision Rate Cutter & AWS Setup",
      stats: {
        commits: 12,
        modules: 5,
        breakingChanges: 0,
        schemaUpdates: 2,
      },
      architecture: [
        { label: "Rate Engine", value: "Continuous calculation of Fat %, SNF %, and CLR degree conversion" },
        { label: "Rate Cutter Tool", value: "Real-time deduction and step-matrix scaling for high-volume intake" },
        { label: "Cloud Deployment", value: "AWS Amplify continuous deployment configuration added" },
      ],
      features: [
        {
          title: "Dynamic FAT & SNF Rate Matrix",
          icon: Cpu,
          badge: "Core Algorithm",
          desc: "Configurable multi-tier rate matrix allowing village operators to set distinct pricing curves for Cow and Buffalo milk intake.",
        },
        {
          title: "Interactive Rate Cutter Module",
          icon: Zap,
          badge: "Pricing Tool",
          desc: "Fine-grained margin calculation allowing dairy cooperatives to adjust base rate tiers and deduction formulas in seconds.",
        },
        {
          title: "Modernized Auth & Login UX",
          icon: ShieldCheck,
          badge: "UI Redesign",
          desc: "Complete overhaul of login forms with animated transitions, password visibility toggles, and remembered sessions.",
        },
      ],
      commits: [
        { hash: "e9bd19d", message: "Merge pull request #28 from bakshay96/feat_rate_cutter", author: "bakshay96", date: "12 Oct 2026" },
        { hash: "38ce717", message: "new feature lunch rate cutter", author: "bakshay96", date: "12 Oct 2026" },
        { hash: "9136eb8", message: "improve login ui", author: "bakshay96", date: "10 Oct 2026" },
        { hash: "6b069b4", message: "added amplify.setup", author: "bakshay96", date: "08 Oct 2026" },
        { hash: "7d46c90", message: "added newer rate configuration dashboard", author: "bakshay96", date: "06 Oct 2026" },
      ],
    },
    {
      version: "v1.9.0",
      releaseDate: "September 2026",
      tag: "Support & CI/CD",
      isLatest: false,
      branch: "feat_supporttab_integration",
      secondaryBranch: "communication_update",
      prNumber: "#15 - #23",
      mergeCommit: "8d68119",
      category: "ui",
      summary: "In-app support ticket helpdesk, admin user analytics dashboard, dark/light theme engine, and GitHub Actions CI/CD automation.",
      headline: "In-App Support Ticket Desk, Theme Engine & GitHub Actions CI/CD",
      stats: {
        commits: 15,
        modules: 5,
        breakingChanges: 0,
        schemaUpdates: 1,
      },
      architecture: [
        { label: "Support Engine", value: "Ticket status workflow (Open, In Progress, Resolved) with attachments" },
        { label: "Theme System", value: "NextThemes with dark/light/system modes and zero flash of unstyled content" },
        { label: "CI/CD Pipeline", value: "Automated GitHub Actions build, test, and lint deployment verification" },
      ],
      features: [
        {
          title: "In-App Support Ticket Module",
          icon: Terminal,
          badge: "Helpdesk",
          desc: "Dairy operators can submit support queries directly from their portal with priority tags and real-time status tracking.",
        },
        {
          title: "System-Wide Dark / Light Mode",
          icon: Sparkles,
          badge: "Theme Engine",
          desc: "High-contrast dark mode tailored for evening milk collection shifts and bright light mode for daylight outdoor sunlight.",
        },
        {
          title: "GitHub Actions CI/CD Automation",
          icon: GitPullRequest,
          badge: "DevOps",
          desc: "Automated pull request linting, environment validation, and production build checks across all branches.",
        },
      ],
      commits: [
        { hash: "8d68119", message: "Merge pull request #23 from bakshay96/feat_supporttab_integration", author: "bakshay96", date: "28 Sep 2026" },
        { hash: "0e9d300", message: "UI improvement, update theme, added analytics ui for admin user, notification updation, and tracking tool", author: "bakshay96", date: "28 Sep 2026" },
        { hash: "292cd05", message: "Set up CI/CD pipeline", author: "bakshay96", date: "26 Sep 2026" },
        { hash: "d478fb9", message: "support module integration", author: "bakshay96", date: "24 Sep 2026" },
        { hash: "cb1a7f4", message: "Merge pull request #15 from bakshay96/communication_update", author: "bakshay96", date: "20 Sep 2026" },
      ],
    },
    {
      version: "v1.8.0",
      releaseDate: "Late August 2026",
      tag: "Master Superadmin Genesis",
      isLatest: false,
      branch: "ai-integration",
      secondaryBranch: "security-improvement",
      prNumber: "#12, #13, #14",
      mergeCommit: "7b5840f",
      category: "master",
      summary: "First introduction of the Master Superadmin portal, Razorpay subscription modal, master role seeding, and CodeQL security hardening.",
      headline: "Master Superadmin Portal, Razorpay Subscriptions & CodeQL Hardening",
      stats: {
        commits: 10,
        modules: 4,
        breakingChanges: 0,
        schemaUpdates: 2,
      },
      architecture: [
        { label: "Role Hierarchy", value: "MasterAdminModel distinct from AdminModel with global permissions" },
        { label: "Subscription Layer", value: "Initial Razorpay recurring payment orders and webhook listeners" },
        { label: "Security Fixes", value: "Mitigated CodeQL findings for clear-text logging and query injection" },
      ],
      features: [
        {
          title: "Master Superadmin Portal Launch",
          icon: Globe2,
          badge: "Major Milestone",
          desc: "Created the master admin portal at /master/dashboard to govern all tenant dairies, inspect subscription status, and manage platform health.",
        },
        {
          title: "Subscription Modal & Razorpay Orders",
          icon: CreditCard,
          badge: "Monetization",
          desc: "Integrated Razorpay subscription plans enabling dairy centers to pay platform SaaS fees digitally.",
        },
        {
          title: "CodeQL Security Audits & Remediation",
          icon: ShieldCheck,
          badge: "Security",
          desc: "Resolved sensitive data exposure in server logs, sanitized NoSQL object queries, and eliminated insecure pseudo-randomness.",
        },
      ],
      commits: [
        { hash: "7b5840f", message: "Merge pull request #12 from bakshay96/ai-integration", author: "bakshay96", date: "30 Aug 2026" },
        { hash: "0565b8b", message: "added master admin ui with subscription modal", author: "bakshay96", date: "29 Aug 2026" },
        { hash: "f34b1bc", message: "master role seeding", author: "bakshay96", date: "28 Aug 2026" },
        { hash: "a2ec537", message: "Merge pull request #14 from bakshay96/security-improvement", author: "bakshay96", date: "27 Aug 2026" },
      ],
    },
    {
      version: "v1.5.0",
      releaseDate: "August 2026",
      tag: "10-Day Automated Billing",
      isLatest: false,
      branch: "billing_update",
      secondaryBranch: null,
      prNumber: "#10, #11",
      mergeCommit: "0ac210f",
      category: "billing",
      summary: "First automated 10-day cycle billing engine (1-10, 11-20, 21-end), async billing alert emails, and shift safety locks.",
      headline: "Automated 10-Day Cycle Billing, Async Email Alerts & Shift Safety",
      stats: {
        commits: 8,
        modules: 3,
        breakingChanges: 0,
        schemaUpdates: 1,
      },
      architecture: [
        { label: "Billing Logic", value: "Three automated settlement cycles: 1–10, 11–20, 21–end" },
        { label: "Notification", value: "Asynchronous email dispatch via NodeMailer with background worker" },
        { label: "Shift Validation", value: "Safety verification preventing collection overwrites on closed shifts" },
      ],
      features: [
        {
          title: "Standard Rural 10-Day Cycle Billing",
          icon: Calendar,
          badge: "Cooperative Billing",
          desc: "Automated aggregation of milk deliveries into 10-day settlement sheets matching traditional Indian milk union cycles.",
        },
        {
          title: "Shift Closure Safety Guard",
          icon: Lock,
          badge: "Data Integrity",
          desc: "Prevents accidental modification or duplicate entries once morning or evening shift collection is finalized.",
        },
        {
          title: "Asynchronous Settlement Alert Emails",
          icon: BellIcon,
          badge: "Notifications",
          desc: "Non-blocking background email notifications dispatched to dairy owners upon billing cycle generation.",
        },
      ],
      commits: [
        { hash: "0ac210f", message: "Merge pull request #10 from bakshay96/billing_update", author: "bakshay96", date: "15 Aug 2026" },
        { hash: "0e1dc15", message: "feat: bill generation added, send msg, feat update", author: "bakshay96", date: "14 Aug 2026" },
        { hash: "544b230", message: "fix billing alert async call", author: "bakshay96", date: "13 Aug 2026" },
        { hash: "b9ce46e", message: "Merge pull request #11 from bakshay96/billing_update", author: "bakshay96", date: "12 Aug 2026" },
      ],
    },
    {
      version: "v1.2.0",
      releaseDate: "July 2026",
      tag: "Mobile UI Transformation",
      isLatest: false,
      branch: "mobile_ui_update",
      secondaryBranch: null,
      prNumber: "#5 - #9",
      mergeCommit: "7f1cdf9",
      category: "ui",
      summary: "Mobile-responsive layouts, touch-friendly milk entry tables, custom dairy logo branding, and shift closure mail service.",
      headline: "Mobile-Responsive Dashboards, Touch Milk Tables & Brand Logos",
      stats: {
        commits: 12,
        modules: 3,
        breakingChanges: 0,
        schemaUpdates: 1,
      },
      architecture: [
        { label: "Layout System", value: "Mobile responsive drawer navigation with Tailwind responsive breakpoints" },
        { label: "Logo Management", value: "Dairy center custom logo upload and brand personalization" },
      ],
      features: [
        {
          title: "Mobile-First Tablet & Smartphone UI",
          icon: Smartphone,
          badge: "Responsive",
          desc: "Adapted all desktop dashboards for rugged rural mobile browsers, allowing intake recording directly on tablets.",
        },
        {
          title: "Custom Dairy Brand Logo & Identity",
          icon: Store,
          badge: "White-labeling",
          desc: "Dairy owners can upload their cooperative emblem to brand their portal, statements, and receipts.",
        },
      ],
      commits: [
        { hash: "7f1cdf9", message: "Merge pull request #5 from bakshay96/mobile_ui_update", author: "bakshay96", date: "22 Jul 2026" },
        { hash: "e747f94", message: "added mobile friendly ui", author: "bakshay96", date: "21 Jul 2026" },
        { hash: "284d883", message: "update brand logo path", author: "bakshay96", date: "19 Jul 2026" },
        { hash: "4f0c34b", message: "mail services update", author: "bakshay96", date: "18 Jul 2026" },
      ],
    },
    {
      version: "v1.0.0",
      releaseDate: "June 2026",
      tag: "Genesis Production Release",
      isLatest: false,
      branch: "production_v1",
      secondaryBranch: "main (Initial)",
      prNumber: "#1 - #4",
      mergeCommit: "3c26bf1",
      category: "core",
      summary: "Genesis launch of Milkify. Core milk intake engine, cow and buffalo volume recording, Admin and Farmer authentication, and Mongoose schemas.",
      headline: "Genesis Launch: Precision Daily Milk Intake, Farmer Auth & Ledger Core",
      stats: {
        commits: 35,
        modules: 4,
        breakingChanges: 0,
        schemaUpdates: 3,
      },
      architecture: [
        { label: "Backend Core", value: "Node.js Express REST API connected to MongoDB Atlas" },
        { label: "Auth Framework", value: "Bcrypt salted passwords with JSON Web Tokens (JWT)" },
        { label: "Frontend Stack", value: "Next.js App Router with React and Tailwind CSS" },
        { label: "State Management", value: "Redux Toolkit for farmer rosters and collection tables" },
      ],
      features: [
        {
          title: "Daily Milk Collection Recording (Morning & Evening)",
          icon: Zap,
          badge: "Foundation",
          desc: "Fast intake form capturing farmer name, milk variety (Cow/Buffalo), liters, and Fat readings with keyboard-friendly workflows.",
        },
        {
          title: "Dual Role Portals (Admin & Farmer)",
          icon: Users,
          badge: "Authentication",
          desc: "Dedicated login portals for dairy owners and individual farmers to inspect daily collection logs and passbooks.",
        },
        {
          title: "Passbook Ledger & Payment Settlement",
          icon: FileText,
          badge: "Accounting",
          desc: "Comprehensive ledger tracking total liters logged, payments disbursed, and pending credit balances.",
        },
      ],
      commits: [
        { hash: "3c26bf1", message: "Merge pull request #1 from bakshay96/fullstack-update", author: "bakshay96", date: "28 Jun 2026" },
        { hash: "03bd25a", message: "production ready changes", author: "bakshay96", date: "26 Jun 2026" },
        { hash: "4876971", message: "added farmer dashboard", author: "bakshay96", date: "20 Jun 2026" },
        { hash: "02e499d", message: "user dashboard done", author: "bakshay96", date: "18 Jun 2026" },
        { hash: "c6902a1", message: "Initial commit", author: "bakshay96", date: "10 Jun 2026" },
      ],
    },
  ];

export default function VersionPage() {
  const [selectedVersionId, setSelectedVersionId] = useState("v2.5.0");
  const [activeTab, setActiveTab] = useState("features"); // 'features' | 'commits' | 'architecture'
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Filter releases by search or category
  const filteredReleases = useMemo(() => {
    return RELEASES.filter((rel) => {
      const matchesCategory = categoryFilter === "all" || rel.category === categoryFilter;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesCategory;
      const matchesSearch =
        rel.version.toLowerCase().includes(q) ||
        rel.branch.toLowerCase().includes(q) ||
        rel.headline.toLowerCase().includes(q) ||
        rel.features.some((f) => f.title.toLowerCase().includes(q) || f.desc.toLowerCase().includes(q)) ||
        rel.commits.some((c) => c.message.toLowerCase().includes(q) || c.hash.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [categoryFilter, searchQuery]);

  // Selected release object
  const selectedRelease = useMemo(() => {
    return RELEASES.find((r) => r.version === selectedVersionId) || RELEASES[0];
  }, [selectedVersionId]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-blue-500 selection:text-white font-sans transition-colors">
      {/* Top Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 dark:bg-slate-950/90 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3">
              <Brand className="scale-105" />
            </Link>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-xs font-bold font-mono">
              <GitBranch className="w-3.5 h-3.5" />
              <span>Git Branch &amp; Release History</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/dashboard">
              <Button variant="ghost" className="h-10 px-4 rounded-xl font-bold hidden sm:flex">
                Dairy Portal
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="h-10 px-4 rounded-xl font-bold border-slate-200 dark:border-slate-700">
                Home
              </Button>
            </Link>
            <Link href="/login?tab=register">
              <Button className="h-10 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-md shadow-blue-500/20 text-sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="py-12 sm:py-16 bg-gradient-to-b from-blue-50/60 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900/40 dark:to-slate-950 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-xs font-bold font-mono">
              <Zap className="w-3.5 h-3.5" />
              <span>MILKIFY RELEASES &bull; EVOLUTION TIMELINE</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Platform Releases &amp; Git Branch History
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Explore the complete evolutionary history of Milkify across 11 releases, 41+ merged pull requests, and 240+ production commits from Genesis to current.
            </p>

            {/* Quick telemetry metrics */}
            <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-center shadow-sm">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Releases</div>
                <div className="text-xl font-black text-blue-600 dark:text-blue-400 mt-0.5">11 Versions</div>
              </div>
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-center shadow-sm">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Git Commits</div>
                <div className="text-xl font-black text-purple-600 dark:text-purple-400 mt-0.5">240+ Commits</div>
              </div>
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-center shadow-sm">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Merged PRs</div>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">41 Merged</div>
              </div>
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-center shadow-sm">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Current Branch</div>
                <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5 font-mono text-sm sm:text-base">main (v2.5.0)</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Interactive Master-Detail Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Category Filter Pills & Search */}
        <div className="mb-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "all", label: "All Releases" },
              { id: "store", label: "E-Commerce & POS" },
              { id: "cloud", label: "AWS & Media" },
              { id: "billing", label: "Billing & Sprints" },
              { id: "master", label: "Master & Telemetry" },
              { id: "core", label: "Core Intake" },
              { id: "ui", label: "UI / Themes" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  categoryFilter === cat.id
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-blue-400"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search version, commit, branch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* 2-Column Grid: Left Vertical Bar + Right Release Detail View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Vertical Bar having Release Version Branches */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200/90 dark:border-slate-800/90 p-4 sm:p-5 shadow-xl lg:sticky lg:top-24 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Release Branches ({filteredReleases.length})
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">click to inspect</span>
            </div>

            {/* Vertical timeline tree */}
            <div className="relative pl-6 space-y-3.5 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-blue-600 before:via-purple-500 before:to-slate-300 dark:before:to-slate-800">
              {filteredReleases.map((rel) => {
                const isSelected = rel.version === selectedVersionId;
                return (
                  <button
                    key={rel.version}
                    onClick={() => {
                      setSelectedVersionId(rel.version);
                      setActiveTab("features");
                    }}
                    className={`relative w-full text-left p-3.5 rounded-2xl transition-all duration-200 flex flex-col gap-1.5 ${
                      isSelected
                        ? "bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-transparent border-2 border-blue-500/80 shadow-md ring-2 ring-blue-500/20"
                        : "bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/70 dark:border-slate-800/70 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100/70 dark:hover:bg-slate-900"
                    }`}
                  >
                    {/* Node Dot on vertical connector */}
                    <span
                      className={`absolute -left-[19px] top-4 w-3.5 h-3.5 rounded-full border-2 transition-all ${
                        isSelected
                          ? "bg-blue-600 border-white dark:border-slate-950 ring-4 ring-blue-500/30 scale-125"
                          : rel.isLatest
                          ? "bg-emerald-500 border-white dark:border-slate-950 animate-pulse"
                          : "bg-slate-300 dark:bg-slate-700 border-white dark:border-slate-950"
                      }`}
                    />

                    {/* Version & Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <span className={`font-mono font-black text-sm ${isSelected ? "text-blue-600 dark:text-blue-400" : "text-slate-900 dark:text-white"}`}>
                        {rel.version}
                      </span>
                      {rel.isLatest ? (
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          Latest
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {rel.releaseDate.split(" ")[0]}
                        </span>
                      )}
                    </div>

                    {/* Branch Name Tag */}
                    <div className="flex items-center gap-1.5 text-xs font-mono text-slate-600 dark:text-slate-400 truncate">
                      <GitBranch className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                      <span className="truncate">{rel.branch}</span>
                    </div>

                    {/* Headline snippet */}
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 leading-snug">
                      {rel.headline}
                    </p>

                    {/* Commit count & PR pill */}
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/60 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <GitCommit className="w-3 h-3 text-blue-500" />
                        {rel.stats.commits} commits
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        <GitPullRequest className="w-3 h-3 text-emerald-500" />
                        {rel.prNumber}
                      </span>
                      {isSelected && (
                        <ChevronRight className="w-3.5 h-3.5 ml-auto text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Detailed Release Showcase */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedRelease.version}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200/90 dark:border-slate-800/90 p-6 sm:p-8 shadow-xl space-y-6"
              >
                {/* Header Banner */}
                <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-slate-800">
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5 mb-2">
                      <span className="font-mono text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
                        {selectedRelease.version}
                      </span>
                      <span
                        className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full ${
                          selectedRelease.isLatest
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        {selectedRelease.tag}
                      </span>
                      <span className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg flex items-center gap-1.5 border border-slate-200/60 dark:border-slate-700/60">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {selectedRelease.releaseDate}
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-snug">
                      {selectedRelease.headline}
                    </h2>
                  </div>

                  {/* Git branch info pill */}
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 font-mono text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <GitBranch className="w-3.5 h-3.5 text-purple-500" />
                      <span>Branch:</span>
                      <strong className="text-slate-900 dark:text-white">{selectedRelease.branch}</strong>
                    </div>
                    {selectedRelease.secondaryBranch && (
                      <div className="text-[11px] text-slate-400">
                        + {selectedRelease.secondaryBranch}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span>PR: {selectedRelease.prNumber}</span>
                      <span>&bull;</span>
                      <span>Merge: {selectedRelease.mergeCommit}</span>
                    </div>
                  </div>
                </div>

                {/* Summary Box */}
                <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  <p>
                    <strong className="text-blue-700 dark:text-blue-300">Release Summary: </strong>
                    {selectedRelease.summary}
                  </p>
                </div>

                {/* Navigation Tabs inside the Release Detail */}
                <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-2">
                  {[
                    { id: "features", label: `Features & Highlights (${selectedRelease.features.length})`, icon: Sparkles },
                    { id: "commits", label: `Git Commits & PRs (${selectedRelease.commits.length})`, icon: GitCommit },
                    { id: "architecture", label: "Architecture & Schema Impact", icon: Layers },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                          activeTab === tab.id
                            ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Tab 1: Features & Capabilities */}
                {activeTab === "features" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      {selectedRelease.features.map((feat, idx) => {
                        const IconComponent = feat.icon;
                        return (
                          <div
                            key={idx}
                            className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 flex items-start gap-4 hover:border-blue-300 dark:hover:border-blue-700 transition-all"
                          >
                            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                              <IconComponent className="w-5 h-5" />
                            </div>
                            <div className="space-y-1.5 flex-1">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                                  {feat.title}
                                </h3>
                                {feat.badge && (
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                    {feat.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                {feat.desc}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Tab 2: Git Commits & PRs */}
                {activeTab === "commits" && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-slate-900 text-slate-200 font-mono text-xs space-y-3">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-slate-800">
                        <span>Commit Hash &bull; Author</span>
                        <span>Date &bull; Branch: {selectedRelease.branch}</span>
                      </div>
                      <div className="space-y-2.5">
                        {selectedRelease.commits.map((c) => (
                          <div key={c.hash} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 transition-colors">
                            <div className="flex items-center gap-2.5">
                              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold text-[11px]">
                                {c.hash}
                              </span>
                              <span className="text-slate-200 text-xs">{c.message}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 sm:text-right shrink-0">
                              <span>@{c.author}</span> &bull; <span>{c.date}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 3: Architecture & Schema Impact */}
                {activeTab === "architecture" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedRelease.architecture.map((item, idx) => (
                        <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.label}</div>
                          <div className="text-sm font-semibold text-slate-900 dark:text-white">{item.value}</div>
                        </div>
                      ))}
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">Release Metrics &amp; Blast Radius</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800">
                          <div className="text-xs text-slate-400">Total Commits</div>
                          <div className="text-lg font-black text-slate-900 dark:text-white mt-1">{selectedRelease.stats.commits}</div>
                        </div>
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800">
                          <div className="text-xs text-slate-400">Subsystems</div>
                          <div className="text-lg font-black text-blue-600 dark:text-blue-400 mt-1">{selectedRelease.stats.modules} Modules</div>
                        </div>
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800">
                          <div className="text-xs text-slate-400">Schema Updates</div>
                          <div className="text-lg font-black text-purple-600 dark:text-purple-400 mt-1">{selectedRelease.stats.schemaUpdates} Models</div>
                        </div>
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800">
                          <div className="text-xs text-slate-400">Breaking Changes</div>
                          <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">{selectedRelease.stats.breakingChanges}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer Action Bar */}
                <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Showing release documentation for <strong>{selectedRelease.version}</strong> ({selectedRelease.releaseDate})
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href="/dashboard">
                      <Button className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20">
                        Launch Dairy Admin <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 dark:bg-[#060a10] border-t border-slate-800/80 py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>&copy; 2026 Milkify Dairy Systems. Release Notes &amp; Versioning History.</p>
          <div className="flex items-center gap-4">
            <span className="font-mono text-slate-400">Current: v2.5.0</span>
            <span>&bull;</span>
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>&bull;</span>
            <Link href="/dashboard" className="hover:text-white transition-colors">Dairy Portal</Link>
            <span>&bull;</span>
            <Link href="/master/login" className="hover:text-white transition-colors">Master Portal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function BellIcon({ className }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}
