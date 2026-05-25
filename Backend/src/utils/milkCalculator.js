/**
 * milkCalculator.js
 * Robust utility for calculating the amount owed for a single milk entry.
 *
 * Formula:
 *   base   = fat × ratePerFat × litter
 *   snfPart   = (useSnf && snf > 0)  ? snf  × ratePerSnf  × litter : 0
 *   degreePart = (useDegree && degree > 0) ? degree × ratePerDegree × litter : 0
 *   total  = base + snfPart + degreePart
 *
 * All arithmetic is done using integer scaling (multiply by 1e6 before adding,
 * divide at the end) to avoid IEEE 754 floating-point drift on rupee values.
 */

/**
 * @param {Object} params
 * @param {number} params.fat           - FAT percentage (1.0–20.0)
 * @param {number} [params.snf=0]       - SNF percentage (0–15.0)
 * @param {number} [params.degree=0]    - Degree / CLR (0–35.0)
 * @param {number} params.litter        - Quantity in litres (0.1–1000.0)
 * @param {Object} params.rateSetting   - RateSetting document (Mongoose doc or plain obj)
 * @param {number} params.rateSetting.ratePerFat
 * @param {boolean} [params.rateSetting.useSnf=false]
 * @param {number}  [params.rateSetting.ratePerSnf=0]
 * @param {boolean} [params.rateSetting.useDegree=false]
 * @param {number}  [params.rateSetting.ratePerDegree=0]
 *
 * @returns {{ rate: number, calculatedAmount: number, fatRate: number }}
 */
function calculateMilkAmount({ fat, snf = 0, degree = 0, litter, rateSetting }) {
  if (!rateSetting) {
    throw new Error("rateSetting is required for milk amount calculation");
  }

  const {
    ratePerFat,
    useSnf = false,
    ratePerSnf = 0,
    useDegree = false,
    ratePerDegree = 0,
  } = rateSetting;

  // Validate inputs
  const _fat    = parseFloat(fat)    || 0;
  const _snf    = parseFloat(snf)    || 0;
  const _degree = parseFloat(degree) || 0;
  const _litter = parseFloat(litter) || 0;
  const _ratePerFat    = parseFloat(ratePerFat)    || 0;
  const _ratePerSnf    = parseFloat(ratePerSnf)    || 0;
  const _ratePerDegree = parseFloat(ratePerDegree) || 0;

  // Use integer scaling (×1000) to prevent floating-point rounding errors
  const SCALE = 1000;

  const basePaise    = Math.round(_fat    * _ratePerFat    * _litter * SCALE);
  const snfPaise     = useSnf    && _snf    > 0 ? Math.round(_snf    * _ratePerSnf    * _litter * SCALE) : 0;
  const degreePaise  = useDegree && _degree > 0 ? Math.round(_degree * _ratePerDegree * _litter * SCALE) : 0;

  const totalPaise = basePaise + snfPaise + degreePaise;

  // Rate per litre (base only, for display)
  const rate             = parseFloat((_fat * _ratePerFat).toFixed(4));
  const calculatedAmount = parseFloat((totalPaise / SCALE).toFixed(2));
  const fatRate          = _ratePerFat;

  return { rate, calculatedAmount, fatRate };
}

/**
 * Get the start date of the 10-day billing cycle for a given date.
 * Periods: 1–10, 11–20, 21–end-of-month.
 *
 * @param {Date} [date=new Date()] 
 * @returns {string} ISO date string "YYYY-MM-DD"
 */
function getBillingCycleDate(date = new Date()) {
  const d = new Date(date);
  const day = d.getDate();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");

  let cycleDay;
  if (day <= 10)       cycleDay = "01";
  else if (day <= 20)  cycleDay = "11";
  else                 cycleDay = "21";

  return `${year}-${month}-${cycleDay}`;
}

/**
 * Get the end date of a billing cycle given its start date string.
 * @param {string} cycleStart - "YYYY-MM-DD"
 * @returns {string} "YYYY-MM-DD"
 */
function getBillingCycleEnd(cycleStart) {
  const [year, month, day] = cycleStart.split("-").map(Number);
  let endDay;

  if (day === 1)       endDay = 10;
  else if (day === 11) endDay = 20;
  else {
    // Last day of month
    endDay = new Date(year, month, 0).getDate();
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(endDay).padStart(2, "0")}`;
}

/**
 * Richmond's Formula (Degree to SNF):
 * SNF = (Degree / 4) + (0.21 * FAT) + 0.36
 */
function calculateSnfFromDegree(fat, degree) {
  const f = parseFloat(fat) || 0;
  const d = parseFloat(degree) || 0;
  if (d <= 0) return 0;
  return parseFloat(((d / 4) + (0.21 * f) + 0.36).toFixed(2));
}

/**
 * Point Increment Rate Formula (Slab-Aware):
 *
 * If fatSlabs / snfSlabs are provided and non-empty, the increment per 0.1% step
 * is looked up from the matching slab for that value.  This allows cooperatives to
 * define variable increments such as ₹0.10 per 0.1% for FAT 2-4 and ₹0.20 for FAT 4-6.
 *
 * Flat fallback (when slabs are empty):
 * Rate Per Liter = Base_Rate + ((FAT - Base_FAT) * 10 * Fat_Point_Value)
 *                            + ((SNF - Base_SNF) * 10 * SNF_Point_Value)
 */
function calculateMilkRate(actualFat, actualSnf, config) {
  const fat = parseFloat(actualFat) || 0;
  const snf = parseFloat(actualSnf) || 0;
  const baseRate = parseFloat(config.baseRate) || 0;
  const baseFat = parseFloat(config.baseFat) || 0;
  const baseSnf = parseFloat(config.baseSnf) || 0;
  const fatPointValue = parseFloat(config.fatPointValue) || 0;
  const snfPointValue = parseFloat(config.snfPointValue) || 0;

  const fatSlabs = Array.isArray(config.fatSlabs) && config.fatSlabs.length > 0 ? config.fatSlabs : null;
  const snfSlabs = Array.isArray(config.snfSlabs) && config.snfSlabs.length > 0 ? config.snfSlabs : null;

  // ── FAT Adjustment ────────────────────────────────────────────────────
  let fatAdjustment = 0;
  if (fatSlabs) {
    fatAdjustment = _calculateSlabAdjustment(baseFat, fat, fatSlabs, 'fat');
  } else {
    const fatDiff = Math.round((fat - baseFat) * 10);
    fatAdjustment = fatDiff * fatPointValue;
  }

  // ── SNF Adjustment ────────────────────────────────────────────────────
  let snfAdjustment = 0;
  if (snfSlabs) {
    snfAdjustment = _calculateSlabAdjustment(baseSnf, snf, snfSlabs, 'snf');
  } else {
    const snfDiff = Math.round((snf - baseSnf) * 10);
    snfAdjustment = snfDiff * snfPointValue;
  }

  const rate = baseRate + fatAdjustment + snfAdjustment;
  return Math.max(0, parseFloat(rate.toFixed(4)));
}

/**
 * Internal helper: Walk from `baseVal` to `actualVal` in 0.1 steps,
 * looking up the correct slab increment for each step.
 *
 * @param {number} baseVal   - Base FAT/SNF (e.g. 3.5)
 * @param {number} actualVal - Actual FAT/SNF (e.g. 5.8)
 * @param {Array}  slabs     - Sorted slab array [{fromFat/fromSnf, toFat/toSnf, incrementPerPoint}]
 * @param {string} type      - 'fat' or 'snf' (for field naming)
 * @returns {number} Total ₹ adjustment (positive = premium, negative = deduction)
 */
function _calculateSlabAdjustment(baseVal, actualVal, slabs, type) {
  const SCALE = 10; // work in integer tenths to avoid IEEE 754 drift
  const baseScaled = Math.round(baseVal * SCALE);
  const actualScaled = Math.round(actualVal * SCALE);

  if (baseScaled === actualScaled) return 0;

  const direction = actualScaled > baseScaled ? 1 : -1;
  let totalPaise = 0; // accumulate in scaled ₹ (×10000)
  const PAISE_SCALE = 10000;

  const fromKey = type === 'fat' ? 'fromFat' : 'fromSnf';
  const toKey   = type === 'fat' ? 'toFat'   : 'toSnf';

  for (let step = baseScaled; step !== actualScaled; step += direction) {
    // Current value in real units (at the start of this 0.1 step)
    const currentVal = step / SCALE;
    // The point we are stepping to
    const nextVal = (step + direction) / SCALE;
    // For positive direction, check which slab contains currentVal
    // For negative direction, check which slab contains nextVal
    const checkVal = direction > 0 ? currentVal : nextVal;

    // Find matching slab: checkVal must be >= slab.from AND < slab.to
    const matchedSlab = slabs.find(s => {
      const from = parseFloat(s[fromKey]);
      const to   = parseFloat(s[toKey]);
      return checkVal >= from && checkVal < to;
    });

    if (matchedSlab) {
      const increment = parseFloat(matchedSlab.incrementPerPoint) || 0;
      totalPaise += Math.round(increment * PAISE_SCALE) * direction;
    }
    // If no slab matches (out of all slab ranges), ₹0 increment for this step
  }

  return totalPaise / PAISE_SCALE;
}

/**
 * Rate Per Kg FAT/SNF Formula:
 * Rate Per Liter = (FAT * ratePerKgFat / 100) + (SNF * ratePerKgSnf / 100)
 */
function calculateMilkRatePerKg(fat, snf, ratePerKgFat, ratePerKgSnf) {
  const f = parseFloat(fat) || 0;
  const s = parseFloat(snf) || 0;
  const rFat = parseFloat(ratePerKgFat) || 0;
  const rSnf = parseFloat(ratePerKgSnf) || 0;

  const rate = (f * rFat / 100) + (s * rSnf / 100);
  return Math.max(0, parseFloat(rate.toFixed(4)));
}

module.exports = {
  calculateMilkAmount,
  getBillingCycleDate,
  getBillingCycleEnd,
  calculateSnfFromDegree,
  calculateMilkRate,
  calculateMilkRatePerKg
};
