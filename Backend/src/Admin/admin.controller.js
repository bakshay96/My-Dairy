const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { AdminModel } = require("./admin.model");
const { transporter } = require("../connection/mailConnection");

require("dotenv").config();

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

    const payload = { id: admin.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRY || "12h",
    });

    return res.sendSuccess({
      token,
      admin: {
        name: admin.name,
        email: admin.email,
        mobile: admin.mobile,
        id: admin.id,
        shopName: admin.shopName,
      },
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

    const passwordMatch = await bcrypt.compare(password, admin.password);
    if (!passwordMatch) {
      return res.sendError("Invalid mobile or password", 401);
    }

    const payload = { id: admin.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRY || "6h",
    });

    return res.sendSuccess({
      token,
      admin: {
        name: admin.name,
        mobile: admin.mobile,
        email: admin.email,
        shopName: admin.shopName,
        id: admin.id,
      },
    }, "Login successful");
  } catch (error) {
    return res.sendError(error.message, 500);
  }
};

// ─── Get Current User ─────────────────────────────────────────────────────────
const getCurrentUser = async (req, res) => {
  try {
    return res.sendSuccess({ admin: req.admin }, "User fetched successfully");
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
    res.clearCookie("token", { httpOnly: true });
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

module.exports = {
  adminRegistration,
  adminLogin,
  message,
  getCurrentUser,
  updateAdminProfile,
  logoutUser,
  registerAdmin,
};
