const nodemailer = require("nodemailer");
require("dotenv").config();

// ── Gmail SMTP transporter ───────────────────────────────────────────────────
// SMTP_EMAIL = Gmail address (e.g. care.abtech@gmail.com)
// SMTP_PASS  = 16-char App Password from Google Account → Security → App Passwords
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT) || 465,
  secure: parseInt(process.env.SMTP_PORT) === 465 ? true : false,
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false, // allow self-signed certs in dev
  },
  pool: true, // Use pooled connections for better performance
  maxConnections: 3, // Limit simultaneous connections
  maxMessages: 100, // max messages per connection
  connectionTimeout: 10000, // 10s connection timeout
  greetingTimeout: 10000,
  socketTimeout: 15000,
});

module.exports = { transporter };