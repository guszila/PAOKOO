import React, { useState } from 'react';
import { Pocket, PocketSummary } from '../../types/pocket';
import { formatSatang } from '../../lib/money';
import {
  Plus,
  MoreHorizontal,
  PlusCircle,
  Sparkles,
  Wallet,
  CheckCircle2,
  Archive,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';
import { POCKET_ICONS } from './PocketModal';
import { getPocketDisplayColor } from '../../lib/donut';

interface PocketSectionProps {
  pocketSummaries: PocketSummary[];
  onOpenCreate: () => void;
  onOpenEdit: (pocket: Pocket) => void;
  onOpenTopUp: (summary: PocketSummary) => void;
  onOpenComplete?: (summary: PocketSummary) => void;
  onReopenPocket?: (pocketId: string) => void;
  isMasked?: boolean;
}

export const PocketSection: React.FC<PocketSectionProps> = ({
  pocketSummaries,
  onOpenCreate,
  onOpenEdit,
  onOpenTopUp,
  onOpenComplete,
  onReopenPocket,
  isMasked = false,
}) => {
  const [showCompleted, setShowCompleted] = useState(false);

  const activeSummaries = pocketSummaries.filter(
    (s) => s.pocket.status !== 'completed'
  );
  const completedSummaries = pocketSummaries.filter(
    (s) => s.pocket.status === 'completed'
  );

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-[#F59E0B] border border-[#242A20] shadow-[1px_1px_0px_#242A20]" />
          <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 tracking-wider">
            กล่องแบ่งเงินใช้
          </span>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-surfaceElevated-light dark:bg-surfaceElevated-dark border border-[#242A20] dark:border-[#3C4A38] text-neutral-800 dark:text-neutral-200">
            {activeSummaries.length} กล่อง
          </span>
        </div>
        <button
          onClick={onOpenCreate}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#306230] dark:text-[#9BBC0F] hover:underline p-1"
        >
          <Plus size={12} strokeWidth={3} />
          <span>เพิ่มกล่อง</span>
        </button>
      </div>

      {/* Empty State */}
      {activeSummaries.length === 0 ? (
        <div className="bg-surface-light dark:bg-surface-dark border-2 border-[#242A20] dark:border-[#3C4A38] rounded-xl p-4 text-center space-y-2 shadow-[3px_3px_0px_#242A20] dark:shadow-[3px_3px_0px_#0A0F0A]">
          <div className="w-10 h-10 rounded-lg bg-[#9BBC0F] border-2 border-[#242A20] flex items-center justify-center text-[#0F380F] mx-auto shadow-[1.5px_1.5px_0px_#242A20]">
            <Sparkles size={18} strokeWidth={2.5} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
              {completedSummaries.length > 0
                ? 'เคลียร์กล่องทั้งหมดแล้ว ✨'
                : 'ยังไม่มีกล่องแบ่งเงิน'}
            </h4>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-1 max-w-xs mx-auto">
              {completedSummaries.length > 0
                ? 'สร้างกล่องใหม่สำหรับรอบบิลหรือเป้าหมายต่อไปได้เลย'
                : 'แบ่งงบกิน เที่ยว ช้อปปิ้ง ตัดเงินแยกจากกองกลางได้ตามใจชอบ'}
            </p>
          </div>
          <button
            onClick={onOpenCreate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#8B1E43] text-white text-[10px] font-bold rounded-lg border-2 border-[#242A20] shadow-[2px_2px_0px_#242A20] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-transform"
          >
            <Plus size={12} strokeWidth={3} />
            <span>สร้างกล่องใหม่</span>
          </button>
        </div>
      ) : (
        /* Pockets Grid */
        <div className="grid grid-cols-1 gap-2.5">
          {activeSummaries.map((summary, idx) => {
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
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-100 text-red-600 border border-red-500 font-bold">
                            เกินงบ
                          </span>
                        ) : isExhausted ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-500 font-bold">
                            ครบงบ 100%
                          </span>
                        ) : null}
                      </h4>
                      <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                        งบ: {isMasked ? '••••' : `${formatSatang(summary.totalAllocatedSatang ?? pocket.allocatedSatang)}฿`}
                      </p>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-1">
                    {onOpenComplete && (
                      <button
                        onClick={() => onOpenComplete(summary)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md border border-[#242A20] shadow-[1px_1px_0px_#242A20] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all ${
                          isExhausted
                            ? 'bg-[#306230] text-[#9BBC0F] dark:bg-[#9BBC0F] dark:text-[#0F380F]'
                            : 'bg-surfaceElevated-light text-neutral-800 dark:bg-surfaceElevated-dark dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                        }`}
                        title="เคลียร์กล่อง / จบรอบการใช้ (เก็บประวัติไว้)"
                      >
                        <CheckCircle2 size={11} strokeWidth={2.5} />
                        <span>เคลียร์กล่อง</span>
                      </button>
                    )}
                    <button
                      onClick={() => onOpenTopUp(summary)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-[#9BBC0F] text-[#0F380F] border border-[#242A20] shadow-[1px_1px_0px_#242A20] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                      title="เติมเงินเข้ากล่อง"
                    >
                      <PlusCircle size={11} strokeWidth={2.5} />
                      <span>เติมเงิน</span>
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
                      className={`text-xl font-extrabold tracking-tight tabular-nums ${
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
                  <div className="text-[10px] font-medium text-neutral-600 dark:text-neutral-400">
                    ใช้ไป: {isMasked ? '••••' : `${formatSatang(spentSatang)}฿`} ({spentPercentage.toFixed(0)}%)
                  </div>
                </div>

                {/* Retro HP-style Progress Bar */}
                <div className="mt-1.5 w-full h-2.5 rounded-sm bg-neutral-200 dark:bg-neutral-800 border border-[#242A20] dark:border-[#3C4A38] overflow-hidden p-[1px]">
                  <div
                    className="h-full rounded-none transition-all duration-300"
                    style={{
                      width: `${Math.min(spentPercentage, 100)}%`,
                      backgroundColor: isExhausted ? '#306230' : isOverspent ? '#8B1E43' : themeColor,
                    }}
                  />
                </div>

                {/* Quick clear hint if exhausted */}
                {isExhausted && onOpenComplete && (
                  <div className="mt-2 pt-1.5 border-t border-[#242A20]/20 dark:border-[#3C4A38] flex items-center justify-between text-[11px] text-[#306230] dark:text-[#9BBC0F] font-bold">
                    <span>✨ ใช้ครบตามงบ 100% แล้ว</span>
                    <button
                      type="button"
                      onClick={() => onOpenComplete(summary)}
                      className="text-[10px] underline hover:opacity-80"
                    >
                      เคลียร์กล่องเพื่อสร้างใหม่ →
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Completed Pockets Collapsible Archive */}
      {completedSummaries.length > 0 && (
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowCompleted((prev) => !prev)}
            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-surfaceElevated-light dark:bg-surfaceElevated-dark border-2 border-[#242A20]/40 dark:border-[#3C4A38] text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shadow-[2px_2px_0px_#242A20]/20"
          >
            <div className="flex items-center gap-2">
              <Archive size={14} className="text-neutral-500" />
              <span>ประวัติกล่องที่ปิดรอบแล้ว</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold border border-[#242A20]/30">
                {completedSummaries.length} กล่อง
              </span>
            </div>
            <ChevronDown
              size={15}
              className={`transition-transform duration-200 text-neutral-500 ${
                showCompleted ? 'rotate-180' : ''
              }`}
            />
          </button>

          {showCompleted && (
            <div className="mt-2 space-y-2 animate-fade-in">
              {completedSummaries.map((summary) => {
                const { pocket, spentSatang, totalAllocatedSatang } = summary;
                const IconComp = (pocket.icon && POCKET_ICONS[pocket.icon]) || Wallet;
                const completedDateStr = pocket.completedAt
                  ? new Date(pocket.completedAt).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : null;

                return (
                  <div
                    key={pocket.id}
                    className="p-2.5 rounded-xl bg-surface-light dark:bg-surface-dark border-2 border-[#242A20]/30 dark:border-[#3C4A38] opacity-90 shadow-[2px_2px_0px_#242A20]/20 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white/80 border border-[#242A20]/50 shrink-0 opacity-80"
                        style={{ backgroundColor: pocket.color || '#6B7280' }}
                      >
                        <IconComp size={15} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate line-through decoration-neutral-400">
                            {pocket.name}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border border-neutral-300 dark:border-neutral-700 font-medium shrink-0">
                            ปิดรอบแล้ว
                          </span>
                        </div>
                        <p className="text-[10px] text-neutral-500">
                          งบ {formatSatang(totalAllocatedSatang ?? pocket.allocatedSatang)} ฿ · ใช้ไป {formatSatang(spentSatang)} ฿
                          {completedDateStr ? ` · เมื่อ ${completedDateStr}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {onReopenPocket && (
                        <button
                          onClick={() => onReopenPocket(pocket.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-lg bg-surfaceElevated-light dark:bg-surfaceElevated-dark border border-[#242A20]/50 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors shadow-[1px_1px_0px_#242A20]/30"
                          title="เปิดใช้กล่องนี้อีกครั้ง"
                        >
                          <RotateCcw size={11} strokeWidth={2.5} />
                          <span>เปิดใช้ใหม่</span>
                        </button>
                      )}
                      <button
                        onClick={() => onOpenEdit(pocket)}
                        className="p-1 rounded-md text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                        title="แก้ไขหรือลบ"
                      >
                        <MoreHorizontal size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
