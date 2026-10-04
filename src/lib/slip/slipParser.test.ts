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
});
