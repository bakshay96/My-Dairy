import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind classes
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number into Indian Rupees (INR)
 * @param {number|string} amount - The amount to format
 * @returns {string} - Formatted currency string (e.g., ₹1,234.50)
 */
export function formatRupees(amount) {
  const numericAmount = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);
}

/**
 * Formats an ISO date into standard Indian format (DD-MM-YYYY)
 * @param {string|Date} date - The date to format
 * @returns {string} - Formatted date string (e.g., 25-04-2026)
 */
export function formatIndianDate(date) {
  if (!date) return "N/A";
  
  try {
    const d = new Date(date);
    // Check if valid date
    if (isNaN(d.getTime())) return "Invalid Date";
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    return `${day}-${month}-${year}`;
  } catch {
    return "Invalid Date";
  }
}
