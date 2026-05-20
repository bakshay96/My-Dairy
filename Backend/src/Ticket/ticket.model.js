const mongoose = require("mongoose");

// ── Auto-generate unique ticket ID ───────────────────────────────────────────
async function generateTicketId() {
  const count = await mongoose.model("Ticket").countDocuments();
  const pad   = String(count + 1).padStart(4, "0");
  const year  = new Date().getFullYear();
  return `MLK-${year}-${pad}`;
}

const replySchema = new mongoose.Schema({
  from:      { type: String, enum: ["admin", "master"], required: true },
  fromId:    { type: mongoose.Schema.Types.ObjectId, required: true },
  fromName:  { type: String, default: "" },
  message:   { type: String, required: true },        // markdown text
  imageUrls: [{ type: String }],                       // S3 URLs
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const ticketSchema = new mongoose.Schema(
  {
    ticketId: {
      type:   String,
      unique: true,
      index:  true,
    },

    // ── Who filed it ──────────────────────────────────────────
    adminId:   { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true, index: true },
    adminName: { type: String, default: "" },

    // ── Assigned Master Admin ─────────────────────────────────
    assignedTo:   { type: mongoose.Schema.Types.ObjectId, ref: "MasterAdmin" },
    assignedName: { type: String, default: "" },

    // ── Classification ────────────────────────────────────────
    category: {
      type:     String,
      enum:     ["personal", "technical", "improvement", "feature"],
      required: true,
    },
    priority: {
      type:    String,
      enum:    ["low", "medium", "high", "urgent"],
      default: "medium",
    },

    // ── Content ───────────────────────────────────────────────
    title:       { type: String, required: true, maxlength: 200 },
    description: { type: String, required: true },   // markdown
    imageUrls:   [{ type: String }],                  // S3 image URLs

    // ── Status tracking ───────────────────────────────────────
    status: {
      type:    String,
      enum:    ["open", "in_progress", "resolved", "closed"],
      default: "open",
      index:   true,
    },

    // ── Thread ────────────────────────────────────────────────
    replies: [replySchema],

    // ── Timestamps ───────────────────────────────────────────
    resolvedAt: { type: Date, default: null },
    closedAt:   { type: Date, default: null },

    // ── Unread flags (for notification dots) ─────────────────
    adminUnread:  { type: Boolean, default: false },   // master replied → admin hasn't seen
    masterUnread: { type: Boolean, default: true  },   // new ticket → master hasn't seen
  },
  { timestamps: true }
);

ticketSchema.pre("save", async function (next) {
  if (!this.ticketId) this.ticketId = await generateTicketId();
  next();
});

const TicketModel = mongoose.model("Ticket", ticketSchema);
module.exports = { TicketModel };
