import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, TransactionType } from '../../types/transaction';
import { BottomSheet } from '../common/BottomSheet';
import { Button } from '../common/Button';
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
} from 'lucide-react';
import { SlipViewerModal } from '../scanner/SlipViewerModal';
import { Pocket, PocketSummary } from '../../types/pocket';

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
  categories?: string[];
  pockets?: Pocket[];
  pocketSummaries?: PocketSummary[];
  onOpenScanner?: () => void;
}

export const TransactionFormSheet: React.FC<TransactionFormSheetProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialTransaction,
  prefill,
  existingTransactions,
  memberNames,
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
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState<string>('');
  const [refNo, setRefNo] = useState<string>('');
  const [slipThumbnail, setSlipThumbnail] = useState<string | undefined>();
  const [fullSlipBase64, setFullSlipBase64] = useState<string | undefined>();
  const [selectedPocketId, setSelectedPocketId] = useState<string | undefined>(undefined);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const [showOverRepaymentWarning, setShowOverRepaymentWarning] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const isFutureDate = date > todayStr;

  // Sync form state when opened or changed
  useEffect(() => {
    if (!isOpen) return;

    if (initialTransaction) {
      setType(initialTransaction.type);
      setAmountStr(satangToBaht(initialTransaction.amount).toString());
      setWho(initialTransaction.who);
      setNote(initialTransaction.note || '');
      setCategory(initialTransaction.category || 'อื่นๆ');
      setSelectedPocketId(initialTransaction.pocketId);
      setDate(initialTransaction.date);
      setTime(initialTransaction.time || '');
      setRefNo(initialTransaction.refNo || '');
      setSlipThumbnail(initialTransaction.slipThumbnail);
      setFullSlipBase64(undefined);
    } else if (prefill) {
      setType(prefill.type || 'out');
      setAmountStr(prefill.amount ? satangToBaht(prefill.amount).toString() : '');
      setWho(prefill.who || '');
      setNote(prefill.note || '');
      setCategory(prefill.category || categories[0] || 'อาหาร');
      setSelectedPocketId(prefill.pocketId);
      setDate(prefill.date || new Date().toISOString().slice(0, 10));
      setTime(prefill.time || new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false }));
      setRefNo(prefill.refNo || '');
      setSlipThumbnail(prefill.slipThumbnail);
      setFullSlipBase64(prefill.fullSlipBase64);
    } else {
      setType('out');
      setAmountStr('');
      setWho(memberNames[0] || '');
      setNote('');
      setCategory(categories[0] || 'อาหาร');
      setSelectedPocketId(undefined);
      setDate(new Date().toISOString().slice(0, 10));
      setTime(new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false }));
      setRefNo('');
      setSlipThumbnail(undefined);
      setFullSlipBase64(undefined);
    }

    setErrorMsg(null);
    setShowOverRepaymentWarning(false);
    setShowDeleteConfirm(false);
  }, [isOpen, initialTransaction, prefill, memberNames, categories]);

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
        pocketId: type === 'out' ? selectedPocketId : undefined,
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

  return (
    <>
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title={initialTransaction ? 'แก้ไขรายการ' : 'บันทึกรายการใหม่'}
      >
        <div className="space-y-4">
          {/* Type Selector (4 Segmented Tabs) */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-surfaceElevated-light dark:bg-surfaceElevated-dark rounded-2xl border border-border-light dark:border-border-dark">
            {typesList.map((t) => {
              const Icon = t.icon;
              const isSelected = type === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setType(t.key)}
                  className={`min-h-[44px] flex flex-col items-center justify-center rounded-xl text-xs transition-all select-none ${
                    isSelected
                      ? 'bg-surface-light dark:bg-surface-dark text-neutral-900 dark:text-white font-medium shadow-sm border border-border-light dark:border-border-dark'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Icon size={16} strokeWidth={1.5} className={`mb-0.5 ${isSelected ? t.color : ''}`} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Large Amount Input */}
          <div className="bg-surfaceElevated-light dark:bg-surfaceElevated-dark border border-border-light dark:border-border-dark rounded-2xl p-4 text-center">
            <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider block mb-1">
              จำนวนเงิน (บาท)
            </label>
            <div className="flex items-center justify-center gap-1">
              <span className="text-2xl text-neutral-400 font-light">฿</span>
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
                className="w-full text-center text-4xl font-light tracking-tight bg-transparent text-neutral-900 dark:text-neutral-50 focus:outline-none tabular-nums placeholder:text-neutral-300 dark:placeholder:text-neutral-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0"
                autoFocus={!initialTransaction && !prefill}
              />
            </div>

            {/* Quick Helper if repayment */}
            {type === 'back' && who.trim() && (
              <div className="mt-2 text-xs text-neutral-500">
                ยอดค้างชำระปัจจุบันของ {who}:{' '}
                <span className="font-semibold text-amber-500">
                  {formatSatang(currentDebtorDebt)} ฿
                </span>
              </div>
            )}
          </div>

          {/* Expense Category Chips (Shown ONLY when type === 'out') */}
          {type === 'out' && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300">
                <Tag size={13} />
                <span>หมวดหมู่รายจ่าย</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${
                      category === cat
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white font-medium shadow-sm'
                        : 'bg-surface-light dark:bg-surface-dark text-neutral-600 dark:text-neutral-400 border-border-light dark:border-border-dark hover:border-neutral-400'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Spending Pocket Selector (ตัดจากกล่องไหน) */}
          {type === 'out' && pockets && pockets.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-medium text-neutral-700 dark:text-neutral-300">
                <div className="flex items-center gap-1.5">
                  <Wallet size={13} />
                  <span>ตัดเงินจากกล่องไหน</span>
                </div>
                {selectedPocketId && (
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    ตัดจากกล่องแบ่งใช้
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Option 1: เงินกองกลางหลัก */}
                <button
                  type="button"
                  onClick={() => setSelectedPocketId(undefined)}
                  className={`text-xs px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 ${
                    !selectedPocketId
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white font-medium shadow-sm'
                      : 'bg-surface-light dark:bg-surface-dark text-neutral-600 dark:text-neutral-400 border-border-light dark:border-border-dark hover:border-neutral-400'
                  }`}
                >
                  <span>🏦</span>
                  <span>กองกลางหลัก</span>
                </button>

                {/* Option 2..N: Pockets */}
                {pockets.map((p) => {
                  const isSelected = selectedPocketId === p.id;
                  const pSummary = pocketSummaries?.find((ps) => ps.pocket.id === p.id);
                  const remainingStr = pSummary ? `${formatSatang(pSummary.remainingSatang)} ฿` : '';
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPocketId(p.id)}
                      className={`text-xs px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 font-medium shadow-sm'
                          : 'bg-surface-light dark:bg-surface-dark text-neutral-600 dark:text-neutral-400 border-border-light dark:border-border-dark hover:border-neutral-400'
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

          {/* Quick-pick Names & Who input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
              {type === 'lend'
                ? 'ให้ใครยืม / จ่ายแทนใคร'
                : type === 'back'
                ? 'ใครโอนเงินคืน'
                : type === 'in'
                ? 'ใครฝากเงินเข้า'
                : 'ใครเป็นคนจ่าย'}
            </label>
            <input
              type="text"
              value={who}
              onChange={(e) => {
                setWho(e.target.value);
                setErrorMsg(null);
              }}
              placeholder="พิมพ์ชื่อ..."
              className="w-full px-3.5 py-2.5 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-100"
            />

            {/* Quick chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[11px] text-neutral-400">ชื่อด่วน:</span>
              {quickPickNames.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setWho(name)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                    who === name
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white font-medium'
                      : 'bg-surface-light dark:bg-surface-dark text-neutral-600 dark:text-neutral-400 border-border-light dark:border-border-dark hover:border-neutral-400'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Note Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
              บันทึกช่วยจำ (หมายเหตุ)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="เช่น ซื้อของ Lotus, ค่าตั๋วหนัง..."
              className="w-full px-3.5 py-2.5 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-100"
            />
          </div>

          {/* Date & Time Row */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                วันที่และเวลาทำรายการ
              </label>
              {time && (
                <span className="text-[11px] text-neutral-400 font-mono">
                  {time} น.
                </span>
              )}
            </div>

            <div className="grid grid-cols-5 gap-2">
              {/* Date Input (3 cols) */}
              <div className="col-span-3 min-w-0">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-100"
                />
              </div>

              {/* Time Input (2 cols) */}
              <div className="col-span-2 min-w-0">
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-2.5 py-2.5 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-100 text-center font-mono"
                  placeholder="00:00"
                />
              </div>
            </div>
          </div>

          {/* Slip Attachment (Full Width) */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block">
              สลิปโอนเงิน (หลักฐาน)
            </label>
            {slipThumbnail ? (
              <div className="p-3 rounded-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark flex items-center justify-between gap-3 shadow-sm">
                <div
                  className="flex items-center gap-3 min-w-0 cursor-pointer group"
                  onClick={() => setIsViewerOpen(true)}
                >
                  <img
                    src={slipThumbnail}
                    alt="สลิป"
                    className="w-11 h-14 object-cover rounded-xl border border-border-light dark:border-border-dark shadow-sm group-hover:opacity-90 transition-opacity"
                  />
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block truncate">
                      แนบสลิปเรียบร้อย
                    </span>
                    {refNo && (
                      <span className="text-[10px] text-neutral-500 font-mono block truncate">
                        Ref: {refNo}
                      </span>
                    )}
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium inline-block mt-0.5 group-hover:underline">
                      แตะเพื่อดูสลิปขนาดเต็ม
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSlipThumbnail(undefined);
                    setFullSlipBase64(undefined);
                  }}
                  className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-red-500 transition-colors"
                  title="ลบสลิปออก"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="md"
                fullWidth
                onClick={() => onOpenScanner?.()}
                className="py-2.5 border-dashed hover:border-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 text-neutral-700 dark:text-neutral-300"
              >
                <Camera size={16} strokeWidth={1.5} className="mr-2 text-emerald-600 dark:text-emerald-400" />
                <span>แตะเพื่อสแกนสลิป หรือเลือกรูปภาพ</span>
              </Button>
            )}
          </div>

          {/* Future Date Warning */}
          {isFutureDate && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-amber-500" />
              <span>วันที่ที่ระบุเป็นวันในอนาคต (โปรดตรวจสอบความถูกต้อง)</span>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle size={15} strokeWidth={1.5} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            {initialTransaction && onDelete && (
              <Button
                type="button"
                variant="danger"
                size="md"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-12 px-0 shrink-0"
                title="ลบรายการ"
              >
                <Trash2 size={18} strokeWidth={1.5} />
              </Button>
            )}
            <Button
              type="button"
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => handleSubmit(false)}
            >
              {initialTransaction ? 'บันทึกการแก้ไข' : 'บันทึกรายการ'}
            </Button>
          </div>
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
    </>
  );
};
