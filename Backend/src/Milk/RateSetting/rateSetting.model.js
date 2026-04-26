const mongoose = require('mongoose');

const RateSettingSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
    index: true,
  },
  milkCategory: {
    type: String,
    enum: ['cow', 'buffalo', 'sheep', 'goat'],
    default: 'cow',
    required: true,
  },

  // ── Base Rate ───────────────────────────────────────────────
  /** Rate multiplied by FAT % × litres. Always used. */
  ratePerFat: {
    type: Number,
    required: true,
    min: [0, 'Rate per FAT must be positive'],
  },

  // ── Optional SNF Rate ───────────────────────────────────────
  /** When useSnf=true: adds snf × ratePerSnf × litres to total. */
  useSnf: {
    type: Boolean,
    default: false,
  },
  ratePerSnf: {
    type: Number,
    default: 0,
    min: [0, 'Rate per SNF must be positive'],
  },

  // ── Optional Degree Rate ────────────────────────────────────
  /** When useDegree=true: adds degree × ratePerDegree × litres. */
  useDegree: {
    type: Boolean,
    default: false,
  },
  ratePerDegree: {
    type: Number,
    default: 0,
    min: [0, 'Rate per Degree must be positive'],
  },

  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active',
    required: true,
  },
}, {
  timestamps: true,
});

// Compound index: one active setting per admin+category
RateSettingSchema.index({ adminId: 1, milkCategory: 1 });

const rateSettingModel = mongoose.model('RateSetting', RateSettingSchema);
module.exports = { rateSettingModel };
