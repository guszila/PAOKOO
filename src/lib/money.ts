/**
 * Money utilities for satang (integer) arithmetic to eliminate floating-point errors.
 * 1 THB = 100 satang
 */

/**
 * Converts a string or number input into an exact integer satang value without float inaccuracies.
 * Examples:
 * "100" -> 10000
 * "100.5" -> 10050
 * "100.05" -> 10005
 * "1,500.75" -> 150075
 * "0.2" -> 20
 */
export function parseToSatang(input: string | number): number {
  if (typeof input === 'number') {
    if (!Number.isFinite(input) || input < 0) return 0;
    // Round to nearest integer to avoid float residuals
    return Math.round(input * 100);
  }

  if (!input) return 0;
  // Clean string: remove currency symbols, commas, spaces
  const clean = input.replace(/[^0-9.]/g, '').trim();
  if (!clean) return 0;

  const parts = clean.split('.');
  const wholeStr = parts[0] || '0';
  const whole = parseInt(wholeStr, 10);
  if (isNaN(whole)) return 0;

  let satangFraction = 0;
  if (parts.length > 1) {
    // Take up to 2 decimal digits, pad with zero if needed
    const fractionStr = (parts[1] + '00').slice(0, 2);
    satangFraction = parseInt(fractionStr, 10);
    if (isNaN(satangFraction)) satangFraction = 0;
  }

  return whole * 100 + satangFraction;
}

/**
 * Converts integer satang back to a float for internal readouts if needed.
 */
export function satangToBaht(satang: number): number {
  if (!Number.isFinite(satang)) return 0;
  return satang / 100;
}

/**
 * Formats an integer satang into Thai Baht string with 2 decimal places.
 * Example: 150000 -> "1,500.00"
 */
export function formatSatang(
  satang: number,
  options?: {
    showSign?: boolean;
    showSymbol?: boolean;
    symbol?: string;
  }
): string {
  const { showSign = false, showSymbol = false, symbol = '฿' } = options || {};
  if (!Number.isFinite(satang)) return '0.00' + (showSymbol ? ` ${symbol}` : '');

  const isNegative = satang < 0;
  const absSatang = Math.abs(satang);
  const baht = Math.floor(absSatang / 100);
  const remainder = absSatang % 100;

  const formattedBaht = baht.toLocaleString('th-TH');
  const formattedFraction = remainder.toString().padStart(2, '0');

  let result = `${formattedBaht}.${formattedFraction}`;

  if (isNegative) {
    result = `-${result}`;
  } else if (showSign && satang > 0) {
    result = `+${result}`;
  }

  if (showSymbol) {
    result = `${result} ${symbol}`;
  }

  return result;
}

/**
 * Validates that an amount is a valid positive integer satang.
 */
export function isValidAmount(satang: number): boolean {
  return Number.isInteger(satang) && satang > 0;
}
