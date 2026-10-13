import React, { useState, useMemo } from 'react';
import { Transaction } from '../../types/transaction';
import { formatSatang } from '../../lib/money';
import { calculateWealthDonut, calculateExpenseCategoryDonut } from '../../lib/donut';
import { DonutChart } from './DonutChart';
import {
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  HandCoins,
  Clock,
} from 'lucide-react';

import { PocketSummary } from '../../types/pocket';
import { triggerCoinShower } from '../../lib/celebration';

interface PortfolioHeroProps {
  currentBalance: number;
  totalLentOut: number;
  grandTotal: number;
  thisMonthNet: number;
  lastMonthNet: number;
  transactions: Transaction[];
  isMasked: boolean;
  onToggleMask: () => void;
  pocketSummaries?: PocketSummary[];
  mainSavingsBalance?: number;
}

export const PortfolioHero: React.FC<PortfolioHeroProps> = ({
  currentBalance,
  totalLentOut,
  grandTotal,
  thisMonthNet,
  lastMonthNet,
  transactions,
  isMasked,
  onToggleMask,
  pocketSummaries,
  mainSavingsBalance,
}) => {
  const [isDonutExpanded, setIsDonutExpanded] = useState(true);
  const [donutTab, setDonutTab] = useState<'wealth' | 'expenses'>('wealth');

  // Month selector for expenses donut (default: current YYYY-MM)
  const [expenseYearMonth, setExpenseYearMonth] = useState(() => {
    return new Date().toISOString().slice(0, 7);
  });

  // Calculate percentage vs last month
  const percentDelta = useMemo(() => {
    if (lastMonthNet === 0) {
      return thisMonthNet > 0 ? '+100%' : '0%';
    }
    const diff = ((thisMonthNet - lastMonthNet) / Math.abs(lastMonthNet)) * 100;
    const sign = diff > 0 ? '+' : '';
    return `${sign}${diff.toFixed(1)}%`;
  }, [thisMonthNet, lastMonthNet]);

  // Donut data
  const wealthDonutData = useMemo(() => {
    return calculateWealthDonut(transactions, pocketSummaries, mainSavingsBalance);
  }, [transactions, pocketSummaries, mainSavingsBalance]);

  const expenseDonutData = useMemo(() => {
    return calculateExpenseCategoryDonut(transactions, expenseYearMonth);
  }, [transactions, expenseYearMonth]);

  // Date formatted for Thai display
  const latestUpdateTime = useMemo(() => {
    if (transactions.length === 0) return 'ยังไม่มีข้อมูล';
    const latestTx = transactions[0];
    const d = new Date(latestTx.updatedAt || latestTx.createdAt);
    if (isNaN(d.getTime())) return latestTx.date;
    return `${d.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: '2-digit',
    })} ${d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`;
  }, [transactions]);

  // Thai month name helper
  const formattedExpenseMonth = useMemo(() => {
    const [y, m] = expenseYearMonth.split('-');
    const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
    return date.toLocaleDateString('th-TH', { month: 'short', year: 'numeric' });
  }, [expenseYearMonth]);

  const handlePrevMonth = () => {
    const [y, m] = expenseYearMonth.split('-').map(Number);
    const date = new Date(y, m - 2, 1);
    const nextY = date.getFullYear();
    const nextM = String(date.getMonth() + 1).padStart(2, '0');
    setExpenseYearMonth(`${nextY}-${nextM}`);
  };

  const handleNextMonth = () => {
    const [y, m] = expenseYearMonth.split('-').map(Number);
    const date = new Date(y, m, 1);
    const nextY = date.getFullYear();
    const nextM = String(date.getMonth() + 1).padStart(2, '0');
    setExpenseYearMonth(`${nextY}-${nextM}`);
  };

  return (
    <div className="relative -mt-8 bg-surface-light dark:bg-surface-dark border-2 border-[#242A20] dark:border-[#3C4A38] rounded-2xl p-4 sm:p-5 shadow-[4px_4px_0px_#242A20] dark:shadow-[4px_4px_0px_#0A0F0A] transition-all z-20">
      {/* Game Boy DMG LCD Screen Display Box */}
      <div className="dmg-screen rounded-xl p-3.5 relative overflow-hidden">
        {/* Subtle dot matrix pattern overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(#0F380F_1px,transparent_1px)] [background-size:5px_5px] opacity-15" />

        {/* Top Screen Bar: Label + Mode + Eye Icon */}
        <div className="flex items-center justify-between relative z-10 text-[10px] font-silkscreen">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-[#0F380F] dark:bg-[#9BBC0F] rounded-full" />
            <span className="font-bold tracking-wider">TOTAL ASSETS / ยอดเงินคงเหลือ</span>
          </div>
          <button
            onClick={onToggleMask}
            className="p-1 hover:opacity-75 transition-opacity"
            title={isMasked ? 'แสดงจำนวนเงิน' : 'ซ่อนจำนวนเงิน'}
            aria-label={isMasked ? 'แสดงจำนวนเงิน' : 'ซ่อนจำนวนเงิน'}
          >
            {isMasked ? <EyeOff size={15} strokeWidth={2.5} /> : <Eye size={15} strokeWidth={2.5} />}
          </button>
        </div>

        {/* Big Retro LCD Balance Number */}
        <div
          onClick={() => triggerCoinShower()}
          className="mt-2 flex items-baseline gap-2 cursor-pointer select-none active:scale-[0.98] transition-transform relative z-10"
          title="แตะเพื่อโปรยเหรียญ! ★"
        >
          <span className="text-3xl sm:text-4xl font-black tracking-tight truncate leading-tight">
            {isMasked ? '••••••••' : formatSatang(currentBalance)}
          </span>
          <span className="text-sm font-bold opacity-80">
            ฿
          </span>
        </div>

        {/* Screen Bottom Metrics: Net change & Lent badge */}
        <div className="mt-2.5 flex items-center gap-2 flex-wrap relative z-10 text-[10px]">
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-[#0F380F] dark:border-[#3C4A38] bg-[#8BAC0F]/80 dark:bg-[#2A3E26] text-[10px] font-bold shadow-[1px_1px_0px_#0F380F]">
            {thisMonthNet >= 0 ? (
              <TrendingUp size={11} strokeWidth={3} />
            ) : (
              <TrendingDown size={11} strokeWidth={3} />
            )}
            <span>
              {thisMonthNet >= 0 ? '+' : ''}
              {isMasked ? '••••' : `${formatSatang(thisMonthNet)}฿`}
            </span>
            <span className="opacity-80">({percentDelta})</span>
          </div>

          {totalLentOut > 0 && (
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-[#0F380F] dark:border-[#3C4A38] bg-[#8BAC0F]/80 dark:bg-[#2A3E26] text-[10px] font-bold">
              <HandCoins size={11} strokeWidth={2.5} />
              <span>LENT {isMasked ? '••' : `${formatSatang(totalLentOut)}฿`}</span>
            </div>
          )}
        </div>
      </div>

      {/* Pocket Breakdown (Sub-Wallet Breakdown) */}
      {pocketSummaries && pocketSummaries.length > 0 && (
        <div className="mt-3 p-2 rounded-xl bg-surfaceElevated-light dark:bg-surfaceElevated-dark border border-[#242A20] dark:border-[#3C4A38] flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs">🏦</span>
            <span className="text-neutral-600 dark:text-neutral-400 truncate text-[11px]">กองกลาง:</span>
            <span className="font-bold text-neutral-900 dark:text-neutral-100 text-[11px] tabular-nums">
              {isMasked ? '••••' : `${formatSatang(mainSavingsBalance ?? currentBalance)} ฿`}
            </span>
          </div>
          <div className="h-3.5 w-px bg-[#242A20]/20 dark:bg-[#3C4A38] mx-2 shrink-0" />
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs">👛</span>
            <span className="text-neutral-600 dark:text-neutral-400 truncate text-[11px]">กล่องแบ่ง:</span>
            <span className="font-bold text-neutral-900 dark:text-neutral-100 text-[11px] tabular-nums">
              {isMasked
                ? '••••'
                : `${formatSatang(pocketSummaries.reduce((sum, p) => sum + p.remainingSatang, 0))} ฿`}
            </span>
          </div>
        </div>
      )}

      {/* Subline: Grand Total & Latest Update */}
      <div className="mt-2.5 pt-2 border-t-2 border-dashed border-[#242A20]/20 dark:border-[#3C4A38]/50 flex items-center justify-between text-[11px] text-neutral-600 dark:text-neutral-400">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold text-neutral-500">GRAND TOTAL:</span>
          <span className="font-bold text-neutral-800 dark:text-neutral-200">
            {isMasked ? '••••' : `${formatSatang(grandTotal)} ฿`}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px]">
          <Clock size={10} />
          <span>{latestUpdateTime}</span>
        </div>
      </div>

      {/* Donut Toggle Header */}
      <div className="mt-3 pt-2 border-t-2 border-[#242A20] dark:border-[#3C4A38] flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-[#8B1E43] rounded-full" />
          <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
            CHART / สัดส่วนการเงิน
          </span>
        </div>
        <button
          onClick={() => setIsDonutExpanded(!isDonutExpanded)}
          className="flex items-center gap-1 text-[10px] font-bold text-neutral-700 dark:text-neutral-300 py-1 px-2 rounded border border-[#242A20] dark:border-[#3C4A38] bg-surfaceElevated-light dark:bg-surfaceElevated-dark shadow-[1px_1px_0px_#242A20] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
          aria-label={isDonutExpanded ? 'ย่อกราฟ' : 'ขยายกราฟ'}
        >
          <span>{isDonutExpanded ? 'HIDE' : 'SHOW'}</span>
          <ChevronDown
            size={12}
            className={`transition-transform duration-200 ${
              isDonutExpanded ? 'rotate-180' : 'rotate-0'
            }`}
          />
        </button>
      </div>

      {/* Donut Breakdown Section (Collapsible) */}
      {isDonutExpanded && (
        <div className="mt-2.5 space-y-2.5 animate-fade-in">
          {/* Retro Segmented Control: [A] & [B] Mode Select */}
          <div className="grid grid-cols-2 p-1 bg-surfaceElevated-light dark:bg-surfaceElevated-dark rounded-xl border-2 border-[#242A20] dark:border-[#3C4A38] shadow-[2px_2px_0px_#242A20] dark:shadow-[2px_2px_0px_#0A0F0A] gap-1 select-none">
            <button
              type="button"
              onClick={() => setDonutTab('wealth')}
              className={`py-1.5 text-xs font-silkscreen font-bold rounded-lg transition-all ${
                donutTab === 'wealth'
                  ? 'bg-[#9BBC0F] text-[#0F380F] border border-[#242A20] shadow-[1px_1px_0px_#242A20]'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              [A] เงินของเรา
            </button>
            <button
              type="button"
              onClick={() => setDonutTab('expenses')}
              className={`py-1.5 text-xs font-silkscreen font-bold rounded-lg transition-all ${
                donutTab === 'expenses'
                  ? 'bg-[#8B1E43] text-white border border-[#242A20] shadow-[1px_1px_0px_#242A20]'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              [B] ค่าใช้จ่าย
            </button>
          </div>

          {/* Tab 1: เงินของเรา */}
          {donutTab === 'wealth' && (
            <DonutChart
              segments={wealthDonutData.segments}
              totalSatang={wealthDonutData.totalSatang}
              centerSubtitle="รวมเงินที่ฝาก"
              isEmpty={wealthDonutData.isEmpty}
              isMasked={isMasked}
            />
          )}

          {/* Tab 2: ค่าใช้จ่าย */}
          {donutTab === 'expenses' && (
            <div className="space-y-2">
              {/* Month Picker */}
              <div className="flex items-center justify-between px-2 py-1 bg-surfaceElevated-light dark:bg-surfaceElevated-dark border border-[#242A20] dark:border-[#3C4A38] rounded-lg text-xs">
                <button
                  onClick={handlePrevMonth}
                  className="p-1 hover:bg-[#242A20]/10 dark:hover:bg-white/10 rounded text-neutral-800 dark:text-neutral-200"
                  aria-label="เดือนก่อนหน้า"
                >
                  <ChevronLeft size={16} strokeWidth={2} />
                </button>
                <span className="font-silkscreen font-bold text-neutral-800 dark:text-neutral-200">
                  {formattedExpenseMonth}
                </span>
                <button
                  onClick={handleNextMonth}
                  className="p-1 hover:bg-[#242A20]/10 dark:hover:bg-white/10 rounded text-neutral-800 dark:text-neutral-200"
                  aria-label="เดือนถัดไป"
                >
                  <ChevronRight size={16} strokeWidth={2} />
                </button>
              </div>

              <DonutChart
                segments={expenseDonutData.segments}
                totalSatang={expenseDonutData.totalSatang}
                centerSubtitle="รวมจ่ายเดือนนี้"
                isEmpty={expenseDonutData.isEmpty}
                isMasked={isMasked}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
