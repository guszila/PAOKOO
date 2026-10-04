import React, { useMemo } from 'react';
import { Transaction } from '../../types/transaction';
import { Pocket } from '../../types/pocket';
import { TransactionItem } from '../transactions/TransactionItem';
import { ChevronRight, Receipt } from 'lucide-react';

interface RecentTransactionsProps {
  transactions: Transaction[];
  onViewAll: () => void;
  onSelectTx: (tx: Transaction) => void;
  pockets?: Pocket[];
  isMasked?: boolean;
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  transactions,
  onViewAll,
  onSelectTx,
  pockets = [],
  isMasked = false,
}) => {
  const recent = transactions.slice(0, 4);
  const pocketMap = useMemo(() => {
    const map = new Map<string, string>();
    pockets.forEach((p) => map.set(p.id, p.name));
    return map;
  }, [pockets]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          รายการล่าสุด
        </h3>
        <button
          onClick={onViewAll}
          className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-0.5 transition-colors"
        >
          <span>ดูทั้งหมด ({transactions.length})</span>
          <ChevronRight size={14} strokeWidth={1.5} />
        </button>
      </div>

      {recent.length === 0 ? (
        <div className="py-8 text-center text-xs text-neutral-500 dark:text-neutral-400 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-3xl flex flex-col items-center gap-2">
          <Receipt size={24} strokeWidth={1.5} className="text-neutral-400" />
          <span>ยังไม่มีรายการในขณะนี้</span>
        </div>
      ) : (
        <div className="space-y-2">
          {recent.map((tx) => (
            <TransactionItem
              key={tx.id}
              transaction={tx}
              onClick={onSelectTx}
              isMasked={isMasked}
              pocketName={tx.pocketId ? pocketMap.get(tx.pocketId) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
};
