/**
 * socketService.js
 * Centralizes all Socket.io emit calls so controllers stay clean.
 * 
 * Usage in controllers:
 *   const { emitMilkAdded } = require('../services/socketService');
 *   emitMilkAdded(farmerId, milkEntry);
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

// ─── Emit Helpers ─────────────────────────────────────────────

/**
 * Emit when a new milk entry is created.
 * Frontend components subscribed to 'milk_entry_added' will update their tables live.
 */
function emitMilkAdded(farmerId, milkData) {
  const io = getIo();
  if (!io) return;
  // Emit to admin room so only the owning admin sees the update
  io.to(`admin:${milkData.adminId}`).emit("milk_entry_added", {
    farmerId: farmerId.toString(),
    milk: milkData,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emit when a farmer profile is updated.
 */
function emitFarmerUpdated(adminId, farmerData) {
  const io = getIo();
  if (!io) return;
  io.to(`admin:${adminId}`).emit("farmer_updated", {
    farmer: farmerData,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emit when a Razorpay payment is captured/verified.
 * Triggers the frontend to instantly update the billing table.
 */
function emitPaymentCaptured(adminId, paymentData) {
  const io = getIo();
  if (!io) return;
  io.to(`admin:${adminId}`).emit("payment_captured", {
    payment: paymentData,
    timestamp: new Date().toISOString(),
  });
}

module.exports = { initSocketService, emitMilkAdded, emitFarmerUpdated, emitPaymentCaptured };
