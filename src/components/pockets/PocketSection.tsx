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
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            กล่องแบ่งเงินใช้
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-medium">
            {pocketSummaries.length} กล่อง
          </span>
        </div>
        <button
          onClick={onOpenCreate}
          className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors p-1"
        >
          <Plus size={14} strokeWidth={2} />
          <span>สร้างกล่อง</span>
        </button>
      </div>

      {/* Empty State */}
      {pocketSummaries.length === 0 ? (
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-3xl p-5 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto">
            <Sparkles size={22} strokeWidth={1.5} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              อยากแบ่งเงินมาใช้ เช่น 2,000 ฿?
            </h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-xs mx-auto">
              สร้างกล่องเงินแบ่งใช้ไว้ เมื่อเพิ่มสลิปหรือรายจ่าย สามารถเลือกตัดจากกล่องนี้ได้
              เงินจะค่อยๆ ลดลงทีละนิด โดยไม่กระทบยอดเงินจริงในบัญชี
            </p>
          </div>
          <button
            onClick={onOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-xl shadow-sm transition-all active:scale-95"
          >
            <Plus size={14} strokeWidth={2} />
            <span>สร้างกล่องแบ่งเงินแรก</span>
          </button>
        </div>
      ) : (
        /* Pockets Grid */
        <div className="grid grid-cols-1 gap-3">
          {pocketSummaries.map((summary, idx) => {
            const { pocket, spentSatang, remainingSatang, spentPercentage } = summary;
            const IconComp = (pocket.icon && POCKET_ICONS[pocket.icon]) || Wallet;
            const themeColor = getPocketDisplayColor(pocket.color, idx);

            const isOverspent = remainingSatang < 0;
            const isExhausted = remainingSatang === 0;

            return (
              <div
                key={pocket.id}
                className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-3xl p-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
              >
                {/* Accent top stripe */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5 opacity-80"
                  style={{ backgroundColor: isOverspent ? '#EF4444' : themeColor }}
                />

                <div className="flex items-start justify-between">
                  {/* Left: Icon & Pocket Name */}
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm shrink-0"
                      style={{ backgroundColor: isOverspent ? '#EF4444' : themeColor }}
                    >
                      <IconComp size={18} strokeWidth={2} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                        {pocket.name}
                        {isOverspent ? (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 font-normal">
                            เกินงบ
                          </span>
                        ) : isExhausted ? (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 font-normal">
                            หมดงบ
                          </span>
                        ) : null}
                      </h4>
                      <p className="text-[11px] text-neutral-400">
                        วงเงินที่ตั้งไว้ {isMasked ? '••••' : `${formatSatang(pocket.allocatedSatang)} ฿`}
                      </p>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onOpenTopUp(summary)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-xl bg-neutral-100 dark:bg-surfaceElevated-dark hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 transition-colors"
                      title="เติมเงินเข้ากล่อง"
                    >
                      <PlusCircle size={13} className="text-emerald-500" />
                      <span>เติมเงิน</span>
                    </button>
                    <button
                      onClick={() => onOpenEdit(pocket)}
                      className="p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                      title="ตั้งค่ากล่องเงิน"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                </div>

                {/* Remaining Amount */}
                <div className="mt-3.5 flex items-baseline justify-between">
                  <div className="flex items-baseline gap-1.5">
                    <span
                      className={`text-2xl font-semibold tracking-tight tabular-nums ${
                        isOverspent
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-neutral-900 dark:text-neutral-50'
                      }`}
                    >
                      {isMasked ? '••••' : formatSatang(remainingSatang)}
                    </span>
                    <span className="text-xs text-neutral-400">
                      {isOverspent ? '฿ (เกินงบ)' : '฿ คงเหลือ'}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    ใช้ไป {isMasked ? '••••' : `${formatSatang(spentSatang)} ฿`} ({spentPercentage.toFixed(0)}%)
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-2 w-full h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${spentPercentage}%`,
                      backgroundColor: isExhausted ? '#EF4444' : themeColor,
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
