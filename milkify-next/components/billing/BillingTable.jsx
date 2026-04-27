"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import PaymentModal from "@/components/farmers/PaymentModal";
import BillingSlipModal from "@/components/billing/BillingSlipModal";
import { formatRupees, formatIndianDate } from "@/lib/utils";
import api from "@/lib/api";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { buildDateQuery } from "@/lib/dateRange";

export default function BillingTable({ farmers, onPaymentSuccess, startDate = "", endDate = "" }) {
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Expandable row state
  const [expandedRow, setExpandedRow] = useState(null);
  const [breakdownData, setBreakdownData] = useState({});
  const [loadingBreakdown, setLoadingBreakdown] = useState(false);
  const [slipLoading, setSlipLoading] = useState(false);
  const [slipData, setSlipData] = useState(null);
  const [showSlipModal, setShowSlipModal] = useState(false);

  const handlePayClick = (farmer, e) => {
    e.stopPropagation();
    setSelectedFarmer(farmer);
    setIsModalOpen(true);
  };

  const toggleExpand = async (farmerId) => {
    if (expandedRow === farmerId) {
      setExpandedRow(null);
      return;
    }
    
    setExpandedRow(farmerId);
    
    // Fetch if not already loaded
    if (!breakdownData[farmerId]) {
      try {
        setLoadingBreakdown(true);
        let url = `/billing/breakdown/${farmerId}${buildDateQuery(startDate, endDate)}`;
        const res = await api.get(url);
        setBreakdownData((prev) => ({ ...prev, [farmerId]: res.data }));
      } catch (err) {
        console.error("Failed to load breakdown:", err);
      } finally {
        setLoadingBreakdown(false);
      }
    }
  };

  const handleGenerateBill = async (farmer, e) => {
    e.stopPropagation();
    try {
      setSlipLoading(true);
      let url = `/billing/slip/${farmer.farmerId}${buildDateQuery(startDate, endDate)}`;
      const res = await api.get(url);
      setSlipData(res.data);
      setShowSlipModal(true);
    } catch (error) {
      console.error("Failed to generate bill:", error);
      alert("Unable to generate bill for selected range.");
    } finally {
      setSlipLoading(false);
    }
  };

  return (
    <>
      <div className="w-full overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50/80 dark:bg-slate-900 border-b">
            <tr>
              <th className="px-4 py-3 font-medium w-10"></th>
              <th className="px-4 py-3 font-medium">Farmer</th>
              <th className="px-4 py-3 font-medium text-right">Liters</th>
              <th className="px-4 py-3 font-medium text-right hidden sm:table-cell">Avg Fat</th>
              <th className="px-4 py-3 font-medium text-right hidden md:table-cell">Entries</th>
              <th className="px-4 py-3 font-medium text-right hidden lg:table-cell">Rate/Ltr</th>
              <th className="px-4 py-3 font-medium text-right">Amount</th>
              <th className="px-4 py-3 font-center text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {farmers.map((farmer) => (
              <React.Fragment key={farmer.farmerId}>
                <tr 
                  className={`border-b hover:bg-gray-50/50 transition-colors cursor-pointer ${expandedRow === farmer.farmerId ? 'bg-gray-50/80' : ''}`}
                  onClick={() => toggleExpand(farmer.farmerId)}
                >
                  <td className="px-4 py-4 text-gray-400">
                    {expandedRow === farmer.farmerId ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-medium text-gray-900 dark:text-gray-100">{farmer.farmerName}</div>
                    <div className="text-xs text-gray-500">{farmer.farmerMobile}</div>
                  </td>
                  <td className="px-4 py-4 text-right font-medium text-gray-700">
                    {Number(farmer.totalLiters || 0).toFixed(2)} L
                  </td>
                  <td className="px-4 py-4 text-right text-gray-500 hidden sm:table-cell">
                    {(farmer.totalEntries || 0) > 0 ? `${Number(farmer.avgFat || 0).toFixed(1)}%` : "--"}
                  </td>
                  <td className="px-4 py-4 text-right text-gray-500 hidden md:table-cell">
                    {farmer.totalEntries}
                  </td>
                  <td className="px-4 py-4 text-right text-gray-500 hidden lg:table-cell">
                    {Number(farmer.totalLiters || 0) > 0
                      ? formatRupees((Number(farmer.totalAmount || 0) / Number(farmer.totalLiters || 1)).toFixed(2))
                      : "--"}
                  </td>
                  <td className="px-4 py-4 text-right font-bold text-green-600 text-base">
                    {formatRupees(farmer.totalAmount || 0)}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={(e) => handleGenerateBill(farmer, e)}
                        disabled={slipLoading}
                      >
                        {slipLoading ? "..." : "Bill"}
                      </Button>
                      <Button 
                        size="sm" 
                        className="w-full sm:w-auto bg-primary hover:bg-primary/90 shadow-sm"
                        onClick={(e) => handlePayClick(farmer, e)}
                      >
                        Pay
                      </Button>
                    </div>
                  </td>
                </tr>
                
                {/* Expandable Breakdown Row */}
                {expandedRow === farmer.farmerId && (
                  <tr className="bg-gray-50/50 border-b">
                    <td colSpan={8} className="p-0">
                      <div className="px-8 py-4 border-l-4 border-primary/40 bg-white m-4 rounded-md shadow-inner">
                        <h4 className="font-semibold text-gray-800 mb-3 text-sm flex items-center gap-2">
                          Itemized Breakdown
                          {loadingBreakdown && !breakdownData[farmer.farmerId] && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
                        </h4>
                        
                        {breakdownData[farmer.farmerId] ? (
                          (breakdownData[farmer.farmerId].entries || []).length > 0 ? (
                            <>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3 text-xs">
                              <div className="p-2 rounded border">Entries: <strong>{breakdownData[farmer.farmerId].summary?.totalEntries || 0}</strong></div>
                              <div className="p-2 rounded border">Paid/Unpaid: <strong>{breakdownData[farmer.farmerId].summary?.paidEntries || 0}/{breakdownData[farmer.farmerId].summary?.unpaidEntries || 0}</strong></div>
                              <div className="p-2 rounded border">Avg FAT/SNF: <strong>{Number(breakdownData[farmer.farmerId].summary?.avgFat || 0).toFixed(2)}/{Number(breakdownData[farmer.farmerId].summary?.avgSnf || 0).toFixed(2)}</strong></div>
                              <div className="p-2 rounded border">Rate/Ltr: <strong>{formatRupees(breakdownData[farmer.farmerId].summary?.ratePerLiter || 0)}</strong></div>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs text-left">
                                <thead className="text-gray-500 border-b">
                                  <tr>
                                    <th className="pb-2 font-medium">Date</th>
                                    <th className="pb-2 font-medium">Shift</th>
                                    <th className="pb-2 font-medium text-right">Liters</th>
                                    <th className="pb-2 font-medium text-right">FAT</th>
                                    <th className="pb-2 font-medium text-right">SNF</th>
                                    <th className="pb-2 font-medium text-center">Status</th>
                                    <th className="pb-2 font-medium text-right">Total</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {(breakdownData[farmer.farmerId].entries || []).map((entry) => (
                                    <tr key={entry._id} className="hover:bg-gray-50">
                                      <td className="py-2">{formatIndianDate(entry.createdAt)}</td>
                                      <td className="py-2 capitalize">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${entry.shift === 'morning' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'}`}>
                                          {entry.shift}
                                        </span>
                                      </td>
                                      <td className="py-2 text-right">{entry.litter || 0} L</td>
                                      <td className="py-2 text-right">{entry.fat}%</td>
                                      <td className="py-2 text-right">{entry.snf || '-'}</td>
                                      <td className="py-2 text-center">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${entry.paymentStatus === "paid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                                          {entry.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                                        </span>
                                      </td>
                                      <td className="py-2 text-right font-medium text-green-600">
                                        {formatRupees(entry.calculatedAmount)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            </>
                          ) : (
                            <p className="text-sm text-gray-500 py-2">No individual entries found for this period.</p>
                          )
                        ) : null}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && selectedFarmer && (
        <PaymentModal 
          farmer={selectedFarmer} 
          startDate={startDate}
          endDate={endDate}
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => {
            setIsModalOpen(false);
            onPaymentSuccess();
          }}
        />
      )}
      {showSlipModal && (
        <BillingSlipModal
          slipData={slipData}
          isOpen={showSlipModal}
          onClose={() => setShowSlipModal(false)}
          initialLanguage="mr"
        />
      )}
    </>
  );
}
