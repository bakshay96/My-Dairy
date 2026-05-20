"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { socket } from "@/lib/socket";
import { useAuthStore } from "@/lib/store";
import {
  X, ChevronDown, ChevronUp, ExternalLink, ChevronLeft, ChevronRight,
  Info, CheckCircle2, AlertTriangle, Gift, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Snooze helpers (localStorage-based, not DB) ───────────────────────────────
const SNOOZE_KEY    = "milkify_ad_snooze";
const HISTORY_KEY   = "milkify_ad_history"; // track permanently dismissed ads
const SNOOZE_HOURS  = 1; // re-show after 1 hour
const AUTO_DISMISS_SECONDS = 8; // auto-close after 8 seconds

function getSnoozed() {
  try { return JSON.parse(localStorage.getItem(SNOOZE_KEY) || "{}"); } catch { return {}; }
}
function snoozeAd(adId) {
  const map = getSnoozed();
  map[adId] = Date.now();
  // Clean up expired snoozes
  const cutoff = Date.now() - SNOOZE_HOURS * 3600 * 1000;
  Object.keys(map).forEach((k) => { if (map[k] < cutoff) delete map[k]; });
  localStorage.setItem(SNOOZE_KEY, JSON.stringify(map));
}
function isSnoozed(adId) {
  const map = getSnoozed();
  if (!map[adId]) return false;
  return Date.now() - map[adId] < SNOOZE_HOURS * 3600 * 1000;
}

// ── Ad History: track all dismissed ads ──────────────────────────────────────
function getAdHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
}
function addToHistory(ad) {
  const history = getAdHistory();
  const exists = history.find((h) => h._id === ad._id);
  if (!exists) {
    history.push({ ...ad, dismissedAt: new Date().toISOString() });
    // Keep only last 50 dismissed ads
    if (history.length > 50) history.shift();
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }
}
export function getAdvertisementHistory() {
  return getAdHistory();
}

// ── Decode any HTML entities that may exist in stored URLs ───────────────────
function decodeHtmlEntities(str) {
  if (!str || typeof str !== "string") return "";
  return str
    .replace(/&#x2F;/gi, "/")
    .replace(/&#47;/gi, "/")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#x27;/gi, "'")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&");
}

// ── Type styles ───────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  info: {
    Icon: Info,
    bg:      "bg-blue-50 dark:bg-blue-950/50",
    border:  "border-blue-200 dark:border-blue-800/60",
    icon:    "text-blue-600 dark:text-blue-400",
    title:   "text-blue-900 dark:text-blue-100",
    body:    "text-blue-800 dark:text-blue-300",
    badge:   "bg-blue-600",
    dismiss: "hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-500",
    cta:     "bg-blue-600 hover:bg-blue-700 text-white",
    dot:     "bg-blue-500",
  },
  success: {
    Icon: CheckCircle2,
    bg:      "bg-emerald-50 dark:bg-emerald-950/50",
    border:  "border-emerald-200 dark:border-emerald-800/60",
    icon:    "text-emerald-600 dark:text-emerald-400",
    title:   "text-emerald-900 dark:text-emerald-100",
    body:    "text-emerald-800 dark:text-emerald-300",
    badge:   "bg-emerald-600",
    dismiss: "hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-500",
    cta:     "bg-emerald-600 hover:bg-emerald-700 text-white",
    dot:     "bg-emerald-500",
  },
  warning: {
    Icon: AlertTriangle,
    bg:      "bg-amber-50 dark:bg-amber-950/50",
    border:  "border-amber-200 dark:border-amber-800/60",
    icon:    "text-amber-600 dark:text-amber-400",
    title:   "text-amber-900 dark:text-amber-100",
    body:    "text-amber-800 dark:text-amber-300",
    badge:   "bg-amber-500",
    dismiss: "hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-500",
    cta:     "bg-amber-600 hover:bg-amber-700 text-white",
    dot:     "bg-amber-500",
  },
  promo: {
    Icon: Gift,
    bg:      "bg-purple-50 dark:bg-purple-950/50",
    border:  "border-purple-200 dark:border-purple-800/60",
    icon:    "text-purple-600 dark:text-purple-400",
    title:   "text-purple-900 dark:text-purple-100",
    body:    "text-purple-800 dark:text-purple-300",
    badge:   "bg-purple-600",
    dismiss: "hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-500",
    cta:     "bg-purple-600 hover:bg-purple-700 text-white",
    dot:     "bg-purple-500",
  },
  update: {
    Icon: Zap,
    bg:      "bg-cyan-50 dark:bg-cyan-950/50",
    border:  "border-cyan-200 dark:border-cyan-800/60",
    icon:    "text-cyan-600 dark:text-cyan-400",
    title:   "text-cyan-900 dark:text-cyan-100",
    body:    "text-cyan-800 dark:text-cyan-300",
    badge:   "bg-cyan-600",
    dismiss: "hover:bg-cyan-100 dark:hover:bg-cyan-900/50 text-cyan-500",
    cta:     "bg-cyan-600 hover:bg-cyan-700 text-white",
    dot:     "bg-cyan-500",
  },
};
const getCfg = (type) => TYPE_CONFIG[type] || TYPE_CONFIG.info;

// ── Helpers ───────────────────────────────────────────────────────────────────
function isAdEligible(ad, adminId) {
  const now = new Date();
  if (!ad.isActive) return false;
  if (new Date(ad.expiresAt) < now) return false;
  if (new Date(ad.visibleFrom) > now) return false;
  if (ad.dismissedBy?.includes(adminId)) return false;
  const targets = ad.targetAdmins || [];
  if (targets.length > 0 && !targets.some((t) => String(t._id || t) === String(adminId))) return false;
  return true;
}

/**
 * AlertBanner
 * Props:
 *   suppress {boolean} — render nothing (use on add-milk page)
 */
export default function AlertBanner({ suppress = false }) {
  const user           = useAuthStore((s) => s.user);
  const adminId        = user?._id || user?.id;
  const [ads, setAds]  = useState([]);
  const [expanded, setExpanded] = useState(null);

  // ── Initial HTTP fetch ────────────────────────────────────────────────────
  const fetchAds = useCallback(async () => {
    if (!adminId) return;
    try {
      const res = await api.get("/master/advertisements/my");
      const incoming = res.data?.data?.advertisements || res.data?.advertisements || [];
      // Filter out snoozed ads on the client side
      setAds(incoming.filter((a) => !isSnoozed(a._id)));
    } catch {
      // Silent — non-critical feature
    }
  }, [adminId]);

  // ── Socket setup — real-time push, no page refresh needed ────────────────
  useEffect(() => {
    if (suppress || !adminId) return;

    // Connect socket if not already connected
    if (!socket.connected) socket.connect();

    const onConnect = () => {
      // Join both rooms: admin-specific and the global 'ads' broadcast room
      socket.emit("join_room", `admin:${adminId}`);
      socket.emit("join_room", "ads");
    };

    const onAdPush = ({ action, advertisement: ad }) => {
      if (!ad) return;

      if (action === "removed") {
        setAds((prev) => prev.filter((a) => a._id !== ad._id));
        return;
      }

      if (action === "updated") {
        setAds((prev) => {
          const exists = prev.find((a) => a._id === ad._id);
          if (!isAdEligible(ad, adminId) || isSnoozed(ad._id)) {
            return prev.filter((a) => a._id !== ad._id);
          }
          if (exists) return prev.map((a) => (a._id === ad._id ? ad : a));
          return [ad, ...prev];
        });
        return;
      }

      // action === "new"
      if (!isAdEligible(ad, adminId) || isSnoozed(ad._id)) return;
      setAds((prev) => {
        if (prev.find((a) => a._id === ad._id)) return prev;
        return [ad, ...prev].sort((a, b) => (b.priority || 0) - (a.priority || 0));
      });
    };

    socket.on("connect", onConnect);
    socket.on("advertisement_push", onAdPush);
    if (socket.connected) onConnect(); // already connected

    fetchAds(); // initial load

    return () => {
      socket.off("connect", onConnect);
      socket.off("advertisement_push", onAdPush);
    };
  }, [suppress, adminId, fetchAds]);

  // ── Carousel state: auto-rotate through ads ─────────────────────────────────
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [autoDismissCountdown, setAutoDismissCountdown] = useState(AUTO_DISMISS_SECONDS);

  // Get current ad early so it can be used in useEffect
  const currentAd = ads.length > 0 ? ads[currentIndex] : null;

  // ── Auto-dismiss timer (8 seconds) ────────────────────────────────────────
  useEffect(() => {
    if (suppress || ads.length === 0 || !currentAd) return;
    
    const timer = setInterval(() => {
      setAutoDismissCountdown((prev) => {
        if (prev <= 1) {
          // Auto-dismiss current ad
          const adToDismiss = currentAd;
          addToHistory(adToDismiss);
          snoozeAd(adToDismiss._id);
          setAds((prevAds) => prevAds.filter((a) => a._id !== adToDismiss._id));
          setAutoDismissCountdown(AUTO_DISMISS_SECONDS);
          setAutoRotate(true);
          return AUTO_DISMISS_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [suppress, currentAd, ads.length]);

  // ── Auto-rotate every 5 seconds ───────────────────────────────────────────
  useEffect(() => {
    if (suppress || ads.length <= 1 || !autoRotate) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, 5000); // 5 second rotation
    return () => clearInterval(interval);
  }, [suppress, ads.length, autoRotate]);

  // ── Manual navigation ────────────────────────────────────────────────────
  const handlePrev = () => {
    setAutoRotate(false);
    setCurrentIndex((prev) => (prev - 1 + ads.length) % ads.length);
  };

  const handleNext = () => {
    setAutoRotate(false);
    setCurrentIndex((prev) => (prev + 1) % ads.length);
  };

  const goToSlide = (index) => {
    setAutoRotate(false);
    setCurrentIndex(index);
  };

  // ── Dismiss = 1-hour snooze (re-appears after snooze period) ─────────────
  const dismiss = useCallback((adId) => {
    const adToDismiss = ads.find((a) => a._id === adId);
    if (adToDismiss) {
      addToHistory(adToDismiss); // Save to permanent history
    }
    snoozeAd(adId); // localStorage snooze for 1 hour
    const newAds = ads.filter((a) => a._id !== adId);
    setAds(newAds);
    if (newAds.length > 0) {
      setCurrentIndex(Math.min(currentIndex, newAds.length - 1));
      setAutoRotate(true); // resume auto-rotation after dismiss
      setAutoDismissCountdown(AUTO_DISMISS_SECONDS); // reset countdown
    }
  }, [ads, currentIndex]);

  if (suppress || ads.length === 0) return null;

  const cfg = getCfg(currentAd.type);
  const isExpand = expanded === currentAd._id;
  const ctaUrl = decodeHtmlEntities(currentAd.ctaUrl);

  return (
    <div className="mb-4 w-full">
      {/* Main Alert Card */}
      <div
        className={cn(
          "relative rounded-xl border overflow-hidden shadow-md",
          "transition-all duration-300 animate-in fade-in",
          cfg.bg,
          cfg.border
        )}
      >
        {/* High priority pulse strip */}
        {(currentAd.priority || 0) >= 7 && (
          <div className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l-xl animate-pulse", cfg.dot)} />
        )}

        {/* Main content */}
        <div className={cn("flex items-start gap-2 sm:gap-3 px-3 sm:px-4 py-3 sm:py-4", (currentAd.priority || 0) >= 7 && "pl-4 sm:pl-5")}>
          {/* Type icon */}
          <div className={cn("mt-0.5 shrink-0", cfg.icon)}>
            <cfg.Icon className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title + badge row */}
            <div className="flex items-center gap-2 flex-wrap">
              <p className={cn("text-sm sm:text-base font-bold leading-snug", cfg.title)}>
                {currentAd.title}
              </p>
              <span
                className={cn(
                  "text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded text-white",
                  cfg.badge
                )}
              >
                {currentAd.type}
              </span>
              {(currentAd.priority || 0) >= 7 && (
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-500 text-white animate-pulse">
                  urgent
                </span>
              )}
            </div>

            {/* Body — collapsible */}
            <p
              className={cn(
                "mt-1 sm:mt-2 text-xs sm:text-sm leading-relaxed",
                cfg.body,
                !isExpand && "line-clamp-2 sm:line-clamp-3"
              )}
            >
              {currentAd.message}
            </p>

            {/* Actions row */}
            <div className="flex items-center gap-2 sm:gap-3 mt-2 sm:mt-3 flex-wrap">
              {ctaUrl && currentAd.ctaLabel && (
                <a
                  href={ctaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold px-2 sm:px-2.5 py-1 rounded-lg transition-colors",
                    cfg.cta
                  )}
                >
                  {currentAd.ctaLabel}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {isExpand && (
                <button
                  onClick={() => setExpanded(isExpand ? null : currentAd._id)}
                  className={cn(
                    "inline-flex items-center gap-0.5 text-[10px] sm:text-[11px] font-medium transition-opacity hover:opacity-70",
                    cfg.body
                  )}
                >
                  <ChevronUp className="h-3 w-3" />
                  Less
                </button>
              )}
              {!isExpand && (
                <button
                  onClick={() => setExpanded(currentAd._id)}
                  className={cn(
                    "inline-flex items-center gap-0.5 text-[10px] sm:text-[11px] font-medium transition-opacity hover:opacity-70",
                    cfg.body
                  )}
                >
                  <ChevronDown className="h-3 w-3" />
                  More
                </button>
              )}
            </div>
          </div>

          {/* Dismiss */}
          <button
            onClick={() => dismiss(currentAd._id)}
            aria-label="Dismiss alert"
            className={cn(
              "shrink-0 mt-0.5 p-1.5 rounded-full transition-colors",
              cfg.dismiss
            )}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Carousel controls - only show if more than 1 ad */}
        {ads.length > 1 && (
          <div className="border-t px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2 bg-opacity-50">
            {/* Previous button */}
            <button
              onClick={handlePrev}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                cfg.dismiss
              )}
              aria-label="Previous alert"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Pagination dots */}
            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              {ads.map((ad, idx) => (
                <button
                  key={ad._id}
                  onClick={() => goToSlide(idx)}
                  className={cn(
                    "h-2 rounded-full transition-all",
                    idx === currentIndex
                      ? "w-6 sm:w-8 " + cfg.badge
                      : "w-2 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500"
                  )}
                  aria-label={`Go to alert ${idx + 1}`}
                />
              ))}
            </div>

            {/* Counter, Auto-dismiss timer, and Next button */}
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-[10px] sm:text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                  {currentIndex + 1}/{ads.length}
                </span>
                <span className="text-[8px] sm:text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                  Close in {autoDismissCountdown}s
                </span>
              </div>
              <button
                onClick={handleNext}
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  cfg.dismiss
                )}
                aria-label="Next alert"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Auto-play indicator (mobile-friendly) */}
      {ads.length > 1 && autoRotate && (
        <div className="mt-2 text-center text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400">
          Auto-rotating • Tap to manual browse
        </div>
      )}
    </div>
  );
}

/**
 * AlertDot — tiny badge for sidebar nav items.
 */
export function AlertDot({ count }) {
  if (!count || count <= 0) return null;
  return (
    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white px-1 leading-none">
      {count > 9 ? "9+" : count}
    </span>
  );
}

/**
 * useLiveAlertCount — returns live unread ad count for sidebar badge.
 * Uses socket to stay in sync without polling.
 */
export function useLiveAlertCount() {
  const user    = useAuthStore((s) => s.user);
  const adminId = user?._id || user?.id;
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!adminId) return;

    const fetchCount = async () => {
      try {
        const res = await api.get("/master/advertisements/my");
        const ads = res.data?.data?.advertisements || res.data?.advertisements || [];
        setCount(ads.length);
      } catch { setCount(0); }
    };

    fetchCount();

    const onAdPush = ({ action }) => {
      if (action === "new")     setCount((c) => c + 1);
      if (action === "removed") setCount((c) => Math.max(0, c - 1));
      if (action === "updated") fetchCount(); // re-fetch on updates
    };

    if (!socket.connected) socket.connect();
    socket.on("advertisement_push", onAdPush);

    return () => { socket.off("advertisement_push", onAdPush); };
  }, [adminId]);

  return count;
}

/**
 * useLiveTicketCount — returns live unread ticket count for sidebar badge.
 */
export function useLiveTicketCount() {
  const user = useAuthStore((s) => s.user);
  const adminId = user?._id || user?.id;
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!adminId) return;
    const fetchCount = async () => {
      try {
        const res = await api.get("/tickets/unread-count");
        setCount(res.data?.data?.count || 0);
      } catch { setCount(0); }
    };
    fetchCount();

    const onUpdate = () => fetchCount();
    
    if (!socket.connected) socket.connect();
    socket.on("ticket_reply", onUpdate);
    socket.on("ticket_updated", onUpdate);
    
    return () => {
      socket.off("ticket_reply", onUpdate);
      socket.off("ticket_updated", onUpdate);
    };
  }, [adminId]);

  return count;
}
