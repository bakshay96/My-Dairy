const { MilkModel } = require("./milk.model");
const { getBillingCycleDate, getBillingCycleEnd } = require("../utils/milkCalculator");
const mongoose = require("mongoose");
const { farmerModel } = require("../Farmer/farmer.model");
const { generateBillingPdf, generateBillingPdfBuffer } = require("../utils/pdfGenerator");
const { billingEmailHtml, billingEmailText } = require("../utils/billingEmailTemplate");
const { transporter } = require("../connection/mailConnection");

function getDefaultLastTenDayRange() {
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const start = new Date(end);
  // Inclusive range: today + previous 9 days = 10 days
  start.setDate(start.getDate() - 9);
  start.setHours(0, 0, 0, 0);

  return { start, end };
}

function buildDateRange(query = {}) {
  const { startDate, endDate } = query;
  const fallback = getDefaultLastTenDayRange();

  const start = startDate ? new Date(startDate) : fallback.start;
  const end = endDate ? new Date(endDate) : fallback.end;

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return {
    start,
    end,
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
}

// ─── Helper: parse date range from query ─────────────────────────────────────
function parseDateRange(query) {
  const today = new Date();
  const cycleStart = query.startDate || getBillingCycleDate(today);
  const cycleEnd   = query.endDate   || getBillingCycleEnd(cycleStart);
  return { cycleStart, cycleEnd };
}

// ─── GET /api/billing/farmer/:farmerId ───────────────────────────────────────
/**
 * Aggregated 10-day billing summary for a single farmer.
 * Query params: startDate (YYYY-MM-DD), endDate (YYYY-MM-DD)
 */
exports.getFarmerBillingSummary = async (req, res) => {
  try {
    const { farmerId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(farmerId)) {
      return res.status(400).json({ success: false, message: "Invalid farmer ID" });
    }

    const { cycleStart, cycleEnd } = parseDateRange(req.query);

    const pipeline = [
      {
        $match: {
          adminId:  new mongoose.Types.ObjectId(req.admin.id),
          farmerId: new mongoose.Types.ObjectId(farmerId),
          createdAt: {
            $gte: new Date(cycleStart),
            $lte: new Date(cycleEnd + "T23:59:59.999Z"),
          },
        },
      },
      {
        $facet: {
          // ─ Overall totals ─
          overall: [
            {
              $group: {
                _id: null,
                totalLiters:   { $sum: "$litter" },
                totalAmount:   { $sum: "$calculatedAmount" },
                avgFat:        { $avg: "$fat" },
                avgSnf:        { $avg: "$snf" },
                avgDegree:     { $avg: "$degree" },
                totalEntries:  { $sum: 1 },
              },
            },
          ],
          // ─ Breakdown by shift ─
          byShift: [
            {
              $group: {
                _id:    "$shift",
                liters: { $sum: "$litter" },
                amount: { $sum: "$calculatedAmount" },
                count:  { $sum: 1 },
              },
            },
          ],
          // ─ Daily breakdown for charts ─
          byDay: [
            {
              $group: {
                _id:    { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } },
                liters: { $sum: "$litter" },
                amount: { $sum: "$calculatedAmount" },
                avgFat: { $avg: "$fat" },
                count:  { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ];

    const [result] = await MilkModel.aggregate(pipeline);

    const overall   = result.overall[0]  || { totalLiters: 0, totalAmount: 0, avgFat: 0, avgSnf: 0, avgDegree: 0, totalEntries: 0 };
    const byShift   = result.byShift     || [];
    const byDay     = result.byDay       || [];

    // Precision formatting
    overall.totalLiters  = parseFloat(overall.totalLiters.toFixed(3));
    overall.totalAmount  = parseFloat(overall.totalAmount.toFixed(2));
    overall.avgFat       = parseFloat((overall.avgFat   || 0).toFixed(2));
    overall.avgSnf       = parseFloat((overall.avgSnf   || 0).toFixed(2));
    overall.avgDegree    = parseFloat((overall.avgDegree|| 0).toFixed(2));

    res.status(200).json({
      success: true,
      data: {
        farmerId,
        cycleStart,
        cycleEnd,
        ...overall,
        byShift,
        byDay,
      },
    });
  } catch (error) {
    console.error("getFarmerBillingSummary error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// ─── GET /api/billing/all ────────────────────────────────────────────────────
/**
 * Summary of ALL farmers under this admin for a billing period.
 * Supports pagination. Ideal for the billing dashboard table.
 * Query params: startDate, endDate, page (default 1), pageSize (default 20)
 */
exports.getAllFarmersBillingSummary = async (req, res) => {
  try {
    const { cycleStart, cycleEnd } = parseDateRange(req.query);
    const page     = Math.max(parseInt(req.query.page,     10) || 1, 1);
    const pageSize = Math.min(parseInt(req.query.pageSize, 10) || 20, 100);
    const skip     = (page - 1) * pageSize;

    const pipeline = [
      // 1. Filter to this admin and date window
      {
        $match: {
          adminId: new mongoose.Types.ObjectId(req.admin.id),
          createdAt: {
            $gte: new Date(cycleStart),
            $lte: new Date(cycleEnd + "T23:59:59.999Z"),
          },
        },
      },
      // 2. Group by farmer
      {
        $group: {
          _id:          "$farmerId",
          totalLiters:  { $sum: "$litter" },
          totalAmount:  { $sum: "$calculatedAmount" },
          avgFat:       { $avg: "$fat" },
          avgSnf:       { $avg: "$snf" },
          totalEntries: { $sum: 1 },
          lastEntry:    { $max: "$createdAt" },
        },
      },
      // 3. Join farmer name + contact
      {
        $lookup: {
          from:         "farmers",
          localField:   "_id",
          foreignField: "_id",
          as:           "farmer",
        },
      },
      { $unwind: { path: "$farmer", preserveNullAndEmpty: false } },
      // 4. Shape output
      {
        $project: {
          _id: 0,
          farmerId:     "$_id",
          farmerName:   "$farmer.name",
          farmerMobile: "$farmer.mobile",
          village:      "$farmer.village",
          totalLiters:  { $round: ["$totalLiters", 3] },
          totalAmount:  { $round: ["$totalAmount", 2] },
          avgFat:       { $round: ["$avgFat", 2] },
          avgSnf:       { $round: ["$avgSnf", 2] },
          totalEntries: 1,
          lastEntry:    1,
        },
      },
      { $sort: { totalAmount: -1 } }, // highest earners first
      // 5. Pagination metadata
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: pageSize }],
          total: [{ $count: "count" }],
        },
      },
    ];

    const [result] = await MilkModel.aggregate(pipeline);
    const farmers    = result.data  || [];
    const totalCount = result.total[0]?.count || 0;

    res.status(200).json({
      success: true,
      data: {
        cycleStart,
        cycleEnd,
        farmers,
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages: Math.ceil(totalCount / pageSize),
        },
      },
    });
  } catch (error) {
    console.error("getAllFarmersBillingSummary error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// ─── GET /api/billing/current-cycle ─────────────────────────────────────────
/** Returns the current 10-day cycle start/end dates (useful for frontend). */
exports.getCurrentCycle = (req, res) => {
  const cycleStart = getBillingCycleDate();
  const cycleEnd   = getBillingCycleEnd(cycleStart);
  res.status(200).json({ success: true, data: { cycleStart, cycleEnd } });
};

// ─── GET /api/billing/10-day ─────────────────────────────────────────────────
/**
 * Exact 10-calendar-day rolling window aggregation.
 * Groups by farmerId, calculates sum/avg, joins farmer name+mobile via $lookup.
 * Handles null/empty arrays gracefully.
 */
exports.getTenDayBilling = async (req, res) => {
  try {
    const adminId = new mongoose.Types.ObjectId(req.admin.id || req.admin._id);
    const { start, end, startDate, endDate } = buildDateRange(req.query);

    const pipeline = [
      // ── Stage 1: Filter to this admin's entries in time window ──────────
      {
        $match: {
          adminId,
          paymentStatus: { $ne: "paid" },
          isActive: { $ne: false },
          createdAt: { $gte: start, $lte: end },
        },
      },
      // ── Stage 2: Group by farmer ─────────────────────────────────────────
      {
        $group: {
          _id:          "$farmerId",
          totalLiters:  { $sum: "$litter" },
          totalAmount:  { $sum: "$calculatedAmount" },
          avgFat:       { $avg: "$fat" },
          avgSnf:       { $avg: "$snf" },
          totalEntries: { $sum: 1 },
          lastEntry:    { $max: "$createdAt" },
          categories:   { $addToSet: "$category" },
        },
      },
      // ── Stage 3: Join Farmer model ────────────────────────────────────────
      {
        $lookup: {
          from:         "farmers",   // MongoDB collection name
          localField:   "_id",
          foreignField: "_id",
          as:           "farmerInfo",
        },
      },
      // ── Stage 4: Flatten farmer array (preserve if farmer deleted) ────────
      {
        $unwind: {
          path: "$farmerInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      // ── Stage 5: Shape the output ─────────────────────────────────────────
      {
        $project: {
          _id:          0,
          farmerId:     "$_id",
          farmerName:   { $ifNull: ["$farmerInfo.name",   "Unknown Farmer"] },
          farmerMobile: { $ifNull: ["$farmerInfo.mobile", ""] },
          village:      { $ifNull: ["$farmerInfo.village",""] },
          totalLiters:  { $round: ["$totalLiters",  3] },
          totalAmount:  { $round: ["$totalAmount",  2] },
          avgFat:       { $round: ["$avgFat",        2] },
          avgSnf:       { $round: ["$avgSnf",        2] },
          totalEntries: 1,
          lastEntry:    1,
          categories:   1,
        },
      },
      // ── Stage 6: Sort — highest earners first ────────────────────────────
      { $sort: { totalAmount: -1 } },
    ];

    const farmersWithEntries = await MilkModel.aggregate(pipeline);
    const activeFarmers = await farmerModel
      .find({ adminId, status: "active" })
      .select("_id name mobile village status")
      .lean();

    const billingMap = new Map(
      farmersWithEntries.map((row) => [String(row.farmerId), row])
    );

    const farmers = activeFarmers.map((farmer) => {
      const existing = billingMap.get(String(farmer._id));
      if (existing) return existing;
      return {
        farmerId: farmer._id,
        farmerName: farmer.name,
        farmerMobile: farmer.mobile || "",
        village: farmer.village || "",
        totalLiters: 0,
        totalAmount: 0,
        avgFat: 0,
        avgSnf: 0,
        totalEntries: 0,
        lastEntry: null,
        categories: [],
      };
    });
    farmers.sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0));
    const dailyHistory = await MilkModel.aggregate([
      {
        $match: {
          adminId,
          paymentStatus: { $ne: "paid" },
          isActive: { $ne: false },
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } },
          totalLiters: { $sum: "$litter" },
          totalAmount: { $sum: "$calculatedAmount" },
          totalEntries: { $sum: 1 },
          avgFat: { $avg: "$fat" },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: "$_id",
          totalLiters: { $round: ["$totalLiters", 3] },
          totalAmount: { $round: ["$totalAmount", 2] },
          totalEntries: 1,
          avgFat: { $round: ["$avgFat", 2] },
        },
      },
    ]);

    // Overall summary across all farmers
    const summary = farmers.reduce(
      (acc, f) => {
        acc.totalLiters  += f.totalLiters;
        acc.totalAmount  += f.totalAmount;
        acc.totalEntries += f.totalEntries;
        return acc;
      },
      { totalLiters: 0, totalAmount: 0, totalEntries: 0 }
    );
    summary.totalLiters = parseFloat(summary.totalLiters.toFixed(3));
    summary.totalAmount = parseFloat(summary.totalAmount.toFixed(2));

    return res.status(200).json({
      success: true,
      data: {
        windowStart: startDate,
        windowEnd: endDate,
        dateRange: { startDate, endDate },
        totalFarmers: farmers.length,
        summary,
        dailyHistory,
        farmers: farmers.length > 0 ? farmers : [],
      },
    });
  } catch (error) {
    console.error("[Billing] getTenDayBilling error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during 10-day billing aggregation",
      error: error.message,
    });
  }
};

// ─── GET /api/billing/slip/:farmerId ──────────────────────────────────────────
/**
 * Returns bill-ready slip data (entries + totals) for selected date range.
 * Query params: startDate (YYYY-MM-DD), endDate (YYYY-MM-DD), lang (en|hi|mr)
 */
exports.getBillingSlipData = async (req, res) => {
  try {
    const { farmerId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(farmerId)) {
      return res.status(400).json({ success: false, message: "Invalid farmer ID" });
    }

    const adminId = new mongoose.Types.ObjectId(req.admin._id);
    const { start, end, startDate, endDate } = buildDateRange(req.query);
    const lang = ["en", "hi", "mr"].includes(req.query.lang) ? req.query.lang : "en";

    const [farmer, entries] = await Promise.all([
      farmerModel.findOne({ _id: farmerId, adminId }).lean(),
      MilkModel.find({
        adminId,
        farmerId: new mongoose.Types.ObjectId(farmerId),
        createdAt: { $gte: start, $lte: end },
        paymentStatus: { $ne: "paid" },
      })
        .select("createdAt shift category litter fat snf calculatedAmount paymentStatus")
        .sort({ createdAt: 1 })
        .lean(),
    ]);

    if (!farmer) {
      return res.status(404).json({ success: false, message: "Farmer not found" });
    }

    const totals = entries.reduce(
      (acc, entry) => {
        acc.totalLiters += Number(entry.litter || 0);
        acc.totalAmount += Number(entry.calculatedAmount || 0);
        acc.totalFat += Number(entry.fat || 0);
        acc.totalSnf += Number(entry.snf || 0);
        return acc;
      },
      { totalLiters: 0, totalAmount: 0, totalFat: 0, totalSnf: 0 }
    );

    const count = entries.length || 1;
    const summary = {
      totalEntries: entries.length,
      totalLiters: parseFloat(totals.totalLiters.toFixed(3)),
      totalAmount: parseFloat(totals.totalAmount.toFixed(2)),
      avgFat: parseFloat((totals.totalFat / count).toFixed(2)),
      avgSnf: parseFloat((totals.totalSnf / count).toFixed(2)),
    };

    const paidEntries = entries.filter((entry) => entry.paymentStatus === "paid").length;

    return res.status(200).json({
      success: true,
      data: {
        lang,
        adminShopName: req.admin.shopName || "Milkify",
        dateRange: { startDate, endDate },
        farmer: {
          id: farmer._id,
          memberId: farmer.memberId,
          name: farmer.name,
          mobile: farmer.mobile,
          village: farmer.village,
        },
        summary,
        payment: {
          status: entries.length > 0 && paidEntries === entries.length ? "paid" : "unpaid",
          paidEntries,
          unpaidEntries: entries.length - paidEntries,
        },
        entries,
      },
    });
  } catch (error) {
    console.error("[Billing] getBillingSlipData error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while generating billing slip data",
      error: error.message,
    });
  }
};

// ─── GET /api/billing/pdf/:farmerId ──────────────────────────────────────────
/**
 * Generates and returns a premium PDF billing slip.
 * Query params: startDate (YYYY-MM-DD), endDate (YYYY-MM-DD)
 */
exports.generateBillingSlipPdf = async (req, res) => {
  try {
    const { farmerId } = req.params;
    const adminId = new mongoose.Types.ObjectId(req.admin._id);
    const { start, end, startDate, endDate } = buildDateRange(req.query);

    const [farmer, entries] = await Promise.all([
      farmerModel.findOne({ _id: farmerId, adminId }).lean(),
      MilkModel.find({
        adminId,
        farmerId: new mongoose.Types.ObjectId(farmerId),
        createdAt: { $gte: start, $lte: end },
        paymentStatus: { $ne: "paid" },
      })
        .select("createdAt shift category litter fat snf calculatedAmount")
        .sort({ createdAt: 1 })
        .lean(),
    ]);

    if (!farmer) return res.status(404).json({ message: "Farmer not found" });
    if (!entries.length) return res.status(404).json({ message: "No entries found for this range" });

    const totals = entries.reduce(
      (acc, entry) => {
        acc.totalLiters += Number(entry.litter || 0);
        acc.totalAmount += Number(entry.calculatedAmount || 0);
        acc.totalFat += Number(entry.fat || 0);
        acc.totalSnf += Number(entry.snf || 0);
        return acc;
      },
      { totalLiters: 0, totalAmount: 0, totalFat: 0, totalSnf: 0 }
    );

    const summary = {
      totalLiters: totals.totalLiters,
      totalAmount: totals.totalAmount,
      avgFat: totals.totalFat / entries.length,
      avgSnf: totals.totalSnf / entries.length,
    };

    const pdfData = {
      adminShopName: req.admin.shopName || "Milkify Dairy",
      dateRange: { startDate, endDate },
      farmer: { id: farmer._id, memberId: farmer.memberId, name: farmer.name, mobile: farmer.mobile, village: farmer.village },
      summary,
      entries,
    };

    const lang = ["en", "hi", "mr"].includes(req.query.lang) ? req.query.lang : "en";

    await generateBillingPdf(pdfData, res, lang);

  } catch (error) {
    console.error("[Billing] PDF Generation error:", error);
    res.status(500).json({ message: "Error generating PDF", error: error.message });
  }
};

// ─── POST /api/billing/email/:farmerId ──────────────────────────────────────────────────────
/**
 * Generates PDF billing slip and sends it to the farmer's email.
 * Query params: startDate, endDate, lang
 */
exports.sendBillingEmail = async (req, res) => {
  try {
    const { farmerId } = req.params;
    const adminId = new mongoose.Types.ObjectId(req.admin._id);
    const { start, end, startDate, endDate } = buildDateRange(req.query);
    const lang = ["en", "hi", "mr"].includes(req.query.lang) ? req.query.lang : "en";

    const [farmer, entries] = await Promise.all([
      farmerModel.findOne({ _id: farmerId, adminId }).lean(),
      MilkModel.find({
        adminId,
        farmerId: new mongoose.Types.ObjectId(farmerId),
        createdAt: { $gte: start, $lte: end },
        paymentStatus: { $ne: "paid" },
      })
        .select("createdAt shift category litter fat snf calculatedAmount")
        .sort({ createdAt: 1 })
        .lean(),
    ]);

    if (!farmer)         return res.status(404).json({ message: "Farmer not found" });
    if (!farmer.email)   return res.status(400).json({ message: "Farmer does not have an email address on record" });
    if (!entries.length) return res.status(404).json({ message: "No entries found for this date range" });

    const totals = entries.reduce(
      (acc, e) => {
        acc.totalLiters += Number(e.litter || 0);
        acc.totalAmount += Number(e.calculatedAmount || 0);
        acc.totalFat    += Number(e.fat || 0);
        acc.totalSnf    += Number(e.snf || 0);
        return acc;
      },
      { totalLiters: 0, totalAmount: 0, totalFat: 0, totalSnf: 0 }
    );

    const summary = {
      totalLiters:  totals.totalLiters,
      totalAmount:  totals.totalAmount,
      avgFat:       totals.totalFat / entries.length,
      avgSnf:       totals.totalSnf / entries.length,
    };

    const pdfData = {
      adminShopName: req.admin.shopName || "Milkify Dairy",
      dateRange: { startDate, endDate },
      farmer: { id: farmer._id, memberId: farmer.memberId, name: farmer.name, mobile: farmer.mobile, village: farmer.village },
      summary,
      entries,
    };

    // Respond immediately to prevent frontend timeout (Fire and Forget)
    res.status(200).json({ success: true, message: `Processing bill delivery. It will arrive at ${farmer.email} shortly.` });

    // Generate PDF and send email asynchronously in the background
    (async () => {
      try {
        const pdfBuffer = await generateBillingPdfBuffer(pdfData, lang);

        const emailOpts = {
          farmerName:   farmer.name,
          shopName:     req.admin.shopName || "Milkify Dairy",
          startDate,
          endDate,
          totalLiters:  summary.totalLiters,
          avgFat:       summary.avgFat,
          avgSnf:       summary.avgSnf,
          totalAmount:  summary.totalAmount,
          totalEntries: entries.length,
        };

        await transporter.sendMail({
          from:    `"${req.admin.shopName || "Milkify Dairy"}" <${process.env.SMTP_EMAIL}>`,
          to:      farmer.email,
          subject: `📄 Milk Collection Bill Statement: ${startDate} to ${endDate} | ${req.admin.shopName || "Milkify Dairy"}`,
          html:    billingEmailHtml(emailOpts),
          text:    billingEmailText(emailOpts),
          attachments: [{
            filename:    `Bill_${farmer.name}_${startDate}.pdf`,
            content:     pdfBuffer,
            contentType: "application/pdf",
          }],
        });
        console.log(`[Billing] Bill emailed to ${farmer.email} for farmer ${farmer.name}`);
      } catch (bgError) {
        console.error("[Billing] Background Email/PDF generation error:", bgError);
      }
    })();

  } catch (error) {
    console.error("[Billing] Email request error:", error);
    if (!res.headersSent) {
      return res.status(500).json({ message: "Failed to process email request", error: error.message });
    }
  }
};

exports.getFarmerBillingBreakdown = async (req, res) => {
  try {
    const { farmerId } = req.params;
    const adminId = new mongoose.Types.ObjectId(req.admin.id || req.admin._id);

    if (!mongoose.Types.ObjectId.isValid(farmerId)) {
      return res.status(400).json({ success: false, message: "Invalid farmer ID" });
    }

    const { startDate, endDate } = req.query;

    let windowStart, windowEnd;
    const now = new Date();

    if (startDate && endDate) {
      windowStart = new Date(startDate);
      windowStart.setHours(0, 0, 0, 0);
      
      windowEnd = new Date(endDate);
      windowEnd.setHours(23, 59, 59, 999);
    } else {
      windowStart = new Date(now);
      windowStart.setDate(windowStart.getDate() - 10);
      windowStart.setHours(0, 0, 0, 0);
      
      windowEnd = now;
    }

    const entries = await MilkModel.find({
      adminId,
      farmerId: new mongoose.Types.ObjectId(farmerId),
      createdAt: { $gte: windowStart, $lte: windowEnd }
    }).sort({ createdAt: -1 });

    const totals = entries.reduce(
      (acc, entry) => {
        const liters = Number(entry.litter || 0);
        const amount = Number(entry.calculatedAmount || 0);
        const fat = Number(entry.fat || 0);
        const snf = Number(entry.snf || 0);
        acc.totalEntries += 1;
        acc.totalLiters += liters;
        acc.totalAmount += amount;
        acc.totalFat += fat;
        acc.totalSnf += snf;
        if (entry.paymentStatus === "paid") acc.paidEntries += 1;
        else acc.unpaidEntries += 1;
        return acc;
      },
      {
        totalEntries: 0,
        paidEntries: 0,
        unpaidEntries: 0,
        totalLiters: 0,
        totalAmount: 0,
        totalFat: 0,
        totalSnf: 0,
      }
    );

    const count = totals.totalEntries || 1;
    const avgFat = totals.totalFat / count;
    const avgSnf = totals.totalSnf / count;
    const ratePerLiter = totals.totalLiters > 0 ? totals.totalAmount / totals.totalLiters : 0;

    return res.status(200).json({
      success: true,
      data: {
        entries,
        summary: {
          totalEntries: totals.totalEntries,
          paidEntries: totals.paidEntries,
          unpaidEntries: totals.unpaidEntries,
          totalLiters: Number(totals.totalLiters.toFixed(3)),
          totalAmount: Number(totals.totalAmount.toFixed(2)),
          avgFat: Number(avgFat.toFixed(2)),
          avgSnf: Number(avgSnf.toFixed(2)),
          ratePerLiter: Number(ratePerLiter.toFixed(2)),
        },
      }
    });

  } catch (error) {
    console.error("[Billing] getFarmerBillingBreakdown error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error getting billing breakdown",
      error: error.message,
    });
  }
};
