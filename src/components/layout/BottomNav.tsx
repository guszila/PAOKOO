import React from 'react';
import { Home, Receipt, Settings, Plus, PieChart } from 'lucide-react';

export type TabType = 'overview' | 'transactions' | 'analytics' | 'settings';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onOpenAdd: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  onOpenAdd,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 pb-safe">
      {/* 3-Part Seamless Background with Upward Curved Arch (Following Circular Button) */}
      <div className="absolute inset-0 flex items-stretch pointer-events-none -top-[18px]">
        {/* Left segment */}
        <div className="flex-1 bg-white/95 dark:bg-[#1C1D22]/95 backdrop-blur-md border-t border-neutral-300 dark:border-neutral-700 mt-[18px]" />

        {/* Center SVG Arch */}
        <div className="w-[108px] h-[82px] relative shrink-0">
          <svg
            className="w-full h-full overflow-visible"
            viewBox="0 0 108 82"
            preserveAspectRatio="none"
          >
            {/* Arch Fill */}
            <path
              d="M 0,18 L 18,18 C 30,18 38,2 54,2 C 70,2 78,18 90,18 L 108,18 L 108,82 L 0,82 Z"
              fill="currentColor"
              className="text-white dark:text-[#1C1D22]"
            />
            {/* Arch Top Border */}
            <path
              d="M 0,18.5 L 18,18.5 C 30,18.5 38,2.5 54,2.5 C 70,2.5 78,18.5 90,18.5 L 108,18.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-neutral-300 dark:text-neutral-700"
            />
          </svg>
        </div>

        {/* Right segment */}
        <div className="flex-1 bg-white/95 dark:bg-[#1C1D22]/95 backdrop-blur-md border-t border-neutral-300 dark:border-neutral-700 mt-[18px]" />
      </div>

      <div className="max-w-md mx-auto grid grid-cols-5 h-16 items-center px-1 relative">
        {/* Tab 1: Overview */}
        <button
          onClick={() => onTabChange('overview')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors select-none ${
            activeTab === 'overview'
              ? 'text-emerald-600 dark:text-emerald-400 font-medium'
              : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
          }`}
        >
          <Home size={19} strokeWidth={activeTab === 'overview' ? 2 : 1.5} />
          <span className="text-[10px] mt-1">ภาพรวม</span>
        </button>

        {/* Tab 2: Transactions */}
        <button
          onClick={() => onTabChange('transactions')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors select-none ${
            activeTab === 'transactions'
              ? 'text-emerald-600 dark:text-emerald-400 font-medium'
              : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
          }`}
        >
          <Receipt size={19} strokeWidth={activeTab === 'transactions' ? 2 : 1.5} />
          <span className="text-[10px] mt-1">รายการ</span>
        </button>

        {/* Slot 3: Exact Center Floating Action Button (+) - Prominent Elevated Design */}
        <div className="flex items-center justify-center h-full relative">
          <div className="relative -top-5">
            {/* Ambient Glow Behind Button */}
            <div className="absolute inset-0 rounded-full bg-emerald-500/30 blur-md transform scale-110 pointer-events-none" />

            <button
              onClick={onOpenAdd}
              className="relative w-[58px] h-[58px] rounded-full bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-[0_10px_25px_-3px_rgba(16,185,129,0.5),0_4px_12px_rgba(0,0,0,0.12)] hover:shadow-[0_14px_30px_-3px_rgba(16,185,129,0.65)] hover:scale-105 active:scale-95 transition-all duration-200 border-[4px] border-surface-light dark:border-surface-dark select-none group"
              aria-label="เพิ่มรายการ"
              title="เพิ่มรายการ"
            >
              <Plus
                size={28}
                strokeWidth={2.75}
                className="transition-transform duration-300 group-hover:rotate-90 group-active:scale-90"
              />
            </button>
          </div>
        </div>

        {/* Tab 4: Analytics */}
        <button
          onClick={() => onTabChange('analytics')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors select-none ${
            activeTab === 'analytics'
              ? 'text-emerald-600 dark:text-emerald-400 font-medium'
              : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
          }`}
        >
          <PieChart size={19} strokeWidth={activeTab === 'analytics' ? 2 : 1.5} />
          <span className="text-[10px] mt-1">วิเคราะห์</span>
        </button>

        {/* Tab 5: Settings */}
        <button
          onClick={() => onTabChange('settings')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors select-none ${
            activeTab === 'settings'
              ? 'text-emerald-600 dark:text-emerald-400 font-medium'
              : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
          }`}
        >
          <Settings size={19} strokeWidth={activeTab === 'settings' ? 2 : 1.5} />
          <span className="text-[10px] mt-1">ตั้งค่า</span>
        </button>
      </div>
    </nav>
  );
};
