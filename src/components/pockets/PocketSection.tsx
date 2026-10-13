import React from 'react';
import { Pocket, PocketSummary } from '../../types/pocket';
import { formatSatang } from '../../lib/money';
import { Plus, MoreHorizontal, PlusCircle, Sparkles, Wallet } from 'lucide-react';
import { POCKET_ICONS } from './PocketModal';
import { getPocketDisplayColor } from '../../lib/donut';

interface PocketSectionProps {
  pocketSummaries: PocketSummary[];
  onOpenCreate: () => void;
  onOpenEdit: (pocket: Pocket) => void;
  onOpenTopUp: (summary: PocketSummary) => void;
  isMasked?: boolean;
}

export const PocketSection: React.FC<PocketSectionProps> = ({
  pocketSummaries,
  onOpenCreate,
  onOpenEdit,
  onOpenTopUp,
  isMasked = false,
}) => {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-[#F59E0B] border border-[#242A20] shadow-[1px_1px_0px_#242A20]" />
          <span className="font-silkscreen text-[11px] font-bold text-neutral-800 dark:text-neutral-200 tracking-wider">
            ITEM SLOTS / กล่องแบ่งเงินใช้
          </span>
          <span className="font-pixel text-[8px] px-1.5 py-0.5 rounded bg-surfaceElevated-light dark:bg-surfaceElevated-dark border border-[#242A20] dark:border-[#3C4A38] text-neutral-800 dark:text-neutral-200">
            {pocketSummaries.length} SLOTS
          </span>
        </div>
        <button
          onClick={onOpenCreate}
          className="inline-flex items-center gap-1 font-silkscreen text-[10px] font-bold text-[#306230] dark:text-[#9BBC0F] hover:underline p-1"
        >
          <Plus size={12} strokeWidth={3} />
          <span>+ NEW</span>
        </button>
      </div>

      {/* Empty State */}
      {pocketSummaries.length === 0 ? (
        <div className="bg-surface-light dark:bg-surface-dark border-2 border-[#242A20] dark:border-[#3C4A38] rounded-xl p-4 text-center space-y-2 shadow-[3px_3px_0px_#242A20] dark:shadow-[3px_3px_0px_#0A0F0A]">
          <div className="w-10 h-10 rounded-lg bg-[#9BBC0F] border-2 border-[#242A20] flex items-center justify-center text-[#0F380F] mx-auto shadow-[1.5px_1.5px_0px_#242A20]">
            <Sparkles size={18} strokeWidth={2.5} />
          </div>
          <div>
            <h4 className="font-silkscreen text-xs font-bold text-neutral-900 dark:text-neutral-100">
              NO POCKETS YET / สร้างกล่องแบ่งเงิน
            </h4>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-1 max-w-xs mx-auto">
              แบ่งงบกิน เที่ยว ช้อปปิ้ง ตัดเงินแยกจากกองกลางได้ตามใจชอบ
            </p>
          </div>
          <button
            onClick={onOpenCreate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#8B1E43] text-white font-silkscreen text-[10px] font-bold rounded-lg border-2 border-[#242A20] shadow-[2px_2px_0px_#242A20] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-transform"
          >
            <Plus size={12} strokeWidth={3} />
            <span>CREATE POCKET</span>
          </button>
        </div>
      ) : (
        /* Pockets Grid */
        <div className="grid grid-cols-1 gap-2.5">
          {pocketSummaries.map((summary, idx) => {
            const { pocket, spentSatang, remainingSatang, spentPercentage } = summary;
            const IconComp = (pocket.icon && POCKET_ICONS[pocket.icon]) || Wallet;
            const themeColor = getPocketDisplayColor(pocket.color, idx);

            const isOverspent = remainingSatang < 0;
            const isExhausted = remainingSatang === 0;

            return (
              <div
                key={pocket.id}
                className="bg-surface-light dark:bg-surface-dark border-2 border-[#242A20] dark:border-[#3C4A38] rounded-xl p-3 shadow-[3px_3px_0px_#242A20] dark:shadow-[3px_3px_0px_#0A0F0A] relative overflow-hidden"
              >
                {/* Top Cartridge Notch Stripe */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ backgroundColor: isOverspent ? '#8B1E43' : themeColor }}
                />

                <div className="flex items-start justify-between pt-1">
                  {/* Left: Icon & Pocket Name */}
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-white border-2 border-[#242A20] dark:border-[#3C4A38] shadow-[1.5px_1.5px_0px_#242A20] shrink-0"
                      style={{ backgroundColor: isOverspent ? '#8B1E43' : themeColor }}
                    >
                      <IconComp size={16} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                        {pocket.name}
                        {isOverspent ? (
                          <span className="font-pixel text-[8px] px-1 py-0.2 rounded bg-red-100 text-red-600 border border-red-500 font-bold">
                            OVER
                          </span>
                        ) : isExhausted ? (
                          <span className="font-pixel text-[8px] px-1 py-0.2 rounded bg-amber-100 text-amber-700 border border-amber-500 font-bold">
                            EMPTY
                          </span>
                        ) : null}
                      </h4>
                      <p className="font-pixel text-[9px] text-neutral-500 dark:text-neutral-400">
                        MAX: {isMasked ? '••••' : `${formatSatang(summary.totalAllocatedSatang ?? pocket.allocatedSatang)}฿`}
                      </p>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onOpenTopUp(summary)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-silkscreen font-bold rounded-md bg-[#9BBC0F] text-[#0F380F] border border-[#242A20] shadow-[1px_1px_0px_#242A20] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                      title="เติมเงินเข้ากล่อง"
                    >
                      <PlusCircle size={11} strokeWidth={2.5} />
                      <span>TOP-UP</span>
                    </button>
                    <button
                      onClick={() => onOpenEdit(pocket)}
                      className="p-1 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors"
                      title="ตั้งค่ากล่องเงิน"
                    >
                      <MoreHorizontal size={15} />
                    </button>
                  </div>
                </div>

                {/* Remaining Amount */}
                <div className="mt-2.5 flex items-baseline justify-between">
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`font-silkscreen text-xl font-bold tracking-tight tabular-nums ${
                        isOverspent
                          ? 'text-[#8B1E43] dark:text-red-400'
                          : 'text-neutral-900 dark:text-neutral-100'
                      }`}
                    >
                      {isMasked ? '••••' : formatSatang(remainingSatang)}
                    </span>
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                      {isOverspent ? '฿ (เกิน)' : '฿ คงเหลือ'}
                    </span>
                  </div>
                  <div className="font-pixel text-[9px] text-neutral-600 dark:text-neutral-400">
                    SPENT: {isMasked ? '••••' : `${formatSatang(spentSatang)}฿`} ({spentPercentage.toFixed(0)}%)
                  </div>
                </div>

                {/* Retro HP-style Progress Bar */}
                <div className="mt-1.5 w-full h-2.5 rounded-sm bg-neutral-200 dark:bg-neutral-800 border border-[#242A20] dark:border-[#3C4A38] overflow-hidden p-[1px]">
                  <div
                    className="h-full rounded-none transition-all duration-300"
                    style={{
                      width: `${Math.min(spentPercentage, 100)}%`,
                      backgroundColor: isExhausted ? '#8B1E43' : themeColor,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
