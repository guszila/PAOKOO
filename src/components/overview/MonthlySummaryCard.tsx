import React from 'react';
import { formatSatang } from '../../lib/money';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';

interface MonthlySummaryCardProps {
  deposits: number;
  expenses: number;
}

export const MonthlySummaryCard: React.FC<MonthlySummaryCardProps> = ({
  deposits,
  expenses,
}) => {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Deposits this month */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-4 flex flex-col justify-between">
        <div className="flex items-center gap-1.5 text-xs text-neutral-500 mb-1">
          <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <ArrowDownLeft size={13} strokeWidth={2} />
          </div>
          <span>เงินเข้าเดือนนี้</span>
        </div>
        <div className="text-lg font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">
          +{formatSatang(deposits)} ฿
        </div>
      </div>

      {/* Expenses this month */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-4 flex flex-col justify-between">
        <div className="flex items-center gap-1.5 text-xs text-neutral-500 mb-1">
          <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-950/60 flex items-center justify-center text-red-600 dark:text-red-400">
            <ArrowUpRight size={13} strokeWidth={2} />
          </div>
          <span>จ่ายออกเดือนนี้</span>
        </div>
        <div className="text-lg font-medium text-red-600 dark:text-red-400 tabular-nums">
          -{formatSatang(expenses)} ฿
        </div>
      </div>
    </div>
  );
};
