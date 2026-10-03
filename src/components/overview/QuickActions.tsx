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
      bgColor:
        'bg-gradient-to-b from-emerald-50 via-emerald-50/90 to-emerald-100/80 dark:from-emerald-950/70 dark:to-emerald-900/40 border-emerald-300/70 dark:border-emerald-700/50 shadow-[0_4px_12px_rgba(16,185,129,0.22)] dark:shadow-[0_4px_14px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_16px_rgba(16,185,129,0.35)]',
    },
    {
      type: 'out' as TransactionType,
      label: 'จ่าย',
      icon: ArrowUpRight,
      color: 'text-red-600 dark:text-red-400',
      bgColor:
        'bg-gradient-to-b from-red-50 via-red-50/90 to-red-100/80 dark:from-red-950/70 dark:to-red-900/40 border-red-300/70 dark:border-red-700/50 shadow-[0_4px_12px_rgba(239,68,68,0.22)] dark:shadow-[0_4px_14px_rgba(239,68,68,0.3)] hover:shadow-[0_6px_16px_rgba(239,68,68,0.35)]',
    },
    {
      type: 'lend' as TransactionType,
      label: 'ให้ยืม',
      icon: HandCoins,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor:
        'bg-gradient-to-b from-amber-50 via-amber-50/90 to-amber-100/80 dark:from-amber-950/70 dark:to-amber-900/40 border-amber-300/70 dark:border-amber-700/50 shadow-[0_4px_12px_rgba(245,158,11,0.22)] dark:shadow-[0_4px_14px_rgba(245,158,11,0.3)] hover:shadow-[0_6px_16px_rgba(245,158,11,0.35)]',
    },
    {
      type: 'back' as TransactionType,
      label: 'คืนเงิน',
      icon: CornerDownLeft,
      color: 'text-teal-600 dark:text-teal-400',
      bgColor:
        'bg-gradient-to-b from-teal-50 via-teal-50/90 to-teal-100/80 dark:from-teal-950/70 dark:to-teal-900/40 border-teal-300/70 dark:border-teal-700/50 shadow-[0_4px_12px_rgba(20,184,166,0.22)] dark:shadow-[0_4px_14px_rgba(20,184,166,0.3)] hover:shadow-[0_6px_16px_rgba(20,184,166,0.35)]',
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
                className={`w-12 h-12 rounded-2xl flex items-center justify-center border ring-1 ring-inset ring-white/80 dark:ring-white/10 transition-all duration-200 group-hover:-translate-y-1 ${act.bgColor} ${act.color}`}
              >
                <Icon size={20} strokeWidth={2} className="transition-transform group-hover:scale-110" />
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
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center border bg-gradient-to-b from-blue-50 via-blue-50/90 to-blue-100/80 dark:from-blue-950/70 dark:to-blue-900/40 border-blue-300/70 dark:border-blue-700/50 text-blue-600 dark:text-blue-400 shadow-[0_4px_12px_rgba(59,130,246,0.22)] dark:shadow-[0_4px_14px_rgba(59,130,246,0.3)] hover:shadow-[0_6px_16px_rgba(59,130,246,0.35)] ring-1 ring-inset ring-white/80 dark:ring-white/10 transition-all duration-200 group-hover:-translate-y-1">
            <Camera size={19} strokeWidth={2} className="transition-transform group-hover:scale-110" />
          </div>
          <span className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300 mt-1.5 truncate">
            สแกนสลิป
          </span>
        </button>
      </div>
    </div>
  );
};
