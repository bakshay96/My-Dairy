"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export default function BillingSlipModal({ slipData, isOpen, onClose, initialLanguage = "en" }) {
  const [language, setLanguage] = useState(initialLanguage);

  const t = useMemo(() => languageText[language] || languageText.en, [language]);
  const shiftText = useMemo(() => shiftMap[language] || shiftMap.en, [language]);

  if (!isOpen || !slipData) return null;

  const { farmer, entries, summary, dateRange, payment } = slipData;
  const isPaid = payment?.status === "paid";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm print:bg-white print:static">
      <div id="thermal-slip" className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto relative print:shadow-none print:rounded-none print:max-w-[80mm] print:max-h-none">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 text-5xl font-bold rotate-[-24deg]">
          MILKIFY
        </div>
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10 print:hidden">
          <h3 className="font-semibold text-lg">Billing Slip Preview</h3>
          <div className="flex items-center gap-2">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="h-9 rounded-md border px-2 text-sm"
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="mr">Marathi</option>
            </select>
            <Button variant="outline" onClick={() => window.print()}>
              {t.print}
            </Button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="h-5 w-5" />
            </button>
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

          <div className="grid grid-cols-1 gap-2 text-sm print:text-[11px]">
            <div className="border rounded-md p-3"><strong>Farmer:</strong> {farmer?.name}</div>
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
                {entries?.map((entry) => (
                  <tr key={entry._id} className="border-t">
                    <td className="px-3 py-2">{formatIndianDate(entry.createdAt)}</td>
                    <td className="px-3 py-2">{shiftText[entry.shift] || entry.shift}</td>
                    <td className="px-3 py-2 capitalize">{entry.category}</td>
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
