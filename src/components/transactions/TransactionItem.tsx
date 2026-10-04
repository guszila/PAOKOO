import React from 'react';
import { Transaction } from '../../types/transaction';
import { formatSatang } from '../../lib/money';
import { ArrowDownLeft, ArrowUpRight, HandCoins, CornerDownLeft, ReceiptText, Tag, Wallet } from 'lucide-react';

interface TransactionItemProps {
  transaction: Transaction;
  onClick?: (transaction: Transaction) => void;
  isMasked?: boolean;
  pocketName?: string;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onClick,
  isMasked = false,
  pocketName,
}) => {
  const getTypeConfig = () => {
    switch (transaction.type) {
      case 'in':
        return {
          label: 'ฝากเข้า',
          icon: ArrowDownLeft,
          iconColor: 'text-emerald-600 dark:text-emerald-400',
          bgColor: 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40',
          amountColor: 'text-emerald-600 dark:text-emerald-400',
          sign: '+',
        };
      case 'out':
        return {
          label: 'รายจ่าย',
          icon: ArrowUpRight,
          iconColor: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40',
          amountColor: 'text-red-600 dark:text-red-400',
          sign: '-',
        };
      case 'lend':
        return {
          label: 'ให้ยืม/สำรอง',
          icon: HandCoins,
          iconColor: 'text-amber-600 dark:text-amber-400',
          bgColor: 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40',
          amountColor: 'text-amber-600 dark:text-amber-400',
          sign: '-',
        };
      case 'back':
        return {
          label: 'ได้รับคืน',
          icon: CornerDownLeft,
          iconColor: 'text-teal-600 dark:text-teal-400',
          bgColor: 'bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900/40',
          amountColor: 'text-teal-600 dark:text-teal-400',
          sign: '+',
        };
    }
  };

  const config = getTypeConfig();
  const Icon = config.icon;

  const displayCategory = transaction.type === 'out'
    ? (transaction.category?.trim() || 'อื่นๆ')
    : null;

  return (
    <div
      onClick={() => onClick?.(transaction)}
      className="group relative flex items-center justify-between p-3.5 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl hover:bg-neutral-50 dark:hover:bg-surfaceElevated-dark transition-all cursor-pointer active:scale-[0.99] select-none shadow-sm"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-10 h-10 rounded-2xl ${config.bgColor} flex items-center justify-center ${config.iconColor} shrink-0`}>
          <Icon size={18} strokeWidth={1.5} />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
              {transaction.who}
            </span>
            <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
              {config.label}
            </span>

            {/* Expense Category Badge */}
            {displayCategory && (
              <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                <Tag size={9} />
                <span>{displayCategory}</span>
              </span>
            )}

            {/* Pocket Badge */}
            {pocketName && (
              <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40">
                <Wallet size={9} />
                <span>{pocketName}</span>
              </span>
            )}

            {transaction.slipThumbnail && (
              <span className="flex items-center text-[10px] text-blue-500 bg-blue-50 dark:bg-blue-950/50 px-1 rounded" title="มีสลิป">
                <ReceiptText size={11} className="mr-0.5" />
                สลิป
              </span>
            )}
          </div>
          <div className="text-xs text-neutral-500 truncate mt-0.5">
            {transaction.note ? transaction.note : 'ไม่มีบันทึก'} · {transaction.date}{transaction.time ? ` (${transaction.time} น.)` : ''}
          </div>
        </div>
      </div>

      <div className="text-right shrink-0 ml-3">
        <div className={`text-sm font-semibold tabular-nums ${config.amountColor}`}>
          {isMasked ? '••••' : `${config.sign}${formatSatang(transaction.amount)} ฿`}
        </div>
      </div>
    </div>
  );
};
