import React, { useMemo, useState } from 'react';
import { APP_NAME } from '../../config/app';
import { Clock } from 'lucide-react';
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

interface SparkleItem {
  id: number;
  x: number;
  y: number;
  tx: number;
  ty: number;
}

interface TabThemeConfig {
  gradientClass: string;
  glow1Class: string;
  glow2Class: string;
  bead1Class: string;
  bead2Class: string;
  subtitleClass: string;
  pill2Class: string;
}

const TAB_THEMES: Record<TabType, TabThemeConfig> = {
  overview: {
    gradientClass:
      'from-emerald-600 via-emerald-700 to-teal-900 dark:from-emerald-950 dark:via-teal-950 dark:to-neutral-950',
    glow1Class: 'bg-emerald-400/20',
    glow2Class: 'bg-teal-300/15',
    bead1Class: 'bg-emerald-200/80 shadow-[0_0_8px_#6ee7b7]',
    bead2Class: 'bg-teal-200/80',
    subtitleClass: 'text-emerald-100/90 dark:text-emerald-200/80',
    pill2Class: 'text-emerald-100/90',
  },
  transactions: {
    gradientClass:
      'from-blue-600 via-indigo-700 to-slate-900 dark:from-blue-950 dark:via-indigo-950 dark:to-neutral-950',
    glow1Class: 'bg-blue-400/20',
    glow2Class: 'bg-indigo-300/15',
    bead1Class: 'bg-sky-200/80 shadow-[0_0_8px_#7dd3fc]',
    bead2Class: 'bg-blue-200/80',
    subtitleClass: 'text-blue-100/90 dark:text-blue-200/80',
    pill2Class: 'text-blue-100/90',
  },
  analytics: {
    gradientClass:
      'from-violet-600 via-purple-700 to-slate-900 dark:from-purple-950 dark:via-violet-950 dark:to-neutral-950',
    glow1Class: 'bg-purple-400/20',
    glow2Class: 'bg-pink-300/15',
    bead1Class: 'bg-purple-200/80 shadow-[0_0_8px_#d8b4fe]',
    bead2Class: 'bg-pink-200/80',
    subtitleClass: 'text-purple-100/90 dark:text-purple-200/80',
    pill2Class: 'text-purple-100/90',
  },
  settings: {
    gradientClass:
      'from-slate-700 via-neutral-800 to-zinc-950 dark:from-neutral-900 dark:via-slate-950 dark:to-black',
    glow1Class: 'bg-slate-400/20',
    glow2Class: 'bg-zinc-300/15',
    bead1Class: 'bg-amber-200/80 shadow-[0_0_8px_#fde68a]',
    bead2Class: 'bg-neutral-200/80',
    subtitleClass: 'text-slate-200/90 dark:text-neutral-300/80',
    pill2Class: 'text-slate-200/90',
  },
};

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
  const [sparkles, setSparkles] = useState<SparkleItem[]>([]);
  const currentTheme = TAB_THEMES[activeTab] || TAB_THEMES.overview;

  const handleSyncChipClick = () => {
    if (!user) {
      onOpenAuth();
    } else {
      onOpenHousehold();
    }
  };

  const handleBrandTap = () => {
    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 450);

    // Spawn 3 mini celebratory sparkles
    const newSparkles: SparkleItem[] = [
      { id: Date.now() + 1, x: 20, y: 10, tx: -18, ty: -24 },
      { id: Date.now() + 2, x: 60, y: 0, tx: 12, ty: -30 },
      { id: Date.now() + 3, x: 85, y: 25, tx: 22, ty: -16 },
    ];
    setSparkles(newSparkles);
    setTimeout(() => {
      setSparkles([]);
    }, 800);
  };

  // Header content per active tab
  const headerContent = useMemo(() => {
    switch (activeTab) {
      case 'overview':
        return {
          title: APP_NAME,
          subtitle: 'บันทึกรายรับรายจ่าย บัญชีคู่กระเป๋าเดียวกัน',
          pill1: household ? (
            household.isLocked ? 'ซิงค์ 2 คนเรียลไทม์' : 'รอคู่ของคุณ (แตะเพื่อเชื่อม)'
          ) : user ? (
            'เชื่อมต่อบัญชีคู่'
          ) : (
            'โหมดออฟไลน์ (แตะเพื่อซิงค์)'
          ),
          pill2: latestDate ? `อัปเดตล่าสุด: ${latestDate}` : 'พร้อมบันทึกรายการ',
        };
      case 'transactions':
        return {
          title: 'รายการทั้งหมด',
          subtitle: 'ประวัติเงินเข้า รายจ่าย และยอดเงินให้ยืมทั้งหมด',
          pill1: `บันทึกแล้ว ${totalTransactions} รายการ`,
          pill2: 'แตะเพื่อแก้ไขหรือลบ',
        };
      case 'analytics':
        return {
          title: 'วิเคราะห์การเงิน',
          subtitle: 'ปฏิทินรายรับ-จ่าย สถิติรายเดือน และสัดส่วนสินทรัพย์',
          pill1: 'ปฏิทิน & กราฟโดนัท',
          pill2: 'สถิติรายเดือน',
        };
      case 'settings':
        return {
          title: 'ตั้งค่าระบบ',
          subtitle: 'จัดการสมาชิกบัญชีคู่ หมวดหมู่ และสำรองข้อมูล',
          pill1: household ? household.name : 'บัญชีเดี่ยวในเครื่อง',
          pill2: 'สำรอง JSON / CSV',
        };
    }
  }, [activeTab, household, user, totalTransactions, latestDate]);

  return (
    <header className="relative bg-neutral-950 text-white px-5 pt-[max(env(safe-area-inset-top,0px)+18px,48px)] pb-14 transition-all overflow-hidden shadow-sm">
      {/* 4 Multi-Theme Layer Stack with 500ms Smooth Cross-Fade */}
      {(['overview', 'transactions', 'analytics', 'settings'] as TabType[]).map((tab) => {
        const theme = TAB_THEMES[tab];
        const isActive = activeTab === tab;
        return (
          <div
            key={tab}
            className={`absolute inset-0 bg-gradient-to-br ${theme.gradientClass} transition-opacity duration-500 ease-out pointer-events-none ${
              isActive ? 'opacity-100' : 'opacity-0'
            }`}
          />
        );
      })}

      {/* Background ambient concentric rings & glows with smooth kinetic motion */}
      {/* Outer Ring: Slow clockwise rotation + gentle scale breathing */}
      <div className="absolute -top-16 -right-16 w-80 h-80 rounded-full border border-white/10 pointer-events-none animate-ambient-ring-outer">
        {/* Subtle luminous orbital bead along outer rim */}
        <div
          className={`absolute top-1/4 -right-1 w-2.5 h-2.5 rounded-full blur-[1px] transition-all duration-500 ${currentTheme.bead1Class}`}
        />
      </div>

      {/* Middle Ring: Delicate counter-clockwise rotation */}
      <div className="absolute -top-6 -right-6 w-56 h-56 rounded-full border border-dashed border-white/15 pointer-events-none animate-ambient-ring-middle">
        {/* Secondary soft luminous point */}
        <div
          className={`absolute bottom-1/3 -left-1 w-2 h-2 rounded-full blur-[1px] transition-all duration-500 ${currentTheme.bead2Class}`}
        />
      </div>

      {/* Inner Ring: Soft breathing pulse */}
      <div className="absolute top-10 right-10 w-36 h-36 rounded-full border border-white/10 pointer-events-none animate-ambient-ring-inner" />

      {/* Ambient Atmospheric Glows */}
      <div
        className={`absolute -top-10 -right-10 w-64 h-64 rounded-full blur-3xl pointer-events-none animate-ambient-glow transition-all duration-500 ${currentTheme.glow1Class}`}
      />
      <div
        className={`absolute top-28 -left-14 w-48 h-48 rounded-full blur-2xl pointer-events-none animate-ambient-glow transition-all duration-500 ${currentTheme.glow2Class}`}
        style={{ animationDelay: '-6s' }}
      />

      <div className="max-w-md mx-auto relative z-10 space-y-2.5">
        {/* Large Bold Distinctive Title & Subtitle */}
        <div className="pt-2">
          {activeTab === 'overview' ? (
            <div
              role="button"
              tabIndex={0}
              onClick={handleBrandTap}
              className="relative inline-block cursor-pointer select-none group focus:outline-none"
              title="PAOKOO - แตะเพื่อทักทาย ✨"
            >
              <div className="relative inline-flex items-baseline">
                {/* Base Two-Tone Title */}
                <h1
                  className={`font-brand text-3xl sm:text-4xl font-black tracking-tight leading-tight flex items-baseline transition-transform duration-200 ${
                    isBouncing ? 'animate-spring-bounce' : 'group-hover:scale-[1.02]'
                  }`}
                >
                  <span className="text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.3)]">
                    PAO
                  </span>
                  <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-400 bg-clip-text text-transparent drop-shadow-[0_2px_14px_rgba(52,211,153,0.55)]">
                    KOO
                  </span>
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-300 shadow-[0_0_8px_#6ee7b7] ml-1 mb-1 animate-pulse" />
                </h1>

                {/* Pure Text-Glyph Shimmer (Illuminates ONLY the letter glyphs, strictly 0 box) */}
                <div
                  aria-hidden="true"
                  className={`absolute inset-0 pointer-events-none select-none font-brand text-3xl sm:text-4xl font-black tracking-tight leading-tight flex items-baseline transition-transform duration-200 ${
                    isBouncing ? 'animate-spring-bounce' : 'group-hover:scale-[1.02]'
                  }`}
                >
                  <span className="text-glyph-shimmer">
                    PAOKOO
                  </span>
                </div>
              </div>

              {/* Tap sparkles */}
              {sparkles.map((sp) => (
                <span
                  key={sp.id}
                  className="absolute pointer-events-none text-emerald-200 text-sm font-bold animate-sparkle-float select-none"
                  style={
                    {
                      left: `${sp.x}%`,
                      top: `${sp.y}%`,
                      '--tx': `${sp.tx}px`,
                      '--ty': `${sp.ty}px`,
                    } as React.CSSProperties
                  }
                >
                  ✦
                </span>
              ))}
            </div>
          ) : (
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              {headerContent.title}
            </h1>
          )}

          <p className={`text-xs sm:text-sm font-normal mt-1 leading-relaxed transition-colors duration-500 ${currentTheme.subtitleClass}`}>
            {headerContent.subtitle}
          </p>
        </div>

        {/* Pill tags row */}
        <div className="flex items-center gap-2 flex-wrap pt-0.5">
          <button
            onClick={handleSyncChipClick}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-black/25 hover:bg-black/35 border border-white/15 backdrop-blur-md text-white/95 transition-all text-left shadow-sm active:scale-95"
          >
            <span
              className={`w-2 h-2 rounded-full ${household?.isLocked ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}
            />
            <span>{headerContent.pill1}</span>
          </button>

          <div className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-normal bg-black/20 border border-white/10 backdrop-blur-md shadow-sm transition-colors duration-500 ${currentTheme.pill2Class}`}>
            <Clock size={12} className="opacity-80" />
            <span>{headerContent.pill2}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

