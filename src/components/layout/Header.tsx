import React, { useMemo, useState } from 'react';
import { APP_NAME } from '../../config/app';
import { Clock, Radio } from 'lucide-react';
import { User } from 'firebase/auth';
import { Household } from '../../types/household';
import { TabType } from './BottomNav';

interface HeaderProps {
  user: User | null;
  household: Household | null;
  activeTab: TabType;
  totalTransactions?: number;
  latestDate?: string;
  onOpenAuth: () => void;
  onOpenHousehold: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  household,
  activeTab,
  totalTransactions = 0,
  latestDate,
  onOpenAuth,
  onOpenHousehold,
}) => {
  const [isBouncing, setIsBouncing] = useState(false);

  const handleSyncChipClick = () => {
    if (!user) {
      onOpenAuth();
    } else {
      onOpenHousehold();
    }
  };

  const handleBrandTap = () => {
    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 300);
  };

  // Header content per active tab
  const headerContent = useMemo(() => {
    switch (activeTab) {
      case 'overview':
        return {
          title: APP_NAME,
          subtitle: 'บันทึกรายรับรายจ่าย บัญชีคู่สำหรับ 2 คน',
          pill1: household ? (
            household.isLocked ? 'ซิงค์ 2 คนเรียบร้อย' : 'รอเชื่อมต่อคู่'
          ) : user ? (
            'โหมดบัญชีคู่'
          ) : (
            'ออฟไลน์ (แตะซิงค์)'
          ),
          pill2: latestDate ? `อัปเดต: ${latestDate}` : 'พร้อมใช้งาน',
        };
      case 'transactions':
        return {
          title: 'รายการทั้งหมด',
          subtitle: 'ประวัติเงินเข้า รายจ่าย และยอดเงินให้ยืมทั้งหมด',
          pill1: `${totalTransactions} รายการ`,
          pill2: 'แตะเพื่อแก้ไข',
        };
      case 'analytics':
        return {
          title: 'สถิติและการเงิน',
          subtitle: 'ปฏิทินรายรับ-จ่าย สถิติรายเดือน และสัดส่วนสินทรัพย์',
          pill1: 'ภาพรวมรายเดือน',
          pill2: 'ปฏิทิน & สถิติ',
        };
      case 'settings':
        return {
          title: 'ตั้งค่าระบบ',
          subtitle: 'จัดการสมาชิกบัญชีคู่ หมวดหมู่ และธีมสีตัวเครื่อง',
          pill1: household ? household.name : 'ข้อมูลในเครื่อง',
          pill2: 'การตั้งค่าและซิงค์',
        };
    }
  }, [activeTab, household, user, totalTransactions, latestDate]);

  return (
    <header className="relative gb-header-bg text-white px-4 pt-[max(calc(env(safe-area-inset-top,0px)+16px),44px)] pb-12 transition-all overflow-hidden border-b-4 border-[#242A20] shadow-[0_4px_12px_rgba(0,0,0,0.35)]">
      {/* Subtle Speaker Grill in corner */}
      <div className="absolute top-2 -right-4 w-24 h-24 rounded-full opacity-20 gb-speaker-grill pointer-events-none" />

      <div className="max-w-md mx-auto relative z-10 space-y-2">
        {/* Brand Title Row */}
        <div className="flex items-baseline justify-between">
          {activeTab === 'overview' ? (
            <div
              role="button"
              tabIndex={0}
              onClick={handleBrandTap}
              className={`cursor-pointer select-none group inline-flex items-baseline gap-2 transition-transform ${
                isBouncing ? 'scale-95' : 'hover:scale-[1.01]'
              }`}
              title="PAOKOO"
            >
              <h1 className="text-2xl sm:text-3xl font-black tracking-wider flex items-baseline">
                <span className="text-white drop-shadow-[2px_2px_0px_#181A20]">
                  PAO
                </span>
                <span className="text-[#9BBC0F] ml-0.5 drop-shadow-[2px_2px_0px_#181A20]">
                  KOO
                </span>
              </h1>
            </div>
          ) : (
            <div className="flex items-baseline gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide drop-shadow-[2px_2px_0px_#181A20]">
                {headerContent.title}
              </h1>
            </div>
          )}

          {/* Sync mode indicator */}
          <div className="text-[10px] font-semibold text-neutral-400 flex items-center gap-1">
            <Radio size={10} className="text-[#9BBC0F]" />
            <span>บัญชีคู่</span>
          </div>
        </div>

        <p className="text-[11px] text-neutral-300 font-normal leading-snug">
          {headerContent.subtitle}
        </p>

        {/* Pill tags row (Link Cable chip + Timestamp chip) */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <button
            onClick={handleSyncChipClick}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-[#282A36] hover:bg-[#1E202A] border-2 border-[#242A20] shadow-[2px_2px_0px_#181A20] text-neutral-200 transition-transform active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
          >
            <span
              className={`w-1.5 h-1.5 rounded-sm ${household?.isLocked ? 'bg-[#9BBC0F] shadow-[0_0_4px_#9BBC0F]' : 'bg-amber-400'}`}
            />
            <span>{headerContent.pill1}</span>
          </button>

          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium bg-black/40 border border-white/10 text-neutral-300">
            <Clock size={10} className="opacity-70" />
            <span>{headerContent.pill2}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
