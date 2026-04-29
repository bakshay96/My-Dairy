/**
 * billingEmailTemplate.js
 * Generates a premium HTML email for farmer billing PDF delivery.
 */

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "-";

const formatINR = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(amount);

/**
 * @param {Object} opts
 * @param {string} opts.farmerName
 * @param {string} opts.shopName
 * @param {string} opts.startDate
 * @param {string} opts.endDate
 * @param {number} opts.totalLiters
 * @param {number} opts.avgFat
 * @param {number} opts.avgSnf
 * @param {number} opts.totalAmount
 * @param {number} opts.totalEntries
 */
exports.billingEmailHtml = (opts) => {
  const {
    farmerName = "Valued Farmer",
    shopName   = "Milkify Dairy",
    startDate,
    endDate,
    totalLiters = 0,
    avgFat      = 0,
    avgSnf      = 0,
    totalAmount = 0,
    totalEntries = 0,
  } = opts;

  const avgRate = totalLiters > 0 ? (totalAmount / totalLiters).toFixed(2) : "0.00";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Milk Collection Bill - ${shopName}</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#f1f5f9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e3a5f 0%,#0d4f2f 100%);padding:32px 40px;text-align:center;">
              <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:50%;width:64px;height:64px;line-height:64px;margin-bottom:12px;font-size:28px;">🥛</div>
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:1px;">${shopName.toUpperCase()}</h1>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.75);font-size:12px;letter-spacing:2px;">MILK COLLECTION STATEMENT</p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:32px 40px 0;">
              <p style="margin:0;font-size:16px;color:#1e293b;">Dear <strong>${farmerName}</strong>,</p>
              <p style="margin:8px 0 0;font-size:14px;color:#64748b;line-height:1.6;">
                Please find attached your <strong>Milk Collection Bill</strong> for the billing period
                <strong>${fmtDate(startDate)}</strong> to <strong>${fmtDate(endDate)}</strong>.
                Your premium-quality contribution is greatly valued.
              </p>
            </td>
          </tr>

          <!-- Summary Cards -->
          <tr>
            <td style="padding:24px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:50%;padding-right:8px;">
                    <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:16px;">
                      <p style="margin:0;font-size:10px;color:#0284c7;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Total Volume</p>
                      <p style="margin:4px 0 0;font-size:24px;font-weight:800;color:#0c4a6e;">${Number(totalLiters).toFixed(2)} <span style="font-size:14px;font-weight:500;">Liters</span></p>
                      <p style="margin:4px 0 0;font-size:11px;color:#64748b;">${totalEntries} entries recorded</p>
                    </div>
                  </td>
                  <td style="width:50%;padding-left:8px;">
                    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;">
                      <p style="margin:0;font-size:10px;color:#16a34a;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Net Payable</p>
                      <p style="margin:4px 0 0;font-size:24px;font-weight:800;color:#14532d;">${formatINR(totalAmount)}</p>
                      <p style="margin:4px 0 0;font-size:11px;color:#64748b;">@ ₹${avgRate} / Ltr</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Quality Stats -->
          <tr>
            <td style="padding:0 40px 24px;">
              <div style="background:#fafafa;border:1px solid #e2e8f0;border-radius:12px;padding:16px;">
                <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#475569;letter-spacing:1px;text-transform:uppercase;">Quality Summary</p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="text-align:center;border-right:1px solid #e2e8f0;">
                      <p style="margin:0;font-size:11px;color:#94a3b8;">Average FAT</p>
                      <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#1e293b;">${Number(avgFat).toFixed(2)}<span style="font-size:12px;">%</span></p>
                    </td>
                    <td style="text-align:center;border-right:1px solid #e2e8f0;">
                      <p style="margin:0;font-size:11px;color:#94a3b8;">Average SNF</p>
                      <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#1e293b;">${Number(avgSnf).toFixed(2)}<span style="font-size:12px;">%</span></p>
                    </td>
                    <td style="text-align:center;">
                      <p style="margin:0;font-size:11px;color:#94a3b8;">Avg Rate</p>
                      <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#1e293b;">₹${avgRate}<span style="font-size:12px;">/L</span></p>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Attachment Note -->
          <tr>
            <td style="padding:0 40px 24px;">
              <div style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:4px;padding:12px 16px;">
                <p style="margin:0;font-size:13px;color:#92400e;">
                  📎 The detailed <strong>PDF billing slip</strong> is attached to this email. Please download and keep it for your records.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">This is a system-generated email. Please do not reply.</p>
              <p style="margin:6px 0 0;font-size:11px;color:#cbd5e1;">
                Powered by <strong style="color:#1e3a5f;">Milkify</strong> · Digital Dairy Management
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

exports.billingEmailText = (opts) => {
  const { farmerName, shopName, startDate, endDate, totalLiters, totalAmount } = opts;
  return `Dear ${farmerName},\n\nPlease find attached your Milk Collection Bill from ${shopName} for the period ${fmtDate(startDate)} to ${fmtDate(endDate)}.\n\nTotal Liters: ${Number(totalLiters).toFixed(2)} L\nNet Payable: ${formatINR(totalAmount)}\n\nThank you for your contribution.\n\nRegards,\n${shopName}\nPowered by Milkify`;
};
