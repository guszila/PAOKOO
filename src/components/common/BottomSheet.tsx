import React, { useEffect, useState, useRef } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  // Whether the sheet is mounted in the DOM
  const [isMounted, setIsMounted] = useState(isOpen);
  // Whether the sheet is visually visible in viewport (controls CSS transition)
  const [isVisible, setIsVisible] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const touchDeltaY = useRef<number>(0);
  const [dragOffset, setDragOffset] = useState(0);

  useEffect(() => {
    let animFrame: number;
    let timer: NodeJS.Timeout;

    if (isOpen) {
      setIsMounted(true);
      document.body.style.overflow = 'hidden';
      // Wait for next animation frame to trigger smooth entry transition
      animFrame = requestAnimationFrame(() => {
        setIsVisible(true);
      });
    } else {
      // Trigger smooth exit transition
      setIsVisible(false);
      timer = setTimeout(() => {
        setIsMounted(false);
        setDragOffset(0);
        document.body.style.overflow = '';
      }, 260);
    }

    return () => {
      if (animFrame) cancelAnimationFrame(animFrame);
      if (timer) clearTimeout(timer);
    };
  }, [isOpen]);

  // Touch gesture to swipe down to close
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchDeltaY.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;
    if (diff > 0) {
      touchDeltaY.current = diff;
      setDragOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    if (touchDeltaY.current > 70) {
      onClose();
    } else {
      setDragOffset(0);
    }
    touchStartY.current = null;
    touchDeltaY.current = 0;
  };

  if (!isMounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop with smooth CSS fade transition */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity duration-[260ms] ease-out ${
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sheet Content with smooth hardware-accelerated transform transition */}
      <div
        style={{
          transform:
            dragOffset > 0
              ? `translateY(${dragOffset}px)`
              : isVisible
              ? 'translateY(0%)'
              : 'translateY(100%)',
          transition:
            dragOffset > 0
              ? 'none'
              : 'transform 260ms cubic-bezier(0.32, 0.72, 0, 1)',
        }}
        className="relative w-full max-w-lg mx-auto bg-surface-light dark:bg-surface-dark border-t border-x border-border-light dark:border-border-dark rounded-t-3xl shadow-2xl z-10 max-h-[92vh] flex flex-col will-change-transform"
      >
        {/* Grab Handle */}
        <div
          className="w-full flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing touch-none select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={onClose}
        >
          <div className="w-10 h-1.5 bg-neutral-300 dark:bg-neutral-600 rounded-full hover:bg-neutral-400 dark:hover:bg-neutral-500 transition-colors" />
        </div>

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3 border-b border-border-light dark:border-border-dark touch-none select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{title}</h3>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            className="w-9 h-9 flex items-center justify-center rounded-full text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors active:scale-90"
            aria-label="ปิด"
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto px-5 py-4 pb-safe flex-1 space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
};
