import React, { useEffect, useState } from 'react';
import { ShieldCheck, Sparkles } from 'lucide-react';

interface SplashScreenProps {
  isReady: boolean;
  onFinish: () => void;
  minDurationMs?: number;
  maxTimeoutMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  isReady,
  onFinish,
  minDurationMs = 850,
  maxTimeoutMs = 1500,
}) => {
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    // Smooth progress simulation: 15% -> 60% -> 90% -> 100%
    const p1 = setTimeout(() => setProgress(55), 200);
    const p2 = setTimeout(() => setProgress(85), 500);

    const minTimer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, minDurationMs);

    // Hard fallback timeout: guarantees splash screen exits even if network lags
    const maxTimer = setTimeout(() => {
      setProgress(100);
      setIsFadingOut(true);
    }, maxTimeoutMs);

    return () => {
      clearTimeout(p1);
      clearTimeout(p2);
      clearTimeout(minTimer);
      clearTimeout(maxTimer);
    };
  }, [minDurationMs, maxTimeoutMs]);

  useEffect(() => {
    if (minTimeElapsed && isReady && !isFadingOut) {
      setProgress(100);
      setIsFadingOut(true);
    }
  }, [minTimeElapsed, isReady, isFadingOut]);

  useEffect(() => {
    if (isFadingOut) {
      const finishTimer = setTimeout(() => {
        onFinish();
      }, 500); // 500ms matching transition-all duration-500
      return () => clearTimeout(finishTimer);
    }
  }, [isFadingOut, onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between px-6 py-10 bg-[#070b10] text-white select-none transition-all duration-500 ease-out ${
        isFadingOut ? 'opacity-0 scale-[1.04] pointer-events-none' : 'opacity-100 scale-100'
      }`}
      aria-label="กำลังโหลดเข้าสู่แอพ PAOKOO"
    >
      {/* Background Ambient Radial Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Central emerald aura */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] bg-emerald-500/15 rounded-full blur-[90px] animate-pulse" />
        {/* Subtle teal secondary ambient */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] bg-teal-400/10 rounded-full blur-[70px]" />
        {/* Decorative concentric rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] rounded-full border border-white/[0.04] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full border border-white/[0.02] pointer-events-none" />
      </div>

      {/* Top spacer to balance layout */}
      <div className="w-full flex justify-end items-center opacity-60">
        <span className="text-[10px] text-emerald-400/70 font-mono tracking-widest uppercase flex items-center gap-1">
          <Sparkles size={11} className="animate-spin text-emerald-400" />
          <span>v0.1.0 PWA</span>
        </span>
      </div>

      {/* Main Center Content: Brand Logo & Typography */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-4 my-auto">
        {/* Outer Glowing Badge Accent */}
        <div className="relative inline-flex items-baseline">
          {/* Base Two-Tone Title */}
          <h1 className="font-brand text-5xl sm:text-6xl font-black tracking-tight leading-none flex items-baseline drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
            <span className="text-white drop-shadow-[0_2px_12px_rgba(255,255,255,0.35)]">
              PAO
            </span>
            <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-400 bg-clip-text text-transparent drop-shadow-[0_2px_20px_rgba(52,211,153,0.7)]">
              KOO
            </span>
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399] ml-1.5 mb-1.5 animate-pulse" />
          </h1>

          {/* Text Shimmer Effect sweeping across letters */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none select-none font-brand text-5xl sm:text-6xl font-black tracking-tight leading-none flex items-baseline bg-gradient-to-r from-transparent via-white/40 to-transparent bg-clip-text text-transparent animate-shimmer-pass"
          >
            <span>PAOKOO</span>
          </div>
        </div>

        {/* Tagline */}
        <p className="text-xs sm:text-sm text-neutral-400 font-medium tracking-wide">
          บันทึกรายรับรายจ่าย บัญชีคู่กระเป๋าเดียวกัน
        </p>

        {/* High-tech Micro Progress Bar */}
        <div className="w-36 h-1 bg-neutral-800/80 rounded-full overflow-hidden mt-6 shadow-inner relative">
          <div
            className="h-full bg-gradient-to-r from-teal-400 via-emerald-400 to-emerald-300 rounded-full transition-all duration-300 ease-out shadow-[0_0_10px_#10b981]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Bottom Footer Info */}
      <div className="relative z-10 flex flex-col items-center gap-1.5 text-center">
        <div className="flex items-center gap-1.5 text-[11px] text-neutral-400/90 font-medium">
          <ShieldCheck size={13} className="text-emerald-400 shrink-0" />
          <span>ระบบปลอดภัยระดับสูง • ออฟไลน์ & ซิงค์เรียลไทม์</span>
        </div>
        <p className="text-[10px] text-neutral-500/70 tracking-wider">
          HOUSEHOLD FINANCE PLATFORM
        </p>
      </div>
    </div>
  );
};
