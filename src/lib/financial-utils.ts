/**
 * Financial Calculation Utilities
 * 
 * Core Principle: AMOUNT IS THE SOURCE OF TRUTH
 * - All amounts are stored as integers (smallest currency unit)
 * - Percentages are always derived from amounts
 * - When user enters percentage, convert to amount first, then recalculate percentage
 * - Use epsilon tolerance for floating-point comparisons
 */

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
 * Rounds amount to nearest integer (for BDT)
 */
export function roundAmount(amount: number): number {
  return Math.round(amount);
}

/**
 * Calculates percentage with proper precision handling
 * Returns percentage with specified decimal places
 */
export function calculatePercentage(amount: number, total: number, decimals: number = 2): number {
  if (total === 0) return 0;
  const percentage = (amount / total) * 100;
  return roundTo(percentage, decimals);
}

/**
 * Calculates amount from percentage with proper rounding
 * Always returns an integer amount
 */
export function calculateAmountFromPercentage(percentage: number, total: number): number {
  const amount = (percentage / 100) * total;
  return roundAmount(amount);
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
 * For display: Rounds percentage UP to show user-friendly value
 * Example: 0.10999978 -> 0.11
 */
export function displayPercentage(amount: number, total: number, decimals: number = 2): string {
  if (total === 0) return "0";
  const percentage = (amount / total) * 100;
  return roundTo(percentage, decimals).toFixed(decimals);
}

/**
 * For validation max: Rounds percentage UP (ceiling) to prevent precision issues
 * This ensures user can always enter the displayed percentage
 */
export function maxPercentageForValidation(amount: number, total: number, decimals: number = 2): number {
  if (total === 0) return 0;
  const percentage = (amount / total) * 100;
  // Round UP to the next decimal place to account for display rounding
  const factor = Math.pow(10, decimals);
  return Math.ceil(percentage * factor) / factor;
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
 * NO compact notation (K/M) - always shows full numbers
 */
export function formatBDT(amount: number): string {
  // Use en-IN locale for Indian numbering system (Lakh/Crore commas)
  // Format: 1,00,00,000 (1 crore), 1,00,000 (1 lakh)
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0
  }).format(Math.round(amount));

  return `৳${formatted}`;
}

/**
 * Formats a plain number with Indian/Bangladeshi numbering system
 * Uses Lakh/Crore notation: 1,00,00,000 for 1 crore, 1,00,000 for 1 lakh
 */
export function formatIndianNumber(num: number): string {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0
  }).format(Math.round(num));
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
