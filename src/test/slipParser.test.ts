import { describe, it, expect } from 'vitest';
import { parseBotSlipPayload } from '../lib/slip/qrDecoder';
import {
  parseSlipText,
  extractSlipAmount,
  extractSlipDateTime,
  convertBuddhistToGregorianYear,
  checkDuplicateSlip,
} from '../lib/slip/slipParser';
import { Transaction } from '../types/transaction';

describe('Slip Scanner & Parser Tests', () => {
  describe('Bank of Thailand Slip QR Payload Parser', () => {
    it('should correctly parse Image 1 QR payload (MAKE by KBank)', () => {
      const payload = '00410006000001010300402200462735o97eef7tpkHoF5102TH91049E4F';
      const result = parseBotSlipPayload(payload);

      expect(result.countryCode).toBe('TH');
      expect(result.bankCode).toBe('004');
      expect(result.bankName).toContain('ธนาคารกสิกรไทย');
      expect(result.refNo).toBe('0462735o97eef7tpkHoF');
    });

    it('should correctly parse Image 2 QR payload (K+ Capybara slip)', () => {
      const payload = '0041000600000101030040220016273123127ATF020025102TH910468DF';
      const result = parseBotSlipPayload(payload);

      expect(result.countryCode).toBe('TH');
      expect(result.bankCode).toBe('004');
      expect(result.bankName).toContain('ธนาคารกสิกรไทย');
      expect(result.refNo).toBe('016273123127ATF02002');
    });
  });

  describe('Buddhist Era to Gregorian Year Conversion', () => {
    it('converts 4-digit BE years correctly', () => {
      expect(convertBuddhistToGregorianYear(2569)).toBe(2026);
      expect(convertBuddhistToGregorianYear(2567)).toBe(2024);
      expect(convertBuddhistToGregorianYear(2568)).toBe(2025);
    });

    it('converts 2-digit BE years correctly', () => {
      expect(convertBuddhistToGregorianYear(69)).toBe(2026);
      expect(convertBuddhistToGregorianYear(67)).toBe(2024);
      expect(convertBuddhistToGregorianYear(68)).toBe(2025);
    });
  });

  describe('Slip Text Extraction', () => {
    it('extracts 1,000.00 THB and ignores 0.00 fee from Image 1 text', () => {
      const text = `
โอนเงินสำเร็จ make by KBank
30 ก.ย. 2569 21:44
ภาณุเดช ศ
ธนภรณ์ วะรัมย์
จำนวน
1,000.00 บาท
ค่าธรรมเนียม
0.00 บาท
เลขที่รายการ: 0462735o97eef7tpkHoF
      `;
      const amount = extractSlipAmount(text);
      expect(amount).toBe(100000); // 1,000.00 THB = 100,000 satang

      const dt = extractSlipDateTime(text);
      expect(dt.date).toBe('2026-09-30');
      expect(dt.time).toBe('21:44');
    });

    it('extracts 100.00 THB and 30 ก.ย. 69 from Image 2 text', () => {
      const text = `
โอนเงินสำเร็จ K+
30 ก.ย. 69 12:31 น.
นาย ภาณุเดช ศ
น.ส. ธนภรณ์ วะรัมย์
เลขที่รายการ:
016273123127ATF02002
จำนวน:
100.00 บาท
ค่าธรรมเนียม:
0.00 บาท
      `;
      const amount = extractSlipAmount(text);
      expect(amount).toBe(10000); // 100.00 THB = 10,000 satang

      const dt = extractSlipDateTime(text);
      expect(dt.date).toBe('2026-09-30');
      expect(dt.time).toBe('12:31');
    });

    it('fuses QR code and OCR text with household member matching', () => {
      const qrPayload = '00410006000001010300402200462735o97eef7tpkHoF5102TH91049E4F';
      const decodedQR = parseBotSlipPayload(qrPayload);

      const ocrText = `
โอนเงินสำเร็จ
30 ก.ย. 2569 21:44
ภาณุเดช ศ
จำนวน 1,000.00 บาท
      `;

      const parsed = parseSlipText(ocrText, decodedQR, ['โฟกัส', 'แม่ต้นหยง']);

      expect(parsed.amountSatang).toBe(100000);
      expect(parsed.amountFormatted).toBe('1,000.00');
      expect(parsed.date).toBe('2026-09-30');
      expect(parsed.refNo).toBe('0462735o97eef7tpkHoF');
      expect(parsed.bankName).toContain('ธนาคารกสิกรไทย');
      // Matched alias ภาณุเดช -> โฟกัส
      expect(parsed.matchedMemberWho).toBe('โฟกัส');
    });
  });

  describe('Duplicate Slip Check', () => {
    const existingTx: Transaction[] = [
      {
        id: 'tx-1',
        type: 'out',
        amount: 50000,
        who: 'โฟกัส',
        note: 'ซื้อของ',
        date: '2026-09-28',
        refNo: '0462735o97eef7tpkHoF',
        createdAt: '2026-09-28T10:00:00Z',
        createdBy: 'โฟกัส',
        updatedAt: '2026-09-28T10:00:00Z',
      },
    ];

    it('identifies duplicate slip when refNo matches existing transaction', () => {
      const dup = checkDuplicateSlip('0462735o97eef7tpkHoF', existingTx);
      expect(dup).not.toBeNull();
      expect(dup?.id).toBe('tx-1');
    });

    it('returns null when refNo is unique', () => {
      const dup = checkDuplicateSlip('016273123127ATF02002', existingTx);
      expect(dup).toBeNull();
    });
  });
});
