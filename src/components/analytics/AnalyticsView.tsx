import React, { useState, useMemo } from 'react';
import { Transaction } from '../../types/transaction';
import { calculateWealthDonut } from '../../lib/donut';
import { DonutChart } from '../overview/DonutChart';
import { formatSatang } from '../../lib/money';
import { ChevronLeft, ChevronRight, HandCoins, Wallet } from 'lucide-react';
import { Pocket, PocketSummary } from '../../types/pocket';
import { CalendarView } from './CalendarView';
import { CategoryExpenseView } from './CategoryExpenseView';
import { FinancialTrendView } from './FinancialTrendView';

interface AnalyticsViewProps {
  transactions: Transaction[];
  isMasked?: boolean;
  pocketSummaries?: PocketSummary[];
  mainSavingsBalance?: number;
  pockets?: Pocket[];
  onSelectTx?: (tx: Transaction) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  transactions,
  isMasked = false,
  pocketSummaries,
  mainSavingsBalance,
  pockets = [],
  onSelectTx,
}) => {
  const [analyticsTab, setAnalyticsTab] = useState<'calendar' | 'expenses' | 'trends' | 'wealth'>('calendar');
  const [expenseYearMonth, setExpenseYearMonth] = useState(() => {
    return new Date().toISOString().slice(0, 7);
  });

  // Calculate wealth donut
  const wealthData = useMemo(() => {
    return calculateWealthDonut(transactions, pocketSummaries, mainSavingsBalance);
  }, [transactions, pocketSummaries, mainSavingsBalance]);

  // Month navigation
  const formattedExpenseMonth = useMemo(() => {
    const [y, m] = expenseYearMonth.split('-');
    const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
    return date.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
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
    <div className="space-y-4 animate-fade-in">

      {/* Segmented Control Tabs (4 Tabs) - Mobile Optimized with Smooth Sliding Pill */}
      <div className="relative flex items-center p-1 bg-surfaceElevated-light dark:bg-surfaceElevated-dark rounded-2xl border border-border-light dark:border-border-dark">
        {/* Sliding Pill Indicator */}
        <div
          className="absolute top-1 bottom-1 rounded-xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-xs transition-transform duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none"
          style={{
            left: '4px',
            width: 'calc((100% - 8px) / 4)',
            transform: `translateX(${
              analyticsTab === 'calendar'
                ? '0%'
                : analyticsTab === 'expenses'
                ? '100%'
                : analyticsTab === 'trends'
                ? '200%'
                : '300%'
            })`,
          }}
        />

        <button
          type="button"
          onClick={() => setAnalyticsTab('calendar')}
          className={`relative z-10 flex-1 py-2 text-xs text-center select-none rounded-xl transition-colors duration-150 ${
            analyticsTab === 'calendar'
              ? 'text-neutral-900 dark:text-white font-semibold'
              : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 font-medium'
          }`}
        >
          ปฏิทิน
        </button>
        <button
          type="button"
          onClick={() => setAnalyticsTab('expenses')}
          className={`relative z-10 flex-1 py-2 text-xs text-center select-none rounded-xl transition-colors duration-150 ${
            analyticsTab === 'expenses'
              ? 'text-neutral-900 dark:text-white font-semibold'
              : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 font-medium'
          }`}
        >
          ตามหมวด
        </button>
        <button
          type="button"
          onClick={() => setAnalyticsTab('trends')}
          className={`relative z-10 flex-1 py-2 text-xs text-center select-none rounded-xl transition-colors duration-150 ${
            analyticsTab === 'trends'
              ? 'text-neutral-900 dark:text-white font-semibold'
              : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 font-medium'
          }`}
        >
          แนวโน้ม
        </button>
        <button
          type="button"
          onClick={() => setAnalyticsTab('wealth')}
          className={`relative z-10 flex-1 py-2 text-xs text-center select-none rounded-xl transition-colors duration-150 ${
            analyticsTab === 'wealth'
              ? 'text-neutral-900 dark:text-white font-semibold'
              : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 font-medium'
          }`}
        >
          สัดส่วน
        </button>
      </div>

      {/* Tab: Calendar View */}
      {analyticsTab === 'calendar' && (
        <CalendarView
          transactions={transactions}
          isMasked={isMasked}
          pockets={pockets}
          onSelectTx={onSelectTx}
          yearMonth={expenseYearMonth}
          onYearMonthChange={setExpenseYearMonth}
        />
      )}

      {/* Tab: Expenses by Category */}
      {analyticsTab === 'expenses' && (
        <div className="space-y-3">
          {/* Month Selector */}
          <div className="flex items-center justify-between px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl text-xs">
            <button
              onClick={handlePrevMonth}
              className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-600 dark:text-neutral-300"
              aria-label="เดือนก่อนหน้า"
            >
              <ChevronLeft size={18} strokeWidth={1.5} />
            </button>
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">
              {formattedExpenseMonth}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-600 dark:text-neutral-300"
              aria-label="เดือนถัดไป"
            >
              <ChevronRight size={18} strokeWidth={1.5} />
            </button>
          </div>

          {/* Expenses by Category Breakdown matching Image 2 */}
          <CategoryExpenseView
            transactions={transactions}
            yearMonth={expenseYearMonth}
            isMasked={isMasked}
            pockets={pockets}
            onSelectTx={onSelectTx}
          />
        </div>
      )}

      {/* Tab: Financial Trends View (Mobile-Optimized) */}
      {analyticsTab === 'trends' && (
        <div className="space-y-3">
          {/* Month Selector */}
          <div className="flex items-center justify-between px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl text-xs">
            <button
              onClick={handlePrevMonth}
              className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-600 dark:text-neutral-300"
              aria-label="เดือนก่อนหน้า"
            >
              <ChevronLeft size={18} strokeWidth={1.5} />
            </button>
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">
              {formattedExpenseMonth}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-600 dark:text-neutral-300"
              aria-label="เดือนถัดไป"
            >
              <ChevronRight size={18} strokeWidth={1.5} />
            </button>
          </div>

          <FinancialTrendView
            transactions={transactions}
            yearMonth={expenseYearMonth}
            isMasked={isMasked}
            pockets={pockets}
            onSelectTx={onSelectTx}
          />
        </div>
      )}

      {/* Tab: Wealth Allocation */}
      {analyticsTab === 'wealth' && (
        <div className="space-y-3">
          <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-3xl p-5 shadow-sm">
            <h3 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              สัดส่วนเงินของเราทั้งหมด (All-time Wealth)
            </h3>
            <DonutChart
              segments={wealthData.segments}
              totalSatang={wealthData.totalSatang}
              centerSubtitle="รวมเงินที่ฝาก"
              isEmpty={wealthData.isEmpty}
              isMasked={isMasked}
            />
          </div>

          {/* Allocation Breakdown Details */}
          <div className="space-y-2">
            <div className="p-3.5 rounded-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 flex items-center justify-center text-emerald-600">
                  <Wallet size={16} />
                </div>
                <div>
                  <div className="text-xs font-medium text-neutral-800 dark:text-neutral-200">เงินเก็บคงเหลือ</div>
                  <div className="text-[11px] text-neutral-500">พร้อมใช้งานในบัญชี</div>
                </div>
              </div>
              <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {isMasked ? '••••' : `${formatSatang(wealthData.segments.find(s => s.id === 'balance')?.valueSatang || 0)} ฿`}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 flex items-center justify-center text-amber-600">
                  <HandCoins size={16} />
                </div>
                <div>
                  <div className="text-xs font-medium text-neutral-800 dark:text-neutral-200">เงินที่ถูกยืมค้าง</div>
                  <div className="text-[11px] text-neutral-500">รอการชำระคืน</div>
                </div>
              </div>
              <div className="text-sm font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
                {isMasked ? '••••' : `${formatSatang(wealthData.segments.find(s => s.id === 'lent')?.valueSatang || 0)} ฿`}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
