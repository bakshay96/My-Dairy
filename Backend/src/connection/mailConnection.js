const nodemailer = require('nodemailer');
require("dotenv").config();

// Configure nodemailer with your email service credentials
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure:process.env.SMTP_FLAG,
  service:"gmail",
  auth: {
      user:process.env.SMTP_EMAIL,
      pass:process.env.SMTP_PASS,
  }
  });

  module.exports={
    transporter
  }