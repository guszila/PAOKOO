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

const THAI_MONTH_MAP: Record<string, string> = {
  'ม.ค.': '01', 'มกราคม': '01', 'มกรา': '01',
  'ก.พ.': '02', 'กุมภาพันธ์': '02', 'กุมภา': '02',
  'มี.ค.': '03', 'มีนาคม': '03', 'มีนา': '03',
  'เม.ย.': '04', 'เมษายน': '04', 'เมษา': '04',
  'พ.ค.': '05', 'พฤษภาคม': '05', 'พฤษภา': '05',
  'มิ.ย.': '06', 'มิถุนายน': '06', 'มิถุนา': '06',
  'ก.ค.': '07', 'กรกฎาคม': '07', 'กรกฎา': '07',
  'ส.ค.': '08', 'สิงหาคม': '08', 'สิงหา': '08',
  'ก.ย.': '09', 'กันยายน': '09', 'กันยา': '09',
  'ต.ค.': '10', 'ตุลาคม': '10', 'ตุลา': '10',
  'พ.ย.': '11', 'พฤศจิกายน': '11', 'พฤศจิกา': '11',
  'ธ.ค.': '12', 'ธันวาคม': '12', 'ธันวา': '12',
};

// Also support common OCR typos in Thai month abbreviations
const THAI_MONTH_OCR_TYPOS: Record<string, string> = {
  'ถุย': '09', // OCR often misreads ก.ย. as ถุย or กุย
  'กุย': '09',
  'ne': '09',  // OCR in eng mode often misreads ก.ย. as ne
  'n.ย.': '09',
  'ก.ย': '09',
  'ต.ค': '10',
  'ม.ค': '01',
  'ก.พ': '02',
  'มี.ค': '03',
  'เม.ย': '04',
  'พ.ค': '05',
  'มิ.ย': '06',
  'ก.ค': '07',
  'ส.ค': '08',
  'พ.ย': '11',
  'ธ.ค': '12',
};

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

  // 3. Extract Transfer Amount
  const amount = extractSlipAmount(ocrText);
  if (amount !== undefined && amount > 0) {
    result.amountSatang = amount;
    result.amountFormatted = (amount / 100).toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    result.confidence += 35;
  }

  // 4. Extract Date & Time
  const dateTime = extractSlipDateTime(ocrText);
  if (dateTime.date) {
    result.date = dateTime.date;
    result.time = dateTime.time;
    result.confidence += 25;
  }

  // 5. Match Sender or Recipient against Known Household Members
  const matched = matchMemberNames(ocrText, knownMembers);
  if (matched.matchedWho) {
    result.matchedMemberWho = matched.matchedWho;
    result.senderName = matched.sender;
    result.recipientName = matched.recipient;
  }

  return result;
}

/**
 * Extracts Amount from slip text, ignoring 0.00 fee
 */
export function extractSlipAmount(text: string): number | undefined {
  const lines = text.split('\n');

  // Strategy A: Find line after or on "จำนวน" or "จํานวน"
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('จำนวน') || line.includes('จํานวน') || line.toLowerCase().includes('amount')) {
      // Check current line and next 2 lines for amount
      for (let j = i; j <= Math.min(i + 2, lines.length - 1); j++) {
        const target = lines[j];
        if (target.includes('ค่าธรรมเนียม') || target.includes('fee')) continue;
        const m = target.match(/(?:^|[^\d,])(\d{1,3}(?:,\d{3})+|\d+)\s*\.\s*(\d{2})(?:[^\d]|$)/);
        if (m) {
          const numStr = `${m[1].replace(/,/g, '')}.${m[2]}`;
          const satang = parseToSatang(numStr);
          if (satang > 0) return satang;
        }
      }
    }
  }

  // Strategy B: Find all decimal numbers with 2 decimal places and exclude 0.00
  const allMatches: number[] = [];
  const regex = /(?:^|[^\d,])(\d{1,3}(?:,\d{3})+|\d+)\s*\.\s*(\d{2})(?:[^\d]|$)/g;
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
 * Extracts Date & Time with Buddhist Era (พ.ศ.) to Gregorian conversion
 */
export function extractSlipDateTime(text: string): { date?: string; time?: string } {
  // Regex 1: "30 ก.ย. 2569 21:44" or "30 ก.ย. 69 12:31" or "30 กันยายน 2569"
  const thaiDateRegex = /(\d{1,2})\s+([^\s\d]{2,12})\s+(\d{2,4})(?:\s+(\d{1,2}:\d{2}))?/;
  const match = text.match(thaiDateRegex);

  if (match) {
    const day = parseInt(match[1], 10);
    const rawMonth = match[2].trim().replace(/\.$/, '');
    const rawYear = parseInt(match[3], 10);
    const time = match[4];

    let monthStr = THAI_MONTH_MAP[rawMonth] || THAI_MONTH_MAP[rawMonth + '.'];
    if (!monthStr) {
      // Check OCR typo table
      for (const [typo, m] of Object.entries(THAI_MONTH_OCR_TYPOS)) {
        if (rawMonth.includes(typo)) {
          monthStr = m;
          break;
        }
      }
    }

    if (monthStr && day >= 1 && day <= 31) {
      const gregorianYear = convertBuddhistToGregorianYear(rawYear);
      const dayStr = day.toString().padStart(2, '0');
      return {
        date: `${gregorianYear}-${monthStr}-${dayStr}`,
        time: time || undefined,
      };
    }
  }

  // Regex 2: Standard numeric date "DD/MM/YYYY" or "YYYY-MM-DD"
  const numericMatch = text.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
  if (numericMatch) {
    const d = parseInt(numericMatch[1], 10);
    const m = parseInt(numericMatch[2], 10);
    const y = parseInt(numericMatch[3], 10);
    if (d >= 1 && d <= 31 && m >= 1 && m <= 12) {
      const year = convertBuddhistToGregorianYear(y);
      return {
        date: `${year}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`,
      };
    }
  }

  return {};
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
