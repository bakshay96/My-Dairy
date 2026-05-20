const { transporter } = require("../connection/mailConnection");
require("dotenv").config();
const path = require("path");
const fs = require("fs");

// ── Resolve brand logo path for CID attachment ────────────────────────────────
const logoPath = path.resolve(__dirname, "../../public/images/milkify-logo.png");
const hasLogo = fs.existsSync(logoPath);

const sendMail = (req, res, next) => {
  const milkdata = req.milkdata;
  if (!milkdata) {
    console.log("[Mail] No milk data, skipping email.");
    return next();
  }

  const {
    snf = 0, fat = 0, litter = 0, shift = "morning", date = new Date().toLocaleDateString("en-IN"),
    mobile = "", category = "cow", water = 0, degree = 0, calculatedAmount = 0, rate = 0,
  } = milkdata;
  const { email = "", name = "Farmer" } = milkdata;

  if (!email || !email.includes("@")) {
    console.log(`[Mail] No valid email for ${name}, skipping.`);
    return next();
  }

  const shiftLabel = shift === "morning" ? "☀️ Morning" : "🌙 Evening";
  const catLabel = category.charAt(0).toUpperCase() + category.slice(1);
  const amountFmt = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(calculatedAmount);
  const rateFmt = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(rate);

  // ── Logo: use CID inline if file exists, else a text fallback ────────────
  const logoHtml = hasLogo
    ? `<img src="https://milkify.netlify.app/_next/static/media/milkify-logo.0463dbb4.png" alt="Milkify" width="44" height="44" style="display:block;border-radius:10px;object-fit:contain;" />`
    : `<div style="width:44px;height:44px;border-radius:10px;background:#0d4f2f;display:flex;align-items:center;justify-content:center;font-size:22px;">🥛</div>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Milk Collection Receipt – Milkify</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#f1f5f9;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;background:#f1f5f9;">
  <tr><td align="center">
  <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

    <!-- Header -->
    <tr>
      <td style="background:linear-gradient(135deg,#0d4f2f 0%,#1a3a5c 100%);padding:28px 32px;text-align:center;">
        <!-- Brand Logo -->
        <div style="margin-bottom:14px;display:inline-block;padding:8px;background:rgba(255,255,255,0.15);border-radius:14px;">
          ${logoHtml}
        </div>
        <h1 style="margin:0;color:#ffffff;font-size:21px;font-weight:900;letter-spacing:1.2px;line-height:1.2;">
          MILK COLLECTION RECEIPT
        </h1>
        <p style="margin:6px 0 0;color:rgba(255,255,255,0.65);font-size:11px;letter-spacing:2.5px;text-transform:uppercase;">
          Milkify — Uplifting Dairy Digitally
        </p>
      </td>
    </tr>

    <!-- Greeting -->
    <tr>
      <td style="padding:28px 32px 0;">
        <p style="margin:0;font-size:15px;color:#1e293b;">Dear <strong>${name}</strong>,</p>
        <p style="margin:8px 0 0;font-size:13px;color:#64748b;line-height:1.6;">
          Your milk collection has been <strong style="color:#16a34a;">successfully recorded</strong>. Here is your collection summary:
        </p>
      </td>
    </tr>

    <!-- Stats Cards -->
    <tr>
      <td style="padding:20px 32px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:33%;padding-right:6px;">
              <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px;text-align:center;">
                <p style="margin:0;font-size:9px;font-weight:700;color:#16a34a;letter-spacing:1px;text-transform:uppercase;">Volume</p>
                <p style="margin:5px 0 0;font-size:22px;font-weight:900;color:#14532d;">${litter}<span style="font-size:12px;font-weight:500;"> L</span></p>
              </div>
            </td>
            <td style="width:33%;padding:0 3px;">
              <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:14px;text-align:center;">
                <p style="margin:0;font-size:9px;font-weight:700;color:#ea580c;letter-spacing:1px;text-transform:uppercase;">FAT / SNF</p>
                <p style="margin:5px 0 0;font-size:18px;font-weight:900;color:#7c2d12;">${fat}<span style="font-size:11px;">%</span> / ${snf}</p>
              </div>
            </td>
            <td style="width:33%;padding-left:6px;">
              <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:14px;text-align:center;">
                <p style="margin:0;font-size:9px;font-weight:700;color:#0284c7;letter-spacing:1px;text-transform:uppercase;">Amount</p>
                <p style="margin:5px 0 0;font-size:18px;font-weight:900;color:#0c4a6e;">${amountFmt}</p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Details Table -->
    <tr>
      <td style="padding:0 32px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
          <tr style="background:#f8fafc;">
            <td colspan="2" style="padding:10px 16px;font-size:11px;font-weight:700;color:#475569;letter-spacing:1px;text-transform:uppercase;">Collection Details</td>
          </tr>
          ${[
      ["📅 Date & Time", date],
      ["⏰ Shift", shiftLabel],
      ["🐄 Category", catLabel],
      ["💧 Water", `${water}%`],
      ["🌡️ Degree", `${degree}°`],
      ["💰 Rate / Ltr", rateFmt],
      ["🥛 Volume", `${litter} L`],
    ].map(([label, value], i) => `
          <tr style="background:${i % 2 === 0 ? "#fff" : "#f8fafc"};">
            <td style="padding:10px 16px;font-size:13px;color:#64748b;border-top:1px solid #f1f5f9;">${label}</td>
            <td style="padding:10px 16px;font-size:13px;font-weight:600;color:#1e293b;text-align:right;border-top:1px solid #f1f5f9;">${value}</td>
          </tr>`).join("")}
          <tr style="background:#0d4f2f;">
            <td style="padding:12px 16px;font-size:14px;font-weight:700;color:#fff;">Net Amount Credited</td>
            <td style="padding:12px 16px;font-size:16px;font-weight:900;color:#86efac;text-align:right;">${amountFmt}</td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 32px;text-align:center;">
        <p style="margin:0;font-size:12px;color:#94a3b8;">Thank you for your quality milk supply! 🙏</p>
        <p style="margin:8px 0 0;font-size:11px;color:#cbd5e1;">
          Powered by <strong style="color:#1a3a5c;">Milkify</strong> &middot; <em>Uplifting Dairy Digitally</em>
        </p>
      </td>
    </tr>

  </table>
  </td></tr>
</table>
</body>
</html>`;

  // ── Build mail options ────────────────────────────────────────────────────
  const mailOptions = {
    from: `"Milkify Dairy" <${process.env.SMTP_EMAIL}>`,
    to: email,
    subject: `📄 Milk Receipt: ${litter}L · ${amountFmt} | ${date}`,
    html,
    text: `Hello ${name},\nYour milk collection has been recorded.\n\nDate: ${date}\nShift: ${shift}\nCategory: ${category}\nVolume: ${litter} L\nFAT: ${fat}% | SNF: ${snf}\nAmount: ${amountFmt}\n\nThank you!\nMilkify – Uplifting Dairy Digitally`,
  };

  // Attach logo as CID inline attachment if available
  if (hasLogo) {
    mailOptions.attachments = [{
      filename: "milkify-logo.png",
      path: logoPath,
      cid: "milkify_logo",
      contentDisposition: "inline",
    }];
  }

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) console.error("[Mail] Email error:", error.message);
    else console.log(`[Mail] Sent to ${email}:`, info.response);
    next();
  });
};

const sendGenericMail = async ({ to, subject, html, text }) => {
  if (!to || !to.includes("@")) return;
  const mailOptions = {
    from: `"Milkify Support" <${process.env.SMTP_EMAIL}>`,
    to,
    subject,
    html,
    text,
  };
  if (hasLogo) {
    mailOptions.attachments = [{
      filename: "milkify-logo.png",
      path: logoPath,
      cid: "milkify-logo",
      contentDisposition: "inline",
    }];
  }
  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("[Mail] Generic email error:", error.message);
        reject(error);
      } else {
        resolve(info);
      }
    });
  });
};

module.exports = { sendMail, sendGenericMail };