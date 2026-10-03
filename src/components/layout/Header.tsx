import React, { useMemo } from 'react';
import { APP_NAME } from '../../config/app';
import { Sun, Moon, Users, Receipt, PieChart, Settings, Clock, Sparkles } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
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
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    if (theme === 'dark') setTheme('light');
    else setTheme('dark');
  };

  const handleSyncChipClick = () => {
    if (!user) {
      onOpenAuth();
    } else {
      onOpenHousehold();
    }
  };

  // Header content per active tab matching the Image 2 reference style
  const headerContent = useMemo(() => {
    switch (activeTab) {
      case 'overview':
        return {
          icon: (
            <img
              src="/paokoo-logo-dark.svg"
              alt="PAOKOO Logo"
              className="w-7 h-7 object-contain drop-shadow"
            />
          ),
          title: APP_NAME,
          subtitle: 'บันทึกรายรับรายจ่าย บัญชีคู่ของเรา',
          pill1: household ? (
            household.isLocked ? 'ซิงค์ 2 คนเรียลไทม์' : 'รอคู่ของคุณ (1/2)'
          ) : user ? (
            'แตะเพื่อเชื่อมต่อบัญชีคู่'
          ) : (
            'โหมดในเครื่อง (แตะเพื่อซิงค์)'
          ),
          pill2: latestDate ? `อัปเดตล่าสุด: ${latestDate}` : 'พร้อมใช้งาน',
        };
      case 'transactions':
        return {
          icon: <Receipt size={22} className="text-white" strokeWidth={1.5} />,
          title: 'รายการทั้งหมด',
          subtitle: 'ประวัติเงินเข้า รายจ่าย และยอดเงินให้ยืม',
          pill1: `บันทึกทั้งหมด ${totalTransactions} รายการ`,
          pill2: 'แตะรายการเพื่อแก้ไข/ลบ',
        };
      case 'analytics':
        return {
          icon: <PieChart size={22} className="text-white" strokeWidth={1.5} />,
          title: 'วิเคราะห์การเงิน',
          subtitle: 'สัดส่วนสินทรัพย์ กระแสเงินสด และรายจ่ายตามหมวด',
          pill1: 'สัดส่วน Donut Chart',
          pill2: 'สถิติรายเดือน',
        };
      case 'settings':
        return {
          icon: <Settings size={22} className="text-white" strokeWidth={1.5} />,
          title: 'ตั้งค่าระบบ',
          subtitle: 'จัดการสมาชิกบัญชีคู่ หมวดหมู่ และสำรองข้อมูล',
          pill1: household ? household.name : 'บัญชีเดี่ยว',
          pill2: 'สำรอง JSON / CSV',
        };
    }
  }, [activeTab, household, user, totalTransactions, latestDate]);

  return (
    <header className="relative bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 dark:from-emerald-950 dark:via-teal-950 dark:to-neutral-900 text-white px-5 pt-[max(env(safe-area-inset-top,0px)+12px,52px)] pb-14 transition-all overflow-hidden">
      {/* Background ambient decorative shapes */}
      <div className="absolute -top-10 -right-10 w-56 h-56 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-20 -left-12 w-48 h-48 bg-teal-300/10 rounded-full blur-2xl pointer-events-none" />

      <div className="max-w-md mx-auto relative z-10">
        {/* Top bar: Action icons (pushed to the right, safely away from Dynamic Island) */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-xs text-emerald-200/90 font-medium">
            <Sparkles size={13} />
            <span>PAOKOO Financial</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncChipClick}
              className="h-8 px-2.5 rounded-full flex items-center gap-1.5 text-xs text-white/90 bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-md transition-all active:scale-95"
              title="จัดการบัญชีคู่"
            >
              <Users size={14} strokeWidth={1.5} />
              <span className="text-[11px] font-medium hidden sm:inline">
                {household ? 'บัญชีคู่' : 'เชื่อมต่อ'}
              </span>
            </button>

            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/90 bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-md transition-all active:scale-95"
              title="สลับธีม สว่าง/มืด"
              aria-label="สลับธีม สว่าง/มืด"
            >
              {theme === 'dark' ? <Sun size={15} strokeWidth={1.5} /> : <Moon size={15} strokeWidth={1.5} />}
            </button>
          </div>
        </div>

        {/* Dynamic Island Safe Content Area (Matching Reference Image 2) */}
        <div className="space-y-2.5">
          {/* Badge icon in rounded box */}
          <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center shadow-inner">
            {headerContent.icon}
          </div>

          {/* Large Bold Title */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              {headerContent.title}
            </h1>
            <p className="text-xs text-emerald-100/85 font-normal mt-1 leading-relaxed">
              {headerContent.subtitle}
            </p>
          </div>

          {/* Pill tags row (Matching reference image badges) */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <button
              onClick={handleSyncChipClick}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-black/20 hover:bg-black/30 border border-white/15 backdrop-blur-sm text-white/95 transition-all text-left"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${household?.isLocked ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span>{headerContent.pill1}</span>
            </button>

            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-normal bg-black/15 border border-white/10 backdrop-blur-sm text-emerald-100/90">
              <Clock size={11} className="opacity-80" />
              <span>{headerContent.pill2}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
