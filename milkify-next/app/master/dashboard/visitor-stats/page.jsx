"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
  Area, AreaChart,
} from "recharts";
import {
  Eye, Globe, Monitor, Smartphone, Tablet, Calendar, Download,
  TrendingUp, Users, Activity, RefreshCw, Filter, BarChart3,
  Shield, ShieldCheck, Store, MapPin, Search, Clock,
  CheckCircle2, XCircle, Mail, Phone, ChevronLeft, ChevronRight,
  Laptop, X, ArrowRight, ExternalLink, Sparkles,
  SlidersHorizontal, ArrowUpDown, ArrowUp, ArrowDown,
  ChevronDown, ChevronUp, RotateCcw,
} from "lucide-react";
import api from "@/lib/api";

// ── Helpers ──────────────────────────────────────────────────────────────────
const DEVICE_COLORS = { desktop: "#6366f1", mobile: "#f59e0b", tablet: "#10b981", unknown: "#94a3b8" };
const DEVICE_ICONS  = { desktop: Monitor, mobile: Smartphone, tablet: Tablet, unknown: Monitor };

const COUNTRY_FLAGS = {
  IN: "🇮🇳", US: "🇺🇸", GB: "🇬🇧", CA: "🇨🇦", AU: "🇦🇺", DE: "🇩🇪", FR: "🇫🇷",
  JP: "🇯🇵", SG: "🇸🇬", AE: "🇦🇪", BR: "🇧🇷", NL: "🇳🇱", KR: "🇰🇷", IT: "🇮🇹",
  RU: "🇷🇺", CN: "🇨🇳", ZA: "🇿🇦", NZ: "🇳🇿",
  Unknown: "🌍",
};

const COUNTRY_NAMES = {
  IN: "India",
  US: "United States",
  GB: "United Kingdom",
  CA: "Canada",
  AU: "Australia",
  DE: "Germany",
  FR: "France",
  JP: "Japan",
  SG: "Singapore",
  AE: "United Arab Emirates",
  BR: "Brazil",
  NL: "Netherlands",
  KR: "South Korea",
  IT: "Italy",
  RU: "Russia",
  CN: "China",
  ZA: "South Africa",
  NZ: "New Zealand",
  Unknown: "Localhost (India)",
};

const AnimatedCounter = ({ value, duration = 800 }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!value) { setDisplay(0); return; }
    let start = 0;
    const step = Math.ceil(value / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(start);
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);
  return <span>{display.toLocaleString()}</span>;
};

// ── Shimmer Skeleton ─────────────────────────────────────────────────────────
const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700/60 ${className}`} />
);

const SummaryCardSkeleton = () => (
  <div className="rounded-2xl p-5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
    <Skeleton className="h-4 w-24 mb-3" />
    <Skeleton className="h-8 w-16 mb-2" />
    <Skeleton className="h-3 w-20" />
  </div>
);

// ── Custom Tooltip ───────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-bold" style={{ color: p.color }}>
          {p.name}: {p.value?.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

// ── Time & Date Helpers ──────────────────────────────────────────────────────
const formatDateTime = (timestamp) => {
  if (!timestamp) return "—";
  const d = new Date(timestamp);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
};

const formatRelativeTime = (timestamp) => {
  if (!timestamp) return "";
  const diffSec = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 172800) return "Yesterday";
  return `${Math.floor(diffSec / 86400)}d ago`;
};

const formatPeriodLabel = (id, groupBy) => {
  if (!id) return { main: "—", sub: "" };
  if (groupBy === "day") {
    const d = new Date(id);
    if (!isNaN(d.getTime())) {
      const dayName = d.toLocaleDateString("en-IN", { weekday: "short" });
      const dateFormatted = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
      return { main: dateFormatted, sub: dayName };
    }
    return { main: id, sub: "" };
  }
  if (groupBy === "week") {
    return { main: `Week ${id.replace(/^[0-9]+-W/, "")}`, sub: id };
  }
  if (groupBy === "month") {
    const parts = id.split("-");
    if (parts.length === 2) {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const mIdx = parseInt(parts[1], 10) - 1;
      return { main: `${monthNames[mIdx] || parts[1]} ${parts[0]}`, sub: "Monthly Total" };
    }
  }
  return { main: id, sub: "" };
};

// ══════════════════════════════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════════════════════════════
export default function VisitorStatsPage() {
  // ── Tab state: "logins" (User Login History) vs "traffic" (Platform Traffic)
  const [activeTab, setActiveTab] = useState("traffic");

  // ── Traffic Stats State ────────────────────────────────────────────────────
  const [stats, setStats]               = useState([]);
  const [summary, setSummary]           = useState(null);
  const [loading, setLoading]           = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [groupBy, setGroupBy]           = useState("day");
  const [sortBy, setSortBy]             = useState("date");
  const [fromDate, setFromDate]         = useState("");
  const [toDate, setToDate]             = useState("");
  const [showFilters, setShowFilters]   = useState(false);

  // ── User Logins State ──────────────────────────────────────────────────────
  const [logins, setLogins]             = useState([]);
  const [loginsSummary, setLoginsSummary] = useState(null);
  const [loginsLoading, setLoginsLoading] = useState(false);
  const [loginRole, setLoginRole]       = useState("all");
  const [loginStatus, setLoginStatus]   = useState("all");
  const [loginDeviceType, setLoginDeviceType] = useState("all");
  const [loginOS, setLoginOS]           = useState("all");
  const [loginState, setLoginState]     = useState("all");
  const [loginIpFilter, setLoginIpFilter] = useState("");
  const [loginMemberId, setLoginMemberId] = useState("");
  const [loginSearch, setLoginSearch]   = useState("");
  const [loginFromDate, setLoginFromDate] = useState("");
  const [loginToDate, setLoginToDate]   = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [loginPage, setLoginPage]           = useState(1);
  const [loginLimit, setLoginLimit]         = useState(10);
  const [loginSortBy, setLoginSortBy]       = useState("timestamp");
  const [loginSortOrder, setLoginSortOrder] = useState("desc");
  const [loginPagination, setLoginPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });

  // ── Country Drilldown Modal State ──────────────────────────────────────────
  const [selectedCountryModal, setSelectedCountryModal] = useState(null);
  const [countryLogins, setCountryLogins]               = useState([]);
  const [countryLoginsSummary, setCountryLoginsSummary] = useState(null);
  const [countryLoginsLoading, setCountryLoginsLoading] = useState(false);

  // ── Fetch summary (all-time stats) ─────────────────────────────────────
  const fetchSummary = useCallback(async () => {
    try {
      const res = await api.get("/master/visitor-stats/summary");
      setSummary(res.data);
    } catch (err) {
      console.error("[VisitorStats] Summary fetch failed:", err);
    }
  }, []);

  // ── Fetch chart data ───────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      setChartLoading(true);
      const params = { groupBy, sortBy };
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
      const res = await api.get("/master/visitor-stats", { params });
      setStats(res.data?.stats || []);
    } catch (err) {
      console.error("[VisitorStats] Chart fetch failed:", err);
    } finally {
      setChartLoading(false);
    }
  }, [groupBy, sortBy, fromDate, toDate]);

  // ── Fetch User Login History ───────────────────────────────────────────
  const fetchUserLogins = useCallback(async () => {
    try {
      setLoginsLoading(true);
      const params = {
        role: loginRole,
        status: loginStatus,
        deviceType: loginDeviceType,
        os: loginOS,
        state: loginState,
        search: loginSearch.trim(),
        page: loginPage,
        limit: loginLimit,
        sortBy: loginSortBy,
        sortOrder: loginSortOrder,
      };
      if (loginIpFilter && loginIpFilter.trim()) params.ipAddress = loginIpFilter.trim();
      if (loginMemberId && loginMemberId.trim()) params.memberId = loginMemberId.trim();
      if (loginFromDate) params.fromDate = loginFromDate;
      if (loginToDate) params.toDate = loginToDate;

      const res = await api.get("/master/visitor-stats/user-logins", { params });
      // Handled for both unwrapped (via axios interceptor res.data = res.data.data) and raw responses
      const payload = res.data?.data || res.data || {};
      const loginItems = Array.isArray(payload.logins) ? payload.logins : (Array.isArray(payload) ? payload : []);
      const totalCount = payload.pagination?.total !== undefined ? payload.pagination.total : loginItems.length;
      const paginationInfo = {
        total: totalCount,
        page: payload.pagination?.page || loginPage,
        limit: payload.pagination?.limit || loginLimit,
        totalPages: Math.ceil(totalCount / loginLimit) || 1,
      };
      const summaryInfo = payload.summary || null;

      setLogins(loginItems);
      setLoginPagination(paginationInfo);
      setLoginsSummary(summaryInfo);
    } catch (err) {
      console.error("[VisitorStats] User logins fetch failed:", err);
    } finally {
      setLoginsLoading(false);
    }
  }, [
    loginRole,
    loginStatus,
    loginDeviceType,
    loginOS,
    loginState,
    loginIpFilter,
    loginMemberId,
    loginSearch,
    loginPage,
    loginLimit,
    loginSortBy,
    loginSortOrder,
    loginFromDate,
    loginToDate,
  ]);

  const fetchSummaryRef = useRef(fetchSummary);
  const fetchStatsRef = useRef(fetchStats);
  const fetchUserLoginsRef = useRef(fetchUserLogins);
  const isFirstRender = useRef(true);

  useEffect(() => {
    fetchSummaryRef.current = fetchSummary;
    fetchStatsRef.current = fetchStats;
    fetchUserLoginsRef.current = fetchUserLogins;
  }, [fetchSummary, fetchStats, fetchUserLogins]);

  // ── Initial load ───────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetchSummaryRef.current(),
      fetchStatsRef.current(),
      fetchUserLoginsRef.current(),
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    fetchStatsRef.current();
  }, [groupBy, sortBy]);

  // Trigger login fetch when active tab is logins or any filter / pagination / sorting changes
  useEffect(() => {
    if (activeTab === "logins") {
      fetchUserLoginsRef.current();
    }
  }, [
    activeTab,
    loginRole,
    loginStatus,
    loginDeviceType,
    loginOS,
    loginState,
    loginPage,
    loginLimit,
    loginSortBy,
    loginSortOrder,
  ]);

  // ── Open Country Drilldown Handler ─────────────────────────────────────
  const handleOpenCountryDrilldown = async (countryCode, count) => {
    const code = countryCode || "Unknown";
    const name = COUNTRY_NAMES[countryCode] || countryCode || "Localhost (India)";
    setSelectedCountryModal({ countryCode: code, countryName: name, count });
    setCountryLoginsLoading(true);
    try {
      const res = await api.get("/master/visitor-stats/country-logins", {
        params: { countryCode: code, country: name },
      });
      const payload = res.data?.data || res.data || {};
      const countryLoginItems = Array.isArray(payload.logins) ? payload.logins : (Array.isArray(payload) ? payload : []);
      setCountryLogins(countryLoginItems);
      setCountryLoginsSummary(payload);
    } catch (err) {
      console.error("[VisitorStats] Country logins fetch error:", err);
    } finally {
      setCountryLoginsLoading(false);
    }
  };

  // ── Jump to User Logins for Country ────────────────────────────────────
  const handleJumpToLoginsForCountry = (countryName) => {
    setSelectedCountryModal(null);
    setActiveTab("logins");
    setLoginSearch(countryName || "");
    setLoginPage(1);
    setTimeout(() => {
      fetchUserLogins();
    }, 50);
  };

  // ── Jump to User Logins for a Specific Date ────────────────────────────
  const handleJumpToLoginsForDate = (dateStr) => {
    setActiveTab("logins");
    setLoginFromDate(dateStr);
    setLoginToDate(dateStr);
    setLoginPage(1);
    setTimeout(() => {
      fetchUserLogins();
    }, 50);
  };

  const handleApplyTrafficFilters = () => fetchStats();
  const handleResetTrafficFilters = () => {
    setFromDate(""); setToDate(""); setGroupBy("day"); setSortBy("date");
  };

  // Quick Date Preset Setter for Traffic
  const handleSetTrafficDatePreset = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    setFromDate(start.toISOString().split("T")[0]);
    setToDate(end.toISOString().split("T")[0]);
    setTimeout(() => fetchStats(), 50);
  };

  // ── Column Sort Handler ────────────────────────────────────────────────
  const handleSortColumn = (columnKey) => {
    if (loginSortBy === columnKey) {
      setLoginSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setLoginSortBy(columnKey);
      setLoginSortOrder(columnKey === "timestamp" ? "desc" : "asc");
    }
    setLoginPage(1);
  };

  const handleApplyLoginFilters = (e) => {
    if (e) e.preventDefault();
    setLoginPage(1);
    fetchUserLogins();
  };

  const handleResetLoginFilters = () => {
    setLoginRole("all");
    setLoginStatus("all");
    setLoginDeviceType("all");
    setLoginOS("all");
    setLoginState("all");
    setLoginIpFilter("");
    setLoginMemberId("");
    setLoginSearch("");
    setLoginFromDate("");
    setLoginToDate("");
    setLoginSortBy("timestamp");
    setLoginSortOrder("desc");
    setLoginPage(1);
    setTimeout(() => {
      fetchUserLogins();
    }, 0);
  };

  const handleSetLoginDatePreset = (days) => {
    if (days === null) {
      setLoginFromDate("");
      setLoginToDate("");
      setLoginPage(1);
      return;
    }
    const to = new Date();
    const from = new Date();
    if (days === 0) {
      from.setHours(0, 0, 0, 0);
    } else {
      from.setDate(from.getDate() - days);
    }
    setLoginFromDate(from.toISOString().split("T")[0]);
    setLoginToDate(to.toISOString().split("T")[0]);
    setLoginPage(1);
  };

  const activeLoginFilterCount = [
    loginRole !== "all",
    loginStatus !== "all",
    loginDeviceType !== "all",
    loginOS !== "all",
    loginState !== "all",
    Boolean(loginIpFilter.trim()),
    Boolean(loginMemberId.trim()),
    Boolean(loginSearch.trim()),
    Boolean(loginFromDate),
    Boolean(loginToDate),
  ].filter(Boolean).length;

  // ── CSV Export for Traffic ──────────────────────────────────────────────
  const handleExportTrafficCSV = () => {
    const headers = [
      "Date/Period",
      "Visitor Hits",
      "Unique IPs",
      "User Logins",
      "Master Logins",
      "Dairy Logins",
      "Desktop Hits",
      "Mobile Hits",
      "Countries Active",
    ];
    const rows = stats.map((item) => [
      `"${item._id}"`,
      item.count || 0,
      item.uniqueIps || 0,
      item.totalLogins || 0,
      item.masterLogins || 0,
      item.dairyLogins || 0,
      item.desktopCount || 0,
      item.mobileCount || 0,
      `"${(item.countries || []).join(", ")}"`,
    ]);
    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const el = document.createElement("a");
    el.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(csv));
    el.setAttribute("download", `platform-traffic-detailed-${new Date().toISOString().split("T")[0]}.csv`);
    el.style.display = "none";
    document.body.appendChild(el);
    el.click();
    document.body.removeChild(el);
  };

  // ── CSV Export for User Logins ──────────────────────────────────────────
  const handleExportLoginsCSV = () => {
    const headers = [
      "User Name",
      "Member ID",
      "Role",
      "Shop/Dairy Name",
      "Email",
      "Mobile",
      "Login Date & Time",
      "Country",
      "State",
      "City",
      "IP Address",
      "Device Type",
      "OS",
      "Browser",
      "Status",
    ];

    const rows = logins.map((item) => [
      `"${item.name || ""}"`,
      `"${item.memberId || ""}"`,
      `"${item.role || ""}"`,
      `"${item.shopName || ""}"`,
      `"${item.email || ""}"`,
      `"${item.mobile || ""}"`,
      `"${formatDateTime(item.timestamp)}"`,
      `"${item.country || ""}"`,
      `"${item.state || ""}"`,
      `"${item.city || ""}"`,
      `"${item.ipAddress || ""}"`,
      `"${item.deviceType || ""}"`,
      `"${item.os || ""}"`,
      `"${item.browser || ""}"`,
      `"${item.status || "success"}"`,
    ]);

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const el = document.createElement("a");
    el.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(csv));
    el.setAttribute("download", `user-logins-audit-${new Date().toISOString().split("T")[0]}.csv`);
    el.style.display = "none";
    document.body.appendChild(el);
    el.click();
    document.body.removeChild(el);
  };

  // ── Summary card config for Traffic ─────────────────────────────────────
  const summaryCards = summary ? [
    { label: "All-Time Visits",  value: summary.allTime,         icon: Eye,        gradient: "from-indigo-500 to-purple-600" },
    { label: "Today",            value: summary.todayCount,       icon: Activity,   gradient: "from-emerald-500 to-teal-600" },
    { label: "Last 7 Days",      value: summary.last7Days,        icon: TrendingUp, gradient: "from-blue-500 to-cyan-600" },
    { label: "Last 30 Days",     value: summary.last30Days,       icon: Calendar,   gradient: "from-amber-500 to-orange-600" },
    { label: "Unique IPs",       value: summary.uniqueIPs,        icon: Users,      gradient: "from-rose-500 to-pink-600" },
    { label: "Countries",        value: summary.uniqueCountries,  icon: Globe,      gradient: "from-violet-500 to-fuchsia-600" },
  ] : [];

  // ── Device chart data ──────────────────────────────────────────────────
  const deviceData = summary?.deviceBreakdown?.map((d) => ({
    name: d.device.charAt(0).toUpperCase() + d.device.slice(1),
    value: d.count,
    color: DEVICE_COLORS[d.device] || DEVICE_COLORS.unknown,
  })) || [];

  const totalDeviceVisits = deviceData.reduce((sum, d) => sum + d.value, 0) || 1;

  // ── Top countries ──────────────────────────────────────────────────────
  const topCountries = summary?.topCountries || [];
  const maxCountryCount = topCountries[0]?.count || 1;

  // ══════════════════════════════════════════════════════════════════════
  // RENDER SKELETON
  // ══════════════════════════════════════════════════════════════════════
  if (loading) {
    return (
      <div className="space-y-6">
        <div><Skeleton className="h-8 w-56 mb-2" /><Skeleton className="h-4 w-72" /></div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => <SummaryCardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" /><Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* ── Top Header & Tab Controls ───────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Visitor & User Analytics
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
              Live Audits
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time user login telemetry, geographic tracking, and platform traffic intelligence
          </p>
        </div>

        {/* Global Tab Switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shrink-0 self-start md:self-auto shadow-xs">
          <button
            onClick={() => setActiveTab("traffic")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
              activeTab === "traffic"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/60 dark:border-slate-700"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Platform Traffic</span>
          </button>

          <button
            onClick={() => setActiveTab("logins")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
              activeTab === "logins"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/60 dark:border-slate-700"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Login Activity</span>
            {loginsSummary?.totalLogins !== undefined && (
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                activeTab === "logins"
                  ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
              }`}>
                {loginsSummary.totalLogins}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          TAB 1: PLATFORM TRAFFIC INTELLIGENCE (Modernized with Country Drilldown)
          ════════════════════════════════════════════════════════════════════ */}
      {activeTab === "traffic" && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Action Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gradient-to-r from-indigo-50/70 via-purple-50/40 to-slate-50 dark:from-indigo-950/30 dark:via-purple-950/20 dark:to-slate-900/40 p-4 rounded-2xl border border-indigo-100/80 dark:border-indigo-900/40 shadow-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                Interactive Global Heatmap: Click any country to reveal users who logged in from that region
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { fetchSummary(); fetchStats(); }}
                className="flex items-center gap-1.5 text-xs h-8 bg-white dark:bg-slate-800"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </Button>
              {stats.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportTrafficCSV}
                  className="flex items-center gap-1.5 text-xs h-8 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                >
                  <Download className="w-3.5 h-3.5" /> Detailed CSV
                </Button>
              )}
            </div>
          </div>

          {/* ── Summary Cards ───────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {summaryCards.map((card) => (
              <div
                key={card.label}
                className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 p-4 sm:p-5 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 hover:-translate-y-0.5"
              >
                {/* Gradient accent */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient} opacity-80 group-hover:opacity-100 transition-opacity`} />
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-sm`}>
                    <card.icon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-tight">
                    {card.label}
                  </span>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  <AnimatedCounter value={card.value} />
                </p>
              </div>
            ))}
          </div>

          {/* ── Device Breakdown + Top Countries (Interactive Clickable Drilldown) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Device Donut */}
            <Card className="p-5 sm:p-6 bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/60 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                <Monitor className="w-4 h-4 text-indigo-500" /> Device Distribution
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">All-time visitor distribution across devices</p>

              {deviceData.length > 0 ? (
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-44 h-44 sm:w-48 sm:h-48 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={deviceData}
                          cx="50%" cy="50%"
                          innerRadius={50} outerRadius={75}
                          paddingAngle={4}
                          dataKey="value"
                          stroke="none"
                        >
                          {deviceData.map((d, i) => (
                            <Cell key={i} fill={d.color} className="drop-shadow-sm" />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => v.toLocaleString()} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2.5 w-full">
                    {deviceData.map((d) => {
                      const Icon = DEVICE_ICONS[d.name.toLowerCase()] || Monitor;
                      const pct = ((d.value / totalDeviceVisits) * 100).toFixed(1);
                      return (
                        <div key={d.name} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${d.color}20` }}>
                            <Icon className="w-4 h-4" style={{ color: d.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline justify-between mb-1">
                              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{d.name}</span>
                              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{pct}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${pct}%`, backgroundColor: d.color }}
                              />
                            </div>
                          </div>
                          <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums w-12 text-right">
                            {d.value.toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-slate-400 text-sm">No device data</div>
              )}
            </Card>

            {/* Top Countries with Click-to-Drilldown */}
            <Card className="p-5 sm:p-6 bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/60 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-violet-500" /> Geographic Traffic by Country
                </h2>
                <span className="text-[11px] font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/60 px-2 py-0.5 rounded-full border border-violet-200/60 dark:border-violet-800/60">
                  Click Country to Inspect Logins
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Click any country row below to view users, admins, and timestamps from that location
              </p>

              {topCountries.length > 0 ? (
                <div className="space-y-2">
                  {topCountries.map((c, i) => {
                    const pct = ((c.count / maxCountryCount) * 100).toFixed(0);
                    const flag = COUNTRY_FLAGS[c.country] || "🌍";
                    const countryName = COUNTRY_NAMES[c.country] || c.country || "Localhost (India)";

                    return (
                      <button
                        key={c.country}
                        onClick={() => handleOpenCountryDrilldown(c.country, c.count)}
                        className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/40 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all text-left group"
                        title={`Click to inspect user logins from ${countryName}`}
                      >
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 w-5 text-right tabular-nums">{i + 1}</span>
                        <span className="text-xl leading-none">{flag}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between mb-1">
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                              {countryName}
                              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500" />
                            </span>
                            <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums ml-2">
                              {c.count.toLocaleString()} visits
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-700"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-slate-400 text-sm">No country data</div>
              )}
            </Card>
          </div>

          {/* ── Modern Filter Bar with Quick Presets ───────────────────────── */}
          <Card className="p-4 sm:p-5 bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/60 shadow-sm space-y-3">
            {/* Quick Date Presets */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Presets:
                </span>
                <button
                  onClick={() => handleSetTrafficDatePreset(0)}
                  className="px-2.5 py-1 text-xs rounded-lg font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950 transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={() => handleSetTrafficDatePreset(7)}
                  className="px-2.5 py-1 text-xs rounded-lg font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950 transition-colors"
                >
                  Last 7 Days
                </button>
                <button
                  onClick={() => handleSetTrafficDatePreset(30)}
                  className="px-2.5 py-1 text-xs rounded-lg font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950 transition-colors"
                >
                  Last 30 Days
                </button>
                <button
                  onClick={() => handleSetTrafficDatePreset(90)}
                  className="px-2.5 py-1 text-xs rounded-lg font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950 transition-colors"
                >
                  Last 90 Days
                </button>
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 sm:hidden"
              >
                <Filter className="w-3.5 h-3.5" /> {showFilters ? "Hide Filters" : "Show Custom Range"}
              </button>
            </div>

            <div className={`${showFilters ? "block" : "hidden"} sm:block`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">From Date</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">To Date</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Group By</label>
                  <select
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                  >
                    <option value="day">Daily</option>
                    <option value="week">Weekly</option>
                    <option value="month">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Sort</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                  >
                    <option value="date">Date ↑</option>
                    <option value="count">Count ↓</option>
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <Button onClick={handleApplyTrafficFilters} disabled={chartLoading} className="flex-1 text-xs h-9">
                    {chartLoading ? "Loading..." : "Apply"}
                  </Button>
                  <Button variant="outline" onClick={handleResetTrafficFilters} className="text-xs h-9">
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* ── Charts Section ──────────────────────────────────────────── */}
          {chartLoading ? (
            <div className="grid grid-cols-1 gap-6">
              <Skeleton className="h-80" />
              <Skeleton className="h-80" />
            </div>
          ) : stats.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              {/* Area Chart */}
              <Card className="p-5 sm:p-6 bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/60 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-500" /> Visitor Traffic Trend
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleExportTrafficCSV}
                    className="flex items-center gap-1.5 text-xs text-slate-500 h-8"
                  >
                    <Download className="w-3.5 h-3.5" /> CSV
                  </Button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  {groupBy === "day" ? "Daily" : groupBy === "week" ? "Weekly" : "Monthly"} platform visitor volume over time
                </p>
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={stats} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:opacity-20" />
                    <XAxis
                      dataKey="_id"
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      tickLine={false}
                      axisLine={{ stroke: "#e2e8f0" }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      fill="url(#colorVisitors)"
                      name="Visitors"
                      dot={{ r: 3, fill: "#6366f1", strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: "#6366f1", stroke: "#fff", strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>

              {/* Bar Chart */}
              <Card className="p-5 sm:p-6 bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/60 shadow-sm">
                <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-500" /> Period Volume Comparison
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Comparative visitor volumes across selected timeline
                </p>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={stats} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                        <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:opacity-20" />
                    <XAxis
                      dataKey="_id"
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      tickLine={false}
                      axisLine={{ stroke: "#e2e8f0" }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar
                      dataKey="count"
                      fill="url(#barGradient)"
                      name="Visitors"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={48}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              {/* ── ENHANCED DETAILED VIEW TABLE ───────────────────────────── */}
              <Card className="overflow-hidden bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/60 shadow-sm">
                <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-indigo-500" />
                      Detailed Operational Traffic & Login Breakdown
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Comprehensive breakdown per timeframe including visitor hits, unique IPs, logins, devices, and origins
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 self-start sm:self-auto">
                    {stats.length} period record(s)
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-100 dark:border-slate-700/60">
                      <tr>
                        <th className="py-3 px-4 text-left">Period / Date</th>
                        <th className="py-3 px-4 text-right">Traffic Volume</th>
                        <th className="py-3 px-4 text-center">Unique IPs</th>
                        <th className="py-3 px-4 text-center">User Logins</th>
                        <th className="py-3 px-4 text-center">Device Share</th>
                        <th className="py-3 px-4 text-center">Origins Active</th>
                        <th className="py-3 px-4 text-center">Success Rate</th>
                        <th className="py-3 px-4 text-right">Drill-down</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                      {stats.map((item, idx) => {
                        const period = formatPeriodLabel(item._id, groupBy);
                        const totalHits = item.count || 0;
                        const deskHits = item.desktopCount || 0;
                        const mobHits = item.mobileCount || 0;
                        const deskPct = totalHits > 0 ? Math.round((deskHits / totalHits) * 100) : 0;
                        const mobPct = totalHits > 0 ? Math.round((mobHits / totalHits) * 100) : 0;
                        const successRate = totalHits > 0 ? Math.round(((item.successCount || totalHits) / totalHits) * 100) : 100;
                        const originCodes = (item.countries || []).filter(Boolean);

                        return (
                          <tr
                            key={idx}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors group"
                          >
                            {/* Period Date */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                                {period.main}
                              </div>
                              {period.sub && (
                                <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                                  {period.sub}
                                </div>
                              )}
                            </td>

                            {/* Visitor Hits */}
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <span className="font-black text-slate-900 dark:text-white tabular-nums text-sm">
                                {totalHits.toLocaleString()}
                              </span>
                              <span className="text-[11px] text-slate-400 ml-1">hits</span>
                            </td>

                            {/* Unique IPs */}
                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                                <Users className="w-3 h-3 text-slate-400" />
                                {item.uniqueIps ? item.uniqueIps.toLocaleString() : "1"}
                              </span>
                            </td>

                            {/* Authenticated User Logins */}
                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              {item.totalLogins > 0 ? (
                                <div>
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800">
                                    <CheckCircle2 className="w-3 h-3" /> {item.totalLogins} Logins
                                  </span>
                                  <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                                    {item.masterLogins > 0 && <span className="text-purple-600 dark:text-purple-400 font-semibold">{item.masterLogins} Master • </span>}
                                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{item.dairyLogins || 0} Dairy</span>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400 dark:text-slate-500">
                                  0 logins
                                </span>
                              )}
                            </td>

                            {/* Device Share */}
                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-2 text-xs font-medium">
                                <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400" title={`Desktop: ${deskHits} (${deskPct}%)`}>
                                  <Monitor className="w-3 h-3" /> {deskPct}%
                                </span>
                                <span className="text-slate-300 dark:text-slate-600">•</span>
                                <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400" title={`Mobile: ${mobHits} (${mobPct}%)`}>
                                  <Smartphone className="w-3 h-3" /> {mobPct}%
                                </span>
                              </div>
                            </td>

                            {/* Active Origins */}
                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              {originCodes.length > 0 ? (
                                <div className="flex items-center justify-center gap-1 text-sm">
                                  {originCodes.slice(0, 3).map((code) => (
                                    <span key={code} title={COUNTRY_NAMES[code] || code}>
                                      {COUNTRY_FLAGS[code] || "🌍"}
                                    </span>
                                  ))}
                                  {originCodes.length > 3 && (
                                    <span className="text-[10px] font-bold text-slate-400 ml-0.5">
                                      +{originCodes.length - 3}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400">🇮🇳</span>
                              )}
                            </td>

                            {/* Success Rate */}
                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                                successRate >= 99
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                                  : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                              }`}>
                                {successRate}% OK
                              </span>
                            </td>

                            {/* Quick Action */}
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <button
                                onClick={() => handleJumpToLoginsForDate(item._id)}
                                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 transition-colors py-1 px-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/60"
                                title={`Inspect all user logins for ${item._id}`}
                              >
                                View Logins
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          ) : (
            <Card className="p-12 sm:p-16 text-center bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/60">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center">
                <Calendar className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-600 dark:text-slate-400 font-medium">No visitor traffic data available for the selected range</p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Try adjusting the date filters or check back later</p>
            </Card>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB 2: USER LOGIN ACTIVITY AUDIT
          ════════════════════════════════════════════════════════════════════ */}
      {activeTab === "logins" && (
        <div className="space-y-6 animate-fade-in">
          {/* ── Highlight Metrics Ribbon ─────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Total Logins */}
            <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 p-4 sm:p-5 shadow-sm">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-600" />
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Total Logins
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                <AnimatedCounter value={loginsSummary?.totalLogins || logins.length} />
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">All recorded user sessions</p>
            </div>

            {/* Master Admin Logins */}
            <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 p-4 sm:p-5 shadow-sm">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/80 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <Shield className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Master Admins
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                <AnimatedCounter value={loginsSummary?.masterAdminLogins || 0} />
              </p>
              <p className="text-xs text-purple-600/80 dark:text-purple-400/80 font-medium mt-1">System Controller Logins</p>
            </div>

            {/* Dairy Admin Logins */}
            <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 p-4 sm:p-5 shadow-sm">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Store className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Dairy Admins
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                <AnimatedCounter value={loginsSummary?.dairyAdminLogins || 0} />
              </p>
              <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 font-medium mt-1">Tenant Dairy Logins</p>
            </div>

            {/* Today Active */}
            <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 p-4 sm:p-5 shadow-sm">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/80 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Clock className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Today Logins
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                <AnimatedCounter value={loginsSummary?.todayLogins || 0} />
              </p>
              <p className="text-xs text-amber-600/80 dark:text-amber-400/80 font-medium mt-1">
                {loginsSummary?.uniqueUsersToday || 0} unique users today
              </p>
            </div>
          </div>

          {/* ── Top Regional Distribution Strip ──────────────────────────── */}
          {loginsSummary?.topStates && loginsSummary.topStates.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs">
              <span className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                Top User Regions:
              </span>
              {loginsSummary.topStates.map((st, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium shadow-xs"
                >
                  <span className="font-semibold text-slate-900 dark:text-white">{st.state}</span>
                  <span className="px-1.5 py-0.2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded text-[11px] font-bold">
                    {st.count}
                  </span>
                </span>
              ))}
            </div>
          )}

          {/* ── Search, Filters & Action HUD ─────────────────────────────── */}
          <Card className="p-4 sm:p-5 bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/60 shadow-sm space-y-4">
            {/* Top Toolbar: Roles & Global Actions */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Role Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
                <button
                  type="button"
                  onClick={() => { setLoginRole("all"); setLoginPage(1); }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    loginRole === "all"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-slate-100 dark:bg-slate-700/70 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  }`}
                >
                  All Roles
                </button>
                <button
                  type="button"
                  onClick={() => { setLoginRole("master_admin"); setLoginPage(1); }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                    loginRole === "master_admin"
                      ? "bg-purple-600 text-white shadow-sm"
                      : "bg-slate-100 dark:bg-slate-700/70 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  Master Admin
                </button>
                <button
                  type="button"
                  onClick={() => { setLoginRole("admin"); setLoginPage(1); }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                    loginRole === "admin"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-slate-100 dark:bg-slate-700/70 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  }`}
                >
                  <Store className="w-3.5 h-3.5" />
                  Dairy Admin
                </button>
              </div>

              {/* Action Buttons: Advanced Filter Toggle, Refresh & CSV Export */}
              <div className="flex items-center gap-2 self-end lg:self-auto flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowAdvancedFilters((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    showAdvancedFilters || activeLoginFilterCount > 0
                      ? "bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Filter className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Filters</span>
                  {activeLoginFilterCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center">
                      {activeLoginFilterCount}
                    </span>
                  )}
                  {showAdvancedFilters ? (
                    <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchUserLogins}
                  disabled={loginsLoading}
                  className="flex items-center gap-1.5 text-xs h-9 bg-white dark:bg-slate-800"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loginsLoading ? "animate-spin" : ""}`} /> Refresh
                </Button>

                {logins.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportLoginsCSV}
                    className="flex items-center gap-1.5 text-xs h-9 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800"
                  >
                    <Download className="w-3.5 h-3.5" /> Export Logins CSV
                  </Button>
                )}
              </div>
            </div>

            {/* Quick Date Range Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs">
              <span className="text-slate-400 font-medium text-[11px] uppercase tracking-wider">Date Presets:</span>
              <button
                type="button"
                onClick={() => handleSetLoginDatePreset(null)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  !loginFromDate && !loginToDate
                    ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                }`}
              >
                All Time
              </button>
              <button
                type="button"
                onClick={() => handleSetLoginDatePreset(0)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 transition-all"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => handleSetLoginDatePreset(7)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 transition-all"
              >
                Last 7 Days
              </button>
              <button
                type="button"
                onClick={() => handleSetLoginDatePreset(30)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 transition-all"
              >
                Last 30 Days
              </button>
            </div>

            {/* Search Bar & Date Controls */}
            <form onSubmit={handleApplyLoginFilters} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 pt-2 border-t border-slate-100 dark:border-slate-700/60">
              {/* Universal Search Input */}
              <div className="lg:col-span-5 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by Name, Member ID, Email, Phone, City, IP..."
                  value={loginSearch}
                  onChange={(e) => setLoginSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>

              {/* From Date */}
              <div className="lg:col-span-2">
                <input
                  type="date"
                  value={loginFromDate}
                  onChange={(e) => setLoginFromDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>

              {/* To Date */}
              <div className="lg:col-span-2">
                <input
                  type="date"
                  value={loginToDate}
                  onChange={(e) => setLoginToDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Submit & Reset */}
              <div className="lg:col-span-3 flex items-center gap-2">
                <Button type="submit" disabled={loginsLoading} className="flex-1 text-xs h-9 bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                  {loginsLoading ? "Searching..." : "Apply Filters"}
                </Button>
                <Button type="button" variant="outline" onClick={handleResetLoginFilters} className="text-xs h-9">
                  Reset
                </Button>
              </div>
            </form>

            {/* ── EXPANDABLE ADVANCED 7-FIELD FILTERS PANEL ─────────────────── */}
            {showAdvancedFilters && (
              <div className="p-4 bg-slate-50/90 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-3 pt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />
                    Field-Specific Filters (User, Role, Date, Location, Device, IP, Status)
                  </span>
                  <button
                    type="button"
                    onClick={handleResetLoginFilters}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset All
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                  {/* Field 1: Status */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      Status
                    </label>
                    <select
                      value={loginStatus}
                      onChange={(e) => {
                        setLoginStatus(e.target.value);
                        setLoginPage(1);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-medium"
                    >
                      <option value="all">All Statuses</option>
                      <option value="success">Success Only</option>
                      <option value="failed">Failed Only</option>
                    </select>
                  </div>

                  {/* Field 2: Device Type */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      Device Type
                    </label>
                    <select
                      value={loginDeviceType}
                      onChange={(e) => {
                        setLoginDeviceType(e.target.value);
                        setLoginPage(1);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-medium"
                    >
                      <option value="all">All Devices</option>
                      <option value="desktop">Desktop / Laptop</option>
                      <option value="mobile">Mobile Phones</option>
                      <option value="tablet">Tablets</option>
                    </select>
                  </div>

                  {/* Field 3: Operating System */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      Operating System
                    </label>
                    <select
                      value={loginOS}
                      onChange={(e) => {
                        setLoginOS(e.target.value);
                        setLoginPage(1);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-medium"
                    >
                      <option value="all">All Operating Systems</option>
                      <option value="Windows">Windows</option>
                      <option value="Android">Android</option>
                      <option value="iOS">iOS</option>
                      <option value="macOS">macOS</option>
                      <option value="Linux">Linux</option>
                    </select>
                  </div>

                  {/* Field 4: Location (State / Region) */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      Location (State)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Maharashtra, Gujarat"
                      value={loginState === "all" ? "" : loginState}
                      onChange={(e) => {
                        setLoginState(e.target.value.trim() ? e.target.value : "all");
                        setLoginPage(1);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-medium text-xs"
                    />
                  </div>

                  {/* Field 5: Member ID */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      Member ID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. MI-DA-0001"
                      value={loginMemberId}
                      onChange={(e) => {
                        setLoginMemberId(e.target.value);
                        setLoginPage(1);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                    />
                  </div>

                  {/* Field 6: IP Address */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      IP Address
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 192.168.1.1"
                      value={loginIpFilter}
                      onChange={(e) => {
                        setLoginIpFilter(e.target.value);
                        setLoginPage(1);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── ACTIVE FILTERS TAGS ROW ────────────────────────────────────── */}
            {activeLoginFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2 text-xs border-t border-slate-100 dark:border-slate-700/60">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
                  Active Filters:
                </span>

                {loginRole !== "all" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold">
                    Role: {loginRole === "master_admin" ? "Master Admin" : "Dairy Admin"}
                    <button type="button" onClick={() => setLoginRole("all")} className="hover:text-indigo-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {loginStatus !== "all" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold capitalize">
                    Status: {loginStatus}
                    <button type="button" onClick={() => setLoginStatus("all")} className="hover:text-indigo-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {loginDeviceType !== "all" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold capitalize">
                    Device: {loginDeviceType}
                    <button type="button" onClick={() => setLoginDeviceType("all")} className="hover:text-indigo-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {loginOS !== "all" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold">
                    OS: {loginOS}
                    <button type="button" onClick={() => setLoginOS("all")} className="hover:text-indigo-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {loginState !== "all" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold">
                    Location: {loginState}
                    <button type="button" onClick={() => setLoginState("all")} className="hover:text-indigo-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {loginMemberId && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold">
                    ID: {loginMemberId}
                    <button type="button" onClick={() => setLoginMemberId("")} className="hover:text-indigo-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {loginIpFilter && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold">
                    IP: {loginIpFilter}
                    <button type="button" onClick={() => setLoginIpFilter("")} className="hover:text-indigo-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {loginSearch && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold">
                    Search: &quot;{loginSearch}&quot;
                    <button type="button" onClick={() => setLoginSearch("")} className="hover:text-indigo-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {(loginFromDate || loginToDate) && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold">
                    Date: {loginFromDate || "Start"} to {loginToDate || "Today"}
                    <button
                      type="button"
                      onClick={() => {
                        setLoginFromDate("");
                        setLoginToDate("");
                      }}
                      className="hover:text-indigo-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleResetLoginFilters}
                  className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline ml-1"
                >
                  Clear All Filters
                </button>
              </div>
            )}

            {/* Quick Sorting HUD Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-700/60 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />
                  Sort By:
                </span>
                <select
                  value={loginSortBy}
                  onChange={(e) => {
                    setLoginSortBy(e.target.value);
                    setLoginPage(1);
                  }}
                  className="px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="timestamp">Login Date & Time</option>
                  <option value="name">User Identity (Name)</option>
                  <option value="memberId">Member ID</option>
                  <option value="role">Role / Privilege</option>
                  <option value="state">Location (State / Region)</option>
                  <option value="deviceType">Device & OS</option>
                  <option value="ipAddress">IP Address</option>
                  <option value="status">Status (Success / Failed)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLoginSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
                    setLoginPage(1);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-800 dark:text-slate-200 transition-colors shadow-xs"
                  title="Click to toggle Ascending / Descending order for all records"
                >
                  {loginSortOrder === "asc" ? (
                    <>
                      <ArrowUp className="w-3.5 h-3.5 text-emerald-500 font-bold" />
                      <span>Ascending (A-Z / Oldest First)</span>
                    </>
                  ) : (
                    <>
                      <ArrowDown className="w-3.5 h-3.5 text-indigo-500 font-bold" />
                      <span>Descending (Z-A / Newest First)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </Card>

          {/* ── User Login Audit Records (Desktop Table & Mobile Cards) ────── */}
          <Card className="overflow-hidden bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/60 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-500" /> User Login Audit Records
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Click any column header icon to toggle Ascending (A-Z / Oldest) ⇄ Descending (Z-A / Newest) across all records
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/60 px-2.5 py-1 rounded-lg">
                  {loginPagination.total} record(s) found
                </span>
              </div>
            </div>

            {/* Mobile Quick Sort Chips (Visible on Mobile screens) */}
            <div className="block md:hidden px-4 py-3 bg-slate-50/70 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-700/60">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-2 uppercase tracking-wider">
                Sort Records By:
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {[
                  { key: "timestamp", label: "Time", asc: "Oldest", desc: "Newest" },
                  { key: "name", label: "User", asc: "A-Z", desc: "Z-A" },
                  { key: "memberId", label: "Member ID", asc: "A-Z", desc: "Z-A" },
                  { key: "role", label: "Role", asc: "A-Z", desc: "Z-A" },
                  { key: "state", label: "Location", asc: "A-Z", desc: "Z-A" },
                  { key: "deviceType", label: "Device", asc: "A-Z", desc: "Z-A" },
                  { key: "ipAddress", label: "IP", asc: "0-9", desc: "9-0" },
                  { key: "status", label: "Status", asc: "Fail 1st", desc: "Pass 1st" },
                ].map((s) => {
                  const isActive = loginSortBy === s.key;
                  return (
                    <button
                      key={s.key}
                      onClick={() => handleSortColumn(s.key)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-xs shrink-0 transition-all ${
                        isActive
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <span>{s.label}</span>
                      {isActive ? (
                        loginSortOrder === "asc" ? (
                          <>
                            <ArrowUp className="w-3 h-3 font-bold" />
                            <span className="text-[10px] opacity-90">({s.asc})</span>
                          </>
                        ) : (
                          <>
                            <ArrowDown className="w-3 h-3 font-bold" />
                            <span className="text-[10px] opacity-90">({s.desc})</span>
                          </>
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-50" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {loginsLoading ? (
              <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : logins.length > 0 ? (
              <>
                {/* ── DESKTOP & TABLET VIEW (7-Column Table) ────────────────── */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-100 dark:border-slate-700/60 select-none">
                      <tr>
                        {/* 1. User Identity & ID */}
                        <th
                          onClick={() => handleSortColumn("name")}
                          className={`py-3.5 px-4 text-left cursor-pointer transition-colors group ${
                            loginSortBy === "name"
                              ? "bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-950 dark:text-indigo-200 border-b-2 border-indigo-600 dark:border-indigo-400"
                              : "hover:bg-slate-100/70 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300"
                          }`}
                          title={`Click to sort by User Identity (${loginSortBy === "name" && loginSortOrder === "asc" ? "Switch to Descending Z-A" : "Switch to Ascending A-Z"})`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span>User Identity & ID</span>
                            {loginSortBy === "name" ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold shadow-xs">
                                {loginSortOrder === "asc" ? (
                                  <>
                                    <ArrowUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                    <span>A-Z</span>
                                  </>
                                ) : (
                                  <>
                                    <ArrowDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                    <span>Z-A</span>
                                  </>
                                )}
                              </span>
                            ) : (
                              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100 group-hover:text-indigo-500 transition-opacity" />
                            )}
                          </div>
                        </th>

                        {/* 2. Role / Privilege */}
                        <th
                          onClick={() => handleSortColumn("role")}
                          className={`py-3.5 px-4 text-left cursor-pointer transition-colors group ${
                            loginSortBy === "role"
                              ? "bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-950 dark:text-indigo-200 border-b-2 border-indigo-600 dark:border-indigo-400"
                              : "hover:bg-slate-100/70 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300"
                          }`}
                          title={`Click to sort by Role (${loginSortBy === "role" && loginSortOrder === "asc" ? "Switch to Descending" : "Switch to Ascending"})`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span>Role / Privilege</span>
                            {loginSortBy === "role" ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold shadow-xs">
                                {loginSortOrder === "asc" ? (
                                  <>
                                    <ArrowUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                    <span>A-Z</span>
                                  </>
                                ) : (
                                  <>
                                    <ArrowDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                    <span>Z-A</span>
                                  </>
                                )}
                              </span>
                            ) : (
                              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100 group-hover:text-indigo-500 transition-opacity" />
                            )}
                          </div>
                        </th>

                        {/* 3. Login Date & Time */}
                        <th
                          onClick={() => handleSortColumn("timestamp")}
                          className={`py-3.5 px-4 text-left cursor-pointer transition-colors group ${
                            loginSortBy === "timestamp"
                              ? "bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-950 dark:text-indigo-200 border-b-2 border-indigo-600 dark:border-indigo-400"
                              : "hover:bg-slate-100/70 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300"
                          }`}
                          title={`Click to sort by Date & Time (${loginSortBy === "timestamp" && loginSortOrder === "asc" ? "Switch to Newest First" : "Switch to Oldest First"})`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span>Login Date & Time</span>
                            {loginSortBy === "timestamp" ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold shadow-xs">
                                {loginSortOrder === "asc" ? (
                                  <>
                                    <ArrowUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                    <span>Oldest</span>
                                  </>
                                ) : (
                                  <>
                                    <ArrowDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                    <span>Newest</span>
                                  </>
                                )}
                              </span>
                            ) : (
                              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100 group-hover:text-indigo-500 transition-opacity" />
                            )}
                          </div>
                        </th>

                        {/* 4. Location (Country / State) */}
                        <th
                          onClick={() => handleSortColumn("state")}
                          className={`py-3.5 px-4 text-left cursor-pointer transition-colors group ${
                            loginSortBy === "state"
                              ? "bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-950 dark:text-indigo-200 border-b-2 border-indigo-600 dark:border-indigo-400"
                              : "hover:bg-slate-100/70 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300"
                          }`}
                          title={`Click to sort by Location (${loginSortBy === "state" && loginSortOrder === "asc" ? "Switch to Descending Z-A" : "Switch to Ascending A-Z"})`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span>Location (Country / State)</span>
                            {loginSortBy === "state" ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold shadow-xs">
                                {loginSortOrder === "asc" ? (
                                  <>
                                    <ArrowUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                    <span>A-Z</span>
                                  </>
                                ) : (
                                  <>
                                    <ArrowDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                    <span>Z-A</span>
                                  </>
                                )}
                              </span>
                            ) : (
                              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100 group-hover:text-indigo-500 transition-opacity" />
                            )}
                          </div>
                        </th>

                        {/* 5. Device & OS */}
                        <th
                          onClick={() => handleSortColumn("deviceType")}
                          className={`py-3.5 px-4 text-left cursor-pointer transition-colors group ${
                            loginSortBy === "deviceType"
                              ? "bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-950 dark:text-indigo-200 border-b-2 border-indigo-600 dark:border-indigo-400"
                              : "hover:bg-slate-100/70 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300"
                          }`}
                          title={`Click to sort by Device Type (${loginSortBy === "deviceType" && loginSortOrder === "asc" ? "Switch to Descending" : "Switch to Ascending"})`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span>Device & OS</span>
                            {loginSortBy === "deviceType" ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold shadow-xs">
                                {loginSortOrder === "asc" ? (
                                  <>
                                    <ArrowUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                    <span>A-Z</span>
                                  </>
                                ) : (
                                  <>
                                    <ArrowDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                    <span>Z-A</span>
                                  </>
                                )}
                              </span>
                            ) : (
                              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100 group-hover:text-indigo-500 transition-opacity" />
                            )}
                          </div>
                        </th>

                        {/* 6. IP Address */}
                        <th
                          onClick={() => handleSortColumn("ipAddress")}
                          className={`py-3.5 px-4 text-left cursor-pointer transition-colors group ${
                            loginSortBy === "ipAddress"
                              ? "bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-950 dark:text-indigo-200 border-b-2 border-indigo-600 dark:border-indigo-400"
                              : "hover:bg-slate-100/70 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300"
                          }`}
                          title={`Click to sort by IP Address (${loginSortBy === "ipAddress" && loginSortOrder === "asc" ? "Switch to 9-0" : "Switch to 0-9"})`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span>IP Address</span>
                            {loginSortBy === "ipAddress" ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold shadow-xs">
                                {loginSortOrder === "asc" ? (
                                  <>
                                    <ArrowUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                    <span>0-9</span>
                                  </>
                                ) : (
                                  <>
                                    <ArrowDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                    <span>9-0</span>
                                  </>
                                )}
                              </span>
                            ) : (
                              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100 group-hover:text-indigo-500 transition-opacity" />
                            )}
                          </div>
                        </th>

                        {/* 7. Status */}
                        <th
                          onClick={() => handleSortColumn("status")}
                          className={`py-3.5 px-4 text-center cursor-pointer transition-colors group ${
                            loginSortBy === "status"
                              ? "bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-950 dark:text-indigo-200 border-b-2 border-indigo-600 dark:border-indigo-400"
                              : "hover:bg-slate-100/70 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300"
                          }`}
                          title={`Click to sort by Status (${loginSortBy === "status" && loginSortOrder === "asc" ? "Switch to Success First" : "Switch to Failed First"})`}
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            <span>Status</span>
                            {loginSortBy === "status" ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold shadow-xs">
                                {loginSortOrder === "asc" ? (
                                  <>
                                    <ArrowUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                    <span>Fail 1st</span>
                                  </>
                                ) : (
                                  <>
                                    <ArrowDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                    <span>Pass 1st</span>
                                  </>
                                )}
                              </span>
                            ) : (
                              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100 group-hover:text-indigo-500 transition-opacity" />
                            )}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                      {logins.map((item, idx) => {
                        const isMaster = item.role === "master_admin";
                        const DeviceIcon = item.deviceType === "mobile"
                          ? Smartphone
                          : item.deviceType === "tablet"
                          ? Tablet
                          : Monitor;

                        const flag = COUNTRY_FLAGS[item.countryCode] || COUNTRY_FLAGS[item.country] || "🇮🇳";

                        return (
                          <tr
                            key={item._id || idx}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors group"
                          >
                            {/* User Identity */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-start gap-3">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                  isMaster
                                    ? "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300"
                                    : "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                                }`}>
                                  {item.name ? item.name.charAt(0).toUpperCase() : "U"}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900 dark:text-white truncate">
                                      {item.name || "Unknown User"}
                                    </span>
                                    {item.memberId && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-600">
                                        {item.memberId}
                                      </span>
                                    )}
                                  </div>
                                  {item.shopName && (
                                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                      <Store className="w-3 h-3 text-slate-400 shrink-0" />
                                      <span className="truncate">{item.shopName}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                                    {item.mobile && (
                                      <span className="flex items-center gap-1">
                                        <Phone className="w-3 h-3" /> {item.mobile}
                                      </span>
                                    )}
                                    {item.email && (
                                      <span className="flex items-center gap-1 truncate max-w-[150px]">
                                        <Mail className="w-3 h-3" /> {item.email}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Role Badge */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {isMaster ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800">
                                <Shield className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                Master Admin
                              </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
                                  <Store className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                  Dairy Admin
                                </span>
                              )}
                            </td>

                            {/* Timestamp */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="font-semibold text-slate-900 dark:text-white text-xs">
                                {formatDateTime(item.timestamp)}
                              </div>
                              <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3" /> {formatRelativeTime(item.timestamp)}
                              </div>
                            </td>

                            {/* Location (Country / State / City) */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200 text-xs">
                                <span className="text-base">{flag}</span>
                                <span>{item.country || "India"}</span>
                              </div>
                              <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                <MapPin className="w-3 h-3 text-indigo-500 shrink-0" />
                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                  {item.state || "Maharashtra"}
                                </span>
                                {item.city && (
                                  <>
                                    <span className="text-slate-300 dark:text-slate-600">•</span>
                                    <span>{item.city}</span>
                                  </>
                                )}
                              </div>
                            </td>

                            {/* Device & OS */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
                                  <DeviceIcon className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                    {item.os || "Windows"}
                                  </div>
                                  <div className="text-[11px] text-slate-400 dark:text-slate-500">
                                    {item.browser || "Chrome"} • <span className="capitalize">{item.deviceType || "desktop"}</span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* IP Address */}
                            <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs text-slate-600 dark:text-slate-400">
                              <span className="bg-slate-100 dark:bg-slate-700/60 px-2 py-1 rounded border border-slate-200/60 dark:border-slate-700">
                                {item.ipAddress || "127.0.0.1"}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              {item.status === "failed" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                  <XCircle className="w-3 h-3" /> Failed
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                  <CheckCircle2 className="w-3 h-3" /> Success
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* ── MOBILE VIEW (Card Layout for Mobile Screens) ──────────── */}
                <div className="block md:hidden p-3.5 space-y-3">
                  {logins.map((item, idx) => {
                    const isMaster = item.role === "master_admin";
                    const DeviceIcon = item.deviceType === "mobile"
                      ? Smartphone
                      : item.deviceType === "tablet"
                      ? Tablet
                      : Monitor;

                    const flag = COUNTRY_FLAGS[item.countryCode] || COUNTRY_FLAGS[item.country] || "🇮🇳";

                    return (
                      <div
                        key={item._id || idx}
                        className={`bg-white dark:bg-slate-850 p-4 rounded-2xl border shadow-xs space-y-3 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all ${
                          item.status === "failed"
                            ? "border-rose-200 dark:border-rose-900/60 border-l-4 border-l-rose-500"
                            : isMaster
                            ? "border-purple-200/80 dark:border-purple-900/60 border-l-4 border-l-purple-500"
                            : "border-slate-200/80 dark:border-slate-700/70 border-l-4 border-l-emerald-500"
                        }`}
                      >
                        {/* Top: Avatar, Name, Member ID, Role & Status */}
                        <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-750 pb-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                              isMaster
                                ? "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300"
                                : "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                            }`}>
                              {item.name ? item.name.charAt(0).toUpperCase() : "U"}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 dark:text-white text-sm truncate">
                                {item.name || "Unknown User"}
                              </div>
                              {item.memberId && (
                                <span className="inline-block font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.2 rounded border border-slate-200 dark:border-slate-600">
                                  {item.memberId}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1 shrink-0">
                            {isMaster ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200">
                                <Shield className="w-2.5 h-2.5" /> Master
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200">
                                <Store className="w-2.5 h-2.5" /> Dairy Admin
                              </span>
                            )}
                            {item.status === "failed" ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950">
                                <XCircle className="w-2.5 h-2.5" /> Failed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Success
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Mid Details: Shop, Time, Contact */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {item.shopName && (
                            <div className="col-span-2 flex items-center gap-1 text-slate-600 dark:text-slate-300">
                              <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="font-semibold">{item.shopName}</span>
                            </div>
                          )}

                          {item.failureReason && (
                            <div className="col-span-2 text-[11px] text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-lg border border-rose-200/60 dark:border-rose-900/60 font-medium">
                              Failure Reason: {item.failureReason}
                            </div>
                          )}

                          <div className="col-span-2 flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              {formatDateTime(item.timestamp)}
                            </span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {formatRelativeTime(item.timestamp)}
                            </span>
                          </div>

                          {item.mobile && (
                            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-[11px]">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{item.mobile}</span>
                            </div>
                          )}

                          {item.email && (
                            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-[11px] truncate">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span className="truncate">{item.email}</span>
                            </div>
                          )}
                        </div>

                        {/* Bottom: Location & Device Badges */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-750 text-xs">
                          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                            <span>{flag}</span>
                            <span>{item.state || "Maharashtra"}</span>
                            {item.city && (
                              <span className="text-slate-400 text-[11px]">({item.city})</span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded">
                              <DeviceIcon className="w-3 h-3 text-slate-400" />
                              {item.os || "Windows"}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                              {item.ipAddress || "127.0.0.1"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center">
                  <Laptop className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  No login records found
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  No user logins match the current filter criteria. As Master Admins and Dairy Admins log in to the application, their session timestamps and locations will appear here in real time.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetLoginFilters}
                  className="mt-4 text-xs"
                >
                  Clear Filters
                </Button>
              </div>
            )}

            {/* ── ALWAYS-VISIBLE PROFESSIONAL PAGINATION FOOTER ───────────── */}
            {logins.length > 0 && (
              <div className="px-5 py-3.5 bg-slate-50/90 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                {/* Left info & Page Size Selector */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span>
                    Showing <span className="font-bold text-slate-800 dark:text-slate-200">{(loginPage - 1) * loginLimit + 1}</span> to{" "}
                    <span className="font-bold text-slate-800 dark:text-slate-200">{Math.min(loginPage * loginLimit, loginPagination.total || logins.length)}</span> of{" "}
                    <span className="font-bold text-slate-800 dark:text-slate-200">{loginPagination.total || logins.length}</span> login records
                  </span>

                  <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-700">
                    <span className="text-[11px] font-medium text-slate-400">Rows:</span>
                    <select
                      value={loginLimit}
                      onChange={(e) => {
                        setLoginLimit(Number(e.target.value));
                        setLoginPage(1);
                      }}
                      className="px-2 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value={5}>5 / page</option>
                      <option value={10}>10 / page</option>
                      <option value={20}>20 / page</option>
                      <option value={50}>50 / page</option>
                      <option value={100}>100 / page</option>
                    </select>
                  </div>
                </div>

                {/* Right Navigation Controls */}
                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={loginPage <= 1 || loginsLoading}
                    onClick={() => setLoginPage((prev) => Math.max(1, prev - 1))}
                    className="h-8 px-2.5 text-xs flex items-center gap-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Prev
                  </Button>

                  {/* Numbered Page Buttons */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(loginPagination.totalPages || 1, 6) }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setLoginPage(pageNum)}
                        disabled={loginsLoading}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs font-bold transition-all ${
                          pageNum === loginPage
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60"
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={loginPage >= (loginPagination.totalPages || 1) || loginsLoading}
                    onClick={() => setLoginPage((prev) => Math.min(loginPagination.totalPages || 1, prev + 1))}
                    className="h-8 px-2.5 text-xs flex items-center gap-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          COUNTRY DRILLDOWN MODAL (Interactive User Logins from clicked Country)
          ════════════════════════════════════════════════════════════════════ */}
      {selectedCountryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-850 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-50 to-indigo-50/30 dark:from-slate-900 dark:to-indigo-950/20">
              <div className="flex items-center gap-3">
                <span className="text-3xl leading-none">
                  {COUNTRY_FLAGS[selectedCountryModal.countryCode] || "🌍"}
                </span>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {selectedCountryModal.countryName}
                    <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded border border-indigo-200/60 dark:border-indigo-800">
                      {selectedCountryModal.countryCode}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {selectedCountryModal.count?.toLocaleString()} platform visits recorded from this country
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedCountryModal(null)}
                  className="rounded-full w-8 h-8 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Quick Metrics Ribbon in Modal */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50/60 dark:bg-slate-850/60 border-b border-slate-100 dark:border-slate-800 text-xs">
              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/60 shadow-xs">
                <span className="text-slate-400 block text-[11px] font-semibold uppercase">Total Logins</span>
                <span className="text-xl font-black text-slate-900 dark:text-white">
                  {countryLoginsSummary?.totalLogins || 0}
                </span>
              </div>
              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/60 shadow-xs">
                <span className="text-purple-500 block text-[11px] font-semibold uppercase">Master Admins</span>
                <span className="text-xl font-black text-purple-600 dark:text-purple-400">
                  {countryLoginsSummary?.masterLogins || 0}
                </span>
              </div>
              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/60 shadow-xs">
                <span className="text-emerald-500 block text-[11px] font-semibold uppercase">Dairy Admins</span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {countryLoginsSummary?.dairyLogins || 0}
                </span>
              </div>
              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/60 shadow-xs">
                <span className="text-indigo-500 block text-[11px] font-semibold uppercase">Unique Admins</span>
                <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                  {countryLoginsSummary?.uniqueUsers || 0}
                </span>
              </div>
            </div>

            {/* Modal Body / User Login Table */}
            <div className="p-4 overflow-y-auto flex-1">
              {countryLoginsLoading ? (
                <div className="p-6 space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : countryLogins.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-100 dark:border-slate-700/60">
                      <tr>
                        <th className="py-2.5 px-3 text-left">User & Member ID</th>
                        <th className="py-2.5 px-3 text-left">Role</th>
                        <th className="py-2.5 px-3 text-left">Location (State/City)</th>
                        <th className="py-2.5 px-3 text-left">Device & Browser</th>
                        <th className="py-2.5 px-3 text-left">Date & Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
                      {countryLogins.map((item, idx) => {
                        const isMaster = item.role === "master_admin";
                        const DevIcon = item.deviceType === "mobile"
                          ? Smartphone
                          : item.deviceType === "tablet"
                          ? Tablet
                          : Monitor;

                        return (
                          <tr key={item._id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            {/* User & Member ID */}
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <div className="font-bold text-slate-900 dark:text-white">
                                {item.name || "User"}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5 font-mono text-[11px] text-indigo-600 dark:text-indigo-400">
                                <span>{item.memberId || "N/A"}</span>
                                {item.shopName && (
                                  <span className="text-slate-400 font-sans">• {item.shopName}</span>
                                )}
                              </div>
                            </td>

                            {/* Role */}
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {isMaster ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200">
                                  <Shield className="w-3 h-3" /> Master
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200">
                                  <Store className="w-3 h-3" /> Dairy Admin
                                </span>
                              )}
                            </td>

                            {/* Location */}
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <div className="font-semibold text-slate-800 dark:text-slate-200">
                                {item.state || "Maharashtra"}
                              </div>
                              <div className="text-slate-400 text-[11px] flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-indigo-500" />
                                {item.city || "Unknown City"} ({item.ipAddress || "127.0.0.1"})
                              </div>
                            </td>

                            {/* Device & OS */}
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                                <DevIcon className="w-3.5 h-3.5 text-slate-500" />
                                <span>{item.os || "Windows"}</span>
                              </div>
                              <div className="text-slate-400 text-[11px]">
                                {item.browser || "Chrome"}
                              </div>
                            </td>

                            {/* Timestamp */}
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <div className="font-semibold text-slate-900 dark:text-white">
                                {formatDateTime(item.timestamp)}
                              </div>
                              <div className="text-slate-400 text-[11px]">
                                {formatRelativeTime(item.timestamp)}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Globe className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    No authenticated admin logins from {selectedCountryModal.countryName}
                  </h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
                    {selectedCountryModal.count?.toLocaleString()} anonymous/public visitors have accessed the platform from this country, but no logged-in Master or Dairy Admin user sessions exist yet.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCountryModal(null)}
                className="text-xs"
              >
                Close
              </Button>

              <Button
                size="sm"
                onClick={() => handleJumpToLoginsForCountry(selectedCountryModal.countryName)}
                className="text-xs flex items-center gap-1.5"
              >
                <span>Filter All in User Login Activity</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
