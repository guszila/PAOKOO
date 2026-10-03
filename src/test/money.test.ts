import { describe, it, expect } from 'vitest';
import { parseToSatang, formatSatang, satangToBaht, isValidAmount } from '../lib/money';

describe('Money Utilities (Satang Arithmetic)', () => {
  it('correctly parses numbers and strings to exact integer satang without float errors', () => {
    expect(parseToSatang('100')).toBe(10000);
    expect(parseToSatang('100.5')).toBe(10050);
    expect(parseToSatang('100.50')).toBe(10050);
    expect(parseToSatang('100.05')).toBe(10005);
    expect(parseToSatang('0.01')).toBe(1);
    expect(parseToSatang('0.1')).toBe(10);
    expect(parseToSatang('1,500.75')).toBe(150075);
    expect(parseToSatang('1,000,000')).toBe(100000000);
    expect(parseToSatang(' 250.25 ฿ ')).toBe(25025);
    // Typical binary float pitfall in JS: 1.15 * 100 is 114.99999999999999
    expect(parseToSatang('1.15')).toBe(115);
    expect(parseToSatang(1.15)).toBe(115);
  });

  it('handles invalid or empty inputs safely', () => {
    expect(parseToSatang('')).toBe(0);
    expect(parseToSatang('abc')).toBe(0);
    expect(parseToSatang(-50)).toBe(0);
  });

  it('formats integer satang correctly with Thai commas and decimals', () => {
    expect(formatSatang(150000)).toBe('1,500.00');
    expect(formatSatang(50)).toBe('0.50');
    expect(formatSatang(5)).toBe('0.05');
    expect(formatSatang(0)).toBe('0.00');
    expect(formatSatang(-25050)).toBe('-250.50');
    expect(formatSatang(10000, { showSign: true })).toBe('+100.00');
    expect(formatSatang(150000, { showSymbol: true })).toBe('1,500.00 ฿');
  });

  it('converts satang to baht accurately', () => {
    expect(satangToBaht(150000)).toBe(1500);
    expect(satangToBaht(1250)).toBe(12.5);
    expect(satangToBaht(1)).toBe(0.01);
  });

  it('validates satang amounts correctly', () => {
    expect(isValidAmount(100)).toBe(true);
    expect(isValidAmount(1)).toBe(true);
    expect(isValidAmount(0)).toBe(false);
    expect(isValidAmount(-50)).toBe(false);
    expect(isValidAmount(10.5)).toBe(false); // must be integer
  });
});
