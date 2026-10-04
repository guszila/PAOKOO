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
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setIsClosing(false);
      setDragOffset(0);
      document.body.style.overflow = 'hidden';
    } else if (isRendered && !isClosing) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setIsRendered(false);
        setIsClosing(false);
        document.body.style.overflow = '';
      }, 240);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isRendered, isClosing]);

  const handleStartClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsRendered(false);
      setIsClosing(false);
      document.body.style.overflow = '';
    }, 240);
  };

  // Touch gesture to swipe down to close
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;
    if (diff > 0) {
      setDragOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    if (dragOffset > 75) {
      handleStartClose();
    } else {
      setDragOffset(0);
    }
    touchStartY.current = null;
  };

  if (!isRendered) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop with fade-in and fade-out */}
      <div
        className={`fixed inset-0 bg-black/45 backdrop-blur-[2px] transition-opacity ${
          isClosing ? 'animate-fade-out' : 'animate-fade-in'
        }`}
        onClick={handleStartClose}
      />

      {/* Sheet Content with slide-up and slide-down */}
      <div
        style={{
          transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
          transition: dragOffset > 0 ? 'none' : undefined,
        }}
        className={`relative w-full max-w-lg mx-auto bg-surface-light dark:bg-surface-dark border-t border-x border-border-light dark:border-border-dark rounded-t-3xl shadow-2xl z-10 max-h-[92vh] flex flex-col ${
          isClosing ? 'animate-slide-down' : 'animate-slide-up'
        }`}
      >
        {/* Grab Handle */}
        <div
          className="w-full flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing touch-none select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleStartClose}
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
            onClick={handleStartClose}
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
