import React, { useEffect } from 'react';
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
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet Content */}
      <div className="relative w-full max-w-lg mx-auto bg-surface-light dark:bg-surface-dark border-t border-x border-border-light dark:border-border-dark rounded-t-3xl shadow-xl z-10 max-h-[92vh] flex flex-col animate-slide-up">
        {/* Grab Handle */}
        <div className="w-full flex justify-center pt-3 pb-1" onClick={onClose}>
          <div className="w-10 h-1.5 bg-neutral-300 dark:bg-neutral-600 rounded-full cursor-pointer" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border-light dark:border-border-dark">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{title}</h3>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
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
