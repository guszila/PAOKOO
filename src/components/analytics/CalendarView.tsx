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
        if (tx.type === 'in' || tx.type === 'back') inTotal += tx.amount;
        if (tx.type === 'out' || tx.type === 'lend') outTotal += tx.amount;
      }
    });

    return {
      inTotal,
      outTotal,
      net: inTotal - outTotal,
    };
  }, [transactions, yearMonth]);

  // Format short Baht without decimals for narrow monthly summary cards
  const formatBahtShort = (satang: number) => {
    const baht = Math.round(satang / 100);
    return baht.toLocaleString('en-US');
  };

  // Selected day summary & transactions
  const selectedDaySummary = useMemo(() => {
    const dayData = groupedData[activeSelectedDate];
    const totalIn = (dayData?.inAmount || 0) + (dayData?.backAmount || 0);
    const totalOut = (dayData?.outAmount || 0) + (dayData?.lendAmount || 0);
    return {
      inAmount: totalIn,
      outAmount: totalOut,
      net: totalIn - totalOut,
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
      <div className="flex items-center justify-between px-3 py-2 bg-surface-light dark:bg-surface-dark pixel-card rounded-xl text-xs">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-700 dark:text-neutral-300 pixel-btn"
          aria-label="เดือนก่อนหน้า"
        >
          <ChevronLeft size={16} strokeWidth={2.5} />
        </button>

        <div className="flex items-center gap-2">
          <span className="font-bold text-neutral-800 dark:text-neutral-100 text-sm sm:text-base">
            {formatThaiMonthYear(yearMonth)}
          </span>
          {!todayStr.startsWith(yearMonth) && (
            <button
              type="button"
              onClick={handleGoToday}
              className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#9BBC0F] text-[#0F380F] border border-[#242A20] shadow-[1px_1px_0px_#242A20] active:translate-x-[1px] active:translate-y-[1px] select-none"
            >
              TODAY
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleNextMonth}
          className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-700 dark:text-neutral-300 pixel-btn"
          aria-label="เดือนถัดไป"
        >
          <ChevronRight size={16} strokeWidth={2.5} />
        </button>
      </div>

      {/* 2. Monthly Summary Strip (Income, Expense, Net) */}
      <div className="grid grid-cols-3 gap-2">
        {/* Income Card */}
        <div className="p-2 sm:p-2.5 rounded-xl bg-surface-light dark:bg-surface-dark pixel-card-sm text-center">
          <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-neutral-600 dark:text-neutral-400 mb-0.5">
            <TrendingUp size={12} strokeWidth={2.5} className="text-[#306230] dark:text-emerald-400" />
            <span>เงินเข้า</span>
          </div>
          <div className="font-silkscreen text-[11px] sm:text-xs font-bold text-[#306230] dark:text-emerald-400 tabular-nums truncate">
            {isMasked ? '••••' : `+${formatBahtShort(monthSummary.inTotal)} ฿`}
          </div>
        </div>

        {/* Expense Card */}
        <div className="p-2 sm:p-2.5 rounded-xl bg-surface-light dark:bg-surface-dark pixel-card-sm text-center">
          <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-neutral-600 dark:text-neutral-400 mb-0.5">
            <TrendingDown size={12} strokeWidth={2.5} className="text-[#8B1E43] dark:text-red-400" />
            <span>จ่ายออก</span>
          </div>
          <div className="font-silkscreen text-[11px] sm:text-xs font-bold text-[#8B1E43] dark:text-red-400 tabular-nums truncate">
            {isMasked ? '••••' : `-${formatBahtShort(monthSummary.outTotal)} ฿`}
          </div>
        </div>

        {/* Net Card */}
        <div className="p-2 sm:p-2.5 rounded-xl bg-surface-light dark:bg-surface-dark pixel-card-sm text-center">
          <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-neutral-600 dark:text-neutral-400 mb-0.5">
            <Scale size={12} strokeWidth={2.5} className="text-neutral-700 dark:text-neutral-300" />
            <span>สุทธิ</span>
          </div>
          <div
            className={`font-silkscreen text-[11px] sm:text-xs font-bold tabular-nums truncate ${
              monthSummary.net >= 0
                ? 'text-[#306230] dark:text-emerald-400'
                : 'text-[#8B1E43] dark:text-red-400'
            }`}
          >
            {isMasked
              ? '••••'
              : `${monthSummary.net >= 0 ? '+' : '-'}${formatBahtShort(Math.abs(monthSummary.net))} ฿`}
          </div>
        </div>
      </div>

      {/* 3. Calendar Grid Card (Contains Header, Days Grid, and Filter Pills) */}
      <div className="bg-surface-light dark:bg-surface-dark pixel-card rounded-2xl p-3.5 sm:p-4 space-y-3">
        {/* Weekday Header */}
        <div className="grid grid-cols-7 gap-1 text-center border-b-2 border-dashed border-[#242A20]/20 dark:border-[#3C4A38]/50 pb-2">
          {WEEKDAYS.map((wd) => (
            <div
              key={wd.label}
              className={`text-[11px] font-bold py-0.5 ${
                wd.isSun
                  ? 'text-red-500 dark:text-red-400'
                  : wd.isSat
                  ? 'text-sky-500 dark:text-sky-400'
                  : 'text-neutral-600 dark:text-neutral-400'
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
            const dayIncome = (summary?.inAmount || 0) + (summary?.backAmount || 0);
            const dayExpense = (summary?.outAmount || 0) + (summary?.lendAmount || 0);
            const hasIncome = dayIncome > 0;
            const hasExpense = dayExpense > 0;
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
                className={`relative min-h-[58px] sm:min-h-[64px] p-1 rounded-xl flex flex-col items-center justify-between select-none cursor-pointer transition-all duration-150 ${
                  isSelected
                    ? 'bg-[#9BBC0F] text-[#0F380F] border-2 border-[#242A20] dark:border-[#9BBC0F] shadow-[2px_2px_0px_#242A20] dark:shadow-[2px_2px_0px_#0A0F0A] font-bold'
                    : day.isToday
                    ? 'border-2 border-[#306230] dark:border-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-[1px_1px_0px_#306230] font-bold'
                    : day.isCurrentMonth
                    ? 'border border-transparent hover:border-[#242A20]/40 text-neutral-800 dark:text-neutral-200'
                    : 'text-neutral-300 dark:text-neutral-600 opacity-30 border border-transparent'
                }`}
              >
                {/* Day Number */}
                <span
                  className={`text-xs font-bold leading-tight ${
                    isSelected
                      ? 'text-[#0F380F]'
                      : day.isSunday
                      ? 'text-red-500 dark:text-red-400'
                      : day.isSaturday
                      ? 'text-sky-500 dark:text-sky-400'
                      : ''
                  }`}
                >
                  {day.dayNumber}
                </span>

                {/* Amount Badges Container: fully visible without overflow clipping */}
                <div className="w-full flex flex-col justify-end gap-[2px] mt-auto">
                  {/* Income Badge */}
                  {showIncome && (
                    <span
                      className={`font-sans font-bold text-[8.5px] sm:text-[9px] tracking-tight leading-none px-0.5 sm:px-1 py-[2px] rounded-[3px] w-full text-center truncate block transition-colors ${
                        isSelected
                          ? 'bg-[#0F380F] text-[#9BBC0F] font-extrabold'
                          : 'bg-emerald-100 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-300 border border-emerald-400/40 dark:border-emerald-600/50'
                      }`}
                    >
                      {isMasked ? '•••' : `+${formatCompactAmount(dayIncome)}`}
                    </span>
                  )}

                  {/* Expense Badge */}
                  {showExpense && (
                    <span
                      className={`font-sans font-bold text-[8.5px] sm:text-[9px] tracking-tight leading-none px-0.5 sm:px-1 py-[2px] rounded-[3px] w-full text-center truncate block transition-colors ${
                        isSelected
                          ? 'bg-[#8B1E43] text-white font-extrabold'
                          : 'bg-rose-100 dark:bg-rose-950/90 text-rose-800 dark:text-rose-300 border border-rose-400/40 dark:border-rose-700/50'
                      }`}
                    >
                      {isMasked ? '•••' : `-${formatCompactAmount(dayExpense)}`}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Filter Pills INSIDE the Calendar Card */}
        <div className="pt-2 border-t-2 border-dashed border-[#242A20]/20 dark:border-[#3C4A38]/50 flex justify-center">
          <div className="relative flex items-center p-1 bg-surfaceElevated-light dark:bg-surfaceElevated-dark rounded-xl pixel-card w-full max-w-[280px]">
            {/* Sliding Pill Indicator */}
            <div
              className="absolute top-1 bottom-1 rounded-lg bg-surface-light dark:bg-surface-dark border-2 border-[#242A20] dark:border-[#3C4A38] shadow-[1.5px_1.5px_0px_#242A20] dark:shadow-[1.5px_1.5px_0px_#0A0F0A] transition-transform duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none"
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
              className={`relative z-10 flex-1 py-1.5 px-2 text-xs font-bold text-center select-none rounded-lg transition-colors duration-150 ${
                filterType === 'out'
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
              }`}
            >
              จ่ายออก
            </button>
            <button
              type="button"
              onClick={() => setFilterType('in')}
              className={`relative z-10 flex-1 py-1.5 px-2 text-xs font-bold text-center select-none rounded-lg transition-colors duration-150 ${
                filterType === 'in'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
              }`}
            >
              เงินเข้า
            </button>
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`relative z-10 flex-1 py-1.5 px-2 text-xs font-bold text-center select-none rounded-lg transition-colors duration-150 ${
                filterType === 'all'
                  ? 'text-neutral-900 dark:text-neutral-100'
                  : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
              }`}
            >
              ทั้งหมด
            </button>
          </div>
        </div>
      </div>

      {/* 4. Selected Day Transaction Details Section */}
      <div className="bg-surface-light dark:bg-surface-dark pixel-card rounded-2xl p-4 space-y-3">
        {/* Selected Date Header */}
        <div className="flex items-center justify-between pb-2 border-b-2 border-dashed border-[#242A20]/20 dark:border-[#3C4A38]/50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-surfaceElevated-light dark:bg-surfaceElevated-dark border border-[#242A20] shadow-[1px_1px_0px_#242A20] flex items-center justify-center text-neutral-700 dark:text-neutral-300">
              <CalendarIcon size={14} strokeWidth={2.5} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                {formatThaiFullDate(activeSelectedDate)}
              </h4>
              <p className="text-[10px] font-medium text-neutral-500">
                {activeSelectedDate === todayStr ? 'วันนี้' : 'วันที่เลือก'}
              </p>
            </div>
          </div>

          {/* Daily Net Summary */}
          <div className="text-right">
            <span className="text-[10px] font-semibold text-neutral-500 block">สุทธิ</span>
            <span
              className={`text-sm font-bold tabular-nums ${
                selectedDaySummary.net >= 0
                  ? 'text-[#306230] dark:text-emerald-400'
                  : 'text-[#8B1E43] dark:text-red-400'
              }`}
            >
              {isMasked
                ? '••••'
                : `${selectedDaySummary.net >= 0 ? '+' : ''}${formatSatang(selectedDaySummary.net)} ฿`}
            </span>
          </div>
        </div>

        {/* 3-column day summary strip */}
        <div className="grid grid-cols-3 gap-2 py-2 px-1 bg-surfaceElevated-light dark:bg-surfaceElevated-dark rounded-xl border-2 border-[#242A20] dark:border-[#3C4A38] text-center">
          <div>
            <span className="text-[10px] font-semibold text-neutral-500 block mb-0.5">สุทธิ</span>
            <span
              className={`font-silkscreen text-[11px] sm:text-xs font-bold tabular-nums truncate block ${
                selectedDaySummary.net >= 0
                  ? 'text-[#306230] dark:text-emerald-400'
                  : 'text-[#8B1E43] dark:text-red-400'
              }`}
            >
              {isMasked
                ? '••••'
                : `${selectedDaySummary.net >= 0 ? '+' : ''}${formatSatang(selectedDaySummary.net)} ฿`}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-neutral-500 block mb-0.5">เข้า</span>
            <span className="font-silkscreen text-[11px] sm:text-xs font-bold text-[#306230] dark:text-emerald-400 tabular-nums truncate block">
              {isMasked ? '••••' : `+${formatSatang(selectedDaySummary.inAmount)} ฿`}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-neutral-500 block mb-0.5">จ่าย</span>
            <span className="font-silkscreen text-[11px] sm:text-xs font-bold text-[#8B1E43] dark:text-red-400 tabular-nums truncate block">
              {isMasked ? '••••' : `-${formatSatang(selectedDaySummary.outAmount)} ฿`}
            </span>
          </div>
        </div>

        {/* Selected Day Transaction List (Filtered) */}
        {filteredDayTransactions.length > 0 ? (
          <div className="space-y-2">
            {filteredDayTransactions.map((tx) => (
              <TransactionItem
                key={tx.id}
                transaction={tx}
                onClick={onSelectTx}
                isMasked={isMasked}
                pocketName={tx.pocketId ? pocketMap.get(tx.pocketId) : undefined}
                hideDate={true}
              />
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-neutral-400 text-xs">
            <p className="font-pixel text-[9px]">
              {filterType === 'out'
                ? 'NO EXPENSES / ไม่มีรายจ่าย'
                : filterType === 'in'
                ? 'NO INCOME / ไม่มีรายรับ'
                : 'NO RECORDS / ไม่มีรายการ'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
