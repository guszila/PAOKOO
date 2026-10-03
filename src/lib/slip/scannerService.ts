import Tesseract from 'tesseract.js';
import { decodeQRFromImageData, DecodedSlipQR } from './qrDecoder';
import { preprocessSlipImage, ProcessedSlipImage } from './preprocessor';
import { parseSlipText, ParsedSlipData, checkDuplicateSlip } from './slipParser';
import { Transaction } from '../../types/transaction';

export interface ScanProgressUpdate {
  status: 'preprocessing' | 'decoding_qr' | 'recognizing_ocr' | 'completed' | 'error';
  progress: number; // 0 - 100
  message: string;
}

export interface ScanSlipResult {
  parsed: ParsedSlipData;
  thumbnailBase64: string;
  fullBase64: string;
  decodedQR: DecodedSlipQR | null;
  duplicateTx: Transaction | null;
}

/**
 * Full On-Device Bank Slip Scanner Pipeline:
 * 1. Image Preprocessing (Canvas grayscale & contrast enhancement)
 * 2. Instant QR Code Slip Verification Decoder (Bank & Ref No)
 * 3. Tesseract.js Thai+English OCR (Amount, Date/Time, Names)
 * 4. Fused Parser & Duplicate Check
 */
export async function scanBankSlip(
  source: File | Blob | string,
  existingTransactions: Transaction[] = [],
  knownMembers: string[] = [],
  onProgress?: (update: ScanProgressUpdate) => void
): Promise<ScanSlipResult> {
  // Step 1: Preprocess Image
  onProgress?.({
    status: 'preprocessing',
    progress: 10,
    message: 'กำลังประมวลผลและปรับความคมชัดของรูปภาพ...',
  });

  const processed: ProcessedSlipImage = await preprocessSlipImage(source);

  // Step 2: Instant QR Code Decoding (Sub-50ms)
  onProgress?.({
    status: 'decoding_qr',
    progress: 25,
    message: 'กำลังตรวจสอบ QR Code สลิปธนาคาร...',
  });

  const decodedQR = decodeQRFromImageData(processed.ocrImageData);

  // Step 3: OCR Recognition using Tesseract.js Web Worker
  onProgress?.({
    status: 'recognizing_ocr',
    progress: 35,
    message: 'กำลังอ่านตัวอักษรและยอดเงินด้วย OCR...',
  });

  let ocrText = '';
  try {
    const ocrResult = await Tesseract.recognize(
      processed.ocrCanvas,
      'tha+eng',
      {
        logger: (m) => {
          if (m.status === 'recognizing text' && typeof m.progress === 'number') {
            const pct = Math.round(35 + m.progress * 55); // scale 35% - 90%
            onProgress?.({
              status: 'recognizing_ocr',
              progress: pct,
              message: `กำลังอ่านตัวอักษร... (${Math.round(m.progress * 100)}%)`,
            });
          }
        },
      }
    );
    ocrText = ocrResult.data.text;
  } catch (ocrErr) {
    console.warn('Tesseract OCR error:', ocrErr);
    // If OCR fails but QR code was decoded, we can still proceed with QR data
    if (!decodedQR?.refNo) {
      throw new Error('ไม่สามารถอ่านข้อมูลจากสลิปได้ โปรดลองถ่ายใหม่ให้ชัดเจนขึ้น');
    }
  }

  // Step 4: Parse & Cross-match
  onProgress?.({
    status: 'completed',
    progress: 95,
    message: 'กำลังประมวลผลและตรวจสอบความถูกต้อง...',
  });

  const parsed = parseSlipText(ocrText, decodedQR, knownMembers);
  const duplicateTx = checkDuplicateSlip(parsed.refNo, existingTransactions);

  onProgress?.({
    status: 'completed',
    progress: 100,
    message: 'สแกนข้อมูลสำเร็จ!',
  });

  return {
    parsed,
    thumbnailBase64: processed.thumbnailBase64,
    fullBase64: processed.fullBase64,
    decodedQR,
    duplicateTx,
  };
}
