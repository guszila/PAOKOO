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
  'มกราคม': '01', 'มกรา': '01', 'ม.ค.': '01', 'ม.ค': '01', 'มค': '01', 'ม,ค': '01',
  'jan': '01', 'january': '01', 'un': '01', 'u.n.': '01',

  // Feb (กุมภาพันธ์ / ก.พ.)
  'กุมภาพันธ์': '02', 'กุมภา': '02', 'ก.พ.': '02', 'ก.พ': '02', 'กพ': '02', 'ก,พ': '02',
  'feb': '02', 'february': '02', 'nw': '02', 'n.w.': '02',

  // Mar (มีนาคม / มี.ค.)
  'มีนาคม': '03', 'มีนา': '03', 'มี.ค.': '03', 'มี.ค': '03', 'มีค': '03', 'มี,ค': '03',
  'mar': '03', 'march': '03',

  // Apr (เมษายน / เม.ย.)
  'เมษายน': '04', 'เมษา': '04', 'เม.ย.': '04', 'เม.ย': '04', 'เมย': '04', 'เม,ย': '04',
  'apr': '04', 'april': '04',

  // May (พฤษภาคม / พ.ค.)
  'พฤษภาคม': '05', 'พฤษภา': '05', 'พ.ค.': '05', 'พ.ค': '05', 'พค': '05', 'พ,ค': '05',
  'may': '05',

  // Jun (มิถุนายน / มิ.ย.)
  'มิถุนายน': '06', 'มิถุนา': '06', 'มิ.ย.': '06', 'มิ.ย': '06', 'มิย': '06', 'มิ,ย': '06',
  'jun': '06', 'june': '06',

  // Jul (กรกฎาคม / ก.ค.)
  'กรกฎาคม': '07', 'กรกฎา': '07', 'ก.ค.': '07', 'ก.ค': '07', 'กค': '07', 'ก,ค': '07',
  'jul': '07', 'july': '07',

  // Aug (สิงหาคม / ส.ค.)
  'สิงหาคม': '08', 'สิงหา': '08', 'ส.ค.': '08', 'ส.ค': '08', 'สค': '08', 'ส,ค': '08',
  'aug': '08', 'august': '08',

  // Sep (กันยายน / ก.ย.) - very common in test slips
  'กันยายน': '09', 'กันยา': '09', 'ก.ย.': '09', 'ก.ย': '09', 'กย': '09', 'ก,ย': '09',
  'sep': '09', 'sept': '09', 'september': '09',
  // OCR typos for ก.ย.
  'ถุย': '09', 'กุย': '09', 'ne': '09', 'ne.': '09', 'n.e.': '09', 'n.e': '09',
  'nย': '09', 'n.ย.': '09', 'ก.น.': '09', 'nu': '09', 'ny': '09',

  // Oct (ตุลาคม / ต.ค.)
  'ตุลาคม': '10', 'ตุลา': '10', 'ต.ค.': '10', 'ต.ค': '10', 'ตค': '10', 'ต,ค': '10',
  'oct': '10', 'october': '10',

  // Nov (พฤศจิกายน / พ.ย.)
  'พฤศจิกายน': '11', 'พฤศจิกา': '11', 'พ.ย.': '11', 'พ.ย': '11', 'พย': '11', 'พ,ย': '11',
  'nov': '11', 'november': '11',

  // Dec (ธันวาคม / ธ.ค.)
  'ธันวาคม': '12', 'ธันวา': '12', 'ธ.ค.': '12', 'ธ.ค': '12', 'ธค': '12', 'ธ,ค': '12',
  'dec': '12', 'december': '12',
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
    const refMatch = ocrText.match(/(?:เลขที่รายการ|รหัสอ้างอิง|เลขที่อ้างอิง|หมายเลขอ้างอิง|รหัสธุรกรรม|รหัสสลิป|slip\s*(?:id|no)?|ref(?:\s*no)?\.?)\s*[:\-]?\s*([A-Za-z0-9]{10,35})/i);
    if (refMatch) {
      result.refNo = refMatch[1].trim();
      result.confidence += 25;
    } else {
      // Standalone transaction ID pattern (e.g. 016273123127ATF02002)
      const standaloneRef = ocrText.match(/\b(0[1-9][0-9]{10,14}[A-Za-z0-9]{5,15})\b/);
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
  if (text.includes('krungthai') || text.includes('กรุงไทย') || text.includes('ktb') || text.includes('เป๋าตัง')) {
    return 'ธนาคารกรุงไทย (KTB)';
  }
  if (text.includes('kbank') || text.includes('กสิกร') || text.includes('kasikorn')) {
    return 'ธนาคารกสิกรไทย (KBANK)';
  }
  if (text.includes('ttb') || text.includes('ทหารไทยธนชาต') || text.includes('ทีเอ็มบี')) {
    return 'ธนาคารทหารไทยธนชาต (TTB)';
  }
  if (text.includes('krungsri') || text.includes('กรุงศรี') || text.includes('bay')) {
    return 'ธนาคารกรุงศรีอยุธยา (BAY)';
  }
  if (text.includes('gsb') || text.includes('ออมสิน')) {
    return 'ธนาคารออมสิน (GSB)';
  }
  if (text.includes('baac') || text.includes('ธ.ก.ส') || text.includes('ธกส')) {
    return 'ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร (BAAC)';
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
    'จำนวนเงิน', 'จํานวนเงิน', 'ยอดเงิน', 'ยอดโอน', 'ยอดชำระ', 'ยอดรวม',
    'amount', 'total'
  ];

  // Secondary keywords (headers like Transfer, จ่ายบิลสำเร็จ)
  const secondaryKeywords = [
    'จำนวน', 'จํานวน', 'โอนเงิน', 'จ่ายบิล', 'ชำระบิล', 'transfer'
  ];

  // Helper to check if a line is a date, time, account number, or fee
  const isIgnoredLine = (l: string) => {
    const low = l.toLowerCase();
    if (low.includes('ค่าธรรมเนียม') || low.includes('fee')) return true;
    if (low.includes('วันที่') || low.includes('date')) return true;
    if (low.includes('เวลา') || low.includes('time')) return true;
    if (low.includes('รหัส') || low.includes('ref') || low.includes('หมายเลข')) return true;
    if (low.includes(':')) return true; // HH:mm or key:value
    return false;
  };

  // Helper to extract decimal number from line
  const parseDecimalFromLine = (target: string): number | undefined => {
    if (isIgnoredLine(target)) return undefined;

    // Pattern A: Match standard decimal (e.g. "150.00 THB", "800.00", "552.12 บาท", "1,250.50")
    const mDecimal = target.match(/(?:^|[^\d,])(\d{1,3}(?:,\d{3})+|\d+)\s*[\.,]\s*(\d{2}|-)(?:\s*(?:บาท|thb|baht|\.-))?(?:[^\d]|$)/i);
    if (mDecimal) {
      const cents = mDecimal[2] === '-' ? '00' : mDecimal[2];
      const numStr = `${mDecimal[1].replace(/,/g, '')}.${cents}`;
      const satang = parseToSatang(numStr);
      // Skip 0.00 (fee or zero)
      if (satang > 0) return satang;
    }

    // Pattern B: Match integer amount followed by currency (e.g. "500 บาท", "150 THB")
    const mInt = target.match(/(?:^|[^\d,])(\d{1,3}(?:,\d{3})+|\d{2,7})\s*(?:บาท|thb|baht|\.-)(?:[^\d]|$)/i);
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

  // Pass 1: Strict search right on or up to 4 lines after PRIMARY keywords ('จำนวนเงิน', 'ยอดเงิน', etc.)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    const hasPrimary = primaryAmountKeywords.some((kw) => line.includes(kw));
    if (hasPrimary) {
      // 1a. Check on the same line (e.g. "จำนวนเงิน 800.00", "จำนวนเงิน 552.12 บาท")
      const cleanLine = line.replace(/(?:จำนวนเงิน|จํานวนเงิน|ยอดเงิน|ยอดโอน|ยอดชำระ|ยอดรวม|amount|total)\s*[:\-]?/i, '').trim();
      const onSameLine = parseDecimalFromLine(cleanLine);
      if (onSameLine !== undefined) return onSameLine;

      // 1b. Check following lines (up to 4 lines down, e.g. BBL where 56.00 THB is next line)
      for (let j = i + 1; j <= Math.min(i + 4, lines.length - 1); j++) {
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
      for (let j = i; j <= Math.min(i + 3, lines.length - 1); j++) {
        const amt = parseDecimalFromLine(lines[j]);
        if (amt !== undefined) return amt;
      }
    }
  }

  // Pass 3: Lines explicitly containing currency suffix (THB, บาท, Baht)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.match(/(?:บาท|thb|baht)/i) && !line.includes('ค่าธรรมเนียม') && !line.toLowerCase().includes('fee')) {
      const amt = parseDecimalFromLine(line);
      if (amt !== undefined) return amt;
    }
  }

  // Pass 4: Fallback scan for any non-zero decimal number, excluding fee lines and date/time
  const allMatches: number[] = [];
  for (const line of lines) {
    if (isIgnoredLine(line)) continue;
    const regex = /(?:^|[^\d,])(\d{1,3}(?:,\d{3})+|\d+)\s*[\.,]\s*(\d{2})(?:[^\d]|$)/g;
    let match;
    while ((match = regex.exec(line)) !== null) {
      const numStr = `${match[1].replace(/,/g, '')}.${match[2]}`;
      const satang = parseToSatang(numStr);
      if (satang > 0) {
        allMatches.push(satang);
      }
    }
  }

  if (allMatches.length > 0) {
    return Math.max(...allMatches);
  }

  return undefined;
}

/**
 * Extracts Time in HH:mm format from slip text
 */
export function extractSlipTime(text: string): string | undefined {
  // 1. Time with colon: "12:31", "21:44", "09:05:22"
  const colonMatch = text.match(/\b([01]?\d|2[0-3])[:]([0-5]\d)(?::[0-5]\d)?\b/);
  if (colonMatch) {
    const hh = colonMatch[1].padStart(2, '0');
    const mm = colonMatch[2];
    return `${hh}:${mm}`;
  }

  // 2. 4-digit time glued to Thai น. or OCR misread: "12314.", "1231น.", "1231 น.", "1231w."
  const gluedThaiMatch = text.match(/\b([01]?\d|2[0-3])([0-5]\d)\s*(?:น\.?|[4wuv]\.)/i);
  if (gluedThaiMatch) {
    const hh = gluedThaiMatch[1].padStart(2, '0');
    const mm = gluedThaiMatch[2];
    return `${hh}:${mm}`;
  }

  // 3. Time with dot and Thai น. or OCR artifacts: "12.31 น.", "12.31 4."
  const dotThaiMatch = text.match(/\b([01]?\d|2[0-3])[\.]([0-5]\d)\s*(?:น\.?|[4wuv]\.|\b)/i);
  if (dotThaiMatch) {
    const hh = dotThaiMatch[1].padStart(2, '0');
    const mm = dotThaiMatch[2];
    return `${hh}:${mm}`;
  }

  // 4. 4 digits right after year (e.g. "69 1231" or "2569 1231")
  const afterYearMatch = text.match(/(?:25\d{2}|20\d{2}|\b[567]\d)\s+([01]\d|2[0-3])([0-5]\d)\b/);
  if (afterYearMatch) {
    const hh = afterYearMatch[1];
    const mm = afterYearMatch[2];
    return `${hh}:${mm}`;
  }

  return undefined;
}

/**
 * Extracts Date in YYYY-MM-DD format from slip text
 */
export function extractSlipDate(text: string): string | undefined {
  const lines = text.split('\n');

  // Strategy A: Thai/English text date within each single line
  // Example: "04 ต.ค. 2569", "13 ก.ย. 2569", "12 ก.ย. 69", "30 Sep 2026"
  const thaiDateRegex = /(?:^|[^\d])(\d{1,2})\s*[\s\.\-\/]?\s*([^\s\d]{2,15})\s*[\s\.\-\/]?\s*(\d{2,4})(?:[^\d]|$)/;
  for (const line of lines) {
    const match = line.match(thaiDateRegex);
    if (match) {
      const day = parseInt(match[1], 10);
      const monthStr = matchMonthToken(match[2]);
      const rawYear = parseInt(match[3], 10);

      if (monthStr && day >= 1 && day <= 31) {
        const gregorianYear = convertBuddhistToGregorianYear(rawYear);
        const dayStr = day.toString().padStart(2, '0');
        return `${gregorianYear}-${monthStr}-${dayStr}`;
      }
    }
  }

  // Strategy B: Numeric date "DD/MM/YYYY", "DD-MM-YYYY", "DD.MM.YYYY"
  const numericRegex = /(?:^|[^\d])(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})(?:[^\d]|$)/;
  for (const line of lines) {
    const match = line.match(numericRegex);
    if (match) {
      const d = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const y = parseInt(match[3], 10);
      if (d >= 1 && d <= 31 && m >= 1 && m <= 12) {
        const year = convertBuddhistToGregorianYear(y);
        return `${year}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
      }
    }
  }

  // Strategy C: ISO date "YYYY-MM-DD"
  const isoRegex = /\b(20\d{2}|25\d{2})[\/\-](\d{1,2})[\/\-](\d{1,2})\b/;
  for (const line of lines) {
    const match = line.match(isoRegex);
    if (match) {
      const y = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const d = parseInt(match[3], 10);
      if (d >= 1 && d <= 31 && m >= 1 && m <= 12) {
        const year = convertBuddhistToGregorianYear(y);
        return `${year}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
      }
    }
  }

  return undefined;
}

/**
 * Decodes transaction timestamp embedded in bank reference numbers:
 * 1. KBank PromptPay/Slip Ref: 01 + Y (year digit, e.g. 6 = 2026) + DDD (day of year 001-366) + HHmm (time)
 *    Example: 016273123127ATF02002 -> 2026-09-30 12:31
 * 2. Standard timestamp prefix: YYYYMMDDHHmmss
 */
export function extractDateTimeFromRefNo(refNo?: string): { date?: string; time?: string } {
  if (!refNo || !refNo.trim()) return {};
  const clean = refNo.trim();

  // Pattern 1: KBank reference format (01 + YearDigit + DayOfYear + HHmm)
  const kbankMatch = clean.match(/^01([0-9])([0-3][0-9]{2})([0-2][0-9][0-5][0-9])/);
  if (kbankMatch) {
    const yearDigit = parseInt(kbankMatch[1], 10);
    const dayOfYear = parseInt(kbankMatch[2], 10);
    const timeStr = kbankMatch[3];
    const hour = timeStr.slice(0, 2);
    const min = timeStr.slice(2, 4);

    // KBank year digit: 4=2024, 5=2025, 6=2026, etc.
    const year = 2020 + yearDigit;
    if (dayOfYear >= 1 && dayOfYear <= 366) {
      const d = new Date(Date.UTC(year, 0, 1));
      d.setUTCDate(dayOfYear);
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(d.getUTCDate()).padStart(2, '0');
      return {
        date: `${yyyy}-${mm}-${dd}`,
        time: `${hour}:${min}`,
      };
    }
  }

  // Pattern 2: Standard ISO compact timestamp YYYYMMDDHHmmss
  const compactMatch = clean.match(/^(20\d{2})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])([01]\d|2[0-3])([0-5]\d)/);
  if (compactMatch) {
    return {
      date: `${compactMatch[1]}-${compactMatch[2]}-${compactMatch[3]}`,
      time: `${compactMatch[4]}:${compactMatch[5]}`,
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

  // If date or time missing, check reference number metadata
  if (!date || !time) {
    const fromRef = extractDateTimeFromRefNo(refNo);
    if (!date && fromRef.date) {
      date = fromRef.date;
    }
    if (!time && fromRef.time) {
      time = fromRef.time;
    }
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
      const match = line.match(/^(?:จาก|ผู้โอน|from)\s*[:\-]?\s*(.*)$/i);
      if (match) {
        let val = match[1].trim();
        if (!val && i + 1 < lines.length) {
          val = lines[i + 1].trim();
        }
        val = val.replace(/^(?:นาย|นาง|นางสาว|ms\.|mr\.|mrs\.)\s*/i, '');
        val = val.split(/\b(?:\d{3}[-\s]?\d|xxx|ธนาคาร|กรุงไทย|ไทยพาณิชย์|กรุงเทพ)/i)[0].trim();
        if (val.length >= 2) sender = val;
      }
    }

    // Check recipient pattern
    if (!recipient) {
      const match = line.match(/^(?:ไปยัง|ไปที่|ผู้รับ|ถึง|to)\s*[:\-]?\s*(.*)$/i);
      if (match) {
        let val = match[1].trim();
        if (!val && i + 1 < lines.length) {
          val = lines[i + 1].trim();
        }
        val = val.replace(/^(?:นาย|นาง|นางสาว|ms\.|mr\.|mrs\.)\s*/i, '');
        val = val.split(/\b(?:\d{3}[-\s]?\d|xxx|พร้อมเพย์|ธนาคาร|\()/i)[0].trim();
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
