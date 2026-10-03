import React from 'react';
import { OutstandingDebtor } from '../../types/transaction';
import { formatSatang } from '../../lib/money';
import { CheckCircle2, UserCheck } from 'lucide-react';
import { Button } from '../common/Button';

interface DebtorCardProps {
  debtors: OutstandingDebtor[];
  onRepayClick: (debtor: OutstandingDebtor) => void;
}

export const DebtorCard: React.FC<DebtorCardProps> = ({
  debtors,
  onRepayClick,
}) => {
  return (
    <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-3xl p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-600 dark:text-red-400">
            <UserCheck size={14} strokeWidth={1.5} />
          </div>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            เงินให้ยืม / สำรองจ่ายค้างคืน
          </h3>
        </div>
        <span className="text-xs text-neutral-500">
          {debtors.length} คน
        </span>
      </div>

      {debtors.length === 0 ? (
        <div className="py-6 text-center text-xs text-neutral-500 dark:text-neutral-400 flex flex-col items-center gap-2 bg-surfaceElevated-light dark:bg-surfaceElevated-dark rounded-2xl border border-dashed border-border-light dark:border-border-dark">
          <CheckCircle2 size={24} strokeWidth={1.5} className="text-emerald-500" />
          <span>ยอดเงินเคลียร์ครบแล้ว ไม่มีใครค้างชำระ 🎉</span>
        </div>
      ) : (
        <div className="divide-y divide-border-light dark:divide-border-dark">
          {debtors.map((debtor) => (
            <div
              key={debtor.who}
              className="py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="font-medium text-sm text-neutral-900 dark:text-neutral-100 truncate">
                  {debtor.who}
                </div>
                <div className="text-xs text-neutral-500 tabular-nums">
                  ยืมทั้งหมด {formatSatang(debtor.totalLent)} ฿
                  {debtor.totalRepaid > 0 && ` (คืนแล้ว ${formatSatang(debtor.totalRepaid)} ฿)`}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className="text-sm font-semibold text-red-600 dark:text-red-400 tabular-nums">
                    {formatSatang(debtor.balance)} ฿
                  </div>
                  <div className="text-[10px] text-neutral-400">ค้างชำระ</div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onRepayClick(debtor)}
                  className="text-xs px-3 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                >
                  คืนแล้ว
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
