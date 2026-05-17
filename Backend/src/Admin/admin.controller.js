const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { AdminModel } = require("./admin.model");
const { transporter } = require("../connection/mailConnection");
const { farmerModel } = require("../Farmer/farmer.model");

require("dotenv").config();

const setAuthCookie = (res, token) => {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 30 * 60 * 1000, // 30 minutes
  });
};

// ─── Admin Registration (legacy – kept for backward compat) ─────────────────
const adminRegistration = async (req, res) => {
  const { mobile, password } = req.body;
  try {
    const isAdmin = await AdminModel.findOne({ mobile });
    if (isAdmin) {
      return res.status(409).json({ msg: "Admin already exists" });
    }

    bcrypt.hash(password, 10, async (error, hash) => {
      try {
        if (error) {
          return res.status(500).json({ error: error.message });
        }

        const newAdmin = new AdminModel({
          ...req.body,
          password: hash,
          key: password,
        });

        const admin = await newAdmin.save();

        // AUTO-CREATE FARMER ACCOUNT FOR ADMIN
        try {
          const selfFarmer = new farmerModel({
            adminId: admin._id,
            name: admin.name,
            mobile: admin.mobile,
            village: admin.village || "Self",
            gender: admin.gender || "Male",
            email: admin.email || "milkify@gmail.com",
            memberId: "MI-000", // Special ID for owner
            role: "Farmer",
            status: "active"
          });
          await selfFarmer.save();
        } catch (err) {
          console.error("[Auth] Auto-farmer creation failed:", err.message);
          // Don't fail the whole registration if this fails
        }

        const payload = { id: admin.id };

        jwt.sign(
          payload,
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRY || "12h" },
          (err, token) => {
            if (err) throw err;
            res.status(201).json({
              msg: "Admin Registration Successfully done",
              token,
              user: {
                id: admin._id,
                name: admin.name,
                mobile: admin.mobile,
              },
            });
          }
        );
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ─── Register Admin ──────────────────────────────────────────────────────────
const registerAdmin = async (req, res) => {
  const { mobile, password, email } = req.body;
  try {
    if (!email) {
      return res.sendError("Email is required for communication", 400);
    }
    let admin = await AdminModel.findOne({ mobile });
    if (admin) {
      return res.sendError("Admin already exists", 409);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    admin = new AdminModel({ ...req.body, key: password, password: hashedPassword });
    await admin.save();

    // AUTO-CREATE FARMER ACCOUNT FOR ADMIN
    try {
      const selfFarmer = new farmerModel({
        adminId: admin._id,
        name: admin.name,
        mobile: admin.mobile,
        village: admin.village || "Self",
        gender: admin.gender || "Male",
        email: admin.email || "milkify@gmail.com",
        memberId: "MI-000",
        role: "Farmer",
        status: "active"
      });
      await selfFarmer.save();
    } catch (err) {
      console.error("[Auth] Auto-farmer creation failed:", err.message);
    }

    const payload = { id: admin.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "30m",
    });
    setAuthCookie(res, token);

    return res.sendSuccess({
      admin: {
        name: admin.name,
        email: admin.email,
        mobile: admin.mobile,
        id: admin.id,
        shopName: admin.shopName,
      },
      sessionExpiresAt: Date.now() + 30 * 60 * 1000,
    }, "Registration successful", 201);
  } catch (error) {
    return res.sendError(error.message, 500);
  }
};

// ─── Admin Login ─────────────────────────────────────────────────────────────
const adminLogin = async (req, res) => {
  try {
    const { mobile, password } = req.body;

    const admin = await AdminModel.findOne({ mobile });
    if (!admin) {
      return res.sendError("Invalid credentials", 401);
    }

    let passwordMatch = false;
    if (admin.password && typeof admin.password === "string" && admin.password.startsWith("$2")) {
      passwordMatch = await bcrypt.compare(password, admin.password);
    } else if (admin.password) {
      passwordMatch = admin.password === password;
    }
    if (!passwordMatch && admin.key) {
      passwordMatch = admin.key === password;
    }
    if (!passwordMatch) {
      return res.sendError("Invalid mobile or password", 401);
    }

    // Migrate legacy plaintext password to bcrypt hash on successful login
    if (!admin.password || !String(admin.password).startsWith("$2")) {
      const salt = await bcrypt.genSalt(10);
      admin.password = await bcrypt.hash(password, salt);
      await admin.save();
    }

    const payload = { id: admin.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "30m",
    });
    setAuthCookie(res, token);

    return res.sendSuccess({
      admin: {
        name: admin.name,
        mobile: admin.mobile,
        email: admin.email,
        shopName: admin.shopName,
        id: admin.id,
      },
      sessionExpiresAt: Date.now() + 30 * 60 * 1000,
    }, "Login successful");
  } catch (error) {
    return res.sendError(error.message, 500);
  }
};

// ─── Get Current User ─────────────────────────────────────────────────────────
const getCurrentUser = async (req, res) => {
  try {
    return res.sendSuccess(
      { admin: req.admin, sessionExpiresAt: req.tokenExp || Date.now() + 30 * 60 * 1000 },
      "User fetched successfully"
    );
  } catch (error) {
    return res.sendError(error.message, 500);
  }
};

// ─── Update Admin Profile ──────────────────────────────────────────────────────
const updateAdminProfile = async (req, res) => {
  try {
    const allowedFields = ["name", "email", "mobile", "shopName", "village", "gender"];
    const updateData = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    });

    if (Object.keys(updateData).length === 0) {
      return res.sendError("No valid fields to update", 400);
    }

    const admin = await AdminModel.findByIdAndUpdate(req.admin.id, { $set: updateData }, { new: true }).select("-password");
    return res.sendSuccess({ admin }, "Profile updated successfully");
  } catch (error) {
    return res.sendError(error.message, 500);
  }
};

// ─── Logout ───────────────────────────────────────────────────────────────────
const logoutUser = async (req, res) => {
  try {
    const isProd = process.env.NODE_ENV === "production";
    res.clearCookie("token", {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
    });
    return res.sendSuccess(null, "Logout successful!");
  } catch (error) {
    return res.sendError(error.message, 500);
  }
};

// ─── Contact Message ──────────────────────────────────────────────────────────
const message = async (req, res) => {
  const { name, email, message: userMessage } = req.body;

  if (!name || !email || !userMessage) {
    return res.status(400).json({ error: "Name, email, and message are required" });
  }

  const mailOptions = {
    from: process.env.SMTP_EMAIL,
    to: process.env.SMTP_EMAIL,
    replyTo: email,
    subject: `Milkify Contact: Message from ${name}`,
    html: `
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #2563eb;">Milkify — New Contact Message</h2>
          <p><strong>From:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <hr/>
          <p><strong>Message:</strong></p>
          <p>${userMessage}</p>
        </body>
      </html>
    `,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).json({ error: error.toString() });
    }
    res.status(200).json({ message: "Message sent successfully!", info: info.response });
  });
};

// ─── Forgot Password ──────────────────────────────────────────────────────────
const adminForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (typeof email !== "string") {
      return res.status(400).json({ success: false, message: "Valid email is required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      return res.status(400).json({ success: false, message: "Valid email is required" });
    }

    const admin = await AdminModel.findOne({ email: { $eq: normalizedEmail } });
    if (!admin) return res.status(404).json({ success: false, message: "Email not found" });

    const newPassword = Math.random().toString(36).slice(-8);
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPassword, salt);
    admin.key = newPassword; // Store it for legacy support/debugging if needed
    await admin.save();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your New Password - Milkify Admin",
      text: `Hello ${admin.name},\n\nYour new temporary password is: ${newPassword}\n\nPlease log in and change it from the settings page.`
    };

    await transporter.sendMail(mailOptions);
    return res.status(200).json({ success: true, message: "New password sent to your email" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const changeAdminPassword = async (req, res) => {
  try {
    const oldPassword = req.body.oldPassword?.trim();
    const newPassword = req.body.newPassword?.trim();

    if (!oldPassword || !newPassword) {
      return res.sendError("Old password and new password are required", 400);
    }

    if (oldPassword === newPassword) {
      return res.sendError("New password cannot be the same as the old password", 400);
    }
    
    const admin = await AdminModel.findById(req.admin.id);
    if (!admin) return res.sendError("Admin not found", 404);

    let passwordMatch = false;
    if (admin.password && typeof admin.password === "string" && admin.password.startsWith("$2")) {
      passwordMatch = await bcrypt.compare(oldPassword, admin.password);
    } else if (admin.password) {
      passwordMatch = admin.password === oldPassword;
    }
    if (!passwordMatch && admin.key) {
      passwordMatch = admin.key === oldPassword;
    }
    if (!passwordMatch) {
      return res.sendError("Incorrect old password", 401);
    }

    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPassword, salt);
    admin.key = newPassword;
    await admin.save();

    // Send security notification email immediately
    const senderEmail = process.env.SMTP_EMAIL || process.env.EMAIL_USER || "care.abtech@gmail.com";
    if (admin.email) {
      const mailOptions = {
        from: senderEmail,
        to: admin.email,
        subject: "Security Notification: Password Changed - Milkify",
        html: `
          <html>
            <body style="font-family: Arial, sans-serif; padding: 20px; color: #333; background-color: #f8fafc;">
              <div style="max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); background-color: #ffffff;">
                <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
                  <h2 style="margin: 0; font-size: 24px;">Security Alert</h2>
                </div>
                <div style="padding: 24px; line-height: 1.6;">
                  <p>Hello <strong>${admin.name}</strong>,</p>
                  <p>This is a security notification confirming that your account password for <strong>Milkify</strong> was updated successfully on <strong>${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</strong>.</p>
                  <p>If you did initiate this change, no further action is required.</p>
                  <div style="background-color: #f8fafc; border-left: 4px solid #ef4444; padding: 12px; margin: 20px 0; border-radius: 4px;">
                    <p style="margin: 0; font-size: 14px; color: #ef4444; font-weight: bold;">If you did not request this password change:</p>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #475569;">Please contact our support team immediately or request a password recovery from the login page to secure your account.</p>
                  </div>
                  <p>Best regards,<br/><strong>Team Milkify Security</strong></p>
                </div>
                <div style="background-color: #f1f5f9; text-align: center; padding: 12px; font-size: 12px; color: #64748b;">
                  This is an automated notification. Please do not reply to this email.
                </div>
              </div>
            </body>
          </html>
        `
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`[Security] Password change notification email sent to ${admin.email}`);
      } catch (emailErr) {
        console.error("[Security] Failed to send password change notification email:", emailErr.message);
      }
    }

    return res.sendSuccess(null, "Password changed successfully");
  } catch (error) {
    return res.sendError(error.message, 500);
  }
};

// ─── OTP Schema & Model ───────────────────────────────────────────────────────
const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 10 * 60 * 1000), index: { expires: 0 } }
});
const OtpModel = mongoose.models.Otp || mongoose.model("Otp", otpSchema);

// ─── Send Email OTP ───────────────────────────────────────────────────────────
const sendEmailOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Overwrite previous OTPs for this email
    await OtpModel.findOneAndDelete({ email });
    const newOtp = new OtpModel({ email, otp });
    await newOtp.save();

    const senderEmail = process.env.SMTP_EMAIL || process.env.EMAIL_USER || "care.abtech@gmail.com";
    const mailOptions = {
      from: senderEmail,
      to: email,
      subject: "Verification Code: Register Admin - Milkify",
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px; color: #333; background-color: #f8fafc;">
            <div style="max-width: 550px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); background-color: #ffffff;">
              <div style="background-color: #2563eb; color: white; padding: 24px; text-align: center;">
                <h2 style="margin: 0; font-size: 22px;">Email Verification</h2>
              </div>
              <div style="padding: 24px; line-height: 1.6;">
                <p>Hello,</p>
                <p>Thank you for choosing <strong>Milkify</strong>. To complete your administrator registration, please use the secure One-Time Password (OTP) verification code below:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <span style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #2563eb; background-color: #eff6ff; padding: 12px 30px; border-radius: 8px; border: 1px dashed #bfdbfe;">
                    ${otp}
                  </span>
                </div>
                <p style="font-size: 13px; color: #64748b;">This verification code is secure and valid for <strong>10 minutes</strong>. Please do not share this OTP with anyone.</p>
                <p>Best regards,<br/><strong>Team Milkify Support</strong></p>
              </div>
              <div style="background-color: #f1f5f9; text-align: center; padding: 12px; font-size: 11px; color: #94a3b8;">
                If you did not request this code, you can safely ignore this email.
              </div>
            </div>
          </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`[OTP] Email verification OTP sent successfully to ${email}`);
    return res.status(200).json({ success: true, message: "Verification code sent to your email" });
  } catch (error) {
    console.error("[OTP] Failed to send email verification OTP:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Verify Email OTP ────────────────────────────────────────────────────────
const verifyEmailOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP code are required" });
    }

    const record = await OtpModel.findOne({ email });
    if (!record) {
      return res.status(400).json({ success: false, message: "OTP has expired or email is invalid. Please request a new code." });
    }

    if (record.otp !== otp.trim()) {
      return res.status(400).json({ success: false, message: "Invalid OTP code. Please check and try again." });
    }

    await OtpModel.deleteOne({ _id: record._id });
    return res.status(200).json({ success: true, message: "Email successfully verified!" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  adminRegistration,
  adminLogin,
  message,
  getCurrentUser,
  updateAdminProfile,
  logoutUser,
  registerAdmin,
  adminForgotPassword,
  changeAdminPassword,
  sendEmailOtp,
  verifyEmailOtp,
};
