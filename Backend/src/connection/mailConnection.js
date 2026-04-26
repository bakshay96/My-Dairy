const nodemailer = require("nodemailer");
require("dotenv").config();

// ── Gmail SMTP transporter ───────────────────────────────────────────────────
// SMTP_EMAIL = Gmail address (e.g. care.abtech@gmail.com)
// SMTP_PASS  = 16-char App Password from Google Account → Security → App Passwords
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,           // STARTTLS on port 587
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false, // allow self-signed certs in dev
  },
});

module.exports = { transporter };