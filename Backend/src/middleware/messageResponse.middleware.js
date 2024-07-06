const { transporter } = require("../connection/mailConnection");
const nodemailer = require("nodemailer");
require("dotenv").config();

const messageResponse = (req, res, next) => {
	const { name, email, message } = req.body;

	const mailOptions = {
		from: process.env.SMTP_EAMIL, // Replace with your email
		to: `${email}`, // Replace with the recipient's email
		subject: "Team Milkify (Automated - No Replies) sent you a message ",
		html: `
      <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank You for Contacting Milkify</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f6f6f6;
    }
    .container {
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }
    .header {
      background-color: #4CAF50;
      color: #ffffff;
      padding: 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      padding: 20px;
    }
    .content p {
      font-size: 16px;
      line-height: 1.5;
      margin: 0 0 10px;
    }
    .footer {
      background-color: #f2f2f2;
      text-align: center;
      padding: 10px;
      font-size: 12px;
      color: #888888;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Thank You for Contacting Milkify</h1>
    </div>
    <div class="content">
      <p>Dear <b>${name} </b>,</p>
      <p>Thank you for reaching out to us. We have received your message and will get back to you as soon as possible.</p>
      <p>Best regards,<br/>The Milkify Team</p>
    </div>
    <div class="footer">
      <p>&copy; 2024 Milkify. All rights reserved.</p>
    </div>
  </div>
</body>
</html>

    `,
	};

	// Send the email
	transporter.sendMail(mailOptions, (error, info) => {
		if (error) {
			return res.status(500).send(error.toString());
		} else {
			next();
		}
	});
};

module.exports = {
	messageResponse,
};
