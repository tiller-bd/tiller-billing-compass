/**
 * Date utility functions for fiscal year calculations
 *
 * Fiscal Year Definition:
 * - FY 2024-25: July 1, 2024 → June 30, 2025
 * - FY 2025-26: July 1, 2025 → June 30, 2026
 */

export type YearType = 'calendar' | 'fiscal';

export interface ParsedYearValue {
  type: YearType;
  year: string;
}

export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Parse a combined year value (e.g., "cal-2024" or "fy-2024-25")
 * Returns the type and year components
 */
export function parseYearValue(value: string): ParsedYearValue {
  if (value.startsWith('fy-')) {
    return {
      type: 'fiscal',
      year: value.substring(3), // e.g., "2024-25"
    };
  }
  if (value.startsWith('cal-')) {
    return {
      type: 'calendar',
      year: value.substring(4), // e.g., "2024"
    };
  }
  // Default to calendar year for backwards compatibility
  return {
    type: 'calendar',
    year: value,
  };
}

/**
 * Get date range based on year type
 * For calendar year: Jan 1 - Dec 31
 * For fiscal year: July 1 (start year) - June 30 (end year)
 */
export function getYearDateRange(year: string, isFiscal: boolean): DateRange {
  if (isFiscal) {
    // Fiscal year format: "2024-25"
    const [startYear] = year.split('-').map(Number);
    const endYear = startYear + 1;

    return {
      start: new Date(`${startYear}-07-01T00:00:00.000Z`),
      end: new Date(`${endYear}-06-30T23:59:59.999Z`),
    };
  }

  // Calendar year format: "2024"
  const calYear = parseInt(year);
  return {
    start: new Date(`${calYear}-01-01T00:00:00.000Z`),
    end: new Date(`${calYear}-12-31T23:59:59.999Z`),
  };
}

/**
 * Get the current fiscal year in format "YYYY-YY" (e.g., "2024-25")
 * If current month is July or later, fiscal year starts this year
 * If current month is before July, fiscal year started last year
 */
export function getCurrentFiscalYear(): string {
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-11 (0 = Jan, 6 = July)
  const currentYear = now.getFullYear();

  // If July (6) or later, fiscal year is currentYear-nextYear
  // If before July, fiscal year is lastYear-currentYear
  const fiscalStartYear = currentMonth >= 6 ? currentYear : currentYear - 1;
  const fiscalEndYear = fiscalStartYear + 1;

  // Format as "2024-25"
  return `${fiscalStartYear}-${String(fiscalEndYear).slice(-2)}`;
}

/**
 * Generate fiscal year options for the dropdown
 * Returns array of fiscal year strings (e.g., ["2023-24", "2024-25", "2025-26"])
 */
export function getFiscalYearOptions(): string[] {
  const currentFiscalYear = getCurrentFiscalYear();
  const [currentStartYear] = currentFiscalYear.split('-').map(Number);

  const startFiscalYear = 2023; // Start from 2023-24
  const years: string[] = [];

  // Generate from oldest to current + 1 year for future planning
  for (let year = currentStartYear + 1; year >= startFiscalYear; year--) {
    const endYear = year + 1;
    years.push(`${year}-${String(endYear).slice(-2)}`);
  }

  return years;
}

/**
 * Generate calendar year options for the dropdown
 * Returns array of year strings (e.g., ["2024", "2025", "2026"])
 */
export function getCalendarYearOptions(): string[] {
  const currentYear = new Date().getFullYear();
  const startYear = 2024;
  const years: string[] = [];

  // Generate from current year + 1 down to start year
  for (let year = currentYear + 1; year >= startYear; year--) {
    years.push(year.toString());
  }

  return years;
}

/**
 * Get the default year value (current calendar year with prefix)
 */
export function getDefaultYearValue(): string {
  return `cal-${new Date().getFullYear()}`;
}

/**
 * Get fiscal year months in order (July to June)
 * Used for displaying revenue charts in fiscal year mode
 */
export function getFiscalYearMonths(): string[] {
  return ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
}

/**
 * Get calendar year months in order (January to December)
 * Used for displaying revenue charts in calendar year mode
 */
export function getCalendarYearMonths(): string[] {
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
}

/**
 * Get the fiscal month index (0-11) for a given date
 * July = 0, August = 1, ..., June = 11
 */
export function getFiscalMonthIndex(date: Date): number {
  const month = date.getMonth(); // 0-11 (Jan=0, Jul=6)
  // Convert to fiscal index: July(6) -> 0, Aug(7) -> 1, ..., Jun(5) -> 11
  return (month + 6) % 12;
}
