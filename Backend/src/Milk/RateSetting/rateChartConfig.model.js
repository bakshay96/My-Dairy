const mongoose = require('mongoose');

const RateChartConfigSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
    index: true,
  },
  animalType: {
    type: String,
    enum: ['cow', 'buffalo', 'sheep', 'goat'],
    default: 'cow',
    required: true,
  },
  baseRate: {
    type: Number,
    required: true,
    default: 40,
    min: [0, 'Base rate must be positive'],
  },
  baseFat: {
    type: Number,
    required: true,
    default: 3.5,
    min: [0, 'Base FAT must be positive'],
  },
  baseSnf: {
    type: Number,
    required: true,
    default: 8.5,
    min: [0, 'Base SNF must be positive'],
  },
  fatPointValue: {
    type: Number,
    required: true,
    default: 0.2,
    min: [0, 'FAT point value must be positive'],
  },
  snfPointValue: {
    type: Number,
    required: true,
    default: 0.1,
    min: [0, 'SNF point value must be positive'],
  },
  ratePerKgFat: {
    type: Number,
    default: 0,
    min: [0, 'Rate per Kg FAT must be positive'],
  },
  ratePerKgSnf: {
    type: Number,
    default: 0,
    min: [0, 'Rate per Kg SNF must be positive'],
  },
  minFat: {
    type: Number,
    default: 2.0,
  },
  maxFat: {
    type: Number,
    default: 10.0,
  },
  minSnf: {
    type: Number,
    default: 6.0,
  },
  maxSnf: {
    type: Number,
    default: 12.0,
  },
  minDegree: {
    type: Number,
    default: 20,
  },
  maxDegree: {
    type: Number,
    default: 40,
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

// Compound index: one active rate config per admin + animalType
RateChartConfigSchema.index({ adminId: 1, animalType: 1 });

const rateChartConfigModel = mongoose.model('RateChartConfig', RateChartConfigSchema);
module.exports = { rateChartConfigModel };
