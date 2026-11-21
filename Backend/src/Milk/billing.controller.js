const { MilkModel } = require("./milk.model");
const {
  getBillingCycleDate,
  getBillingCycleEnd,
  getSprintsForMonth,
  getCurrentSprint,
  getRecentSprints,
} = require("../utils/milkCalculator");
const mongoose = require("mongoose");
const { farmerModel } = require("../Farmer/farmer.model");
const { AdminModel } = require("../Admin/admin.model");
const { SprintBillingModel } = require("./sprintBilling.model");
const { generateBillingPdf, generateBillingPdfBuffer } = require("../utils/pdfGenerator");
const {
  billingEmailHtml,
  billingEmailText,
  zeroCollectionEmailHtml,
  zeroCollectionEmailText,
} = require("../utils/billingEmailTemplate");
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
 * Query params: startDate (YYYY-MM-DD), endDate (YYYY-MM-DD), lang (en|hi|mr), status (all|unpaid|paid)
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
    const statusFilter = req.query.status || "all";

    const milkQuery = {
      adminId,
      farmerId: new mongoose.Types.ObjectId(farmerId),
      createdAt: { $gte: start, $lte: end },
    };

    if (statusFilter === "unpaid") {
      milkQuery.paymentStatus = { $ne: "paid" };
    } else if (statusFilter === "paid") {
      milkQuery.paymentStatus = "paid";
    }

    const [farmer, entries] = await Promise.all([
      farmerModel.findOne({ _id: farmerId, adminId }).lean(),
      MilkModel.find(milkQuery)
        .select("createdAt shift category litter fat snf calculatedAmount paymentStatus rate")
        .sort({ createdAt: 1 })
        .lean(),
    ]);

    if (!farmer) {
      return res.status(404).json({ success: false, message: "Farmer not found" });
    }

    let totalLiters = 0;
    let totalAmount = 0;
    let totalFat = 0;
    let totalSnf = 0;
    let paidEntries = 0;
    let paidLiters = 0;
    let paidAmount = 0;
    let unpaidEntries = 0;
    let unpaidLiters = 0;
    let unpaidAmount = 0;

    entries.forEach((entry) => {
      const l = Number(entry.litter || 0);
      const a = Number(entry.calculatedAmount || 0);
      const f = Number(entry.fat || 0);
      const s = Number(entry.snf || 0);

      totalLiters += l;
      totalAmount += a;
      totalFat += f;
      totalSnf += s;

      if (entry.paymentStatus === "paid") {
        paidEntries += 1;
        paidLiters += l;
        paidAmount += a;
      } else {
        unpaidEntries += 1;
        unpaidLiters += l;
        unpaidAmount += a;
      }
    });

    const count = entries.length || 1;
    let statusBadge = "unpaid";
    if (entries.length > 0 && unpaidEntries === 0) {
      statusBadge = "paid";
    } else if (paidEntries > 0 && unpaidEntries > 0) {
      statusBadge = "partial";
    } else if (entries.length === 0) {
      statusBadge = "none";
    }

    const summary = {
      totalEntries: entries.length,
      totalLiters: parseFloat(totalLiters.toFixed(3)),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      paidEntries,
      paidLiters: parseFloat(paidLiters.toFixed(3)),
      paidAmount: parseFloat(paidAmount.toFixed(2)),
      unpaidEntries,
      unpaidLiters: parseFloat(unpaidLiters.toFixed(3)),
      unpaidAmount: parseFloat(unpaidAmount.toFixed(2)),
      avgFat: parseFloat((totalFat / count).toFixed(2)),
      avgSnf: parseFloat((totalSnf / count).toFixed(2)),
      avgRate: totalLiters > 0 ? parseFloat((totalAmount / totalLiters).toFixed(2)) : 0,
    };

    return res.status(200).json({
      success: true,
      data: {
        lang,
        adminShopName: req.admin.shopName || "Milkify Dairy",
        dateRange: { startDate, endDate },
        filterStatus: statusFilter,
        farmer: {
          id: farmer._id,
          memberId: farmer.memberId,
          name: farmer.name,
          mobile: farmer.mobile,
          village: farmer.village,
        },
        summary,
        payment: {
          status: statusBadge,
          paidEntries,
          unpaidEntries,
          paidAmount: parseFloat(paidAmount.toFixed(2)),
          unpaidAmount: parseFloat(unpaidAmount.toFixed(2)),
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
 * Generates and returns a dedicated 80mm thermal PDF billing slip.
 * Query params: startDate (YYYY-MM-DD), endDate (YYYY-MM-DD), lang (en|hi|mr), status (all|unpaid|paid)
 */
exports.generateBillingSlipPdf = async (req, res) => {
  try {
    const { farmerId } = req.params;
    const adminId = new mongoose.Types.ObjectId(req.admin._id);
    const { start, end, startDate, endDate } = buildDateRange(req.query);
    const statusFilter = req.query.status || "all";

    const milkQuery = {
      adminId,
      farmerId: new mongoose.Types.ObjectId(farmerId),
      createdAt: { $gte: start, $lte: end },
    };

    if (statusFilter === "unpaid") {
      milkQuery.paymentStatus = { $ne: "paid" };
    } else if (statusFilter === "paid") {
      milkQuery.paymentStatus = "paid";
    }

    const [farmer, entries] = await Promise.all([
      farmerModel.findOne({ _id: farmerId, adminId }).lean(),
      MilkModel.find(milkQuery)
        .select("createdAt shift category litter fat snf calculatedAmount paymentStatus rate")
        .sort({ createdAt: 1 })
        .lean(),
    ]);

    if (!farmer) return res.status(404).json({ message: "Farmer not found" });
    if (!entries.length) return res.status(404).json({ message: "No entries found for this range" });

    let totalLiters = 0;
    let totalAmount = 0;
    let totalFat = 0;
    let totalSnf = 0;
    let paidEntries = 0;
    let paidLiters = 0;
    let paidAmount = 0;
    let unpaidEntries = 0;
    let unpaidLiters = 0;
    let unpaidAmount = 0;

    entries.forEach((e) => {
      const l = Number(e.litter || 0);
      const a = Number(e.calculatedAmount || 0);
      const f = Number(e.fat || 0);
      const s = Number(e.snf || 0);

      totalLiters += l;
      totalAmount += a;
      totalFat += f;
      totalSnf += s;

      if (e.paymentStatus === "paid") {
        paidEntries += 1;
        paidLiters += l;
        paidAmount += a;
      } else {
        unpaidEntries += 1;
        unpaidLiters += l;
        unpaidAmount += a;
      }
    });

    const count = entries.length || 1;
    let statusBadge = "unpaid";
    if (entries.length > 0 && unpaidEntries === 0) {
      statusBadge = "paid";
    } else if (paidEntries > 0 && unpaidEntries > 0) {
      statusBadge = "partial";
    } else if (entries.length === 0) {
      statusBadge = "none";
    }

    const summary = {
      totalEntries: entries.length,
      totalLiters: parseFloat(totalLiters.toFixed(3)),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      paidEntries,
      paidLiters: parseFloat(paidLiters.toFixed(3)),
      paidAmount: parseFloat(paidAmount.toFixed(2)),
      unpaidEntries,
      unpaidLiters: parseFloat(unpaidLiters.toFixed(3)),
      unpaidAmount: parseFloat(unpaidAmount.toFixed(2)),
      avgFat: parseFloat((totalFat / count).toFixed(2)),
      avgSnf: parseFloat((totalSnf / count).toFixed(2)),
      avgRate: totalLiters > 0 ? parseFloat((totalAmount / totalLiters).toFixed(2)) : 0,
    };

    const pdfData = {
      adminShopName: req.admin.shopName || "Milkify Dairy",
      dateRange: { startDate, endDate },
      filterStatus: statusFilter,
      farmer: { id: farmer._id, memberId: farmer.memberId, name: farmer.name, mobile: farmer.mobile, village: farmer.village },
      summary,
      payment: {
        status: statusBadge,
        paidEntries,
        unpaidEntries,
        paidAmount: parseFloat(paidAmount.toFixed(2)),
        unpaidAmount: parseFloat(unpaidAmount.toFixed(2)),
      },
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
 * Generates thermal PDF billing slip and sends it to the farmer's email.
 * Query params: startDate, endDate, lang, status
 */
exports.sendBillingEmail = async (req, res) => {
  try {
    const { farmerId } = req.params;
    const adminId = new mongoose.Types.ObjectId(req.admin._id);
    const { start, end, startDate, endDate } = buildDateRange(req.query);
    const lang = ["en", "hi", "mr"].includes(req.query.lang) ? req.query.lang : "en";
    const statusFilter = req.query.status || "all";

    const milkQuery = {
      adminId,
      farmerId: new mongoose.Types.ObjectId(farmerId),
      createdAt: { $gte: start, $lte: end },
    };

    if (statusFilter === "unpaid") {
      milkQuery.paymentStatus = { $ne: "paid" };
    } else if (statusFilter === "paid") {
      milkQuery.paymentStatus = "paid";
    }

    const [farmer, entries] = await Promise.all([
      farmerModel.findOne({ _id: farmerId, adminId }).lean(),
      MilkModel.find(milkQuery)
        .select("createdAt shift category litter fat snf calculatedAmount paymentStatus rate")
        .sort({ createdAt: 1 })
        .lean(),
    ]);

    if (!farmer)         return res.status(404).json({ message: "Farmer not found" });
    if (!farmer.email)   return res.status(400).json({ message: "Farmer does not have an email address on record" });
    if (!entries.length) return res.status(404).json({ message: "No entries found for this date range" });

    let totalLiters = 0;
    let totalAmount = 0;
    let totalFat = 0;
    let totalSnf = 0;
    let paidEntries = 0;
    let paidAmount = 0;
    let unpaidEntries = 0;
    let unpaidAmount = 0;

    entries.forEach((e) => {
      const l = Number(e.litter || 0);
      const a = Number(e.calculatedAmount || 0);
      const f = Number(e.fat || 0);
      const s = Number(e.snf || 0);

      totalLiters += l;
      totalAmount += a;
      totalFat += f;
      totalSnf += s;

      if (e.paymentStatus === "paid") {
        paidEntries += 1;
        paidAmount += a;
      } else {
        unpaidEntries += 1;
        unpaidAmount += a;
      }
    });

    const count = entries.length || 1;
    let statusBadge = "unpaid";
    if (entries.length > 0 && unpaidEntries === 0) {
      statusBadge = "paid";
    } else if (paidEntries > 0 && unpaidEntries > 0) {
      statusBadge = "partial";
    } else if (entries.length === 0) {
      statusBadge = "none";
    }

    const summary = {
      totalEntries: entries.length,
      totalLiters: parseFloat(totalLiters.toFixed(3)),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      paidEntries,
      paidAmount: parseFloat(paidAmount.toFixed(2)),
      unpaidEntries,
      unpaidAmount: parseFloat(unpaidAmount.toFixed(2)),
      avgFat: parseFloat((totalFat / count).toFixed(2)),
      avgSnf: parseFloat((totalSnf / count).toFixed(2)),
      avgRate: totalLiters > 0 ? parseFloat((totalAmount / totalLiters).toFixed(2)) : 0,
    };

    const pdfData = {
      adminShopName: req.admin.shopName || "Milkify Dairy",
      dateRange: { startDate, endDate },
      filterStatus: statusFilter,
      farmer: { id: farmer._id, memberId: farmer.memberId, name: farmer.name, mobile: farmer.mobile, village: farmer.village },
      summary,
      payment: {
        status: statusBadge,
        paidEntries,
        unpaidEntries,
        paidAmount,
        unpaidAmount,
      },
      entries,
    };

    // Respond immediately to prevent frontend timeout (Fire and Forget)
    res.status(200).json({ success: true, message: `Processing thermal bill delivery. It will arrive at ${farmer.email} shortly.` });

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
          paidAmount:   summary.paidAmount,
          unpaidAmount: summary.unpaidAmount,
          statusBadge,
        };

        await transporter.sendMail({
          from:    `"${req.admin.shopName || "Milkify Dairy"}" <${process.env.SMTP_EMAIL}>`,
          to:      farmer.email,
          subject: `📄 Thermal Milk Collection Bill: ${startDate} to ${endDate} | ${req.admin.shopName || "Milkify Dairy"}`,
          html:    billingEmailHtml(emailOpts),
          text:    billingEmailText(emailOpts),
          attachments: [{
            filename:    `Thermal_Bill_${farmer.name}_${startDate}.pdf`,
            content:     pdfBuffer,
            contentType: "application/pdf",
          }],
        });
        console.log(`[Billing] Thermal bill emailed to ${farmer.email} for farmer ${farmer.name}`);
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
        if (entry.paymentStatus === "paid") {
          acc.paidEntries += 1;
          acc.paidAmount += amount;
          acc.paidLiters += liters;
        } else {
          acc.unpaidEntries += 1;
          acc.unpaidAmount += amount;
          acc.unpaidLiters += liters;
        }
        return acc;
      },
      {
        totalEntries: 0,
        paidEntries: 0,
        unpaidEntries: 0,
        totalLiters: 0,
        totalAmount: 0,
        paidAmount: 0,
        unpaidAmount: 0,
        paidLiters: 0,
        unpaidLiters: 0,
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
          paidAmount: Number(totals.paidAmount.toFixed(2)),
          unpaidAmount: Number(totals.unpaidAmount.toFixed(2)),
          paidLiters: Number(totals.paidLiters.toFixed(3)),
          unpaidLiters: Number(totals.unpaidLiters.toFixed(3)),
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

// ─── SPRINT BILLING & CONFIGURATION ──────────────────────────────────────────

/**
 * GET /api/billing/sprint/config
 * Retrieves Admin's billing cycle configuration, active sprint, and available sprints.
 */
exports.getSprintConfig = async (req, res) => {
  try {
    const adminId = req.admin._id || req.admin.id;
    const admin = await AdminModel.findById(adminId).lean();

    const cycleDays = admin?.billingCycleDays || 10;
    const autoEmailOnSprintClose = admin?.autoEmailOnSprintClose !== false;
    const notifyZeroCollectionFarmers = admin?.notifyZeroCollectionFarmers !== false;

    const currentSprint = getCurrentSprint(cycleDays);
    const availableSprints = getRecentSprints(cycleDays, 2);

    return res.status(200).json({
      success: true,
      data: {
        cycleDays,
        autoEmailOnSprintClose,
        notifyZeroCollectionFarmers,
        currentSprint,
        availableSprints,
      },
    });
  } catch (error) {
    console.error("[SprintBilling] getSprintConfig error:", error);
    return res.status(500).json({ success: false, message: "Error fetching sprint config", error: error.message });
  }
};

/**
 * PUT /api/billing/sprint/config
 * Updates Admin's billing cycle preferences (e.g. 5, 7, 10, 15, 20, 30 days).
 */
exports.updateSprintConfig = async (req, res) => {
  try {
    const adminId = req.admin._id || req.admin.id;
    const { billingCycleDays, autoEmailOnSprintClose, notifyZeroCollectionFarmers } = req.body;

    const update = {};
    if (billingCycleDays !== undefined) {
      const parsedDays = Number(billingCycleDays);
      if (![5, 7, 10, 15, 20, 30].includes(parsedDays)) {
        return res.status(400).json({
          success: false,
          message: "Invalid billingCycleDays. Allowed values are 5, 7, 10, 15, 20, or 30 days.",
        });
      }
      update.billingCycleDays = parsedDays;
    }

    if (autoEmailOnSprintClose !== undefined) {
      update.autoEmailOnSprintClose = Boolean(autoEmailOnSprintClose);
    }
    if (notifyZeroCollectionFarmers !== undefined) {
      update.notifyZeroCollectionFarmers = Boolean(notifyZeroCollectionFarmers);
    }

    const updatedAdmin = await AdminModel.findByIdAndUpdate(
      adminId,
      { $set: update },
      { new: true }
    ).lean();

    const cycleDays = updatedAdmin.billingCycleDays || 10;
    const currentSprint = getCurrentSprint(cycleDays);
    const availableSprints = getRecentSprints(cycleDays, 2);

    return res.status(200).json({
      success: true,
      message: "Billing cycle configuration updated successfully",
      data: {
        cycleDays,
        autoEmailOnSprintClose: updatedAdmin.autoEmailOnSprintClose,
        notifyZeroCollectionFarmers: updatedAdmin.notifyZeroCollectionFarmers,
        currentSprint,
        availableSprints,
      },
    });
  } catch (error) {
    console.error("[SprintBilling] updateSprintConfig error:", error);
    return res.status(500).json({ success: false, message: "Error updating sprint config", error: error.message });
  }
};

/**
 * GET /api/billing/sprint/history
 * Lists all completed or processing sprint billing runs for this admin.
 */
exports.getSprintHistory = async (req, res) => {
  try {
    const adminId = new mongoose.Types.ObjectId(req.admin._id || req.admin.id);
    const sprints = await SprintBillingModel.find({ adminId })
      .sort({ createdAt: -1 })
      .select("-farmerSummaries.entries")
      .lean();

    return res.status(200).json({
      success: true,
      data: { sprints },
    });
  } catch (error) {
    console.error("[SprintBilling] getSprintHistory error:", error);
    return res.status(500).json({ success: false, message: "Error fetching sprint history", error: error.message });
  }
};

/**
 * GET /api/billing/sprint/details/:sprintId
 * Detailed breakdown of a specific sprint run, including farmer-by-farmer ledger.
 */
exports.getSprintDetails = async (req, res) => {
  try {
    const adminId = new mongoose.Types.ObjectId(req.admin._id || req.admin.id);
    const { sprintId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(sprintId)) {
      return res.status(400).json({ success: false, message: "Invalid sprint ID" });
    }

    const sprint = await SprintBillingModel.findOne({ _id: sprintId, adminId }).lean();
    if (!sprint) {
      return res.status(404).json({ success: false, message: "Sprint billing record not found" });
    }

    return res.status(200).json({
      success: true,
      data: { sprint },
    });
  } catch (error) {
    console.error("[SprintBilling] getSprintDetails error:", error);
    return res.status(500).json({ success: false, message: "Error fetching sprint details", error: error.message });
  }
};

/**
 * POST /api/billing/sprint/close-and-dispatch
 * Completes a sprint, calculates billing for all farmers, records historical snapshot,
 * and asynchronously delivers 80mm thermal PDF statements (or zero-collection notices)
 * with robust load management and email rate throttling.
 */
exports.processSprintBilling = async (req, res) => {
  try {
    const adminId = new mongoose.Types.ObjectId(req.admin._id || req.admin.id);
    const admin = await AdminModel.findById(adminId).lean();

    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin account not found" });
    }

    const cycleDays = Number(req.body.cycleDays) || admin.billingCycleDays || 10;
    const defaultSprint = getCurrentSprint(cycleDays);

    const startDate = req.body.startDate || defaultSprint.startDate;
    const endDate   = req.body.endDate   || defaultSprint.endDate;
    const sprintName = req.body.sprintName || `Sprint (${startDate} to ${endDate})`;

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Multi-tenant safe: Only query farmers and milk entries belonging to this admin
    const [activeFarmers, milkEntries] = await Promise.all([
      farmerModel.find({ adminId, status: { $ne: "pause" } }).lean(),
      MilkModel.find({
        adminId,
        createdAt: { $gte: start, $lte: end },
        isActive: { $ne: false },
      })
        .select("farmerId createdAt shift category litter fat snf calculatedAmount paymentStatus rate")
        .sort({ createdAt: 1 })
        .lean(),
    ]);

    if (!activeFarmers.length) {
      return res.status(400).json({
        success: false,
        message: "No active farmers found in your dairy cooperative.",
      });
    }

    // Group entries by farmerId
    const entriesByFarmer = new Map();
    milkEntries.forEach((entry) => {
      const fId = String(entry.farmerId);
      if (!entriesByFarmer.has(fId)) {
        entriesByFarmer.set(fId, []);
      }
      entriesByFarmer.get(fId).push(entry);
    });

    let sprintTotalLiters = 0;
    let sprintTotalAmount = 0;
    let sprintTotalFat = 0;
    let sprintTotalSnf = 0;
    let activeFarmerCount = 0;
    let zeroFarmerCount = 0;

    const farmerSummaries = activeFarmers.map((farmer) => {
      const fId = String(farmer._id);
      const entries = entriesByFarmer.get(fId) || [];
      const hasCollection = entries.length > 0;

      let totalLiters = 0;
      let totalAmount = 0;
      let paidAmount = 0;
      let unpaidAmount = 0;
      let totalFat = 0;
      let totalSnf = 0;

      entries.forEach((e) => {
        const l = Number(e.litter || 0);
        const a = Number(e.calculatedAmount || 0);
        totalLiters += l;
        totalAmount += a;
        totalFat += Number(e.fat || 0);
        totalSnf += Number(e.snf || 0);

        if (e.paymentStatus === "paid") {
          paidAmount += a;
        } else {
          unpaidAmount += a;
        }
      });

      const count = entries.length || 1;
      const avgFat = hasCollection ? parseFloat((totalFat / count).toFixed(2)) : 0;
      const avgSnf = hasCollection ? parseFloat((totalSnf / count).toFixed(2)) : 0;

      if (hasCollection) {
        activeFarmerCount++;
        sprintTotalLiters += totalLiters;
        sprintTotalAmount += totalAmount;
        sprintTotalFat += avgFat;
        sprintTotalSnf += avgSnf;
      } else {
        zeroFarmerCount++;
      }

      return {
        farmerId: farmer._id,
        farmerName: farmer.name,
        farmerMobile: farmer.mobile || "",
        farmerEmail: farmer.email || "",
        memberId: farmer.memberId || "",
        village: farmer.village || admin.village || "",
        totalEntries: entries.length,
        totalLiters: parseFloat(totalLiters.toFixed(3)),
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        paidAmount: parseFloat(paidAmount.toFixed(2)),
        unpaidAmount: parseFloat(unpaidAmount.toFixed(2)),
        avgFat,
        avgSnf,
        hasCollection,
        emailStatus: "pending",
        emailError: "",
        entries, // used in worker; stripped from final saved record
      };
    });

    // Create persistent Sprint Billing record
    const sprintRecord = await SprintBillingModel.create({
      adminId,
      sprintName,
      cycleDays,
      startDate,
      endDate,
      status: "processing",
      totalFarmers: activeFarmers.length,
      activeFarmers: activeFarmerCount,
      zeroCollectionFarmers: zeroFarmerCount,
      totalLiters: parseFloat(sprintTotalLiters.toFixed(3)),
      totalAmount: parseFloat(sprintTotalAmount.toFixed(2)),
      avgFat: activeFarmerCount > 0 ? parseFloat((sprintTotalFat / activeFarmerCount).toFixed(2)) : 0,
      avgSnf: activeFarmerCount > 0 ? parseFloat((sprintTotalSnf / activeFarmerCount).toFixed(2)) : 0,
      emailsSent: 0,
      emailsFailed: 0,
      farmerSummaries: farmerSummaries.map(({ entries, ...cleanSummary }) => cleanSummary),
    });

    // Respond immediately to UI — avoid HTTP timeout
    res.status(200).json({
      success: true,
      message: `Sprint "${sprintName}" billing generated. Email dispatch queued for ${activeFarmers.length} farmers.`,
      data: {
        sprintId: sprintRecord._id,
        sprintName,
        totalFarmers: activeFarmers.length,
        activeFarmers: activeFarmerCount,
        zeroCollectionFarmers: zeroFarmerCount,
        totalLiters: sprintRecord.totalLiters,
        totalAmount: sprintRecord.totalAmount,
      },
    });

    // ── Asynchronous Background Dispatch Worker with Load Management ─────────
    (async () => {
      const BATCH_SIZE = 4;
      const DELAY_BETWEEN_BATCHES_MS = 600;
      let emailsSent = 0;
      let emailsFailed = 0;

      // Copy summaries for mutation
      const finalSummaries = sprintRecord.farmerSummaries.map((s) => s.toObject());

      for (let i = 0; i < farmerSummaries.length; i += BATCH_SIZE) {
        const batch = farmerSummaries.slice(i, i + BATCH_SIZE);

        await Promise.allSettled(
          batch.map(async (farmerItem, batchIdx) => {
            const summaryIdx = i + batchIdx;
            const targetSummary = finalSummaries[summaryIdx];

            try {
              const email = (farmerItem.farmerEmail || "").trim();
              if (!email || !email.includes("@")) {
                targetSummary.emailStatus = "no_email";
                return;
              }

              if (farmerItem.hasCollection) {
                // Active farmer with collection: generate 80mm thermal PDF receipt
                const paidEntriesCount = farmerItem.entries.filter((e) => e.paymentStatus === "paid").length;
                const unpaidEntriesCount = farmerItem.entries.length - paidEntriesCount;

                const pdfData = {
                  adminShopName: admin.shopName || "Milkify Dairy",
                  dateRange: { startDate, endDate },
                  filterStatus: "all",
                  farmer: {
                    id: farmerItem.farmerId,
                    memberId: farmerItem.memberId,
                    name: farmerItem.farmerName,
                    mobile: farmerItem.farmerMobile,
                    village: farmerItem.village,
                  },
                  summary: {
                    totalEntries: farmerItem.totalEntries,
                    totalLiters: farmerItem.totalLiters,
                    totalAmount: farmerItem.totalAmount,
                    paidEntries: paidEntriesCount,
                    paidAmount: farmerItem.paidAmount,
                    unpaidEntries: unpaidEntriesCount,
                    unpaidAmount: farmerItem.unpaidAmount,
                    avgFat: farmerItem.avgFat,
                    avgSnf: farmerItem.avgSnf,
                    avgRate: farmerItem.totalLiters > 0 ? parseFloat((farmerItem.totalAmount / farmerItem.totalLiters).toFixed(2)) : 0,
                  },
                  payment: {
                    status: unpaidEntriesCount === 0 ? "paid" : paidEntriesCount > 0 ? "partial" : "unpaid",
                    paidAmount: farmerItem.paidAmount,
                    unpaidAmount: farmerItem.unpaidAmount,
                  },
                  entries: farmerItem.entries,
                };

                const pdfBuffer = await generateBillingPdfBuffer(pdfData, "en");

                await transporter.sendMail({
                  from: `"${admin.shopName || "Milkify Dairy"}" <${process.env.SMTP_EMAIL}>`,
                  to: email,
                  subject: `📄 Sprint Billing Slip: ${startDate} to ${endDate} | ${admin.shopName || "Milkify Dairy"}`,
                  html: billingEmailHtml({
                    farmerName: farmerItem.farmerName,
                    shopName: admin.shopName || "Milkify Dairy",
                    startDate,
                    endDate,
                    totalLiters: farmerItem.totalLiters,
                    avgFat: farmerItem.avgFat,
                    avgSnf: farmerItem.avgSnf,
                    totalAmount: farmerItem.totalAmount,
                    totalEntries: farmerItem.totalEntries,
                  }),
                  text: billingEmailText({
                    farmerName: farmerItem.farmerName,
                    shopName: admin.shopName || "Milkify Dairy",
                    startDate,
                    endDate,
                    totalLiters: farmerItem.totalLiters,
                    totalAmount: farmerItem.totalAmount,
                  }),
                  attachments: [
                    {
                      filename: `Thermal_Bill_${farmerItem.farmerName.replace(/\s+/g, "_")}_${startDate}.pdf`,
                      content: pdfBuffer,
                      contentType: "application/pdf",
                    },
                  ],
                });

                targetSummary.emailStatus = "sent";
                emailsSent++;
              } else {
                // Zero-collection farmer: courteous inactivity notice
                if (admin.notifyZeroCollectionFarmers !== false) {
                  await transporter.sendMail({
                    from: `"${admin.shopName || "Milkify Dairy"}" <${process.env.SMTP_EMAIL}>`,
                    to: email,
                    subject: `📋 Cycle Billing Notice: ${startDate} to ${endDate} | ${admin.shopName || "Milkify Dairy"}`,
                    html: zeroCollectionEmailHtml({
                      farmerName: farmerItem.farmerName,
                      shopName: admin.shopName || "Milkify Dairy",
                      startDate,
                      endDate,
                      memberId: farmerItem.memberId,
                      village: admin.village || "",
                      adminMobile: admin.mobile || "",
                    }),
                    text: zeroCollectionEmailText({
                      farmerName: farmerItem.farmerName,
                      shopName: admin.shopName || "Milkify Dairy",
                      startDate,
                      endDate,
                      adminMobile: admin.mobile || "",
                    }),
                  });

                  targetSummary.emailStatus = "sent";
                  emailsSent++;
                } else {
                  targetSummary.emailStatus = "skipped";
                }
              }
            } catch (mailErr) {
              console.error(`[SprintBilling] Failed to email farmer ${farmerItem.farmerName} (${farmerItem.farmerEmail}):`, mailErr.message);
              targetSummary.emailStatus = "failed";
              targetSummary.emailError = mailErr.message;
              emailsFailed++;
            }
          })
        );

        // Throttle between batches to prevent SMTP server overload
        if (i + BATCH_SIZE < farmerSummaries.length) {
          await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_BATCHES_MS));
        }
      }

      // Mark sprint as completed and record final delivery metrics
      await SprintBillingModel.findByIdAndUpdate(sprintRecord._id, {
        $set: {
          status: "completed",
          emailsSent,
          emailsFailed,
          farmerSummaries: finalSummaries,
          processedAt: new Date(),
        },
      });

      console.log(`[SprintBilling] Completed sprint ${sprintRecord._id} ("${sprintName}"): ${emailsSent} sent, ${emailsFailed} failed.`);
    })().catch((err) => {
      console.error("[SprintBilling] Background worker failed:", err);
    });

  } catch (error) {
    console.error("[SprintBilling] processSprintBilling error:", error);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: "Server error processing sprint billing", error: error.message });
    }
  }
};
