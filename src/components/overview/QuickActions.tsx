import React from 'react';
import { TransactionType } from '../../types/transaction';
import { ArrowDownLeft, ArrowUpRight, HandCoins, CornerDownLeft, Camera } from 'lucide-react';

interface QuickActionsProps {
  onSelectAction: (type: TransactionType) => void;
  onOpenScanner: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onSelectAction,
  onOpenScanner,
}) => {
  const actions = [
    {
      type: 'in' as TransactionType,
      label: 'เงินเข้า',
      icon: ArrowDownLeft,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/40 hover:bg-emerald-100',
    },
    {
      type: 'out' as TransactionType,
      label: 'จ่าย',
      icon: ArrowUpRight,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/40 hover:bg-red-100',
    },
    {
      type: 'lend' as TransactionType,
      label: 'ให้ยืม',
      icon: HandCoins,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/40 hover:bg-amber-100',
    },
    {
      type: 'back' as TransactionType,
      label: 'คืนเงิน',
      icon: CornerDownLeft,
      color: 'text-teal-600 dark:text-teal-400',
      bgColor: 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-900/40 hover:bg-teal-100',
    },
  ];

  return (
    <div className="py-1">
      <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar py-1">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.type}
              type="button"
              onClick={() => onSelectAction(act.type)}
              className="flex flex-col items-center justify-center flex-1 min-w-[62px] min-h-[58px] group transition-transform active:scale-95 select-none"
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${act.bgColor} ${act.color} shadow-sm`}
              >
                <Icon size={20} strokeWidth={1.5} />
              </div>
              <span className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300 mt-1.5 truncate">
                {act.label}
              </span>
            </button>
          );
        })}

        {/* Scan Slip shortcut */}
        <button
          type="button"
          onClick={onOpenScanner}
          className="flex flex-col items-center justify-center flex-1 min-w-[62px] min-h-[58px] group transition-transform active:scale-95 select-none"
        >
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center border bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/40 hover:bg-blue-100 text-blue-600 dark:text-blue-400 shadow-sm transition-all">
            <Camera size={19} strokeWidth={1.5} />
          </div>
          <span className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300 mt-1.5 truncate">
            สแกนสลิป
          </span>
        </button>
      </div>
    </div>
  );
};
