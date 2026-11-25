import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, TransactionType } from '../../types/transaction';
import { BottomSheet } from '../common/BottomSheet';
import { ConfirmModal } from '../common/ConfirmModal';
import { parseToSatang, satangToBaht, formatSatang } from '../../lib/money';
import { checkOverRepayment, getOutstandingForPerson } from '../../lib/summary';
import { DEFAULT_EXPENSE_CATEGORIES } from '../../config/categories';
import {
  Camera,
  Trash2,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  HandCoins,
  CornerDownLeft,
  AlertCircle,
  X,
  Wallet,
  Smile,
  Image as ImageIcon,
  Calendar,
  User,
  ChevronDown,
} from 'lucide-react';
import { SlipViewerModal } from '../scanner/SlipViewerModal';
import { SlipScannerModal } from '../scanner/SlipScannerModal';
import { Pocket, PocketSummary } from '../../types/pocket';
import { EmojiPickerModal } from '../common/EmojiPickerModal';
import { setLeadingEmoji, getCategoryEmoji, extractEmoji, detectSlipEmoji } from '../../config/emojis';
import { scanBankSlip, ScanProgressUpdate } from '../../lib/slip/scannerService';

interface TransactionFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>, id?: string) => void;
  onDelete?: (id: string) => void;
  initialTransaction?: Transaction | null;
  prefill?: {
    type?: TransactionType;
    who?: string;
    amount?: number; // satang
    note?: string;
    category?: string;
    date?: string;
    time?: string;
    refNo?: string;
    slipThumbnail?: string;
    fullSlipBase64?: string;
    pocketId?: string;
  } | null;
  existingTransactions: Transaction[];
  memberNames: string[];
  currentMemberName?: string;
  categories?: string[];
  pockets?: Pocket[];
  pocketSummaries?: PocketSummary[];
  onOpenScanner?: (currentType?: TransactionType) => void;
}

const getLocalDateString = (offsetDays: number = 0): string => {
  const d = new Date();
  if (offsetDays !== 0) d.setDate(d.getDate() + offsetDays);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const getLocalTimeString = (): string => {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};

const formatDisplayDate = (dateStr: string): string => {
  if (!dateStr) return 'เลือกวันที่';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return dateStr;
  const thaiMonths = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];
  const thaiYear = y > 2400 ? y : y + 543;
  return `${d} ${thaiMonths[m - 1] || ''} ${thaiYear}`;
};

export const TransactionFormSheet: React.FC<TransactionFormSheetProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialTransaction,
  prefill,
  existingTransactions,
  memberNames,
  currentMemberName,
  categories = DEFAULT_EXPENSE_CATEGORIES,
  pockets = [],
  pocketSummaries = [],
  onOpenScanner: _onOpenScanner,
}) => {
  const [type, setType] = useState<TransactionType>('out');
  const [amountStr, setAmountStr] = useState<string>('');
  const [who, setWho] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [category, setCategory] = useState<string>('อาหาร');
  const [date, setDate] = useState<string>(() => getLocalDateString());
  const [time, setTime] = useState<string>(() => getLocalTimeString());
  const [refNo, setRefNo] = useState<string>('');
  const [slipThumbnail, setSlipThumbnail] = useState<string | undefined>();
  const [fullSlipBase64, setFullSlipBase64] = useState<string | undefined>();
  const [selectedPocketId, setSelectedPocketId] = useState<string | undefined>(undefined);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [showCustomWho, setShowCustomWho] = useState(false);
  const [activeMetaPanel, setActiveMetaPanel] = useState<'who' | 'datetime' | 'pocket' | null>(null);

  const [showOverRepaymentWarning, setShowOverRepaymentWarning] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessingSlip, setIsProcessingSlip] = useState(false);
  const [slipScanProgress, setSlipScanProgress] = useState<ScanProgressUpdate | null>(null);
  const [slipNotice, setSlipNotice] = useState<{ kind: 'success' | 'warning'; text: string } | null>(null);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const todayStr = useMemo(() => getLocalDateString(), []);
  const yesterdayStr = useMemo(() => getLocalDateString(-1), []);
  const isFutureDate = date > todayStr;

  const handleSlipFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsProcessingSlip(true);
      setErrorMsg(null);
      setSlipNotice(null);
      setSlipScanProgress({ status: 'preprocessing', progress: 10, message: 'กำลังเตรียมรูปภาพสลิป...' });

      const result = await scanBankSlip(
        file,
        existingTransactions,
        memberNames,
        (update) => setSlipScanProgress(update)
      );

      setSlipThumbnail(result.thumbnailBase64);
      setFullSlipBase64(result.fullBase64);

      const { parsed, decodedQR, duplicateTx, ocrFailed } = result;
      const extractedParts: string[] = [];

      if (!initialTransaction) {
        if (parsed.refNo) setRefNo(parsed.refNo);
        if (parsed.amountSatang && parsed.amountSatang > 0) {
          setAmountStr(satangToBaht(parsed.amountSatang).toString());
          extractedParts.push(`ยอด ${formatSatang(parsed.amountSatang)} ฿`);
        }
        if (parsed.date) {
          setDate(parsed.date);
          extractedParts.push(`วันที่ ${formatDisplayDate(parsed.date)}${parsed.time ? ` ${parsed.time} น.` : ''}`);
        }
        if (parsed.time) {
          setTime(parsed.time);
        }

        if (!who.trim()) {
          let resolvedWho = '';
          if (type === 'lend') {
            resolvedWho = parsed.recipientName || decodedQR?.merchantName || '';
          } else if (type === 'back') {
            resolvedWho = parsed.senderName || '';
          } else {
            resolvedWho = parsed.matchedMemberWho || decodedQR?.merchantName || '';
          }
          if (resolvedWho) {
            setWho(resolvedWho);
            setShowCustomWho(!memberNames.includes(resolvedWho));
          }
        }

        if (!note.trim()) {
          let autoNote = '';
          if (type === 'lend' && parsed.recipientName) {
            autoNote = `ให้ยืม (${parsed.recipientName})`;
          } else if (type === 'back' && parsed.senderName) {
            autoNote = `คืนเงิน (${parsed.senderName})`;
          } else if (parsed.senderName && parsed.recipientName) {
            autoNote = `${parsed.senderName} โอนให้ ${parsed.recipientName}`;
          } else if (parsed.bankName) {
            autoNote = `โอนเงินผ่าน ${parsed.bankName}`;
          }
          if (autoNote) {
            const detectedEmoji = detectSlipEmoji((parsed.recipientName || '') + ' ' + (parsed.rawOcrText || ''));
            setNote(detectedEmoji ? `${detectedEmoji} ${autoNote}` : autoNote);
          }
        }
      } else {
        if (!refNo && parsed.refNo) setRefNo(parsed.refNo);
        if ((!amountStr || parseFloat(amountStr) <= 0) && parsed.amountSatang && parsed.amountSatang > 0) {
          setAmountStr(satangToBaht(parsed.amountSatang).toString());
          extractedParts.push(`ยอด ${formatSatang(parsed.amountSatang)} ฿`);
        }
        if (!date && parsed.date) {
          setDate(parsed.date);
          extractedParts.push(`วันที่ ${formatDisplayDate(parsed.date)}`);
        }
        if (!time && parsed.time) {
          setTime(parsed.time);
        }
        if (!who.trim()) {
          const fallbackWho =
            type === 'lend'
              ? (parsed.recipientName || decodedQR?.merchantName || '')
              : type === 'back'
                ? (parsed.senderName || '')
                : (parsed.matchedMemberWho || decodedQR?.merchantName || '');
          if (fallbackWho) {
            setWho(fallbackWho);
            setShowCustomWho(!memberNames.includes(fallbackWho));
          }
        }
      }

      if (duplicateTx) {
        setSlipNotice({
          kind: 'warning',
          text: `พบสลิปซ้ำกับรายการวันที่ ${formatDisplayDate(duplicateTx.date)} (${duplicateTx.who}) ยอด ${formatSatang(duplicateTx.amount)} ฿`,
        });
      } else if (ocrFailed) {
        setSlipNotice({
          kind: 'warning',
          text: 'อ่านรหัสอ้างอิงจาก QR แล้ว แต่ระบบ OCR อ่านตัวเลขและวันที่ไม่สำเร็จ กรุณากรอกยอดเงินและวันที่เอง',
        });
      } else if (extractedParts.length > 0) {
        setSlipNotice({
          kind: 'success',
          text: `อ่านข้อมูลจากสลิปแล้ว: ${extractedParts.join(' • ')}`,
        });
      } else {
        setSlipNotice({
          kind: 'warning',
          text: 'แนบสลิปแล้ว แต่ไม่พบตัวเลขยอดเงินหรือวันที่ในรูป กรุณาตรวจสอบหรือกรอกข้อมูลเอง',
        });
      }
    } catch (err: any) {
      console.error('Failed to process slip image:', err);
      setErrorMsg(err?.message || 'ไม่สามารถอ่านไฟล์รูปภาพสลิปได้');
    } finally {
      setIsProcessingSlip(false);
      setSlipScanProgress(null);
      if (e.target) e.target.value = '';
    }
  };

  const handleAddPreset = (value: number) => {
    const current = parseFloat(amountStr) || 0;
    const next = current + value;
    setAmountStr(next.toString());
    setErrorMsg(null);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  const handleClearAmount = () => {
    setAmountStr('');
    setErrorMsg(null);
  };

  // Sync form state when opened or changed
  useEffect(() => {
    if (!isOpen) return;

    if (initialTransaction) {
      setType(prefill?.type || initialTransaction.type);
      setAmountStr(prefill?.amount ? satangToBaht(prefill.amount).toString() : satangToBaht(initialTransaction.amount).toString());
      setWho(prefill?.who || initialTransaction.who);
      setShowCustomWho(!memberNames.includes(prefill?.who || initialTransaction.who));
      setNote(prefill?.note !== undefined ? prefill.note : (initialTransaction.note || ''));
      setCategory(prefill?.category || initialTransaction.category || 'อื่นๆ');
      setSelectedPocketId(prefill?.pocketId !== undefined ? prefill.pocketId : initialTransaction.pocketId);
      setDate(prefill?.date || initialTransaction.date);
      setTime(prefill?.time !== undefined ? prefill.time : (initialTransaction.time || ''));
      setRefNo(prefill?.refNo || initialTransaction.refNo || '');
      setSlipThumbnail(prefill?.slipThumbnail !== undefined ? prefill.slipThumbnail : initialTransaction.slipThumbnail);
      setFullSlipBase64(prefill?.fullSlipBase64);
    } else if (prefill) {
      setType(prefill.type || 'out');
      setAmountStr(prefill.amount ? satangToBaht(prefill.amount).toString() : '');
      const defaultWho = prefill.who || (prefill.type === 'lend' || prefill.type === 'back' ? '' : (currentMemberName || memberNames[0] || ''));
      setWho(defaultWho);
      setShowCustomWho(defaultWho ? !memberNames.includes(defaultWho) : false);
      setNote(prefill.note || '');
      setCategory(prefill.category || categories[0] || 'อาหาร');
      setSelectedPocketId(prefill.pocketId);
      setDate(prefill.date || getLocalDateString());
      setTime(prefill.time || getLocalTimeString());
      setRefNo(prefill.refNo || '');
      setSlipThumbnail(prefill.slipThumbnail);
      setFullSlipBase64(prefill.fullSlipBase64);
    } else {
      setType('out');
      setAmountStr('');
      setWho(currentMemberName || memberNames[0] || '');
      setShowCustomWho(false);
      setNote('');
      setCategory(categories[0] || 'อาหาร');
      setSelectedPocketId(undefined);
      setDate(getLocalDateString());
      setTime(getLocalTimeString());
      setRefNo('');
      setSlipThumbnail(undefined);
      setFullSlipBase64(undefined);
    }

    setActiveMetaPanel(null);
    setErrorMsg(null);
    setSlipScanProgress(null);
    setSlipNotice(null);
    setShowOverRepaymentWarning(false);
    setShowDeleteConfirm(false);
  }, [isOpen, initialTransaction, prefill, memberNames, currentMemberName, categories]);

  // Frequently used names for quick chips
  const quickPickNames = useMemo(() => {
    const namesSet = new Set<string>(memberNames);
    existingTransactions.forEach((t) => {
      if (t.who && t.who.trim()) namesSet.add(t.who.trim());
    });
    return Array.from(namesSet).slice(0, 8);
  }, [memberNames, existingTransactions]);

  // Check current outstanding debt for this person if type is repayment 'back'
  const currentDebtorDebt = useMemo(() => {
    if (type !== 'back' || !who.trim()) return 0;
    return getOutstandingForPerson(existingTransactions, who);
  }, [type, who, existingTransactions]);

  const handleSubmit = (forceSave = false) => {
    const satang = parseToSatang(amountStr);

    if (satang <= 0) {
      setErrorMsg('กรุณากรอกจำนวนเงินให้ถูกต้อง (มากกว่า 0)');
      return;
    }

    if (!who.trim()) {
      setErrorMsg('กรุณาระบุชื่อผู้ทำรายการ');
      return;
    }

    // Over-repayment warning check
    if (type === 'back' && !forceSave) {
      const overCheck = checkOverRepayment(
        existingTransactions,
        who,
        satang,
        initialTransaction?.id
      );

      if (overCheck.isOver) {
        setShowOverRepaymentWarning(true);
        return;
      }
    }

    // Execute save
    onSave(
      {
        type,
        amount: satang,
        who: who.trim(),
        note: note.trim(),
        category: type === 'out' ? category : undefined,
        pocketId: (type === 'out' || type === 'in') ? selectedPocketId : undefined,
        date,
        time: time.trim() || undefined,
        refNo: refNo.trim() || undefined,
        slipThumbnail: slipThumbnail || undefined,
        createdBy: initialTransaction?.createdBy || who.trim(),
      },
      initialTransaction?.id
    );

    onClose();
  };

  const typesList: { key: TransactionType; label: string; icon: React.ElementType; color: string }[] = [
    { key: 'out', label: 'รายจ่าย', icon: ArrowUpRight, color: 'text-red-500' },
    { key: 'in', label: 'ฝากเข้า', icon: ArrowDownLeft, color: 'text-emerald-500' },
    { key: 'lend', label: 'ให้ยืม/สำรอง', icon: HandCoins, color: 'text-amber-500' },
    { key: 'back', label: 'ได้รับคืน', icon: CornerDownLeft, color: 'text-teal-500' },
  ];

  const selectedPocketName = useMemo(() => {
    if (!selectedPocketId) return null;
    return pockets.find((p) => p.id === selectedPocketId)?.name || null;
  }, [selectedPocketId, pockets]);

  const compactDateLabel = useMemo(() => {
    const base = date === todayStr ? 'วันนี้' : date === yesterdayStr ? 'เมื่อวาน' : formatDisplayDate(date);
    return time ? `${base} · ${time}` : base;
  }, [date, time, todayStr, yesterdayStr]);

  const currentNoteEmoji = useMemo(() => extractEmoji(note), [note]);

  const footerAction = (
    <div className="flex items-center gap-2">
      {initialTransaction && onDelete && (
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="w-12 h-12 flex items-center justify-center rounded-xl border-2 border-[#242A20] dark:border-[#3C4A38] bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 shadow-[2px_2px_0px_#242A20] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none shrink-0 transition-transform"
          title="ลบรายการ"
        >
          <Trash2 size={18} strokeWidth={2} />
        </button>
      )}
      <button
        type="button"
        onClick={() => handleSubmit(false)}
        className="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl border-2 border-[#242A20] dark:border-[#3C4A38] bg-[#9BBC0F] text-[#0F380F] font-silkscreen text-xs font-bold tracking-wider shadow-[3px_3px_0px_#242A20] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none select-none transition-all"
      >
        <span>
          {initialTransaction
            ? 'บันทึกการแก้ไข'
            : type === 'out'
            ? 'บันทึกรายจ่าย'
            : type === 'in'
            ? 'บันทึกเงินเข้า'
            : type === 'lend'
            ? 'บันทึกให้ยืม'
            : 'บันทึกรับคืน'}
        </span>
        {amountStr && parseFloat(amountStr) > 0 && (
          <span className="bg-[#0F380F] text-[#9BBC0F] px-2 py-0.5 rounded text-[11px] tabular-nums font-bold">
            {formatSatang(parseToSatang(amountStr))}฿
          </span>
        )}
      </button>
    </div>
  );

  const handleRemoveSlip = () => {
    setSlipThumbnail(undefined);
    setFullSlipBase64(undefined);
    setSlipNotice(null);
  };

  const slipStatusFeedback = (
    <>
      {isProcessingSlip && slipScanProgress && (
        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-between text-[11px] text-neutral-600 dark:text-neutral-300 font-medium">
            <span className="truncate">{slipScanProgress.message}</span>
            <span className="tabular-nums shrink-0 ml-2">{slipScanProgress.progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
              style={{ width: `${slipScanProgress.progress}%` }}
            />
          </div>
        </div>
      )}
      {!isProcessingSlip && slipNotice && (
        <div
          className={`p-2 rounded-lg text-[11px] font-medium leading-relaxed border ${
            slipNotice.kind === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
          }`}
        >
          {slipNotice.text}
        </div>
      )}
    </>
  );

  return (
    <>
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title={initialTransaction ? 'แก้ไขรายการ' : 'บันทึกรายการใหม่'}
        footer={footerAction}
      >
        <div className="space-y-3">
          {/* 1. Type Selector (4 Segmented Tabs) */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-surfaceElevated-light dark:bg-surfaceElevated-dark rounded-xl border border-[#242A20]/25 dark:border-[#3C4A38]">
            {typesList.map((t) => {
              const Icon = t.icon;
              const isSelected = type === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setType(t.key)}
                  className={`min-h-[40px] flex flex-col items-center justify-center rounded-lg text-xs transition-all select-none font-silkscreen ${
                    isSelected
                      ? 'bg-[#242A20] text-white dark:bg-emerald-500/20 dark:text-emerald-200 dark:border dark:border-emerald-400/40 font-bold shadow-sm'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Icon
                    size={14}
                    strokeWidth={2.5}
                    className={`mb-0.5 ${
                      isSelected
                        ? type === 'out'
                          ? 'text-red-400'
                          : type === 'in'
                          ? 'text-emerald-400'
                          : type === 'lend'
                          ? 'text-amber-400'
                          : 'text-teal-400'
                        : ''
                    }`}
                  />
                  <span className="text-[11px]">{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* 2. Quick Slip Bar (Always accessible at top for auto-fill) */}
          <div className="space-y-1.5">
            {slipThumbnail ? (
              <div className="px-2.5 py-2 rounded-xl bg-surfaceElevated-light dark:bg-surfaceElevated-dark border border-[#242A20]/25 dark:border-[#3C4A38] flex items-center justify-between gap-2.5">
                <div
                  className="flex items-center gap-2.5 min-w-0 cursor-pointer"
                  onClick={() => setIsViewerOpen(true)}
                >
                  <img
                    src={slipThumbnail}
                    alt="สลิป"
                    className="w-8 h-10 object-cover rounded-md border border-[#242A20]/30 shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 block truncate">
                      แนบสลิปแล้ว
                    </span>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium underline">
                      แตะเพื่อดูสลิปเต็ม
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveSlip}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                  title="ลบสลิป"
                >
                  <X size={15} />
                </button>
              </div>
            ) : (
              <div
                className={`grid grid-cols-2 gap-2 p-1.5 rounded-xl border ${
                  type === 'lend' || type === 'back'
                    ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-300/70 dark:border-amber-800/60'
                    : 'bg-surfaceElevated-light/70 dark:bg-surfaceElevated-dark/60 border-[#242A20]/15 dark:border-[#3C4A38]/70'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setIsScannerModalOpen(true)}
                  className="h-9 px-2.5 rounded-lg bg-surface-light dark:bg-surface-dark border border-[#242A20]/20 dark:border-[#3C4A38] text-neutral-800 dark:text-neutral-100 font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-[0.98] transition-all select-none"
                >
                  <Camera size={14} strokeWidth={2.2} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="truncate">สแกนสลิป</span>
                </button>
                <button
                  type="button"
                  disabled={isProcessingSlip}
                  onClick={() => fileInputRef.current?.click()}
                  className="h-9 px-2.5 rounded-lg bg-surface-light dark:bg-surface-dark border border-[#242A20]/20 dark:border-[#3C4A38] text-neutral-800 dark:text-neutral-100 font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-[0.98] transition-all select-none disabled:opacity-50"
                >
                  <ImageIcon size={14} strokeWidth={2} className="text-neutral-500 dark:text-neutral-400 shrink-0" />
                  <span className="truncate">
                    {isProcessingSlip ? `กำลังอ่านสลิป ${slipScanProgress?.progress ?? 0}%` : 'แนบรูปสลิป'}
                  </span>
                </button>
              </div>
            )}
            {slipStatusFeedback}
          </div>

          {/* 3. Hero Amount Input with Quick Amount Pills */}
          <div className="bg-surfaceElevated-light dark:bg-surfaceElevated-dark border-2 border-[#242A20] dark:border-[#3C4A38] rounded-2xl p-3 text-center shadow-[2px_2px_0px_#242A20]">
            <label className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 block mb-0.5">
              จำนวนเงิน (บาท)
            </label>
            <div className="flex items-center justify-center gap-1">
              <span className="text-2xl text-neutral-400 dark:text-neutral-500 font-light font-silkscreen">฿</span>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                value={amountStr}
                onChange={(e) => {
                  setAmountStr(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="0.00"
                className="w-full text-center text-4xl font-silkscreen font-bold tracking-tight bg-transparent text-neutral-900 dark:text-neutral-50 focus:outline-none tabular-nums placeholder:text-neutral-300 dark:placeholder:text-neutral-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0"
                autoFocus={!initialTransaction && !prefill}
              />
            </div>

            {/* Quick Amount Pills */}
            <div className="flex items-center justify-center gap-1.5 flex-wrap pt-2 border-t border-[#242A20]/10 dark:border-[#3C4A38]/60 mt-2">
              {[20, 50, 100, 500, 1000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleAddPreset(val)}
                  className="px-2.5 py-0.5 text-[11px] font-silkscreen font-bold rounded-lg border border-[#242A20]/25 dark:border-[#3C4A38] bg-surface-light dark:bg-surface-dark hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 active:scale-95 select-none transition-all"
                >
                  +{val}
                </button>
              ))}
              {amountStr && (
                <button
                  type="button"
                  onClick={handleClearAmount}
                  className="px-2 py-0.5 text-[11px] font-silkscreen font-bold rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-300 active:scale-95 select-none transition-all"
                  title="ล้างจำนวนเงิน"
                >
                  C
                </button>
              )}
            </div>

            {/* Quick Helper if repayment */}
            {type === 'back' && who.trim() && (
              <div className="mt-2.5 pt-2 border-t border-[#242A20]/15 dark:border-[#3C4A38] space-y-1.5">
                <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
                  <span>ยอดค้างชำระของ {who}:</span>
                  <span className="font-silkscreen font-bold text-amber-600 dark:text-amber-400">
                    {formatSatang(currentDebtorDebt)} ฿
                  </span>
                </div>

                {currentDebtorDebt > 0 && (
                  <div className="flex items-center justify-center gap-1.5 flex-wrap pt-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        const halfSatang = Math.round(currentDebtorDebt / 2);
                        setAmountStr(satangToBaht(halfSatang).toString());
                        setNote(`คืนเงินยืม 50% (${who})`);
                        setErrorMsg(null);
                      }}
                      className="px-2.5 py-1 text-xs font-silkscreen font-bold rounded-lg border border-amber-400 dark:border-amber-700 bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 active:scale-95 select-none transition-transform"
                    >
                      คืน 50% ({formatSatang(Math.round(currentDebtorDebt / 2))}฿)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAmountStr(satangToBaht(currentDebtorDebt).toString());
                        setNote(`คืนเงินยืมครบจำนวน (${who})`);
                        setErrorMsg(null);
                      }}
                      className="px-2.5 py-1 text-xs font-silkscreen font-bold rounded-lg border border-emerald-400 dark:border-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 active:scale-95 select-none transition-transform"
                    >
                      คืนเต็ม 100% ({formatSatang(currentDebtorDebt)}฿)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 4. Category Chips (1 clean scrollable row, shown ONLY when type === 'out') */}
          {type === 'out' && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`shrink-0 text-xs px-2.5 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 select-none ${
                    category === cat
                      ? 'bg-[#242A20] text-white dark:bg-emerald-500/20 dark:text-emerald-200 border-[#242A20] dark:border-emerald-400/50 font-bold shadow-sm'
                      : 'bg-surfaceElevated-light/70 dark:bg-surfaceElevated-dark/70 text-neutral-700 dark:text-neutral-300 border-[#242A20]/15 dark:border-[#3C4A38]/80 hover:border-[#242A20]/40'
                  }`}
                >
                  <span>{getCategoryEmoji(cat)}</span>
                  <span>{cat}</span>
                </button>
              ))}
            </div>
          )}

          {/* 5. Debtor Input (Shown prominently ONLY for lend / back) */}
          {(type === 'lend' || type === 'back') && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block">
                {type === 'lend' ? 'ให้ใครยืม / จ่ายแทนใคร' : 'ใครโอนเงินคืน'}
              </label>
              <input
                type="text"
                value={who}
                onChange={(e) => {
                  setWho(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="พิมพ์ชื่อคนยืม เช่น เพื่อน, แม่..."
                className="w-full px-3.5 py-2.5 bg-surface-light dark:bg-surface-dark border border-[#242A20]/30 dark:border-[#3C4A38] rounded-xl text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-[#242A20] dark:focus:border-emerald-400/60"
              />
              {quickPickNames.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
                  <span className="text-[11px] text-neutral-400 shrink-0">ด่วน:</span>
                  {quickPickNames.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        setWho(name);
                        setErrorMsg(null);
                      }}
                      className={`shrink-0 text-xs px-2.5 py-1 rounded-lg border transition-all ${
                        who === name
                          ? 'bg-[#242A20] text-white dark:bg-emerald-500/20 dark:text-emerald-200 border-[#242A20] dark:border-emerald-400/50 font-bold'
                          : 'bg-surfaceElevated-light/70 dark:bg-surfaceElevated-dark/70 text-neutral-700 dark:text-neutral-300 border-[#242A20]/15 dark:border-[#3C4A38]'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 6. Single-line Note Input with Integrated Emoji Trigger */}
          <div className="relative flex items-center">
            <button
              type="button"
              onClick={() => setIsEmojiPickerOpen(true)}
              className="absolute left-2 w-7 h-7 rounded-lg bg-surfaceElevated-light dark:bg-surfaceElevated-dark border border-[#242A20]/15 dark:border-[#3C4A38] flex items-center justify-center text-neutral-500 hover:text-amber-500 transition-colors"
              title="เลือก Emoji"
            >
              {currentNoteEmoji ? (
                <span className="text-sm leading-none">{currentNoteEmoji}</span>
              ) : (
                <Smile size={15} />
              )}
            </button>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="หมายเหตุ (เช่น ข้าวเที่ยง, ค่าตั๋วหนัง...)"
              className="w-full pl-11 pr-3.5 py-2.5 bg-surface-light dark:bg-surface-dark border border-[#242A20]/25 dark:border-[#3C4A38] rounded-xl text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-[#242A20] dark:focus:border-emerald-400/60"
            />
          </div>

          {/* 7. Compact Interactive Meta Chips (Who · Date/Time · Pocket) */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {(type === 'out' || type === 'in') && (
                <button
                  type="button"
                  onClick={() => setActiveMetaPanel((prev) => (prev === 'who' ? null : 'who'))}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs transition-all select-none ${
                    activeMetaPanel === 'who'
                      ? 'bg-[#242A20] text-white dark:bg-emerald-500/20 dark:text-emerald-200 border-[#242A20] dark:border-emerald-400/50 font-bold'
                      : 'bg-surfaceElevated-light/80 dark:bg-surfaceElevated-dark/80 text-neutral-700 dark:text-neutral-200 border-[#242A20]/20 dark:border-[#3C4A38] hover:border-[#242A20]/40'
                  }`}
                >
                  <User size={12} className="shrink-0 opacity-75" />
                  <span className="truncate max-w-[110px]">
                    {who.trim() || 'ระบุชื่อ'}
                    {who === currentMemberName ? ' (คุณ)' : ''}
                  </span>
                  <ChevronDown size={12} className={`transition-transform ${activeMetaPanel === 'who' ? 'rotate-180' : ''}`} />
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveMetaPanel((prev) => (prev === 'datetime' ? null : 'datetime'))}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs transition-all select-none ${
                  activeMetaPanel === 'datetime'
                    ? 'bg-[#242A20] text-white dark:bg-emerald-500/20 dark:text-emerald-200 border-[#242A20] dark:border-emerald-400/50 font-bold'
                    : date !== todayStr
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700 font-semibold'
                    : 'bg-surfaceElevated-light/80 dark:bg-surfaceElevated-dark/80 text-neutral-700 dark:text-neutral-200 border-[#242A20]/20 dark:border-[#3C4A38] hover:border-[#242A20]/40'
                }`}
              >
                <Calendar size={12} className="shrink-0 opacity-75" />
                <span>{compactDateLabel}</span>
                <ChevronDown size={12} className={`transition-transform ${activeMetaPanel === 'datetime' ? 'rotate-180' : ''}`} />
              </button>

              {(type === 'out' || type === 'in') && pockets && pockets.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveMetaPanel((prev) => (prev === 'pocket' ? null : 'pocket'))}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs transition-all select-none ${
                    activeMetaPanel === 'pocket'
                      ? 'bg-[#242A20] text-white dark:bg-emerald-500/20 dark:text-emerald-200 border-[#242A20] dark:border-emerald-400/50 font-bold'
                      : selectedPocketName
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700 font-semibold'
                      : 'bg-surfaceElevated-light/80 dark:bg-surfaceElevated-dark/80 text-neutral-700 dark:text-neutral-200 border-[#242A20]/20 dark:border-[#3C4A38] hover:border-[#242A20]/40'
                  }`}
                >
                  <Wallet size={12} className="shrink-0 opacity-75" />
                  <span className="truncate max-w-[120px]">
                    {selectedPocketName ? `👛 ${selectedPocketName}` : 'กองกลางหลัก'}
                  </span>
                  <ChevronDown size={12} className={`transition-transform ${activeMetaPanel === 'pocket' ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>

            {/* Inline Panel: Who */}
            {activeMetaPanel === 'who' && (type === 'out' || type === 'in') && (
              <div className="p-2.5 rounded-xl bg-surfaceElevated-light/80 dark:bg-surfaceElevated-dark/80 border border-[#242A20]/20 dark:border-[#3C4A38] space-y-2 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-neutral-600 dark:text-neutral-300">
                    {type === 'in' ? 'ใครเป็นคนฝากเงิน' : 'ใครเป็นคนจ่ายเงิน'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCustomWho(!showCustomWho)}
                    className="text-[11px] text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 underline"
                  >
                    {showCustomWho ? 'เลือกจากสมาชิก' : 'พิมพ์ชื่ออื่น'}
                  </button>
                </div>

                {showCustomWho ? (
                  <input
                    type="text"
                    value={who}
                    onChange={(e) => {
                      setWho(e.target.value);
                      setErrorMsg(null);
                    }}
                    placeholder="พิมพ์ชื่อ..."
                    className="w-full px-3 py-2 bg-surface-light dark:bg-surface-dark border border-[#242A20]/30 dark:border-[#3C4A38] rounded-xl text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none"
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-1.5">
                    {memberNames.map((name) => {
                      const isYou = name === currentMemberName;
                      const isSelected = who === name;
                      return (
                        <button
                          key={name}
                          type="button"
                          onClick={() => {
                            setWho(name);
                            setErrorMsg(null);
                            setActiveMetaPanel(null);
                          }}
                          className={`h-9 px-2.5 rounded-xl border text-xs transition-all flex items-center justify-center gap-1.5 select-none ${
                            isSelected
                              ? 'bg-[#242A20] text-white dark:bg-emerald-500/20 dark:text-emerald-200 border-[#242A20] dark:border-emerald-400/50 font-bold'
                              : 'bg-surface-light dark:bg-surface-dark text-neutral-700 dark:text-neutral-300 border-[#242A20]/20 dark:border-[#3C4A38]'
                          }`}
                        >
                          <span className="truncate">{name}</span>
                          {isYou && (
                            <span
                              className={`text-[10px] px-1.5 rounded ${
                                isSelected
                                  ? 'bg-white/20 text-white dark:bg-emerald-400/20 dark:text-emerald-200'
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              }`}
                            >
                              คุณ
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Inline Panel: Date & Time */}
            {activeMetaPanel === 'datetime' && (
              <div className="p-2.5 rounded-xl bg-surfaceElevated-light/80 dark:bg-surfaceElevated-dark/80 border border-[#242A20]/20 dark:border-[#3C4A38] space-y-2 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-neutral-600 dark:text-neutral-300">วันที่และเวลา</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setDate(todayStr)}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-bold select-none ${
                        date === todayStr
                          ? 'bg-[#242A20] text-white dark:bg-emerald-500/25 dark:text-emerald-200'
                          : 'bg-surface-light dark:bg-surface-dark text-neutral-600 dark:text-neutral-300'
                      }`}
                    >
                      วันนี้
                    </button>
                    <button
                      type="button"
                      onClick={() => setDate(yesterdayStr)}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-bold select-none ${
                        date === yesterdayStr
                          ? 'bg-[#242A20] text-white dark:bg-emerald-500/25 dark:text-emerald-200'
                          : 'bg-surface-light dark:bg-surface-dark text-neutral-600 dark:text-neutral-300'
                      }`}
                    >
                      เมื่อวาน
                    </button>
                    <button
                      type="button"
                      onClick={() => setTime(getLocalTimeString())}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-surface-light dark:bg-surface-dark text-neutral-600 dark:text-neutral-300 font-bold select-none"
                    >
                      ตอนนี้
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="relative h-10 px-3 rounded-xl border border-[#242A20]/25 dark:border-[#3C4A38] bg-surface-light dark:bg-surface-dark flex items-center justify-center cursor-pointer">
                    <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                      {formatDisplayDate(date)}
                    </span>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                  </div>
                  <div className="relative h-10 px-3 rounded-xl border border-[#242A20]/25 dark:border-[#3C4A38] bg-surface-light dark:bg-surface-dark flex items-center justify-center cursor-pointer">
                    <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 font-mono truncate">
                      {time ? `${time} น.` : 'ระบุเวลา'}
                    </span>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Inline Panel: Pocket Selector */}
            {activeMetaPanel === 'pocket' && (type === 'out' || type === 'in') && pockets && pockets.length > 0 && (
              <div className="p-2.5 rounded-xl bg-surfaceElevated-light/80 dark:bg-surfaceElevated-dark/80 border border-[#242A20]/20 dark:border-[#3C4A38] space-y-2 animate-fade-in">
                <span className="text-[11px] font-bold text-neutral-600 dark:text-neutral-300 block">
                  {type === 'in' ? 'เพิ่มเงินเข้าบัญชีไหน' : 'ตัดเงินจากบัญชีไหน'}
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPocketId(undefined);
                      setActiveMetaPanel(null);
                    }}
                    className={`text-xs px-2.5 py-1 rounded-xl border transition-all flex items-center gap-1.5 ${
                      !selectedPocketId
                        ? 'bg-[#242A20] text-white dark:bg-emerald-500/20 dark:text-emerald-200 border-[#242A20] dark:border-emerald-400/50 font-bold'
                        : 'bg-surface-light dark:bg-surface-dark text-neutral-700 dark:text-neutral-300 border-[#242A20]/20 dark:border-[#3C4A38]'
                    }`}
                  >
                    <span>🏦</span>
                    <span>กองกลางหลัก</span>
                  </button>

                  {pockets
                    .filter((p) => p.status !== 'completed' || p.id === selectedPocketId)
                    .map((p) => {
                      const isSelected = selectedPocketId === p.id;
                      const pSummary = pocketSummaries?.find((ps) => ps.pocket.id === p.id);
                      const remainingStr = pSummary ? `${formatSatang(pSummary.remainingSatang)} ฿` : '';
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setSelectedPocketId(p.id);
                            setActiveMetaPanel(null);
                          }}
                          className={`text-xs px-2.5 py-1 rounded-xl border transition-all flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-700 font-bold'
                              : 'bg-surface-light dark:bg-surface-dark text-neutral-700 dark:text-neutral-300 border-[#242A20]/20 dark:border-[#3C4A38]'
                          }`}
                        >
                          <span>👛</span>
                          <span>{p.name}</span>
                          {remainingStr && (
                            <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-neutral-400'}`}>
                              ({remainingStr})
                            </span>
                          )}
                        </button>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          {/* Future Date Warning */}
          {isFutureDate && (
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-amber-500" />
              <span>วันที่ที่ระบุเป็นวันในอนาคต</span>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-400 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle size={15} strokeWidth={2} />
              <span className="font-bold">{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Hidden direct file input for slip attachment */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleSlipFileChange}
        />
      </BottomSheet>

      {/* Over-repayment Warning Modal */}
      <ConfirmModal
        isOpen={showOverRepaymentWarning}
        title="ยอดคืนเกินยอดค้างชำระ"
        message={`ยอดเงินที่ระบุ (${formatSatang(parseToSatang(amountStr))} ฿) เกินกว่ายอดที่ ${who} ติดค้างอยู่ (${formatSatang(currentDebtorDebt)} ฿)\n\nคุณยังคงต้องการบันทึกรายการนี้ใช่หรือไม่?`}
        confirmText="ยืนยันบันทึก"
        cancelText="กลับไปแก้ไข"
        isDestructive={false}
        onConfirm={() => {
          setShowOverRepaymentWarning(false);
          handleSubmit(true);
        }}
        onCancel={() => setShowOverRepaymentWarning(false)}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="ยืนยันการลบรายการ"
        message="คุณต้องการลบรายการนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้"
        confirmText="ลบรายการ"
        cancelText="ยกเลิก"
        isDestructive={true}
        onConfirm={() => {
          setShowDeleteConfirm(false);
          if (initialTransaction && onDelete) {
            onDelete(initialTransaction.id);
            onClose();
          }
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Slip Viewer Lightbox */}
      <SlipViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        imageUrl={fullSlipBase64 || slipThumbnail}
        refNo={refNo}
        date={date}
      />

      {/* Emoji Picker Modal */}
      <EmojiPickerModal
        isOpen={isEmojiPickerOpen}
        onClose={() => setIsEmojiPickerOpen(false)}
        onSelectEmoji={(emoji) => setNote((prev) => setLeadingEmoji(prev, emoji))}
        currentEmoji={extractEmoji(note)}
      />

      {/* Embedded Slip Scanner Modal (Preserves Transaction & Edit Context) */}
      <SlipScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        existingTransactions={existingTransactions}
        memberNames={memberNames}
        pockets={pockets}
        pocketSummaries={pocketSummaries}
        initialType={type}
        onApplySlip={(scanned) => {
          setSlipThumbnail(scanned.slipThumbnail);
          setFullSlipBase64(scanned.fullSlipBase64);
          setSlipNotice(null);
          if (scanned.refNo) setRefNo(scanned.refNo);

          if (!initialTransaction) {
            // New transaction: fill all extracted data
            if (scanned.type) setType(scanned.type);
            if (scanned.amountSatang) setAmountStr(satangToBaht(scanned.amountSatang).toString());
            if (scanned.who) setWho(scanned.who);
            if (scanned.note) setNote(scanned.note);
            if (scanned.date) setDate(scanned.date);
            if (scanned.time) setTime(scanned.time);
            if (scanned.pocketId) setSelectedPocketId(scanned.pocketId);
          } else {
            // Existing transaction: preserve identity and only fill empty fields
            if (!amountStr || parseFloat(amountStr) <= 0) {
              if (scanned.amountSatang) setAmountStr(satangToBaht(scanned.amountSatang).toString());
            }
            if (!date && scanned.date) setDate(scanned.date);
            if (!time && scanned.time) setTime(scanned.time);
            if (!who.trim() && scanned.who) {
              setWho(scanned.who);
            }
          }
          setActiveMetaPanel(null);
          setIsScannerModalOpen(false);
        }}
      />
    </>
  );
};
