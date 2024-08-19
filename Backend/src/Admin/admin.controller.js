const express = require("express");
const adminRouter = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { AdminModel } = require("./admin.model");
const { transporter } = require("../connection/mailConnection");
require("dotenv").config();

//admin registration
const adminRegistration = async (req, res) => {
	const { name, village, shopName, mobile, password } = req.body;
  try {

    // Extract admin registration data from the request body
    //console.log(req.body)
    // Check if an admin with the same email already exists
    const isAdmin = await AdminModel.findOne({ mobile });
    if (isAdmin) {
      return res
        .status(400)
        .json({ msg: "Admin  already exists" });
    } 
	else {
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

            const admin = await newAdmin.save();
            console.log("admin",admin)
            const payload= {id:admin.id};
            console.log("payload",payload)

            // Respond with the saved admin
            jwt.sign(
              payload,
              process.env.TOKEN_API_SECRET_KEY,
              { expiresIn: "12h" },
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



const registerAdmin = async (req, res) => {
  const { name, email, password ,mobile} = req.body;
  try {
      let admin = await AdminModel.findOne({ mobile });
      if (admin) {
          return res.status(200).json({ message: 'Admin already exists' });
      }
      const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);
      admin = new AdminModel({ ...req.body,key:password,password:hashedPassword});
      await admin.save();

      const payload = { id: admin.id };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '12h' });

      res.status(200).json({ message: "Registration successfull", token,admin:{name:admin.name,"email":admin.email,mobile:admin.mobile,id:admin.id}});
  } catch (error) {
     
      res.status(500).json({message:'Server Error',error:error.message});
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
      return res.status(200).json({ error: "Invalid credentials"});
    }

    // Compare the provided password with the hashed password in the database
    const passwordMatch = await bcrypt.compare(password, admin.password);

    if (!passwordMatch) {
      return res.status(200).json({ error: "Invalid email or password" });
    }

    // Generate a unique token upon successful login
    const payload={id:admin.id}
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "6h" }
    );

    // Respond with the generated token
    res.status(200).send({ 
      message: "Loign successfull",
       token,
      admin:{
        name:admin.name,
        mobile:admin.mobile,
        email:admin.email,
        id:admin.id }
      });
  } catch (error) {
    // Handle errors and respond with an error message
    res.status(500).json({ error: error.message });
  }
};


// current user
const getCurrentUser = async (req, res) => {
  console.log("user",req.user)
	try {
		res.status(200).json({admin:req.admin ,"message":"user logged in successfully "});
	} catch (error) {
		res.status(500).send({"message":error.message,error:error.message})
}
};

const logoutUser = async (req, res, next) => {
	try {
		res.clearCookie("token", { httpOnly: true });
		// req.session.destroy();
		return res.status(200).json({ message: "Logout successful!" });
	} catch (error) {
		res.status(500).send({"msg":error})
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
  logoutUser,
  registerAdmin
  
};
