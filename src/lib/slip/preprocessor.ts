/**
 * Slip Image Preprocessor & Two-tier Compressor
 * Optimizes image for OCR and creates compact Base64 representations for 100% free Firestore storage.
 */

export interface ProcessedSlipImage {
  originalWidth: number;
  originalHeight: number;
  ocrCanvas: HTMLCanvasElement;
  ocrImageData: ImageData;
  thumbnailBase64: string; // < 35 KB, stored in transaction doc
  fullBase64: string; // < 350 KB, for viewing full slip
}

/**
 * Load an Image from File, Blob, or URL
 */
export function loadHtmlImage(fileOrUrl: File | Blob | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('ไม่สามารถโหลดรูปภาพสลิปได้: ' + e));

    if (typeof fileOrUrl === 'string') {
      img.src = fileOrUrl;
    } else {
      const url = URL.createObjectURL(fileOrUrl);
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.src = url;
    }
  });
}

/**
 * Process a slip image: prepares high-contrast OCR canvas and generates two-tier base64
 */
export async function preprocessSlipImage(source: File | Blob | string): Promise<ProcessedSlipImage> {
  const img = await loadHtmlImage(source);
  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;

  // 1. OCR Canvas (max 1400px for optimal speed & OCR accuracy)
  const ocrMaxDim = 1400;
  let ocrW = origW;
  let ocrH = origH;
  if (ocrW > ocrMaxDim || ocrH > ocrMaxDim) {
    if (ocrW > ocrH) {
      ocrH = Math.round((ocrH * ocrMaxDim) / ocrW);
      ocrW = ocrMaxDim;
    } else {
      ocrW = Math.round((ocrW * ocrMaxDim) / ocrH);
      ocrH = ocrMaxDim;
    }
  }

  const ocrCanvas = document.createElement('canvas');
  ocrCanvas.width = ocrW;
  ocrCanvas.height = ocrH;
  const ctx = ocrCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Cannot acquire canvas 2D context');

  ctx.drawImage(img, 0, 0, ocrW, ocrH);
  const ocrImageData = ctx.getImageData(0, 0, ocrW, ocrH);

  // 2. High-contrast Grayscale Boost for OCR
  // Enhance contrast to make small numbers and Thai text stand out against backgrounds
  const data = ocrImageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Perceived luminance
    let gray = 0.299 * r + 0.587 * g + 0.114 * b;

    // Contrast stretching (increase distance from midpoint 128)
    gray = (gray - 128) * 1.35 + 128;
    if (gray < 0) gray = 0;
    if (gray > 255) gray = 255;

    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
  }
  ctx.putImageData(ocrImageData, 0, 0);

  // 3. Compact Thumbnail (< 35 KB)
  const thumbnailBase64 = resizeToBase64(img, 320, 0.55);

  // 4. Full Viewing Image (< 350 KB)
  const fullBase64 = resizeToBase64(img, 960, 0.65);

  return {
    originalWidth: origW,
    originalHeight: origH,
    ocrCanvas,
    ocrImageData,
    thumbnailBase64,
    fullBase64,
  };
}

/**
 * Resizes an image and exports as Base64 JPEG with specified quality
 */
export function resizeToBase64(
  img: HTMLImageElement | HTMLCanvasElement,
  maxDimension: number,
  quality = 0.6
): string {
  const w = 'naturalWidth' in img ? img.naturalWidth : img.width;
  const h = 'naturalHeight' in img ? img.naturalHeight : img.height;

  let targetW = w;
  let targetH = h;
  if (targetW > maxDimension || targetH > maxDimension) {
    if (targetW > targetH) {
      targetH = Math.round((targetH * maxDimension) / targetW);
      targetW = maxDimension;
    } else {
      targetW = Math.round((targetW * maxDimension) / targetH);
      targetH = maxDimension;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.drawImage(img, 0, 0, targetW, targetH);
  return canvas.toDataURL('image/jpeg', quality);
}
