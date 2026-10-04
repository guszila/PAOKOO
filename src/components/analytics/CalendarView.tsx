import React, { useState, useMemo } from 'react';
import { Transaction } from '../../types/transaction';
import { Pocket } from '../../types/pocket';
import {
  CalendarDay,
  formatThaiMonthYear,
  formatThaiFullDate,
  formatCompactAmount,
  getCalendarMonthDays,
  groupTransactionsByDate,
} from '../../lib/calendar';
import { formatSatang } from '../../lib/money';
import { TransactionItem } from '../transactions/TransactionItem';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Scale, Calendar as CalendarIcon } from 'lucide-react';

interface CalendarViewProps {
  transactions: Transaction[];
  isMasked?: boolean;
  pockets?: Pocket[];
  onSelectTx?: (tx: Transaction) => void;
  yearMonth: string;
  onYearMonthChange: (ym: string) => void;
}

const WEEKDAYS = [
  { label: 'อา.', isSun: true },
  { label: 'จ.' },
  { label: 'อ.' },
  { label: 'พ.' },
  { label: 'พฤ.' },
  { label: 'ศ.' },
  { label: 'ส.', isSat: true },
];

export const CalendarView: React.FC<CalendarViewProps> = ({
  transactions,
  isMasked = false,
  pockets = [],
  onSelectTx,
  yearMonth,
  onYearMonthChange,
}) => {
  const todayStr = useMemo(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  // Selected date defaults to today if in current month, or the 1st of the month
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (todayStr.startsWith(yearMonth)) return todayStr;
    return `${yearMonth}-01`;
  });

  // Filter type: 'all' | 'out' (ค่าใช้จ่าย) | 'in' (รายได้)
  const [filterType, setFilterType] = useState<'all' | 'out' | 'in'>('all');

  // Keep selected date aligned when month changes
  const activeSelectedDate = useMemo(() => {
    if (selectedDate.startsWith(yearMonth)) return selectedDate;
    if (todayStr.startsWith(yearMonth)) return todayStr;
    return `${yearMonth}-01`;
  }, [selectedDate, yearMonth, todayStr]);

  // Pocket map for pocket name lookup
  const pocketMap = useMemo(() => {
    const map = new Map<string, string>();
    pockets.forEach((p) => map.set(p.id, p.name));
    return map;
  }, [pockets]);

  // Aggregate all transactions by date for the calendar
  const groupedData = useMemo(() => {
    return groupTransactionsByDate(transactions, yearMonth);
  }, [transactions, yearMonth]);

  // Calendar days grid (Sun-Sat)
  const calendarDays = useMemo(() => {
    return getCalendarMonthDays(yearMonth, todayStr);
  }, [yearMonth, todayStr]);

  // Month navigation handlers
  const handlePrevMonth = () => {
    const [y, m] = yearMonth.split('-').map(Number);
    const date = new Date(y, m - 2, 1);
    const nextY = date.getFullYear();
    const nextM = String(date.getMonth() + 1).padStart(2, '0');
    onYearMonthChange(`${nextY}-${nextM}`);
  };

  const handleNextMonth = () => {
    const [y, m] = yearMonth.split('-').map(Number);
    const date = new Date(y, m, 1);
    const nextY = date.getFullYear();
    const nextM = String(date.getMonth() + 1).padStart(2, '0');
    onYearMonthChange(`${nextY}-${nextM}`);
  };

  const handleGoToday = () => {
    const [y, m] = todayStr.split('-');
    onYearMonthChange(`${y}-${m}`);
    setSelectedDate(todayStr);
  };

  // Monthly summary
  const monthSummary = useMemo(() => {
    let inTotal = 0;
    let outTotal = 0;

    transactions.forEach((tx) => {
      if (tx.date && tx.date.startsWith(yearMonth)) {
        if (tx.type === 'in') inTotal += tx.amount;
        if (tx.type === 'out') outTotal += tx.amount;
      }
    });

    return {
      inTotal,
      outTotal,
      net: inTotal - outTotal,
    };
  }, [transactions, yearMonth]);

  // Selected day summary & transactions
  const selectedDaySummary = useMemo(() => {
    const dayData = groupedData[activeSelectedDate];
    return {
      inAmount: dayData?.inAmount || 0,
      outAmount: dayData?.outAmount || 0,
      net: dayData?.net || 0,
      transactions: dayData?.transactions || [],
    };
  }, [groupedData, activeSelectedDate]);

  // Filtered transactions for selected day based on filterType
  const filteredDayTransactions = useMemo(() => {
    if (filterType === 'out') {
      return selectedDaySummary.transactions.filter((tx) => tx.type === 'out' || tx.type === 'lend');
    }
    if (filterType === 'in') {
      return selectedDaySummary.transactions.filter((tx) => tx.type === 'in' || tx.type === 'back');
    }
    return selectedDaySummary.transactions;
  }, [selectedDaySummary.transactions, filterType]);

  return (
    <div className="space-y-3.5">
      {/* 1. Month Navigator & Quick Today Button */}
      <div className="flex items-center justify-between px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl text-xs">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-600 dark:text-neutral-300 transition-colors"
          aria-label="เดือนก่อนหน้า"
        >
          <ChevronLeft size={18} strokeWidth={1.5} />
        </button>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-neutral-800 dark:text-neutral-100 text-sm">
            {formatThaiMonthYear(yearMonth)}
          </span>
          {!todayStr.startsWith(yearMonth) && (
            <button
              type="button"
              onClick={handleGoToday}
              className="text-[11px] px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            >
              วันนี้
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleNextMonth}
          className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-600 dark:text-neutral-300 transition-colors"
          aria-label="เดือนถัดไป"
        >
          <ChevronRight size={18} strokeWidth={1.5} />
        </button>
      </div>

      {/* 2. Monthly Summary Strip (Income, Expense, Net) */}
      <div className="grid grid-cols-3 gap-2">
        {/* Income Card */}
        <div className="p-2.5 rounded-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark text-center">
          <div className="flex items-center justify-center gap-1 text-[11px] text-neutral-500 dark:text-neutral-400 mb-0.5">
            <TrendingUp size={12} className="text-emerald-500" />
            <span>เงินเข้า</span>
          </div>
          <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums truncate">
            {isMasked ? '••••' : `+${formatSatang(monthSummary.inTotal)} ฿`}
          </div>
        </div>

        {/* Expense Card */}
        <div className="p-2.5 rounded-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark text-center">
          <div className="flex items-center justify-center gap-1 text-[11px] text-neutral-500 dark:text-neutral-400 mb-0.5">
            <TrendingDown size={12} className="text-red-500" />
            <span>จ่ายออก</span>
          </div>
          <div className="text-xs font-semibold text-red-600 dark:text-red-400 tabular-nums truncate">
            {isMasked ? '••••' : `-${formatSatang(monthSummary.outTotal)} ฿`}
          </div>
        </div>

        {/* Net Card */}
        <div className="p-2.5 rounded-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark text-center">
          <div className="flex items-center justify-center gap-1 text-[11px] text-neutral-500 dark:text-neutral-400 mb-0.5">
            <Scale size={12} className="text-neutral-500" />
            <span>คงเหลือสุทธิ</span>
          </div>
          <div
            className={`text-xs font-semibold tabular-nums truncate ${
              monthSummary.net >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {isMasked
              ? '••••'
              : `${monthSummary.net >= 0 ? '+' : ''}${formatSatang(monthSummary.net)} ฿`}
          </div>
        </div>
      </div>

      {/* 3. Calendar Grid Card (Contains Header, Days Grid, and Filter Pills) */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-3xl p-3.5 sm:p-4 shadow-sm space-y-3">
        {/* Weekday Header */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((wd) => (
            <div
              key={wd.label}
              className={`text-[11px] font-semibold py-1 ${
                wd.isSun
                  ? 'text-red-500 dark:text-red-400'
                  : wd.isSat
                  ? 'text-sky-500 dark:text-sky-400'
                  : 'text-neutral-500 dark:text-neutral-400'
              }`}
            >
              {wd.label}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day: CalendarDay) => {
            const isSelected = day.dateStr === activeSelectedDate;
            const summary = groupedData[day.dateStr];
            const hasIncome = summary && summary.inAmount > 0;
            const hasExpense = summary && summary.outAmount > 0;
            const showIncome = (filterType === 'all' || filterType === 'in') && hasIncome;
            const showExpense = (filterType === 'all' || filterType === 'out') && hasExpense;

            return (
              <button
                key={day.dateStr}
                type="button"
                onClick={() => {
                  if (day.isCurrentMonth) {
                    setSelectedDate(day.dateStr);
                  } else {
                    // Navigate to that month and select day
                    const [y, m] = day.dateStr.split('-');
                    onYearMonthChange(`${y}-${m}`);
                    setSelectedDate(day.dateStr);
                  }
                }}
                className={`relative min-h-[52px] sm:min-h-[58px] p-1 rounded-xl flex flex-col items-center justify-between select-none cursor-pointer transition-colors duration-150 ${
                  isSelected
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-md font-semibold ring-2 ring-neutral-900 dark:ring-white'
                    : day.isCurrentMonth
                    ? 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200'
                    : 'text-neutral-300 dark:text-neutral-600 opacity-35'
                } ${
                  day.isToday && !isSelected
                    ? 'ring-1.5 ring-emerald-500 font-bold bg-emerald-50/50 dark:bg-emerald-950/20'
                    : ''
                }`}
              >
                {/* Day Number */}
                <span
                  className={`text-xs ${
                    isSelected
                      ? 'text-white dark:text-neutral-900 font-bold'
                      : day.isSunday
                      ? 'text-red-500 dark:text-red-400'
                      : day.isSaturday
                      ? 'text-sky-500 dark:text-sky-400'
                      : ''
                  }`}
                >
                  {day.dayNumber}
                </span>

                {/* Amount Badges Container with fixed height & 2 designated rows - Zero vertical jumping */}
                <div className="w-full h-[26px] flex flex-col justify-end gap-0.5 overflow-hidden">
                  {/* Row 1: Income Slot */}
                  <div className="h-[12px] w-full flex items-center justify-center">
                    {hasIncome && (
                      <span
                        className={`text-[8.5px] font-bold px-1 py-0.2 rounded-xs leading-none truncate w-full text-center transition-opacity duration-150 ${
                          isSelected
                            ? 'bg-emerald-500/20 text-emerald-300 dark:text-emerald-700'
                            : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                        } ${showIncome ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                      >
                        {isMasked ? '•••' : `+${formatCompactAmount(summary.inAmount)}`}
                      </span>
                    )}
                  </div>

                  {/* Row 2: Expense Slot */}
                  <div className="h-[12px] w-full flex items-center justify-center">
                    {hasExpense && (
                      <span
                        className={`text-[8.5px] font-bold px-1 py-0.2 rounded-xs leading-none truncate w-full text-center transition-opacity duration-150 ${
                          isSelected
                            ? 'bg-red-500/20 text-red-300 dark:text-red-700'
                            : 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400'
                        } ${showExpense ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                      >
                        {isMasked ? '•••' : `-${formatCompactAmount(summary.outAmount)}`}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Filter Pills INSIDE the Calendar Card - Smooth sliding pill animation */}
        <div className="pt-2 border-t border-border-light/60 dark:border-border-dark/60 flex justify-center">
          <div className="relative flex items-center p-1 bg-surfaceElevated-light dark:bg-surfaceElevated-dark rounded-2xl border border-border-light dark:border-border-dark shadow-xs w-full max-w-[280px]">
            {/* Sliding Pill Indicator */}
            <div
              className="absolute top-1 bottom-1 rounded-xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-xs transition-transform duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none"
              style={{
                left: '4px',
                width: 'calc((100% - 8px) / 3)',
                transform: `translateX(${
                  filterType === 'out' ? '0%' : filterType === 'in' ? '100%' : '200%'
                })`,
              }}
            />

            <button
              type="button"
              onClick={() => setFilterType('out')}
              className={`relative z-10 flex-1 py-1.5 px-2 text-xs text-center select-none rounded-xl transition-colors duration-150 ${
                filterType === 'out'
                  ? 'text-red-500 dark:text-red-400 font-semibold'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 font-medium'
              }`}
            >
              ค่าใช้จ่าย
            </button>
            <button
              type="button"
              onClick={() => setFilterType('in')}
              className={`relative z-10 flex-1 py-1.5 px-2 text-xs text-center select-none rounded-xl transition-colors duration-150 ${
                filterType === 'in'
                  ? 'text-emerald-500 dark:text-emerald-400 font-semibold'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 font-medium'
              }`}
            >
              รายได้
            </button>
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`relative z-10 flex-1 py-1.5 px-2 text-xs text-center select-none rounded-xl transition-colors duration-150 ${
                filterType === 'all'
                  ? 'text-neutral-900 dark:text-neutral-100 font-semibold'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 font-medium'
              }`}
            >
              ทั้งหมด
            </button>
          </div>
        </div>
      </div>

      {/* 4. Selected Day Transaction Details Section */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-3xl p-4 shadow-sm space-y-3">
        {/* Selected Date Header */}
        <div className="flex items-center justify-between pb-2 border-b border-border-light dark:border-border-dark">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300">
              <CalendarIcon size={14} />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                {formatThaiFullDate(activeSelectedDate)}
              </h4>
              <p className="text-[11px] text-neutral-400">
                {activeSelectedDate === todayStr ? 'วันนี้' : 'รายการของวันที่เลือก'}
              </p>
            </div>
          </div>

          {/* Daily Net Summary */}
          <div className="text-right">
            <span className="text-[10px] text-neutral-400 block">สุทธิประจำวัน</span>
            <span
              className={`text-xs font-semibold tabular-nums ${
                selectedDaySummary.net >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {isMasked
                ? '••••'
                : `${selectedDaySummary.net >= 0 ? '+' : ''}${formatSatang(selectedDaySummary.net)} ฿`}
            </span>
          </div>
        </div>

        {/* 3-column day summary strip matching reference: ทั้งหมด | รายได้ | ค่าใช้จ่าย */}
        <div className="grid grid-cols-3 gap-2 py-2 px-1 bg-surfaceElevated-light dark:bg-surfaceElevated-dark rounded-2xl border border-border-light dark:border-border-dark text-center">
          <div>
            <span className="text-[10px] text-neutral-400 block mb-0.5">ทั้งหมด</span>
            <span
              className={`text-xs font-semibold tabular-nums ${
                selectedDaySummary.net >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {isMasked
                ? '••••'
                : `${selectedDaySummary.net >= 0 ? '+' : ''}${formatSatang(selectedDaySummary.net)} ฿`}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-neutral-400 block mb-0.5">รายได้</span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {isMasked ? '••••' : `+${formatSatang(selectedDaySummary.inAmount)} ฿`}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-neutral-400 block mb-0.5">ค่าใช้จ่าย</span>
            <span className="text-xs font-semibold text-red-600 dark:text-red-400 tabular-nums">
              {isMasked ? '••••' : `-${formatSatang(selectedDaySummary.outAmount)} ฿`}
            </span>
          </div>
        </div>

        {/* Selected Day Transaction List (Filtered) - In-place reconciliation without blank flash */}
        {filteredDayTransactions.length > 0 ? (
          <div className="space-y-2">
            {filteredDayTransactions.map((tx) => (
              <TransactionItem
                key={tx.id}
                transaction={tx}
                onClick={onSelectTx}
                isMasked={isMasked}
                pocketName={tx.pocketId ? pocketMap.get(tx.pocketId) : undefined}
              />
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-neutral-400 text-xs">
            <p>
              {filterType === 'out'
                ? 'ไม่มีรายการค่าใช้จ่ายในวันที่เลือก'
                : filterType === 'in'
                ? 'ไม่มีรายการรายได้ในวันที่เลือก'
                : 'ไม่มีรายการในวันที่เลือก'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
