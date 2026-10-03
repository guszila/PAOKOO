import React, { useState } from 'react';
import { OutstandingDebtor } from '../../types/transaction';
import { formatSatang } from '../../lib/money';
import { Button } from '../common/Button';
import {
  Wallet,
  HandCoins,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface AssetSummaryCardsProps {
  currentBalance: number;
  totalLentOut: number;
  thisMonthExpenses: number;
  thisMonthDeposits: number;
  topExpenseCategory?: { category: string; amount: number };
  debtors: OutstandingDebtor[];
  onRepayClick: (debtor: OutstandingDebtor) => void;
  isMasked?: boolean;
}

export const AssetSummaryCards: React.FC<AssetSummaryCardsProps> = ({
  currentBalance,
  totalLentOut,
  thisMonthExpenses,
  thisMonthDeposits,
  topExpenseCategory,
  debtors,
  onRepayClick,
  isMasked = false,
}) => {
  const [isDebtorsExpanded, setIsDebtorsExpanded] = useState(false);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
          สรุปสินทรัพย์และกระแสเงิน
        </h3>
      </div>

      {/* 1. เงินเก็บคงเหลือ (Balance) */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Wallet size={19} strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-neutral-500">เงินเก็บคงเหลือ</div>
            <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              สินทรัพย์หลักในบัญชี
            </div>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {isMasked ? '••••' : `${formatSatang(currentBalance)} ฿`}
          </div>
          <div className="text-[10px] text-neutral-400">พร้อมใช้งาน</div>
        </div>
      </div>

      {/* 2. เงินที่ให้ยืม (Outstanding total - expandable) */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-4 shadow-sm transition-all space-y-3">
        <div
          onClick={() => setIsDebtorsExpanded(!isDebtorsExpanded)}
          className="flex items-center justify-between gap-3 cursor-pointer select-none"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <HandCoins size={19} strokeWidth={1.5} />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-neutral-500">เงินที่ให้ยืม / สำรองจ่าย</div>
              <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                <span>ค้างคืน {debtors.length} คน</span>
                {isDebtorsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-sm font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
              {isMasked ? '••••' : `${formatSatang(totalLentOut)} ฿`}
            </div>
            <div className="text-[10px] text-neutral-400">รอรับคืน</div>
          </div>
        </div>

        {/* Expanded Debtor List */}
        {isDebtorsExpanded && (
          <div className="pt-2 border-t border-border-light dark:border-border-dark space-y-2 animate-fade-in">
            {debtors.length === 0 ? (
              <div className="py-2 text-center text-xs text-neutral-400">
                ไม่มีรายการค้างคืน ยอดเคลียร์ครบแล้ว 🎉
              </div>
            ) : (
              debtors.map((debtor) => (
                <div
                  key={debtor.who}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-surfaceElevated-light dark:bg-surfaceElevated-dark border border-border-light dark:border-border-dark gap-2"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                      {debtor.who}
                    </div>
                    <div className="text-[11px] text-neutral-500 tabular-nums">
                      ยืม {formatSatang(debtor.totalLent)} ฿
                      {debtor.totalRepaid > 0 && ` (คืนแล้ว ${formatSatang(debtor.totalRepaid)})`}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
                      {isMasked ? '••••' : `${formatSatang(debtor.balance)} ฿`}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRepayClick(debtor);
                      }}
                      className="text-xs px-2.5 py-1 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800 hover:bg-teal-50 dark:hover:bg-teal-950/40"
                    >
                      คืนแล้ว
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 3. ค่าใช้จ่ายเดือนนี้ (Expenses) */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
            <ArrowUpRight size={19} strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-neutral-500">ค่าใช้จ่ายเดือนนี้</div>
            <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300 truncate mt-0.5">
              {topExpenseCategory ? (
                <span>หมวดสูงสุด: <b className="text-neutral-900 dark:text-white">{topExpenseCategory.category}</b> ({formatSatang(topExpenseCategory.amount)} ฿)</span>
              ) : (
                'ยังไม่มีบันทึกรายจ่ายเดือนนี้'
              )}
            </div>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-sm font-semibold text-red-600 dark:text-red-400 tabular-nums">
            {isMasked ? '••••' : `-${formatSatang(thisMonthExpenses)} ฿`}
          </div>
          <div className="text-[10px] text-neutral-400">เงินไหลออก</div>
        </div>
      </div>

      {/* 4. เงินเข้าเดือนนี้ (Deposits) */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <ArrowDownLeft size={19} strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-neutral-500">เงินเข้าเดือนนี้</div>
            <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mt-0.5">
              เงินฝากเข้ากองกลาง
            </div>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {isMasked ? '••••' : `+${formatSatang(thisMonthDeposits)} ฿`}
          </div>
          <div className="text-[10px] text-neutral-400">เงินไหลเข้า</div>
        </div>
      </div>
    </div>
  );
};
