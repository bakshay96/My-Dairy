const { transporter } = require("../connection/mailConnection");
const nodemailer=require("nodemailer");
require("dotenv").config();

const messageResponse = (req, res,next) => {
  const { name, email, message } = req.body;


  const mailOptions = {
    from: process.env.SMTP_EAMIL, // Replace with your email
    to: `${email}`, // Replace with the recipient's email
    subject: "Team Milkify (Automated - No Replies) sent you a message ",
     html: `
      <html>
        <body>
          <h1>Thank You for Contacting Milkify!</h1>
          <p>Dear ${name},</p>
          <p>Thank you for reaching out to us. We have received your message and will get back to you as soon as possible.</p>
          <p>Best regards,<br/>The Milkify Team</p>
        </body>
      </html>
    `,
  }




  // Send the email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).send(error.toString());
    } else {
      next();
      
    }
  });

  
};

module.exports ={
   messageResponse,
}