require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const { AdminModel } = require("../src/Admin/admin.model");
const { MasterAdminModel } = require("../src/MasterAdmin/masterAdmin.model");
const { AdvertisementModel } = require("../src/MasterAdmin/advertisement.model");
const { transporter } = require("../src/connection/mailConnection");

const { connection } = require("../src/connection/db");

async function broadcastFeatureUpdate() {
  await connection;

  // 1. Find or pick Master Admin
  let masterAdmin = await MasterAdminModel.findOne({ isActive: true }).lean();
  if (!masterAdmin) {
    masterAdmin = await MasterAdminModel.findOne().lean();
  }

  const masterAdminId = masterAdmin ? masterAdmin._id : new mongoose.Types.ObjectId();
  const masterSenderName = masterAdmin ? `${masterAdmin.firstName} ${masterAdmin.lastName}` : "Master Administrator";

  console.log(`[Announcement] Using Master Admin identity: ${masterSenderName} (${masterAdminId})`);

  // 2. Create in-app system Announcement in AdvertisementModel
  const announcementTitle = "🚀 New Feature Rollout: Flexible Sprint Billing & Detailed Settlement Ledger";
  const announcementMessage = 
`Dear Dairy Admin,

We have rolled out major enhancements to the Billing Hub:
1. Flexible Sprint Billing: Configure 10-day, 15-day, or custom billing cycles with automated sprint progression.
2. Active Sprint Protection: Current sprint payments are protected with automatic settlement locking until the duration concludes.
3. Cow vs. Buffalo Milk Breakdown: View distinct volume, average rates, and payable totals directly on cards and receipts.
4. Cash Clearance Desk: Inspect itemized daily shift entries before clearing cash payments.
5. Interactive Month & Sprint Selectors: Access historical archives with color-coded filters.

How to use:
- Navigate to Dashboard -> Billing Hub.
- Review your active sprint on the live progress bar.
- Once a sprint cycle completes, click 'Settle Payment' to disburse cash or online payouts with itemized ledger verification.`;

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days active

  const announcement = await AdvertisementModel.create({
    createdBy: masterAdminId,
    title: announcementTitle,
    message: announcementMessage,
    ctaLabel: "Open Billing Hub",
    ctaUrl: "/dashboard/billing",
    type: "update",
    targetAdmins: [], // Broadcast to ALL admins
    visibleFrom: new Date(),
    expiresAt,
    visibleDurationHours: 720,
    priority: 10,
    isActive: true,
  });

  console.log(`[Announcement] In-app announcement created successfully with ID: ${announcement._id}`);

  // 3. Fetch all Admin users
  const admins = await AdminModel.find({ Status: "Active" }).lean();
  console.log(`[Announcement] Found ${admins.length} active admin users to notify.`);

  const senderEmail = process.env.SMTP_EMAIL || process.env.EMAIL_USER || "care.abtech@gmail.com";
  let emailsSent = 0;
  let emailsFailed = 0;

  for (const admin of admins) {
    const targetEmail = admin.email;
    if (!targetEmail || targetEmail === "milkify@gmail.com") {
      console.log(`[Announcement] Skipping placeholder email for admin ${admin.name} (${admin.mobile})`);
      continue;
    }

    const emailSubject = "📢 New Feature Guide: Flexible Sprint Billing & Settlement Ledger Rollout";
    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #581c87 0%, #312e81 100%); padding: 32px 24px; color: #ffffff; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">🥛 Milkify Dairy Systems</h1>
          <p style="margin: 8px 0 0 0; font-size: 14px; color: #e9d5ff; font-weight: 500;">Master Admin Official Communication & Feature Update</p>
        </div>

        <!-- Body -->
        <div style="padding: 32px 24px; color: #1e293b; line-height: 1.6;">
          <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 0;">
            Hello ${admin.name} (${admin.shopName || "Dairy Admin"}),
          </h2>
          <p style="font-size: 14px; color: #475569;">
            We are pleased to introduce powerful updates to your <strong>Billing Hub</strong> and <strong>Cooperative Settlement Ledger</strong>, engineered to give you complete financial accuracy and automated cycle management.
          </p>

          <!-- Highlights Grid -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <h3 style="font-size: 15px; font-weight: 800; color: #6b21a8; margin: 0 0 14px 0; text-transform: uppercase; letter-spacing: 0.5px;">
              🌟 What's New in This Release:
            </h3>

            <div style="margin-bottom: 12px;">
              <strong style="color: #0f172a;">1. 📅 Flexible Sprint Billing:</strong>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #64748b;">
                Admins can now select Standard 10-day, 15-day, or custom billing durations. Active sprints automatically calculate shift collections.
              </p>
            </div>

            <div style="margin-bottom: 12px;">
              <strong style="color: #0f172a;">2. 🔒 Sprint Settlement Protection:</strong>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #64748b;">
                Settlement actions are safely locked while a sprint is actively running. Once the sprint end date concludes, settlements automatically unlock for one-click clearance.
              </p>
            </div>

            <div style="margin-bottom: 12px;">
              <strong style="color: #0f172a;">3. 🐄 Cow & 🐃 Buffalo Milk Breakdown:</strong>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #64748b;">
                Every farmer card and settlement slip now itemizes cow milk (liters, rate, total) and buffalo milk (liters, rate, total) separately for transparent cooperative audits.
              </p>
            </div>

            <div style="margin-bottom: 12px;">
              <strong style="color: #0f172a;">4. 💵 Cash Clearance Desk with Shift Ledger:</strong>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #64748b;">
                Inspect every daily shift collection (Morning/Evening, FAT%, SNF%, Rate) right inside the clearance modal before handing out cash or printing vouchers.
              </p>
            </div>

            <div>
              <strong style="color: #0f172a;">5. 🗄️ Historical Sprints & Month Selectors:</strong>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #64748b;">
                Switch between historical months and past sprint archives effortlessly with animated color-coded selectors.
              </p>
            </div>
          </div>

          <!-- Step-by-Step User Guide -->
          <div style="border-left: 4px solid #9333ea; padding-left: 16px; margin: 24px 0;">
            <h3 style="font-size: 15px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0;">
              📖 How to Use Your New Billing Hub:
            </h3>
            <ol style="margin: 0; padding-left: 20px; font-size: 13px; color: #475569; line-height: 1.8;">
              <li>Log in to your <strong>Admin Dashboard</strong> and navigate to <strong>Billing Hub</strong>.</li>
              <li>View your live <strong>Active Billing Sprint</strong> banner showing elapsed days and progress.</li>
              <li>Inspect any farmer's card to review their itemized cow and buffalo milk collections.</li>
              <li>Once the sprint completes, click <strong>Settle Payment</strong> to open the <strong>Cash Clearance Desk</strong>, review daily shifts, enter voucher notes, and disburse payments.</li>
              <li>Download 80mm thermal slips or full CSV summaries anytime from the header toolbar.</li>
            </ol>
          </div>

          <!-- Action Button -->
          <div style="text-align: center; margin: 32px 0;">
            <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard/billing" style="display: inline-block; background: #7e22ce; color: #ffffff; text-decoration: none; padding: 12px 32px; font-size: 14px; font-weight: 800; border-radius: 12px; box-shadow: 0 4px 12px rgba(126, 34, 206, 0.3);">
              Explore New Billing Hub →
            </a>
          </div>

          <p style="font-size: 13px; color: #64748b; margin-bottom: 0;">
            If you need any support or have questions, reach out to your Master Admin team via the Support Ticket Desk.
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #f1f5f9; padding: 16px 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
          Sent by Master Administration • Milkify Dairy Cooperative Systems • © 2026 Milkify
        </div>

      </div>
    `;

    try {
      await transporter.sendMail({
        from: senderEmail,
        to: targetEmail,
        subject: emailSubject,
        html: emailHtml,
      });
      console.log(`[Announcement] Notification email sent successfully to ${admin.name} (${targetEmail})`);
      emailsSent++;
    } catch (err) {
      console.error(`[Announcement] Failed to send email to ${targetEmail}:`, err.message);
      emailsFailed++;
    }
  }

  console.log(`\n========================================`);
  console.log(`[Announcement] Broadcast Summary:`);
  console.log(`- In-app System Announcement: Published (ID: ${announcement._id})`);
  console.log(`- Total Admins Evaluated: ${admins.length}`);
  console.log(`- Emails Sent: ${emailsSent}`);
  console.log(`- Emails Skipped / Failed: ${emailsFailed}`);
  console.log(`========================================\n`);

  await mongoose.disconnect();
}

broadcastFeatureUpdate().catch((err) => {
  console.error("[Announcement] Fatal error:", err);
  process.exit(1);
});
