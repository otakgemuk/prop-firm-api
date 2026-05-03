// discountUtils.ts — Utilities for displaying discounts and missing data clearly

/**
 * Format a price with discount applied
 * Example: formatDiscountedPrice(155, 50) → "$155 (-50% → $77.50)"
 */
export function formatDiscountedPrice(basePrice: number, discountPercent: number): string {
  if (!discountPercent || discountPercent <= 0) {
    return `$${basePrice.toFixed(2)}`;
  }
  
  const discountedPrice = basePrice - (basePrice * discountPercent) / 100;
  return `$${basePrice.toFixed(0)} (-${discountPercent}% → $${discountedPrice.toFixed(2)})`;
}

/**
 * Format a value, showing "Not specified" for missing/null/0 values
 * Example: formatValue(null) → "Not specified"
 */
export function formatValue(value: any): string {
  if (value === null || value === undefined || value === 0 || value === "") {
    return "Not specified";
  }
  return String(value);
}

/**
 * Calculate actual total cost with discount applied
 * Example: calcDiscountedTotal(155, 0, 50) → 77.50
 */
export function calcDiscountedTotal(evalFee: number, activationFee: number, discountPercent: number): number {
  const discountedEval = evalFee - (evalFee * discountPercent) / 100;
  return Math.round((discountedEval + activationFee) * 100) / 100;
}

/**
 * Format timestamp for display
 * Example: formatTimestamp("2026-05-03T16:45:00Z") → "May 03, 2026 at 4:45 PM UTC"
 */
export function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'UTC'
  }) + ' UTC';
}

/**
 * Get a visual consistency check indicator
 * Returns warning if total doesn't match eval+activation (allowing for discount)
 */
export function getConsistencyWarning(
  evalFee: number,
  activationFee: number,
  total: number,
  discountPercent: number = 0
): string | null {
  const expectedTotal = calcDiscountedTotal(evalFee, activationFee, discountPercent);
  const tolerance = 0.1; // Allow 10 cents difference for rounding
  
  if (Math.abs(expectedTotal - total) > tolerance) {
    return `⚠️ Total mismatch: Expected $${expectedTotal.toFixed(2)}, got $${total.toFixed(2)}`;
  }
  
  return null;
}
