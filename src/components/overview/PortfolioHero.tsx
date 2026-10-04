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
    <div className="relative -mt-12 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-3xl p-5 shadow-lg shadow-emerald-950/5 dark:shadow-none transition-all z-20">
      {/* Top Header: Label & Eye Icon */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
          ยอดเงินในบัญชีตอนนี้
        </span>
        <button
          onClick={onToggleMask}
          className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors p-1"
          title={isMasked ? 'แสดงจำนวนเงิน' : 'ซ่อนจำนวนเงิน'}
          aria-label={isMasked ? 'แสดงจำนวนเงิน' : 'ซ่อนจำนวนเงิน'}
        >
          {isMasked ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
        </button>
      </div>

      {/* Large Balance Number */}
      <div
        onClick={() => triggerCoinShower()}
        className="mt-1 flex items-baseline gap-2 cursor-pointer select-none active:scale-[0.98] transition-transform"
        title="แตะเพื่อโปรยเหรียญ!"
      >
        <span className="text-4xl sm:text-[42px] font-light tracking-tight text-neutral-900 dark:text-neutral-50 tabular-nums">
          {isMasked ? '••••••••' : formatSatang(currentBalance)}
        </span>
        <span className="text-base font-light text-neutral-400 dark:text-neutral-500">
          บาท
        </span>
      </div>

      {/* Delta Row: Net change this month vs last month */}
      <div className="mt-2.5 flex items-center gap-2 flex-wrap">
        <div
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
            thisMonthNet >= 0
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40'
              : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40'
          }`}
        >
          {thisMonthNet >= 0 ? (
            <TrendingUp size={13} strokeWidth={2} />
          ) : (
            <TrendingDown size={13} strokeWidth={2} />
          )}
          <span>
            {thisMonthNet >= 0 ? '+' : ''}
            {isMasked ? '••••' : `${formatSatang(thisMonthNet)} ฿`} เดือนนี้
          </span>
          <span className="opacity-75 text-[10px]">({percentDelta})</span>
        </div>

        {totalLentOut > 0 && (
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40">
            <HandCoins size={12} strokeWidth={1.5} />
            <span>มีคนยืม {isMasked ? '••••' : `${formatSatang(totalLentOut)} ฿`}</span>
          </div>
        )}
      </div>

      {/* Pocket Breakdown Pill (Model 2: Sub-Wallet Breakdown) */}
      {pocketSummaries && pocketSummaries.length > 0 && (
        <div className="mt-3 p-2.5 rounded-2xl bg-neutral-50 dark:bg-surfaceElevated-dark border border-border-light dark:border-border-dark flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-sm">🏦</span>
            <span className="text-neutral-500 dark:text-neutral-400 truncate">กองกลางหลัก:</span>
            <span className="font-semibold text-neutral-800 dark:text-neutral-200 tabular-nums">
              {isMasked ? '••••' : `${formatSatang(mainSavingsBalance ?? currentBalance)} ฿`}
            </span>
          </div>
          <div className="h-3.5 w-px bg-border-light dark:border-border-dark mx-2 shrink-0" />
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-sm">👛</span>
            <span className="text-neutral-500 dark:text-neutral-400 truncate">ในกล่องแบ่งใช้:</span>
            <span className="font-semibold text-purple-600 dark:text-purple-400 tabular-nums">
              {isMasked
                ? '••••'
                : `${formatSatang(pocketSummaries.reduce((sum, p) => sum + p.remainingSatang, 0))} ฿`}
            </span>
          </div>
        </div>
      )}

      {/* Subline: Grand Total & Latest Update */}
      <div className="mt-3 pt-3 border-t border-border-light dark:border-border-dark flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
        <div className="flex items-center gap-1">
          <span>รวมเงินที่ให้ยืม:</span>
          <span className="font-semibold text-neutral-700 dark:text-neutral-300 tabular-nums">
            {isMasked ? '••••' : `${formatSatang(grandTotal)} ฿`}
          </span>
        </div>
        <div className="flex items-center gap-1 text-neutral-400">
          <Clock size={11} strokeWidth={1.5} />
          <span>ข้อมูลล่าสุด: {latestUpdateTime}</span>
        </div>
      </div>

      {/* Donut Toggle Header */}
      <div className="mt-4 pt-3 border-t border-border-light dark:border-border-dark flex items-center justify-between">
        <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
          สัดส่วนการเงิน (Breakdown)
        </span>
        <button
          onClick={() => setIsDonutExpanded(!isDonutExpanded)}
          className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 py-1 px-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-surfaceElevated-dark transition-all active:scale-95"
          aria-label={isDonutExpanded ? 'ย่อกราฟ' : 'ขยายกราฟ'}
        >
          <span>{isDonutExpanded ? 'ซ่อนกราฟ' : 'แสดงกราฟ'}</span>
          <ChevronDown
            size={15}
            className={`transition-transform duration-300 ease-out ${
              isDonutExpanded ? 'rotate-180' : 'rotate-0'
            }`}
          />
        </button>
      </div>

      {/* Donut Breakdown Section (Collapsible) */}
      {isDonutExpanded && (
        <div className="mt-3 space-y-3 animate-fade-in">
          {/* Segmented Control: 2 Tabs with Butter-Smooth Sliding Indicator */}
          <div className="relative grid grid-cols-2 p-1 bg-surfaceElevated-light dark:bg-surfaceElevated-dark rounded-xl border border-border-light dark:border-border-dark select-none">
            {/* Sliding Pill Indicator */}
            <div
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-surface-light dark:bg-surface-dark rounded-lg shadow-sm border border-border-light dark:border-border-dark transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
              style={{
                left: donutTab === 'wealth' ? '4px' : 'calc(50%)',
              }}
            />
            <button
              type="button"
              onClick={() => setDonutTab('wealth')}
              className={`relative z-10 py-1.5 text-xs font-medium rounded-lg transition-colors duration-200 active:scale-95 ${
                donutTab === 'wealth'
                  ? 'text-neutral-900 dark:text-white font-semibold'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
              }`}
            >
              เงินของเรา
            </button>
            <button
              type="button"
              onClick={() => setDonutTab('expenses')}
              className={`relative z-10 py-1.5 text-xs font-medium rounded-lg transition-colors duration-200 active:scale-95 ${
                donutTab === 'expenses'
                  ? 'text-neutral-900 dark:text-white font-semibold'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
              }`}
            >
              ค่าใช้จ่าย
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
              <div className="flex items-center justify-between px-2 py-1 bg-surfaceElevated-light/60 dark:bg-surfaceElevated-dark/60 rounded-xl text-xs">
                <button
                  onClick={handlePrevMonth}
                  className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg text-neutral-600 dark:text-neutral-300"
                  aria-label="เดือนก่อนหน้า"
                >
                  <ChevronLeft size={16} strokeWidth={1.5} />
                </button>
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                  {formattedExpenseMonth}
                </span>
                <button
                  onClick={handleNextMonth}
                  className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg text-neutral-600 dark:text-neutral-300"
                  aria-label="เดือนถัดไป"
                >
                  <ChevronRight size={16} strokeWidth={1.5} />
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
