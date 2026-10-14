import { describe, it, expect } from 'vitest';
import { parseSlipText } from './slipParser';

describe('Bank Slip Parsing with Real Bank Slip Layouts', () => {
  // 1. Dime! (KKP Bank) - Amount at top, QR code middle/bottom right
  it('should parse Dime! (KKP) slip accurately', () => {
    const dimeOcrText = `
Transfer
150.00 THB
Fee 0.00 THB

From นาย ภาณุเดช ศรีวุฒิทรัพย์
x-1671
To นาย กิตติศักดิ์ ศรีวุฒิทรัพย์
x-0609

Date 04 ต.ค. 2569 - 11:49 น.
Slip ID 627711094040
dime!
Powered by KKP Bank
    `.trim();

    const parsed = parseSlipText(dimeOcrText, null, ['โฟกัส', 'แม่ต้นหยง']);

    expect(parsed.amountSatang).toBe(15000); // 150.00 THB
    expect(parsed.amountFormatted).toBe('150.00');
    expect(parsed.date).toBe('2026-10-04');
    expect(parsed.time).toBe('11:49');
    expect(parsed.refNo).toBe('627711094040');
    expect(parsed.bankName).toContain('KKP');
    expect(parsed.matchedMemberWho).toBe('โฟกัส'); // "ภาณุเดช" alias matches โฟกัส
  });

  // 2. SCB (ไทยพาณิชย์) - Amount at bottom center, QR code bottom right
  it('should parse SCB (ไทยพาณิชย์) slip accurately', () => {
    const scbOcrText = `
โอนเงินสำเร็จ
13 ก.ย. 2569 - 17:33
รหัสอ้างอิง: 202609132gzOBIYjyPJbkEiIP

จาก นาย ภาณุเดช ศ.
xxx-xxx235-2
ไปยัง นาย ภาณุเดช ศรีวุฒิทรัพย์
x-2253

จำนวนเงิน 800.00

ผู้รับเงินสามารถสแกนคิวอาร์โค้ดนี้เพื่อ
ตรวจสอบสถานะการโอนเงิน
SCB
    `.trim();

    const parsed = parseSlipText(scbOcrText, null, ['โฟกัส']);

    expect(parsed.amountSatang).toBe(80000); // 800.00 Baht
    expect(parsed.amountFormatted).toBe('800.00');
    expect(parsed.date).toBe('2026-09-13');
    expect(parsed.time).toBe('17:33');
    expect(parsed.refNo).toBe('202609132gzOBIYjyPJbkEiIP');
    expect(parsed.bankName).toContain('SCB');
  });

  // 3. Bangkok Bank (ธนาคารกรุงเทพ) - Amount in upper middle, 2-digit BE year 69
  it('should parse Bangkok Bank (BBL) slip accurately', () => {
    const bblOcrText = `
Bangkok Bank
รายการสำเร็จ
12 ก.ย. 69, 17:25
จำนวนเงิน
56.00 THB

จาก นาย ภาณุเดช
376-4-xxx249
ธนาคารกรุงเทพ

ไปที่ นาย ภาณุเดช ศรีวุฒิทรัพย์
063-xxx-7775
พร้อมเพย์

ค่าธรรมเนียม 0.00 THB

หมายเลขอ้างอิง 674709
เลขที่อ้างอิง 2026091217250124001304208
สแกนเพื่อตรวจสอบ
    `.trim();

    const parsed = parseSlipText(bblOcrText, null, ['โฟกัส']);

    expect(parsed.amountSatang).toBe(5600); // 56.00 THB
    expect(parsed.amountFormatted).toBe('56.00');
    expect(parsed.date).toBe('2026-09-12'); // '69 BE -> 2026
    expect(parsed.time).toBe('17:25');
    expect(parsed.refNo).toBe('2026091217250124001304208');
    expect(parsed.bankName).toContain('BBL');
  });

  // 4. Krungthai (กรุงไทย) - QR Code at TOP RIGHT, Amount at BOTTOM LEFT
  it('should parse Krungthai (KTB) slip with QR at top and Amount at bottom', () => {
    const ktbOcrText = `
Krungthai กรุงไทย
จ่ายบิลสำเร็จ
รหัสอ้างอิง C20260918626119708831
จาก
ภาณุเดช ศ***
กรุงไทย
XXX-X-XX942-2
ไปยัง
SUKI TEENOI-PRACHIN BURI
(010753600031501)

รหัสร้านค้า 401060202450001
รหัสธุรกรรม EDC17897337783269039

จำนวนเงิน 552.12 บาท
ค่าธรรมเนียม 0.00 บาท
วันที่ทำรายการ 18 ก.ย. 2569 - 19:16
    `.trim();

    const parsed = parseSlipText(ktbOcrText, null, ['โฟกัส']);

    expect(parsed.amountSatang).toBe(55212); // 552.12 บาท
    expect(parsed.amountFormatted).toBe('552.12');
    expect(parsed.date).toBe('2026-09-18');
    expect(parsed.time).toBe('19:16');
    expect(parsed.refNo).toBe('C20260918626119708831');
    expect(parsed.bankName).toContain('KTB');
    expect(parsed.recipientName).toContain('SUKI TEENOI');
  });

  // 5. KBank (กสิกรไทย / K PLUS)
  it('should parse KBank slip accurately', () => {
    const kbankOcrText = `
KBANK กสิกรไทย
โอนเงินสำเร็จ
016273123127ATF02002
30 ก.ย. 69 12:31 น.
จาก นาย ภาณุเดช ศรีวุฒิทรัพย์
ไปยัง นาย สมชาย ใจดี
จำนวนเงิน
1,250.00 บาท
ค่าธรรมเนียม 0.00 บาท
    `.trim();

    const parsed = parseSlipText(kbankOcrText, null, ['โฟกัส']);

    expect(parsed.amountSatang).toBe(125000); // 1,250.00 บาท
    expect(parsed.amountFormatted).toBe('1,250.00');
    expect(parsed.date).toBe('2026-09-30');
    expect(parsed.time).toBe('12:31');
    expect(parsed.refNo).toBe('016273123127ATF02002');
    expect(parsed.bankName).toContain('KBANK');
  });

  // 6. TTB (ทหารไทยธนชาต)
  it('should parse TTB slip accurately', () => {
    const ttbOcrText = `
ttb ทีเอ็มบีธนชาต
โอนเงินสำเร็จ
วันที่ 25 ส.ค. 2569 09:15 น.
รหัสอ้างอิง: TTB20260825998124
จาก ภาณุเดช
ไปยัง แม่ต้นหยง
จำนวนเงิน: 350.00 บาท
    `.trim();

    const parsed = parseSlipText(ttbOcrText, null, ['โฟกัส', 'แม่ต้นหยง']);

    expect(parsed.amountSatang).toBe(35000);
    expect(parsed.amountFormatted).toBe('350.00');
    expect(parsed.date).toBe('2026-08-25');
    expect(parsed.time).toBe('09:15');
    expect(parsed.refNo).toBe('TTB20260825998124');
    expect(parsed.bankName).toContain('TTB');
  });

  // 7. TrueMoney Wallet
  it('should parse TrueMoney Wallet slip accurately', () => {
    const trueMoneyText = `
TrueMoney ทรูมันนี่
โอนเงินสำเร็จ
หมายเลขอ้างอิง 500012398471
15 ต.ค. 2569 14:20
จำนวนเงิน 299.00 บาท
    `.trim();

    const parsed = parseSlipText(trueMoneyText, null, ['โฟกัส']);

    expect(parsed.amountSatang).toBe(29900);
    expect(parsed.amountFormatted).toBe('299.00');
    expect(parsed.date).toBe('2026-10-15');
    expect(parsed.time).toBe('14:20');
    expect(parsed.refNo).toBe('500012398471');
    expect(parsed.bankName).toContain('TrueMoney');
  });

  // 8. MAKE by KBank
  it('should parse MAKE by KBank slip accurately', () => {
    const makeOcrText = `
MAKE by KBank
โอนเงินสำเร็จ
14 ต.ค. 2569 15:45 น.
จำนวนเงิน
1,000.00 บาท
ค่าธรรมเนียม: 0.00 บาท
จาก: นาย ภาณุเดช ศรีวุฒิทรัพย์
ไปยัง: นาย สมชาย ยืมเงิน
ธนาคารกสิกรไทย
xxx-x-x5678-x
เลขที่ทำรายการ: 202610149876543210
    `.trim();

    const parsed = parseSlipText(makeOcrText, null, ['โฟกัส']);

    expect(parsed.amountSatang).toBe(100000); // 1,000.00 บาท
    expect(parsed.amountFormatted).toBe('1,000.00');
    expect(parsed.date).toBe('2026-10-14');
    expect(parsed.time).toBe('15:45');
    expect(parsed.refNo).toBe('202610149876543210');
    expect(parsed.bankName).toContain('MAKE');
    expect(parsed.recipientName).toContain('สมชาย');
  });

  // 9. MAKE by KBank with amount under title without label
  it('should parse MAKE by KBank slip with styled amount layout', () => {
    const makeOcrText = `
MAKE by KBank
โอนเงินสำเร็จ
14 ต.ค. 2569 เวลา 20:15 น.
1,500.00 THB
ผู้โอน: นาย ภาณุเดช
ผู้รับ: นาย เพื่อนร่วมงาน
เลขที่รายการ: 016287201524MAKE123
    `.trim();

    const parsed = parseSlipText(makeOcrText, null, ['โฟกัส']);

    expect(parsed.amountSatang).toBe(150000);
    expect(parsed.date).toBe('2026-10-14');
    expect(parsed.time).toBe('20:15');
    expect(parsed.refNo).toBe('016287201524MAKE123');
    expect(parsed.bankName).toContain('MAKE');
  });

  // 10. OCR Artifacts: spaces in amount, character substitutions, and dot-separated time
  it('should handle OCR spacing artifacts, dot time with น., and character substitutions in amount', () => {
    const noisyOcrText = `
KBank กสิกรไทย
โอนเงินสำเร็จ
วันที่ 14 ต.ค. 2569 เวลา 18.22 น.
จำนวนเงิน: 1, 000.00 บาท
ค่าธรรมเนียม: 0.00 บาท
รหัสอ้างอิง: 016288182200KBNK12345
จาก: นาย ภาณุเดช
ไปยัง: นางสาว มาลี
    `.trim();

    const parsed = parseSlipText(noisyOcrText, null, ['โฟกัส']);

    expect(parsed.amountSatang).toBe(100000); // 1, 000.00 -> 1,000.00 -> 100000 satang
    expect(parsed.amountFormatted).toBe('1,000.00');
    expect(parsed.date).toBe('2026-10-14');
    expect(parsed.time).toBe('18:22'); // 18.22 น. correctly parsed as 18:22
    expect(parsed.refNo).toBe('016288182200KBNK12345');
  });

  // 11. Small amount should not be confused with time
  it('should correctly distinguish small amount 20.00 from time 14:30', () => {
    const slipText = `
โอนเงินสำเร็จ
14 ต.ค. 69 14.30 น.
จำนวนเงิน 20.00 บาท
รหัสอ้างอิง: 202610141430001
    `.trim();

    const parsed = parseSlipText(slipText, null, ['โฟกัส']);

    expect(parsed.amountSatang).toBe(2000); // 20.00 -> 2000 satang (NOT 14.30 or 0)
    expect(parsed.amountFormatted).toBe('20.00');
    expect(parsed.time).toBe('14:30'); // Not 20:00!
    expect(parsed.date).toBe('2026-10-14');
  });

  // 12. Wrapped date across two lines and OCR month typo
  it('should parse wrapped date across lines and OCR month variations like ต.a.', () => {
    const wrappedDateSlip = `
SCB EASY
รายการสำเร็จ
วันที่ทำรายการ
15 ต.a. 2569
เวลา 08:45 น.
จำนวนเงิน 350.00 บาท
รหัสอ้างอิง 202610150845123456
    `.trim();

    const parsed = parseSlipText(wrappedDateSlip, null, ['โฟกัส']);

    expect(parsed.date).toBe('2026-10-15');
    expect(parsed.time).toBe('08:45');
    expect(parsed.amountSatang).toBe(35000);
    expect(parsed.amountFormatted).toBe('350.00');
  });

  // 13. English date formatting
  it('should parse English date formats like 14 Oct 2026', () => {
    const engDateSlip = `
Bangkok Bank
Transfer Successful
14 Oct 2026, 09:12
Amount 1,200.50 THB
Ref: 202610140912123456
    `.trim();

    const parsed = parseSlipText(engDateSlip, null, ['โฟกัส']);

    expect(parsed.date).toBe('2026-10-14');
    expect(parsed.time).toBe('09:12');
    expect(parsed.amountSatang).toBe(120050);
    expect(parsed.amountFormatted).toBe('1,200.50');
  });

  // 14. Fallback recovery of date & time from bank reference number when OCR date line is cropped
  it('should recover date and time from bank ref number when text date is missing or cropped', () => {
    const croppedSlip = `
KBANK โอนเงินสำเร็จ
จำนวนเงิน 500.00 บาท
016273123127ATF02002
    `.trim();

    const parsed = parseSlipText(croppedSlip, null, ['โฟกัส']);

    expect(parsed.amountSatang).toBe(50000);
    expect(parsed.date).toBe('2026-09-30'); // Day 273 of 2026 is 30 Sep
    expect(parsed.time).toBe('12:31'); // 1231
    expect(parsed.refNo).toBe('016273123127ATF02002');
  });
});

