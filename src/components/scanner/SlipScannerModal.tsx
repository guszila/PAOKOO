import React, { useState, useRef, useEffect } from 'react';
import { BottomSheet } from '../common/BottomSheet';
import { Button } from '../common/Button';
import { Camera, Image as ImageIcon, AlertTriangle, RefreshCw, ArrowRight, ShieldCheck, Wallet, QrCode, Sparkles } from 'lucide-react';
import { scanBankSlip, ScanProgressUpdate, ScanSlipResult } from '../../lib/slip/scannerService';
import { Transaction } from '../../types/transaction';
import { Pocket, PocketSummary } from '../../types/pocket';
import { formatSatang } from '../../lib/money';
import { formatSlipDisplayDate } from '../../lib/slip/slipParser';
import { LiveCameraScanner } from './LiveCameraScanner';
import { DecodedSlipQR } from '../../lib/slip/qrDecoder';
import { detectSlipEmoji } from '../../config/emojis';

interface SlipScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingTransactions: Transaction[];
  memberNames: string[];
  pockets?: Pocket[];
  pocketSummaries?: PocketSummary[];
  onApplySlip: (data: {
    amountSatang: number;
    date: string;
    time?: string;
    refNo: string;
    who: string;
    note: string;
    slipThumbnail: string;
    fullSlipBase64: string;
    pocketId?: string;
  }) => void;
}

export const SlipScannerModal: React.FC<SlipScannerModalProps> = ({
  isOpen,
  onClose,
  existingTransactions,
  memberNames,
  pockets = [],
  pocketSummaries = [],
  onApplySlip,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isLiveScanning, setIsLiveScanning] = useState(false);
  const [progress, setProgress] = useState<ScanProgressUpdate | null>(null);
  const [scanResult, setScanResult] = useState<ScanSlipResult | null>(null);
  const [editableAmount, setEditableAmount] = useState<string>('');
  const [selectedPocketId, setSelectedPocketId] = useState<string | undefined>(undefined);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setSelectedImage(null);
    setIsScanning(false);
    setIsLiveScanning(false);
    setProgress(null);
    setScanResult(null);
    setEditableAmount('');
    setSelectedPocketId(undefined);
    setErrorMsg(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // Whenever modal closes from outside or backdrop, guarantee state & camera are completely reset
  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen]);

  const applyScanResult = (result: ScanSlipResult) => {
    setScanResult(result);
    if (result.parsed.amountSatang && result.parsed.amountSatang > 0) {
      setEditableAmount((result.parsed.amountSatang / 100).toFixed(2));
    } else {
      setEditableAmount('');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    const previewUrl = URL.createObjectURL(file);
    setSelectedImage(previewUrl);
    setIsScanning(true);

    try {
      const result = await scanBankSlip(
        file,
        existingTransactions,
        memberNames,
        (update) => {
          setProgress(update);
        }
      );
      applyScanResult(result);
    } catch (err: any) {
      console.error('Scan failed:', err);
      setErrorMsg(err.message || 'ไม่สามารถสแกนสลิปได้ โปรดลองอีกครั้ง');
    } finally {
      setIsScanning(false);
    }
  };

  const handleLiveCapture = async (blob: Blob, _qr?: DecodedSlipQR | null) => {
    setIsLiveScanning(false);
    setErrorMsg(null);
    const previewUrl = URL.createObjectURL(blob);
    setSelectedImage(previewUrl);
    setIsScanning(true);

    try {
      const result = await scanBankSlip(
        blob,
        existingTransactions,
        memberNames,
        (update) => {
          setProgress(update);
        }
      );
      applyScanResult(result);
    } catch (err: any) {
      console.error('Scan failed:', err);
      setErrorMsg(err.message || 'ไม่สามารถสแกนสลิปได้ โปรดลองอีกครั้ง');
    } finally {
      setIsScanning(false);
    }
  };

  const handleApply = () => {
    if (!scanResult) return;
    const { parsed, thumbnailBase64, fullBase64 } = scanResult;

    const today = new Date().toISOString().slice(0, 10);
    const customNum = parseFloat(editableAmount);
    const amountSatang = !isNaN(customNum) && customNum > 0
      ? Math.round(customNum * 100)
      : (parsed.amountSatang || 0);
    const date = parsed.date || today;
    const refNo = parsed.refNo || '';
    const who = parsed.matchedMemberWho || memberNames[0] || '';

    // Smart default note with detected emoji
    let note = parsed.bankName ? `โอนเงินผ่าน ${parsed.bankName}` : 'โอนเงินผ่านธนาคาร';
    if (parsed.senderName && parsed.recipientName) {
      note = `${parsed.senderName} โอนให้ ${parsed.recipientName}`;
    }

    const detectedEmoji = detectSlipEmoji((parsed.recipientName || '') + ' ' + (parsed.rawOcrText || ''));
    if (detectedEmoji) {
      note = `${detectedEmoji} ${note}`;
    }

    onApplySlip({
      amountSatang,
      date,
      time: parsed.time,
      refNo,
      who,
      note,
      slipThumbnail: thumbnailBase64,
      fullSlipBase64: fullBase64,
      pocketId: selectedPocketId,
    });

    handleClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} title="สแกนสลิปโอนเงิน (QR & OCR)">
      <div className="space-y-4">
        {/* Hidden File Inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Live Camera Viewfinder Screen */}
        {isLiveScanning && (
          <LiveCameraScanner
            onCapture={handleLiveCapture}
            onPickGallery={() => {
              setIsLiveScanning(false);
              fileInputRef.current?.click();
            }}
            onFallbackNativeCamera={() => {
              setIsLiveScanning(false);
              cameraInputRef.current?.click();
            }}
            onCancel={() => setIsLiveScanning(false)}
          />
        )}

        {/* Initial Choice: Live Camera or Gallery */}
        {!selectedImage && !isScanning && !scanResult && !isLiveScanning && (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/40 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
              <ShieldCheck size={18} className="shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="font-semibold">ระบบสแกนสลิปออฟไลน์ ปลอดภัย 100%</p>
                <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80 mt-0.5 leading-relaxed">
                  ส่อง QR Code หรือสลิปผ่านกล้องสด หรืออัปโหลดรูปภาพ อ่านข้อมูลในเครื่องทันที
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Live Camera Scanner Button */}
              <button
                type="button"
                onClick={() => setIsLiveScanning(true)}
                className="relative flex flex-col items-center justify-center gap-2 p-5 rounded-3xl bg-emerald-500/10 dark:bg-emerald-950/40 border-2 border-emerald-500 hover:bg-emerald-500/20 transition-all group active:scale-95 shadow-sm text-emerald-800 dark:text-emerald-300"
              >
                <span className="absolute -top-2.5 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                  <Sparkles size={10} /> สแกนสด
                </span>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center transition-transform group-hover:scale-110 shadow-md shadow-emerald-500/30">
                  <QrCode size={26} strokeWidth={2} />
                </div>
                <div className="text-center">
                  <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 block">
                    เปิดกล้องสแกนสด
                  </span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400">ส่อง QR & กรอกทันที</span>
                </div>
              </button>

              {/* Gallery Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 p-5 rounded-3xl bg-surface-light dark:bg-surface-dark border-2 border-dashed border-border-light dark:border-border-dark hover:border-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-all group active:scale-95 shadow-sm"
              >
                <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 flex items-center justify-center transition-transform group-hover:scale-110">
                  <ImageIcon size={24} strokeWidth={1.75} />
                </div>
                <div className="text-center">
                  <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block">
                    เลือกจากอัลบั้ม
                  </span>
                  <span className="text-[10px] text-neutral-400">รูปภาพในเครื่อง</span>
                </div>
              </button>
            </div>

            {/* Native Camera Fallback */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="text-xs text-neutral-500 hover:text-emerald-600 dark:text-neutral-400 dark:hover:text-emerald-400 inline-flex items-center gap-1.5 transition-colors underline-offset-4 hover:underline"
              >
                <Camera size={13} />
                <span>หรือ ถ่ายรูปผ่านกล้องมือถือของระบบ</span>
              </button>
            </div>
          </div>
        )}

        {/* Scanning Progress with Animated Laser Beam */}
        {selectedImage && isScanning && (
          <div className="space-y-4 py-2">
            <div className="relative mx-auto w-full max-w-[280px] h-[340px] rounded-3xl overflow-hidden border border-border-light dark:border-border-dark shadow-md bg-black/10">
              <img
                src={selectedImage}
                alt="กำลังสแกนสลิป"
                className="w-full h-full object-cover filter brightness-90"
              />
              {/* Laser Scanning Beam */}
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] animate-bounce pointer-events-none" />
              <div className="absolute inset-0 bg-emerald-500/10 pointer-events-none" />
            </div>

            <div className="space-y-2 text-center">
              <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-300 px-2 font-medium">
                <span>{progress?.message || 'กำลังประมวลผลสลิป...'}</span>
                <span>{progress?.progress || 0}%</span>
              </div>
              <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                  style={{ width: `${progress?.progress || 10}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Scan Error */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-xs text-red-700 dark:text-red-300 space-y-3">
            <div className="flex items-center gap-2 font-medium">
              <AlertTriangle size={16} />
              <span>เกิดข้อผิดพลาดในการสแกน</span>
            </div>
            <p className="text-[11px] leading-relaxed">{errorMsg}</p>
            <Button variant="secondary" size="sm" onClick={resetState} className="w-full">
              <RefreshCw size={14} className="mr-1.5" />
              ลองใหม่อีกครั้ง
            </Button>
          </div>
        )}

        {/* Scan Result Preview & Confirmation */}
        {scanResult && !isScanning && (
          <div className="space-y-4">
            {/* Duplicate Slip Alert Banner */}
            {scanResult.duplicateTx && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                <AlertTriangle size={18} className="shrink-0 mt-0.5 text-amber-600" />
                <div>
                  <p className="font-bold">⚠️ แจ้งเตือน: สลิปนี้อาจถูกบันทึกไปแล้ว</p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">
                    พบรหัสอ้างอิงตรงกับรายการวันที่ {scanResult.duplicateTx.date} (ยอด {formatSatang(scanResult.duplicateTx.amount)})
                  </p>
                </div>
              </div>
            )}

            {/* Extracted Details Card */}
            <div className="p-4 rounded-3xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 mr-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider block">
                      ยอดเงินในสลิป
                    </span>
                    {!editableAmount && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                        ✏️ แตะเพื่อใส่ยอดเงิน
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={editableAmount}
                      onChange={(e) => setEditableAmount(e.target.value)}
                      className={`text-2xl font-black tabular-nums rounded-xl px-2.5 py-1 w-36 border transition-all ${
                        editableAmount
                          ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20'
                          : 'text-amber-600 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40'
                      } focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                    />
                    <span className="text-xs text-neutral-500 font-semibold">บาท</span>
                  </div>
                </div>

                {/* Slip Thumbnail */}
                {scanResult.thumbnailBase64 && (
                  <img
                    src={scanResult.thumbnailBase64}
                    alt="สลิป"
                    className="w-14 h-18 object-cover rounded-xl border border-border-light dark:border-border-dark shadow-sm shrink-0"
                  />
                )}
              </div>

              {/* Informational Tip if amount wasn't extracted by OCR */}
              {!editableAmount && (
                <div className="p-2.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                  💡 <strong>QR Code สลิปธนาคารไม่มีข้อมูลยอดเงิน</strong> (เป็นไปตามมาตรฐานความปลอดภัย BOT) ระบบดึงรหัสอ้างอิงและธนาคารให้แล้ว สามารถพิมพ์ยอดเงินด้านบนเพื่อนำไปลงบัญชีได้ทันทีครับ
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border-light dark:border-border-dark">
                <div>
                  <span className="text-[10px] text-neutral-400 block">วันที่และเวลา</span>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                    {formatSlipDisplayDate(scanResult.parsed.date, scanResult.parsed.time)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block">ธนาคาร</span>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate block">
                    {scanResult.parsed.bankName || 'ธนาคารทั่วไป'}
                  </span>
                </div>
              </div>

              {scanResult.parsed.refNo && (
                <div className="text-[11px] pt-1">
                  <span className="text-[10px] text-neutral-400 block">รหัสอ้างอิง (Ref No)</span>
                  <span className="font-mono text-neutral-700 dark:text-neutral-300 break-all select-all">
                    {scanResult.parsed.refNo}
                  </span>
                </div>
              )}

              {/* Pocket Selection in Slip Scanner */}
              {pockets && pockets.length > 0 && (
                <div className="pt-2 border-t border-border-light dark:border-border-dark space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    <Wallet size={12} />
                    <span>หักเงินจากกล่อง</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setSelectedPocketId(undefined)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                        !selectedPocketId
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white font-medium'
                          : 'bg-surface-light dark:bg-surface-dark text-neutral-600 dark:text-neutral-400 border-border-light dark:border-border-dark'
                      }`}
                    >
                      🏦 กองกลางหลัก
                    </button>
                    {pockets.map((p) => {
                      const isSelected = selectedPocketId === p.id;
                      const pSummary = pocketSummaries?.find((ps) => ps.pocket.id === p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedPocketId(p.id)}
                          className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600 font-medium'
                              : 'bg-surface-light dark:bg-surface-dark text-neutral-600 dark:text-neutral-400 border-border-light dark:border-border-dark'
                          }`}
                        >
                          👛 {p.name} {pSummary ? `(เหลือ ${formatSatang(pSummary.remainingSatang)} ฿)` : ''}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <Button variant="secondary" onClick={resetState} className="flex-1">
                สแกนใหม่
              </Button>
              <Button variant="primary" onClick={handleApply} className="flex-[2]">
                <span>นำไปลงบัญชี</span>
                <ArrowRight size={16} className="ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
};
