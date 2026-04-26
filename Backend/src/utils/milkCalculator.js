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

module.exports = { calculateMilkAmount, getBillingCycleDate, getBillingCycleEnd };
