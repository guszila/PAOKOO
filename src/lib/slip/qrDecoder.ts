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

    // Fallback: Check if raw string is a verification URL or contains transaction ID
    if (!result.refNo) {
      const urlMatch = raw.match(/(?:ref|id|no|txn|refno)=([A-Za-z0-9]{10,35})/i) ||
                       raw.match(/\/([A-Za-z0-9]{15,35})(?:\?|$)/) ||
                       raw.match(/\b(01[0-9]{15,30}[A-Za-z0-9]*)\b/) ||
                       raw.match(/\b([A-Za-z0-9]{18,32})\b/);
      if (urlMatch) {
        result.refNo = urlMatch[1];
        if (!result.bankName && (raw.toLowerCase().includes('kbank') || raw.toLowerCase().includes('make'))) {
          result.bankName = 'ธนาคารกสิกรไทย (KBANK / MAKE)';
        }
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

/**
 * Robust Multi-Pass QR Decoder for Bank Slips:
 * 1. Full raw image data (works best for colored backgrounds like MAKE by KBank)
 * 2. Bottom 60% of image data (where bank QR codes reside, avoids interference from top banners/illustrations)
 * 3. High-contrast preprocessed image data as fallback
 */
export function tryDecodeQR(rawImageData: ImageData, ocrImageData?: ImageData): DecodedSlipQR | null {
  // Pass 1: Full raw image
  let res = decodeQRFromImageData(rawImageData);
  if (res?.refNo || res?.isPromptPayPayment) return res;

  // Pass 2: Bottom 60% crop (avoids top icons/decorations in MAKE by KBank)
  try {
    const startY = Math.floor(rawImageData.height * 0.4);
    const subHeight = rawImageData.height - startY;
    if (subHeight > 80 && rawImageData.width > 80) {
      const subData = new Uint8ClampedArray(rawImageData.width * subHeight * 4);
      const srcStart = startY * rawImageData.width * 4;
      subData.set(rawImageData.data.subarray(srcStart, srcStart + subData.length));
      const subImageData = new ImageData(subData, rawImageData.width, subHeight);
      res = decodeQRFromImageData(subImageData);
      if (res?.refNo || res?.isPromptPayPayment) return res;
    }
  } catch (e) {
    // Ignore canvas slicing error
  }

  // Pass 3: Preprocessed high-contrast grayscale image
  if (ocrImageData) {
    res = decodeQRFromImageData(ocrImageData);
    if (res?.refNo || res?.isPromptPayPayment) return res;

    // Pass 4: Bottom 60% crop of preprocessed image
    try {
      const startY = Math.floor(ocrImageData.height * 0.4);
      const subHeight = ocrImageData.height - startY;
      if (subHeight > 80 && ocrImageData.width > 80) {
        const subData = new Uint8ClampedArray(ocrImageData.width * subHeight * 4);
        const srcStart = startY * ocrImageData.width * 4;
        subData.set(ocrImageData.data.subarray(srcStart, srcStart + subData.length));
        const subImageData = new ImageData(subData, ocrImageData.width, subHeight);
        res = decodeQRFromImageData(subImageData);
        if (res?.refNo || res?.isPromptPayPayment) return res;
      }
    } catch (e) {
      // Ignore crop error
    }
  }

  return null;
}
