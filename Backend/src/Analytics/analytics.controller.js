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

    res.status(200).json({
      success: true,
      data: {
        totalFarmers,
        totalLitersToday: parseFloat((todayStats?.totalLitersToday || 0).toFixed(2)),
        avgFatToday:      parseFloat((todayStats?.avgFatToday      || 0).toFixed(2)),
        totalAmountOwed:  parseFloat((cycleStats?.totalAmountOwed  || 0).toFixed(2)),
        cycleStart,
        cycleEnd,
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

    // ── Call AI (OpenAI → Gemini fallback) ─────────────────────────────────
    let aiText = "";
    try {
      if (openaiKey) {
        try {
          const openai = new OpenAI({ apiKey: openaiKey });
          const resp = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
            max_tokens: 120,
          });
          aiText = resp.choices[0].message.content.trim();
        } catch (openaiErr) {
          console.warn("[AI] OpenAI failed, trying Gemini:", openaiErr.message);
          if (!geminiKey) throw openaiErr;
          const genAI = new GoogleGenerativeAI(geminiKey);
          const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
          const result = await model.generateContent(prompt);
          aiText = result.response.text().trim();
        }
      } else {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
        const result = await model.generateContent(prompt);
        aiText = result.response.text().trim();
      }
    } catch (apiError) {
      console.error("[AI] API Error:", apiError.message);
      return res.status(503).json({
        success: false,
        message: "AI prediction service is temporarily unavailable. Please try again later.",
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
