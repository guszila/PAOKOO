import jsQR from 'jsqr';
import { getBankInfo } from './bankCodes';

export interface DecodedSlipQR {
  raw: string;
  refNo?: string;
  bankCode?: string;
  bankName?: string;
  countryCode?: string;
  amountSatang?: number;
  amountFormatted?: string;
  merchantName?: string;
  isPromptPayPayment?: boolean;
}

/**
 * Parses Bank of Thailand (BOT) Standard EMVCo Slip Verification QR Code Payload
 * and PromptPay Thai QR Payment Payload
 */
export function parseBotSlipPayload(raw: string): DecodedSlipQR {
  const result: DecodedSlipQR = { raw };

  try {
    // Parse top-level TLV
    const topLevel = parseTLV(raw);

    // Tag 51 or Tag 58 is country code (TH)
    if (topLevel['51']) {
      result.countryCode = topLevel['51'];
    } else if (topLevel['58']) {
      result.countryCode = topLevel['58'];
    }

    // 1. Check for Standard BOT Slip Verification QR (Tag 00 -> sub 01 & 02)
    if (topLevel['00']) {
      const sub = parseTLV(topLevel['00']);
      // Sub-tag 01 is 3-digit Bank Code (e.g. 004 = KBANK, 014 = SCB)
      if (sub['01']) {
        result.bankCode = sub['01'];
        const bankInfo = getBankInfo(sub['01']);
        if (bankInfo) {
          result.bankName = `${bankInfo.name} (${bankInfo.shortName})`;
        }
      }
      // Sub-tag 02 is the Transaction Reference Number
      if (sub['02']) {
        result.refNo = sub['02'].trim();
      }
    }

    // 2. Check for PromptPay Thai QR Payment (Tag 54 = Amount, Tag 59 = Merchant/Payee)
    if (topLevel['54']) {
      const amtStr = topLevel['54'].trim();
      const num = parseFloat(amtStr);
      if (!isNaN(num) && num > 0) {
        result.amountSatang = Math.round(num * 100);
        result.amountFormatted = num.toLocaleString('th-TH', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        result.isPromptPayPayment = true;
      }
    }

    if (topLevel['59']) {
      result.merchantName = topLevel['59'].trim();
    }

    if (topLevel['62']) {
      const sub62 = parseTLV(topLevel['62']);
      if (sub62['05']) {
        result.refNo = sub62['05'].trim();
      } else if (sub62['01']) {
        result.refNo = sub62['01'].trim();
      } else if (sub62['07']) {
        result.refNo = sub62['07'].trim();
      }
    }

    // Fallback: If not parsed via standard TLV but raw contains standard alphanumeric ref pattern
    if (!result.refNo && raw.length >= 15) {
      const match = raw.match(/([A-Za-z0-9]{18,30})/);
      if (match) {
        result.refNo = match[1];
      }
    }
  } catch (err) {
    console.warn('Failed to parse BOT slip QR payload:', err);
  }

  return result;
}

/**
 * Helper to parse Tag-Length-Value (TLV) encoded strings
 */
function parseTLV(data: string): Record<string, string> {
  const map: Record<string, string> = {};
  let i = 0;
  while (i + 4 <= data.length) {
    const tag = data.substring(i, i + 2);
    const lenStr = data.substring(i + 2, i + 4);
    const len = parseInt(lenStr, 10);
    if (isNaN(len) || len < 0 || i + 4 + len > data.length) {
      break;
    }
    const val = data.substring(i + 4, i + 4 + len);
    map[tag] = val;
    i += 4 + len;
  }
  return map;
}

/**
 * Decodes QR code directly from ImageData using jsQR
 */
export function decodeQRFromImageData(imageData: ImageData): DecodedSlipQR | null {
  try {
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'attemptBoth',
    });
    if (!code || !code.data) return null;
    return parseBotSlipPayload(code.data);
  } catch (err) {
    console.warn('jsQR decoding failed:', err);
    return null;
  }
}
