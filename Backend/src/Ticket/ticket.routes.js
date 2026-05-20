const express              = require("express");
const authMiddleware       = require("../middleware/authMiddleware");
const masterAuthMiddleware = require("../middleware/masterAuthMiddleware");
const { upload }           = require("../middleware/upload.middleware");

const {
  createTicket, getMyTickets, getTicketById, addAdminReply,
  closeTicket, getUnreadCount,
  masterGetAllTickets, masterGetTicket, masterReplyToTicket,
  masterUpdateStatus, masterGetStats,
} = require("./ticket.controller");

const router = express.Router();

// ── Master admin routes ───────────────────────────────────────────────────────
router.get   ("/master/stats",          masterAuthMiddleware,       masterGetStats);
router.get   ("/master",                masterAuthMiddleware,       masterGetAllTickets);
router.get   ("/master/:id",            masterAuthMiddleware,       masterGetTicket);
router.post  ("/master/:id/reply",      masterAuthMiddleware, upload.array("images", 3), masterReplyToTicket);
router.patch ("/master/:id/status",     masterAuthMiddleware,       masterUpdateStatus);

// ── Admin routes (protected by authMiddleware) ────────────────────────────────
router.get   ("/unread-count",          authMiddleware,             getUnreadCount);
router.get   ("/",                      authMiddleware,             getMyTickets);
router.post  ("/",                      authMiddleware, upload.array("images", 5), createTicket);
router.get   ("/:id",                   authMiddleware,             getTicketById);
router.post  ("/:id/reply",             authMiddleware, upload.array("images", 3), addAdminReply);
router.patch ("/:id/close",             authMiddleware,             closeTicket);

module.exports = router;
