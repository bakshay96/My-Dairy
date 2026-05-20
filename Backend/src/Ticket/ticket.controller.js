const { TicketModel }             = require("./ticket.model");
const { MasterAdminModel }        = require("../MasterAdmin/masterAdmin.model");
const { uploadToS3 }              = require("../services/s3.service");
const { emitNewAdvertisement }    = require("../services/socketService");   // reuse socket
const { sendGenericMail }         = require("../middleware/sendMail");

// ── Socket emit helper (reuses existing socketService pattern) ────────────────
const { getIo } = require("../services/socketService");
const emitTicket = (event, payload) => {
  const io = getIo();
  if (!io) return;
  // Emit to master room (all master connections) + the specific admin room
  io.to("master_room").emit(event, payload);
  if (payload.ticket?.adminId) {
    const adminId = typeof payload.ticket.adminId === "object"
      ? payload.ticket.adminId._id || payload.ticket.adminId
      : payload.ticket.adminId;
    io.to(`admin:${adminId}`).emit(event, payload);
  }
};

// ── Auto-acknowledgment email ─────────────────────────────────────────────────
async function sendAckEmail(admin, ticket, assignedName) {
  try {
    await sendGenericMail({
      to:      admin.email,
      subject: `[${ticket.ticketId}] Support Ticket Received – Milkify`,
      html: `
        <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;padding:24px;background:#fff;border-radius:12px;border:1px solid #e5e7eb">
          <img src="cid:milkify-logo" alt="Milkify" style="height:40px;margin-bottom:20px"/>
          <h2 style="color:#1e293b;font-size:20px;margin:0 0 8px">Hi ${admin.name || "there"}, we've got your ticket! 👋</h2>
          <p style="color:#475569;margin:0 0 16px">Your support request has been received and assigned ticket ID:</p>
          <div style="background:#f1f5f9;border-radius:8px;padding:12px 16px;margin-bottom:16px">
            <span style="font-size:22px;font-weight:900;color:#6d28d9;letter-spacing:1px">${ticket.ticketId}</span>
          </div>
          <p style="color:#475569;margin:0 0 8px"><strong>Subject:</strong> ${ticket.title}</p>
          <p style="color:#475569;margin:0 0 16px"><strong>Category:</strong> ${ticket.category}</p>
          <p style="color:#475569;margin:0 0 24px">Our team will review your ticket and respond within <strong>48 hours</strong>. It has been assigned to <strong>${assignedName}</strong>.</p>
          <p style="color:#94a3b8;font-size:13px;margin:0">Keep using Milkify! 🐄<br/>The Milkify Support Team</p>
        </div>
      `,
    });
  } catch (e) {
    console.warn("[Ticket] Ack email failed:", e.message);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// ADMIN ENDPOINTS
// ════════════════════════════════════════════════════════════════════════════

// POST /api/tickets — create ticket (with optional image uploads)
exports.createTicket = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const { title, description, category, priority = "medium" } = req.body;

    if (!title || !description || !category)
      return res.status(400).json({ success: false, message: "title, description and category are required" });

    // Upload any attached images to S3
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      imageUrls = await Promise.all(
        req.files.map((f) => uploadToS3(f.buffer, f.originalname, "tickets"))
      );
    }

    // Assign to a random active master admin
    const masters = await MasterAdminModel.find({ isActive: true });
    let assignedTo = null;
    let assignedName = "";
    if (masters.length > 0) {
      const randomMaster = masters[Math.floor(Math.random() * masters.length)];
      assignedTo = randomMaster._id;
      assignedName = randomMaster.username || "Support Team";
    }

    const ticket = await TicketModel.create({
      adminId,
      adminName:   req.admin.name || "",
      assignedTo,
      assignedName,
      title:       title.trim(),
      description: description.trim(),
      category,
      priority,
      imageUrls,
      replies: assignedTo ? [{
        from: "master",
        fromId: assignedTo,
        fromName: assignedName,
        message: `Thank you for reaching out to us! Your ticket has been assigned to **${assignedName}**. We will get back to you within 48 hours.`,
        createdAt: new Date()
      }] : []
    });

    // Real-time push to master
    emitTicket("ticket_created", { ticket });

    // Send auto-ack email (non-blocking)
    sendAckEmail(req.admin, ticket, assignedName);

    return res.status(201).json({
      success: true,
      message: `Ticket ${ticket.ticketId} created. We'll respond within 48 hours.`,
      data: { ticket },
    });
  } catch (err) {
    console.error("[Ticket] createTicket:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/tickets — get this admin's tickets
exports.getMyTickets = async (req, res) => {
  try {
    const { status, category, page = 1, limit = 20 } = req.query;
    const filter = { adminId: req.admin._id };
    if (status)   filter.status   = status;
    if (category) filter.category = category;

    const [tickets, total] = await Promise.all([
      TicketModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean(),
      TicketModel.countDocuments(filter),
    ]);

    // Mark adminUnread as read on fetch
    await TicketModel.updateMany(
      { adminId: req.admin._id, adminUnread: true },
      { $set: { adminUnread: false } }
    );

    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    return res.status(200).json({ success: true, data: { tickets, total } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/tickets/:id — single ticket detail
exports.getTicketById = async (req, res) => {
  try {
    const ticket = await TicketModel.findOne({ _id: req.params.id, adminId: req.admin._id }).lean();
    if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });
    // Mark as read
    await TicketModel.findByIdAndUpdate(req.params.id, { $set: { adminUnread: false } });
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    return res.status(200).json({ success: true, data: { ticket } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/tickets/:id/reply — admin adds a reply
exports.addAdminReply = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, message: "message is required" });

    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      imageUrls = await Promise.all(
        req.files.map((f) => uploadToS3(f.buffer, f.originalname, "tickets"))
      );
    }

    const ticket = await TicketModel.findOneAndUpdate(
      { _id: req.params.id, adminId: req.admin._id },
      {
        $push: {
          replies: {
            from:     "admin",
            fromId:   req.admin._id,
            fromName: req.admin.name || "Admin",
            message:  message.trim(),
            imageUrls,
          },
        },
        $set: { masterUnread: true, status: "in_progress" },
      },
      { new: true }
    );

    if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });

    emitTicket("ticket_reply", { ticket, replyFrom: "admin" });

    return res.status(200).json({ success: true, data: { ticket } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/tickets/:id — admin can close their own ticket
exports.closeTicket = async (req, res) => {
  try {
    const ticket = await TicketModel.findOneAndUpdate(
      { _id: req.params.id, adminId: req.admin._id },
      { $set: { status: "closed", closedAt: new Date() } },
      { new: true }
    );
    if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });
    emitTicket("ticket_updated", { ticket });
    return res.status(200).json({ success: true, message: "Ticket closed" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/tickets/:id/reopen — admin can reopen their own ticket
exports.reopenTicket = async (req, res) => {
  try {
    const ticket = await TicketModel.findOneAndUpdate(
      { _id: req.params.id, adminId: req.admin._id },
      { $set: { status: "open", closedAt: null } },
      { new: true }
    );
    if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });
    emitTicket("ticket_updated", { ticket });
    return res.status(200).json({ success: true, data: { ticket }, message: "Ticket reopened" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};


// GET /api/tickets/unread-count — for notification badge
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await TicketModel.countDocuments({ adminId: req.admin._id, adminUnread: true });
    return res.status(200).json({ success: true, data: { count } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// MASTER ADMIN ENDPOINTS
// ════════════════════════════════════════════════════════════════════════════

// GET /api/tickets/master — all tickets with filters
exports.masterGetAllTickets = async (req, res) => {
  try {
    const { status, category, priority, search, page = 1, limit = 30 } = req.query;
    const filter = {};
    if (status)   filter.status   = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (search)   filter.$or = [
      { title:    { $regex: search, $options: "i" } },
      { ticketId: { $regex: search, $options: "i" } },
      { adminName:{ $regex: search, $options: "i" } },
    ];

    const [tickets, total] = await Promise.all([
      TicketModel.find(filter)
        .populate("adminId", "name email shopName mobile")
        .sort({ masterUnread: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean(),
      TicketModel.countDocuments(filter),
    ]);

    // Mark all as read by master
    await TicketModel.updateMany({ masterUnread: true }, { $set: { masterUnread: false } });

    const unreadCount = await TicketModel.countDocuments({ masterUnread: true });

    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    return res.status(200).json({ success: true, data: { tickets, total, unreadCount } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/tickets/master/:id — single ticket
exports.masterGetTicket = async (req, res) => {
  try {
    const ticket = await TicketModel.findById(req.params.id)
      .populate("adminId", "name email shopName mobile")
      .lean();
    if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });
    await TicketModel.findByIdAndUpdate(req.params.id, { $set: { masterUnread: false } });
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    return res.status(200).json({ success: true, data: { ticket } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/tickets/master/:id/reply — master replies to ticket
exports.masterReplyToTicket = async (req, res) => {
  try {
    const { message, status } = req.body;
    if (!message) return res.status(400).json({ success: false, message: "message is required" });

    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      imageUrls = await Promise.all(
        req.files.map((f) => uploadToS3(f.buffer, f.originalname, "tickets/master"))
      );
    }

    const updateFields = {
      adminUnread: true,
      masterUnread: false,
    };
    if (status) updateFields.status = status;
    if (status === "resolved") updateFields.resolvedAt = new Date();

    const ticket = await TicketModel.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          replies: {
            from:     "master",
            fromId:   req.masterId,
            fromName: req.master.username || req.master.name || "Milkify Support",
            message:  message.trim(),
            imageUrls,
          },
        },
        $set: updateFields,
      },
      { new: true }
    ).populate("adminId", "name email shopName");

    if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });

    // Real-time push
    emitTicket("ticket_reply", { ticket, replyFrom: "master" });

    // Email notification to admin
    if (ticket.adminId?.email) {
      try {
        await sendGenericMail({
          to:      ticket.adminId.email,
          subject: `[${ticket.ticketId}] New Reply from Milkify Support`,
          html: `
            <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;padding:24px;background:#fff;border-radius:12px;border:1px solid #e5e7eb">
              <img src="cid:milkify-logo" alt="Milkify" style="height:40px;margin-bottom:20px"/>
              <h2 style="color:#1e293b;font-size:18px;margin:0 0 8px">New reply on your ticket</h2>
              <p style="color:#6d28d9;font-weight:700;margin:0 0 12px">${ticket.ticketId}: ${ticket.title}</p>
              <div style="background:#f8fafc;border-left:4px solid #6d28d9;padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:16px">
                <p style="color:#334155;margin:0;white-space:pre-wrap">${message}</p>
              </div>
              <p style="color:#475569;margin:0 0 16px">Log in to your Milkify dashboard to view the full conversation.</p>
              <p style="color:#94a3b8;font-size:13px">The Milkify Support Team 🐄</p>
            </div>
          `,
        });
      } catch (e) { console.warn("[Ticket] Reply email failed:", e.message); }
    }

    return res.status(200).json({ success: true, data: { ticket } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/tickets/master/:id/status — change ticket status
exports.masterUpdateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const update = { status };
    if (status === "resolved") update.resolvedAt = new Date();
    if (status === "closed")   update.closedAt   = new Date();

    const ticket = await TicketModel.findByIdAndUpdate(
      req.params.id, { $set: update }, { new: true }
    );
    if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });
    emitTicket("ticket_updated", { ticket });
    return res.status(200).json({ success: true, data: { ticket } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/tickets/master/stats — dashboard stats
exports.masterGetStats = async (req, res) => {
  try {
    const [total, open, inProgress, resolved, closed, unread] = await Promise.all([
      TicketModel.countDocuments(),
      TicketModel.countDocuments({ status: "open" }),
      TicketModel.countDocuments({ status: "in_progress" }),
      TicketModel.countDocuments({ status: "resolved" }),
      TicketModel.countDocuments({ status: "closed" }),
      TicketModel.countDocuments({ masterUnread: true }),
    ]);
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    return res.status(200).json({ success: true, data: { total, open, inProgress, resolved, closed, unread } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
