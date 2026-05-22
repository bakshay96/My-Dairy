const mongoose = require("mongoose");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { OpenAI } = require("openai");
const crypto = require("crypto");
const { MilkModel } = require("../Milk/milk.model");
const { farmerModel } = require("../Farmer/farmer.model");
const { getBillingCycleDate, getBillingCycleEnd } = require("../utils/milkCalculator");
const { AiInsightCacheModel } = require("./aiInsightCache.model");

// ─── Helper: ISO week key e.g. "2026-W20" ─────────────────────────────────────
function getISOWeekKey(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
// ─── Dashboard Stats ──────────────────────────────────────────────────────────
exports.getDashboardStats = async (req, res) => {
  try {
    const adminIdStr = req.admin?._id || req.params?.adminId;
    if (!adminIdStr) return res.status(400).json({ success: false, message: "Admin ID is required" });
    const adminId = new mongoose.Types.ObjectId(adminIdStr);

    const totalFarmers = await farmerModel.countDocuments({ adminId });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayStats] = await MilkModel.aggregate([
      { $match: { adminId, createdAt: { $gte: today, $lt: tomorrow } } },
      { $group: { _id: null, totalLitersToday: { $sum: "$litter" }, avgFatToday: { $avg: "$fat" } } }
    ]);

    const cycleStart = getBillingCycleDate();
    const cycleEnd   = getBillingCycleEnd(cycleStart);
    const [cycleStats] = await MilkModel.aggregate([
      { $match: { adminId, createdAt: { $gte: new Date(cycleStart), $lte: new Date(cycleEnd + "T23:59:59.999Z") } } },
      { $group: { _id: null, totalAmountOwed: { $sum: "$calculatedAmount" } } }
    ]);

    // ── Collection Trends (Cow, Buffalo, Goat, Sheep) ──
    let startMatchDate = null;
    const range = req.query.range || "monthly";

    if (range === "weekly") {
      startMatchDate = new Date();
      startMatchDate.setDate(startMatchDate.getDate() - 7);
      startMatchDate.setHours(0, 0, 0, 0);
    } else if (range === "monthly") {
      startMatchDate = new Date();
      startMatchDate.setDate(startMatchDate.getDate() - 30);
      startMatchDate.setHours(0, 0, 0, 0);
    } else if (range === "custom" && req.query.startDate && req.query.endDate) {
      startMatchDate = new Date(req.query.startDate);
      startMatchDate.setHours(0, 0, 0, 0);
    } else if (range === "max") {
      startMatchDate = null; // No limit: fetch all time data
    } else {
      // Default to last 30 days
      startMatchDate = new Date();
      startMatchDate.setDate(startMatchDate.getDate() - 30);
      startMatchDate.setHours(0, 0, 0, 0);
    }

    const trendMatch = { adminId, isActive: { $ne: false } };
    if (startMatchDate) {
      trendMatch.createdAt = { $gte: startMatchDate };
    }
    if (range === "custom" && req.query.endDate) {
      const endMatchDate = new Date(req.query.endDate);
      endMatchDate.setHours(23, 59, 59, 999);
      if (trendMatch.createdAt) {
        trendMatch.createdAt.$lte = endMatchDate;
      } else {
        trendMatch.createdAt = { $lte: endMatchDate };
      }
    }

    const trendStats = await MilkModel.aggregate([
      { $match: trendMatch },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            category: "$category"
          },
          totalLiters: { $sum: "$litter" },
          totalAmount: { $sum: "$calculatedAmount" }
        }
      },
      { $sort: { "_id.date": 1 } }
    ]);

    const trendMap = {};
    trendStats.forEach(item => {
      const date = item._id.date;
      const cat = item._id.category || "cow";

      if (!trendMap[date]) {
        trendMap[date] = {
          date,
          totalLiters: 0,
          totalAmount: 0,
          cowLiters: 0,
          cowAmount: 0,
          buffaloLiters: 0,
          buffaloAmount: 0,
          goatLiters: 0,
          goatAmount: 0,
          sheepLiters: 0,
          sheepAmount: 0,
        };
      }

      const liters = parseFloat(item.totalLiters.toFixed(2));
      const amount = parseFloat(item.totalAmount.toFixed(2));

      trendMap[date].totalLiters = parseFloat((trendMap[date].totalLiters + liters).toFixed(2));
      trendMap[date].totalAmount = parseFloat((trendMap[date].totalAmount + amount).toFixed(2));

      if (cat === "cow") {
        trendMap[date].cowLiters = liters;
        trendMap[date].cowAmount = amount;
      } else if (cat === "buffalo") {
        trendMap[date].buffaloLiters = liters;
        trendMap[date].buffaloAmount = amount;
      } else if (cat === "goat") {
        trendMap[date].goatLiters = liters;
        trendMap[date].goatAmount = amount;
      } else if (cat === "sheep") {
        trendMap[date].sheepLiters = liters;
        trendMap[date].sheepAmount = amount;
      }
    });

    const trendData = Object.values(trendMap).sort((a, b) => a.date.localeCompare(b.date));

    res.status(200).json({
      success: true,
      data: {
        totalFarmers,
        totalLitersToday: parseFloat((todayStats?.totalLitersToday || 0).toFixed(2)),
        avgFatToday:      parseFloat((todayStats?.avgFatToday      || 0).toFixed(2)),
        totalAmountOwed:  parseFloat((cycleStats?.totalAmountOwed  || 0).toFixed(2)),
        cycleStart,
        cycleEnd,
        trendData
      }
    });
  } catch (error) {
    console.error("getDashboardStats error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// ─── AI Insights ──────────────────────────────────────────────────────────────
exports.getAiInsights = async (req, res) => {
  try {
    const adminIdStr = req.admin?._id || req.params?.adminId;
    if (!adminIdStr) return res.status(400).json({ success: false, message: "Admin ID is required" });
    const adminId = new mongoose.Types.ObjectId(adminIdStr);

    const { farmerId, startDate, endDate } = req.query;

    // ── Build match query ───────────────────────────────────────────────────
    const matchQuery = { adminId };
    if (farmerId) matchQuery.farmerId = new mongoose.Types.ObjectId(farmerId);

    if (startDate && endDate) {
      const start = new Date(startDate); start.setHours(0, 0, 0, 0);
      const end   = new Date(endDate);   end.setHours(23, 59, 59, 999);
      matchQuery.createdAt = { $gte: start, $lte: end };
    } else {
      const ago = new Date();
      ago.setDate(ago.getDate() - 30);
      matchQuery.createdAt = { $gte: ago };
    }

    // ── Aggregate daily data ────────────────────────────────────────────────
    const historicalData = await MilkModel.aggregate([
      { $match: matchQuery },
      { $sort: { createdAt: 1 } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totalLiters: { $sum: "$litter" },
          avgFat:      { $avg: "$fat"    },
          avgSnf:      { $avg: "$snf"    },
        }
      },
      { $sort: { _id: 1 } }
    ]);

    if (!historicalData || historicalData.length < 3) {
      return res.status(200).json({
        success: true,
        data: {
          insight: "Not enough historical data to generate AI predictions for this date range. Record at least 3 days of entries.",
          predictedYieldNext7Days: null,
          predictedAvgFat: null,
        }
      });
    }

    // ── Cache key: adminId + farmerId + ISO week of startDate ───────────────
    const weekKey  = getISOWeekKey(startDate);
    const dataHash = crypto.createHash("md5").update(JSON.stringify(historicalData)).digest("hex");
    const cacheKey = `${adminIdStr}_${farmerId || "all"}_${weekKey}`;

    // Check MongoDB persistent cache (match cacheKey AND dataHash so new entries trigger fresh AI)
    const cached = await AiInsightCacheModel.findOne({ cacheKey, dataHash });
    if (cached) {
      return res.status(200).json({
        success: true,
        cached: true,
        data: {
          insight:                 cached.insight,
          predictedYieldNext7Days: cached.predictedYieldNext7Days,
          predictedAvgFat:         cached.predictedAvgFat,
        }
      });
    }

    // ── Check API keys ──────────────────────────────────────────────────────
    const openaiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!openaiKey && !geminiKey) {
      return res.status(503).json({
        success: false,
        message: "AI features are disabled. Add OPENAI_API_KEY or GEMINI_API_KEY to backend .env to enable forecasting.",
      });
    }

    // ── Compact, token-efficient prompt ────────────────────────────────────
    const rows = historicalData.slice(-14)
      .map(d => `${d._id}: ${d.totalLiters.toFixed(1)}L FAT=${d.avgFat.toFixed(2)}%`)
      .join("\n");

    const prompt = `You are a dairy analytics AI. Daily milk data (recent ${Math.min(historicalData.length, 14)} days):\n${rows}\n\nTask: Predict next 7 days combined yield (litres) and average FAT%. Give 1 actionable sentence.\nRespond ONLY with valid JSON (no markdown):\n{"predictedYieldNext7Days":0.0,"predictedAvgFat":0.0,"insight":"text"}`;

    // ── Call AI (Multiple Models with Cascading Fallback) ───────────────────
    let aiText = "";
    let aiModelUsed = "";
    try {
      const attempts = [];
      if (openaiKey) {
        attempts.push({
          name: "OpenAI GPT-4o-Mini",
          fn: async () => {
            const openai = new OpenAI({ apiKey: openaiKey });
            const resp = await openai.chat.completions.create({
              model: "gpt-4o-mini",
              messages: [{ role: "user", content: prompt }],
              temperature: 0.3,
              max_tokens: 120,
            });
            return resp.choices[0].message.content.trim();
          }
        });
        attempts.push({
          name: "OpenAI GPT-4o",
          fn: async () => {
            const openai = new OpenAI({ apiKey: openaiKey });
            const resp = await openai.chat.completions.create({
              model: "gpt-4o",
              messages: [{ role: "user", content: prompt }],
              temperature: 0.3,
              max_tokens: 120,
            });
            return resp.choices[0].message.content.trim();
          }
        });
      }

      if (geminiKey) {
        attempts.push({
          name: "Gemini 2.0 Flash Lite",
          fn: async () => {
            const genAI = new GoogleGenerativeAI(geminiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
            const result = await model.generateContent(prompt);
            return result.response.text().trim();
          }
        });
        attempts.push({
          name: "Gemini 1.5 Flash",
          fn: async () => {
            const genAI = new GoogleGenerativeAI(geminiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent(prompt);
            return result.response.text().trim();
          }
        });
      }

      let success = false;
      for (const attempt of attempts) {
        try {
          console.log(`[AI] Attempting AI generation using model: ${attempt.name}...`);
          aiText = await attempt.fn();
          aiModelUsed = attempt.name;
          success = true;
          console.log(`[AI] Generation succeeded using model: ${attempt.name}`);
          break;
        } catch (err) {
          console.warn(`[AI] Model ${attempt.name} failed or quota exceeded:`, err.message);
        }
      }

      if (!success) {
        throw new Error("All AI models and fallbacks failed to respond.");
      }
    } catch (apiError) {
      console.warn("[AI] Standard API pathways failed or quota exceeded, running fallback mathematical analytics forecaster:", apiError.message);

      // Compute trends from historicalData
      const dataLen = historicalData.length;
      let totalLitersSum = 0;
      let totalFatSum = 0;
      historicalData.forEach(d => {
        totalLitersSum += d.totalLiters || 0;
        totalFatSum += d.avgFat || 0;
      });

      const globalAvgDailyYield = totalLitersSum / dataLen;
      const globalAvgDailyFat = totalFatSum / dataLen;

      // Split into two halves to compute growth/decline trend
      const half = Math.floor(dataLen / 2);
      const firstHalf = historicalData.slice(0, half);
      const secondHalf = historicalData.slice(half);

      let firstHalfYield = 0;
      firstHalf.forEach(d => firstHalfYield += d.totalLiters || 0);
      const firstAvg = firstHalfYield / (firstHalf.length || 1);

      let secondHalfYield = 0;
      secondHalf.forEach(d => secondHalfYield += d.totalLiters || 0);
      const secondAvg = secondHalfYield / (secondHalf.length || 1);

      // Trend calculation
      let yieldTrend = 0;
      if (firstAvg > 0) {
        yieldTrend = (secondAvg - firstAvg) / firstAvg;
      }
      // Clamp trend to reasonable bounds [-0.15, 0.15]
      yieldTrend = Math.max(-0.15, Math.min(0.15, yieldTrend));

      // Calculate recent average yield from last 7 days (or all if < 7) to base next week's forecast on recent velocity
      const recentDays = historicalData.slice(-7);
      let recentYieldSum = 0;
      let recentFatSum = 0;
      recentDays.forEach(d => {
        recentYieldSum += d.totalLiters || 0;
        recentFatSum += d.avgFat || 0;
      });
      const recentAvgYield = recentYieldSum / (recentDays.length || 1);
      const recentAvgFat = recentFatSum / (recentDays.length || 1);

      // Predicted values
      const predictedYield = parseFloat((recentAvgYield * 7 * (1 + yieldTrend)).toFixed(2));
      const predictedFat = parseFloat(Math.max(1.5, Math.min(15, recentAvgFat)).toFixed(2));

      // Actionable insight text based on calculated trends
      let insight = "";
      if (yieldTrend > 0.02) {
        insight = `Milk yield is projected to increase by ${(yieldTrend * 100).toFixed(1)}% next week to ${predictedYield.toFixed(1)}L, driven by positive collection momentum.`;
      } else if (yieldTrend < -0.02) {
        insight = `Collection trends indicate a contraction of ${Math.abs(yieldTrend * 100).toFixed(1)}% in yields (${predictedYield.toFixed(1)}L projected). Recommend feed optimization and collection audits.`;
      } else {
        insight = `Stable collection volume of ${predictedYield.toFixed(1)}L projected for next week. Quality averages remain healthy with ${predictedFat.toFixed(2)}% average FAT content.`;
      }

      // Add a helpful note if FAT is below dairy cooperative benchmark
      if (predictedFat < 4.0) {
        insight += ` Note: Average FAT levels are slightly low; advise farmers to optimize feed rations with dry fodder and mineral mixtures.`;
      }

      // Store in MongoDB persistent cache
      try {
        await AiInsightCacheModel.findOneAndUpdate(
          { cacheKey },
          {
            cacheKey, adminId,
            farmerId: farmerId ? new mongoose.Types.ObjectId(farmerId) : null,
            weekKey, dataHash,
            insight,
            predictedYieldNext7Days: predictedYield,
            predictedAvgFat:         predictedFat,
          },
          { upsert: true, new: true }
        );
      } catch (cacheErr) {
        console.error("[AI Cache] Failed to cache fallback results:", cacheErr.message);
      }

      return res.status(200).json({
        success: true,
        cached: false,
        fallback: true,
        data: {
          insight,
          predictedYieldNext7Days: predictedYield,
          predictedAvgFat:         predictedFat,
        }
      });
    }

    // ── Strip markdown fences if present ───────────────────────────────────
    aiText = aiText.replace(/^```(?:json)?/, "").replace(/```$/, "").trim();

    let aiData;
    try {
      aiData = JSON.parse(aiText);
    } catch (err) {
      console.error("[AI] Parse error:", aiText);
      return res.status(503).json({ success: false, message: "AI returned an unprocessable response. Please try again." });
    }

    const predictedYield = parseFloat(parseFloat(aiData.predictedYieldNext7Days || 0).toFixed(2));
    const predictedFat   = parseFloat(parseFloat(aiData.predictedAvgFat         || 0).toFixed(2));

    if (isNaN(predictedYield) || isNaN(predictedFat)) {
      return res.status(503).json({ success: false, message: "AI returned invalid numeric values. Please try again." });
    }

    // ── Persist to MongoDB cache (upsert by cacheKey) ──────────────────────
    await AiInsightCacheModel.findOneAndUpdate(
      { cacheKey },
      {
        cacheKey, adminId,
        farmerId: farmerId ? new mongoose.Types.ObjectId(farmerId) : null,
        weekKey, dataHash,
        insight:                 aiData.insight,
        predictedYieldNext7Days: predictedYield,
        predictedAvgFat:         predictedFat,
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      success: true,
      cached: false,
      data: {
        insight:                 aiData.insight,
        predictedYieldNext7Days: predictedYield,
        predictedAvgFat:         predictedFat,
      }
    });

  } catch (error) {
    console.error("getAiInsights error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
