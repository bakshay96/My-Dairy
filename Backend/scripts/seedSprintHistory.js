/**
 * seedSprintHistory.js
 * Generates rich, realistic completed sprint history records for earlier sprints
 * (October 2026 and September 2026) so the admin can immediately inspect older
 * sprint ledgers, volume, payouts, and email statuses in the UI archive.
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const { SprintBillingModel } = require("../src/Milk/sprintBilling.model");
const { AdminModel } = require("../src/Admin/admin.model");
const { farmerModel } = require("../src/Farmer/farmer.model");

async function seedHistory() {
  const mongoUrl = process.env.mongo_url || process.env.MONGO_URL || process.env.MONGODB_URI;
  if (!mongoUrl) {
    console.error("Missing mongo_url");
    process.exit(1);
  }

  await mongoose.connect(mongoUrl.trim());
  console.log("Connected to MongoDB for seeding sprint history...");

  const admins = await AdminModel.find().lean();
  for (const admin of admins) {
    const adminId = admin._id;
    const farmers = await farmerModel.find({ adminId }).lean();
    if (!farmers.length) continue;

    console.log(`Processing admin ${admin.name} (${admin.shopName}) with ${farmers.length} farmers...`);

    const historicalSprints = [
      {
        sprintName: "Sprint 3 (21 Oct - 31 Oct 2026)",
        startDate: "2026-10-21",
        endDate: "2026-10-31",
        cycleDays: 10,
        createdAt: new Date("2026-11-01T06:00:00.000Z"),
      },
      {
        sprintName: "Sprint 2 (11 Oct - 20 Oct 2026)",
        startDate: "2026-10-11",
        endDate: "2026-10-20",
        cycleDays: 10,
        createdAt: new Date("2026-10-21T06:00:00.000Z"),
      },
      {
        sprintName: "Sprint 1 (1 Oct - 10 Oct 2026)",
        startDate: "2026-10-01",
        endDate: "2026-10-10",
        cycleDays: 10,
        createdAt: new Date("2026-10-11T06:00:00.000Z"),
      },
      {
        sprintName: "Sprint 3 (21 Sep - 30 Sep 2026)",
        startDate: "2026-09-21",
        endDate: "2026-09-30",
        cycleDays: 10,
        createdAt: new Date("2026-10-01T06:00:00.000Z"),
      },
    ];

    for (const sprintInfo of historicalSprints) {
      // Check if this sprint already exists for this admin
      const exists = await SprintBillingModel.findOne({
        adminId,
        startDate: sprintInfo.startDate,
        endDate: sprintInfo.endDate,
      });

      if (exists) {
        console.log(`Sprint ${sprintInfo.sprintName} already exists for admin ${admin.name}. Skipping.`);
        continue;
      }

      // Generate farmer summaries
      let sprintTotalLiters = 0;
      let sprintTotalAmount = 0;
      let activeCount = 0;
      let zeroCount = 0;

      const farmerSummaries = farmers.map((f, idx) => {
        // Leave 1 or 2 farmers as zero collection for realistic testing
        const isZero = idx === farmers.length - 1;
        if (isZero) {
          zeroCount++;
          return {
            farmerId: f._id,
            farmerName: f.name,
            farmerMobile: f.mobile || "",
            farmerEmail: f.email || "",
            memberId: f.memberId || `M-${100 + idx}`,
            totalEntries: 0,
            totalLiters: 0,
            totalAmount: 0,
            paidAmount: 0,
            unpaidAmount: 0,
            avgFat: 0,
            avgSnf: 0,
            hasCollection: false,
            emailStatus: f.email ? "sent" : "no_email", // zero notice emailed
            emailError: "",
          };
        }

        activeCount++;
        const liters = parseFloat((85 + (idx * 27.5) + (Math.random() * 15)).toFixed(2));
        const fat = parseFloat((3.8 + (Math.random() * 1.4)).toFixed(1));
        const snf = parseFloat((8.3 + (Math.random() * 0.6)).toFixed(1));
        const rate = parseFloat((42 + (fat * 2.5)).toFixed(2));
        const amount = parseFloat((liters * rate).toFixed(2));
        const isPaid = idx % 2 === 0;

        sprintTotalLiters += liters;
        sprintTotalAmount += amount;

        return {
          farmerId: f._id,
          farmerName: f.name,
          farmerMobile: f.mobile || "",
          farmerEmail: f.email || "",
          memberId: f.memberId || `M-${100 + idx}`,
          totalEntries: 18 + idx * 2,
          totalLiters: liters,
          totalAmount: amount,
          paidAmount: isPaid ? amount : 0,
          unpaidAmount: isPaid ? 0 : amount,
          avgFat: fat,
          avgSnf: snf,
          hasCollection: true,
          emailStatus: f.email ? "sent" : "no_email",
          emailError: "",
        };
      });

      await SprintBillingModel.create({
        adminId,
        sprintName: sprintInfo.sprintName,
        cycleDays: sprintInfo.cycleDays,
        startDate: sprintInfo.startDate,
        endDate: sprintInfo.endDate,
        status: "completed",
        totalFarmers: farmers.length,
        activeFarmers: activeCount,
        zeroCollectionFarmers: zeroCount,
        totalLiters: parseFloat(sprintTotalLiters.toFixed(2)),
        totalAmount: parseFloat(sprintTotalAmount.toFixed(2)),
        avgFat: 4.3,
        avgSnf: 8.5,
        emailsSent: activeCount + (zeroCount > 0 ? zeroCount : 0),
        emailsFailed: 0,
        farmerSummaries,
        createdAt: sprintInfo.createdAt,
        processedAt: sprintInfo.createdAt,
      });

      console.log(`✓ Seeded ${sprintInfo.sprintName} for admin ${admin.name}: ${sprintTotalLiters.toFixed(1)} L, ₹${sprintTotalAmount.toFixed(2)}`);
    }
  }

  await mongoose.connection.close();
  console.log("Seeding complete. Connection closed.");
  process.exit(0);
}

seedHistory().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});
