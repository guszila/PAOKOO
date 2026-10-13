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
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--theme-chassis-light,#EAE5D9)] dark:bg-[var(--theme-chassis-dark,#141814)] border-t-2 border-[#242A20] dark:border-[#3C4A38] pb-safe shadow-[0_-4px_0px_rgba(0,0,0,0.15)] transition-colors">
      <div className="max-w-md mx-auto grid grid-cols-5 h-16 items-center px-1 relative">
        {/* Tab 1: Overview */}
        <button
          onClick={() => onTabChange('overview')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-all select-none ${
            activeTab === 'overview'
              ? 'text-[#0F380F] dark:text-[#9BBC0F] font-bold'
              : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
          }`}
        >
          <div
            className={`p-1 rounded ${
              activeTab === 'overview'
                ? 'bg-[#9BBC0F] dark:bg-[#283824] border border-[#242A20] shadow-[1.5px_1.5px_0px_#242A20]'
                : ''
            }`}
          >
            <Home size={18} strokeWidth={activeTab === 'overview' ? 2.5 : 2} />
          </div>
          <span className="font-silkscreen text-[9px] mt-0.5">ภาพรวม</span>
        </button>

        {/* Tab 2: Transactions (Log) */}
        <button
          onClick={() => onTabChange('transactions')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-all select-none ${
            activeTab === 'transactions'
              ? 'text-[#0F380F] dark:text-[#9BBC0F] font-bold'
              : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
          }`}
        >
          <div
            className={`p-1 rounded ${
              activeTab === 'transactions'
                ? 'bg-[#9BBC0F] dark:bg-[#283824] border border-[#242A20] shadow-[1.5px_1.5px_0px_#242A20]'
                : ''
            }`}
          >
            <Receipt size={18} strokeWidth={activeTab === 'transactions' ? 2.5 : 2} />
          </div>
          <span className="font-silkscreen text-[9px] mt-0.5">รายการ</span>
        </button>

        {/* Slot 3: Exact Center Floating Action Button (+) - Iconic Game Boy A-Button */}
        <div className="flex items-center justify-center h-full relative">
          <div className="relative -top-4 flex flex-col items-center">
            <button
              onClick={onOpenAdd}
              className="relative w-[54px] h-[54px] rounded-full gb-btn-a text-white flex items-center justify-center border-2 border-[#242A20] dark:border-[#3C4A38] shadow-[3px_3px_0px_#242A20] dark:shadow-[3px_3px_0px_#0A0F0A] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all select-none group"
              aria-label="เพิ่มรายการ (A Button)"
              title="A BUTTON / บันทึกรายการใหม่"
            >
              <Plus
                size={26}
                strokeWidth={3}
                className="transition-transform duration-200 group-hover:rotate-90 group-active:scale-90"
              />
            </button>
            <span className="font-pixel text-[8px] font-bold gb-accent-text mt-1">
              A-BTN
            </span>
          </div>
        </div>

        {/* Tab 4: Analytics (Stats) */}
        <button
          onClick={() => onTabChange('analytics')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-all select-none ${
            activeTab === 'analytics'
              ? 'text-[#0F380F] dark:text-[#9BBC0F] font-bold'
              : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
          }`}
        >
          <div
            className={`p-1 rounded ${
              activeTab === 'analytics'
                ? 'bg-[#9BBC0F] dark:bg-[#283824] border border-[#242A20] shadow-[1.5px_1.5px_0px_#242A20]'
                : ''
            }`}
          >
            <PieChart size={18} strokeWidth={activeTab === 'analytics' ? 2.5 : 2} />
          </div>
          <span className="font-silkscreen text-[9px] mt-0.5">สถิติ</span>
        </button>

        {/* Tab 5: Settings (Options) */}
        <button
          onClick={() => onTabChange('settings')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-all select-none ${
            activeTab === 'settings'
              ? 'text-[#0F380F] dark:text-[#9BBC0F] font-bold'
              : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
          }`}
        >
          <div
            className={`p-1 rounded ${
              activeTab === 'settings'
                ? 'bg-[#9BBC0F] dark:bg-[#283824] border border-[#242A20] shadow-[1.5px_1.5px_0px_#242A20]'
                : ''
            }`}
          >
            <Settings size={18} strokeWidth={activeTab === 'settings' ? 2.5 : 2} />
          </div>
          <span className="font-silkscreen text-[9px] mt-0.5">ตั้งค่า</span>
        </button>
      </div>
    </nav>
  );
};
