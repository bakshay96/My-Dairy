/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/lib/store";
import Brand from "@/components/ui/Brand";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/button";
import CinematicCanvas from "@/components/ui/CinematicCanvas";
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
  MapPin,
  Wallet,
  CircleDollarSign,
  ShoppingBag,
  QrCode,
  Play,
  Pause,
  Volume2,
  VolumeX,
} from "lucide-react";

// Rotating live statistics dataset with simultaneous typewriter animation
const liveStatsReel = [
  {
    title: "Live Society Milk Intake",
    metric: "64,280 L",
    sub: "Today's Intake Processed",
    detail: "48 Societies Active across 7 States",
    badge: "Intake Verified",
    color: "text-blue-400",
  },
  {
    title: "Village Farmer Passbooks",
    metric: "5,900+",
    sub: "Active Village Members",
    detail: "₹1.42 Cr Net Disbursed on Time",
    badge: "Instant Payout",
    color: "text-emerald-400",
  },
  {
    title: "Hyperlocal Village E-Stores",
    metric: "15 km",
    sub: "Doorstep Delivery Radius",
    detail: "Fresh Desi Ghee & Feed Dispatched",
    badge: "Store Active",
    color: "text-amber-300",
  },
  {
    title: "Co-Op Cloud Reliability",
    metric: "99.9%",
    sub: "Society Network Uptime",
    detail: "Tamper-Proof Society Audit Trails",
    badge: "Society Synced",
    color: "text-sky-400",
  },
];

export default function LandingPage() {
  const user = useAuthStore((state) => state.user);

  const [navVisible, setNavVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNavHovered, setIsNavHovered] = useState(false);
  const navHideTimerRef = useRef(null);

  const [activeStatIndex, setActiveStatIndex] = useState(0);
  const [typedTitle, setTypedTitle] = useState("Live Society Milk Intake");
  const [typedDetail, setTypedDetail] = useState("48 Societies Active across 7 States");
  const [milkType, setMilkType] = useState("cow");
  const [liters, setLiters] = useState(25);
  const [fat, setFat] = useState(4.2);
  const [snf, setSnf] = useState(8.5);
  const [selectedRole, setSelectedRole] = useState("admin");
  const [simulatedShift, setSimulatedShift] = useState("morning");
  const [slipPrinted, setSlipPrinted] = useState(false);
  const [broadcastSent, setBroadcastSent] = useState(false);
  const [activePlan, setActivePlan] = useState("pro");
  const [activeEcoService, setActiveEcoService] = useState(0);

  // Rural E-Commerce & Services state
  const [serviceCategory, setServiceCategory] = useState("all");
  const [activeCatalogTab, setActiveCatalogTab] = useState("dairy");
  const [simulatedRadius, setSimulatedRadius] = useState(10);
  const [simulatedMilkBalance, setSimulatedMilkBalance] = useState(4800);
  const [simulatedCartSpend, setSimulatedCartSpend] = useState(1450);
  const [posReceiptSimulated, setPosReceiptSimulated] = useState(false);
  const [activeOutletTab, setActiveOutletTab] = useState("storefront");
  const [cartAddedItem, setCartAddedItem] = useState(null);

  // Cinematic Operations Reel State
  const [cinematicPlaying, setCinematicPlaying] = useState(true);
  const [cinematicScene, setCinematicScene] = useState(0);
  const [cinematicMuted, setCinematicMuted] = useState(true);
  const [activeHeroService, setActiveHeroService] = useState(0);
  const videoRef = useRef(null);

  // Sync video play/pause with state
  const toggleMute = () => {
    if (videoRef.current) {
      const nextMuted = !videoRef.current.muted;
      videoRef.current.muted = nextMuted;
      setCinematicMuted(nextMuted);
      if (!nextMuted) {
        videoRef.current.volume = 1.0;
        videoRef.current.play().catch(() => { });
      }
    } else {
      setCinematicMuted((m) => !m);
    }
  };

  const togglePlay = () => {
    setCinematicPlaying((p) => !p);
  };

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = cinematicMuted;
    if (cinematicPlaying) {
      videoRef.current.play().catch(() => { });
    } else {
      videoRef.current.pause();
    }
  }, [cinematicPlaying, cinematicMuted]);

  // Ambient scene transition for fallback canvas
  useEffect(() => {
    if (!cinematicPlaying) return;
    const interval = setInterval(() => {
      setCinematicScene((s) => (s + 1) % 4);
    }, 6000);
    return () => clearInterval(interval);
  }, [cinematicPlaying]);

  const handleSimulatePosPrint = () => {
    setPosReceiptSimulated(true);
    setTimeout(() => setPosReceiptSimulated(false), 3000);
  };
  const handleSimulateCartAdd = (itemName) => {
    setCartAddedItem(itemName);
    setTimeout(() => setCartAddedItem(null), 2500);
  };

  // Advance live statistics reel every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStatIndex((prev) => (prev + 1) % liveStatsReel.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Simultaneous typewriter animation whenever activeStatIndex changes
  useEffect(() => {
    const targetTitle = liveStatsReel[activeStatIndex].title;
    const targetDetail = liveStatsReel[activeStatIndex].detail;

    setTypedTitle("");
    setTypedDetail("");

    let titleIdx = 0;
    let detailIdx = 0;

    const timer = setInterval(() => {
      let isDone = true;

      if (titleIdx <= targetTitle.length) {
        setTypedTitle(targetTitle.slice(0, titleIdx));
        titleIdx++;
        isDone = false;
      }

      if (detailIdx <= targetDetail.length) {
        setTypedDetail(targetDetail.slice(0, detailIdx));
        detailIdx++;
        isDone = false;
      }

      if (isDone) {
        clearInterval(timer);
      }
    }, 28);

    return () => clearInterval(timer);
  }, [activeStatIndex]);

  // Auto-hide transparent navbar after inactivity; reveal immediately on any activity (mouse, touch, key, scroll)
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      handleActivity();
    };

    const handleActivity = () => {
      setNavVisible(true);
      if (navHideTimerRef.current) {
        clearTimeout(navHideTimerRef.current);
      }
      if (!isNavHovered) {
        navHideTimerRef.current = setTimeout(() => {
          setNavVisible(false);
        }, 3000);
      }
    };

    const handleMouseMove = (e) => {
      // If cursor is near top of screen (within 80px), always reveal navbar
      if (e.clientY <= 80) {
        setNavVisible(true);
      }
      handleActivity();
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("touchstart", handleActivity, { passive: true });
    window.addEventListener("keydown", handleActivity, { passive: true });

    // Initial 3.5s auto-hide timer on page load
    navHideTimerRef.current = setTimeout(() => {
      if (!isNavHovered) {
        setNavVisible(false);
      }
    }, 3500);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchstart", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      if (navHideTimerRef.current) {
        clearTimeout(navHideTimerRef.current);
      }
    };
  }, [isNavHovered]);

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
      features: ["Custom branded URL slug", "Product catalog with stock", "Instant Inventory & Stock Sync", "Order tracking portal", "Coupon & promo system", "Category management"],
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
      features: ["15 km GPS geofence", "Smart Local Delivery Radius", "Auto delivery fee calc", "Free-shipping threshold", "Village cluster mapping", "COD + UPI support"],
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
      desc: "Central management console commanding all registered dairy centers — SaaS plans, regional cooperative activity, society announcements, and financial summaries.",
      features: ["Multi-tenant management", "Regional Member Insights", "SaaS subscription engine", "Broadcast announcements", "Ecosystem Overview", "Ticket resolution desk"],
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

  const sampleCatalog = {
    dairy: [
      { name: "Desi Cow Ghee (A2)", price: "₹650", unit: "500 ml jar", badge: "A2 Vedic Quality", stock: "In Stock (38 jars)", color: "text-amber-600 bg-amber-500/10 border-amber-500/20" },
      { name: "Daily Malai Paneer", price: "₹120", unit: "250 g block", badge: "Morning Fresh", stock: "In Stock (18 kg)", color: "text-blue-600 bg-blue-500/10 border-blue-500/20" },
      { name: "Traditional Curd (Dahi)", price: "₹45", unit: "500 g pouch", badge: "Probiotic Rich", stock: "In Stock (50 pouches)", color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20" },
      { name: "Creamy Buffalo Butter", price: "₹280", unit: "500 g pack", badge: "Farm Fresh", stock: "In Stock (22 packs)", color: "text-indigo-600 bg-indigo-500/10 border-indigo-500/20" },
    ],
    kirana: [
      { name: "Refined Sunflower Oil", price: "₹145", unit: "1 Liter pouch", badge: "Essential Kirana", stock: "In Stock (45 pcs)", color: "text-amber-600 bg-amber-500/10 border-amber-500/20" },
      { name: "Organic Toor Dal", price: "₹155", unit: "1 kg pack", badge: "Unpolished Grain", stock: "In Stock (60 kg)", color: "text-orange-600 bg-orange-500/10 border-orange-500/20" },
      { name: "Premium Basmati Rice", price: "₹320", unit: "5 kg bag", badge: "Village Wholesale", stock: "In Stock (30 bags)", color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20" },
      { name: "Farm Tea & Ground Spices", price: "₹95", unit: "250 g pack", badge: "Household Daily", stock: "In Stock (80 pcs)", color: "text-purple-600 bg-purple-500/10 border-purple-500/20" },
    ],
    farm: [
      { name: "Kapila Cattle Feed (50kg)", price: "₹1,450", unit: "50 kg sack", badge: "High Protein • 22%", stock: "In Stock (120 sacks)", color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20" },
      { name: "Chelated Mineral Mixture", price: "₹480", unit: "5 kg bucket", badge: "Yield Booster", stock: "In Stock (40 buckets)", color: "text-blue-600 bg-blue-500/10 border-blue-500/20" },
      { name: "Liquid Calcium with D3", price: "₹620", unit: "5 Liter can", badge: "Milk & Bone Care", stock: "In Stock (25 cans)", color: "text-cyan-600 bg-cyan-500/10 border-cyan-500/20" },
      { name: "High-Yield Fodder Seeds", price: "₹390", unit: "2 kg pouch", badge: "Fast Growth", stock: "In Stock (35 packs)", color: "text-amber-600 bg-amber-500/10 border-amber-500/20" },
    ],
  };

  const ruralServices = [
    {
      id: "outlet",
      category: "ecomm",
      icon: Store,
      badge: "VILLAGE E-COMMERCE OUTLET • ZERO CODING",
      badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
      accentColor: "blue",
      title: "Start Online Village Outlets & Accept Orders 24/7",
      desc: "Empower village farmers and dairy owners to launch an online digital storefront. Accept village orders 24/7 with instant WhatsApp alerts and custom QR stands for milk collection booths.",
      features: [
        "Branded online outlet URL (/store/[slug]) for every village dairy",
        "24/7 customer order intake with automated WhatsApp & SMS alerts",
        "Printable QR code stands for village counters & milk booths",
        "Direct-to-farmer or direct-to-customer mobile order tracking",
      ],
      interactiveType: "outlet_preview",
    },
    {
      id: "catalog",
      category: "catalog",
      icon: ShoppingBag,
      badge: "3-IN-1 RURAL COMMERCE CATALOG",
      badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
      accentColor: "amber",
      title: "Sell Milk Products, Village Kirana & Farm Nutrition",
      desc: "Expand revenue beyond raw milk. Sell high-margin value-added dairy (Paneer, Ghee, Curd), daily village Kirana essentials (Oil, Dal, Rice), and farm nutrition (Cattle feed sacks, Fertilizers).",
      features: [
        "Value-Added Dairy: Desi Ghee, Paneer, Curd, Butter & Pedha",
        "Village Kirana: Cooking oils, grains, lentils, tea, sugar & spices",
        "Farm & Cattle Feed: 50kg feed sacks, mineral mixtures, fodder seeds",
        "Flexible packaging units from 250g pouches to 50kg wholesale sacks",
      ],
      interactiveType: "catalog_tabs",
    },
    {
      id: "geofence",
      category: "delivery",
      icon: MapPin,
      badge: "HYPER-LOCAL LOGISTICS • 3 TO 15 KM",
      badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      accentColor: "emerald",
      title: "Precision GPS Geofencing for Village Home Delivery",
      desc: "Set precision delivery boundaries around your chilling center. Protect rural logistics by serving only verified village coordinates with automated delivery fee calculation.",
      features: [
        "Configurable 3 km to 15 km GPS delivery radius",
        "Smart distance engine for accurate delivery fee calculation",
        "Automatic delivery fee calculation or free delivery above threshold",
        "Prevents unserviceable remote delivery orders automatically",
      ],
      interactiveType: "geofence_slider",
    },
    {
      id: "wallet",
      category: "settlement",
      icon: Wallet,
      badge: "CASHLESS RURAL FINTECH • ZERO CASH BARRIER",
      badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
      accentColor: "purple",
      title: "Buy Kirana & Feed with Dairy Milk Balance",
      desc: "Daily milk collection earnings credit straight to the farmer's Milk-Pay wallet. Farmers buy feed and essentials instantly, auto-offsetting against their 10-day cooperative payout.",
      features: [
        "1-Click checkout using farmer's pending milk collection earnings",
        "Zero cash barrier — no trips to ATMs or village moneylenders",
        "Automated deduction from upcoming 10-day settlement cycle",
        "Instant bilingual SMS confirmation and passbook ledger update",
      ],
      interactiveType: "wallet_calc",
    },
    {
      id: "pos",
      category: "pos",
      icon: Printer,
      badge: "HYBRID COUNTER POS & THERMAL BILLING",
      badgeColor: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
      accentColor: "rose",
      title: "Walk-In Counter Billing with Instant Thermal Receipts",
      desc: "Fast counter POS with barcode scanning, keypad shortcuts, split payment (Cash + UPI + Milk-Pay wallet), and instant bilingual thermal receipt generation.",
      features: [
        "High-speed 80mm thermal receipts with regional Marathi and Hindi support",
        "Multi-mode split payments: Cash, PhonePe/GPay QR, and Milk-Pay wallet",
        "Unified stock sync between physical counter sales and online orders",
        "End-of-shift daily cash drawer audit and reconciliation",
      ],
      interactiveType: "pos_sim",
    },
    {
      id: "treasury",
      category: "settlement",
      icon: CircleDollarSign,
      badge: "COOPERATIVE TREASURY & AUDIT RECONCILIATION",
      badgeColor: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30",
      accentColor: "teal",
      title: "Automated Dairy-to-Store Cash Settlement",
      desc: "Direct synchronization between dairy milk disbursements and e-commerce store cashflows. Settle cash revenue into society bank accounts with 1-click cooperative audit exports.",
      features: [
        "Real-time settlement between store cash and dairy milk fund",
        "Farmer credit limit management and auto-reconciliation",
        "1-Click PDF/Excel export for cooperative committee meetings",
        "Enterprise data privacy and tamper-proof cooperative audit trails",
      ],
      interactiveType: "treasury_flow",
    },
  ];

  const filteredServices = serviceCategory === "all" ? ruralServices : ruralServices.filter((s) => s.category === serviceCategory);

  const heroServiceReel = [
    {
      id: "intake",
      title: "Precision Milk Intake",
      tagline: "Cow & Buffalo Fat/SNF in 4s",
      badge: "01 • VILLAGE INTAKE",
      image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80",
      quote: "Rapid milk weighing, automatic FAT/SNF rate calculation, and instant 80mm Devanagari thermal slips.",
      icon: Droplet,
      accent: "from-blue-600 to-sky-500",
      pill: "4-Sec Fast Desk",
    },
    {
      id: "ecomm",
      title: "Online Village Outlets",
      tagline: "Branded /store/[slug] Outlets",
      badge: "02 • DIGITAL OUTLETS",
      image: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=600&q=80",
      quote: "Every dairy gets an online digital storefront to accept orders for Desi Ghee, Paneer, and village Kirana 24/7.",
      icon: Store,
      accent: "from-amber-500 to-orange-500",
      pill: "24/7 Web Orders",
    },
    {
      id: "nutrition",
      title: "Cattle Feed & Nutrition",
      tagline: "50kg Feed & Mineral Care",
      badge: "03 • ANIMAL CARE",
      image: "https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&w=600&q=80",
      quote: "High-protein cattle feed bags, mineral mixtures, and fodder seeds delivered straight to the farmer's cowshed.",
      icon: ShoppingBag,
      accent: "from-emerald-500 to-teal-500",
      pill: "Zero-Cash Feed",
    },
    {
      id: "wallet",
      title: "Milk-Pay & 15km Delivery",
      tagline: "Cashless Pay & GPS Geofence",
      badge: "04 • CASHLESS FINTECH",
      image: "https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?auto=format&fit=crop&w=600&q=80",
      quote: "Farmers buy groceries using pending milk earnings. Smart GPS geofencing restricts deliveries within 15 km.",
      icon: Wallet,
      accent: "from-purple-600 to-indigo-600",
      pill: "15km Geofence",
    },
  ];

  const active = ecoServices[activeEcoService];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b12] text-slate-900 dark:text-slate-100 overflow-x-hidden font-sans relative selection:bg-blue-500 selection:text-white">

      {/* ── MILKIFY AMBIENT BACKGROUND THEME LAYER ───────── */}
      <div className="fixed inset-0 pointer-events-none -z-20 overflow-hidden">
        {/* Soft glowing dairy gradient blooms */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1200px] h-[650px] bg-gradient-to-b from-blue-500/10 via-sky-400/5 to-transparent rounded-full blur-[140px]" />
        <div className="absolute top-[30%] -left-32 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px]" />
        <div className="absolute top-[55%] -right-32 w-[650px] h-[650px] bg-purple-500/5 rounded-full blur-[130px]" />
        <div className="absolute bottom-10 left-1/3 w-[800px] h-[500px] bg-amber-500/5 rounded-full blur-[140px]" />

        {/* Subtle decorative milk drop SVGs in ambient corners */}
        <svg className="absolute top-28 left-8 w-24 h-24 text-blue-500/10 dark:text-blue-400/5 -rotate-12 transition-transform duration-700 hover:rotate-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
        </svg>
        <svg className="absolute top-[42%] right-10 w-28 h-28 text-emerald-500/10 dark:text-emerald-400/5 rotate-45 transition-transform duration-700 hover:rotate-12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
        </svg>
        <svg className="absolute top-[70%] left-12 w-28 h-28 text-purple-500/10 dark:text-purple-400/5 -rotate-45 transition-transform duration-700 hover:rotate-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
        </svg>
      </div>

      {/* ── Sticky Transparent Navigation with Inactivity Auto-Hide & Activity Reveal ── */}
      <header
        onMouseEnter={() => {
          setIsNavHovered(true);
          setNavVisible(true);
          if (navHideTimerRef.current) clearTimeout(navHideTimerRef.current);
        }}
        onMouseLeave={() => {
          setIsNavHovered(false);
          if (navHideTimerRef.current) clearTimeout(navHideTimerRef.current);
          navHideTimerRef.current = setTimeout(() => setNavVisible(false), 2500);
        }}
        onFocus={() => {
          setIsNavHovered(true);
          setNavVisible(true);
          if (navHideTimerRef.current) clearTimeout(navHideTimerRef.current);
        }}
        onBlur={() => {
          setIsNavHovered(false);
          if (navHideTimerRef.current) clearTimeout(navHideTimerRef.current);
          navHideTimerRef.current = setTimeout(() => setNavVisible(false), 2500);
        }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out ${navVisible
            ? "translate-y-0 opacity-100 pointer-events-auto"
            : "-translate-y-full opacity-0 pointer-events-none"
          } ${isScrolled
            ? "backdrop-blur-xl bg-white/85 dark:bg-slate-950/85 shadow-lg shadow-black/5 border-b border-slate-200/60 dark:border-slate-800/60"
            : "backdrop-blur-md bg-black/25 dark:bg-black/35 border-b border-white/10"
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <Brand textClassName={isScrolled ? "text-slate-900 dark:text-white" : "text-white drop-shadow-md font-black"} />
          </Link>

          <nav className={`hidden lg:flex items-center gap-1 text-sm font-semibold transition-colors ${isScrolled ? "text-slate-700 dark:text-slate-300" : "text-slate-200"}`}>
            {[
              { href: "#services", label: "Our Services" },
              { href: "#ecosystem", label: "Ecosystem" },
              { href: "#features", label: "Features" },
              { href: "#roles", label: "Workspaces" },
              { href: "#pricing", label: "Pricing" },
            ].map((link) => (
              <a key={link.href} href={link.href} className={`px-3 py-1.5 rounded-lg transition-all duration-200 ${isScrolled ? "hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-blue-600 dark:hover:text-blue-400" : "hover:bg-white/10 hover:text-white"}`}>
                {link.label}
              </a>
            ))}
            <Link href="/version" className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${isScrolled ? "hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-600 dark:text-amber-400" : "hover:bg-white/10 text-amber-300"}`}>
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
                  <Button variant="ghost" className={`h-9 px-4 rounded-xl font-bold text-sm hidden sm:flex ${isScrolled ? "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800" : "text-white hover:bg-white/10"}`}>
                    Sign In
                  </Button>
                </Link>
                <Link href="/login">
                  <Button className="h-9 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-lg shadow-blue-500/20 text-sm">
                    Get Started
                  </Button>
                </Link>
                <Link href="/master/login" className="hidden md:flex">
                  <Button variant="outline" className={`h-9 px-3 rounded-xl text-xs font-bold ${isScrolled ? "border-slate-300 dark:border-slate-700" : "border-white/20 bg-black/40 text-white hover:bg-black/60"}`}>
                    <Lock className="h-3.5 w-3.5 mr-1.5 text-purple-400" /> Master
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO (FULL SCREEN, FULL WIDTH & FULL HEIGHT CINEMATIC VIDEO) ─────────────────────────────────────────── */}
      <section className="relative w-full min-h-[92vh] sm:min-h-screen flex flex-col justify-between overflow-hidden bg-slate-950 text-white group select-none">
        {/* Full-bleed Edge-to-Edge Responsive HTML5 Cinematic Video */}
        <video
          ref={videoRef}
          autoPlay
          loop
          muted={cinematicMuted}
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 pointer-events-none"
        >
          <source src="/videos/Milkify_Uplifting_Dairy_Digitally.mp4" type="video/mp4" />
        </video>

        {/* Generative fallback visual canvas behind video if video is loading or buffering */}
        <CinematicCanvas scene={cinematicScene} isPlaying={cinematicPlaying} className="opacity-30 pointer-events-none" />

        {/* Soft, Transparent Ambient Vignette (Keeps Video Fully Visible) */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-transparent to-slate-950/70 pointer-events-none" />

        {/* Top spacer for navbar clearance */}
        <div className="pt-20 sm:pt-24" />

        {/* Top-Right Audio & Video Controls (Mute/Unmute & Play/Pause) */}
        <div className="absolute top-20 sm:top-24 right-4 sm:right-8 z-30 flex items-center gap-2">
          <button
            type="button"
            onClick={toggleMute}
            aria-label={cinematicMuted ? "Unmute video sound" : "Mute video sound"}
            title={cinematicMuted ? "Unmute video sound" : "Mute video sound"}
            className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-xl border border-white/20 text-white flex items-center justify-center transition-all shadow-xl hover:scale-105 active:scale-95"
          >
            {cinematicMuted ? (
              <VolumeX className="h-5 w-5 text-slate-300" />
            ) : (
              <Volume2 className="h-5 w-5 text-emerald-400 animate-pulse" />
            )}
          </button>
          <button
            type="button"
            onClick={togglePlay}
            aria-label={cinematicPlaying ? "Pause video" : "Play video"}
            title={cinematicPlaying ? "Pause video" : "Play video"}
            className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-xl border border-white/20 text-white flex items-center justify-center transition-all shadow-xl hover:scale-105 active:scale-95"
          >
            {cinematicPlaying ? (
              <Pause className="h-5 w-5 text-slate-300" />
            ) : (
              <Play className="h-5 w-5 text-emerald-400" />
            )}
          </button>
        </div>

        {/* Transparent Live Statistics Overlay with Simultaneous Typing Animation (Right Side Over Video) */}
        <div className="absolute right-4 sm:right-6 lg:right-8 top-1/2 -translate-y-1/2 z-20 hidden md:flex flex-col gap-2.5 p-4 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/15 shadow-2xl max-w-[230px] text-left pointer-events-auto transition-all hover:bg-black/60 group/stat">
          {/* Header pill with live pulse & rotating badge */}
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-300">
                Live Statistics
              </span>
            </div>
            <span className="text-[9px] font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
              {liveStatsReel[activeStatIndex].badge}
            </span>
          </div>

          {/* Metric with animated color */}
          <div className="space-y-1">
            <div className="flex items-baseline justify-between gap-1">
              <span className={`text-2xl font-black tracking-tight ${liveStatsReel[activeStatIndex].color}`}>
                {liveStatsReel[activeStatIndex].metric}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                0{activeStatIndex + 1}/0{liveStatsReel.length}
              </span>
            </div>

            {/* Typewritten Title with cursor */}
            <div className="text-xs font-bold text-white leading-tight min-h-[16px] flex items-center">
              <span>{typedTitle}</span>
              <span className="inline-block w-1.5 h-3 bg-blue-400 ml-0.5 animate-pulse" />
            </div>

            {/* Subtitle */}
            <div className="text-[10px] text-slate-300 font-medium">
              {liveStatsReel[activeStatIndex].sub}
            </div>

            {/* Typewritten Detail with cursor */}
            <div className="pt-1.5 mt-1 border-t border-white/10 text-[10px] text-slate-300 font-mono leading-snug min-h-[28px] flex items-start">
              <span>{typedDetail}</span>
              <span className="inline-block w-1 h-2.5 bg-emerald-400 ml-0.5 shrink-0 animate-pulse mt-0.5" />
            </div>
          </div>

          {/* Slide Indicator Dots */}
          <div className="flex items-center gap-1.5 pt-1">
            {liveStatsReel.map((_, dotIdx) => (
              <button
                key={dotIdx}
                type="button"
                onClick={() => setActiveStatIndex(dotIdx)}
                className={`h-1 rounded-full transition-all duration-300 ${dotIdx === activeStatIndex ? "w-4 bg-emerald-400" : "w-1 bg-white/20 hover:bg-white/40"
                  }`}
                title={`View slide ${dotIdx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Action Buttons Revealed When User Cursor is Active Over Video */}
        <div className="relative z-20 max-w-5xl mx-auto px-4 text-center mt-auto mb-10 transition-all duration-300 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 sm:group-hover:translate-y-0 sm:translate-y-2 pointer-events-auto">
          <div className="flex flex-wrap items-center justify-center gap-3.5">
            <Link href="/login" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto h-11 sm:h-12 px-7 rounded-xl bg-gradient-to-r from-blue-600 via-sky-500 to-blue-700 hover:from-blue-700 hover:to-sky-700 text-white text-sm font-extrabold shadow-2xl shadow-blue-500/40 flex items-center justify-center gap-2 backdrop-blur-md">
                Launch Dairy Admin <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#services" className="w-full sm:w-auto">
              <Button
                variant="outline"
                className="w-full sm:w-auto h-11 sm:h-12 px-6 rounded-xl border border-white/25 bg-black/50 hover:bg-black/75 text-white font-extrabold backdrop-blur-xl flex items-center justify-center gap-2 text-sm shadow-xl"
              >
                Explore Services <ChevronDown className="h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>

        {/* Discreet Bottom Bar: Live Operations Status */}
        <div className="relative z-10 w-full px-4 sm:px-8 pb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-xs font-semibold text-slate-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span>Live Cooperative Dairy Network</span>
          </div>
        </div>
      </section>

      {/* ── CORE VILLAGE PILLARS & LIVE DASHBOARD REEL ─────────────────────────────────────────── */}
      <section className="py-10 sm:py-14 bg-white dark:bg-[#070b12] border-t border-slate-200/80 dark:border-slate-800/80 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ── WHAT SERVICES WE CURRENTLY PROVIDE: LIVE VISUAL REEL ──── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-0 text-left w-full max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  WHAT SERVICES WE CURRENTLY PROVIDE
                </span>
                <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">&bull; Click any card to explore</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/20">
                4 Core Village Pillars
              </span>
            </div>

            {/* 4 Interactive Service Cards with Real Dairy Images */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {heroServiceReel.map((svc, idx) => {
                const isActive = activeHeroService === idx;
                return (
                  <div
                    key={svc.id}
                    onClick={() => setActiveHeroService(idx)}
                    className={`group cursor-pointer rounded-2xl overflow-hidden border-2 transition-all duration-300 relative bg-white dark:bg-slate-900 shadow-md flex flex-col justify-between ${isActive
                      ? "border-blue-500 ring-4 ring-blue-500/20 scale-[1.02] shadow-xl"
                      : "border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:scale-[1.01]"
                      }`}
                  >
                    {/* Image header with gradient overlay */}
                    <div className="h-28 sm:h-32 w-full relative overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <img
                        src={svc.image}
                        alt={svc.title}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80";
                        }}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                      <div className="absolute top-2 left-2">
                        <span className="text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-md bg-black/60 text-white backdrop-blur-md border border-white/20">
                          {svc.badge}
                        </span>
                      </div>
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white">
                        <span className="text-xs font-black drop-shadow-sm line-clamp-1">{svc.title}</span>
                        <span className="text-[9px] font-bold bg-white/20 backdrop-blur-md px-1.5 py-0.5 rounded-sm shrink-0">
                          {svc.pill}
                        </span>
                      </div>
                    </div>

                    {/* Card Content & Quote */}
                    <div className="p-3 flex flex-col justify-between flex-1 bg-white/95 dark:bg-slate-900/95">
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-snug line-clamp-2">
                        {svc.quote}
                      </p>
                      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-bold">
                        <span className={isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}>
                          {svc.tagline}
                        </span>
                        <ArrowRight className={`h-3 w-3 transition-transform ${isActive ? "text-blue-500 translate-x-1" : "text-slate-400"}`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Stat strip (Full Width & Responsive) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.45 }}
            className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-7xl mx-auto">
            {[
              { label: "Active Dairy Centers", val: "48+", icon: "🏪" },
              { label: "Daily Milk Processed", val: "64K L", icon: "🥛" },
              { label: "Farmers Registered", val: "5,900+", icon: "👨‍🌾" },
              { label: "Platform Uptime", val: "99.9%", icon: "⚡" },
            ].map((s) => (
              <div key={s.label} className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 text-center shadow-xs">
                <div className="text-xl mb-1">{s.icon}</div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{s.val}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{s.label}</div>
              </div>
            ))}
          </motion.div>

          {/* Live dashboard preview bar (Full Width & Responsive) */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-8 sm:mt-10 w-full max-w-7xl mx-auto">
            <div className="rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-700/50 shadow-2xl bg-white dark:bg-slate-900/90 backdrop-blur-xl">
              {/* Window chrome */}
              <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="ml-3 text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Lock className="h-3 w-3 text-emerald-500" />
                  milkify.app/dashboard &bull; Anand Dairy Society
                </span>
                <span className="ml-auto flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Session
                </span>
              </div>
              {/* Dashboard metrics preview */}
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { label: "Today's Intake", val: "1,480.50 L", sub: "↑ 8.4% from yesterday", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/40", icon: "💧" },
                    { label: "Active Farmers", val: "124", sub: "100% passbook synced", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40", icon: "👥" },
                    { label: "Fat / SNF Quality", val: "4.2 / 8.6", sub: "Grade A Premium", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/40", icon: "🧪" },
                    { label: "Cycle Payout", val: "₹3,42,800", sub: "Cycle 1 Auto-settled", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40", icon: "💰" },
                  ].map((m) => (
                    <div key={m.label} className={`p-3.5 rounded-2xl ${m.bg} text-left`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{m.label}</span>
                        <span className="text-base">{m.icon}</span>
                      </div>
                      <div className={`text-lg sm:text-xl font-black ${m.color}`}>{m.val}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">{m.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── OUR SERVICES: RURAL E-COMMERCE & BEYOND DAIRY PLATFORM ────── */}
      <section id="services" className="py-12 sm:py-16 relative overflow-hidden bg-white/70 dark:bg-slate-900/50 border-t border-slate-200/80 dark:border-slate-800/60">
        {/* Section ambient background blooms */}
        <div className="absolute inset-0 pointer-events-none -z-10">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[950px] h-[550px] bg-gradient-to-br from-blue-500/10 via-emerald-500/10 to-amber-500/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider mb-4 font-mono shadow-sm">
              <Store className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
              <span>NEW EXPANSION &bull; RURAL E-COMMERCE &amp; VILLAGE SERVICES</span>
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Our Services:{" "}
              <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-blue-600 bg-clip-text text-transparent">
                Beyond Raw Milk
              </span>
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-400 mt-4 font-medium max-w-2xl mx-auto leading-relaxed">
              Empowering village farmers and dairy cooperatives to start online businesses, sell value-added milk products, Kirana groceries, and cattle feed with GPS geofencing and zero-cash dairy wallet settlement.
            </p>

            {/* Interactive Category Filter Pills */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2 p-1.5 bg-slate-100/90 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-3xl mx-auto shadow-inner">
              {[
                { id: "all", label: "All Services", icon: Layers },
                { id: "ecomm", label: "Village Outlets", icon: Store },
                { id: "catalog", label: "Milk & Kirana Catalog", icon: ShoppingBag },
                { id: "delivery", label: "GPS Geofencing", icon: MapPin },
                { id: "settlement", label: "Dairy Wallet & Settlement", icon: Wallet },
                { id: "pos", label: "Counter POS", icon: Printer },
              ].map((cat) => {
                const Icon = cat.icon;
                const isActive = serviceCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setServiceCategory(cat.id)}
                    className={`px-3.5 py-2 text-xs font-extrabold rounded-xl transition-all duration-200 flex items-center gap-1.5 ${isActive
                      ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-md shadow-black/5 ring-1 ring-blue-500/20"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Service Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="group rounded-3xl p-6 sm:p-7 bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-lg hover:shadow-2xl hover:border-blue-500/50 dark:hover:border-blue-400/50 transition-all duration-300 flex flex-col justify-between relative overflow-hidden backdrop-blur-md hover:-translate-y-1.5"
              >
                {/* Glow accent */}
                <div className={`absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl pointer-events-none -z-10 transition-opacity duration-300 opacity-20 group-hover:opacity-40 ${service.accentColor === "blue" ? "bg-blue-500" :
                  service.accentColor === "amber" ? "bg-amber-500" :
                    service.accentColor === "emerald" ? "bg-emerald-500" :
                      service.accentColor === "purple" ? "bg-purple-500" :
                        service.accentColor === "rose" ? "bg-rose-500" : "bg-teal-500"
                  }`} />

                <div>
                  {/* Badge & Icon header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-black uppercase tracking-wider border ${service.badgeColor}`}>
                      {service.badge}
                    </span>
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${service.accentColor === "blue" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" :
                      service.accentColor === "amber" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" :
                        service.accentColor === "emerald" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" :
                          service.accentColor === "purple" ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" :
                            service.accentColor === "rose" ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" :
                              "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20"
                      }`}>
                      <service.icon className="h-5 w-5" />
                    </div>
                  </div>

                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-snug mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {service.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium mb-4">
                    {service.desc}
                  </p>

                  {/* Interactive Embedded Demonstration Widget */}
                  <div className="my-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                    {/* Widget 1: Outlet Preview */}
                    {service.interactiveType === "outlet_preview" && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase">
                            Simulate Village Digital Outlet
                          </span>
                          <div className="flex gap-1">
                            {["storefront", "qr"].map((tab) => (
                              <button
                                key={tab}
                                type="button"
                                onClick={() => setActiveOutletTab(tab)}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${activeOutletTab === tab
                                  ? "bg-blue-600 text-white shadow-sm"
                                  : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                                  }`}
                              >
                                {tab === "storefront" ? "Storefront View" : "Village Stand QR"}
                              </button>
                            ))}
                          </div>
                        </div>

                        {activeOutletTab === "storefront" ? (
                          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-700/80 shadow-sm space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                                <Store className="h-3.5 w-3.5 text-blue-600" />
                                <span>Anand Village Dairy &amp; Kirana</span>
                              </span>
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                Open &bull; 15km Delivery
                              </span>
                            </div>
                            <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                              milkify.app/store/anand-cooperative
                            </div>
                            <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                              <span>34 Orders Today</span>
                              <span className="text-amber-500 font-bold">4.9 ★ (182 Reviews)</span>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-700/80 shadow-sm flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400">
                              <QrCode className="h-7 w-7" />
                            </div>
                            <div className="text-[11px] leading-tight">
                              <div className="font-bold text-slate-900 dark:text-white">Printable QR Stand</div>
                              <div className="text-[10px] text-slate-500 mt-0.5">Scan to order Pure Milk, Kirana &amp; Feed via PhonePe / UPI</div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Widget 2: Multi-Category Catalog Tabs */}
                    {service.interactiveType === "catalog_tabs" && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase">
                            Explore 3-in-1 Catalog
                          </span>
                          {cartAddedItem && (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 animate-pulse">
                              ✓ Added!
                            </span>
                          )}
                        </div>

                        {/* Category Selector */}
                        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-200/70 dark:bg-slate-900 rounded-xl">
                          {[
                            { id: "dairy", label: "🥛 Dairy" },
                            { id: "kirana", label: "🌾 Kirana" },
                            { id: "farm", label: "🚜 Feed" },
                          ].map((tab) => (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => setActiveCatalogTab(tab.id)}
                              className={`py-1 text-[10px] font-extrabold rounded-lg transition-all ${activeCatalogTab === tab.id
                                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                                }`}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>

                        {/* Sample products list */}
                        <div className="grid grid-cols-2 gap-2">
                          {sampleCatalog[activeCatalogTab].slice(0, 2).map((item) => (
                            <div
                              key={item.name}
                              className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 text-left flex flex-col justify-between"
                            >
                              <div>
                                <div className="text-[11px] font-bold text-slate-900 dark:text-white leading-tight line-clamp-1">
                                  {item.name}
                                </div>
                                <div className="text-[10px] text-slate-500 mt-0.5">{item.unit}</div>
                              </div>
                              <div className="mt-2 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                                  {item.price}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleSimulateCartAdd(item.name)}
                                  className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition-colors"
                                >
                                  + Order
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Widget 3: GPS Geofence Range Slider */}
                    {service.interactiveType === "geofence_slider" && (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase">
                            Adjust Delivery Boundary
                          </span>
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                            {simulatedRadius} km Radius
                          </span>
                        </div>

                        <input
                          type="range"
                          min={3}
                          max={15}
                          step={1}
                          value={simulatedRadius}
                          onChange={(e) => setSimulatedRadius(Number(e.target.value))}
                          className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 text-center">
                            <span className="text-[9px] font-bold text-slate-500 block uppercase">Coverage Area</span>
                            <span className="text-xs font-black text-slate-900 dark:text-white">
                              ~{Math.round(Math.PI * simulatedRadius * simulatedRadius)} km²
                            </span>
                            <span className="text-[9px] text-slate-400 block mt-0.5">
                              ~{Math.min(18, Math.max(3, Math.round(simulatedRadius * 0.9)))} Villages
                            </span>
                          </div>
                          <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 text-center">
                            <span className="text-[9px] font-bold text-slate-500 block uppercase">Delivery Duration</span>
                            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                              ~{15 + simulatedRadius * 2} mins
                            </span>
                            <span className="text-[9px] text-slate-400 block mt-0.5">
                              {simulatedRadius <= 5 ? "FREE Delivery" : `Fee: ₹${simulatedRadius * 2}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Widget 4: Dairy Wallet Settlement Calculator */}
                    {service.interactiveType === "wallet_calc" && (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-mono font-bold text-slate-500 dark:text-slate-400 uppercase">
                            Milk Earnings: ₹{simulatedMilkBalance.toLocaleString()}
                          </span>
                          <span className="font-bold text-purple-600 dark:text-purple-400">
                            Cart: ₹{simulatedCartSpend.toLocaleString()}
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <input
                            type="range"
                            min={2000}
                            max={10000}
                            step={200}
                            value={simulatedMilkBalance}
                            onChange={(e) => setSimulatedMilkBalance(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                          />
                          <input
                            type="range"
                            min={300}
                            max={3500}
                            step={50}
                            value={simulatedCartSpend}
                            onChange={(e) => setSimulatedCartSpend(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                          />
                        </div>

                        <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                            <span>Kirana / Feed Deducted:</span>
                            <span className="text-rose-500">-₹{simulatedCartSpend.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs font-black text-slate-900 dark:text-white pt-1 border-t border-slate-100 dark:border-slate-800">
                            <span>Net Milk Bank Payout:</span>
                            <span className="text-emerald-600 dark:text-emerald-400">
                              ₹{Math.max(0, simulatedMilkBalance - simulatedCartSpend).toLocaleString()}
                            </span>
                          </div>
                          <div className="text-[9px] font-bold text-purple-600 dark:text-purple-400 pt-0.5">
                            ✨ Zero Cash Needed &bull; Auto 10-Day Ledger Offset
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Widget 5: Counter POS & 80mm Print */}
                    {service.interactiveType === "pos_sim" && (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase">
                            Counter Split Payment
                          </span>
                          <span className="text-[10px] font-bold text-rose-500">
                            Walk-in Cart: ₹1,450
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-1 text-[9px] font-bold text-center">
                          <span className="p-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            Cash: ₹450
                          </span>
                          <span className="p-1 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            UPI QR: ₹380
                          </span>
                          <span className="p-1 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            MilkPay: ₹620
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={handleSimulatePosPrint}
                          className="w-full py-1.5 px-3 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Printer className="h-3.5 w-3.5 text-rose-400" />
                          <span>{posReceiptSimulated ? "🧾 Slip Dispatched!" : "Simulate 80mm Receipt"}</span>
                        </button>
                      </div>
                    )}

                    {/* Widget 6: Treasury Flow */}
                    {service.interactiveType === "treasury_flow" && (
                      <div className="space-y-2">
                        <div className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center justify-between">
                          <span>Society Treasury Settlement</span>
                          <span className="text-teal-600 dark:text-teal-400 font-bold">100% Audit Ready</span>
                        </div>

                        <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1.5 text-[10px]">
                          <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                            <span>Store E-Comm Sales:</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">+₹18,500</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                            <span>Farmer Feed Loan Offset:</span>
                            <span className="font-bold text-amber-600 dark:text-amber-400">-₹4,200</span>
                          </div>
                          <div className="flex items-center justify-between font-black text-slate-900 dark:text-white pt-1 border-t border-slate-100 dark:border-slate-800">
                            <span>Net Dairy Treasury Balance:</span>
                            <span className="text-teal-600 dark:text-teal-400">+₹14,300</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Capabilities List */}
                  <div className="space-y-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      What This Service Provides:
                    </div>
                    {service.features.map((feat) => (
                      <div key={feat} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="leading-tight">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-3">
                  <Link href="/login" className="block">
                    <Button
                      variant="outline"
                      className="w-full h-9 rounded-xl text-xs font-bold border-slate-300 dark:border-slate-700 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center gap-1.5 transition-all shadow-sm group-hover:bg-blue-50/50 dark:group-hover:bg-blue-950/30"
                    >
                      <span>Launch This Service</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ECOSYSTEM HUB ─────────────────────────────────── */}
      <section id="ecosystem" className="py-12 sm:py-16 relative">
        <div className="absolute inset-0 pointer-events-none -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-blue-600/5 via-purple-600/5 to-emerald-600/5 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section heading */}
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
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
      <section id="features" className="py-12 sm:py-16 bg-white dark:bg-slate-900/60 border-t border-b border-slate-200/80 dark:border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
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
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Instant Storefront Live Sync</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Real-time updates immediately reflect product availability, fresh batches, and customer orders across all village counters and customer phones.
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                <CheckCircle2 className="h-4 w-4" /> Zero-refresh live sync
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── INTERACTIVE WORKSPACES ─────────────────────────── */}
      <section id="roles" className="py-12 sm:py-16 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
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
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">Central management console for dairy cooperatives — society performance, member benefits, urgent village alerts, and financial health.</p>
                      <ul className="space-y-3 mt-6 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {["Society Directory: Unified view of all dairy centers & farmers", "Regional Network: Village cluster & member verification", "Cooperative Plans: Flexible society tiers & member vouchers", "Ecosystem Overview: Complete operational roadmap"].map(f => (
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
                        <div className="text-xs font-bold text-slate-400 uppercase">Cooperative Network Health</div>
                        <div className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mt-0.5">
                          Platform Health: 100% Operational
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">48 Active Dairies</span>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {[["Daily Platform Milk", "64,280 L", "Across 48 Centers", "text-slate-900 dark:text-white", "text-emerald-500"], ["Monthly Revenue", "₹1,42,000", "Society Collections", "text-emerald-600 dark:text-emerald-400", "text-blue-500"], ["Active Members", "5,900+", "Across 7 States", "text-purple-600 dark:text-purple-400", "text-slate-400"]].map(([label, val, sub, valCls, subCls]) => (
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
                          <div className="text-xs font-bold text-slate-900 dark:text-white">Dispatch Society Announcement</div>
                          <div className="text-[11px] text-slate-500">Broadcast instantly to all 48 dairy collection centers</div>
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
                        <span>📢 &quot;Annual Society Bonus Announcement Scheduled&quot; → 48 Village Centers</span>
                        <span className="font-bold">Broadcasted</span>
                      </motion.div>
                    )}

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 font-medium">
                      <span>Security: <strong>Bank-Grade Cooperative</strong> Data Isolation</span>
                      <Link href="/master/login" className="text-purple-600 dark:text-purple-400 font-bold hover:underline flex items-center gap-1">
                        Open Operations Guide <ChevronRight className="h-3.5 w-3.5" />
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
      <section className="py-12 sm:py-16 bg-gradient-to-b from-white to-blue-50/40 dark:from-slate-900 dark:to-slate-950 border-t border-slate-200/80 dark:border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
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
      <section className="py-12 sm:py-16 border-t border-slate-200/80 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
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
              { icon: Tag, label: "Promotional Coupons & Live Sync", desc: "Admins launch festive coupon campaigns with custom expiry. Any inventory or coupon change updates customer storefront tabs instantly across all devices.", badge: "Instant Store Sync", color: "rose", emoji: "🎁" },
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

      {/* ── PRICING & FUTURE PLANS (COMING SOON) ──────────── */}
      <section id="pricing" className="py-10 sm:py-14 bg-white dark:bg-slate-900/40 border-t border-slate-200/80 dark:border-slate-800/60 relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute inset-0 pointer-events-none -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-br from-blue-600/5 via-indigo-600/5 to-purple-600/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-wider mb-2 font-mono">
              <Zap className="h-3 w-3 text-amber-500" />
              <span>PLANS COMING SOON &bull; EARLY ONBOARDING</span>
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Predictable Plans for Modern Dairies
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5 max-w-xl mx-auto font-medium">
              We are finalizing cooperative-friendly pricing. Explore what each dedicated tier provides and pre-register your dairy society for early access.
            </p>

            {/* Interactive Category Selector Pill */}
            <div className="mt-4 inline-flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner">
              {[
                { id: "free_trial", label: "Free Trial Plan", emoji: "🌱" },
                { id: "pro", label: "Pro Plan", emoji: "⭐" },
                { id: "pro_plus", label: "Pro ++ Plan", emoji: "👑" },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActivePlan(p.id)}
                  className={`px-3.5 sm:px-4 py-1.5 text-xs font-extrabold rounded-lg transition-all duration-200 flex items-center gap-1.5 ${activePlan === p.id
                    ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm scale-102"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                >
                  <span>{p.emoji}</span>
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Pricing Cards Grid (Clean, Compact Single-Screen Fit) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch max-w-6xl mx-auto">
            {[
              {
                id: "free_trial",
                tier: "Free Trial Plan",
                label: "Starter Exploration",
                tagline: "Test daily intake recording, rate formulas & slip printing with zero commitments.",
                color: "slate",
                badge: "🌱 14-Day Free Trial",
                status: "14-Day Full Free Access",
                priceTag: "100% Free Trial",
                features: [
                  "Limited to 25 Registered Farmers",
                  "Morning & Evening Milk Intake Form",
                  "Dynamic FAT & SNF Rate Matrix",
                  "10-Day Automated Billing Simulation",
                  "Standard Slip Printing (58mm/80mm)",
                  "Zero Credit Card or Deposit Required",
                ],
                cta: "Start 14-Day Free Trial",
              },
              {
                id: "pro",
                tier: "Pro Plan",
                label: "Core Dairy Operations",
                tagline: "Complete dairy admin support, auto/manual billing cycles & settlement engine.",
                color: "blue",
                badge: "⭐ Most Popular &bull; Operations Suite",
                status: "Early Access Preview",
                priceTag: "Pricing Coming Soon",
                features: [
                  "Limited Access of Farmer Creation (Max 150 Farmers)",
                  "Complete Dairy Admin Portal Support",
                  "Auto Billing Cluster & Manual Cycle Control",
                  "Farmer Instant Notification Alerts (SMS/Email)",
                  "Auto 80mm Thermal Printer Support",
                  "Payment Settlement & Passbook Ledger",
                  "Enterprise Data Security & Backups",
                ],
                cta: "Pre-Register for Pro Plan",
              },
              {
                id: "pro_plus",
                tier: "Pro ++ Plan",
                label: "Full E-Comm & Unlimited Scale",
                tagline: "Everything in Pro plus unlimited farmers, full e-commerce storefront & POS.",
                color: "purple",
                badge: "👑 Unlimited &bull; Full Retail Stack",
                status: "Enterprise Early Access",
                priceTag: "Pricing Coming Soon",
                features: [
                  "Everything in the Pro Plan Included",
                  "Unlimited All Things (Unlimited Farmer Creation)",
                  "Dairy E-Commerce Platform Access (/store/[slug])",
                  "All E-Commerce Application Support & Stock Sync",
                  "Instant Billing Support (Walk-in Counter POS)",
                  "15 km GPS Geofence Village Delivery Engine",
                  "Dairy Outlet Public & Store Admin UI Support",
                ],
                cta: "Pre-Register for Pro ++",
              },
            ].map((plan) => {
              const isActive = activePlan === plan.id;
              return (
                <div
                  key={plan.id}
                  onMouseEnter={() => setActivePlan(plan.id)}
                  className={`relative p-5 sm:p-5.5 rounded-2xl flex flex-col justify-between transition-all duration-300 cursor-pointer ${isActive
                    ? "bg-white dark:bg-slate-900 border-2 border-blue-600 dark:border-blue-500 shadow-xl shadow-blue-500/10 scale-[1.02] lg:-translate-y-2 z-10 ring-2 ring-blue-500/20"
                    : "bg-white/85 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 opacity-90 hover:opacity-100"
                    }`}
                >
                  {/* Active Card Pill Header */}
                  {isActive && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-md whitespace-nowrap animate-in fade-in zoom-in-95 duration-200">
                      <span className="flex items-center gap-1">
                        <Sparkles className="h-2.5 w-2.5 text-amber-300" />
                        <span>Active Selection</span>
                      </span>
                    </div>
                  )}

                  <div>
                    {/* Badge and Title */}
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`text-[11px] font-mono font-black uppercase tracking-wider ${plan.color === "blue" ? "text-blue-600 dark:text-blue-400" : plan.color === "purple" ? "text-purple-600 dark:text-purple-400" : "text-slate-500 dark:text-slate-400"}`}>
                        {plan.label}
                      </span>
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                        {plan.id === "free_trial" ? "Free Access" : "Coming Soon"}
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center justify-between">
                      <span>{plan.tier}</span>
                      {isActive && <span className="h-2 w-2 rounded-full bg-blue-500 animate-ping" />}
                    </h3>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug line-clamp-1">
                      {plan.tagline}
                    </p>

                    {/* Compact Pricing Status Banner */}
                    <div className="my-2.5 py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 dark:text-white">
                        <Zap className="h-3 w-3 text-amber-500 shrink-0" />
                        <span>{plan.priceTag}</span>
                      </div>
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                        {plan.status}
                      </span>
                    </div>

                    {/* Compact Features list */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">
                        What We Provide:
                      </div>
                      {plan.features.map((f) => (
                        <div key={f} className="flex items-start gap-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                          <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${plan.color === "blue" ? "text-blue-600 dark:text-blue-400" : plan.color === "purple" ? "text-purple-600 dark:text-purple-400" : "text-emerald-500"}`} />
                          <span className="leading-tight font-medium line-clamp-1">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pre-Register Action CTA */}
                  <Link href="/login?tab=register" className="mt-3.5 block">
                    <Button
                      className={`w-full h-9.5 rounded-xl font-bold text-xs transition-all duration-200 shadow-sm ${isActive
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/20"
                        : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200"
                        }`}
                    >
                      {plan.cta} <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              );
            })}
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
              <span>Cloud-Powered Dairy Platform</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
