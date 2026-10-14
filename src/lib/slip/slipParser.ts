import { Transaction } from '../../types/transaction';
import { parseToSatang } from '../money';
import { DecodedSlipQR } from './qrDecoder';

export interface ParsedSlipData {
  amountSatang?: number;
  amountFormatted?: string;
  date?: string; // YYYY-MM-DD
  time?: string; // HH:mm
  refNo?: string;
  bankName?: string;
  senderName?: string;
  recipientName?: string;
  matchedMemberWho?: string;
  rawOcrText: string;
  confidence: number;
}

/**
 * Comprehensive lookup dictionary for Thai and English months, abbreviations, and frequent OCR misreads
 */
export const THAI_MONTH_LOOKUP: Record<string, string> = {
  // Jan (มกราคม / ม.ค.)
  'มกราคม': '01', 'มกรา': '01', 'ม.ค.': '01', 'ม.ค': '01', 'มค': '01', 'ม,ค': '01', 'ม.a.': '01', 'ม.a': '01',
  'jan': '01', 'january': '01', 'jan.': '01', 'un': '01', 'u.n.': '01',

  // Feb (กุมภาพันธ์ / ก.พ.)
  'กุมภาพันธ์': '02', 'กุมภา': '02', 'ก.พ.': '02', 'ก.พ': '02', 'กพ': '02', 'ก,พ': '02', 'ก.w.': '02', 'ก.w': '02',
  'feb': '02', 'february': '02', 'feb.': '02', 'nw': '02', 'n.w.': '02',

  // Mar (มีนาคม / มี.ค.)
  'มีนาคม': '03', 'มีนา': '03', 'มี.ค.': '03', 'มี.ค': '03', 'มีค': '03', 'มี,ค': '03', 'มี.a.': '03', 'มี.a': '03',
  'mar': '03', 'march': '03', 'mar.': '03',

  // Apr (เมษายน / เม.ย.)
  'เมษายน': '04', 'เมษา': '04', 'เม.ย.': '04', 'เม.ย': '04', 'เมย': '04', 'เม,ย': '04', 'เม.u.': '04', 'เม.u': '04',
  'apr': '04', 'april': '04', 'apr.': '04',

  // May (พฤษภาคม / พ.ค.)
  'พฤษภาคม': '05', 'พฤษภา': '05', 'พ.ค.': '05', 'พ.ค': '05', 'พค': '05', 'พ,ค': '05', 'w.a.': '05', 'w.a': '05', 'พ.a.': '05',
  'may': '05',

  // Jun (มิถุนายน / มิ.ย.)
  'มิถุนายน': '06', 'มิถุนา': '06', 'มิ.ย.': '06', 'มิ.ย': '06', 'มิย': '06', 'มิ,ย': '06', 'มิ.u.': '06', 'มิ.u': '06',
  'jun': '06', 'june': '06', 'jun.': '06',

  // Jul (กรกฎาคม / ก.ค.)
  'กรกฎาคม': '07', 'กรกฎา': '07', 'ก.ค.': '07', 'ก.ค': '07', 'กค': '07', 'ก,ค': '07', 'ก.a.': '07', 'ก.a': '07', 'n.a.': '07', 'n.a': '07',
  'jul': '07', 'july': '07', 'jul.': '07',

  // Aug (สิงหาคม / ส.ค.)
  'สิงหาคม': '08', 'สิงหา': '08', 'ส.ค.': '08', 'ส.ค': '08', 'สค': '08', 'ส,ค': '08', 'ส.a.': '08', 'ส.a': '08', 'a.a.': '08', 'a.a': '08',
  'aug': '08', 'august': '08', 'aug.': '08',

  // Sep (กันยายน / ก.ย.) - very common in test slips
  'กันยายน': '09', 'กันยา': '09', 'ก.ย.': '09', 'ก.ย': '09', 'กย': '09', 'ก,ย': '09',
  'sep': '09', 'sept': '09', 'september': '09', 'sep.': '09',
  // OCR typos for ก.ย.
  'ถุย': '09', 'กุย': '09', 'ne': '09', 'ne.': '09', 'n.e.': '09', 'n.e': '09',
  'nย': '09', 'n.ย.': '09', 'ก.น.': '09', 'nu': '09', 'ny': '09', 'n.u.': '09', 'n.u': '09',

  // Oct (ตุลาคม / ต.ค.)
  'ตุลาคม': '10', 'ตุลา': '10', 'ต.ค.': '10', 'ต.ค': '10', 'ตค': '10', 'ต,ค': '10', 'ต.a.': '10', 'ต.a': '10', 'm.a.': '10', 'm.a': '10',
  'oct': '10', 'october': '10', 'oct.': '10',

  // Nov (พฤศจิกายน / พ.ย.)
  'พฤศจิกายน': '11', 'พฤศจิกา': '11', 'พ.ย.': '11', 'พ.ย': '11', 'พย': '11', 'พ,ย': '11', 'พ.u.': '11', 'พ.u': '11', 'w.u.': '11', 'w.u': '11',
  'nov': '11', 'november': '11', 'nov.': '11',

  // Dec (ธันวาคม / ธ.ค.)
  'ธันวาคม': '12', 'ธันวา': '12', 'ธ.ค.': '12', 'ธ.ค': '12', 'ธค': '12', 'ธ,ค': '12', 'ธ.a.': '12', 'ธ.a': '12',
  'dec': '12', 'december': '12', 'dec.': '12',
};

/**
 * Normalizes and matches month token against dictionary
 */
export function matchMonthToken(raw: string): string | undefined {
  const clean = raw.trim().toLowerCase().replace(/^[^\wก-๙]+|[^\wก-๙]+$/g, '');
  if (!clean) return undefined;
  if (THAI_MONTH_LOOKUP[clean]) return THAI_MONTH_LOOKUP[clean];
  if (THAI_MONTH_LOOKUP[clean + '.']) return THAI_MONTH_LOOKUP[clean + '.'];
  for (const [key, val] of Object.entries(THAI_MONTH_LOOKUP)) {
    if (clean === key || clean.includes(key)) return val;
  }
  return undefined;
}

/**
 * Parses OCR extracted text and optional QR code verification payload into structured slip data
 */
/**
 * Parses OCR extracted text and optional QR code verification payload into structured slip data
 */
export function parseSlipText(
  ocrText: string,
  decodedQR?: DecodedSlipQR | null,
  knownMembers: string[] = []
): ParsedSlipData {
  const result: ParsedSlipData = {
    rawOcrText: ocrText,
    confidence: 0,
  };

  // 1. Reference Number & Bank (QR Code takes absolute highest priority)
  if (decodedQR?.refNo) {
    result.refNo = decodedQR.refNo;
    result.bankName = decodedQR.bankName;
    result.confidence += 40;
  }

  // 2. Parse Reference Number from Text if not found from QR
  if (!result.refNo) {
    const refMatch = ocrText.match(/(?:เลขที่ทำรายการ|เลขที่รายการ|รหัสอ้างอิง|เลขที่อ้างอิง|หมายเลขอ้างอิง|รหัสธุรกรรม|เลขที่ธุรกรรม|รหัสรายการ|รหัสสลิป|slip\s*(?:id|no)?|ref(?:\s*no)?\.?|transaction\s*(?:id|no)?|tx\s*(?:id|no)?)\s*[:\-]?\s*([A-Za-z0-9]{10,35})/i);
    if (refMatch) {
      result.refNo = refMatch[1].trim();
      result.confidence += 25;
    } else {
      // Standalone transaction ID pattern (e.g. 016273123127ATF02002, 20261014...)
      const standaloneRef = ocrText.match(/\b(0[1-9][0-9]{10,14}[A-Za-z0-9]{5,15})\b/) ||
                            ocrText.match(/\b(20[2-3]\d[01]\d[0-3]\d[A-Za-z0-9]{10,25})\b/);
      if (standaloneRef) {
        result.refNo = standaloneRef[1].trim();
        result.confidence += 20;
      }
    }
  }

  // 2.1 Fallback Bank Detection from Text if QR didn't provide bankName
  if (!result.bankName) {
    const textBank = extractBankFromText(ocrText);
    if (textBank) {
      result.bankName = textBank;
      result.confidence += 15;
    }
  }

  // 3. Extract Transfer Amount (PromptPay QR or OCR text)
  const amount = decodedQR?.amountSatang || extractSlipAmount(ocrText);
  if (amount !== undefined && amount > 0) {
    result.amountSatang = amount;
    result.amountFormatted = decodedQR?.amountFormatted || (amount / 100).toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    result.confidence += 35;
  }

  // 4. Extract Date & Time (passing refNo for smart cross-validation)
  const dateTime = extractSlipDateTime(ocrText, result.refNo);
  if (dateTime.date) {
    result.date = dateTime.date;
    result.time = dateTime.time;
    result.confidence += 25;
  } else if (decodedQR?.isPromptPayPayment) {
    // Default today for live promptpay payment scan
    result.date = new Date().toISOString().slice(0, 10);
    const now = new Date();
    result.time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }

  // 5. Match Sender or Recipient against Known Household Members
  const matched = matchMemberNames(ocrText, knownMembers);
  result.matchedMemberWho = matched.matchedWho;
  result.senderName = matched.sender;
  result.recipientName = matched.recipient || decodedQR?.merchantName;

  return result;
}

/**
 * Extracts bank institution name from OCR text as a fallback when QR is unavailable
 */
export function extractBankFromText(ocrText: string): string | undefined {
  const text = ocrText.toLowerCase();
  if (text.includes('dime') || text.includes('kkp') || text.includes('เกียรตินาคิน')) {
    return 'ธนาคารเกียรตินาคินภัทร (KKP / Dime!)';
  }
  if (text.includes('scb') || text.includes('ไทยพาณิชย์') || text.includes('แม่มณี')) {
    return 'ธนาคารไทยพาณิชย์ (SCB)';
  }
  if (text.includes('bangkok bank') || text.includes('กรุงเทพ') || text.includes('bbl')) {
    return 'ธนาคารกรุงเทพ (BBL)';
  }
  if (text.includes('krungthai') || text.includes('กรุงไทย') || text.includes('ktb') || text.includes('เป๋าตัง') || text.includes('next')) {
    return 'ธนาคารกรุงไทย (KTB)';
  }
  if (
    text.includes('make by kbank') ||
    text.includes('make') ||
    text.includes('เมค') ||
    text.includes('cloud pocket') ||
    text.includes('พ็อกเก็ต') ||
    text.includes('kbank') ||
    text.includes('กสิกร') ||
    text.includes('kasikorn') ||
    text.includes('k plus') ||
    text.includes('k+')
  ) {
    return (text.includes('make') || text.includes('เมค') || text.includes('cloud pocket') || text.includes('พ็อกเก็ต'))
      ? 'ธนาคารกสิกรไทย (MAKE by KBank)'
      : 'ธนาคารกสิกรไทย (KBANK)';
  }
  if (text.includes('ttb') || text.includes('ทหารไทยธนชาต') || text.includes('ทีเอ็มบี') || text.includes('ธนชาต')) {
    return 'ธนาคารทหารไทยธนชาต (TTB)';
  }
  if (text.includes('krungsri') || text.includes('กรุงศรี') || text.includes('bay')) {
    return 'ธนาคารกรุงศรีอยุธยา (BAY)';
  }
  if (text.includes('gsb') || text.includes('ออมสิน') || text.includes('mymo')) {
    return 'ธนาคารออมสิน (GSB)';
  }
  if (text.includes('ghb') || text.includes('อาคารสงเคราะห์') || text.includes('ธอส') || text.includes('ghb all')) {
    return 'ธนาคารอาคารสงเคราะห์ (GHB)';
  }
  if (text.includes('baac') || text.includes('ธ.ก.ส') || text.includes('ธกส')) {
    return 'ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร (BAAC)';
  }
  if (text.includes('uob') || text.includes('ยูโอบี') || text.includes('tmrw')) {
    return 'ธนาคารยูโอบี (UOB)';
  }
  if (text.includes('cimb') || text.includes('ซีไอเอ็มบี')) {
    return 'ธนาคารซีไอเอ็มบี ไทย (CIMB)';
  }
  if (text.includes('lh bank') || text.includes('แลนด์ แอนด์ เฮ้าส์') || text.includes('lhbank')) {
    return 'ธนาคารแลนด์ แอนด์ เฮ้าส์ (LH Bank)';
  }
  if (text.includes('tisco') || text.includes('ทิสโก้')) {
    return 'ธนาคารทิสโก้ (TISCO)';
  }
  if (text.includes('ibank') || text.includes('อิสลามแห่งประเทศไทย')) {
    return 'ธนาคารอิสลามแห่งประเทศไทย (IBANK)';
  }
  if (text.includes('truemoney') || text.includes('ทรูมันนี่') || text.includes('true money')) {
    return 'ทรูมันนี่ วอลเล็ท (TrueMoney)';
  }
  if (text.includes('shopeepay') || text.includes('ช้อปปี้เพย์') || text.includes('shopee pay')) {
    return 'ช้อปปี้เพย์ (ShopeePay)';
  }
  if (text.includes('line bk') || text.includes('ไลน์บีเค')) {
    return 'LINE BK (กสิกรไทย)';
  }
  if (text.includes('พร้อมเพย์') || text.includes('promptpay')) {
    return 'พร้อมเพย์ (PromptPay)';
  }
  return undefined;
}

/**
 * Extracts Amount from slip text across all Thai bank layouts, ignoring 0.00 fees and dates
 */
export function extractSlipAmount(text: string): number | undefined {
  const lines = text.split('\n');

  // Primary keywords specifically denoting transfer amount
  const primaryAmountKeywords = [
    'จำนวนเงิน', 'จํานวนเงิน', 'ยอดเงิน', 'ยอดโอน', 'ยอดชำระ', 'ยอดรวม', 'ยอดสุทธิ',
    'amount', 'total', 'transfer amount', 'paid', 'transferred'
  ];

  // Secondary keywords (headers like Transfer, จ่ายบิล, โอนเงิน)
  const secondaryKeywords = [
    'จำนวน', 'จํานวน', 'transfer', 'โอนเงินสำเร็จ', 'โอนสำเร็จ', 'รายการสำเร็จ', 'จ่ายบิลสำเร็จ', 'ชำระเงินสำเร็จ'
  ];

  // Helper to check if a line is a date, time, account number, or fee
  const isIgnoredLine = (l: string) => {
    const low = l.toLowerCase();
    if (low.includes('ค่าธรรมเนียม') || low.includes('fee')) return true;
    if (low.includes('วันที่') || low.includes('date')) return true;
    if (low.includes('เวลา') && !low.includes('บาท') && !low.includes('thb') && !low.includes('จำนวน') && !low.includes('ยอด')) return true;
    if (low.includes('รหัสอ้างอิง') || low.includes('หมายเลขอ้างอิง') || low.includes('เลขที่ทำรายการ') || low.includes('เลขที่รายการ') || low.includes('transaction id')) return true;
    
    // Pure time line without amount keywords
    if (/\b[0-2]?\d:[0-5]\d\b/.test(low) && !low.includes('บาท') && !low.includes('thb') && !low.includes('จำนวน') && !low.includes('ยอด') && !low.includes('amount')) return true;
    
    // Time with Thai suffix "น." (e.g. "14.30 น.", "18:22 น.")
    if (/\b\d{1,2}[\.:]\d{2}\s*น\.?/.test(low) && !low.includes('บาท') && !low.includes('thb') && !low.includes('จำนวน') && !low.includes('ยอด') && !low.includes('amount')) return true;
    
    // Line containing Thai or English month abbreviation (e.g. "14 ต.ค. 69", "14 Oct 2026")
    const hasMonth = /(?:ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(low);
    if (hasMonth && !low.includes('บาท') && !low.includes('thb') && !low.includes('จำนวน') && !low.includes('ยอด') && !low.includes('amount')) return true;
    
    return false;
  };

  // Helper to normalize OCR noise in numbers (e.g. "1, 000.00" -> "1,000.00", "1,OOO.OO" -> "1,000.00")
  const cleanNumberLine = (raw: string): string => {
    let s = raw.trim();
    // Fix spaces around commas and dots in digits:
    s = s.replace(/(\d)\s*,\s*(\d)/g, '$1,$2');
    s = s.replace(/(\d)\s*\.\s*(\d)/g, '$1.$2');

    // Remove leading currency symbols:
    s = s.replace(/^[฿\$\¥\€\£]\s*/g, '');

    // In lines that look like numbers (with decimal point or currency), fix common OCR letter-for-digit confusions:
    if (/[\.,]\s*(\d{2}|[Oo]{2}|-)/.test(s) || /(?:บาท|thb|baht)/i.test(s)) {
      s = s.replace(/([0-9,])O([0-9,\.])/g, '$10$2');
      s = s.replace(/([0-9,])o([0-9,\.])/g, '$10$2');
      s = s.replace(/\.OO\b/g, '.00');
      s = s.replace(/\.oo\b/g, '.00');
      s = s.replace(/\.o0\b/g, '.00');
      s = s.replace(/\.0o\b/g, '.00');
      s = s.replace(/^[lI|]([0-9,\.])/g, '1$1');
      s = s.replace(/([,\.])[lI|]([0-9])/g, '$11$2');
    }

    return s;
  };

  // Helper to extract decimal number from line
  const parseDecimalFromLine = (target: string): number | undefined => {
    if (isIgnoredLine(target)) return undefined;

    // Clean any leading amount labels with optional colon (e.g. "จำนวนเงิน: 1000.00" -> "1000.00")
    let cleaned = target.replace(/(?:จำนวนเงิน|จํานวนเงิน|ยอดเงิน|ยอดโอน|ยอดชำระ|ยอดรวม|โอนเงินสำเร็จ|โอนสำเร็จ|รายการสำเร็จ|สำเร็จ|amount|total)\s*[:\-]?/gi, ' ').trim();
    cleaned = cleanNumberLine(cleaned);

    // Pattern A: Match standard decimal (e.g. "150.00 THB", "800.00", "552.12 บาท", "1,250.50", "฿1,000.00")
    const mDecimal = cleaned.match(/(?:^|[^\d,])(\d{1,3}(?:,\d{3})+|\d+)\s*[\.,]\s*(\d{2}|-)(?:\s*(?:บาท|thb|baht|\.-))?(?:[^\d]|$)/i);
    if (mDecimal) {
      const cents = mDecimal[2] === '-' ? '00' : mDecimal[2];
      const numStr = `${mDecimal[1].replace(/,/g, '')}.${cents}`;
      const satang = parseToSatang(numStr);
      // Skip 0.00 (fee or zero)
      if (satang > 0) return satang;
    }

    // Pattern B: Match integer amount followed by currency or prefix (e.g. "500 บาท", "150 THB", "฿1,000")
    const mInt = cleaned.match(/(?:^|[^\d,])(?:฿\s*)?(\d{1,3}(?:,\d{3})+|\d{2,7})\s*(?:บาท|thb|baht|\.-)(?:[^\d]|$)/i) ||
                 cleaned.match(/(?:^|\s)฿\s*(\d{1,3}(?:,\d{3})+|\d{2,7})(?:[^\d]|$)/i);
    if (mInt) {
      const numStr = mInt[1].replace(/,/g, '');
      const satang = parseToSatang(numStr);
      // Exclude years
      if (satang > 0 && satang !== 256700 && satang !== 256800 && satang !== 256900 && satang !== 202400 && satang !== 202500 && satang !== 202600) {
        return satang;
      }
    }
    return undefined;
  };

  // Pass 1: Strict search right on or up to 6 lines after PRIMARY keywords ('จำนวนเงิน', 'ยอดเงิน', 'โอนเงินสำเร็จ', etc.)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    const hasPrimary = primaryAmountKeywords.some((kw) => line.includes(kw));
    if (hasPrimary) {
      // 1a. Check on the same line
      const cleanLine = line.replace(/(?:จำนวนเงิน|จํานวนเงิน|ยอดเงิน|ยอดโอน|ยอดชำระ|ยอดรวม|โอนเงินสำเร็จ|โอนสำเร็จ|รายการสำเร็จ|สำเร็จ|amount|total)\s*[:\-]?/i, '').trim();
      const onSameLine = parseDecimalFromLine(cleanLine);
      if (onSameLine !== undefined) return onSameLine;

      // 1b. Check following lines (up to 6 lines down)
      for (let j = i + 1; j <= Math.min(i + 6, lines.length - 1); j++) {
        const amt = parseDecimalFromLine(lines[j]);
        if (amt !== undefined) return amt;
      }
    }
  }

  // Pass 2: Secondary keywords (e.g. Dime! where "Transfer" is at top, followed by "150.00 THB")
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    const hasSecondary = secondaryKeywords.some((kw) => line.includes(kw));
    if (hasSecondary) {
      for (let j = i; j <= Math.min(i + 6, lines.length - 1); j++) {
        const amt = parseDecimalFromLine(lines[j]);
        if (amt !== undefined) return amt;
      }
    }
  }

  // Pass 3: Lines explicitly containing currency suffix (THB, บาท, Baht, ฿)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.match(/(?:บาท|thb|baht|฿)/i) && !line.includes('ค่าธรรมเนียม') && !line.toLowerCase().includes('fee')) {
      const amt = parseDecimalFromLine(line);
      if (amt !== undefined) return amt;
    }
  }

  // Pass 4: Fallback scan for any non-zero decimal number, excluding fee lines and date/time
  const allMatches: number[] = [];
  for (const line of lines) {
    if (isIgnoredLine(line)) continue;
    const cleaned = cleanNumberLine(line);
    const regex = /(?:^|[^\d,])(\d{1,3}(?:,\d{3})+|\d+)\s*[\.,]\s*(\d{2})(?:[^\d]|$)/g;
    let match;
    while ((match = regex.exec(cleaned)) !== null) {
      const numStr = `${match[1].replace(/,/g, '')}.${match[2]}`;
      const satang = parseToSatang(numStr);
      // Skip 0.00 and standard year numbers
      if (satang > 0 && satang !== 256700 && satang !== 256800 && satang !== 256900 && satang !== 202400 && satang !== 202500 && satang !== 202600) {
        allMatches.push(satang);
      }
    }
  }

  if (allMatches.length > 0) {
    return allMatches[0];
  }

  return undefined;
}

/**
 * Extracts Time in HH:mm format from slip text with high-precision multi-strategy matching
 */
export function extractSlipTime(text: string): string | undefined {
  const lines = text.split('\n');
  const thaiSuffix = '(?:น\\.?|น|hrs|hr|am|pm|[4wuv]\\.)';

  // Strategy 1: Explicit Time Marker with "เวลา" or "time"
  // Examples: "เวลา 18:22 น.", "เวลา: 18:22", "เวลา : 18.22 น.", "Time: 18:22"
  for (const line of lines) {
    const timeLabelMatch = line.match(/(?:เวลา|time)\s*[:\-]?\s*([01]?\d|2[0-3])\s*[:\.]\s*([0-5]\d)(?:\s*[:\.]\s*[0-5]\d)?/i);
    if (timeLabelMatch) {
      const hh = timeLabelMatch[1].padStart(2, '0');
      const mm = timeLabelMatch[2];
      return `${hh}:${mm}`;
    }
  }

  // Strategy 2: Time with Thai 'น.' or English suffix (supports both : and .)
  // Examples: "12:31 น.", "12.31 น.", "12:31:45 น.", "12:31น.", "12.31น."
  const explicitSuffixRegex = new RegExp(`\\b([01]?\\d|2[0-3])\\s*[:\\.]\\s*([0-5]\\d)(?:\\s*[:\\.]\\s*[0-5]\\d)?\\s*${thaiSuffix}`, 'i');
  for (const line of lines) {
    const m = line.match(explicitSuffixRegex);
    if (m) {
      const hh = m[1].padStart(2, '0');
      const mm = m[2];
      return `${hh}:${mm}`;
    }
  }

  // Strategy 3: Time following a date on the same line
  // Examples: "14 ต.ค. 2567 18:22", "14 ต.ค. 67, 18:22", "14 ต.ค. 67 - 18:22", "14/10/2024 18:22", "14 ต.ค. 67 - 18.22"
  const dateTimeRegex = /(?:25\d{2}|20\d{2}|\b[567]\d)\s*(?:[\,\-•\|]|\s+)\s*([01]?\d|2[0-3])[:\.]([0-5]\d)(?::[0-5]\d)?\b/;
  for (const line of lines) {
    const m = line.match(dateTimeRegex);
    if (m) {
      const hh = m[1].padStart(2, '0');
      const mm = m[2];
      return `${hh}:${mm}`;
    }
  }

  // Strategy 4: 4-digit time glued to Thai 'น.' or OCR misreads (e.g. "1231 น.", "1231น.", "1231w.", "12314.")
  for (const line of lines) {
    const m = line.match(/\b([01]?\d|2[0-3])([0-5]\d)\s*(?:น\.?|น|[4wuv]\.)/i);
    if (m) {
      const hh = m[1].padStart(2, '0');
      const mm = m[2];
      return `${hh}:${mm}`;
    }
  }

  // Strategy 5: Standalone Time with COLON "HH:mm" (Never dot, to prevent matching decimals like 20.00)
  for (const line of lines) {
    const low = line.toLowerCase();
    if (low.includes('xxx') || low.includes('ค่าธรรมเนียม') || low.includes('fee') || low.includes('http') || low.includes('www')) continue;
    const colonMatch = line.match(/\b([01]?\d|2[0-3])[:]([0-5]\d)(?::[0-5]\d)?\b/);
    if (colonMatch) {
      const hh = colonMatch[1].padStart(2, '0');
      const mm = colonMatch[2];
      return `${hh}:${mm}`;
    }
  }

  // Strategy 6: 4 digits right after year (e.g. "2569 1231" or "69 1231")
  const afterYearMatch = text.match(/(?:25\d{2}|20\d{2}|\b[567]\d)\s+([01]\d|2[0-3])([0-5]\d)\b/);
  if (afterYearMatch) {
    const hh = afterYearMatch[1];
    const mm = afterYearMatch[2];
    return `${hh}:${mm}`;
  }

  return undefined;
}

/**
 * Extracts Date in YYYY-MM-DD format from slip text with single-line & multi-line wrapped support
 */
export function extractSlipDate(text: string): string | undefined {
  const lines = text.split('\n');

  // Strategy A: Thai/English text date within each single line or joined adjacent lines
  // Example: "04 ต.ค. 2569", "13 ก.ย. 2569", "12 ก.ย. 69", "30 Sep 2026", "14 ต.ค. 67, 18:22"
  const thaiDateRegex = /(?:^|[^\d])(\d{1,2})\s*[\s\.\-\/]?\s*([^\s\d]{2,15})\s*[\s\.\-\/]?\s*(\d{2,4})(?:[^\d]|$)/;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check single line
    const match = line.match(thaiDateRegex);
    if (match) {
      const day = parseInt(match[1], 10);
      const monthStr = matchMonthToken(match[2]);
      const rawYear = parseInt(match[3], 10);

      if (monthStr && day >= 1 && day <= 31) {
        const gregorianYear = convertBuddhistToGregorianYear(rawYear);
        if (gregorianYear >= 2020 && gregorianYear <= 2035) {
          const dayStr = day.toString().padStart(2, '0');
          return `${gregorianYear}-${monthStr}-${dayStr}`;
        }
      }
    }

    // Check joined line with next line (for wrapped date layouts)
    if (i + 1 < lines.length) {
      const joined = `${line.trim()} ${lines[i + 1].trim()}`;
      const jMatch = joined.match(thaiDateRegex);
      if (jMatch) {
        const day = parseInt(jMatch[1], 10);
        const monthStr = matchMonthToken(jMatch[2]);
        const rawYear = parseInt(jMatch[3], 10);

        if (monthStr && day >= 1 && day <= 31) {
          const gregorianYear = convertBuddhistToGregorianYear(rawYear);
          if (gregorianYear >= 2020 && gregorianYear <= 2035) {
            const dayStr = day.toString().padStart(2, '0');
            return `${gregorianYear}-${monthStr}-${dayStr}`;
          }
        }
      }
    }
  }

  // Strategy B: English Month Date "14 October 2024", "October 14, 2024", "14-Oct-2024", "14-Oct-24"
  const engDateRegex1 = /\b(\d{1,2})[\s\-\/\.](Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[\s\-\/\.](\d{2,4})\b/i;
  const engDateRegex2 = /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[\s\-\/\.](\d{1,2})(?:st|nd|rd|th)?[\s\,\-\/\.]+(\d{2,4})\b/i;
  for (const line of lines) {
    const m1 = line.match(engDateRegex1);
    if (m1) {
      const d = parseInt(m1[1], 10);
      const mStr = matchMonthToken(m1[2]);
      const y = parseInt(m1[3], 10);
      if (mStr && d >= 1 && d <= 31) {
        const year = convertBuddhistToGregorianYear(y);
        if (year >= 2020 && year <= 2035) {
          return `${year}-${mStr}-${d.toString().padStart(2, '0')}`;
        }
      }
    }
    const m2 = line.match(engDateRegex2);
    if (m2) {
      const mStr = matchMonthToken(m2[1]);
      const d = parseInt(m2[2], 10);
      const y = parseInt(m2[3], 10);
      if (mStr && d >= 1 && d <= 31) {
        const year = convertBuddhistToGregorianYear(y);
        if (year >= 2020 && year <= 2035) {
          return `${year}-${mStr}-${d.toString().padStart(2, '0')}`;
        }
      }
    }
  }

  // Strategy C: Numeric date "DD/MM/YYYY", "DD-MM-YYYY", "DD.MM.YYYY"
  const numericRegex = /(?:^|[^\d])(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})(?:[^\d]|$)/;
  for (const line of lines) {
    const match = line.match(numericRegex);
    if (match) {
      const d = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const y = parseInt(match[3], 10);
      if (d >= 1 && d <= 31 && m >= 1 && m <= 12) {
        const year = convertBuddhistToGregorianYear(y);
        if (year >= 2020 && year <= 2035) {
          return `${year}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
        }
      }
    }
  }

  // Strategy D: ISO date "YYYY-MM-DD" or "YYYY/MM/DD"
  const isoRegex = /\b(20\d{2}|25\d{2})[\/\-](\d{1,2})[\/\-](\d{1,2})\b/;
  for (const line of lines) {
    const match = line.match(isoRegex);
    if (match) {
      const y = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const d = parseInt(match[3], 10);
      if (d >= 1 && d <= 31 && m >= 1 && m <= 12) {
        const year = convertBuddhistToGregorianYear(y);
        if (year >= 2020 && year <= 2035) {
          return `${year}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
        }
      }
    }
  }

  return undefined;
}

/**
 * Decodes transaction timestamp embedded in bank reference numbers:
 * 1. KBank & MAKE reference format: 01 + YearDigit + DayOfYear (3 digits) + HHmm (4 digits)
 *    Example: 016273123127ATF02002 -> 2026-09-30 12:31
 * 2. Standard timestamp prefix: YYYYMMDDHHmmss or YYYYMMDD_HHmm (SCB, KTB, BBL, TTB)
 * 3. Compact date prefix: YYYYMMDD
 */
export function extractDateTimeFromRefNo(refNo?: string): { date?: string; time?: string } {
  if (!refNo || !refNo.trim()) return {};
  const clean = refNo.trim();

  // Pattern 1: KBank & MAKE reference format (01 + YearDigit + DayOfYear + HHmm)
  // Supports bank code prefixes like 0040162731231... or standalone 0162731231...
  const kbankMatch = clean.match(/(?:^|[A-Za-z0-9_-])01([4-9])([0-3][0-9]{2})([0-2][0-9][0-5][0-9])/);
  if (kbankMatch) {
    const yearDigit = parseInt(kbankMatch[1], 10);
    const dayOfYear = parseInt(kbankMatch[2], 10);
    const timeStr = kbankMatch[3];
    const hour = timeStr.slice(0, 2);
    const min = timeStr.slice(2, 4);

    // KBank year digit: 4=2024, 5=2025, 6=2026, 7=2027, 8=2028, 9=2029
    const year = 2020 + yearDigit;
    if (dayOfYear >= 1 && dayOfYear <= 366) {
      const d = new Date(Date.UTC(year, 0, 1));
      d.setUTCDate(dayOfYear);
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(d.getUTCDate()).padStart(2, '0');
      const hNum = parseInt(hour, 10);
      const mNum = parseInt(min, 10);
      if (hNum >= 0 && hNum <= 23 && mNum >= 0 && mNum <= 59) {
        return {
          date: `${yyyy}-${mm}-${dd}`,
          time: `${hour}:${min}`,
        };
      }
    }
  }

  // Pattern 2: Standard ISO compact timestamp YYYYMMDDHHmmss or YYYYMMDD_HHmm (SCB, KTB, BBL, TTB)
  const compactMatch = clean.match(/(20[2-3]\d)(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])(?:_|\s*)?([01]\d|2[0-3])([0-5]\d)/);
  if (compactMatch) {
    return {
      date: `${compactMatch[1]}-${compactMatch[2]}-${compactMatch[3]}`,
      time: `${compactMatch[4]}:${compactMatch[5]}`,
    };
  }

  // Pattern 3: Compact date only YYYYMMDD
  const dateOnlyMatch = clean.match(/(20[2-3]\d)(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])/);
  if (dateOnlyMatch) {
    return {
      date: `${dateOnlyMatch[1]}-${dateOnlyMatch[2]}-${dateOnlyMatch[3]}`,
    };
  }

  return {};
}

/**
 * Extracts Date & Time with Buddhist Era (พ.ศ.) to Gregorian conversion
 * Uses multi-strategy OCR extraction with Bank Ref No cross-validation
 */
export function extractSlipDateTime(
  text: string,
  refNo?: string
): { date?: string; time?: string } {
  let date = extractSlipDate(text);
  let time = extractSlipTime(text);

  // Recover missing date or time from bank reference number metadata (when OCR text is cut off or blurry)
  const fromRef = extractDateTimeFromRefNo(refNo);
  if (!date && fromRef.date) {
    date = fromRef.date;
  }
  if (!time && fromRef.time) {
    time = fromRef.time;
  }

  return { date, time };
}

/**
 * Formats date (YYYY-MM-DD) and time (HH:mm) into clear, friendly Thai display
 * Example:
 * formatSlipDisplayDate('2026-09-30', '12:31') -> '30 ก.ย. 2569 • 12:31 น.'
 * formatSlipDisplayDate('2026-09-30') -> '30 ก.ย. 2569'
 * formatSlipDisplayDate(undefined, '12:31') -> 'วันนี้ • 12:31 น.'
 * formatSlipDisplayDate() -> 'วันนี้'
 */
export function formatSlipDisplayDate(dateStr?: string, timeStr?: string): string {
  let datePart = 'วันนี้';

  if (dateStr) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);

      const thaiMonths = [
        'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
        'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
      ];

      const beYear = year < 2400 ? year + 543 : year;
      const monthName = thaiMonths[monthIdx] || parts[1];
      datePart = `${day} ${monthName} ${beYear}`;
    } else {
      datePart = dateStr;
    }
  }

  if (timeStr) {
    return `${datePart} • ${timeStr} น.`;
  }
  return datePart;
}

/**
 * Converts Thai Buddhist Era (BE) to Gregorian Year (CE)
 * Examples:
 * 2569 -> 2026
 * 2567 -> 2024
 * 69 -> 2026
 * 67 -> 2024
 * 2026 -> 2026
 */
export function convertBuddhistToGregorianYear(year: number): number {
  if (year >= 2400) {
    // 4-digit BE (e.g. 2569 - 543 = 2026)
    return year - 543;
  }
  if (year >= 50 && year <= 99) {
    // 2-digit BE (e.g. 69 -> 2569 - 543 = 2026)
    return 2500 + year - 543;
  }
  if (year >= 0 && year < 50) {
    // 2-digit 2600s BE or 2000s CE
    return 2000 + year;
  }
  return year;
}

/**
 * Extracts sender and recipient names from slip lines (e.g. จาก / ถึง / ไปยัง / ไปที่ / From / To)
 */
export function extractSenderRecipient(ocrText: string): { sender?: string; recipient?: string } {
  let sender: string | undefined;
  let recipient: string | undefined;

  const lines = ocrText.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check sender pattern
    if (!sender) {
      const match = line.match(/^(?:จาก|ผู้โอน|โอนจาก|ผู้ส่ง|จากบัญชี|บัญชีต้นทาง|ต้นทาง|ผู้โอนเงิน|บัญชีผู้โอน|from|sender)\s*[:\-]?\s*(.*)$/i);
      if (match) {
        let val = match[1].trim();
        if (!val && i + 1 < lines.length) {
          val = lines[i + 1].trim();
        }
        val = val.replace(/^(?:นาย|นาง|นางสาว|ms\.|mr\.|mrs\.)\s*/i, '');
        val = val.split(/\b(?:\d{3}[-\s]?\d|xxx|ธนาคาร|กรุงไทย|ไทยพาณิชย์|กรุงเทพ|กสิกร)/i)[0].trim();
        if (val.length >= 2) sender = val;
      }
    }

    // Check recipient pattern
    if (!recipient) {
      const match = line.match(/^(?:ไปยัง|ไปที่|ผู้รับ|ถึง|รับเงินโดย|โอนให้|โอนเงินให้|ผู้รับเงิน|บัญชีผู้รับเงิน|ส่งให้|ส่งไปยัง|โอนเข้า|โอนไปยัง|บัญชีปลายทาง|ปลายทาง|to|receiver|recipient)\s*[:\-]?\s*(.*)$/i);
      if (match) {
        let val = match[1].trim();
        if (!val && i + 1 < lines.length) {
          val = lines[i + 1].trim();
        }
        val = val.replace(/^(?:นาย|นาง|นางสาว|ms\.|mr\.|mrs\.)\s*/i, '');
        val = val.split(/\b(?:\d{3}[-\s]?\d|xxx|พร้อมเพย์|ธนาคาร|กสิกร|\()/i)[0].trim();
        if (val.length >= 2) recipient = val;
      }
    }
  }

  return { sender, recipient };
}

/**
 * Matches extracted names with household members (e.g. "โฟกัส" / "ภาณุเดช" or "แม่ต้นหยง" / "ธนภรณ์")
 */
export function matchMemberNames(
  ocrText: string,
  knownMembers: string[]
): { matchedWho?: string; sender?: string; recipient?: string } {
  const text = ocrText.toLowerCase();
  const extracted = extractSenderRecipient(ocrText);

  // Known member aliases
  const aliases: Record<string, string[]> = {
    โฟกัส: ['โฟกัส', 'ภาณุเดช', 'panudet', 'focus'],
    แม่ต้นหยง: ['แม่ต้นหยง', 'ต้นหยง', 'ธนภรณ์', 'tanaporn', 'tonyong'],
  };

  let matchedWho: string | undefined;

  for (const member of knownMembers) {
    const memberLower = member.toLowerCase();
    if (text.includes(memberLower)) {
      matchedWho = member;
      break;
    }
    // Check aliases
    const memberAliases = aliases[member] || [];
    for (const alias of memberAliases) {
      if (text.includes(alias.toLowerCase())) {
        matchedWho = member;
        break;
      }
    }
    if (matchedWho) break;
  }

  return {
    matchedWho: matchedWho || knownMembers[0],
    sender: extracted.sender,
    recipient: extracted.recipient,
  };
}

/**
 * Checks if a scanned slip reference number already exists in transaction history
 */
export function checkDuplicateSlip(
  refNo: string | undefined,
  existingTransactions: Transaction[]
): Transaction | null {
  if (!refNo || !refNo.trim()) return null;
  const clean = refNo.trim().toLowerCase();
  return existingTransactions.find((tx) => tx.refNo && tx.refNo.trim().toLowerCase() === clean) || null;
}
