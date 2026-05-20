const nodemailer = require("nodemailer");
require("dotenv").config();

// ── Gmail SMTP transporter ───────────────────────────────────────────────────

const smtpUser = process.env.SMTP_EMAIL;
const smtpPass = (process.env.SMTP_PASS || "").replace(/\s/g, "");
const smtpPort = parseInt(process.env.SMTP_PORT);

if (!smtpUser || !smtpPass) {
  console.warn("[Mail] ⚠ SMTP_EMAIL or SMTP_PASS is not set — email service will be disabled.");
} else {
  console.log(`[Mail] ✓ SMTP configured → ${smtpUser} via port ${smtpPort} (pass length: ${smtpPass.length})`);
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: smtpPort,
  secure: true,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
  tls: {
    rejectUnauthorized: false, // allow self-signed certs in dev
  },
  pool: true,                 // reuse connections — avoids repeated handshake overhead
  maxConnections: 4,  
  maxMessages: 100,
  connectionTimeout: 30000,   // 10s to establish TCP connection
  greetingTimeout: 30000,     // 10s for server greeting
  socketTimeout: 30000,       // 15s idle socket timeout
});

module.exports = { transporter };
