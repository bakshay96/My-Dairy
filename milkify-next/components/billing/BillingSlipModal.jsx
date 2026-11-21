"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  Download, 
  Mail, 
  X, 
  ReceiptIndianRupee,
  IndianRupee,
  CheckCircle2, 
  Droplet,
  Calculator,
  Calendar,
  Globe,
  Share2,
  Clock
} from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { formatIndianDate, formatRupees } from "@/lib/utils";

const languageText = {
  en: {
    title: "Thermal Billing Slip",
    subtitle: "80mm POS Milk Collection Statement",
    date: "Date",
    liters: "Liters",
    fat: "FAT",
    snf: "SNF",
    rate: "Rate",
    amount: "Amount",
    shift: "Shift",
    category: "Category",
    status: "Status",
    total: "Cycle Summary",
    grossTotal: "Gross Bill",
    paidAmount: "Paid Amount",
    unpaidBalance: "Net Payable (Due)",
    allFilter: "All Records",
    unpaidFilter: "Unpaid Only",
    paidFilter: "Paid Only",
    downloadPdf: "Download PDF Slip",
  },
  hi: {
    title: "थर्मल बिलिंग पर्ची",
    subtitle: "80mm पीओएस दूध संकलन विवरण",
    date: "तारीख",
    liters: "लीटर",
    fat: "फैट",
    snf: "एसएनएफ",
    rate: "दर",
    amount: "राशि",
    shift: "शिफ्ट",
    category: "प्रकार",
    status: "स्थिति",
    total: "चक्र सारांश",
    grossTotal: "कुल चक्र बिल",
    paidAmount: "चुकता राशि",
    unpaidBalance: "अंतिम देय बाकी",
    allFilter: "सभी प्रविष्टियां",
    unpaidFilter: "केवल बाकी",
    paidFilter: "केवल चुकता",
    downloadPdf: "पीडीएफ स्लिप डाउनलोड",
  },
  mr: {
    title: "थर्मल बिलिंग पावती",
    subtitle: "80mm POS दूध संकलन पावती",
    date: "तारीख",
    liters: "लिटर",
    fat: "फॅट",
    snf: "SNF",
    rate: "दर",
    amount: "रक्कम",
    shift: "वेळ",
    category: "प्रकार",
    status: "स्थिती",
    total: "एकूण सायकल गोषवारा",
    grossTotal: "एकूण चक्र बिल",
    paidAmount: "चुकता रक्कम",
    unpaidBalance: "एकूण देय बाकी",
    allFilter: "सर्व नोंदी",
    unpaidFilter: "फक्त बाकी नोंदी",
    paidFilter: "फक्त चुकता नोंदी",
    downloadPdf: "PDF स्लिप डाउनलोड",
  },
};

const shiftMap = {
  en: { morning: "Morning", evening: "Evening" },
  hi: { morning: "सुबह", evening: "शाम" },
  mr: { morning: "सकाळ", evening: "संध्याकाळ" },
};

const categoryMap = {
  en: { cow: "Cow", goat: "Goat", buffalo: "Buffalo" },
  hi: { cow: "गाय", goat: "बकरी", buffalo: "भैंस" },
  mr: { cow: "गाय", goat: "बकरी", buffalo: "म्हैस" },
};

export default function BillingSlipModal({ slipData, isOpen, onClose, initialLanguage = "mr" }) {
  const [mounted, setMounted] = useState(false);
  const [language, setLanguage] = useState(initialLanguage);
  const [statusCategory, setStatusCategory] = useState("all"); // 'all' | 'unpaid' | 'paid'
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [showEmailPicker, setShowEmailPicker] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key & manage body scroll
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  const t = useMemo(() => languageText[language] || languageText.en, [language]);

  const { farmer, entries = [], dateRange = {} } = slipData || {};

  // Compute breakdown counts and amounts
  const {
    totalCount,
    paidCount,
    unpaidCount,
    paidTotalAmount,
    unpaidTotalAmount,
    overallGrossTotal
  } = useMemo(() => {
    let pCount = 0;
    let uCount = 0;
    let pAmt = 0;
    let uAmt = 0;
    let total = 0;

    (entries || []).forEach((e) => {
      const amt = Number(e.calculatedAmount || 0);
      total += amt;
      if (e.paymentStatus === "paid") {
        pCount++;
        pAmt += amt;
      } else {
        uCount++;
        uAmt += amt;
      }
    });

    return {
      totalCount: entries?.length || 0,
      paidCount: pCount,
      unpaidCount: uCount,
      paidTotalAmount: pAmt,
      unpaidTotalAmount: uAmt,
      overallGrossTotal: total,
    };
  }, [entries]);

  // Filter entries based on selected category
  const filteredEntries = useMemo(() => {
    if (!entries) return [];
    if (statusCategory === "unpaid") {
      return entries.filter((e) => e.paymentStatus !== "paid");
    }
    if (statusCategory === "paid") {
      return entries.filter((e) => e.paymentStatus === "paid");
    }
    return entries;
  }, [entries, statusCategory]);

  // Compute active metrics for displayed entries
  const activeMetrics = useMemo(() => {
    if (!filteredEntries?.length) {
      return { totalLiters: 0, totalAmount: 0, avgFat: 0, avgSnf: 0, avgRate: 0 };
    }
    let liters = 0;
    let amount = 0;
    let fat = 0;
    let snf = 0;

    filteredEntries.forEach((e) => {
      liters += Number(e.litter || 0);
      amount += Number(e.calculatedAmount || 0);
      fat += Number(e.fat || 0);
      snf += Number(e.snf || 0);
    });

    const count = filteredEntries.length || 1;
    return {
      totalLiters: liters,
      totalAmount: amount,
      avgFat: fat / count,
      avgSnf: snf / count,
      avgRate: liters > 0 ? amount / liters : 0,
    };
  }, [filteredEntries]);

  // Status badge calculation for the bill
  const billStatus = useMemo(() => {
    if (unpaidCount === 0 && totalCount > 0) return "paid";
    if (paidCount === 0 && totalCount > 0) return "unpaid";
    if (paidCount > 0 && unpaidCount > 0) return "partial";
    return "none";
  }, [paidCount, unpaidCount, totalCount]);

  // Download 80mm POS Thermal Slip PDF
  const handleDownloadPdf = async (selectedLang) => {
    try {
      setPdfLoading(true);
      setShowLangPicker(false);
      const targetFarmerId = farmer?.id || farmer?._id;
      if (!targetFarmerId) {
        toast.error("Farmer ID missing for PDF download");
        return;
      }
      const url = `/billing/pdf/${targetFarmerId}?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&lang=${selectedLang}&status=${statusCategory}`;
      const response = await api.get(url, { responseType: "blob" });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      const startFormatted = formatIndianDate(dateRange?.startDate);
      const endFormatted = formatIndianDate(dateRange?.endDate);
      link.setAttribute("download", `Thermal_Bill_${farmer?.name || "Farmer"}_${statusCategory}_${startFormatted}_to_${endFormatted}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success("Thermal Slip PDF downloaded successfully!");
    } catch (error) {
      console.error("Thermal PDF download failed:", error);
      toast.error("Failed to download Thermal PDF. Please try again.");
    } finally {
      setPdfLoading(false);
    }
  };

  // Email 80mm POS Thermal Slip PDF
  const handleSendEmail = async (selectedLang) => {
    try {
      setEmailLoading(true);
      setShowEmailPicker(false);
      const targetFarmerId = farmer?.id || farmer?._id;
      if (!targetFarmerId) {
        toast.error("Farmer ID missing for email dispatch");
        return;
      }
      await api.post(
        `/billing/email/${targetFarmerId}?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&lang=${selectedLang}&status=${statusCategory}`
      );
      toast.success(`Thermal bill sent successfully to farmer's email!`);
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to send email.";
      toast.error(`Error: ${msg}`);
    } finally {
      setEmailLoading(false);
    }
  };

  // WhatsApp / Share Thermal Slip Receipt
  const handleShareThermalSlip = () => {
    const shopName = slipData?.adminShopName || "Milkify Dairy";
    const statusText = 
      billStatus === "paid" ? "✓ FULLY PAID / पूर्ण चुकता" :
      billStatus === "partial" ? `⚠️ PARTIAL / बाकी ₹${unpaidTotalAmount.toFixed(2)}` :
      "⏳ UNPAID / बाकी देय";

    const filterText = 
      statusCategory === "unpaid" ? "Unpaid Records Only" :
      statusCategory === "paid" ? "Paid Records Only" : "All Collection Records";

    // Build plain text thermal format
    let receiptText = `🧾 *${shopName.toUpperCase()}*\n`;
    receiptText += `*THERMAL MILK COLLECTION SLIP*\n`;
    receiptText += `--------------------------------\n`;
    receiptText += `👤 Farmer: *${farmer?.name}* (#${farmer?.memberId || (farmer?.id || "").slice(-6)})\n`;
    receiptText += `📞 Mobile: ${farmer?.mobile || "N/A"}\n`;
    receiptText += `📍 Village: ${farmer?.village || "N/A"}\n`;
    receiptText += `📅 Period: ${formatIndianDate(dateRange?.startDate)} - ${formatIndianDate(dateRange?.endDate)}\n`;
    receiptText += `🏷️ Category: ${filterText}\n`;
    receiptText += `--------------------------------\n`;
    receiptText += `🥛 Total Milk: *${activeMetrics.totalLiters.toFixed(2)} L* (${filteredEntries.length} entries)\n`;
    receiptText += `🧪 Avg FAT/SNF: *${activeMetrics.avgFat.toFixed(1)}% / ${activeMetrics.avgSnf.toFixed(1)}*\n`;
    receiptText += `📈 Avg Rate: *₹${activeMetrics.avgRate.toFixed(2)} / L*\n`;
    receiptText += `--------------------------------\n`;
    receiptText += `💰 Gross Bill: ₹${overallGrossTotal.toFixed(2)}\n`;
    receiptText += `✅ Already Paid: ₹${paidTotalAmount.toFixed(2)}\n`;
    receiptText += `⚠️ *NET PAYABLE (बाकी): ₹${unpaidTotalAmount.toFixed(2)}*\n`;
    receiptText += `--------------------------------\n`;
    receiptText += `Status: *${statusText}*\n`;
    receiptText += `_Powered by Milkify Dairy Solutions_`;

    if (navigator.share) {
      navigator.share({
        title: `Thermal Bill - ${farmer?.name}`,
        text: receiptText,
      }).catch(() => {
        openWhatsApp(receiptText);
      });
    } else {
      openWhatsApp(receiptText);
    }
  };

  const openWhatsApp = (text) => {
    const cleanMobile = (farmer?.mobile || "").replace(/\D/g, "");
    const finalNumber = cleanMobile.length === 10 ? `91${cleanMobile}` : cleanMobile;
    const waUrl = finalNumber 
      ? `https://wa.me/${finalNumber}?text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank");
    toast.success("Opened WhatsApp with thermal receipt!");
  };

  if (!isOpen || !slipData || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden animate-in fade-in duration-200">
      
      {/* ── Main High-Density Cockpit Container ──────────────────────────── */}
      <div
        ref={modalRef}
        className="w-full max-w-6xl max-h-[96vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
      >
        
        {/* ── Top Header Bar ─────────────────────────────────────────────── */}
        <header className="bg-slate-50/90 dark:bg-slate-850/90 px-4 sm:px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          
          {/* Left: Farmer Title & Member ID */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <ReceiptIndianRupee className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 dark:text-white text-base sm:text-lg leading-tight">
                  {farmer?.name || "Farmer Bill"}
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-xs font-mono font-bold border border-purple-200 dark:border-purple-800">
                  {farmer?.memberId || "#" + (farmer?.id || "").slice(-6).toUpperCase()}
                </span>
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">• {farmer?.mobile || "No Mobile"}</span>
                {farmer?.village && (
                  <span className="text-xs text-slate-400 font-medium hidden md:inline">({farmer.village})</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {slipData?.adminShopName || "Milkify Dairy Center"} • {t.title}
              </p>
            </div>
          </div>

          {/* Right Action Bar: Language, PDF Slip, Email, Share & Close */}
          <div className="flex items-center gap-2">
            
            {/* Language Selector */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
              <Globe className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-transparent border-none text-xs font-bold focus:outline-none cursor-pointer"
              >
                <option value="mr">मराठी (MR)</option>
                <option value="en">English (EN)</option>
                <option value="hi">हिंदी (HI)</option>
              </select>
            </div>

            {/* Dedicated PDF Slip Generation (MR / EN / HI) */}
            {showLangPicker ? (
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 border dark:border-slate-700 rounded-xl p-0.5 text-xs">
                <span className="text-[10px] text-slate-400 px-1 font-semibold">Slip:</span>
                {[{ code: "mr", label: "MR" }, { code: "en", label: "EN" }, { code: "hi", label: "HI" }].map((l) => (
                  <button
                    key={l.code}
                    onClick={() => handleDownloadPdf(l.code)}
                    disabled={pdfLoading}
                    className={`px-2.5 py-1 text-xs rounded-lg font-bold transition-all ${
                      language === l.code ? "bg-emerald-600 text-white shadow-sm" : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
                <button onClick={() => setShowLangPicker(false)} className="text-slate-400 hover:text-slate-600 px-1 text-xs">✕</button>
              </div>
            ) : (
              <Button
                size="sm"
                className="h-8 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl gap-1.5 shadow-sm text-xs"
                onClick={() => setShowLangPicker(true)}
                disabled={pdfLoading}
                title="Download Dedicated 80mm Thermal Slip PDF"
              >
                <Download className="h-3.5 w-3.5" />
                <span>{pdfLoading ? "Generating..." : "PDF Slip"}</span>
              </Button>
            )}

            {/* Email Thermal Slip */}
            {showEmailPicker ? (
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 border dark:border-slate-700 rounded-xl p-0.5 text-xs">
                <span className="text-[10px] text-blue-500 px-1 font-semibold">Email:</span>
                {[{ code: "mr", label: "MR" }, { code: "en", label: "EN" }, { code: "hi", label: "HI" }].map((l) => (
                  <button
                    key={l.code}
                    onClick={() => handleSendEmail(l.code)}
                    disabled={emailLoading}
                    className="px-2.5 py-1 text-xs rounded-lg font-bold bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300"
                  >
                    {l.label}
                  </button>
                ))}
                <button onClick={() => setShowEmailPicker(false)} className="text-slate-400 hover:text-slate-600 px-1 text-xs">✕</button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2.5 font-bold rounded-xl gap-1.5 border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 text-xs hidden sm:flex"
                onClick={() => setShowEmailPicker(true)}
                disabled={emailLoading}
                title="Email Thermal Slip PDF"
              >
                <Mail className="h-3.5 w-3.5" />
                <span>{emailLoading ? "..." : "Email"}</span>
              </Button>
            )}

            {/* WhatsApp / Share Slip */}
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-3 font-bold rounded-xl gap-1.5 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-xs flex"
              onClick={handleShareThermalSlip}
              title="Share Thermal Slip via WhatsApp / Web Share"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>Share Slip</span>
            </Button>

            {/* Close Button */}
            <button
              onClick={onClose}
              title="Close (Esc)"
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* ── Category Filter Bar (All / Unpaid / Paid) ────────────────── */}
        <div className="bg-slate-100/70 dark:bg-slate-850 px-4 sm:px-6 py-2 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">Category:</span>
            
            {/* All Entries Tab */}
            <button
              onClick={() => setStatusCategory("all")}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                statusCategory === "all"
                  ? "bg-purple-600 text-white shadow-sm shadow-purple-500/20"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <span>{t.allFilter}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/15 font-mono">{totalCount}</span>
            </button>

            {/* Unpaid Only Tab */}
            <button
              onClick={() => setStatusCategory("unpaid")}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                statusCategory === "unpaid"
                  ? "bg-amber-600 text-white shadow-sm shadow-amber-500/20"
                  : "bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
              }`}
            >
              <Clock className="h-3 w-3" />
              <span>{t.unpaidFilter}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/15 font-mono">
                {unpaidCount} • {formatRupees(unpaidTotalAmount)}
              </span>
            </button>

            {/* Paid Only Tab */}
            <button
              onClick={() => setStatusCategory("paid")}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                statusCategory === "paid"
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-500/20"
                  : "bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
              }`}
            >
              <CheckCircle2 className="h-3 w-3" />
              <span>{t.paidFilter}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/15 font-mono">
                {paidCount} • {formatRupees(paidTotalAmount)}
              </span>
            </button>
          </div>

          {/* Right Status Badge */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-medium hidden md:inline">Cycle Status:</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider border flex items-center gap-1 ${
              billStatus === "paid"
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300"
                : billStatus === "partial"
                ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300"
                : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300"
            }`}>
              {billStatus === "paid" && <CheckCircle2 className="h-3 w-3" />}
              {billStatus === "unpaid" && <Clock className="h-3 w-3" />}
              {billStatus === "paid" ? "ALL PAID / चुकता" : billStatus === "partial" ? "PARTIAL / अंशतः" : "UNPAID / बाकी"}
            </span>
          </div>
        </div>

        {/* ── Single-Row High-Impact Metric Strip ─────────────────────────── */}
        <div className="bg-gradient-to-r from-purple-500/5 via-blue-500/5 to-emerald-500/5 dark:from-slate-850 dark:to-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 py-2.5 grid grid-cols-2 sm:grid-cols-5 gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-purple-500 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Period</span>
              <strong className="text-xs font-black text-slate-900 dark:text-white">
                {formatIndianDate(dateRange?.startDate)} – {formatIndianDate(dateRange?.endDate)}
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Droplet className="h-4 w-4 text-blue-500 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Selected Volume</span>
              <strong className="text-xs font-black text-blue-600 dark:text-blue-400">
                {activeMetrics.totalLiters.toFixed(2)} L ({filteredEntries.length})
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-amber-500 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Quality Average</span>
              <strong className="text-xs font-black text-slate-800 dark:text-slate-200">
                {activeMetrics.avgFat.toFixed(1)}% FAT • {activeMetrics.avgSnf.toFixed(1)} SNF
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <IndianRupee className="h-4 w-4 text-emerald-500 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Avg Rate</span>
              <strong className="text-xs font-black text-slate-800 dark:text-slate-200">
                {activeMetrics.totalLiters > 0 ? formatRupees(activeMetrics.avgRate.toFixed(2)) + "/L" : "--"}
              </strong>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 flex items-center justify-between sm:justify-end gap-3">
            <div className="text-right">
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-black block">
                {statusCategory === "paid" ? "Paid Total" : "Net Payable (बाकी)"}
              </span>
              <strong className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
                {statusCategory === "paid" ? formatRupees(paidTotalAmount) : formatRupees(unpaidTotalAmount)}
              </strong>
            </div>
          </div>
        </div>

        {/* ── High-Density Interactive Cockpit Table ──────────────────────── */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 scrollbar-thin">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-sm">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase text-[10px] font-black border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                <tr>
                  <th className="px-3.5 py-2">{t.date}</th>
                  <th className="px-3.5 py-2">{t.shift}</th>
                  <th className="px-3.5 py-2">{t.category}</th>
                  <th className="px-3.5 py-2 text-right">{t.liters}</th>
                  <th className="px-3.5 py-2 text-right">{t.fat}</th>
                  <th className="px-3.5 py-2 text-right">{t.snf}</th>
                  <th className="px-3.5 py-2 text-right">{t.rate}</th>
                  <th className="px-3.5 py-2 text-right">{t.amount}</th>
                  <th className="px-3.5 py-2 text-center">{t.status}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredEntries.length > 0 ? (
                  filteredEntries.map((entry, index) => {
                    const isRowPaid = entry.paymentStatus === "paid";
                    const rate = Number(entry.litter || 0) > 0 ? Number(entry.calculatedAmount || 0) / Number(entry.litter) : 0;
                    return (
                      <tr key={entry._id || index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-3.5 py-2 font-bold text-slate-900 dark:text-white">
                          {formatIndianDate(entry.createdAt)}
                        </td>
                        <td className="px-3.5 py-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            entry.shift === "morning"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                              : "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300"
                          }`}>
                            {shiftMap[language]?.[entry.shift] || entry.shift}
                          </span>
                        </td>
                        <td className="px-3.5 py-2 capitalize font-semibold text-slate-700 dark:text-slate-300">
                          {categoryMap[language]?.[entry.category?.toLowerCase()] || entry.category}
                        </td>
                        <td className="px-3.5 py-2 text-right font-black text-slate-900 dark:text-white">
                          {Number(entry.litter || 0).toFixed(2)} L
                        </td>
                        <td className="px-3.5 py-2 text-right font-bold text-purple-600 dark:text-purple-400">
                          {Number(entry.fat || 0).toFixed(1)}%
                        </td>
                        <td className="px-3.5 py-2 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          {Number(entry.snf || 0).toFixed(1)}
                        </td>
                        <td className="px-3.5 py-2 text-right font-semibold text-slate-500">
                          {formatRupees(rate.toFixed(2))}
                        </td>
                        <td className="px-3.5 py-2 text-right font-black text-slate-900 dark:text-white text-xs">
                          {formatRupees(entry.calculatedAmount || 0)}
                        </td>
                        <td className="px-3.5 py-2 text-center">
                          {isRowPaid ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 inline-flex items-center gap-1 shadow-xs">
                              <CheckCircle2 className="h-3 w-3" /> {language === "en" ? "PAID" : "चुकता"}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 inline-flex items-center gap-1 shadow-xs">
                              <Clock className="h-3 w-3" /> {language === "en" ? "UNPAID" : "बाकी"}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      No entries found for category &quot;{statusCategory}&quot;.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Compact Sticky Footer Bar ──────────────────────────────────── */}
        <footer className="bg-slate-50/90 dark:bg-slate-850/90 px-4 sm:px-6 py-2.5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-4 text-xs font-bold text-slate-600 dark:text-slate-300">
            <span>Showing: <strong className="text-slate-900 dark:text-white">{filteredEntries.length} of {totalCount}</strong></span>
            <span>Volume: <strong className="text-blue-600 dark:text-blue-400">{activeMetrics.totalLiters.toFixed(2)} L</strong></span>
            <span>
              Net Due: <strong className="text-emerald-600 dark:text-emerald-400 text-sm">{formatRupees(unpaidTotalAmount)}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="h-8 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm flex items-center gap-1.5"
              onClick={() => handleDownloadPdf(language)}
              disabled={pdfLoading}
              title="Download 80mm Thermal Slip PDF"
            >
              <Download className="h-3.5 w-3.5" /> {pdfLoading ? "Generating..." : t.downloadPdf}
            </Button>
          </div>
        </footer>

      </div>
    </div>,
    document.body
  );
}