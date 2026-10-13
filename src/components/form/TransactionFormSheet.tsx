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
  Tag,
  X,
  Wallet,
  Smile,
} from 'lucide-react';
import { SlipViewerModal } from '../scanner/SlipViewerModal';
import { Pocket, PocketSummary } from '../../types/pocket';
import { EmojiPickerModal } from '../common/EmojiPickerModal';
import { POPULAR_EXPENSE_EMOJIS, setLeadingEmoji, getCategoryEmoji, extractEmoji } from '../../config/emojis';

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
  onOpenScanner,
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
  const [showMoreDetails, setShowMoreDetails] = useState(false);

  const [showOverRepaymentWarning, setShowOverRepaymentWarning] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const todayStr = useMemo(() => getLocalDateString(), []);
  const yesterdayStr = useMemo(() => getLocalDateString(-1), []);
  const isFutureDate = date > todayStr;

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
      setType(initialTransaction.type);
      setAmountStr(satangToBaht(initialTransaction.amount).toString());
      setWho(initialTransaction.who);
      setShowCustomWho(!memberNames.includes(initialTransaction.who));
      setNote(initialTransaction.note || '');
      setCategory(initialTransaction.category || 'อื่นๆ');
      setSelectedPocketId(initialTransaction.pocketId);
      setDate(initialTransaction.date);
      setTime(initialTransaction.time || '');
      setRefNo(initialTransaction.refNo || '');
      setSlipThumbnail(initialTransaction.slipThumbnail);
      setFullSlipBase64(undefined);
      setShowMoreDetails(Boolean(initialTransaction.note || initialTransaction.pocketId || initialTransaction.slipThumbnail));
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
      setShowMoreDetails(Boolean(prefill.note || prefill.pocketId || prefill.slipThumbnail));
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
      setShowMoreDetails(false);
    }

    setErrorMsg(null);
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

  const hasExtraDetails = Boolean(
    note.trim() ||
    selectedPocketId ||
    date !== todayStr ||
    time !== getLocalTimeString() ||
    slipThumbnail
  );

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

  return (
    <>
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title={initialTransaction ? 'แก้ไขรายการ' : 'บันทึกรายการใหม่'}
        footer={footerAction}
      >
        <div className="space-y-3.5">
          {/* 1. Type Selector (4 Segmented Tabs) */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-surfaceElevated-light dark:bg-surfaceElevated-dark rounded-xl border-2 border-[#242A20] dark:border-[#3C4A38] shadow-[1.5px_1.5px_0px_#242A20]">
            {typesList.map((t) => {
              const Icon = t.icon;
              const isSelected = type === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setType(t.key)}
                  className={`min-h-[42px] flex flex-col items-center justify-center rounded-lg text-xs transition-all select-none font-silkscreen ${
                    isSelected
                      ? 'bg-[#242A20] text-white dark:bg-white dark:text-[#242A20] font-bold shadow-[1px_1px_0px_#0A0F0A]'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Icon size={15} strokeWidth={2.5} className={`mb-0.5 ${isSelected ? (type === 'out' ? 'text-red-400' : type === 'in' ? 'text-emerald-400' : type === 'lend' ? 'text-amber-400' : 'text-teal-400') : ''}`} />
                  <span className="text-[11px]">{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* 2. Large Amount Input with Quick Amount Pills */}
          <div className="bg-surfaceElevated-light dark:bg-surfaceElevated-dark border-2 border-[#242A20] dark:border-[#3C4A38] rounded-xl p-3 text-center shadow-[2px_2px_0px_#242A20]">
            <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 block mb-1">
              จำนวนเงิน (บาท)
            </label>
            <div className="flex items-center justify-center gap-1">
              <span className="text-2xl text-neutral-400 font-light font-silkscreen">฿</span>
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
                className="w-full text-center text-4xl font-silkscreen font-bold tracking-tight bg-transparent text-neutral-900 dark:text-neutral-50 focus:outline-none tabular-nums placeholder:text-neutral-300 dark:placeholder:text-neutral-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0"
                autoFocus={!initialTransaction && !prefill}
              />
            </div>

            {/* Quick Amount Pills */}
            <div className="flex items-center justify-center gap-1.5 flex-wrap pt-2 border-t border-[#242A20]/15 dark:border-[#3C4A38]/50 mt-2">
              {[20, 50, 100, 500, 1000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleAddPreset(val)}
                  className="px-2 py-0.5 text-[11px] font-silkscreen font-bold rounded-lg border border-[#242A20] dark:border-[#3C4A38] bg-surface-light dark:bg-surface-dark hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 shadow-[1px_1px_0px_#242A20] active:translate-x-[1px] active:translate-y-[1px] select-none transition-all"
                >
                  +{val}
                </button>
              ))}
              {amountStr && (
                <button
                  type="button"
                  onClick={handleClearAmount}
                  className="px-2 py-0.5 text-[11px] font-silkscreen font-bold rounded-lg border border-[#242A20] dark:border-[#3C4A38] bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 shadow-[1px_1px_0px_#242A20] active:translate-x-[1px] active:translate-y-[1px] select-none transition-all"
                  title="ล้างจำนวนเงิน"
                >
                  C
                </button>
              )}
            </div>

            {/* Quick Helper if repayment */}
            {type === 'back' && who.trim() && (
              <div className="mt-2.5 pt-2 border-t border-[#242A20]/20 dark:border-[#3C4A38] space-y-1.5">
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
                      className="px-2.5 py-1 text-xs font-silkscreen font-bold rounded-lg border-2 border-[#242A20] dark:border-[#3C4A38] bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 shadow-[1.5px_1.5px_0px_#242A20] active:translate-x-[1px] active:translate-y-[1px] select-none transition-transform"
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
                      className="px-2.5 py-1 text-xs font-silkscreen font-bold rounded-lg border-2 border-[#242A20] dark:border-[#3C4A38] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 shadow-[1.5px_1.5px_0px_#242A20] active:translate-x-[1px] active:translate-y-[1px] select-none transition-transform"
                    >
                      คืนเต็ม 100% ({formatSatang(currentDebtorDebt)}฿)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Expense Category Chips (Shown ONLY when type === 'out') */}
          {type === 'out' && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-800 dark:text-neutral-200">
                <Tag size={13} />
                <span>หมวดหมู่รายจ่าย</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`text-xs px-2.5 py-1 rounded-xl border-2 transition-all flex items-center gap-1.5 select-none ${
                      category === cat
                        ? 'bg-[#242A20] text-white dark:bg-white dark:text-[#242A20] border-[#242A20] dark:border-white font-bold shadow-[2px_2px_0px_#242A20]'
                        : 'bg-surface-light dark:bg-surface-dark text-neutral-700 dark:text-neutral-300 border-[#242A20]/30 dark:border-[#3C4A38] hover:border-[#242A20]'
                    }`}
                  >
                    <span>{getCategoryEmoji(cat)}</span>
                    <span>{cat}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 4. Who Section: 1-Tap Member Switch */}
          {(type === 'out' || type === 'in') ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  {type === 'in' ? 'ใครเป็นคนฝากเงิน' : 'ใครเป็นคนจ่ายเงิน'}
                </label>
                <button
                  type="button"
                  onClick={() => setShowCustomWho(!showCustomWho)}
                  className="text-[11px] text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
                >
                  {showCustomWho ? '← เลือกจากสมาชิก' : 'พิมพ์ชื่ออื่น...'}
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
                  className="w-full px-3.5 py-2.5 bg-surface-light dark:bg-surface-dark border-2 border-[#242A20] dark:border-[#3C4A38] rounded-xl text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none"
                />
              ) : (
                <div className="grid grid-cols-2 gap-2">
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
                        }}
                        className={`h-11 px-3 rounded-xl border-2 text-xs transition-all flex items-center justify-center gap-1.5 active:translate-x-[1px] active:translate-y-[1px] select-none ${
                          isSelected
                            ? 'bg-[#242A20] text-white dark:bg-white dark:text-[#242A20] border-[#242A20] dark:border-white font-bold shadow-[2px_2px_0px_#242A20]'
                            : 'bg-surface-light dark:bg-surface-dark text-neutral-700 dark:text-neutral-300 border-[#242A20]/30 dark:border-[#3C4A38] hover:border-[#242A20]'
                        }`}
                      >
                        <span className="truncate">{name}</span>
                        {isYou && (
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded font-normal ${
                              isSelected
                                ? 'bg-white/20 text-white dark:bg-black/20 dark:text-[#242A20]'
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
          ) : (
            /* Debtor Input for lend / back */
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
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
                className="w-full px-3.5 py-2.5 bg-surface-light dark:bg-surface-dark border-2 border-[#242A20] dark:border-[#3C4A38] rounded-xl text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none"
              />

              {/* Quick chips */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[11px] text-neutral-500 font-pixel">ชื่อด่วน:</span>
                {quickPickNames.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      setWho(name);
                      setErrorMsg(null);
                    }}
                    className={`text-xs px-2.5 py-1 rounded-lg border-2 transition-all ${
                      who === name
                        ? 'bg-[#242A20] text-white dark:bg-white dark:text-[#242A20] border-[#242A20] font-bold shadow-[1px_1px_0px_#242A20]'
                        : 'bg-surface-light dark:bg-surface-dark text-neutral-700 dark:text-neutral-300 border-[#242A20]/30 hover:border-[#242A20]'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 5. More Details Collapsible Accordion (โน้ต, บัญชีย่อย, วันที่, สลิป) */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowMoreDetails(!showMoreDetails)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border-2 border-dashed border-[#242A20]/30 dark:border-[#3C4A38]/70 bg-surfaceElevated-light/60 dark:bg-surfaceElevated-dark/60 text-xs text-neutral-700 dark:text-neutral-300 font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors select-none"
            >
              <div className="flex items-center gap-2">
                <span className="font-silkscreen text-[11px] font-bold text-[#8B1E43]">
                  {showMoreDetails ? '▼' : '►'}
                </span>
                <span className="font-bold">รายละเอียดเพิ่มเติม</span>
                {hasExtraDetails && (
                  <span className="font-pixel text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-[#242A20]">
                    มีข้อมูลแนบ
                  </span>
                )}
              </div>
              <span className="text-[10px] text-neutral-500 font-pixel">
                {showMoreDetails ? 'ซ่อน' : 'โน้ต · วันที่ · สลิป · กล่อง'}
              </span>
            </button>

            {showMoreDetails && (
              <div className="space-y-3.5 pt-3 animate-fade-in">
                {/* Pocket Selector */}
                {(type === 'out' || type === 'in') && pockets && pockets.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-neutral-700 dark:text-neutral-300">
                      <div className="flex items-center gap-1.5">
                        <Wallet size={13} />
                        <span>{type === 'in' ? 'เพิ่มเงินเข้าบัญชีไหน' : 'ตัดเงินจากบัญชีไหน'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setSelectedPocketId(undefined)}
                        className={`text-xs px-2.5 py-1 rounded-xl border-2 transition-all flex items-center gap-1.5 ${
                          !selectedPocketId
                            ? 'bg-[#242A20] text-white dark:bg-white dark:text-[#242A20] border-[#242A20] font-bold shadow-[1px_1px_0px_#242A20]'
                            : 'bg-surface-light dark:bg-surface-dark text-neutral-700 dark:text-neutral-300 border-[#242A20]/30 hover:border-[#242A20]'
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
                            onClick={() => setSelectedPocketId(p.id)}
                            className={`text-xs px-2.5 py-1 rounded-xl border-2 transition-all flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-emerald-600 text-white border-[#242A20] font-bold shadow-[1px_1px_0px_#242A20]'
                                : 'bg-surface-light dark:bg-surface-dark text-neutral-700 dark:text-neutral-300 border-[#242A20]/30 hover:border-[#242A20]'
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

                {/* Note Input with Emoji */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                      บันทึกช่วยจำ (หมายเหตุ)
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsEmojiPickerOpen(true)}
                      className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-bold hover:underline"
                    >
                      <Smile size={13} />
                      <span>เลือก Emoji</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="เช่น ข้าวเที่ยง, ค่าตั๋วหนัง..."
                      className="w-full px-3.5 py-2.5 bg-surface-light dark:bg-surface-dark border-2 border-[#242A20] dark:border-[#3C4A38] rounded-xl text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setIsEmojiPickerOpen(true)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-1"
                      title="เลือก Emoji"
                    >
                      <Smile size={17} />
                    </button>
                  </div>

                  {/* Quick Emoji Bar */}
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-0.5 pb-1">
                    <span className="text-[11px] text-neutral-400 shrink-0 select-none">ด่วน:</span>
                    {POPULAR_EXPENSE_EMOJIS.slice(0, 8).map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setNote((prev) => setLeadingEmoji(prev, emoji));
                        }}
                        className="w-7 h-7 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-base flex items-center justify-center shrink-0 active:scale-90 transition-transform select-none"
                      >
                        {emoji}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setIsEmojiPickerOpen(true)}
                      className="text-[11px] px-2 py-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 shrink-0 font-medium"
                    >
                      + เพิ่ม
                    </button>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                      วันที่และเวลา
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setDate(todayStr)}
                        className={`text-[10px] px-2 py-0.5 rounded-md font-bold select-none ${
                          date === todayStr
                            ? 'bg-[#242A20] text-white dark:bg-white dark:text-[#242A20]'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600'
                        }`}
                      >
                        วันนี้
                      </button>
                      <button
                        type="button"
                        onClick={() => setDate(yesterdayStr)}
                        className={`text-[10px] px-2 py-0.5 rounded-md font-bold select-none ${
                          date === yesterdayStr
                            ? 'bg-[#242A20] text-white dark:bg-white dark:text-[#242A20]'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600'
                        }`}
                      >
                        เมื่อวาน
                      </button>
                      <button
                        type="button"
                        onClick={() => setTime(getLocalTimeString())}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 font-bold select-none"
                      >
                        ตอนนี้
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative h-11 px-3 rounded-xl border-2 border-[#242A20] dark:border-[#3C4A38] bg-surface-light dark:bg-surface-dark flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_#242A20]">
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
                    <div className="relative h-11 px-3 rounded-xl border-2 border-[#242A20] dark:border-[#3C4A38] bg-surface-light dark:bg-surface-dark flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_#242A20]">
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

                {/* Slip Scanner */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block">
                    สลิปโอนเงิน
                  </label>
                  {slipThumbnail ? (
                    <div className="p-3 rounded-xl bg-surface-light dark:bg-surface-dark border-2 border-[#242A20] dark:border-[#3C4A38] flex items-center justify-between gap-3 shadow-[1px_1px_0px_#242A20]">
                      <div
                        className="flex items-center gap-2.5 min-w-0 cursor-pointer"
                        onClick={() => setIsViewerOpen(true)}
                      >
                        <img
                          src={slipThumbnail}
                          alt="สลิป"
                          className="w-10 h-12 object-cover rounded-lg border border-[#242A20]"
                        />
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 block truncate">
                            แนบสลิปแล้ว
                          </span>
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium underline">
                            แตะเพื่อดูสลิปเต็ม
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSlipThumbnail(undefined);
                          setFullSlipBase64(undefined);
                        }}
                        className="p-1.5 text-neutral-400 hover:text-red-500"
                        title="ลบสลิป"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onOpenScanner?.(type)}
                      className="w-full py-2.5 px-3 rounded-xl border-2 border-dashed border-[#242A20]/40 dark:border-[#3C4A38] text-xs font-bold flex items-center justify-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <Camera size={15} strokeWidth={2} className="text-emerald-600" />
                      <span>สแกนสลิป หรือเลือกรูปภาพ</span>
                    </button>
                  )}
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
            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border-2 border-red-400 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle size={15} strokeWidth={2} />
              <span className="font-bold">{errorMsg}</span>
            </div>
          )}
        </div>
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
    </>
  );
};
