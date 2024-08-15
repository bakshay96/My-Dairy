const express = require("express");
const adminRouter = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { AdminModel } = require("./admin.model");
const { transporter } = require("../connection/mailConnection");
require("dotenv").config();

//admin registration
const adminRegistration = async (req, res) => {
  try {
    // Extract admin registration data from the request body
    const { name, village, shopName, mobile, password } = req.body;
console.log(req.body)
    // Check if an admin with the same email already exists
    const existingAdmin = await AdminModel.findOne({ mobile });
    if (existingAdmin) {
      return res
        .status(409)
        .json({ msg: "Admin with this mobile already exists" });
    } else {
      bcrypt.hash(password, 5, async (error, hash) => {
        try {
          if (error) {
            res.status(500).json({ error: error.message });
          } else {
            const newAdmin = new AdminModel({
              ...req.body,

              password: hash,
              key: password,
            });
            const user = await newAdmin.save();
            console.log("user",user)
            const payload= {id:user._id};
            // Respond with the saved admin
            jwt.sign(
              payload,
              process.env.TOKEN_API_SECRET_KEY,
              { expiresIn: "24h" },
              (err, token) => 
              {
                if (err) throw err;
        
                res
                  .status(201)
                  .json({
                     msg: "Admin Registration Successfully done" ,
                     token,
                     user:{id: user._id,
                     username: user.user,
                     mobile: user.mobile}
                    });
              }
            );
          }
        } catch (error) {
          res.status(500).json({ error: error.message });
        }
      });
    }
  } catch (error) {
    // Handle errors and respond with an error message
    res.status(400).json({ error: error.message });
  }
};

// admin login
const adminLogin = async (req, res) => {
  try {
    // Extract login credentials from the request body
    const { mobile, password } = req.body;

    // Find the admin with the specified email
    const admin = await AdminModel.findOne({ mobile });

    if (!admin) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Compare the provided password with the hashed password in the database
    const passwordMatch = await bcrypt.compare(password, admin.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate a unique token upon successful login
    const token = jwt.sign(
      { userId: admin._id },
      process.env.TOKEN_API_SECRET_KEY,
      { expiresIn: "24h" }
    );

    // Respond with the generated token
    res.status(200).send({ 
      msg: "Loign successfully done",
       token,
       user:{
        username:admin.name,
        mobile:admin.mobile,
        id:admin._id }
      });
  } catch (error) {
    // Handle errors and respond with an error message
    res.status(400).json({ error: error.message });
  }
};


// current user
const getCurrentUser = async (req, res) => {
  console.log(req.body)
	try {
		res.status(201).json({user:req.user ,"msg":"user logged in successfully "});
	} catch (error) {
		res.status(404).send({"msg":error})
}
};

const logoutUser = async (req, res, next) => {
	try {
		res.clearCookie("token", { httpOnly: true });
		// req.session.destroy();
		return res.status(200).json({ message: "Logout successful!" });
	} catch (error) {
		res.status(404).send({"msg":error})
	}
};




const message = async (req, res) => {
  const { name, email, message } = req.body;


 

    mailOptions = {
        from: email, // Replace with your email
        to: "process.env.SMTP_EAMIL", // Replace with the recipient's email
        subject: "Milkify User Message",
        
        html: `
          <html>
            <body>
              <h2>Milkify User Message !</h2>
              <p>Hi my is ${name}</p>
              <p>${message}</p>
              <h3>User Name : <b>${name} </b></h3>
              <p>User Email Id :${email} </p>
              <p>Best regards,<br/>${name}</p>
            </body>
          </html>
        `,
      }
      

      // Send the email
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          return res.status(500).send(error.toString());
        } else {
          res.status(201).send(`Message send successfully! Email sent. ${info.response}`);
          
        }
      });

      
};


module.exports = {
  adminRegistration,
  adminLogin,
  message,
  getCurrentUser,
  logoutUser
  
};
