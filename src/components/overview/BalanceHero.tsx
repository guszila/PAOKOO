import React from 'react';
import { formatSatang } from '../../lib/money';
import { HandCoins } from 'lucide-react';

interface BalanceHeroProps {
  currentBalance: number;
  totalLentOut: number;
  grandTotal: number;
}

export const BalanceHero: React.FC<BalanceHeroProps> = ({
  currentBalance,
  totalLentOut,
  grandTotal,
}) => {
  return (
    <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-3xl p-6 shadow-sm">
      <div className="flex items-center justify-between text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">
        <span>ยอดเงินในบัญชีปัจจุบัน</span>
        {totalLentOut > 0 && (
          <span className="flex items-center gap-1 text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-900/40 text-[11px]">
            <HandCoins size={12} strokeWidth={1.5} />
            <span>มีคนยืม {formatSatang(totalLentOut)} ฿</span>
          </span>
        )}
      </div>

      {/* Balance as largest lightweight number */}
      <div className="flex items-baseline gap-2">
        <span className="text-4xl sm:text-5xl font-light tracking-tight text-neutral-900 dark:text-neutral-50 tabular-nums">
          {formatSatang(currentBalance)}
        </span>
        <span className="text-lg font-light text-neutral-400 dark:text-neutral-500">฿</span>
      </div>

      {/* Grand total (balance + lent out) */}
      <div className="mt-4 pt-3 border-t border-border-light dark:border-border-dark flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
        <span>ยอดรวมทั้งหมด (รวมเงินที่ให้ยืม):</span>
        <span className="font-semibold text-neutral-800 dark:text-neutral-200 tabular-nums">
          {formatSatang(grandTotal)} ฿
        </span>
      </div>
    </div>
  );
};
