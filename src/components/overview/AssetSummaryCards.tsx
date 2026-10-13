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
  Coins,
} from 'lucide-react';

interface AssetSummaryCardsProps {
  currentBalance: number;
  totalLentOut: number;
  thisMonthExpenses: number;
  thisMonthDeposits: number;
  topExpenseCategory?: { category: string; amount: number };
  debtors: OutstandingDebtor[];
  onRepayClick: (debtor: OutstandingDebtor, amount?: number) => void;
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
    <div className="space-y-2">
      {/* Section Header with 8-bit aesthetic */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-[#9BBC0F] border border-[#242A20] shadow-[1px_1px_0px_#242A20]" />
          <h3 className="font-silkscreen text-[11px] font-bold text-neutral-800 dark:text-neutral-200 tracking-wider">
            STATUS / สรุปสินทรัพย์
          </h3>
        </div>
        <span className="font-pixel text-[9px] text-[#242A20]/70 dark:text-[#9BBC0F]/80">
          2x2 GRID
        </span>
      </div>

      {/* 4 Cards in 2x2 Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* 1. เงินเก็บคงเหลือ (Current Balance / Main Asset) */}
        <div className="dmg-screen rounded-xl p-3 flex flex-col justify-between min-h-[110px] relative overflow-hidden group">
          {/* Subtle matrix scanlines overlay */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(currentColor_1px,transparent_1px)] [background-size:6px_6px] opacity-10" />

          <div className="flex items-center justify-between gap-1 relative z-10">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded border border-current bg-black/10 flex items-center justify-center shadow-[1px_1px_0px_currentColor]">
                <Wallet size={13} strokeWidth={2.5} />
              </div>
              <span className="text-[11px] font-bold tracking-tight">
                เงินเก็บคงเหลือ
              </span>
            </div>
            <span className="font-pixel text-[8px] px-1 py-0.5 border border-current bg-black/10 rounded">
              MAIN
            </span>
          </div>

          <div className="my-1.5 relative z-10">
            <div className="font-silkscreen text-base font-bold tracking-tight truncate leading-tight">
              {isMasked ? '••••••' : `${formatSatang(currentBalance)} ฿`}
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] opacity-90 font-medium relative z-10">
            <span>สินทรัพย์หลัก</span>
            <span className="font-pixel text-[8px] bg-black/20 px-1 rounded-sm border border-current">
              READY
            </span>
          </div>
        </div>

        {/* 2. เงินที่ให้ยืม / สำรองจ่าย (Lent Out - 2-Player Link) */}
        <div
          onClick={() => setIsDebtorsExpanded(!isDebtorsExpanded)}
          className={`bg-surface-light dark:bg-surface-dark border-2 border-[#242A20] dark:border-[#3C4A38] shadow-[3px_3px_0px_#242A20] dark:shadow-[3px_3px_0px_#0A0F0A] rounded-xl p-3 flex flex-col justify-between min-h-[110px] cursor-pointer select-none transition-all active:translate-x-[1px] active:translate-y-[1px] ${
            isDebtorsExpanded ? 'ring-2 ring-[#B45309]' : ''
          }`}
        >
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded border border-[#242A20] dark:border-[#3C4A38] bg-amber-200 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 flex items-center justify-center shadow-[1px_1px_0px_#242A20]">
                <HandCoins size={13} strokeWidth={2.5} />
              </div>
              <span className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200">
                เงินให้ยืม
              </span>
            </div>
            <span className="font-pixel text-[8px] px-1 py-0.5 border border-[#242A20] dark:border-[#3C4A38] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded">
              2P
            </span>
          </div>

          <div className="my-1.5">
            <div className="font-silkscreen text-base font-bold text-amber-700 dark:text-amber-400 tracking-tight truncate leading-tight">
              {isMasked ? '••••••' : `${formatSatang(totalLentOut)} ฿`}
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-neutral-600 dark:text-neutral-400 font-medium">
            <span className="truncate">ค้าง {debtors.length} คน</span>
            <div className="flex items-center gap-0.5 font-pixel text-[8px] bg-amber-200 dark:bg-amber-900/70 text-amber-900 dark:text-amber-200 px-1 py-0.5 rounded border border-[#242A20] dark:border-[#3C4A38]">
              <span>{isDebtorsExpanded ? 'HIDE' : 'VIEW'}</span>
              {isDebtorsExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            </div>
          </div>
        </div>

        {/* 3. ค่าใช้จ่ายเดือนนี้ (Expenses / HP DMG) */}
        <div className="bg-surface-light dark:bg-surface-dark border-2 border-[#242A20] dark:border-[#3C4A38] shadow-[3px_3px_0px_#242A20] dark:shadow-[3px_3px_0px_#0A0F0A] rounded-xl p-3 flex flex-col justify-between min-h-[110px]">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded border border-[#242A20] dark:border-[#3C4A38] bg-red-100 dark:bg-red-950/60 text-[#8B1E43] dark:text-red-400 flex items-center justify-center shadow-[1px_1px_0px_#242A20]">
                <ArrowUpRight size={13} strokeWidth={2.5} />
              </div>
              <span className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200">
                จ่ายเดือนนี้
              </span>
            </div>
            <span className="font-pixel text-[8px] px-1 py-0.5 border border-[#242A20] dark:border-[#3C4A38] bg-red-100 dark:bg-red-950 text-[#8B1E43] dark:text-red-300 rounded">
              OUT
            </span>
          </div>

          <div className="my-1.5">
            <div className="font-silkscreen text-base font-bold text-[#8B1E43] dark:text-red-400 tracking-tight truncate leading-tight">
              {isMasked ? '••••••' : `-${formatSatang(thisMonthExpenses)} ฿`}
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-neutral-600 dark:text-neutral-400 font-medium">
            <span className="truncate max-w-[85px]" title={topExpenseCategory?.category || 'ไม่มีรายจ่าย'}>
              {topExpenseCategory ? topExpenseCategory.category : 'ไม่มีจ่าย'}
            </span>
            <span className="font-pixel text-[8px] text-[#8B1E43] dark:text-red-400">
              {topExpenseCategory ? `${formatSatang(topExpenseCategory.amount)}฿` : '0฿'}
            </span>
          </div>
        </div>

        {/* 4. เงินเข้าเดือนนี้ (Deposits / 1-UP Coin In) */}
        <div className="bg-surface-light dark:bg-surface-dark border-2 border-[#242A20] dark:border-[#3C4A38] shadow-[3px_3px_0px_#242A20] dark:shadow-[3px_3px_0px_#0A0F0A] rounded-xl p-3 flex flex-col justify-between min-h-[110px]">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded border border-[#242A20] dark:border-[#3C4A38] bg-emerald-100 dark:bg-emerald-950/60 text-[#306230] dark:text-emerald-400 flex items-center justify-center shadow-[1px_1px_0px_#242A20]">
                <ArrowDownLeft size={13} strokeWidth={2.5} />
              </div>
              <span className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200">
                เงินเข้าเดือนนี้
              </span>
            </div>
            <span className="font-pixel text-[8px] px-1 py-0.5 border border-[#242A20] dark:border-[#3C4A38] bg-emerald-100 dark:bg-emerald-950 text-[#306230] dark:text-emerald-300 rounded">
              1-UP
            </span>
          </div>

          <div className="my-1.5">
            <div className="font-silkscreen text-base font-bold text-[#306230] dark:text-emerald-400 tracking-tight truncate leading-tight">
              {isMasked ? '••••••' : `+${formatSatang(thisMonthDeposits)} ฿`}
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-neutral-600 dark:text-neutral-400 font-medium">
            <span>ฝากเข้า</span>
            <span className="font-pixel text-[8px] bg-emerald-200 dark:bg-emerald-900/80 text-[#0F380F] dark:text-emerald-200 px-1 rounded-sm border border-[#242A20] dark:border-[#3C4A38]">
              COIN
            </span>
          </div>
        </div>
      </div>

      {/* Expanded Debtor Inventory Drawer (Below 2x2 grid, full width) */}
      {isDebtorsExpanded && (
        <div className="bg-surface-light dark:bg-surface-dark border-2 border-[#242A20] dark:border-[#3C4A38] shadow-[3px_3px_0px_#242A20] dark:shadow-[3px_3px_0px_#0A0F0A] rounded-xl p-3 space-y-2 animate-fade-in mt-2">
          <div className="flex items-center justify-between border-b-2 border-dashed border-[#242A20]/30 dark:border-[#3C4A38] pb-1.5">
            <div className="flex items-center gap-1.5">
              <Coins size={14} className="text-amber-600 dark:text-amber-400" />
              <span className="font-silkscreen text-[10px] font-bold text-neutral-800 dark:text-neutral-200">
                QUEST / รายการค้างคืน ({debtors.length})
              </span>
            </div>
            <button
              onClick={() => setIsDebtorsExpanded(false)}
              className="font-pixel text-[8px] text-neutral-500 hover:text-neutral-800 dark:hover:text-white"
            >
              [X CLOSE]
            </button>
          </div>

          {debtors.length === 0 ? (
            <div className="py-3 text-center text-xs text-neutral-500 font-medium">
              เคลียร์ครบทุกยอดแล้ว! ALL CLEARED ★
            </div>
          ) : (
            <div className="space-y-1.5 pt-1">
              {debtors.map((debtor) => (
                <div
                  key={debtor.who}
                  className="flex items-center justify-between p-2 rounded-lg bg-surfaceElevated-light dark:bg-surfaceElevated-dark border border-[#242A20] dark:border-[#3C4A38] gap-2"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate flex items-center gap-1">
                      <span className="font-pixel text-[8px] text-amber-600">P:</span>
                      {debtor.who}
                    </div>
                    <div className="text-[10px] text-neutral-500 tabular-nums">
                      ยอดเดิม {formatSatang(debtor.totalLent)} ฿
                      {debtor.totalRepaid > 0 && ` (คืนแล้ว ${formatSatang(debtor.totalRepaid)})`}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-silkscreen text-xs font-bold text-amber-700 dark:text-amber-400 mr-0.5">
                      {isMasked ? '••••' : `${formatSatang(debtor.balance)} ฿`}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRepayClick(debtor, Math.round(debtor.balance / 2));
                      }}
                      className="text-[10px] px-2 py-1 rounded bg-[#B45309] hover:bg-[#92400e] text-white border border-[#242A20] shadow-[1px_1px_0px_#242A20] font-silkscreen font-bold active:translate-x-[1px] active:translate-y-[1px] select-none"
                      title="บันทึกคืนครึ่งหนึ่ง (50%)"
                    >
                      50%
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRepayClick(debtor, debtor.balance);
                      }}
                      className="text-[10px] px-2 py-1 rounded bg-[#306230] hover:bg-[#254d25] text-[#9BBC0F] border border-[#242A20] shadow-[1px_1px_0px_#242A20] font-silkscreen font-bold active:translate-x-[1px] active:translate-y-[1px] select-none"
                      title="บันทึกคืนครบเต็มจำนวน (100%)"
                    >
                      คืนเต็ม
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
