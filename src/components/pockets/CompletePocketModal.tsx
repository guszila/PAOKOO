import React, { useState } from 'react';
import { BottomSheet } from '../common/BottomSheet';
import { Button } from '../common/Button';
import { PocketSummary } from '../../types/pocket';
import { formatSatang } from '../../lib/money';
import { POCKET_ICONS } from './PocketModal';
import { CheckCircle2, ArrowDownToDot, RefreshCw, AlertCircle, Wallet } from 'lucide-react';
import { DEFAULT_EXPENSE_CATEGORIES } from '../../config/categories';
import { getCategoryEmoji } from '../../config/emojis';

interface CompletePocketModalProps {
  isOpen: boolean;
  onClose: () => void;
  pocketSummary: PocketSummary | null;
  memberNames: string[];
  categories?: string[];
  onCompletePocket: (
    pocketId: string,
    action: 'record_expense' | 'refund_to_pool',
    expenseData?: {
      amountSatang: number;
      note: string;
      who: string;
      category: string;
    }
  ) => void;
}

export const CompletePocketModal: React.FC<CompletePocketModalProps> = ({
  isOpen,
  onClose,
  pocketSummary,
  memberNames,
  categories = DEFAULT_EXPENSE_CATEGORIES,
  onCompletePocket,
}) => {
  if (!pocketSummary) return null;

  const { pocket, remainingSatang, spentSatang, totalAllocatedSatang } = pocketSummary;
  const budget = totalAllocatedSatang ?? pocket.allocatedSatang;
  const hasRemaining = remainingSatang > 0;

  // Selected resolution: 'record_expense' or 'refund_to_pool'
  const [resolution, setResolution] = useState<'record_expense' | 'refund_to_pool'>(
    'record_expense'
  );
  const [note, setNote] = useState(`เคลียร์กล่อง ${pocket.name}`);
  const [who, setWho] = useState(memberNames[0] || 'เรา');
  const [category, setCategory] = useState(
    categories.includes('ท่องเที่ยว') ? 'ท่องเที่ยว' : categories[0] || 'อื่นๆ'
  );

  const IconComp = (pocket.icon && POCKET_ICONS[pocket.icon]) || Wallet;

  const handleConfirm = () => {
    if (hasRemaining && resolution === 'record_expense') {
      onCompletePocket(pocket.id, 'record_expense', {
        amountSatang: remainingSatang,
        note: note.trim() || `เคลียร์กล่อง ${pocket.name}`,
        who,
        category,
      });
    } else {
      onCompletePocket(pocket.id, 'refund_to_pool');
    }
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="เคลียร์กล่อง / จบรอบการใช้">
      <div className="space-y-4">
        {/* Pocket Overview Card */}
        <div className="p-3.5 rounded-2xl bg-surfaceElevated-light dark:bg-surfaceElevated-dark border-2 border-[#242A20] dark:border-[#3C4A38] shadow-[2px_2px_0px_#242A20]">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white border-2 border-[#242A20] shadow-[1.5px_1.5px_0px_#242A20] shrink-0"
              style={{ backgroundColor: pocket.color || '#8B5CF6' }}
            >
              <IconComp size={20} strokeWidth={2.5} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate">
                {pocket.name}
              </h3>
              <p className="text-[11px] text-neutral-500">
                งบทั้งหมด {formatSatang(budget)} ฿ · ใช้ไปแล้ว {formatSatang(spentSatang)} ฿
              </p>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-[#242A20]/20 dark:border-[#3C4A38] flex items-center justify-between text-xs">
            <span className="text-neutral-600 dark:text-neutral-400 font-medium">
              ยอดคงเหลือในกล่อง:
            </span>
            <span className="font-extrabold text-sm tabular-nums text-neutral-900 dark:text-neutral-100">
              {formatSatang(remainingSatang)} ฿
            </span>
          </div>
        </div>

        {/* Resolution Options */}
        {hasRemaining ? (
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200 block">
              จัดการยอดคงเหลือ {formatSatang(remainingSatang)} ฿ อย่างไรดี?
            </label>

            {/* Option 1: Record as real expense (deducts from main savings) */}
            <div
              onClick={() => setResolution('record_expense')}
              className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                resolution === 'record_expense'
                  ? 'border-[#242A20] dark:border-white bg-[#9BBC0F]/20 dark:bg-[#283824] shadow-[2px_2px_0px_#242A20]'
                  : 'border-[#242A20]/30 dark:border-[#3C4A38] bg-surface-light dark:bg-surface-dark hover:border-[#242A20]'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <input
                  type="radio"
                  name="resolution"
                  checked={resolution === 'record_expense'}
                  onChange={() => setResolution('record_expense')}
                  className="mt-0.5"
                />
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                    <ArrowDownToDot size={14} className="text-[#306230] dark:text-[#9BBC0F]" />
                    <span>บันทึกเป็นรายจ่ายจริง (ตัดเงินออกจากกองกลาง)</span>
                  </div>
                  <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    ระบบจะสร้างรายการรายจ่าย {formatSatang(remainingSatang)} ฿ ให้ทันที เงินจะถูกตัดออกจากกองกลางจริง และเก็บประวัติไว้ครบถ้วน
                  </p>
                </div>
              </div>

              {/* Extra input fields if Option 1 is chosen */}
              {resolution === 'record_expense' && (
                <div className="mt-3 pt-2.5 border-t border-[#242A20]/20 dark:border-[#3C4A38] space-y-2.5 animate-fade-in">
                  <div>
                    <label className="text-[10px] font-bold text-neutral-500 block mb-1">
                      ใครเป็นคนจ่าย?
                    </label>
                    <div className="flex gap-1.5 flex-wrap">
                      {memberNames.map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setWho(m);
                          }}
                          className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                            who === m
                              ? 'bg-[#242A20] text-white dark:bg-white dark:text-[#242A20] font-bold'
                              : 'bg-surface-light dark:bg-surface-dark text-neutral-700 dark:text-neutral-300 border-[#242A20]/30'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-neutral-500 block mb-1">
                      หมวดหมู่รายจ่าย
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full px-3 py-1.5 text-xs bg-surface-light dark:bg-surface-dark border-2 border-[#242A20] dark:border-[#3C4A38] rounded-lg font-medium"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {getCategoryEmoji(c)} {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-neutral-500 block mb-1">
                      บันทึกช่วยจำ (โน้ต)
                    </label>
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="เช่น ค่าทริปท่องเที่ยว, จบกิจกรรม"
                      className="w-full px-3 py-1.5 text-xs bg-surface-light dark:bg-surface-dark border-2 border-[#242A20] dark:border-[#3C4A38] rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Option 2: Refund remaining money back to pool */}
            <div
              onClick={() => setResolution('refund_to_pool')}
              className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                resolution === 'refund_to_pool'
                  ? 'border-[#242A20] dark:border-white bg-amber-50 dark:bg-amber-950/40 shadow-[2px_2px_0px_#242A20]'
                  : 'border-[#242A20]/30 dark:border-[#3C4A38] bg-surface-light dark:bg-surface-dark hover:border-[#242A20]'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <input
                  type="radio"
                  name="resolution"
                  checked={resolution === 'refund_to_pool'}
                  onChange={() => setResolution('refund_to_pool')}
                  className="mt-0.5"
                />
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                    <RefreshCw size={14} className="text-amber-600 dark:text-amber-400" />
                    <span>คืนเงินที่เหลือ ({formatSatang(remainingSatang)} ฿) กลับเข้ากองกลาง</span>
                  </div>
                  <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    ใช้ไม่หมด ไม่ต้องการบันทึกเป็นรายจ่าย ยอด {formatSatang(remainingSatang)} ฿ จะคืนกลับสู่ยอดกองกลางพร้อมใช้
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Empty or fully spent */
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-200">
            <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
            <div>
              <p className="font-bold">ใช้เงินในกล่องนี้ครบตามงบ 100% แล้ว!</p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                ยอดเงินถูกตัดจากกองกลางผ่านรายการใช้จ่ายครบถ้วน สามารถปิดกล่องเพื่อเก็บประวัติได้เลยครับ
              </p>
            </div>
          </div>
        )}

        {/* Explanation Note */}
        <div className="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-300 dark:border-neutral-700 text-[11px] text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0 text-neutral-500" />
          <span>
            กล่องนี้จะถูกย้ายไปที่ <strong>"ประวัติกล่องที่ปิดรอบแล้ว"</strong> โดยไม่ลบประวัติรายการในอดีต
          </span>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex gap-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            ยกเลิก
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleConfirm}
            className="flex-1 font-bold"
          >
            ✓ ยืนยันเคลียร์กล่อง
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
};
