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
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-[#8B1E43] border border-[#242A20] shadow-[1px_1px_0px_#242A20]" />
          <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 tracking-wider">
            LOGS / รายการล่าสุด
          </h3>
        </div>
        <button
          onClick={onViewAll}
          className="text-[10px] font-semibold text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white flex items-center gap-0.5 transition-colors"
        >
          <span>VIEW ALL ({transactions.length})</span>
          <ChevronRight size={12} strokeWidth={2.5} />
        </button>
      </div>

      {recent.length === 0 ? (
        <div className="py-6 text-center text-xs text-neutral-500 bg-surface-light dark:bg-surface-dark border-2 border-[#242A20] dark:border-[#3C4A38] rounded-xl flex flex-col items-center gap-2 shadow-[2px_2px_0px_#242A20]">
          <Receipt size={22} strokeWidth={2} className="text-neutral-400" />
          <span className="text-xs font-bold text-neutral-500">NO RECORDS YET / ยังไม่มีรายการ</span>
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
