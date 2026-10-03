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
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur-md border-t border-border-light dark:border-border-dark pb-safe">
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
