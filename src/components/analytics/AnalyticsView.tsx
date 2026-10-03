import React, { useState, useMemo } from 'react';
import { Transaction } from '../../types/transaction';
import { calculateWealthDonut, calculateExpenseCategoryDonut } from '../../lib/donut';
import { DonutChart } from '../overview/DonutChart';
import { formatSatang } from '../../lib/money';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, HandCoins, Wallet } from 'lucide-react';

interface AnalyticsViewProps {
  transactions: Transaction[];
  isMasked?: boolean;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  transactions,
  isMasked = false,
}) => {
  const [donutTab, setDonutTab] = useState<'wealth' | 'expenses'>('expenses');
  const [expenseYearMonth, setExpenseYearMonth] = useState(() => {
    return new Date().toISOString().slice(0, 7);
  });

  // Calculate wealth donut
  const wealthData = useMemo(() => {
    return calculateWealthDonut(transactions);
  }, [transactions]);

  // Calculate expense category donut
  const expenseData = useMemo(() => {
    return calculateExpenseCategoryDonut(transactions, expenseYearMonth);
  }, [transactions, expenseYearMonth]);

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

  // Monthly stats for selected month
  const monthlyStats = useMemo(() => {
    let inAmount = 0;
    let outAmount = 0;
    let lendAmount = 0;
    let backAmount = 0;

    transactions.forEach((tx) => {
      if (tx.date && tx.date.startsWith(expenseYearMonth)) {
        if (tx.type === 'in') inAmount += tx.amount;
        if (tx.type === 'out') outAmount += tx.amount;
        if (tx.type === 'lend') lendAmount += tx.amount;
        if (tx.type === 'back') backAmount += tx.amount;
      }
    });

    return {
      inAmount,
      outAmount,
      lendAmount,
      backAmount,
      net: inAmount - outAmount,
    };
  }, [transactions, expenseYearMonth]);

  return (
    <div className="space-y-4 animate-fade-in">

      {/* Segmented Control Tabs */}
      <div className="grid grid-cols-2 p-1 bg-surfaceElevated-light dark:bg-surfaceElevated-dark rounded-2xl border border-border-light dark:border-border-dark">
        <button
          type="button"
          onClick={() => setDonutTab('expenses')}
          className={`py-2 text-xs font-medium rounded-xl transition-all ${
            donutTab === 'expenses'
              ? 'bg-surface-light dark:bg-surface-dark text-neutral-900 dark:text-white shadow-sm border border-border-light dark:border-border-dark'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          รายจ่ายตามหมวดหมู่
        </button>
        <button
          type="button"
          onClick={() => setDonutTab('wealth')}
          className={`py-2 text-xs font-medium rounded-xl transition-all ${
            donutTab === 'wealth'
              ? 'bg-surface-light dark:bg-surface-dark text-neutral-900 dark:text-white shadow-sm border border-border-light dark:border-border-dark'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          สัดส่วนเงินของเรา
        </button>
      </div>

      {/* Tab: Expenses by Category */}
      {donutTab === 'expenses' && (
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

          {/* Donut Chart Card */}
          <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-3xl p-5 shadow-sm">
            <h3 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              สัดส่วนค่าใช้จ่าย {formattedExpenseMonth}
            </h3>
            <DonutChart
              segments={expenseData.segments}
              totalSatang={expenseData.totalSatang}
              centerSubtitle="รวมจ่ายเดือนนี้"
              isEmpty={expenseData.isEmpty}
              isMasked={isMasked}
            />
          </div>

          {/* Monthly Cashflow Mini-Cards */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3.5 rounded-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark">
              <div className="flex items-center gap-1.5 text-xs text-neutral-500 mb-1">
                <TrendingUp size={14} className="text-emerald-500" />
                <span>เงินเข้าเดือนนี้</span>
              </div>
              <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {isMasked ? '••••' : `+${formatSatang(monthlyStats.inAmount)} ฿`}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark">
              <div className="flex items-center gap-1.5 text-xs text-neutral-500 mb-1">
                <TrendingDown size={14} className="text-red-500" />
                <span>จ่ายออกเดือนนี้</span>
              </div>
              <div className="text-sm font-semibold text-red-600 dark:text-red-400 tabular-nums">
                {isMasked ? '••••' : `-${formatSatang(monthlyStats.outAmount)} ฿`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Wealth Allocation */}
      {donutTab === 'wealth' && (
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
