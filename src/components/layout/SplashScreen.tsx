import React, { useEffect, useState, useRef } from 'react';

interface SplashScreenProps {
  isReady?: boolean;
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [hasLanded, setHasLanded] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const hasPlayedAudio = useRef(false);

  // Play iconic 8-bit Game Boy double chime using Web Audio API
  const playRetroChime = () => {
    if (hasPlayedAudio.current) return;
    hasPlayedAudio.current = true;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      // Tone 1: High crisp square wave (1046 Hz - C6)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'square';
      osc1.frequency.setValueAtTime(1046.5, now);
      gain1.gain.setValueAtTime(0.08, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.12);

      // Tone 2: Higher bell chime (2093 Hz - C7)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(2093, now + 0.08);
      gain2.gain.setValueAtTime(0.12, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.35);
    } catch {
      // Audio autoplay policy blocked or not supported - fails silently
    }
  };

  useEffect(() => {
    // 1. Logo drops and lands at 320ms
    const landTimer = setTimeout(() => {
      setHasLanded(true);
      playRetroChime();
    }, 320);

    // 2. Start fade out at 550ms
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 550);

    // 3. Complete and call onFinish at 650ms
    const finishTimer = setTimeout(() => {
      onFinish();
    }, 650);

    return () => {
      clearTimeout(landTimer);
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  // When isReady becomes true or user taps to skip immediately
  const handleQuickSkip = () => {
    setIsFadingOut(true);
    setTimeout(onFinish, 80);
  };

  return (
    <div
      onClick={handleQuickSkip}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center p-4 bg-[#1E231A] select-none transition-opacity duration-150 ease-out cursor-pointer ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      aria-label="Game Boy Boot Screen - แตะเพื่อข้าม"
    >
      {/* Game Boy Console Screen Bezel */}
      <div className="relative w-full max-w-[340px] aspect-[4/3.6] bg-[#8B956D] border-4 border-[#242A20] rounded-2xl shadow-[6px_6px_0px_#0A0F0A] flex flex-col p-3 overflow-hidden">
        {/* Top Bezel: Twin Pinstripes & Text */}
        <div className="flex items-center justify-between px-1 pb-2">
          {/* Left twin stripes */}
          <div className="flex flex-col gap-0.5 w-12">
            <div className="h-[2px] bg-[#8B1E43] rounded-full" />
            <div className="h-[2px] bg-[#1E3A8A] rounded-full" />
          </div>

          <span className="text-[10px] tracking-wider text-[#242A20] font-bold">
            DOT MATRIX WITH STEREO SOUND
          </span>

          {/* Right twin stripes */}
          <div className="flex flex-col gap-0.5 w-12">
            <div className="h-[2px] bg-[#8B1E43] rounded-full" />
            <div className="h-[2px] bg-[#1E3A8A] rounded-full" />
          </div>
        </div>

        {/* LCD Screen Display Window (Classic DMG Olive Green) */}
        <div className="relative flex-1 bg-[#9BBC0F] border-2 border-[#242A20] rounded-lg shadow-inner flex flex-col items-center justify-center overflow-hidden">
          {/* Subtle Scanlines effect */}
          <div
            className="absolute inset-0 pointer-events-none opacity-15"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, #0F380F 0px, #0F380F 1px, transparent 1px, transparent 2px)',
              backgroundSize: '100% 2px',
            }}
          />

          {/* Battery LED on left bezel side */}
          <div className="absolute top-2 left-2 flex items-center gap-1 z-10">
            <span className="w-2 h-2 rounded-full bg-[#8B1E43] shadow-[0_0_4px_#8B1E43] animate-pulse" />
            <span className="text-[9px] text-[#0F380F] font-bold tracking-wider">BATTERY</span>
          </div>

          {/* The Iconic Dropping Logo */}
          <div
            className="relative z-10 flex flex-col items-center justify-center transition-transform duration-300 ease-[cubic-bezier(0.18,0.89,0.32,1.28)]"
            style={{
              transform: hasLanded ? 'translateY(0)' : 'translateY(-120px)',
              opacity: hasLanded ? 1 : 0.8,
            }}
          >
            <div className="flex items-baseline">
              <h1 className="text-3xl sm:text-4xl font-black text-[#0F380F] tracking-widest drop-shadow-[2px_2px_0px_#8BAC0F]">
                PAOKOO
              </h1>
              <span className="text-xs text-[#0F380F] font-black ml-1">
                ®
              </span>
            </div>

            <div
              className={`text-[10px] text-[#306230] font-bold mt-1 tracking-wider transition-opacity duration-150 ${
                hasLanded ? 'opacity-100' : 'opacity-0'
              }`}
            >
              HOUSEHOLD FINANCE · 2026
            </div>
          </div>

          {/* Fast skip hint at bottom */}
          <div className="absolute bottom-1 right-2 text-[9px] font-semibold text-[#306230]/70 tracking-wider">
            TOUCH TO SKIP
          </div>
        </div>
      </div>
    </div>
  );
};
