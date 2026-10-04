import { describe, it, expect } from 'vitest';
import { extractEmoji, getCategoryEmoji, setLeadingEmoji, detectSlipEmoji } from './emojis';

describe('Emoji Utilities', () => {
  it('should extract leading and trailing emojis from string', () => {
    expect(extractEmoji('🍜 ก๋วยเตี๋ยวเรือ')).toBe('🍜');
    expect(extractEmoji('ข้าวมันไก่ ☕')).toBe('☕');
    expect(extractEmoji('ไม่มีอีโมจิ')).toBe(null);
    expect(extractEmoji('🚗')).toBe('🚗');
    expect(extractEmoji('⚡️ ค่าไฟ')).toBe('⚡️');
  });

  it('should get correct category emoji', () => {
    expect(getCategoryEmoji('อาหาร')).toBe('🍜');
    expect(getCategoryEmoji('เดินทาง')).toBe('🚗');
    expect(getCategoryEmoji('ของใช้')).toBe('🛒');
    expect(getCategoryEmoji('ค่าน้ำ-ไฟ-เน็ต')).toBe('⚡');
    expect(getCategoryEmoji('ค่าบ้าน/ค่าเช่า')).toBe('🏠');
    expect(getCategoryEmoji('สุขภาพ')).toBe('💊');
    expect(getCategoryEmoji('ท่องเที่ยว')).toBe('✈️');
    expect(getCategoryEmoji('อื่นๆ')).toBe('🏷️');
    expect(getCategoryEmoji('🍕 พิซซ่า')).toBe('🍕');
  });

  it('should set or replace leading emoji in note', () => {
    // Empty note
    expect(setLeadingEmoji('', '☕')).toBe('☕ ');

    // Note without emoji
    expect(setLeadingEmoji('ชานมไข่มุก', '🧋')).toBe('🧋 ชานมไข่มุก');

    // Note already with emoji -> replaces leading emoji
    expect(setLeadingEmoji('🍜 ก๋วยเตี๋ยว', '🍔')).toBe('🍔 ก๋วยเตี๋ยว');
  });

  it('should detect merchant keywords and suggest emoji', () => {
    expect(detectSlipEmoji('Cafe Amazon สาขา ปตท.')).toBe('☕');
    expect(detectSlipEmoji('7-Eleven สาขาลาดพร้าว')).toBe('🏪');
    expect(detectSlipEmoji('PTT Station')).toBe('⛽');
    expect(detectSlipEmoji('Lotus Express')).toBe('🛒');
    expect(detectSlipEmoji('GrabFood Delivery')).toBe('🛵');
    expect(detectSlipEmoji('ShopeePay')).toBe('🛍️');
    expect(detectSlipEmoji('ทั่วไป')).toBe(null);
  });
});
