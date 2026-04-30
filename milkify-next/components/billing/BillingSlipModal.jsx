"use client";

import { useMemo, useState, useRef, useEffect} from "react";
import { Download, Mail, X } from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { formatIndianDate, formatRupees } from "@/lib/utils";

const languageText = {
  en: {
    title: "Payment and Billing Report",
    date: "Date",
    liters: "Liters",
    fat: "FAT",
    snf: "SNF",
    amount: "Amount",
    shift: "Shift",
    category: "Category",
    total: "Total",
    finalAmount: "Final Amount",
    print: "Print / Save PDF",
  },
  hi: {
    title: "भुगतान और बिलिंग रिपोर्ट",
    date: "तारीख",
    liters: "लीटर",
    fat: "फैट",
    snf: "एसएनएफ",
    amount: "राशि",
    shift: "शिफ्ट",
    category: "प्रकार",
    total: "कुल",
    finalAmount: "अंतिम राशि",
    print: "प्रिंट / पीडीएफ सेव करें",
  },
  mr: {
    title: "पेमेंट आणि बिलिंग अहवाल",
    date: "तारीख",
    liters: "लिटर",
    fat: "फॅट",
    snf: "एसएनएफ",
    amount: "रक्कम",
    shift: "वेळ",
    category: "प्रकार",
    total: "एकूण",
    finalAmount: "अंतिम रक्कम",
    print: "प्रिंट / PDF सेव्ह",
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

export default function BillingSlipModal({ slipData, isOpen, onClose, initialLanguage = "en" }) {
  const [language, setLanguage] = useState(initialLanguage);
  const [pdfLoading, setPdfLoading]           = useState(false);
  const [showLangPicker, setShowLangPicker]   = useState(false);
  const [emailLoading, setEmailLoading]       = useState(false);
  const [showEmailPicker, setShowEmailPicker] = useState(false);
  const modalRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) onClose();
    };
    if (isOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onClose]);

  const handleDownloadPdf = async (lang) => {
    try {
      setPdfLoading(true);
      setShowLangPicker(false);
      const { farmer, dateRange } = slipData;
      const url = `/billing/pdf/${farmer.id}?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&lang=${lang}`;
      const response = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `Bill_${farmer.name}_${dateRange.startDate}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success("PDF generated successfully!");
    } catch (error) {
      console.error("PDF download failed:", error);
      toast.error("Failed to download PDF. Please try again.");
    } finally {
      setPdfLoading(false);
    }
  };

  const handleSendEmail = async (lang) => {
    try {
      setEmailLoading(true);
      setShowEmailPicker(false);
      const { farmer, dateRange } = slipData;
      await api.post(
        `/billing/email/${farmer.id}?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&lang=${lang}`
      );
      toast.success(`Bill sent successfully to farmer's email!`);
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to send email.";
      toast.error(`Error: ${msg}`);
    } finally {
      setEmailLoading(false);
    }
  };
  const t         = useMemo(() => languageText[language] || languageText.en, [language]);
  // const shiftText = useMemo(() => shiftMap[language]     || shiftMap.en,     [language]);

  if (!isOpen || !slipData) return null;
  const { farmer, entries, summary, dateRange, payment } = slipData;
  const isPaid = payment?.status === "paid";

  return (
    <div className="fixed inset-0 z-[70] flex justify-center bg-black/50 backdrop-blur-sm print:bg-white print:static">
      <div
        id="thermal-slip"
        ref={modalRef}
        className="bg-white shadow-2xl w-full sm:w-[450px] h-full overflow-y-auto relative transform transition-transform duration-300 animate-in slide-in-from-right print:shadow-none print:w-[80mm] print:h-auto"
      >
        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 text-5xl font-bold rotate-[-24deg] select-none">
          MILKIFY
        </div>

        {/* ── Responsive Header ─── */}
        <div className="sticky top-0 bg-white z-10 border-b print:hidden">
          {/* Row 1: Title + Close */}
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <h3 className="font-semibold text-base">Billing Slip Preview</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Row 2: Controls */}
          <div className="flex flex-wrap items-center gap-1.5 px-4 pb-3">
            {/* Preview language */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="h-8 rounded-md border px-2 text-xs flex-shrink-0"
            >
              <option value="en">EN Preview</option>
              <option value="hi">HI Preview</option>
              <option value="mr">MR Preview</option>
            </select>
            {/* Language Picker for PDF */}
            {showLangPicker ? (
              <div className="flex items-center gap-1 bg-gray-50 border rounded-md p-1">
                <span className="text-xs text-gray-500 px-1">Lang:</span>
                {[{code:"en",label:"EN"},{code:"hi",label:"HI"},{code:"mr",label:"MR"}].map(l => (
                  <button
                    key={l.code}
                    onClick={() => handleDownloadPdf(l.code)}
                    disabled={pdfLoading}
                    className={`px-2 py-1 text-xs rounded font-semibold transition-colors ${
                      l.code === "mr" ? "bg-emerald-600 text-white" : "bg-white border text-gray-700 hover:bg-emerald-50"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
                <button onClick={() => setShowLangPicker(false)} className="text-gray-400 hover:text-gray-600 px-1 text-xs">✕</button>
              </div>
            ) : (
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                onClick={() => setShowLangPicker(true)}
                disabled={pdfLoading}
              >
                <Download className="h-4 w-4" />
                {pdfLoading ? "Generating..." : "Premium PDF"}
              </Button>
            )}
            {/* Email to Farmer */}
            {showEmailPicker ? (
              <div className="flex items-center gap-1 bg-blue-50 border border-blue-200 rounded-md p-1">
                <span className="text-xs text-blue-500 px-1">Lang:</span>
                {[{code:"en",label:"EN"},{code:"hi",label:"HI"},{code:"mr",label:"MR"}].map(l => (
                  <button
                    key={l.code}
                    onClick={() => handleSendEmail(l.code)}
                    disabled={emailLoading}
                    className="px-2 py-1 text-xs rounded font-semibold bg-white border text-blue-700 hover:bg-blue-50 transition-colors"
                  >
                    {l.label}
                  </button>
                ))}
                <button onClick={() => setShowEmailPicker(false)} className="text-gray-400 hover:text-gray-600 px-1 text-xs">✕</button>
              </div>
            ) : (
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                onClick={() => setShowEmailPicker(true)}
                disabled={emailLoading}
                title="Send bill to farmer's email"
              >
                <Mail className="h-4 w-4" />
                {emailLoading ? "Sending..." : "Email Bill"}
              </Button>
            )}
          </div>
        </div>

        <div className="p-6 space-y-4 print:p-2 print:text-[11px]">
          <div className="text-center">
            <h2 className="text-lg font-bold">Milkify Dairy</h2>
            <p className="text-xs text-gray-500">{slipData?.adminShopName || "Milk Shop"}</p>
            <p className="text-gray-600">{t.title}</p>
            <p className="text-sm text-gray-500">
              {formatIndianDate(dateRange?.startDate)} - {formatIndianDate(dateRange?.endDate)}
            </p>
            <span className={`inline-block mt-2 text-xs font-semibold px-2 py-0.5 rounded-full ${isPaid ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
              {isPaid ? "PAID" : "NOT PAID"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm print:text-[11px]">
            <div className="border rounded-md p-3"><strong>Farmer:</strong> {farmer?.name}</div>
            <div className="border rounded-md p-3"><strong>ID:</strong> {farmer?.memberId || "#" + (farmer?.id || "").slice(-6).toUpperCase()}</div>
            <div className="border rounded-md p-3"><strong>Mobile:</strong> {farmer?.mobile || "-"}</div>
            <div className="border rounded-md p-3"><strong>Village:</strong> {farmer?.village || "-"}</div>
          </div>

          <div className="overflow-x-auto border rounded-md">
            <table className="w-full text-sm print:text-[10px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">{t.date}</th>
                  <th className="px-3 py-2 text-left">{t.shift}</th>
                  <th className="px-3 py-2 text-left">{t.category}</th>
                  <th className="px-3 py-2 text-right">{t.liters}</th>
                  <th className="px-3 py-2 text-right">{t.fat}</th>
                  <th className="px-3 py-2 text-right">{t.snf}</th>
                  <th className="px-3 py-2 text-right">{t.amount}</th>
                </tr>
              </thead>
              <tbody>
                {entries?.map((entry, index) => (
                  <tr key={entry._id || index} className="border-t">
                    <td className="px-3 py-2">{formatIndianDate(entry.createdAt)}</td>
                    <td className="px-3 py-2">{shiftMap[language]?.[entry.shift] || entry.shift}</td>
                    <td className="px-3 py-2 capitalize">{categoryMap[language]?.[entry.category.toLowerCase()] || entry.category}</td>
                    <td className="px-3 py-2 text-right">{Number(entry.litter || 0).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">{Number(entry.fat || 0).toFixed(1)}</td>
                    <td className="px-3 py-2 text-right">{Number(entry.snf || 0).toFixed(1)}</td>
                    <td className="px-3 py-2 text-right">{Number(entry.calculatedAmount || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t font-semibold">
                <tr>
                  <td className="px-3 py-2" colSpan={3}>{t.total}</td>
                  <td className="px-3 py-2 text-right">{summary?.totalLiters?.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">{summary?.avgFat?.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">{summary?.avgSnf?.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">{summary?.totalAmount?.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="text-right text-lg font-bold print:text-sm">
            {t.finalAmount}: {formatRupees(summary?.totalAmount || 0)}
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs pt-3 border-t">
            <div>
              <p className="font-semibold">Farmer Signature</p>
              <p className="mt-6 border-t border-dashed" />
            </div>
            <div>
              <p className="font-semibold text-right">Owner Signature</p>
              <p className="mt-6 border-t border-dashed" />
            </div>
          </div>
          <p className="text-[11px] text-center text-gray-500">
            System generated print with digital signature.
          </p>
        </div>
      </div>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #thermal-slip, #thermal-slip * {
            visibility: visible;
          }
          #thermal-slip {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            margin: 0;
            padding: 0;
          }
        }
      `}</style>
    </div>
  );
}
