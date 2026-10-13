import React, { useState, useEffect } from 'react';
import { triggerCoinShower } from '../../lib/celebration';

interface PixelMascotProps {
  currentBalance: number;
  thisMonthNet: number;
  className?: string;
}

type MascotType = 'piggy' | 'cat';

const HAPPY_QUOTES = [
  'เป๋าตุงมากเลย! ✨',
  'เก็บเงินเก่งที่สุด 💖',
  'คู่เราประหยัดสุดๆ 🐷',
  'รวยไปด้วยกัน เย่! 🎉',
  'อดออมวันละนิดนะ ✨',
  'เงินเก็บพุ่งขึ้นแล้ว! 🚀',
];

const WORRIED_QUOTES = [
  'ใจเย็นๆ น้าา 🥺',
  'พักช้อปปิ้งแป๊บนึง 💸',
  'สู้ๆ ไปด้วยกันนะ 💪',
  'ค่อยๆ วางแผนใหม่นะ ✌️',
];

export const PixelMascot: React.FC<PixelMascotProps> = ({
  thisMonthNet,
  className = '',
}) => {
  const [mascotType, setMascotType] = useState<MascotType>(() => {
    return (localStorage.getItem('paokoo_mascot_type') as MascotType) || 'piggy';
  });
  const [isBouncing, setIsBouncing] = useState(false);
  const [bubbleText, setBubbleText] = useState<string | null>(null);
  const [bubbleTimer, setBubbleTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const isWorried = thisMonthNet < 0;

  // Toggle or cheer when tapped
  const handleTap = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Trigger bounce
    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 500);

    // Haptic if enabled
    if (
      typeof window !== 'undefined' &&
      localStorage.getItem('paokoo_haptic_enabled') !== 'false' &&
      navigator.vibrate
    ) {
      navigator.vibrate([15, 30, 25]);
    }

    // Trigger celebratory coin shower
    triggerCoinShower();

    // Pick speech quote
    const pool = isWorried ? WORRIED_QUOTES : HAPPY_QUOTES;
    const randomQuote = pool[Math.floor(Math.random() * pool.length)];
    setBubbleText(randomQuote);

    if (bubbleTimer) clearTimeout(bubbleTimer);
    const timer = setTimeout(() => {
      setBubbleText(null);
    }, 2800);
    setBubbleTimer(timer);
  };

  // Double click / Long press or helper to toggle pet
  const handleTogglePet = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = mascotType === 'piggy' ? 'cat' : 'piggy';
    setMascotType(next);
    localStorage.setItem('paokoo_mascot_type', next);
    setBubbleText(next === 'piggy' ? 'น้องหมูมาแล้ว! 🐷' : 'เหมียวนำโชคมาแล้ว! 🐱');
    if (bubbleTimer) clearTimeout(bubbleTimer);
    const timer = setTimeout(() => setBubbleText(null), 2500);
    setBubbleTimer(timer);
  };

  useEffect(() => {
    return () => {
      if (bubbleTimer) clearTimeout(bubbleTimer);
    };
  }, [bubbleTimer]);

  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      {/* 8-Bit Pixel Speech Bubble */}
      {bubbleText && (
        <div className="absolute -top-7 right-0 z-30 pointer-events-none animate-fade-in whitespace-nowrap">
          <div className="relative px-2 py-0.5 bg-white text-[#242A20] text-[9px] font-bold rounded-lg border-2 border-[#242A20] shadow-[2px_2px_0px_#242A20]">
            {bubbleText}
            {/* Bubble arrow tip */}
            <div className="absolute -bottom-1 right-5 w-1.5 h-1.5 bg-white border-r-2 border-b-2 border-[#242A20] rotate-45" />
          </div>
        </div>
      )}

      {/* Mascot Avatar Button */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleTap}
        onContextMenu={(e) => {
          e.preventDefault();
          handleTogglePet(e);
        }}
        className={`group cursor-pointer transition-transform duration-200 active:scale-90 ${
          isBouncing ? 'animate-bounce' : 'hover:scale-105'
        }`}
        title="แตะเพื่อให้น้องเด้งดุ๊กดิ๊ก! (คลิกขวาเพื่อสลับหมู/แมว)"
      >
        {mascotType === 'piggy' ? (
          <PiggySvg isWorried={isWorried} />
        ) : (
          <CatSvg isWorried={isWorried} />
        )}
      </div>

      {/* Mini switch hint on hover / touch */}
      <button
        type="button"
        onClick={handleTogglePet}
        className="mt-0.5 text-[8.5px] font-bold text-[#0F380F]/70 dark:text-[#9BBC0F]/80 hover:text-[#0F380F] dark:hover:text-[#9BBC0F] opacity-70 hover:opacity-100 transition-opacity"
        title="สลับสัตว์เลี้ยง (หมู ↔ แมว)"
      >
        {mascotType === 'piggy' ? '🐷 หมูเป๋า' : '🐱 แมวกวัก'}
      </button>
    </div>
  );
};

/* -------------------------------------------------------------
 * 1. Pixel Art Piggy Bank (8-Bit น้องหมูออมสิน)
 * Grid: 28 x 28 pixels
 * ------------------------------------------------------------- */
const PiggySvg: React.FC<{ isWorried: boolean }> = ({ isWorried }) => {
  return (
    <svg
      viewBox="0 0 28 28"
      className="w-12 h-12 sm:w-14 sm:h-14 drop-shadow-[2px_2px_0px_rgba(0,0,0,0.3)]"
      style={{ shapeRendering: 'crispEdges' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Ears */}
      {/* Left Ear */}
      <rect x="4" y="5" width="4" height="4" fill="#242A20" />
      <rect x="5" y="6" width="3" height="3" fill="#EC4899" />
      <rect x="6" y="7" width="1" height="1" fill="#F472B6" />

      {/* Right Ear */}
      <rect x="20" y="5" width="4" height="4" fill="#242A20" />
      <rect x="20" y="6" width="3" height="3" fill="#EC4899" />
      <rect x="21" y="7" width="1" height="1" fill="#F472B6" />

      {/* Main Head / Body Outline */}
      <rect x="6" y="8" width="16" height="15" fill="#242A20" />
      <rect x="4" y="10" width="20" height="11" fill="#242A20" />

      {/* Body Base Fill (Soft Pig Pink) */}
      <rect x="6" y="9" width="16" height="13" fill="#F472B6" />
      <rect x="5" y="11" width="18" height="9" fill="#F472B6" />
      {/* Top highlight */}
      <rect x="7" y="9" width="14" height="2" fill="#FBCFE8" />

      {/* Blushing Cheeks */}
      <rect x="5" y="15" width="3" height="2" fill="#FB7185" />
      <rect x="20" y="15" width="3" height="2" fill="#FB7185" />

      {/* Eyes */}
      {isWorried ? (
        <>
          {/* Worried Eyes (o o) */}
          <rect x="8" y="12" width="2" height="3" fill="#242A20" />
          <rect x="18" y="12" width="2" height="3" fill="#242A20" />
          {/* Sweat drop on forehead */}
          <rect x="20" y="7" width="2" height="3" fill="#38BDF8" />
          <rect x="21" y="6" width="1" height="1" fill="#BAE6FD" />
        </>
      ) : (
        <>
          {/* Happy / Smiling Eyes (^^) */}
          <rect x="8" y="13" width="3" height="1" fill="#242A20" />
          <rect x="7" y="14" width="1" height="1" fill="#242A20" />
          <rect x="11" y="14" width="1" height="1" fill="#242A20" />

          <rect x="17" y="13" width="3" height="1" fill="#242A20" />
          <rect x="16" y="14" width="1" height="1" fill="#242A20" />
          <rect x="20" y="14" width="1" height="1" fill="#242A20" />
        </>
      )}

      {/* Snout (จมูกหมู) */}
      <rect x="10" y="14" width="8" height="5" fill="#242A20" />
      <rect x="11" y="15" width="6" height="3" fill="#EC4899" />
      {/* Nostrils */}
      <rect x="12" y="16" width="1" height="1" fill="#831843" />
      <rect x="15" y="16" width="1" height="1" fill="#831843" />

      {/* Feet / Trotters */}
      <rect x="7" y="22" width="4" height="3" fill="#242A20" />
      <rect x="8" y="22" width="2" height="2" fill="#EC4899" />

      <rect x="17" y="22" width="4" height="3" fill="#242A20" />
      <rect x="18" y="22" width="2" height="2" fill="#EC4899" />

      {/* Shiny Coin on top or held in belly */}
      {!isWorried && (
        <>
          {/* Golden Coin Slot / Top Coin */}
          <rect x="12" y="2" width="4" height="5" fill="#242A20" />
          <rect x="13" y="3" width="2" height="3" fill="#F59E0B" />
          <rect x="13" y="3" width="1" height="2" fill="#FDE047" />

          {/* Tiny sparkle */}
          <rect x="23" y="11" width="2" height="2" fill="#FEF08A" />
          <rect x="24" y="10" width="1" height="4" fill="#FBBF24" />
          <rect x="22" y="12" width="4" height="1" fill="#FBBF24" />
        </>
      )}
    </svg>
  );
};

/* -------------------------------------------------------------
 * 2. Pixel Art Lucky Cat (8-Bit น้องแมวกวัก)
 * Grid: 28 x 28 pixels
 * ------------------------------------------------------------- */
const CatSvg: React.FC<{ isWorried: boolean }> = ({ isWorried }) => {
  return (
    <svg
      viewBox="0 0 28 28"
      className="w-12 h-12 sm:w-14 sm:h-14 drop-shadow-[2px_2px_0px_rgba(0,0,0,0.3)]"
      style={{ shapeRendering: 'crispEdges' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Ears */}
      {/* Left Ear */}
      <rect x="5" y="4" width="4" height="5" fill="#242A20" />
      <rect x="6" y="5" width="2" height="3" fill="#F472B6" />

      {/* Right Ear */}
      <rect x="19" y="4" width="4" height="5" fill="#242A20" />
      <rect x="20" y="5" width="2" height="3" fill="#F472B6" />

      {/* Head / Body Outline */}
      <rect x="6" y="7" width="16" height="15" fill="#242A20" />
      <rect x="5" y="9" width="18" height="12" fill="#242A20" />

      {/* Body Fill (White / Cream Lucky Cat) */}
      <rect x="7" y="8" width="14" height="13" fill="#FFFDF7" />
      <rect x="6" y="10" width="16" height="10" fill="#FFFDF7" />

      {/* Calico Orange Patch on Ear */}
      <rect x="18" y="7" width="3" height="4" fill="#F97316" />

      {/* Cheeks */}
      <rect x="6" y="15" width="2" height="1" fill="#FB7185" />
      <rect x="20" y="15" width="2" height="1" fill="#FB7185" />

      {/* Whiskers */}
      <rect x="3" y="14" width="2" height="1" fill="#242A20" />
      <rect x="3" y="16" width="2" height="1" fill="#242A20" />
      <rect x="23" y="14" width="2" height="1" fill="#242A20" />
      <rect x="23" y="16" width="2" height="1" fill="#242A20" />

      {/* Eyes */}
      {isWorried ? (
        <>
          <rect x="9" y="12" width="2" height="3" fill="#242A20" />
          <rect x="17" y="12" width="2" height="3" fill="#242A20" />
          {/* Sweat drop */}
          <rect x="20" y="8" width="2" height="3" fill="#38BDF8" />
        </>
      ) : (
        <>
          {/* Smiling Curved Eyes (w) */}
          <rect x="8" y="13" width="3" height="1" fill="#242A20" />
          <rect x="8" y="14" width="1" height="1" fill="#242A20" />
          <rect x="10" y="14" width="1" height="1" fill="#242A20" />

          {/* Wink on right eye */}
          <rect x="17" y="13" width="3" height="1" fill="#242A20" />
          <rect x="18" y="12" width="1" height="1" fill="#242A20" />
        </>
      )}

      {/* Nose & Mouth (w) */}
      <rect x="13" y="14" width="2" height="1" fill="#F472B6" />
      <rect x="12" y="16" width="1" height="1" fill="#242A20" />
      <rect x="13" y="15" width="2" height="1" fill="#242A20" />
      <rect x="15" y="16" width="1" height="1" fill="#242A20" />

      {/* Red Collar & Gold Bell */}
      <rect x="8" y="19" width="12" height="2" fill="#EF4444" />
      <rect x="13" y="20" width="2" height="2" fill="#F59E0B" />
      <rect x="13" y="21" width="1" height="1" fill="#FEF08A" />

      {/* Waving Paw (Left paw raised high) */}
      <rect x="21" y="9" width="3" height="5" fill="#242A20" />
      <rect x="21" y="10" width="2" height="3" fill="#FFFDF7" />
      <rect x="21" y="10" width="2" height="1" fill="#F472B6" />

      {/* Feet */}
      <rect x="8" y="22" width="3" height="2" fill="#242A20" />
      <rect x="8" y="22" width="2" height="1" fill="#FFFDF7" />

      <rect x="17" y="22" width="3" height="2" fill="#242A20" />
      <rect x="18" y="22" width="2" height="1" fill="#FFFDF7" />
    </svg>
  );
};
