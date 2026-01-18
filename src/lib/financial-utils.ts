/**
 * Financial Calculation Utilities
 *
 * Core Principle: HIGH PRECISION STORAGE, FORMATTED DISPLAY
 * - All amounts are stored with 12 decimal places precision for calculations
 * - Display uses max 4 decimal places
 * - Percentages are calculated with full precision
 * - Use epsilon tolerance for floating-point comparisons
 */

// Storage precision: 12 decimal places for calculations
const STORAGE_PRECISION = 12;

// Display precision: max 4 decimal places for showing to user
const DISPLAY_PRECISION = 4;

// Small tolerance for floating-point comparisons (0.0001%)
const EPSILON = 0.0001;

/**
 * Rounds a number to specified decimal places
 */
export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Rounds amount to storage precision (12 decimals)
 * Used for all internal calculations and storage
 */
export function roundAmount(amount: number): number {
  return roundTo(amount, STORAGE_PRECISION);
}

/**
 * Formats amount for display with max 4 decimal places
 * Strips trailing zeros
 */
export function displayAmount(amount: number): string {
  const rounded = roundTo(amount, DISPLAY_PRECISION);
  // Remove trailing zeros
  return rounded.toString().replace(/\.?0+$/, '');
}

/**
 * Calculates percentage with full precision (12 decimals) for storage
 * Use for internal calculations
 */
export function calculatePercentage(amount: number, total: number, decimals: number = STORAGE_PRECISION): number {
  if (total === 0) return 0;
  const percentage = (amount / total) * 100;
  return roundTo(percentage, decimals);
}

/**
 * Calculates amount from percentage with 12 decimal precision
 * Returns amount with full precision for calculations
 */
export function calculateAmountFromPercentage(percentage: number, total: number): number {
  const amount = (percentage / 100) * total;
  return roundAmount(amount);
}

/**
 * Formats percentage for display with max 4 decimal places
 * Strips trailing zeros
 */
export function displayPercentage(percentage: number): string {
  const rounded = roundTo(percentage, DISPLAY_PRECISION);
  // Remove trailing zeros
  return rounded.toString().replace(/\.?0+$/, '');
}

/**
 * Checks if two numbers are approximately equal within epsilon tolerance
 */
export function isApproximatelyEqual(a: number, b: number, epsilon: number = EPSILON): boolean {
  return Math.abs(a - b) <= epsilon;
}

/**
 * Checks if value is less than or approximately equal to max
 * Accounts for floating-point precision issues
 */
export function isLessOrApproximatelyEqual(value: number, max: number, epsilon: number = EPSILON): boolean {
  return value <= max || Math.abs(value - max) <= epsilon;
}

/**
 * Calculates and displays percentage from amount and total
 * Uses max 4 decimal places, strips trailing zeros
 */
export function displayPercentageFromAmount(amount: number, total: number): string {
  if (total === 0) return "0";
  const percentage = (amount / total) * 100;
  return displayPercentage(percentage);
}

/**
 * For validation max: Rounds percentage with storage precision
 */
export function maxPercentageForValidation(amount: number, total: number): number {
  if (total === 0) return 0;
  const percentage = (amount / total) * 100;
  return roundTo(percentage, STORAGE_PRECISION);
}

/**
 * Validates that entered amount doesn't exceed max amount
 * Returns { valid: boolean, correctedAmount?: number }
 */
export function validateAmount(
  enteredAmount: number,
  maxAmount: number
): { valid: boolean; correctedAmount?: number; message?: string } {
  const rounded = roundAmount(enteredAmount);
  
  if (rounded < 0) {
    return { valid: false, correctedAmount: 0, message: "Amount cannot be negative" };
  }
  
  if (rounded > maxAmount) {
    return { valid: false, correctedAmount: maxAmount, message: `Amount cannot exceed ${maxAmount}` };
  }
  
  return { valid: true };
}

/**
 * Validates percentage input and returns corrected amount
 * Percentage is converted to amount, which is the source of truth
 */
export function validatePercentageInput(
  enteredPercentage: number,
  totalAmount: number,
  maxAmount: number
): { valid: boolean; amount: number; percentage: number; message?: string } {
  // Convert percentage to amount
  let amount = calculateAmountFromPercentage(enteredPercentage, totalAmount);
  
  // Clamp to valid range
  if (amount < 0) {
    return {
      valid: false,
      amount: 0,
      percentage: 0,
      message: "Percentage cannot be negative"
    };
  }
  
  if (amount > maxAmount) {
    // Correct to max amount
    amount = maxAmount;
    const correctedPercentage = calculatePercentage(amount, totalAmount);
    return {
      valid: false,
      amount: maxAmount,
      percentage: correctedPercentage,
      message: `Exceeds maximum. Corrected to ${correctedPercentage.toFixed(2)}%`
    };
  }
  
  // Recalculate percentage from the rounded amount (source of truth)
  const actualPercentage = calculatePercentage(amount, totalAmount);
  
  return { valid: true, amount, percentage: actualPercentage };
}

/**
 * Formats currency for display (BDT) with Indian/Bangladeshi numbering system
 * Uses Lakh/Crore notation: 1,00,00,000 for 1 crore, 1,00,000 for 1 lakh
 * Shows max 4 decimal places when decimals exist
 */
export function formatBDT(amount: number, showDecimals: boolean = false): string {
  // Use en-IN locale for Indian numbering system (Lakh/Crore commas)
  // Format: 1,00,00,000 (1 crore), 1,00,000 (1 lakh)
  const rounded = roundTo(amount, showDecimals ? DISPLAY_PRECISION : 0);
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: showDecimals ? DISPLAY_PRECISION : 0
  }).format(rounded);

  return `৳${formatted}`;
}

/**
 * Formats a plain number with Indian/Bangladeshi numbering system
 * Shows max 4 decimal places when decimals exist
 */
export function formatIndianNumber(num: number, showDecimals: boolean = false): string {
  const rounded = roundTo(num, showDecimals ? DISPLAY_PRECISION : 0);
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: showDecimals ? DISPLAY_PRECISION : 0
  }).format(rounded);
}

/**
 * Distributes a total amount across multiple items by percentages
 * Ensures the sum equals the total exactly (handles rounding remainder)
 */
export function distributeByPercentages(
  total: number,
  percentages: number[]
): number[] {
  const amounts = percentages.map(pct => calculateAmountFromPercentage(pct, total));
  
  // Calculate rounding difference
  const sum = amounts.reduce((a, b) => a + b, 0);
  const remainder = roundAmount(total) - sum;
  
  // Add remainder to the largest item
  if (remainder !== 0 && amounts.length > 0) {
    const maxIndex = amounts.indexOf(Math.max(...amounts));
    amounts[maxIndex] += remainder;
  }
  
  return amounts;
}
