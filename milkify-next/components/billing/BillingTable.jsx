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
      {/* Desktop View: Tables (768px and up) */}
      <div className="hidden md:block w-full overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50/80 dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800">
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
                  className={`border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50/50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer ${expandedRow === farmer.farmerId ? 'bg-gray-50/80 dark:bg-slate-800/60' : ''}`}
                  onClick={() => toggleExpand(farmer.farmerId)}
                >
                  <td className="px-4 py-4 text-gray-400">
                    {expandedRow === farmer.farmerId ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-medium text-gray-900 dark:text-gray-100">{farmer.farmerName}</div>
                    <div className="text-xs text-gray-500">{farmer.farmerMobile}</div>
                  </td>
                  <td className="px-4 py-4 text-right font-medium text-gray-700 dark:text-gray-300">
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
                  <td className="px-4 py-4 text-right font-bold text-green-600 dark:text-green-500 text-base">
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
                        className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white shadow-sm"
                        onClick={(e) => handlePayClick(farmer, e)}
                      >
                        Pay
                      </Button>
                    </div>
                  </td>
                </tr>
                
                {/* Expandable Breakdown Row */}
                {expandedRow === farmer.farmerId && (
                  <tr className="bg-gray-50/50 dark:bg-slate-950/20 border-b border-gray-100 dark:border-slate-800">
                    <td colSpan={8} className="p-0">
                      <div className="px-8 py-4 border-l-4 border-primary/40 bg-white dark:bg-slate-900 m-4 rounded-md shadow-inner">
                        <h4 className="font-semibold text-gray-800 dark:text-slate-200 mb-3 text-sm flex items-center gap-2">
                          Itemized Breakdown
                          {loadingBreakdown && !breakdownData[farmer.farmerId] && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
                        </h4>
                        
                        {breakdownData[farmer.farmerId] ? (
                          (breakdownData[farmer.farmerId].entries || []).length > 0 ? (
                            <>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3 text-xs">
                              <div className="p-2 rounded border dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/40">Entries: <strong className="text-primary">{breakdownData[farmer.farmerId].summary?.totalEntries || 0}</strong></div>
                              <div className="p-2 rounded border dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/40">Paid/Unpaid: <strong className="text-primary">{breakdownData[farmer.farmerId].summary?.paidEntries || 0}/{breakdownData[farmer.farmerId].summary?.unpaidEntries || 0}</strong></div>
                              <div className="p-2 rounded border dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/40">Avg FAT/SNF: <strong className="text-primary">{Number(breakdownData[farmer.farmerId].summary?.avgFat || 0).toFixed(2)}/{Number(breakdownData[farmer.farmerId].summary?.avgSnf || 0).toFixed(2)}</strong></div>
                              <div className="p-2 rounded border dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/40">Rate/Ltr: <strong className="text-primary">{formatRupees(breakdownData[farmer.farmerId].summary?.ratePerLiter || 0)}</strong></div>
                            </div>
                            <div className="overflow-x-auto border dark:border-slate-800 rounded-md">
                              <table className="w-full text-xs text-left">
                                <thead className="text-gray-500 bg-gray-50/80 dark:bg-slate-900 border-b dark:border-slate-800">
                                  <tr>
                                    <th className="px-3 py-2 font-semibold">Date</th>
                                    <th className="px-3 py-2 font-semibold">Shift</th>
                                    <th className="px-3 py-2 font-semibold">Category</th>
                                    <th className="px-3 py-2 font-semibold text-right">Liters</th>
                                    <th className="px-3 py-2 font-semibold text-right">FAT</th>
                                    <th className="px-3 py-2 font-semibold text-right">SNF</th>
                                    <th className="px-3 py-2 font-semibold text-center">Status</th>
                                    <th className="px-3 py-2 font-semibold text-right">Total</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                  {(breakdownData[farmer.farmerId].entries || []).map((entry) => (
                                    <tr key={entry._id} className="hover:bg-blue-50/30 dark:hover:bg-blue-950/10 transition-colors">
                                      <td className="px-3 py-2.5 font-medium">{formatIndianDate(entry.createdAt)}</td>
                                      <td className="px-3 py-2.5 capitalize">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${entry.shift === 'morning' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300' : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300'}`}>
                                          {entry.shift}
                                        </span>
                                      </td>
                                      <td className="px-3 py-2.5 capitalize">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${entry.category === 'cow' ? 'bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300' : 'bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300'}`}>
                                          {entry.category || 'N/A'}
                                        </span>
                                      </td>
                                      <td className="px-3 py-2.5 text-right font-medium">{entry.litter || 0} L</td>
                                      <td className="px-3 py-2.5 text-right">{entry.fat}%</td>
                                      <td className="px-3 py-2.5 text-right">{entry.snf || '-'}</td>
                                      <td className="px-3 py-2.5 text-center">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${entry.paymentStatus === "paid" ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300" : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"}`}>
                                          {entry.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                                        </span>
                                      </td>
                                      <td className="px-3 py-2.5 text-right font-bold text-green-600 dark:text-green-500">
                                        {formatRupees(entry.calculatedAmount)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            </>
                          ) : (
                            <div className="text-center py-6 border rounded-md border-dashed dark:border-slate-800">
                              <p className="text-sm text-gray-500 dark:text-slate-400">No individual entries found for this period.</p>
                            </div>
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

      {/* Mobile View: Premium Responsive Cards (Below 768px) */}
      <div className="block md:hidden space-y-4">
        {farmers.map((farmer) => {
          const isExpanded = expandedRow === farmer.farmerId;
          return (
            <div 
              key={farmer.farmerId} 
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
              onClick={() => toggleExpand(farmer.farmerId)}
            >
              {/* Card Header: Initials + Name/Mobile & Amount */}
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm select-none">
                    {farmer.farmerName ? farmer.farmerName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "F"}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-950 dark:text-slate-50 text-sm leading-tight">{farmer.farmerName}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{farmer.farmerMobile}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider block font-medium">Pending</span>
                  <span className="text-base font-bold text-green-600 dark:text-green-500">{formatRupees(farmer.totalAmount || 0)}</span>
                </div>
              </div>

              {/* Liters & Stats Grid */}
              <div className="grid grid-cols-3 gap-2 py-3 text-xs border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Liters</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{Number(farmer.totalLiters || 0).toFixed(2)} L</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Avg Fat</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {(farmer.totalEntries || 0) > 0 ? `${Number(farmer.avgFat || 0).toFixed(1)}%` : "--"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Entries</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{farmer.totalEntries}</span>
                </div>
              </div>

              {/* Expandable Breakdown trigger */}
              <div className="flex items-center justify-between text-xs pt-3 pb-1 text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1 font-medium text-primary">
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  {isExpanded ? "Hide Breakdown" : "View Breakdown"}
                </span>
                <span className="text-slate-400 dark:text-slate-500 text-[11px]">
                  {Number(farmer.totalLiters || 0) > 0
                    ? `Avg Rate: ${formatRupees((Number(farmer.totalAmount || 0) / Number(farmer.totalLiters || 1)).toFixed(2))}`
                    : ""}
                </span>
              </div>

              {/* Collapsible itemized list */}
              {isExpanded && (
                <div className="mt-2 pt-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 rounded-lg p-3 space-y-3" onClick={(e) => e.stopPropagation()}>
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-2">
                    Itemized Breakdown
                    {loadingBreakdown && !breakdownData[farmer.farmerId] && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                  </h4>
                  {breakdownData[farmer.farmerId] ? (
                    (breakdownData[farmer.farmerId].entries || []).length > 0 ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="p-1.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                            Paid/Unpaid: <strong className="text-primary">{breakdownData[farmer.farmerId].summary?.paidEntries || 0}/{breakdownData[farmer.farmerId].summary?.unpaidEntries || 0}</strong>
                          </div>
                          <div className="p-1.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                            Avg SNF: <strong className="text-primary">{Number(breakdownData[farmer.farmerId].summary?.avgSnf || 0).toFixed(2)}</strong>
                          </div>
                        </div>
                        {/* Log Cards instead of inner tables on mobile */}
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {(breakdownData[farmer.farmerId].entries || []).map((entry) => (
                            <div key={entry._id} className="p-2.5 bg-white dark:bg-slate-900 rounded border border-slate-150 dark:border-slate-800 flex flex-col gap-1.5 text-xs">
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-slate-800 dark:text-slate-200">{formatIndianDate(entry.createdAt)}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-medium uppercase tracking-wider ${entry.shift === 'morning' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300' : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300'}`}>
                                  {entry.shift}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400">
                                <span>Animal: <strong className="capitalize text-slate-700 dark:text-slate-300">{entry.category || 'cow'}</strong></span>
                                <span>Liters: <strong className="text-slate-700 dark:text-slate-300">{entry.litter} L</strong></span>
                                <span>FAT: <strong className="text-slate-700 dark:text-slate-300">{entry.fat}%</strong></span>
                              </div>
                              <div className="flex justify-between items-center border-t border-slate-50 dark:border-slate-800/50 pt-1.5 mt-0.5">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-medium ${entry.paymentStatus === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'}`}>
                                  {entry.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                                </span>
                                <span className="font-bold text-green-600 dark:text-green-500">{formatRupees(entry.calculatedAmount)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 text-center py-2">No individual entries found for this period.</p>
                    )
                  ) : (
                    !loadingBreakdown && <p className="text-xs text-slate-400 text-center py-2">Click to load entries</p>
                  )}
                </div>
              )}

              {/* Card Footer Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 mt-2" onClick={(e) => e.stopPropagation()}>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs dark:hover:bg-slate-800"
                  onClick={(e) => handleGenerateBill(farmer, e)}
                  disabled={slipLoading}
                >
                  {slipLoading ? "..." : "Bill"}
                </Button>
                <Button 
                  size="sm" 
                  className="flex-1 text-xs bg-primary hover:bg-primary/90 text-white shadow-sm font-medium"
                  onClick={(e) => handlePayClick(farmer, e)}
                >
                  Pay
                </Button>
              </div>
            </div>
          );
        })}
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
