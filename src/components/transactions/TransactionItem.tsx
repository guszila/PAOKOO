import React, { useMemo } from 'react';
import { Transaction } from '../../types/transaction';
import { formatSatang } from '../../lib/money';
import { ArrowDownLeft, ArrowUpRight, HandCoins, CornerDownLeft, ReceiptText, Wallet } from 'lucide-react';
import { extractEmoji, getCategoryEmoji } from '../../config/emojis';

interface TransactionItemProps {
  transaction: Transaction;
  onClick?: (transaction: Transaction) => void;
  isMasked?: boolean;
  pocketName?: string;
  hideDate?: boolean;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onClick,
  isMasked = false,
  pocketName,
  hideDate = false,
}) => {
  const getTypeConfig = () => {
    switch (transaction.type) {
      case 'in':
        return {
          label: 'ฝากเข้า',
          code: 'IN',
          icon: ArrowDownLeft,
          iconColor: 'text-[#0F380F]',
          bgColor: 'bg-[#9BBC0F]',
          amountColor: 'text-[#306230] dark:text-[#9BBC0F]',
          sign: '+',
        };
      case 'out':
        return {
          label: 'รายจ่าย',
          code: 'OUT',
          icon: ArrowUpRight,
          iconColor: 'text-white',
          bgColor: 'bg-[#8B1E43]',
          amountColor: 'text-[#8B1E43] dark:text-red-400',
          sign: '-',
        };
      case 'lend':
        return {
          label: 'ให้ยืม',
          code: 'LEND',
          icon: HandCoins,
          iconColor: 'text-amber-950',
          bgColor: 'bg-[#F59E0B]',
          amountColor: 'text-amber-700 dark:text-amber-400',
          sign: '-',
        };
      case 'back':
        return {
          label: 'ได้รับคืน',
          code: 'BACK',
          icon: CornerDownLeft,
          iconColor: 'text-white',
          bgColor: 'bg-[#047857]',
          amountColor: 'text-[#047857] dark:text-emerald-400',
          sign: '+',
        };
    }
  };

  const config = getTypeConfig();
  const Icon = config.icon;

  const displayCategory = transaction.type === 'out'
    ? (transaction.category?.trim() || 'อื่นๆ')
    : null;

  const txEmoji = useMemo(() => {
    const noteEmoji = extractEmoji(transaction.note);
    if (noteEmoji) return noteEmoji;
    if (transaction.type === 'out') {
      return getCategoryEmoji(transaction.category);
    }
    return null;
  }, [transaction.note, transaction.type, transaction.category]);

  return (
    <div
      onClick={() => onClick?.(transaction)}
      className="group relative flex items-center justify-between p-3 bg-surface-light dark:bg-surface-dark border-2 border-[#242A20] dark:border-[#3C4A38] rounded-xl hover:bg-neutral-100 dark:hover:bg-surfaceElevated-dark transition-all cursor-pointer active:translate-x-[1px] active:translate-y-[1px] select-none shadow-[2.5px_2.5px_0px_#242A20] dark:shadow-[2.5px_2.5px_0px_#0A0F0A] active:shadow-none"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={`w-9 h-9 rounded-lg ${config.bgColor} border-2 border-[#242A20] dark:border-[#3C4A38] shadow-[1px_1px_0px_#242A20] flex items-center justify-center shrink-0`}>
          {txEmoji ? (
            <span className="text-base leading-none select-none">
              {txEmoji}
            </span>
          ) : (
            <Icon size={16} strokeWidth={2.75} className={config.iconColor} />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
              {transaction.who}
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border border-[#242A20] dark:border-[#3C4A38] bg-surfaceElevated-light dark:bg-surfaceElevated-dark text-neutral-800 dark:text-neutral-200">
              {config.code}
            </span>

            {/* Expense Category Badge with Emoji */}
            {displayCategory && (
              <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-neutral-200/80 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-[#242A20]/40">
                <span>{getCategoryEmoji(displayCategory)}</span>
                <span className="font-medium">{displayCategory}</span>
              </span>
            )}

            {/* Pocket Badge */}
            {pocketName && (
              <span className="flex items-center gap-0.5 text-[9.5px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-[#242A20]">
                <Wallet size={9} />
                <span>{pocketName}</span>
              </span>
            )}

            {transaction.slipThumbnail && (
              <span className="flex items-center text-[9px] font-bold text-blue-600 bg-blue-100 dark:bg-blue-950 px-1.5 py-0.5 rounded border border-[#242A20]" title="มีสลิป">
                <ReceiptText size={9} className="mr-0.5" />
                SLIP
              </span>
            )}
          </div>
          <div className="text-[11px] text-neutral-600 dark:text-neutral-400 truncate mt-0.5">
            {transaction.note ? transaction.note : 'ไม่มีบันทึก'}
            {hideDate ? (
              transaction.time ? ` · ${transaction.time} น.` : ''
            ) : (
              ` · ${transaction.date}${transaction.time ? ` (${transaction.time})` : ''}`
            )}
          </div>
        </div>
      </div>

      <div className="text-right shrink-0 ml-2">
        <div className={`text-sm font-bold tabular-nums tracking-tight ${config.amountColor}`}>
          {isMasked ? '••••' : `${config.sign}${formatSatang(transaction.amount)}฿`}
        </div>
      </div>
    </div>
  );
};
