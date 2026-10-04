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
    const refMatch = ocrText.match(/(?:เลขที่รายการ|รหัสอ้างอิง|เลขที่อ้างอิง|Ref(?:\s*No)?\.?)\s*[:\-]?\s*([A-Za-z0-9]{12,35})/i);
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
  if (matched.matchedWho) {
    result.matchedMemberWho = matched.matchedWho;
    result.senderName = matched.sender;
    result.recipientName = matched.recipient;
  } else if (decodedQR?.merchantName) {
    result.recipientName = decodedQR.merchantName;
  }

  return result;
}

/**
 * Extracts Amount from slip text, ignoring 0.00 fee
 */
export function extractSlipAmount(text: string): number | undefined {
  const lines = text.split('\n');

  const amountKeywords = [
    'จำนวน', 'จํานวน', 'ยอดเงิน', 'ยอดโอน', 'ยอดชำระ', 'ยอดรวม',
    'โอนเงิน', 'amount', 'total', 'transfer', 'baht', 'thb'
  ];

  // Strategy A: Find line after or on amount keywords
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    const hasKeyword = amountKeywords.some((kw) => line.includes(kw));
    if (hasKeyword) {
      // Check current line and next 2 lines for amount
      for (let j = i; j <= Math.min(i + 2, lines.length - 1); j++) {
        const target = lines[j];
        if (target.includes('ค่าธรรมเนียม') || target.toLowerCase().includes('fee')) continue;

        // Match numbers with decimal (e.g. 500.00, 1,250.50, 500.-)
        const mDecimal = target.match(/(?:^|[^\d,])(\d{1,3}(?:,\d{3})+|\d+)\s*[\.,]\s*(\d{2}|-)(?:[^\d]|$)/);
        if (mDecimal) {
          const cents = mDecimal[2] === '-' ? '00' : mDecimal[2];
          const numStr = `${mDecimal[1].replace(/,/g, '')}.${cents}`;
          const satang = parseToSatang(numStr);
          if (satang > 0) return satang;
        }

        // Match integer amount followed by บาท, THB or preceding keyword
        const mInt = target.match(/(?:^|[^\d,])(\d{1,3}(?:,\d{3})+|\d{2,7})(?:\s*(?:บาท|thb|baht|\.-)|\s*$)/i);
        if (mInt) {
          const numStr = mInt[1].replace(/,/g, '');
          const satang = parseToSatang(numStr);
          // Exclude Buddhist/Gregorian years
          if (satang > 0 && satang !== 256700 && satang !== 256800 && satang !== 256900 && satang !== 202400 && satang !== 202500 && satang !== 202600) {
            return satang;
          }
        }
      }
    }
  }

  // Strategy B: Find all decimal numbers with 2 decimal places and exclude 0.00
  const allMatches: number[] = [];
  const regex = /(?:^|[^\d,])(\d{1,3}(?:,\d{3})+|\d+)\s*[\.,]\s*(\d{2})(?:[^\d]|$)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const numStr = `${match[1].replace(/,/g, '')}.${match[2]}`;
    const satang = parseToSatang(numStr);
    if (satang > 0) {
      allMatches.push(satang);
    }
  }

  if (allMatches.length > 0) {
    // Return largest non-zero amount (transfer amount is always >= fee)
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
  // Regex A: "30 ก.ย. 2569", "30 ne. 69", "30-Sep-2026", "30ก.ย.69"
  const thaiDateRegex = /(\d{1,2})\s*[\s\.\-\/]?\s*([^\s\d\n]{2,15})\s*[\s\.\-\/]?\s*(\d{2,4})/;
  const match = text.match(thaiDateRegex);

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

  // Regex B: Standard numeric date "DD/MM/YYYY", "DD-MM-YYYY", "DD.MM.YYYY"
  const numericMatch = text.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
  if (numericMatch) {
    const d = parseInt(numericMatch[1], 10);
    const m = parseInt(numericMatch[2], 10);
    const y = parseInt(numericMatch[3], 10);
    if (d >= 1 && d <= 31 && m >= 1 && m <= 12) {
      const year = convertBuddhistToGregorianYear(y);
      return `${year}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
    }
  }

  // Regex C: ISO date "YYYY-MM-DD"
  const isoMatch = text.match(/\b(20\d{2}|25\d{2})[\/\-](\d{1,2})[\/\-](\d{1,2})\b/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10);
    const d = parseInt(isoMatch[3], 10);
    if (d >= 1 && d <= 31 && m >= 1 && m <= 12) {
      const year = convertBuddhistToGregorianYear(y);
      return `${year}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
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
 * Matches extracted names with household members (e.g. "โฟกัส" / "ภาณุเดช" or "แม่ต้นหยง" / "ธนภรณ์")
 */
export function matchMemberNames(
  ocrText: string,
  knownMembers: string[]
): { matchedWho?: string; sender?: string; recipient?: string } {
  const text = ocrText.toLowerCase();

  // Known member aliases
  const aliases: Record<string, string[]> = {
    โฟกัส: ['โฟกัส', 'ภาณุเดช', 'panudet', 'focus'],
    แม่ต้นหยง: ['แม่ต้นหยง', 'ต้นหยง', 'ธนภรณ์', 'tanaporn', 'tonyong'],
  };

  for (const member of knownMembers) {
    const memberLower = member.toLowerCase();
    if (text.includes(memberLower)) {
      return { matchedWho: member };
    }
    // Check aliases
    const memberAliases = aliases[member] || [];
    for (const alias of memberAliases) {
      if (text.includes(alias.toLowerCase())) {
        return { matchedWho: member };
      }
    }
  }

  // If knownMembers is empty or didn't match, return first known member if any
  return { matchedWho: knownMembers[0] };
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
