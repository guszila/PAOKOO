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
      sub: '1-UP',
      icon: ArrowDownLeft,
      color: 'text-[#0F380F]',
      bgColor: 'bg-[#9BBC0F]',
    },
    {
      type: 'out' as TransactionType,
      label: 'จ่ายออก',
      sub: 'DMG',
      icon: ArrowUpRight,
      color: 'text-white',
      bgColor: 'bg-[#8B1E43]',
    },
    {
      type: 'lend' as TransactionType,
      label: 'ให้ยืม',
      sub: '2-PL',
      icon: HandCoins,
      color: 'text-[#451A03]',
      bgColor: 'bg-[#F59E0B]',
    },
    {
      type: 'back' as TransactionType,
      label: 'คืนเงิน',
      sub: 'RECV',
      icon: CornerDownLeft,
      color: 'text-white',
      bgColor: 'bg-[#047857]',
    },
  ];

  return (
    <div className="py-1">
      <div className="flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar py-1">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.type}
              type="button"
              onClick={() => onSelectAction(act.type)}
              className="flex flex-col items-center justify-center flex-1 min-w-[58px] min-h-[58px] group select-none transition-transform active:translate-x-[1px] active:translate-y-[1px]"
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center border-2 border-[#242A20] dark:border-[#3C4A38] shadow-[2.5px_2.5px_0px_#242A20] dark:shadow-[2.5px_2.5px_0px_#0A0F0A] ${act.bgColor} ${act.color} transition-transform group-active:shadow-none group-active:translate-y-[1px]`}
              >
                <Icon size={19} strokeWidth={2.75} />
              </div>
              <span className="font-silkscreen text-[10px] font-bold text-neutral-800 dark:text-neutral-200 mt-1.5 truncate">
                {act.label}
              </span>
              <span className="font-pixel text-[8px] text-neutral-500 dark:text-neutral-400">
                {act.sub}
              </span>
            </button>
          );
        })}

        {/* Game Boy Camera / Scan Slip shortcut */}
        <button
          type="button"
          onClick={onOpenScanner}
          className="flex flex-col items-center justify-center flex-1 min-w-[58px] min-h-[58px] group select-none transition-transform active:translate-x-[1px] active:translate-y-[1px]"
        >
          <div className="w-11 h-11 rounded-xl flex items-center justify-center border-2 border-[#242A20] dark:border-[#3C4A38] bg-[#243C78] text-white shadow-[2.5px_2.5px_0px_#242A20] dark:shadow-[2.5px_2.5px_0px_#0A0F0A] transition-transform group-active:shadow-none group-active:translate-y-[1px]">
            <Camera size={19} strokeWidth={2.5} />
          </div>
          <span className="font-silkscreen text-[10px] font-bold text-neutral-800 dark:text-neutral-200 mt-1.5 truncate">
            กล้องสแกน
          </span>
          <span className="font-pixel text-[8px] text-neutral-500 dark:text-neutral-400">
            GB-CAM
          </span>
        </button>
      </div>
    </div>
  );
};
