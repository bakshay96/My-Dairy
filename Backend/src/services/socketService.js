/**
 * socketService.js
 * Centralizes all Socket.io emit calls so controllers stay clean.
 *
 * Room convention:
 *   admin:{adminId}   — standard admin dashboard users
 *   master:{masterId} — master admin sessions (future chat)
 *
 * Usage:
 *   const { emitMilkAdded, emitNewAdvertisement } = require('../services/socketService');
 */

let _io = null;

/** Called once from app.js after socket.io is initialized */
function initSocketService(io) {
  _io = io;
}

function getIo() {
  if (!_io) {
    console.warn("[Socket] socketService not initialized — call initSocketService(io) first");
    return null;
  }
  return _io;
}

// ─── Emit Helpers ─────────────────────────────────────────────────────────────

/** Emit when a new milk entry is created. */
function emitMilkAdded(farmerId, milkData) {
  const io = getIo();
  if (!io) return;
  io.to(`admin:${milkData.adminId}`).emit("milk_entry_added", {
    farmerId: farmerId.toString(),
    milk: milkData,
    timestamp: new Date().toISOString(),
  });
}

/** Emit when a farmer profile is updated. */
function emitFarmerUpdated(adminId, farmerData) {
  const io = getIo();
  if (!io) return;
  io.to(`admin:${adminId}`).emit("farmer_updated", {
    farmer: farmerData,
    timestamp: new Date().toISOString(),
  });
}

/** Emit when a Razorpay payment is captured/verified. */
function emitPaymentCaptured(adminId, paymentData) {
  const io = getIo();
  if (!io) return;
  io.to(`admin:${adminId}`).emit("payment_captured", {
    payment: paymentData,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emit a new/updated advertisement to the relevant admin rooms.
 *
 * @param {Object} ad          - The advertisement document (lean)
 * @param {'new'|'updated'|'removed'} action
 *
 * If targetAdmins is empty → broadcast to ALL connected admins via 'ads' room.
 * If targetAdmins has IDs  → emit only to those specific admin rooms.
 *
 * This is also the foundation for the future admin↔master chat system:
 * replace event name 'advertisement_push' with 'chat_message' using the same room logic.
 */
function emitNewAdvertisement(ad, action = "new") {
  const io = getIo();
  if (!io) return;

  const payload = {
    action,           // "new" | "updated" | "removed"
    advertisement: ad,
    timestamp: new Date().toISOString(),
  };

  const targets = ad.targetAdmins || [];

  if (targets.length === 0) {
    // Broadcast to all admins subscribed to the 'ads' room
    io.to("ads").emit("advertisement_push", payload);
  } else {
    // Targeted: emit only to the specific admin rooms
    targets.forEach((adminId) => {
      io.to(`admin:${adminId.toString()}`).emit("advertisement_push", payload);
    });
  }
}

/** Emit when an admin dismisses an ad (useful for future read-receipts / chat) */
function emitAdDismissed(adminId, adId) {
  const io = getIo();
  if (!io) return;
  io.to(`admin:${adminId}`).emit("advertisement_dismissed", { adId });
}

module.exports = {
  initSocketService,
  getIo,
  emitMilkAdded,
  emitFarmerUpdated,
  emitPaymentCaptured,
  emitNewAdvertisement,
  emitAdDismissed,
};
