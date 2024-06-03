const { transporter } = require("../connection/mailConnection");
const nodemailer=require("nodemailer");
const { x } = require("./milkReport");
require("dotenv").config();

const sendMail= (req, res,next) => {
    // Extract user data from the request body
   // console.log("data",req.milkdata);
    const {snf,fat,litter,shift,date,mobile,category,water,degree}=req.milkdata._doc;
    const {email,name}=req.milkdata
    

    //Compose the email content
    const mailOptions = {
      from: process.env.SMTP_EAMIL, // Replace with your email
      to: `${email}` , // Replace with the recipient's email
      subject: 'Milk Report Receipt, Team Milkify (Automated - No Replies) sent you a message ',
      //text:`hello ${name}\nMilk Report:\nDate: ${date}\nShift: ${shift}\nCategory: ${category} \nFat: ${fat}\nSNF: ${snf}\nDegree: ${degree}\nWater: ${water}\nTotal: ${litter} Litter`,
      html:`<!DOCTYPE html5>
      <html>
      <head>
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
            padding: 10px;
            text-align: center;
          }
          .content {
            padding: 20px;
          }
          .content h1 {
            font-size: 24px;
          }
          .content p {
            font-size: 16px;
          }
          .table {
            width: 100%;
            margin-top: 20px;
            border-collapse: collapse;
          }
          .table th, .table td {
            border: 1px solid #dddddd;
            text-align: left;
            padding: 8px;
          }
          .table th {
            background-color: #f2f2f2;
          }
          .footer {
            background-color: #f2f2f2;
            text-align: center;
            padding: 10px;
            font-size: 12px;
            color:"black";
            display:flex;
            flex-direction:column;
            gap:20px;
            
          }
          .thank-you{
            color:"blue";
            font-size:12px;
            
          }
          
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Milk Report Receipt</h1>
          </div>
          <div class="content">
            <p>Hello <b>${name} ,</b></p>
             <p>Thank you for your submission. Here is your today milk report:</p>
            <table class="table">
              <tr>
                <th>Date</th>
                <td>${date}</td>
              </tr>
              <tr>
                <th>Shift</th>
                <td>${shift}</td>
              </tr>
              <tr>
                <th>Category</th>
                <td>${category}</td>
              </tr>
              <tr>
                <th>Fat</th>
                <td>${fat}</td>
              </tr>
              <tr>
                <th>SNF</th>
                <td>${snf}</td>
              </tr>
              <tr>
                <th>Degree</th>
                <td>${degree}</td>
              </tr>
              <tr>
                <th>Water</th>
                <td>${water}</td>
              </tr>
              <tr>
                <th>Total</th>
                <td>${litter} Liters</td>
              </tr>
            </table>
          </div>
          <div class="footer">
            <p class="thank-you">Thank you for using Milkify!</p>
            <p>&copy; 2024 Milkify. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
      `
    };
  
    // Send the email
   transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).send(error.toString());
      }
      else
      {

         // res.status(200).send(`Data submitted successfully! Email sent. ${info.response}`);
          next();
      }
    });
           
  };

  module.exports={
    sendMail
  }