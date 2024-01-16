const { transporter } = require("../connection/mailConnection");
const nodemailer=require("nodemailer");
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
      subject: 'Milk Recipt ',
      text:`hello ${name}\nMilk Report:\nDate: ${date}\nShift: ${shift}\nCategory: ${category} \nFat: ${fat}\nSNF: ${snf}\nDegree: ${degree}\nWater: ${water}\nTotal: ${litter} Litter`,
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